import test from "node:test";
import assert from "node:assert/strict";
import { evidenceInputSchema, hasExplicitConfirmation, invoiceInputSchema, invoiceRequestId, isCitedBySource, makeDemoAnalysis, makeGroundedAnalysis, validateClaims, type Evidence } from "../server/domain.js";

const source: Evidence = {
  id: "source-1",
  kind: "correspondence",
  title: "Email",
  text: "Finance expects to process the invoice next week.",
  createdAt: "2026-10-25T10:30:00.000Z",
};

test("accepts only citations that match an exact source excerpt", () => {
  const valid = { text: "Finance gave an estimate", sourceId: source.id, quote: "process the invoice next week" };
  const invented = { ...valid, quote: "payment is guaranteed tomorrow" };
  assert.equal(isCitedBySource(valid, [source]), true);
  assert.equal(isCitedBySource(invented, [source]), false);
  assert.deepEqual(validateClaims([valid, invented], [source]), [valid]);
});

test("bounds correspondence text", () => {
  assert.equal(evidenceInputSchema.safeParse({ text: "A sufficiently long source excerpt." }).success, true);
  assert.equal(evidenceInputSchema.safeParse({ text: "short" }).success, false);
  assert.equal(evidenceInputSchema.safeParse({ text: "x".repeat(5001) }).success, false);
});

test("validates invoice amounts and supported currencies", () => {
  const invoice = {
    recipientName: "Synthetic recipient",
    recipientEmail: "recipient@example.test",
    amount: "2400.00",
    currency: "USD",
    dueDate: "2026-11-24",
  };
  assert.equal(invoiceInputSchema.safeParse(invoice).success, true);
  assert.equal(invoiceInputSchema.safeParse({ ...invoice, amount: "-10" }).success, false);
  assert.equal(invoiceInputSchema.safeParse({ ...invoice, currency: "XYZ" }).success, false);
});

test("requires an explicit true confirmation before an external send", () => {
  assert.equal(hasExplicitConfirmation({ confirm: true }), true);
  assert.equal(hasExplicitConfirmation({ confirm: false }), false);
  assert.equal(hasExplicitConfirmation({}), false);
  assert.equal(hasExplicitConfirmation(null), false);
});

test("uses stable idempotency keys for repeated identical invoice requests", () => {
  const invoice = {
    recipientName: "Synthetic recipient",
    recipientEmail: "recipient@example.test",
    amount: "2400.00",
    currency: "USD" as const,
    dueDate: "2026-11-24",
  };
  assert.equal(invoiceRequestId(invoice), invoiceRequestId(invoice));
  assert.notEqual(invoiceRequestId(invoice), invoiceRequestId({ ...invoice, amount: "2401.00" }));
});

test("builds review text from verified quotes instead of model-generated narrative", () => {
  const analysis = makeGroundedAnalysis(
    [{ text: "Unsupported paraphrase", sourceId: source.id, quote: "process the invoice next week" }],
    ["Confirm the expected date (AI suggestion; verify manually)."],
  );
  assert.equal(analysis.claims[0].text, "Source excerpt");
  assert.match(analysis.summary, /1 exact source excerpt/);
  assert.doesNotMatch(analysis.summary, /payment status is confirmed/i);
  assert.match(analysis.draft, /following up on the invoice/);
});

test("demo review makes no model claim and provides a deterministic editable starter", () => {
  const analysis = makeDemoAnalysis();
  assert.equal(analysis.mode, "demo");
  assert.match(analysis.summary, /no model request was made/i);
  assert.match(analysis.draft, /following up on the invoice/i);
  assert.equal(analysis.claims.length, 0);
});