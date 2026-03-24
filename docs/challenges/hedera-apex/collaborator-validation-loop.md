# Collaborator Validation Loop (Pre-Submission)

Last updated: 2026-03-22

## Goal
Collect at least two independent strict-live collaborator passes before freezing final submission evidence.

## Collaborator run steps (clean pull of `main`)
1. `cp .env.testnet.example .env.testnet.local`
2. Fill only `STABLETOWN_HEDERA_PRIVATE_KEY` with collaborator-owned funded testnet key.
3. `./scripts/challenges/run_hedera_apex_submission_gate.sh`

What gate now handles automatically:
- Node 20+ hard gate
- Elixir 1.17+ hard gate
- PostgreSQL readiness check (when `pg_isready` is available)
- contracts `npm ci` (if needed) + `npx hardhat compile`
- strict-live bundle generation + verification + claim hygiene checks

No manual env export is required for default flow:
- scripts auto-load `.env.testnet.local` unless `--no-env-file` is used.

## Required captured output per collaborator
- `mode=live/live`
- `coverage=both`
- `proof_flags hts=true evm=true lifecycle_native_only=true`
- `[verify] submission bundle passed`
- freshness line from verifier (`bundle_freshness ...`)

## Failure handling and classification
If gate fails, run:

```bash
./scripts/challenges/validate_hedera_env.sh --mode live
```

Classify issue as one of:
- `env/key funding`: missing/invalid key, wrong chain id, insufficient balance.
- `network/TLS`: DNS failure, certificate chain issues, outbound RPC reachability issues.
- `toolchain/setup`: Node <20, Elixir <1.17, contracts compile missing, or Postgres not running.
- `runtime`: strict-live deploy/preflight failures after env checks pass.

## Acceptance threshold
- Do not proceed to final packet assembly until at least **2 collaborator runs pass independently**.

## Collaborator run log template

| collaborator | date (UTC) | result | classification (if failed) | notes |
| --- | --- | --- | --- | --- |
| collaborator-1 | YYYY-MM-DD | pass/fail | env/key funding \| network/TLS \| runtime | short note |
| collaborator-2 | YYYY-MM-DD | pass/fail | env/key funding \| network/TLS \| runtime | short note |

## Pre-publication freeze protocol
After collaborator acceptance:
1. Run strict-live gate on `main` once more from release machine.
2. Verify:
   - `./scripts/verify_submission_bundle.sh`
   - `./scripts/challenges/check_apex_claim_hygiene.sh`
3. Freeze that commit as submission source of truth:
   - record commit SHA in final submission packet.
   - use only bundle/verifier output generated at that frozen SHA.

HashPack guardrail remains mandatory:
- Candidate-only wording; do not present HashPack as integrated/live in this submission.
