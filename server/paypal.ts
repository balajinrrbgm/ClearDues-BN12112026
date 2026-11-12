import type { z } from "zod";
import { invoiceInputSchema, invoiceRequestId } from "./domain.js";

type InvoiceInput = z.infer<typeof invoiceInputSchema>;
type Token = { value: string; expiresAt: number };

const sandbox = "https://api-m.sandbox.paypal.com";
let tokenCache: Token | undefined;

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function accessToken(): Promise<string> {
  if (!paypalConfigured()) throw new Error("PayPal Sandbox credentials are not configured.");
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;
  const basic = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const response = await fetch(`${sandbox}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PayPal Sandbox authentication returned HTTP ${response.status}.`);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

async function paypalRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${sandbox}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`PayPal Sandbox returned HTTP ${response.status}.`);
  return body;
}

export async function createSandboxInvoice(input: InvoiceInput): Promise<unknown> {
  const amount = Number(input.amount).toFixed(2);
  return paypalRequest("/v2/invoicing/invoices", {
    method: "POST",
    headers: { "PayPal-Request-Id": invoiceRequestId(input) },
    body: JSON.stringify({
      detail: {
        currency_code: input.currency,
        note: "Created in ClearDues Sandbox. Review invoice details before sending.",
        payment_term: { term_type: "DUE_ON_DATE_SPECIFIED", due_date: input.dueDate },
      },
      primary_recipients: [
        { billing_info: { name: { given_name: input.recipientName }, email_address: input.recipientEmail } },
      ],
      items: [
        {
          name: "Professional services (review description before sending)",
          quantity: "1",
          unit_amount: { currency_code: input.currency, value: amount },
        },
      ],
    }),
  });
}

export async function getSandboxInvoice(id: string): Promise<unknown> {
  return paypalRequest(`/v2/invoicing/invoices/${encodeURIComponent(id)}`);
}

export async function sendSandboxInvoice(id: string): Promise<unknown> {
  return paypalRequest(`/v2/invoicing/invoices/${encodeURIComponent(id)}/send`, { method: "POST", body: "{}" });
}