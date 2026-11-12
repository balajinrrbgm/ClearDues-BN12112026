import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { aiConfigured, analyzeEvidence } from "./ai.js";
import {
  initializeLedger,
  clearLatestAnalysis,
  insertEvidence,
  readEvidence,
  readLatestAnalysis,
  readPaypalInvoice,
  saveLatestAnalysis,
  savePaypalInvoice,
} from "./ledger.js";
import { evidenceInputSchema, hasExplicitConfirmation, invoiceInputSchema, makeId } from "./domain.js";
import { createSandboxInvoice, getSandboxInvoice, paypalConfigured, sendSandboxInvoice } from "./paypal.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use("/api/analyze", rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_request, response) => {
  response.json({ mode: "sandbox", aiConfigured: aiConfigured(), paypalConfigured: paypalConfigured() });
});

app.get("/api/case", async (_request, response) => {
  response.json({
    invoice: {
      number: "CD-1042",
      recipientName: "Northstar Studio (synthetic)",
      recipientEmail: "northstar@example.test",
      amount: "2400.00",
      currency: "USD",
      dueDate: "2026-10-24",
      status: "Overdue · demo record",
    },
    evidence: await readEvidence(),
  });
});

app.post("/api/evidence", async (request, response) => {
  const parsed = evidenceInputSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Enter 12 to 5,000 characters of source text." });
  const item = {
    id: makeId(),
    kind: "correspondence" as const,
    title: "Added correspondence",
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  };
  await insertEvidence(item);
  await clearLatestAnalysis();
  return response.status(201).json(item);
});

app.post("/api/analyze", async (_request, response) => {
  try {
    const result = await analyzeEvidence(await readEvidence());
    await saveLatestAnalysis(result);
    response.json(result);
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "AI analysis failed." });
  }
});

app.post("/api/paypal/invoices", async (request, response) => {
  const parsed = invoiceInputSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Review the recipient, amount, currency, and due date." });
  if (!paypalConfigured()) return response.status(503).json({ error: "PayPal Sandbox credentials are not configured; no invoice was created." });
  try {
    const result = await createSandboxInvoice(parsed.data) as { id?: unknown; status?: unknown };
    if (typeof result.id === "string") {
      await savePaypalInvoice({ id: result.id, status: typeof result.status === "string" ? result.status : "DRAFT" });
    }
    response.status(201).json(result);
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "Sandbox invoice creation failed." });
  }
});

app.get("/api/paypal/invoices/:id", async (request, response) => {
  if (!paypalConfigured()) return response.status(503).json({ error: "PayPal Sandbox is not configured." });
  try {
    const result = await getSandboxInvoice(request.params.id) as { id?: unknown; status?: unknown };
    if (typeof result.status === "string") {
      await savePaypalInvoice({ id: request.params.id, status: result.status });
    }
    response.json(result);
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "Could not retrieve invoice." });
  }
});

app.post("/api/paypal/invoices/:id/send", async (request, response) => {
  if (!hasExplicitConfirmation(request.body)) return response.status(400).json({ error: "Explicit confirmation is required." });
  if (!paypalConfigured()) return response.status(503).json({ error: "PayPal Sandbox is not configured; no invoice was sent." });
  try {
    const result = await sendSandboxInvoice(request.params.id) as { status?: unknown };
    await savePaypalInvoice({ id: request.params.id, status: typeof result.status === "string" ? result.status : "SENT" });
    response.json(result);
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "Could not send invoice." });
  }
});

app.get("/api/export.json", async (_request, response) => {
  response.setHeader("Content-Disposition", 'attachment; filename="cleardues-evidence.json"');
  response.json({
    mode: "synthetic demo / PayPal Sandbox only",
    exportedAt: new Date().toISOString(),
    evidence: await readEvidence(),
    latestAnalysis: await readLatestAnalysis() ?? null,
    paypalInvoice: await readPaypalInvoice() ?? null,
  });
});

app.get("/api/export.pdf", async (_request, response) => {
  const [paypalInvoice, analysis, evidence] = await Promise.all([readPaypalInvoice(), readLatestAnalysis(), readEvidence()]);
  const document = new PDFDocument({ margin: 52 });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(chunk));
  document.on("end", () => {
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", 'attachment; filename="cleardues-evidence.pdf"');
    response.end(Buffer.concat(chunks));
  });
  document.fontSize(22).fillColor("#173d31").text("ClearDues evidence packet");
  document.moveDown(0.4).fontSize(10).fillColor("#68736d").text("Synthetic demo data | PayPal Sandbox only | For internal review, not legal advice");
  document.moveDown(0.4).fontSize(10).fillColor("#202925").text(
    paypalInvoice ? `PayPal Sandbox invoice: ${paypalInvoice.id} · ${paypalInvoice.status}` : "PayPal Sandbox invoice: none created",
  );
  document.moveDown(0.4).fontSize(10).fillColor("#202925").text(
    analysis ? `AI review mode: ${analysis.mode} · ${analysis.summary}` : "AI review: none recorded",
  );
  if (analysis) {
    for (const claim of analysis.claims) {
      document.moveDown(0.3).fontSize(9).fillColor("#40584a").text(`${claim.text} [${claim.sourceId}]`);
      document.fontSize(9).fillColor("#68736d").text(`Source quote: “${claim.quote}”`);
    }
  }
  document.moveDown(1);
  for (const item of evidence) {
    document.fontSize(13).fillColor("#173d31").text(item.title);
    document.fontSize(9).fillColor("#68736d").text(`${item.kind} · ${item.createdAt} · ${item.id}`);
    document.moveDown(0.35).fontSize(11).fillColor("#202925").text(item.text, { lineGap: 3 });
    document.moveDown(1);
  }
  document.end();
});

const buildDirectory = resolve(process.cwd(), "dist");
if (existsSync(buildDirectory)) app.use(express.static(buildDirectory));

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
  response.status(500).json({ error: "Unexpected server error." });
});

await initializeLedger();
if (!process.env.VERCEL) {
  const host = process.env.HOST || "127.0.0.1";
  const port = Number(process.env.PORT || 3001);
  app.listen(port, host, () => console.log(`ClearDues API listening on http://${host}:${port}`));
}

export default app;