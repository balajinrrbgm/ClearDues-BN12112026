# User Guide

## Start

Use Node.js 22+ and npm. From this folder, run `npm run setup`, create `.env` from `.env.example` if it does not exist, and run `npm run dev`. Open the local Vite URL printed by the command. The API listens on `127.0.0.1:3001` by default.

## Review a case

1. Confirm the top badges say synthetic demo record and PayPal Sandbox.
2. Read the invoice and correspondence excerpts in Evidence trail. Every entry displays its source ID and timestamp.
3. Add a short correspondence excerpt if needed. Inputs are limited to 12–5,000 characters; use synthetic text only.
4. Choose **Review evidence**. Without AI settings, the app states that no model call was made. With a configured model, ClearDues retains exact source quotes and labels model-suggested gaps for manual verification.
5. Edit the neutral starter before using it. ClearDues does not send this message.
6. Export a PDF evidence packet or JSON record.

## Microsoft Foundry

Set `AZURE_AI_PROJECT_ENDPOINT` and `AZURE_AI_API_KEY` in the ignored `.env` file. Set `AZURE_AI_MODEL_DEPLOYMENT` to the deployment name if it differs from `gpt-6.1-terra`. Restart the API after changing `.env`. The adapter uses the resource-level Responses API and requires a resource key and a compatible deployed model; project-scoped operations may require Microsoft Entra ID.

## PayPal Sandbox

Add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from a test REST app to `.env`, then restart the API. Configure synthetic recipient information only. Review invoice details, confirm creation of a Sandbox draft, and separately confirm before sending. Refresh fetches the latest Sandbox state. The API never uses PayPal live hosts.

## Data and limitations

Evidence is stored in the local SQLite database under `data/`; this directory is ignored by Git. The latest analysis and Sandbox invoice snapshot are exported separately from source text. Do not enter real customer, payment, or confidential information. The prototype is not legal, accounting, tax, or collection advice.
