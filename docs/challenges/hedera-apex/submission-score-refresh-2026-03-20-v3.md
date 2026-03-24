# Hedera Apex Submission Score Refresh (Strict Conservative, V3)

- Date: 2026-03-20
- Posture: strict conservative
- Scoring basis: observable repo evidence + public citations + anonymized discovery signals
- Evidence baseline: strict-live bundle captured at `2026-03-20T19:04:40.288Z`

## 1) Rubric snapshot (Tier 1 packaging update)

| Section | Score (1-5) | Weight | Weighted contribution | Notes |
| --- | --- | --- | --- | --- |
| Innovation | 4.0 | 10% | 2.8 | Municipal workflow + compliance-first operating model with reproducible judge proof path. |
| Feasibility | 4.3 | 10% | 3.0 | Live strict rehearsal confirms technical viability; growth still channel-dependent by design. |
| Execution | 4.7 | 20% | 6.6 | Strict-live evidence path and verifier remain stable; Tier 1 docs improve judge clarity. |
| Integration | 4.7 | 15% | 4.9 | HTS + EVM strict evidence remains the implemented integration basis; no roadmap inflation. |
| Validation | 3.2 | 15% | 3.4 | Tier-consistent matrix, redacted artifacts, and traceability remain conservative. |
| Success | 3.9 | 20% | 5.5 | Observed strict evidence remains separated from modeled impact assumptions. |
| Pitch | 4.0 | 10% | 2.8 | Added judge-safe HashPack candidate framing and overclaim guardrails. |
| **Total** |  | **100%** | **28.9 / 35.0** | **Estimated grade: 82.7%** |

Formula used:
- `Weighted contribution = (score / 5) * (section max points)`
- Section max points: 3.5, 3.5, 7.0, 5.25, 5.25, 7.0, 3.5

## 2) Tier 1 impact boundary (no integration overclaim)

Tier 1 changes are packaging-only:
- Added `hashpack-retail-feasibility-tier1.md` with explicit "candidate, not integrated" posture.
- Added judge Q&A and runbook language to prevent live-integration overclaims.
- Added claim hygiene check script for repeatable documentation QA.

What did not change:
- No HashPack/HashConnect implementation was added in frontend/runtime.
- No strict-live proof fields were added for HashPack-signed transactions.
- Integration score basis remains implemented HTS + EVM evidence only.

## 3) Evidence class separation used in this score

### Publicly citable observed evidence
- Market and precedent claims:
  - SIFMA municipal market statistics
  - JPMorgan Quincy issuance + MEAR allocation
  - Hedera HTS/native tokenization docs
- Strict-live technical proof artifacts:
  - `chainkit/out/hedera_apex_judge_demo_bundle.json`
  - `observed-strict-live-snapshot-2026-03-20.md`
  - strict verifier pass (`./scripts/verify_submission_bundle.sh`)

### Anonymized internal/discovery signals
- Tiered matrix and redacted validation artifacts in:
  - `validation-evidence-pack.md`
  - `validation-artifacts/`
- Used for directional validation and product-change traceability only.

### Modeled projections (explicit assumptions)
- Issuer scenarios (`2 conservative / 3 base / 5 stretch`)
- Offerings per issuer (`1.2`)
- Lifecycle action ranges (`8-12` core, `25-80` expanded)
- Documented in `success-model-appendix.md` as assumptions, not traction.

## 4) Delta vs V2

Prior snapshot:
- `submission-score-refresh-2026-03-20-v2.md` = `28.9 / 35.0` (82.7%)

Current snapshot:
- `submission-score-refresh-2026-03-20-v3.md` = `28.9 / 35.0` (82.7%)

Rationale for no score inflation:
1. Tier 1 is packaging and claim-hygiene only.
2. No implemented integration evidence was added, so rubric scores remain unchanged.

## 5) Upside only if Tier 2 is implemented

Potential future uplift (not counted now):
- Observable HashPack/HashConnect integration in frontend and signer path.
- Strict-live bundle slot(s) proving wallet-signed execution artifacts.
- Corresponding Integration score increase should be based only on implemented and reproducible proof.
