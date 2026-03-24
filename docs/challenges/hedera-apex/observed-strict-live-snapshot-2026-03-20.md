# Observed Strict-Live Snapshot (2026-03-20)

- Source artifact: `chainkit/out/hedera_apex_judge_demo_bundle.json`
- Generation command:
  - `./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset`
  - `./scripts/verify_submission_bundle.sh`
- Bundle timestamp (UTC): `2026-03-20T19:04:40.288Z`
- Submission posture: strict-live, coverage=`both`

## Proof flags (observed)

| Flag | Value |
| --- | --- |
| `requested_mode` | `live` |
| `effective_mode` | `live` |
| `proof_flags.strict_live_passed` | `true` |
| `proof_flags.hts_proof_present` | `true` |
| `proof_flags.evm_proof_present` | `true` |
| `proof_flags.lifecycle_native_only` | `true` |

## Required slots (observed)

| Slot | Attached | Reference |
| --- | --- | --- |
| `hts_deploy_tx` | `true` | `0xa2ee603e831487958808d0c85f5e429ea92bdf24c89d16fd76c074e85b517c4c` |
| `evm_deploy_tx` | `true` | `0x143e1d0d5b3550bf564fb8865b3121cbf9dfc3236e3ebf9f9d1fe53ae89b9d99` |
| `hts_token_identifier` | `true` | `token_id=0.0.8309204`, `token_address=0x00000000000000000000000000000000007EC9D4` |
| `evm_contract_address` | `true` | `0x6D3f0fcE34171dba3b44c55654c5Eea55ca62a29` |
| `native_lifecycle_paths` | `true` | `lifecycle_native_only=true` |

## Smoke execution rows (observed)

| Mode | Deploy path | Open path | Close path | Deploy tx |
| --- | --- | --- | --- | --- |
| `hts` | `hts_controller_native` | `hts_controller_native` | `hts_controller_native` | `0xa2ee603e831487958808d0c85f5e429ea92bdf24c89d16fd76c074e85b517c4c` |
| `evm` | `evm_contract_native` | `hts_controller_native` | `hts_controller_native` | `0x143e1d0d5b3550bf564fb8865b3121cbf9dfc3236e3ebf9f9d1fe53ae89b9d99` |

## Interpretation boundary

- This document records observed strict rehearsal evidence only.
- It is not a customer traction report and does not claim production adoption volume.
