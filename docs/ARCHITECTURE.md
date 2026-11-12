# Architecture

ClearDues is a local-first TypeScript application. The browser handles the review workflow, the Express API owns provider credentials and validation, and a SQLite file stores synthetic evidence plus the latest review/invoice snapshot.

```mermaid
flowchart LR
  U[User] --> UI[React + Vite workbench]
  UI --> API[Express API on loopback]
  API --> DB[(SQLite ledger)]
  API --> V[Zod validation and quote checks]
  API --> AI[Optional OpenAI-compatible provider]
  API --> PP[PayPal Invoicing v2 Sandbox]
  API --> PDF[PDF and JSON exports]
  PDF --> U
```

## Request boundaries

- `server/index.ts` defines the HTTP routes, limits JSON request size, enables Helmet headers, rate-limits analysis, and binds to `127.0.0.1` by default.
- `server/domain.ts` owns input schemas, citation checks, human confirmation checks, and deterministic request IDs.
- `server/ai.ts` makes an optional server-side chat-completions request. The model selects verbatim source excerpts and suggests gaps; model narrative is discarded. Deterministic code builds the summary and neutral editable starter.
- `server/paypal.ts` uses a fixed PayPal Sandbox host. OAuth credentials remain server-side; create/send operations require distinct user actions. Identical invoice payloads reuse an idempotency key.
- `server/db.ts` stores evidence and a separate latest-analysis/PayPal state record in `data/cleardues.sqlite`.

The PayPal and AI adapters are implemented but were not live-tested because runtime credentials were unavailable. Demo mode is clearly labeled and makes no external call.
