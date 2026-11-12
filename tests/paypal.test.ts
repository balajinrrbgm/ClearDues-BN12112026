import test from "node:test";
import assert from "node:assert/strict";
import { invoiceIdFromCreateResponse } from "../server/paypal.js";

test("extracts an invoice ID from a PayPal Sandbox self link", () => {
  assert.equal(invoiceIdFromCreateResponse({
    rel: "self",
    href: "https://api.sandbox.paypal.com/v2/invoicing/invoices/INV2-ABCD-EFGH-IJKL-MNOP",
    method: "GET",
  }), "INV2-ABCD-EFGH-IJKL-MNOP");
  assert.equal(invoiceIdFromCreateResponse({ id: "INV2-ABCD-EFGH" }), "INV2-ABCD-EFGH");
});

test("rejects non-sandbox links and malformed invoice IDs", () => {
  assert.throws(() => invoiceIdFromCreateResponse({ rel: "self", href: "https://api.paypal.com/v2/invoicing/invoices/INV2-ABCD" }));
  assert.throws(() => invoiceIdFromCreateResponse({ rel: "self", href: "https://example.com/v2/invoicing/invoices/INV2-ABCD" }));
  assert.throws(() => invoiceIdFromCreateResponse({ id: "../../invoices" }));
});