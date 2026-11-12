import pptxgen from "pptxgenjs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "ClearDues contributors";
pptx.subject = "Evidence-backed invoice follow-up prototype";
pptx.title = "ClearDues";
pptx.company = "ClearDues";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineSlideMaster({
  title: "BASE",
  background: { color: "F2F5EF" },
  objects: [
    { rect: { x: 0.65, y: 7.08, w: 12.0, h: 0.01, line: { color: "DCE6DC", transparency: 100 }, fill: { color: "DCE6DC" } } },
    { text: { text: "CLEARDUES  ·  LOCAL PROTOTYPE  ·  SANDBOX ONLY", options: { x: 0.68, y: 7.13, w: 8.5, h: 0.15, fontFace: "Aptos", fontSize: 7, color: "6A7A70", margin: 0, breakLine: false } } },
  ],
  slideNumber: { x: 12.25, y: 7.1, color: "6A7A70", fontFace: "Aptos", fontSize: 8 },
});

const C = { ink: "18392E", muted: "607369", green: "17684F", pale: "E7F2EB", orange: "DF7652", line: "DCE6DC", white: "FFFFFF", warm: "FFF2E9", blue: "EAF2F4" };
const addText = (slide, value, x, y, w, h, options = {}) => slide.addText(value, {
  x, y, w, h, margin: 0, breakLine: false, fontFace: "Aptos", fontSize: 16,
  color: C.ink, valign: "mid", fit: "shrink", ...options,
});
const addHeading = (slide, kicker, title) => {
  addText(slide, kicker.toUpperCase(), 0.72, 0.52, 11.8, 0.22, { fontSize: 9, bold: true, color: C.orange, charSpacing: 0.6 });
  addText(slide, title, 0.72, 0.93, 11.9, 0.8, { fontFace: "Aptos Display", fontSize: 30, bold: true, breakLine: false, valign: "top" });
};
const addBox = (slide, x, y, w, h, fill = C.white, line = C.line) => slide.addShape(pptx.ShapeType.rect, {
  x, y, w, h, line: { color: line, width: 1 }, fill: { color: fill },
});

{
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };
  slide.addShape(pptx.ShapeType.rect, { x: 0.72, y: 1.0, w: 0.12, h: 4.65, line: { color: C.orange, transparency: 100 }, fill: { color: C.orange } });
  addText(slide, "PAYPAL AI HACKATHON · PROTOTYPE STATUS", 1.08, 1.2, 9.5, 0.3, { fontSize: 10, bold: true, color: "AFC9B7", charSpacing: 0.5 });
  addText(slide, "ClearDues", 1.05, 2.0, 10.7, 1.15, { fontFace: "Aptos Display", fontSize: 54, bold: true, color: C.white });
  addText(slide, "Evidence-backed invoice follow-up for independent exporters and freelancers.", 1.1, 3.35, 9.2, 1.0, { fontSize: 24, color: "D7E6DB", breakLine: false, valign: "top" });
  addText(slide, "LOCAL PROTOTYPE   ·   SYNTHETIC RECORDS   ·   PAYPAL SANDBOX ONLY", 1.1, 5.85, 10.5, 0.32, { fontSize: 10, bold: true, color: "AFC9B7" });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "The problem", "The record is scattered. The next step should not be guesswork.");
  const stats = [
    ["₹7.34L cr", "Delayed MSME receivables reported as of March 2024."],
    ["Up to 3×", "Longer delays reported for micro units vs. larger firms."],
    ["One case", "ClearDues focuses on the evidence around one invoice."],
  ];
  stats.forEach(([metric, caption], i) => {
    const x = 0.72 + i * 4.08;
    addBox(slide, x, 2.2, 3.75, 2.15);
    slide.addShape(pptx.ShapeType.rect, { x, y: 2.2, w: 3.75, h: 0.06, line: { color: C.orange, transparency: 100 }, fill: { color: C.orange } });
    addText(slide, metric, x + 0.22, 2.55, 3.3, 0.55, { fontSize: 27, bold: true });
    addText(slide, caption, x + 0.22, 3.23, 3.25, 0.75, { fontSize: 14, color: C.muted, valign: "top" });
  });
  addText(slide, "Source: C2FO/GAME/FISME, Delayed Payments 3.0 summary. Context only; not a measured product outcome.", 0.74, 4.72, 11.9, 0.35, { fontSize: 10, color: C.muted });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "The workflow", "One reviewable case, from invoice to evidence packet.");
  const steps = ["Attach invoice + correspondence", "AI selects exact source quotes", "Code checks quotes and fields", "Person edits the next step", "Export PDF + JSON"];
  steps.forEach((value, i) => {
    const x = 0.72 + i * 2.47;
    addBox(slide, x, 2.45, 2.16, 1.55, i === 3 ? C.warm : C.white, i === 3 ? "E8C9B6" : C.line);
    addText(slide, `0${i + 1}  ·  ${["ATTACH", "SELECT", "VERIFY", "REVIEW", "EXPORT"][i]}`, x + 0.16, 2.67, 1.86, 0.24, { fontSize: 8, bold: true, color: C.orange });
    addText(slide, value, x + 0.16, 3.04, 1.85, 0.72, { fontSize: 13, bold: true, valign: "top" });
  });
  addText(slide, "The source stays separate from AI suggestions; a person decides what to do.", 0.76, 4.48, 11.4, 0.45, { fontSize: 18, color: C.muted });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "Local workbench · schematic", "Keep every fact attached to its source.");
  addBox(slide, 0.72, 2.0, 7.45, 3.8);
  addBox(slide, 8.45, 2.0, 4.15, 3.8);
  addText(slide, "EVIDENCE TRAIL · SYNTHETIC", 1.0, 2.28, 6.7, 0.25, { fontSize: 9, bold: true, color: C.orange });
  addText(slide, "Client email excerpt", 1.0, 2.78, 6.7, 0.35, { fontSize: 16, bold: true });
  addText(slide, "“Our finance team has the invoice and expects to process it next week.”", 1.0, 3.3, 6.45, 0.82, { fontFace: "Georgia", fontSize: 17, color: C.muted, valign: "top" });
  addBox(slide, 1.0, 4.43, 6.45, 0.8, C.pale, C.pale);
  addText(slide, "SOURCE ID · ev-email-001\nExact quote retained for human review.", 1.18, 4.62, 6.0, 0.42, { fontSize: 10, color: C.green });
  addText(slide, "REVIEW DESK · DEMO MODE", 8.75, 2.28, 3.5, 0.25, { fontSize: 9, bold: true, color: C.orange });
  addBox(slide, 8.75, 2.8, 3.5, 0.92, C.warm, "F1D4C1");
  addText(slide, "No AI provider configured. No model request was made.", 8.95, 3.03, 3.1, 0.5, { fontSize: 12, color: C.ink });
  addText(slide, "PDF and JSON exports are available. This visual is a schematic, not a captured provider session.", 8.75, 4.02, 3.3, 1.0, { fontSize: 12, color: C.muted, valign: "top" });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "The distinction", "Evidence first, not another reminder bot.");
  addText(slide, "The differentiator is a source-first packet that separates exact excerpts from generated suggestions and keeps a person in control.", 0.75, 2.0, 11.2, 0.95, { fontSize: 22, color: C.ink, valign: "top" });
  ["Only verbatim quotes found in stored sources are retained.", "Model-generated narrative is discarded; gap suggestions require verification.", "PayPal actions are separate from AI and need explicit user confirmation."].forEach((value, i) => {
    addShapeBullet(slide, value, 0.85, 3.45 + i * 0.55);
  });
  addText(slide, "Novelty is conditional; existing invoice collection products are acknowledged in the research.", 0.76, 5.45, 11.4, 0.35, { fontSize: 10, color: C.muted });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "Mandatory tools", "PayPal Sandbox and AI are core paths, not decoration.");
  const boxes = [
    ["PAYPAL DEVELOPER", "Invoicing v2 adapter: draft, retrieve, send in Sandbox"],
    ["AI MODEL", "Select exact excerpts and suggest facts to verify"],
    ["DETERMINISTIC CONTROL", "Validate fields, citations, and confirmation"],
  ];
  boxes.forEach(([title, detail], i) => {
    const x = 0.72 + i * 4.08;
    addBox(slide, x, 2.35, 3.72, 2.0, i === 0 ? C.blue : C.white);
    addText(slide, title, x + 0.22, 2.65, 3.25, 0.28, { fontSize: 9, bold: true, color: C.orange });
    addText(slide, detail, x + 0.22, 3.12, 3.22, 0.85, { fontSize: 16, bold: true, valign: "top" });
  });
  addText(slide, "Credentials were unavailable for this build; no live call is claimed. Configured credentials do not prove a connection.", 0.76, 4.8, 11.5, 0.6, { fontSize: 13, color: C.muted });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "Quality and safety", "Tested locally. Not production-ready.");
  [["8", "Automated tests per run"], ["3×", "Consecutive green runs after npm ci"], ["0", "Vulnerabilities reported by npm audit"]].forEach(([metric, caption], i) => {
    const x = 0.72 + i * 4.08;
    addBox(slide, x, 2.25, 3.75, 1.75);
    addText(slide, metric, x + 0.22, 2.57, 3.2, 0.55, { fontSize: 30, bold: true, color: C.green });
    addText(slide, caption, x + 0.22, 3.25, 3.15, 0.45, { fontSize: 12, color: C.muted });
  });
  addText(slide, "Loopback API · synthetic fixtures · server-side credentials · rate limit · security headers", 0.76, 4.5, 11.6, 0.45, { fontSize: 14, color: C.muted });
  addText(slide, "No user authentication: do not expose this prototype to an untrusted network.", 0.76, 5.08, 11.6, 0.35, { fontSize: 12, bold: true, color: C.orange });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "Verified status", "What is done, and what remains.");
  const columns = [
    ["VERIFIED LOCALLY", "UI, evidence storage, quote checks, PDF/JSON, build and tests", C.pale],
    ["NOT VERIFIED", "Live PayPal, live AI, public hosting, user impact", C.white],
    ["SUBMISSION BLOCKER", "Public repository and public YouTube demo", C.warm],
  ];
  columns.forEach(([label, detail, fill], i) => {
    const x = 0.72 + i * 4.08;
    addBox(slide, x, 2.3, 3.75, 2.0, fill);
    addText(slide, label, x + 0.2, 2.6, 3.3, 0.28, { fontSize: 9, bold: true, color: C.orange });
    addText(slide, detail, x + 0.2, 3.08, 3.25, 0.9, { fontSize: 15, bold: true, valign: "top" });
  });
  addText(slide, "The user waived YouTube publication. The official event rules still require a public demo under three minutes.", 0.76, 4.85, 11.3, 0.58, { fontSize: 13, color: C.muted });
}

{
  const slide = pptx.addSlide("BASE");
  addHeading(slide, "Next", "Make the evidence review real, then test it with people.");
  addText(slide, "01  Verify test-only PayPal and AI calls", 0.85, 2.2, 10.9, 0.45, { fontSize: 19, bold: true });
  addText(slide, "02  Complete license and source-history scans", 0.85, 3.0, 10.9, 0.45, { fontSize: 19, bold: true });
  addText(slide, "03  Publish a standalone repository and compliant video only if authorized", 0.85, 3.8, 11.6, 0.7, { fontSize: 19, bold: true });
  addText(slide, "ClearDues is a prototype, not legal, accounting, tax, or collection advice.", 0.85, 5.25, 11.4, 0.38, { fontSize: 12, color: C.muted });
}

function addShapeBullet(slide, value, x, y) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y: y + 0.09, w: 0.1, h: 0.1, line: { color: C.orange, transparency: 100 }, fill: { color: C.orange } });
  addText(slide, value, x + 0.25, y, 11.3, 0.33, { fontSize: 15, color: C.muted });
}

const output = resolve("docs/presentation/deck.pptx");
await mkdir(dirname(output), { recursive: true });
await pptx.writeFile({ fileName: output });
console.log(`Wrote ${output}`);