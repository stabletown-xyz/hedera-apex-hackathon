# Hedera Apex Submission Manifest

- Finalized: 2026-03-20
- Track: Hedera Apex
- Scope: Munus Lite document/disclosure/approval/purchase/transfer/coupon narrative with custody signing

## Fast review path
1. Run strict live: `./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset`
2. Verify bundle: `./scripts/verify_submission_bundle.sh`
3. Open: `docs/challenges/hedera-apex/judge-quick-proof.md`
4. Optional spoken opener: `docs/challenges/hedera-apex/judge-opening-30s.md`
5. Pre-submit collaborator loop: `docs/challenges/hedera-apex/collaborator-validation-loop.md`
6. Mirror extraction guide: `docs/challenges/hedera-apex/public-mirror-extraction.md`

Equivalent one-command gate:
- `./scripts/challenges/run_hedera_apex_submission_gate.sh`

Submission-grade rule:
- Final scoring snapshots are strict-live only and must be generated with step 1 then verified immediately with step 2.

## Artifact links

- Description: `00-description-100-words.md`
- Demo script: `demo-script.md`
- Deck outline: `deck-outline.md`
- Deck citation footnotes: `deck-citation-footnotes.md`
- Runbook: `runbook.md`
- Checklist: `submission-checklist.md`
- Validation evidence pack: `validation-evidence-pack.md`
- Redacted validation artifacts: `validation-artifacts/`
- HashPack Tier 1 feasibility brief: `hashpack-retail-feasibility-tier1.md`
- Score refresh (latest): `submission-score-refresh-2026-03-20-v3.md`
- Prior score snapshot: `submission-score-refresh-2026-03-20-v2.md`
- Baseline score snapshot: `submission-score-refresh-2026-03-20.md`
- Observed strict-live snapshot: `observed-strict-live-snapshot-2026-03-20.md`
- Success model appendix: `success-model-appendix.md`
- Judge Q&A appendix: `judge-qa-appendix.md`
- Judge rehearsal checklist: `judge-rehearsal-checklist-2026-03-20.md`
- Judge quick proof: `judge-quick-proof.md`
- Judge opening script: `judge-opening-30s.md`
- Collaborator validation loop: `collaborator-validation-loop.md`
- Public mirror extraction guide: `public-mirror-extraction.md`
- Pitch-proof matrix: `pitch-proof-matrix.md`

## Verification evidence

Command:

```bash
./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset
./scripts/verify_submission_bundle.sh
```

Observed output checkpoint includes:

```text
[judge-demo] Effective mode : live
[judge-demo] Frontend runtime values
[judge-demo] - frontend_tenant_id=...
[judge-demo] - coverage=both
[judge-demo] Evidence summary: {"offering_id":"...","deployment_row_status":"...","tx_intent_present":...,"signoff_evidence_status":"..."}
[judge-demo] Judge bundle: .../chainkit/out/hedera_apex_judge_demo_bundle.json
[verify] submission bundle passed
```

Command:

```bash
./scripts/challenges/smoke_hedera_apex.sh
```

Observed output (2026-02-18):

```text
The database for StabletownCore.Repo has already been created
11:31:29.585 [info] Migrations already up
Seeded Hedera Apex demo data
tenant_id=22222222-2222-4222-8222-222222222221
program_id=22222222-2222-4222-8222-222222222222
offering_id=22222222-2222-4222-8222-222222222223
signer_id=22222222-2222-4222-8222-22222222222a
Hedera Apex smoke check passed
```

Command:

```bash
./scripts/challenges/smoke_munus_pilot.sh
```

Observed output (2026-02-20):

```text
The database for StabletownCore.Repo has already been created
11:50:52.896 [info] Migrations already up
Munus pilot smoke check passed
tenant_id=93e653ac-be00-4143-96f3-f5bc28f7bb2d
program_id=fcda838f-a458-40ea-a8c2-ed6276d7fbfe
participant_id=c3a0ac11-e650-4b27-b3c7-e7de76fb12ba
offering_id=95f0bf5e-74b5-4a6f-9693-d1b058f0599d
```

## Demo flow checkpoints

1. Offering bootstrap plus official document attachment.
2. Disclosure publication with signer-backed operation.
3. Investor approval and idempotent purchase flow.
4. Transfer compliance check (blocked scenario).
5. Transfer decision and compliance evidence attachment.
6. Coupon payment path and dashboard visibility.

## Validation posture (strict conservative)

- Hard claims are limited to publicly citable sources listed in `validation-evidence-pack.md`.
- Discovery notes are explicitly labeled by evidence tier:
  - `public precedent`
  - `internal/reconstructed`
  - `inferred`
- Non-public signals are anonymized (role + city/issuer type) and used as directional validation, not traction claims.

## Success modeling posture

- This submission distinguishes observed evidence from modeled assumptions.
- Base assumptions used for Success narrative:
  - issuers onboarded in 12 months: `3` (conservative `2`, stretch `5`)
  - offerings per issuer per year: `1.2`
  - lifecycle action counts: core `8-12`; expanded realistic `25-80`
- Modeled assumptions are presented as planning scenarios, not committed outcomes.

Observed strict-live evidence is documented separately in:
- `observed-strict-live-snapshot-2026-03-20.md`

## Risk posture and judge Q&A alignment

- Slow, credibility-led adoption is explicitly assumed.
- No claim of signed distribution rights, committed pilot volume, or legal clearance unless publicly documented.
- HashPack is framed as candidate Tier 2 distribution integration only, not current implemented integration.
- Judge-facing Q&A framing for traction vs assumptions, legal conservatism, and distribution dependency is maintained in:
  - `deck-outline.md`
  - `validation-evidence-pack.md`
  - `submission-score-refresh-2026-03-20-v3.md`

## Submission readiness

- Demo scenario deterministic and script-verified.
- API and event contracts reflected in `docs/api/v1.md` and `docs/events.md`.
- Checklist complete.

## Final evidence freeze rule

- Final packet must reference a frozen `main` commit SHA after collaborator acceptance.
- Use only strict-live bundle + verifier output generated from that frozen commit.
