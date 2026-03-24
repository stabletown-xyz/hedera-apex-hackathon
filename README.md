# Hedera Apex Submission Mirror

## What This Repo Is
This repository is a submission-focused mirror for Hedera Apex judging.
It contains only judge-relevant artifacts, docs, and a static mini-app shell for proof inspection.

## Fast Verification Path
Run all mirror gates:

```bash
./scripts/check_no_secrets.sh
./scripts/check_claim_hygiene.sh
./scripts/check_docs_links.sh
./scripts/verify_submission_bundle.sh
```

Expected strict values from `artifacts/hedera_apex_judge_demo_bundle.json`:
- `track = hedera-apex`
- `requested_mode = live`
- `effective_mode = live`
- `coverage = both`
- `proof_flags.strict_live_passed = true`
- `proof_flags.hts_proof_present = true`
- `proof_flags.evm_proof_present = true`
- `proof_flags.lifecycle_native_only = true`

## Mini-App Shell
Start a static server from repo root:

```bash
./scripts/run_demo_local.sh
```

Then open:
- `http://127.0.0.1:4173/frontend/apex-judge-miniapp/index.html`

## Proof Integrity
- Export manifest: `submission/export-manifest.json`
- Frozen evidence metadata: `submission/frozen-evidence.json`
- Artifact checksums: `submission/checksums.sha256`
- File inventory: `submission/file-inventory.txt`

## Included surfaces
- `docs/challenges/hedera-apex/*` (judge-facing subset)
- `docs/api/v1.md`
- `docs/events.md`
- `artifacts/hedera_apex_judge_demo_bundle.json`
- `frontend/apex-judge-miniapp/*`
- `scripts/*` (mirror verification and safety checks)

## Source Metadata
- Source repo: `https://github.com/stabletown-xyz/stabletown`
- Source ref: `eea9da5ebcc6bcb0d3a7859af8b107f3dd50f059`
- Source sha: `eea9da5ebcc6bcb0d3a7859af8b107f3dd50f059`
- Exported at (UTC): `2026-03-24T02:07:23Z`
