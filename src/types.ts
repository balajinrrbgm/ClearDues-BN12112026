export type Evidence = {
  id: string;
  kind: "invoice" | "correspondence" | "analysis";
  title: string;
  text: string;
  createdAt: string;
};

export type InvoiceCase = {
  number: string;
  recipientName: string;
  recipientEmail: string;
  amount: string;
  currency: "USD" | "EUR" | "GBP" | "INR";
  dueDate: string;
  status: string;
};

export type Analysis = {
  mode: "demo" | "ai";
  summary: string;
  draft: string;
  claims: Array<{ text: string; sourceId: string; quote: string }>;
  missingFacts: string[];
};