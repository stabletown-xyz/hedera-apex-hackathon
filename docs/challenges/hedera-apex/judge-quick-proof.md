# Judge Quick Proof (Submission-Grade, 2 Minutes)

Use this page for final scoring snapshots. Submission-grade evidence must come from strict live generation followed immediately by strict verification.

Optional spoken opener (30 seconds):
- `docs/challenges/hedera-apex/judge-opening-30s.md`

Pre-submit collaborator acceptance:
- `docs/challenges/hedera-apex/collaborator-validation-loop.md`

## 0) One-command submission gate (recommended)

```bash
./scripts/challenges/run_hedera_apex_submission_gate.sh
```

Expected summary includes:
- `[apex-gate] submission-grade pass`
- `mode=live/live coverage=both strict_live_passed=true`
- `proof_flags hts=true evm=true lifecycle_native_only=true`

Gate preflight checks include Node 20+, Elixir 1.17+, Postgres readiness, and contracts compile.

## 1) Generate strict live evidence

```bash
./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset
```

Expected output includes:
- `[judge-demo] Effective mode : live`
- `[judge-demo] Coverage      : both`
- `[judge-demo] Judge bundle: .../chainkit/out/hedera_apex_judge_demo_bundle.json`

## 2) Verify strict bundle

```bash
./scripts/verify_submission_bundle.sh
```

Expected result:
- `[verify] submission bundle passed`

If this fails with non-submission-grade output, regenerate and verify with this one command:

```bash
./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset && ./scripts/verify_submission_bundle.sh
```

## 3) Confirm strict proof flags

From `chainkit/out/hedera_apex_judge_demo_bundle.json` confirm:
- `requested_mode = live`
- `effective_mode = live`
- `coverage = both`
- `proof_flags.strict_live_passed = true`
- `proof_flags.hts_proof_present = true`
- `proof_flags.evm_proof_present = true`
- `proof_flags.lifecycle_native_only = true`

## 4) Confirm required proof slots

From `required_slots`, confirm all are `attached=true`:
- `hts_deploy_tx`
- `evm_deploy_tx`
- `hts_token_identifier`
- `evm_contract_address`
- `native_lifecycle_paths`

## 5) Non-strict local check (not submission-grade)

For local mock-only dry runs:

```bash
STABLETOWN_ALLOW_NON_STRICT_BUNDLE=1 ./scripts/verify_submission_bundle.sh
```

Artifacts produced this way are intentionally excluded from final scoring snapshots.
