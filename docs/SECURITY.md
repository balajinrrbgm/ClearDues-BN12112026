# Security Notes

ClearDues is a local prototype, not a multi-user production service. Do not expose its unauthenticated API to an untrusted network.

- Use synthetic demo data only. Local evidence is persisted in an ignored SQLite database.
- Keep provider credentials in `.env`; `.env.example` contains placeholders. Never paste secrets into source, screenshots, docs, or issue reports.
- The PayPal adapter is hard-coded to the Sandbox API host. Live PayPal credentials and hosts are not supported.
- AI is opt-in. User evidence is sent to the configured endpoint only after selecting Review evidence. The endpoint must use HTTPS except on localhost.
- Model output is untrusted. Strict schemas are applied, only exact source quotes survive, and model-generated narrative is discarded. Gap suggestions require human verification.
- Invoice fields are deterministically validated. AI cannot choose recipients, amounts, or invoke PayPal operations. Draft creation and sending are separate human-confirmed actions.
- PayPal requests use an idempotency key derived from invoice fields; logs do not include tokens or request bodies.
- Helmet security headers, JSON size limits, and an analysis rate limit are enabled. React renders source strings as text.
- Run `npm audit` and the CI secret scan before publishing. A full history scan is not available until a Git repository exists.

See the root [SECURITY.md](../SECURITY.md) for private vulnerability reporting guidance.
