# Success Model Appendix (Conservative)

- Last updated: 2026-03-20
- Posture: separate observed strict-live evidence from modeled adoption assumptions

## A) Observed strict-live evidence (not traction)

Observed source:
- `observed-strict-live-snapshot-2026-03-20.md`
- `chainkit/out/hedera_apex_judge_demo_bundle.json`

| Observed checkpoint | Value |
| --- | --- |
| Requested mode | `live` |
| Effective mode | `live` |
| Coverage | `both` |
| `strict_live_passed` | `true` |
| `hts_proof_present` | `true` |
| `evm_proof_present` | `true` |
| `lifecycle_native_only` | `true` |
| Required slots attached | `5/5` |
| Smoke rows confirmed | `2` (`hts`, `evm`) |

Observed interpretation boundary:
- This is technical rehearsal evidence only.
- It is not customer traction, revenue, or production usage volume.

## B) Modeled adoption assumptions (not observed)

Inputs:
- Issuers onboarded in 12 months:
  - conservative: `2`
  - base: `3`
  - stretch: `5`
- Offerings per issuer per year: `1.2` (base)
- Lifecycle actions per offering:
  - core: `8-12`
  - expanded realistic: `25-80`

Formula:
- `annual_offerings = issuers * offerings_per_issuer`
- `annual_actions = annual_offerings * actions_per_offering`

| Scenario | Issuers | Offerings/year | Actions/offering | Annual actions |
| --- | --- | --- | --- | --- |
| Conservative core | 2 | 2.4 | 8 | 19 |
| Base core | 3 | 3.6 | 10 | 36 |
| Stretch expanded | 5 | 6.0 | 25-80 | 150-480 |

Rounded values shown for judge readability.

## C) Hedera impact framing

- Observed strict-live evidence shows reproducible HTS + EVM execution and native lifecycle behavior.
- Modeled scenarios estimate potential account activity and transaction intent growth if pilots convert.
- All modeled values must be presented as assumptions, not traction claims.
