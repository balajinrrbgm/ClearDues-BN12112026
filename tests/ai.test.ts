import test from "node:test";
import assert from "node:assert/strict";
import { analyzeEvidence } from "../server/ai.js";

test("reports provider quota errors without exposing provider response details", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AZURE_AI_API_KEY;
  const originalModel = process.env.AZURE_AI_MODEL_DEPLOYMENT;
  const originalUrl = process.env.AZURE_AI_PROJECT_ENDPOINT;
  try {
    process.env.AZURE_AI_API_KEY = "synthetic-test-key";
    process.env.AZURE_AI_MODEL_DEPLOYMENT = "synthetic-model";
    process.env.AZURE_AI_PROJECT_ENDPOINT = "https://example.services.ai.azure.com/api/projects/demo";
    globalThis.fetch = async () => new Response('{"error":"private provider detail"}', { status: 429 });
    await assert.rejects(analyzeEvidence([]), (error: Error) => {
      assert.match(error.message, /quota or rate limit/i);
      assert.doesNotMatch(error.message, /private provider detail/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AZURE_AI_API_KEY; else process.env.AZURE_AI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.AZURE_AI_MODEL_DEPLOYMENT; else process.env.AZURE_AI_MODEL_DEPLOYMENT = originalModel;
    if (originalUrl === undefined) delete process.env.AZURE_AI_PROJECT_ENDPOINT; else process.env.AZURE_AI_PROJECT_ENDPOINT = originalUrl;
  }
});

test("uses the Foundry resource Responses API with an API key and retains exact citations", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AZURE_AI_API_KEY;
  const originalModel = process.env.AZURE_AI_MODEL_DEPLOYMENT;
  const originalUrl = process.env.AZURE_AI_PROJECT_ENDPOINT;
  try {
    process.env.AZURE_AI_API_KEY = "synthetic-test-key";
    process.env.AZURE_AI_MODEL_DEPLOYMENT = "gpt-6.1-terra";
    process.env.AZURE_AI_PROJECT_ENDPOINT = "https://example.services.ai.azure.com/api/projects/demo";
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), "https://example.services.ai.azure.com/openai/v1/responses");
      assert.equal(init?.redirect, "error");
      assert.equal(new Headers(init?.headers).get("api-key"), "synthetic-test-key");
      assert.equal(new Headers(init?.headers).has("authorization"), false);
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "gpt-6.1-terra");
      assert.equal(body.store, false);
      return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ claims: [
        { text: "Selected", sourceId: "source-1", quote: "payment next week" },
        { text: "Invented", sourceId: "source-1", quote: "payment tomorrow" },
      ], missingFacts: [] }) }] }] });
    };
    const result = await analyzeEvidence([{ id: "source-1", kind: "correspondence", title: "Email", text: "Expect payment next week.", createdAt: "2026-11-12T00:00:00Z" }]);
    assert.equal(result.mode, "ai");
    assert.deepEqual(result.claims.map((claim) => claim.quote), ["payment next week"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AZURE_AI_API_KEY; else process.env.AZURE_AI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.AZURE_AI_MODEL_DEPLOYMENT; else process.env.AZURE_AI_MODEL_DEPLOYMENT = originalModel;
    if (originalUrl === undefined) delete process.env.AZURE_AI_PROJECT_ENDPOINT; else process.env.AZURE_AI_PROJECT_ENDPOINT = originalUrl;
  }
});

test("does not send the Foundry API key to an untrusted endpoint", async () => {
  const originalKey = process.env.AZURE_AI_API_KEY;
  const originalUrl = process.env.AZURE_AI_PROJECT_ENDPOINT;
  try {
    process.env.AZURE_AI_API_KEY = "synthetic-test-key";
    process.env.AZURE_AI_PROJECT_ENDPOINT = "https://example.services.ai.azure.com.evil.test/api/projects/demo";
    await assert.rejects(analyzeEvidence([]), /Microsoft Foundry project endpoint/);
  } finally {
    if (originalKey === undefined) delete process.env.AZURE_AI_API_KEY; else process.env.AZURE_AI_API_KEY = originalKey;
    if (originalUrl === undefined) delete process.env.AZURE_AI_PROJECT_ENDPOINT; else process.env.AZURE_AI_PROJECT_ENDPOINT = originalUrl;
  }
});