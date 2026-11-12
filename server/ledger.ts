import postgres from "postgres";
import * as local from "./db.js";
import type { AnalysisResult, Evidence } from "./domain.js";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = connectionString ? postgres(connectionString, { max: 1, idle_timeout: 20 }) : undefined;

export async function initializeLedger(): Promise<void> {
  if (process.env.VERCEL && !sql) throw new Error("Persistent database is required on Vercel.");
  if (!sql) return local.initializeLedger();
  await sql`CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
  for (const item of local.seed) {
    await sql`INSERT INTO evidence (id, kind, title, text, created_at) VALUES (${item.id}, ${item.kind}, ${item.title}, ${item.text}, ${item.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
}

export async function readEvidence(): Promise<Evidence[]> {
  if (!sql) return local.readEvidence();
  const rows = await sql`SELECT id, kind, title, text, created_at FROM evidence ORDER BY created_at ASC`;
  return rows.map((row) => ({ id: row.id, kind: row.kind, title: row.title, text: row.text, createdAt: row.created_at } as Evidence));
}

export async function insertEvidence(item: Evidence): Promise<void> {
  if (!sql) return local.insertEvidence(item);
  await sql`INSERT INTO evidence (id, kind, title, text, created_at) VALUES (${item.id}, ${item.kind}, ${item.title}, ${item.text}, ${item.createdAt})`;
}

async function writeState(key: string, value: unknown): Promise<void> {
  if (!sql) throw new Error("PostgreSQL is not configured.");
  await sql`INSERT INTO state (key, value) VALUES (${key}, ${JSON.stringify(value)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

async function readState<T>(key: string): Promise<T | undefined> {
  if (!sql) throw new Error("PostgreSQL is not configured.");
  const rows = await sql`SELECT value FROM state WHERE key = ${key}`;
  return rows.length ? JSON.parse(rows[0].value) as T : undefined;
}

export async function saveLatestAnalysis(analysis: AnalysisResult): Promise<void> {
  if (!sql) return local.saveLatestAnalysis(analysis);
  return writeState("latestAnalysis", analysis);
}

export async function clearLatestAnalysis(): Promise<void> {
  if (!sql) return local.clearLatestAnalysis();
  await sql`DELETE FROM state WHERE key = 'latestAnalysis'`;
}

export async function readLatestAnalysis(): Promise<AnalysisResult | undefined> {
  if (!sql) return local.readLatestAnalysis();
  return readState<AnalysisResult>("latestAnalysis");
}

export async function savePaypalInvoice(invoice: local.PayPalInvoiceSnapshot): Promise<void> {
  if (!sql) return local.savePaypalInvoice(invoice);
  return writeState("paypalInvoice", invoice);
}

export async function readPaypalInvoice(): Promise<local.PayPalInvoiceSnapshot | undefined> {
  if (!sql) return local.readPaypalInvoice();
  return readState<local.PayPalInvoiceSnapshot>("paypalInvoice");
}

export async function closeLedger(): Promise<void> {
  if (sql) await sql.end();
}