# Hedera Apex Demo Script

Judge replication setup:
1. `cp .env.testnet.example .env.testnet.local`
2. Fill your own funded `STABLETOWN_HEDERA_PRIVATE_KEY`.
3. `./scripts/challenges/run_hedera_munus_judge_demo.sh --mode live --coverage both --full-reset`

1. Seed demo data:
   - `MIX_HOME=$PWD/.mix HEX_HOME=$PWD/.hex mix run scripts/challenges/seed_hedera_apex_demo.exs`
2. Show MN offering baseline:
   - `POST /api/v1/munus/offerings`
   - `GET /api/v1/munus/offerings/:id/dashboard`
3. Show disclosure + signer flow:
   - `POST /api/v1/custody/signers`
   - `POST /api/v1/munus/offerings/:id/disclosures`
4. Show buyer distribution controls:
   - `POST /api/v1/munus/offerings/:id/investors/:wallet/approve`
   - `POST /api/v1/munus/offerings/:id/purchases`
   - `POST /api/v1/munus/offerings/:id/transfers/check`
5. Show payout/coupon path:
   - `POST /api/v1/munus/offerings/:id/coupons/pay`
6. Final smoke check:
   - `./scripts/challenges/smoke_hedera_apex.sh`
7. Role handoff click-through in `/munus/offerings`:
   - Issuer Finance -> Municipal Advisor -> Issuer Admin -> Custody / Transfer Agent -> Auditor
8. Bundle verification:
   - `./scripts/verify_submission_bundle.sh`
   - Confirm `chainkit/out/hedera_apex_judge_demo_bundle.json` strict proof flags + required slots.

9. Close with conservative validation + success framing:
   - Observed: strict-live run artifacts + public market/precedent citations
   - Modeled: issuer/adoption/action assumptions (clearly labeled as assumptions)
   - No claim of signed distribution rights, committed pilot volume, or legal clearance unless publicly documented
