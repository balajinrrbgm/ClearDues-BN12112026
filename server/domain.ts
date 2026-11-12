import { createHash } from "node:crypto";
import { z } from "zod";

export const evidenceInputSchema = z.object({
  text: z.string().trim().min(12).max(5000),
});

export const invoiceInputSchema = z.object({
  recipientName: z.string().trim().min(1).max(120),
  recipientEmail: z.string().email().max(254),
  amount: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/),
  currency: z.enum(["USD", "EUR", "GBP", "INR"]),
  dueDate: z.iso.date(),
});

export type Evidence = {
  id: string;
  kind: "invoice" | "correspondence" | "analysis";
  title: string;
  text: string;
  createdAt: string;
};

export type Claim = { text: string; sourceId: string; quote: string };

export type AnalysisResult = {
  mode: "demo" | "ai";
  summary: string;
  draft: string;
  claims: Claim[];
  missingFacts: string[];
};

const neutralStarter = "Hello, I’m following up on the invoice and would appreciate an update on its expected payment timing. Please let me know if you need anything else from me.";

export function makeDemoAnalysis(): AnalysisResult {
  return {
    mode: "demo",
    summary: "Demo mode: no AI provider is configured, so no model request was made.",
    draft: neutralStarter,
    claims: [],
    missingFacts: ["Configure an AI-compatible provider to analyze these excerpts."],
  };
}

export function isCitedBySource(claim: Claim, sources: Evidence[]): boolean {
  const source = sources.find((item) => item.id === claim.sourceId);
  return Boolean(source && claim.quote.length > 0 && source.text.includes(claim.quote));
}

export function validateClaims(claims: Claim[], sources: Evidence[]): Claim[] {
  return claims.filter((claim) => isCitedBySource(claim, sources));
}

export function hasExplicitConfirmation(value: unknown): boolean {
  return typeof value === "object" && value !== null && "confirm" in value && value.confirm === true;
}

export function invoiceRequestId(input: z.infer<typeof invoiceInputSchema>): string {
  const fingerprint = JSON.stringify([
    input.recipientName,
    input.recipientEmail.toLowerCase(),
    input.amount,
    input.currency,
    input.dueDate,
  ]);
  return `cd-${createHash("sha256").update(fingerprint).digest("hex").slice(0, 32)}`;
}

export function makeGroundedAnalysis(claims: Claim[], missingFacts: string[]): AnalysisResult {
  const verifiedQuotes = claims.map((claim) => ({
    text: "Source excerpt",
    sourceId: claim.sourceId,
    quote: claim.quote,
  }));
  return {
    mode: "ai",
    summary: `${verifiedQuotes.length} exact source excerpt(s) selected for human review. No payment status or legal conclusion inferred.`,
    draft: neutralStarter,
    claims: verifiedQuotes,
    missingFacts,
  };
}

export function makeId(): string {
  return crypto.randomUUID();
}