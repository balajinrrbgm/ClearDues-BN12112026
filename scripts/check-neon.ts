import "dotenv/config";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("A Neon database URL is required for this check.");
const ledger = await import("../server/ledger.js");
const cleanup = postgres(databaseUrl, { max: 1 });
const id = `test-${randomUUID()}`;

try {
  await ledger.initializeLedger();
  await ledger.insertEvidence({
    id,
    kind: "correspondence",
    title: "Synthetic integration test",
    text: "Synthetic Neon storage verification record.",
    createdAt: new Date().toISOString(),
  });
  const record = (await ledger.readEvidence()).find((item) => item.id === id);
  if (record?.text !== "Synthetic Neon storage verification record.") throw new Error("Neon round trip failed.");
  console.log("Neon ledger initialization and synthetic evidence round trip passed.");
} finally {
  await cleanup`DELETE FROM evidence WHERE id = ${id}`;
  await cleanup.end();
  await ledger.closeLedger();
}