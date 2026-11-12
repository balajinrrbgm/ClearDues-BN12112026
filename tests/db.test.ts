import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearLatestAnalysis, initializeLedger, readEvidence, readLatestAnalysis, readPaypalInvoice, saveLatestAnalysis, savePaypalInvoice } from "../server/db.js";

test("initializes a persistent ledger with synthetic demo evidence", async () => {
  const directory = mkdtempSync(join(tmpdir(), "cleardues-test-"));
  try {
    await initializeLedger(join(directory, "ledger.sqlite"));
    const evidence = readEvidence();
    assert.equal(evidence.length, 2);
    assert.equal(evidence.every((item) => item.text.includes("Synthetic") || item.kind === "correspondence"), true);
    const analysis = { mode: "demo" as const, summary: "No model request made.", draft: "", claims: [], missingFacts: [] };
    saveLatestAnalysis(analysis);
    assert.deepEqual(readLatestAnalysis(), analysis);
    clearLatestAnalysis();
    assert.equal(readLatestAnalysis(), undefined);
    savePaypalInvoice({ id: "TEST-SANDBOX-INVOICE", status: "DRAFT" });
    assert.deepEqual(readPaypalInvoice(), { id: "TEST-SANDBOX-INVOICE", status: "DRAFT" });
    savePaypalInvoice(undefined);
    assert.equal(readPaypalInvoice(), undefined);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});