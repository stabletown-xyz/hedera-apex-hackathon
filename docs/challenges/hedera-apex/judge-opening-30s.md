# Judge Opening Script (30 Seconds)

Use this as the spoken opener before running the strict-live gate.

## 30-second opener (verbatim)
"Stabletown Munus Lite demonstrates a compliance-first municipal workflow with reproducible strict-live proof. We anchor market context in publicly citable data: U.S. muni issuance reached $580.4B in 2025 with $4.3T outstanding in 2Q25 [S1]. We also anchor precedent: Quincy completed a live blockchain-based municipal bond issuance [S2], and Hedera gives us native token controls with hybrid HTS + EVM support [S4]. Our validation and success assumptions are conservative and clearly separated from observed evidence. HashPack is a candidate Tier 2 distribution path only, not an integrated dependency in this submission."

## Hard-claim citation usage
- Use `[S1]` when stating market size metrics.
- Use `[S2]` and `[S3]` when stating Quincy precedent and MEAR allocation.
- Use `[S4]` when stating Hedera HTS/native or hybrid HTS+EVM capability.
- Source mapping is maintained in `deck-citation-footnotes.md`.

## Wording guardrails (strict conservative)
- Say: "HashPack is a candidate Tier 2 distribution integration path."
- Do not say: "HashPack is integrated/live in this submission."
- Keep modeled assumptions explicitly labeled as assumptions, not traction.

## Transition line to proof execution
"Now I will run one command that generates strict-live evidence, verifies submission-grade bundle requirements, and confirms claim hygiene:"

```bash
./scripts/challenges/run_hedera_apex_submission_gate.sh
```
