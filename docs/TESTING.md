# Testing

## Automated checks

```powershell
npm ci
npm test
npm run lint
npm run build
npm audit
```

Tests use Node's test runner and isolate SQLite state in a temporary directory. They cover exact quote validation, input bounds, invoice schemas, explicit send confirmation, stable idempotency keys, deterministic review text, and ledger persistence.

## Browser smoke flow

1. Open the Vite URL printed by `npm run dev`.
2. Confirm the synthetic invoice and Sandbox/demo labels are visible.
3. Add a 12+ character correspondence excerpt and verify the evidence count increases.
4. Run Review evidence without AI settings; verify the UI says no model request was made.
5. Export JSON and PDF; verify both downloads work and include the latest review state.
6. At a 390px viewport, verify the content remains within the screen width.

## External integrations

A live AI-provider test and PayPal Sandbox create/retrieve/send test are not run without user-provided test credentials. Never commit those credentials. Follow the PayPal confirmation steps in [USER_GUIDE.md](USER_GUIDE.md) only with synthetic recipient data.
