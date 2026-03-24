# Hedera Apex Runbook

## Prerequisites
- PostgreSQL installed and running locally
- Elixir `1.17+` (Ubuntu collaborators should prefer `asdf`; apt often installs older Elixir)
- Node.js `20.x` available in your shell (`node -v` should show `v20.*`)
- `mix deps.get`
- `mix ecto.create && mix ecto.migrate`
- Judge-owned Hedera testnet key in `.env.testnet.local`

Non-Docker collaborator setup notes:
- `run_hedera_apex_submission_gate.sh` now auto-installs/contracts deps (`npm ci` if missing), compiles contracts, and validates local prerequisites before strict-live execution.
- `validate_hedera_env.sh` and judge scripts auto-load `.env.testnet.local` by default (manual `set -a; source ...` is optional).

## Judge replication quickstart
1. `cp .env.testnet.example .env.testnet.local`
2. Fill `STABLETOWN_HEDERA_PRIVATE_KEY` with your own funded testnet key.
3. `./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset`
4. `./scripts/verify_submission_bundle.sh`
5. Optional one-command gate: `./scripts/challenges/run_hedera_apex_submission_gate.sh`

Collaborator pre-submit loop:
- `docs/challenges/hedera-apex/collaborator-validation-loop.md`
- `docs/challenges/hedera-apex/public-mirror-extraction.md`

Submission-grade evidence path (strict-live only):

```bash
./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset
./scripts/verify_submission_bundle.sh
```

Notes:
- Final scoring snapshots must use the strict-live path above; mock/auto artifacts are non-submission-grade.
- One-command gate runs strict live generation + strict bundle verification + claim hygiene verification.
- One-command gate also runs prerequisite checks: Node 20+, Elixir 1.17+, Postgres readiness, and contracts compile.
- Generated strict-live judge bundle path:
  - `chainkit/out/hedera_apex_judge_demo_bundle.json`
- Optional mock-only verifier mode:
  - `STABLETOWN_ALLOW_NON_STRICT_BUNDLE=1 ./scripts/verify_submission_bundle.sh`
- Auto mode is still available for non-strict local rehearsals and prints explicit fallback reasons.
- Live mode performs deep runtime checks (chain id + signer balance + coverage-aware fee preflight) before smoke.
- If live smoke fails with transient runtime availability (`rpc_unavailable`/timeouts), the runner retries live smoke before any auto-mode fallback.
- Smoke logs now capture both stdout and stderr; runtime chain failures are no longer hidden from attached log files.
- Optional tuning:
  - `STABLETOWN_HEDERA_CLI_MAX_ATTEMPTS` (default `3`)
  - `STABLETOWN_HEDERA_CLI_RETRY_BACKOFF_MS` (default `500`)
  - `STABLETOWN_HEDERA_PREFLIGHT_COVERAGE` (default `hts`)
  - `STABLETOWN_HEDERA_PREFLIGHT_FEE_BUFFER_BPS` (default `15000`)

## Demo bootstrap
1. `MIX_HOME=$PWD/.mix HEX_HOME=$PWD/.hex mix run scripts/challenges/seed_hedera_apex_demo.exs`
2. `./scripts/challenges/smoke_hedera_apex.sh`
3. Optional full deploy/open/close smoke: `./scripts/challenges/smoke_hedera_munus_deployable.sh`

## API spotlight
- `/api/v1/munus/offerings/:id/documents`
- `/api/v1/munus/offerings/:id/disclosures`
- `/api/v1/munus/offerings/:id/investors/:wallet/approve`
- `/api/v1/munus/offerings/:id/purchases`
- `/api/v1/munus/offerings/:id/coupons/pay`
- `/api/v1/munus/offerings/:id/transfers/check`
- `/api/v1/custody/signers` and `/api/v1/custody/sign-jobs`

## Rollback/reset
- Clean slate reset + seed: `./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset`
- Quick guided-seed refresh only (no DB reset/smoke): `./scripts/challenges/refresh_munus_guided_seed.sh --tenant-id <your-tenant-id>`

## Public mirror export (mini-app)
- Dry-run export validation:
  - `./scripts/challenges/export_hedera_apex_submission_repo.sh --mirror-dir /tmp/hedera-apex-mirror --dry-run`
- Sync export into a public mirror repo checkout:
  - `./scripts/challenges/export_hedera_apex_submission_repo.sh --mirror-dir /absolute/path/to/hedera-apex-public-mirror --mode sync`

## Evidence posture
- Public on-chain anchors: mode refs, HTS token id/address, EVM contract address, deploy/lifecycle tx hashes, execution-path markers.
- Private compliance metadata: advisor signoff/disclosure details and tenant-scoped workflow evidence.
- Strict live acceptance for `--coverage both`: HTS + EVM proof present and no synthetic lifecycle execution path.

## Submission evidence guardrails (strict conservative)
- Hard claims and metrics must map to publicly citable references only.
- Discovery and pipeline notes must remain anonymized by role + city/issuer type.
- Modeled adoption/impact values must be labeled as assumptions, not traction.
- Do not claim signed distribution rights, committed pilot volume, or legal clearance unless publicly documented.
- Optional docs QA: run `./scripts/challenges/check_apex_claim_hygiene.sh` before final packaging.

## HashPack posture (what to say / what not to say)
- What to say: HashPack is a candidate retail distribution layer in a future Tier 2 integration path.
- What not to say: HashPack is currently integrated or live in this submission.
- Evidence boundary: current observed wallet surfaces (`/api/v1/wallets/*`, investor wallet approval route, SDK `external_wallet`) are present now; HashPack-specific wiring is not.

Reference artifacts:
- `validation-evidence-pack.md`
- `validation-artifacts/`
- `collaborator-validation-loop.md`
- `public-mirror-extraction.md`
- `judge-opening-30s.md`
- `hashpack-retail-feasibility-tier1.md`
- `observed-strict-live-snapshot-2026-03-20.md`
- `submission-score-refresh-2026-03-20.md`
- `submission-score-refresh-2026-03-20-v2.md`
- `submission-score-refresh-2026-03-20-v3.md`
- `judge-quick-proof.md`
- `pitch-proof-matrix.md`
- `success-model-appendix.md`
- `judge-qa-appendix.md`
- `deck-citation-footnotes.md`

## Optional KMS appendix
- The primary judge flow is private-key based (`STABLETOWN_HEDERA_PRIVATE_KEY`).
- KMS/operator-key path remains optional for advanced custody demos:
  - `STABLETOWN_HEDERA_OPERATOR_ID`
  - `STABLETOWN_HEDERA_OPERATOR_KEY`
  - `STABLETOWN_HEDERA_OPERATOR_KEY_TYPE`
