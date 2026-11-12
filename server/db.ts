import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import initSqlJs, { type Database } from "sql.js";
import type { Evidence, AnalysisResult } from "./domain.js";

const defaultDatabasePath = resolve(process.cwd(), "data", "cleardues.sqlite");
export const seed: Evidence[] = [
  {
    id: "ev-invoice-001",
    kind: "invoice",
    title: "Invoice CD-1042",
    text: "Invoice CD-1042 for design services, USD 2,400. Payment due 2026-10-24. Synthetic demo record.",
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "ev-email-001",
    kind: "correspondence",
    title: "Client email excerpt",
    text: "Thanks for sending the final files. Our finance team has the invoice and expects to process it next week.",
    createdAt: "2026-10-25T10:30:00.000Z",
  },
];

let database: Database;
let databasePath = defaultDatabasePath;

export async function initializeLedger(path = defaultDatabasePath): Promise<void> {
  databasePath = path;
  const SQL = await initSqlJs({
    locateFile: (file) => resolve(process.cwd(), "node_modules", "sql.js", "dist", file),
  });
  database = existsSync(databasePath)
    ? new SQL.Database(new Uint8Array(readFileSync(databasePath)))
    : new SQL.Database();
  database.run(`CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  database.run("CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  if (readEvidence().length === 0) {
    for (const item of seed) insertEvidence(item);
  }
  persist();
}

export function readEvidence(): Evidence[] {
  const result = database.exec(
    "SELECT id, kind, title, text, created_at FROM evidence ORDER BY created_at ASC",
  )[0];
  if (!result) return [];
  return result.values.map(([id, kind, title, text, createdAt]) => ({
    id: String(id),
    kind: kind as Evidence["kind"],
    title: String(title),
    text: String(text),
    createdAt: String(createdAt),
  }));
}

export function insertEvidence(item: Evidence): void {
  database.run(
    "INSERT INTO evidence (id, kind, title, text, created_at) VALUES (?, ?, ?, ?, ?)",
    [item.id, item.kind, item.title, item.text, item.createdAt],
  );
  persist();
}

export function saveLatestAnalysis(analysis: AnalysisResult): void {
  writeState("latestAnalysis", JSON.stringify(analysis));
}

export function clearLatestAnalysis(): void {
  database.run("DELETE FROM state WHERE key = ?", ["latestAnalysis"]);
  persist();
}

export function readLatestAnalysis(): AnalysisResult | undefined {
  const value = readState("latestAnalysis");
  return value ? (JSON.parse(value) as AnalysisResult) : undefined;
}

export type PayPalInvoiceSnapshot = { id: string; status: string };

export function savePaypalInvoice(invoice: PayPalInvoiceSnapshot | undefined): void {
  if (!invoice) {
    database.run("DELETE FROM state WHERE key = ?", ["paypalInvoice"]);
    persist();
    return;
  }
  writeState("paypalInvoice", JSON.stringify(invoice));
}

export function readPaypalInvoice(): PayPalInvoiceSnapshot | undefined {
  const value = readState("paypalInvoice");
  return value ? (JSON.parse(value) as PayPalInvoiceSnapshot) : undefined;
}

function readState(key: string): string | undefined {
  const result = database.exec("SELECT value FROM state WHERE key = ?", [key])[0];
  return result?.values[0]?.[0] ? String(result.values[0][0]) : undefined;
}

function writeState(key: string, value: string): void {
  database.run("INSERT INTO state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, value]);
  persist();
}

function persist(): void {
  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(databasePath, Buffer.from(database.export()));
}
