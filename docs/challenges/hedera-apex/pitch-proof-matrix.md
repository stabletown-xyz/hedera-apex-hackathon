# Hedera Apex Pitch-Proof Matrix

Last updated: 2026-03-20

## Purpose
Map each pitch claim to concrete generated proof artifacts or judge-visible surfaces.

## Claim-to-proof map

| Pitch claim | Required proof | Source |
| --- | --- | --- |
| Judges can reproduce the demo with their own key. | Strict live command succeeds in judge environment. | `scripts/challenges/run_hedera_munus_judge_demo.sh`, `docs/challenges/hedera-apex/runbook.md` |
| Both HTS and EVM deployment paths are live and evidenced. | Bundle shows `coverage=both` and both mode deployment proofs. | `chainkit/out/hedera_apex_judge_demo_bundle.json` |
| Lifecycle actions are native (no synthetic fallback). | `proof_flags.lifecycle_native_only=true` and slot `native_lifecycle_paths` attached. | `chainkit/out/hedera_apex_judge_demo_bundle.json` |
| Submission uses privacy-safe evidence split. | Public on-chain anchors vs private compliance evidence explicitly separated. | `docs/challenges/hedera-apex/runbook.md`, `docs/challenges/hedera-apex/validation-evidence-pack.md` |
| Retail distribution readiness path is defined without overclaiming integration. | HashPack is labeled as Tier 2 candidate only, backed by current wallet API and `external_wallet` surfaces. | `docs/challenges/hedera-apex/hashpack-retail-feasibility-tier1.md`, `docs/api/v1.md`, `sdk/packages/sdk/src/types.ts` |
| Validation is conservative and source-disciplined. | Public claim ledger with citations + tiered discovery matrix + redacted artifacts. | `docs/challenges/hedera-apex/validation-evidence-pack.md`, `docs/challenges/hedera-apex/validation-artifacts/` |
| Success narrative is transparent modeling, not traction inflation. | Assumption math and sensitivity cases documented. | `docs/challenges/hedera-apex/success-model-appendix.md` |
| Judge review is one-command verifiable. | Bundle validator passes and checks strict proof flags/slots. | `scripts/verify_submission_bundle.sh`, `docs/challenges/hedera-apex/judge-quick-proof.md` |

## Recording gate

Use strict live mode and verify bundle (submission-grade path):

```bash
./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset
./scripts/verify_submission_bundle.sh
```

Pass criteria:
- strict live mode remained live (no fallback),
- HTS + EVM proof flags are true,
- lifecycle native-only proof is true,
- all required slots are attached.

Non-strict verification (`STABLETOWN_ALLOW_NON_STRICT_BUNDLE=1`) is for local dry runs only and excluded from final scoring snapshots.
