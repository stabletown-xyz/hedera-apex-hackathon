# Hedera Apex Deck Outline

1. Problem: municipal financing workflows need transparent, auditable distribution tooling.
2. Product: Munus Lite on Stabletown control plane (sandbox challenge scope).
3. Workflow: offering docs -> disclosures -> allowlist -> purchase -> coupon -> transfer check.
4. Compliance posture: gated defaults, deterministic checks, audit/outbox by design.
5. Signer abstraction: `local_dev` and `aws_kms` for issuer action signing narrative.
6. Hedera fit: HTS-native + EVM-hybrid execution posture with reproducible strict-live proof path.
7. Validation evidence (strict conservative):
   - market size context: U.S. municipal issuance `$580.4B` (2025), `$4.3T` outstanding (2Q25) `[S1]`
   - public live precedent: Quincy blockchain-based muni issuance `[S2]`
   - institutional validation: MEAR purchased `$6.5M` (65%) of Quincy issue `[S3]`
   - Hedera technical fit: HTS-native controls + hybrid HTS/EVM posture `[S4]`
   - anonymized discovery matrix with explicit confidence tiers
   - feedback loop: concrete product changes made from discovery signals
8. Success model (assumptions, not traction claims):
   - issuer scenarios: `2 conservative / 3 base / 5 stretch`
   - offerings per issuer: `1.2` base
   - lifecycle action ranges per offering: core `8-12`, expanded `25-80`
9. Risk posture:
   - slow, credibility-led ramp
   - distribution/legal readiness as gating dependencies
   - no overclaim on liquidity, committed volume, or signed channel rights
10. Judge Q&A anchor responses:
    - traction vs assumptions
    - legal conservatism
    - distribution bottleneck and mitigation path
11. Slide-level citation markers for every hard claim (`[S1]..[S4]` in `deck-citation-footnotes.md`).
12. Buyer distribution roadmap: tranche model and selling-group expansion.
13. Post-hack plan: production hardening and legal/compliance activation path.
