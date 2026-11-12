# Local API

The API is intended for the local demo and binds to `127.0.0.1`. It has no user authentication and must not be exposed to an untrusted network.

| Method | Path | Purpose | Important behavior |
| ------ | ---- | ------- | ------------------ |
| GET | `/api/health` | Report Sandbox mode and whether provider credentials are configured. | Credential presence is not proof of a successful provider connection. |
| GET | `/api/case` | Return the synthetic invoice and stored evidence. | No real customer information is seeded. |
| POST | `/api/evidence` | Add `{ "text": "..." }` correspondence. | Accepts 12–5,000 characters; invalid input returns 400 and clears stale analysis on success. |
| POST | `/api/analyze` | Analyze stored evidence. | Rate-limited to 8 requests/minute; returns explicit demo mode if no AI credentials are configured. |
| POST | `/api/paypal/invoices` | Create a Sandbox invoice draft from validated recipient/amount/currency/date fields. | Returns 503 if credentials are absent; identical payloads use the same request ID. |
| GET | `/api/paypal/invoices/:id` | Retrieve a Sandbox invoice status. | Requires configured Sandbox credentials. |
| POST | `/api/paypal/invoices/:id/send` | Send a Sandbox invoice. | Requires JSON `{ "confirm": true }` and configured credentials. |
| GET | `/api/export.json` | Download evidence, latest analysis, and stored PayPal state. | Labels the export synthetic/Sandbox-only. |
| GET | `/api/export.pdf` | Download the evidence packet. | Includes exact quotes, source IDs, review mode, and any stored Sandbox invoice ID/status. |

Provider failures return a generic HTTP status and message without logging credentials or raw evidence. AI errors return 502; malformed payloads return 400; missing provider credentials return 503.
