# Hedera Apex Redacted Validation Artifacts

These artifacts provide anonymized, redacted discovery evidence used in the validation pack.

Rules used:
- No names of private counterparties.
- No private commercial terms.
- No statement implying signed commitments unless publicly documented.
- Role + issuer/city type only.
- Every artifact includes: date window, redacted source type, evidence tier, confidence, redaction scope, and non-commitment disclaimer.

Artifact index:
- `EXT-VAL-001-city-cfo-followup.md`
- `EXT-VAL-002-advisor-channel-summary.md`
- `EXT-VAL-003-counsel-risk-framing.md`

## How to add artifact #4 safely

Before adding `EXT-VAL-004-*`, confirm all items below:
- Backing source exists (real note/email/transcript) and can be retained privately for audit.
- Artifact header includes:
  - `artifact_id`
  - evidence tier (`public precedent` or `internal/reconstructed` or `inferred`)
  - confidence
  - date window (not exact identifying timestamps unless public)
  - redacted source type
  - redaction scope
  - non-commitment disclaimer
- Content includes role + issuer/city type only (no private names, terms, or counterparties).
- Product-change linkage is explicit and mapped in `validation-evidence-pack.md`.

Hard rule:
- Do not add unbacked artifacts. If source material cannot be substantiated, keep the slot empty and uncounted.
