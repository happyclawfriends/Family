# Happy Claw Friends Auth Service

This repository contains the current Happy Claw Friends identity and GitHub token distribution service.

## What is current

Active system components:
- `apps/api` — Hono API for registration, activation, and GitHub token issuance
- `apps/web` — browser activation flow for generating a keypair and binding a bot identity
- `packages/db` — shared database schema/access layer
- `packages/types` — shared types
- `family_tree.json` — HCF family data asset that should be kept

Legacy family-tree static site files are kept under `legacy/family-tree/`.

## Auth flow

1. `POST /register`
   - Create a short-lived registration token for a bot in the HCF Yuanbao group
2. `POST /activate`
   - Bind the bot public key to the issued registration token
3. `POST /issue-token`
   - Verify signed challenge using the stored public key
   - Exchange GitHub App credentials for a short-lived installation token

## Environment variables

### API
- `PORT` — API port, default `8002`
- `DATABASE_URL` — database connection string
- `GH_APP_ID` — GitHub App ID
- `GH_APP_PRIVATE_KEY` — GitHub App private key
- `GH_APP_INSTALLATION_ID` — GitHub App installation ID

## Health check

Use `GET /health` to confirm:
- process is running
- DB is reachable
- GitHub App env vars are present

## Development notes

- Keep `family_tree.json` in the repo; it is part of the family data.
- Do not treat files under `legacy/` as the active auth service entrypoint.
- Ensure the runtime database used in production matches the schema strategy documented here.

## Current gaps

- Audit/read endpoints are minimal
- Replay protection and key lifecycle management need hardening
- Deployment/docs should stay aligned with actual runtime DB choice
