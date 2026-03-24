# HashPack Retail Distribution Feasibility (Tier 1, Conservative)

Last updated: 2026-03-20

## Purpose
Document a judge-safe, non-overclaim posture for mentioning HashPack as a potential retail distribution layer in the Hedera Apex submission.

## Current observed capabilities in this repo
- Wallet activity and balance API surfaces exist:
  - `GET /api/v1/wallets/activity`
  - `GET /api/v1/wallets/balance`
- Investor wallet approval path exists:
  - `POST /api/v1/munus/offerings/:id/investors/:wallet/approve`
- SDK signing mode includes `external_wallet` as a supported mode for developer session/client metadata.

These are observable repo capabilities and can be cited as present-day evidence.

## Current gap (what is not implemented)
- No HashPack/HashConnect integration is wired into the operator frontend.
- No backend signer execution path currently routes live Munus chain submission through HashPack.
- Strict-live submission bundle proof does not currently include HashPack-signed transaction evidence.

## Tier classification
- Tier 1 (this change): messaging and evidence hygiene only.
  - Outcome: clear distribution-readiness narrative with explicit non-integration language.
  - Scope: docs and submission packaging only.
- Tier 2 (future): implemented wallet-connect path with signed transaction proof in strict-live bundle.
  - Outcome: observable integration-depth increase.
  - Scope: frontend wallet connect + backend execution path + strict-bundle proof fields/tests.

## Claim posture for judges
- Approved claim: HashPack is a candidate retail distribution layer for a future integration tier.
- Disallowed claim: HashPack is integrated/live in the current submission.

One-line phrasing:
- "HashPack is a candidate distribution layer in our Tier 2 roadmap; it is not a current integrated dependency in this submission."
