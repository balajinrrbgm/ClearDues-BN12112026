# ClearDues

Evidence-backed invoice follow-up for independent exporters and freelancers. ClearDues keeps source excerpts, AI analysis, and PayPal Sandbox invoice state in one reviewable workflow. It does not provide legal, accounting, or collection advice and never sends an invoice or reminder without a direct user action.

## Status

This is a hackathon prototype. Use synthetic data only. AI and PayPal credentials are optional; without them the interface clearly remains in demo mode and does not claim external calls succeeded.

## Requirements

- Node.js 22 or newer and npm.
- Optional: PayPal Developer Sandbox REST app credentials.
- Optional: a Microsoft Foundry project endpoint, resource API key, and model deployment.

## Run locally

```powershell
npm run setup
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Open the Vite URL printed in the terminal. The API binds to `127.0.0.1:3001` by default. Keep the `.env` values blank to use clearly labeled demo mode. The local SQLite database is created under `data/` and is ignored by Git.

To configure Microsoft Foundry, set `AZURE_AI_PROJECT_ENDPOINT` to `https://<resource>.services.ai.azure.com/api/projects/<project>`, and set `AZURE_AI_API_KEY` to the Foundry resource API key in `.env`. `AZURE_AI_MODEL_DEPLOYMENT` defaults to `gpt-6.1-terra`; change it if your deployment has a different name. The app calls the resource's `/openai/v1/responses` endpoint with the API key. The deployment must support this API and key authentication. Project-scoped Foundry SDK operations may instead require Microsoft Entra ID. Evidence text is sent to the configured provider only when you choose **Review evidence**. AI output is untrusted; only exact quotes found in stored sources are retained. The summary and neutral editable starter are deterministic; suggested gaps are labeled for manual verification.

To enable PayPal actions, add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from a PayPal Sandbox REST app. Credentials stay on the server. The app is hard-coded to PayPal's Sandbox host and does not support live credentials. Creating a draft and sending it each require a separate confirmation; use only synthetic recipient details.

## Vercel deployment

The Vercel deployment uses the connected Neon PostgreSQL database for persistent evidence and Vercel Authentication to protect all deployments. The local application continues to use SQLite when no database URL is configured. The deployed API requires `DATABASE_URL` or `POSTGRES_URL`; it fails closed on Vercel if neither exists.

The owner must keep Vercel Authentication enabled for **All Deployments** before configuring PayPal or AI credentials. To grant judges access, create a Vercel shareable link or approve their access requests; do not expose the unprotected API or publish credentials. Vercel's Hobby plan has limits on shareable links and external users.

PayPal Sandbox credentials and AI settings belong in sensitive Vercel environment variables, never in source control. After changing a local `.env`, update the corresponding Vercel variables and redeploy; changing a local file does not update the deployed application. Only use synthetic data.

## Checks and production preview
npm audit
npm run generate:deck

```powershell
npm test
npm run lint
npm run build
npm start
```

`npm start` serves the built UI if `dist/` exists. API actions are local-prototype endpoints without user authentication; do not expose this server to an untrusted network. CI runs type checks, tests, build, and a secret scan.
`npm start` serves the built UI if `dist/` exists. `npm run generate:deck` recreates the nine-slide PowerPoint from `scripts/generate-deck.mjs`. API actions are local-prototype endpoints without user authentication; do not expose this server to an untrusted network. CI runs type checks, tests, build, and a secret scan.

## Scope and limitations

- The seeded case and correspondence are synthetic. Do not store real customer or confidential information.
- The demo AI mode makes no model request. The app does not invent an AI result when no provider is configured.
- PayPal is Sandbox-only. No real money is moved, and no invoice is sent without explicit user confirmation.
- This prototype is not legal, accounting, tax, or collection advice.
- Official hackathon rules require a public YouTube demo under three minutes. The user waived publication for this build; the entry remains blocked/noncompliant unless that requirement is met.

See [SECURITY.md](SECURITY.md), [docs/hackathon/TOOL_USAGE.md](docs/hackathon/TOOL_USAGE.md), and [docs/PLAN.md](docs/PLAN.md) for security, integration, and acceptance details.
The project is MIT-licensed. See [SECURITY.md](SECURITY.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/USER_GUIDE.md](docs/USER_GUIDE.md), [docs/hackathon/TOOL_USAGE.md](docs/hackathon/TOOL_USAGE.md), and [docs/PLAN.md](docs/PLAN.md) for project details.
