# Stabletown Events (Outbox)

Stabletown uses the **outbox pattern**:

* domain change + outbox insert happen inside the same DB transaction
* a background worker publishes pending outbox events
* consumers should assume at-least-once delivery (idempotent handling required)

## Envelope (all events)

All events must follow this envelope:

```json
{
  "event_id": "uuid",
  "type": "noun.verb",
  "tenant_id": "uuid",
  "program_id": "uuid-or-null",
  "actor": {"id": "uuid", "role": "program_admin"},
  "occurred_at": "2026-02-14T18:22:00Z",
  "idempotency_key": "string-or-null",
  "data": {}
}
```

### Envelope rules

* `tenant_id` always present
* `program_id` present when the event pertains to a specific program
* `actor` required for admin/system-triggered actions (nullable for pure connector events if truly unknown)
* `idempotency_key` required for money-adjacent events
* `data` contains only event-specific fields (no giant raw provider payloads)
* when tenant flag `cari_dvp_policy_metadata_enabled` is enabled, DvP-linked events may include additive `money_form_ref` and `settlement_intent_ref` maps in `data`

### Refactor contract note

Phase C workflow dispatcher extraction does not change outbox event names or envelope fields.
Legacy/V2 path selection is tracked via internal telemetry only and does not introduce new public outbox event types.

---

## Outbox delivery lifecycle (M3 baseline)

Outbox rows are persisted with delivery metadata and transition through:

* `pending` -> initial queued state
* `failed` -> publish attempt failed; row includes `attempt_count`, `last_attempt_at`, `next_retry_at`, and error summary
* `dead_lettered` -> max retry threshold reached; row includes `dead_lettered_at`
* `published` -> publish succeeded; row includes `published_at`

Retry behavior:

* Retry timing uses exponential backoff bounded by configured max backoff.
* Delivery state changes are written transactionally to `event_outbox`.
* Per-attempt telemetry is persisted to `event_outbox_attempts` with status, attempt count, error, and latency metadata.
* Events remain at-least-once semantics for downstream consumers.
* Operator replay controls (`POST /api/v1/ops/outbox/:id/requeue`,
  `POST /api/v1/ops/outbox/requeue-dead-lettered`) reset dead-lettered rows to
  `pending` as control-plane actions and do not emit extra domain events.

---

## Event catalog

## Merchant events

### merchant.invited

Emitted when a merchant invite is created.

**data**

* `merchant_id`
* `program_id`
* `status` (invited)

**idempotency_key pattern**

* `merchant.invited:<merchant_id>`

### merchant.approved

Emitted when a merchant is approved.

**data**

* `merchant_id`
* `approved_at`

**idempotency_key pattern**

* `merchant.approved:<merchant_id>`

### merchant.location_added

Emitted when a merchant location is created.

**data**

* `merchant_id`
* `location_id`
* `location_name`
* `status`

**idempotency_key pattern**

* `merchant.location_added:<location_id>`

### merchant.location_updated

Emitted when a merchant location is updated.

**data**

* `merchant_id`
* `location_id`
* `location_name`
* `status`

**idempotency_key pattern**

* `merchant.location_updated:<location_id>`

### merchant.terminal_registered

Emitted when a merchant terminal is registered.

**data**

* `terminal_id`
* `merchant_id`
* `location_id` (nullable)
* `terminal_ref`
* `device_type`
* `status`

**idempotency_key pattern**

* `merchant.terminal_registered:<terminal_id>`

### merchant.terminal_updated

Emitted when a merchant terminal profile is updated.

**data**

* `terminal_id`
* `merchant_id`
* `location_id` (nullable)
* `terminal_ref`
* `device_type`
* `status`

**idempotency_key pattern**

* `merchant.terminal_updated:<terminal_id>:<updated_at>`

### merchant.offline_payment_recorded

Emitted on first-time persistence of an offline payment sync request.

**data**

* `offline_payment_id`
* `merchant_id`
* `terminal_id`
* `client_payment_ref`
* `status` (`pending`)

**idempotency_key pattern**

* request `Idempotency-Key` value from `POST /api/v1/merchants/:id/offline-payments/sync`

### merchant.offline_payment_synced

Emitted when an offline payment finalizes as `synced`.

**data**

* `offline_payment_id`
* `merchant_id`
* `terminal_id`
* `client_payment_ref`
* `status` (`synced`)
* `attempt_count`
* `failure_reason` (nullable)
* `redemption_id`

**idempotency_key pattern**

* `merchant.offline_payment_synced:<offline_payment_id>:<attempt_count>`

### merchant.offline_payment_failed

Emitted when an offline payment finalizes as `failed`.

**data**

* `offline_payment_id`
* `merchant_id`
* `terminal_id`
* `client_payment_ref`
* `status` (`failed`)
* `attempt_count`
* `failure_reason`
* `redemption_id` (nullable)

**idempotency_key pattern**

* `merchant.offline_payment_failed:<offline_payment_id>:<attempt_count>`

### merchant.program_enrollment_requested

Emitted when enrollment is requested for a merchant/program pair.

**data**

* `enrollment_id`
* `merchant_id`
* `program_id`
* `status` (`pending`)

**idempotency_key pattern**

* `merchant.program_enrollment_requested:<enrollment_id>`

### merchant.program_enrollment_approved

Emitted when merchant program enrollment is approved.

**data**

* `enrollment_id`
* `merchant_id`
* `program_id`
* `status` (`approved`)
* `approved_at`

**idempotency_key pattern**

* `merchant.program_enrollment_approved:<enrollment_id>`

### merchant.pos_event_ingested

Emitted when a first-time provider-agnostic POS event is captured for a merchant.

**data**

* `merchant_id`
* `pos_event_id`
* `provider`
* `event_type`
* `dedupe_key`
* `provider_event_id` (nullable)
* `linked_redemption_id` (nullable)

**idempotency_key pattern**

* request `Idempotency-Key` value from `POST /api/v1/merchants/:id/pos-events`

### merchant.qr_payment_request_created

Emitted when a first-time merchant QR payment request is created and linked to canonical redemption initiation.

**data**

* `qr_payment_request_id`
* `merchant_id`
* `participant_id`
* `redemption_id`
* `amount_cents`
* `currency`
* `qr_token`
* `expires_at`

**idempotency_key pattern**

* request `Idempotency-Key` value from `POST /api/v1/merchants/:id/qr-payment-requests`

### merchant.pos_webhook_received

Emitted when a merchant POS provider webhook receipt is persisted.

**data**

* `pos_webhook_receipt_id`
* `integration_id`
* `merchant_id`
* `provider`
* `event_type`
* `signature_status` (`valid|invalid|skipped`)
* `status` (`processed|replayed|rejected|failed`)

**idempotency_key pattern**

* `merchant.pos_webhook.received:<pos_webhook_receipt_id>`

### merchant.pos_webhook_processed

Emitted when merchant POS webhook processing completes (first-pass or reprocess).

**data**

* `pos_webhook_receipt_id`
* `integration_id`
* `merchant_id`
* `provider`
* `event_type`
* `status` (`processed|replayed|rejected|failed`)
* `linked_pos_event_id` (nullable)
* `processing_error` (nullable)
* `reprocessed` (optional boolean; present for manual/system reprocess path)

**idempotency_key pattern**

* `merchant.pos_webhook.processed:<pos_webhook_receipt_id>`
* `merchant.pos_webhook.reprocessed:<pos_webhook_receipt_id>:<n>` (reprocess path)

---

## Chain/Custody events

### chain.profile_created

Emitted when a tenant chain profile is created.

**data**

* `chain_id`
* `profile_slug`
* `network`

### chain.profile_updated

Emitted when a chain profile is updated.

**data**

* `chain_id`

### chain.validators_updated

Emitted when validator set state is updated.

**data**

* `chain_id`
* `validator_count`

### chain.governance_updated

Emitted when governance policy state is updated.

**data**

* `chain_id`
* `governance`

### chain.connection_created

Emitted when a chain runtime connection profile is created.

**data**

* `chain_id`
* `connection_id`
* `network`
* `status`

### chain.tx_queued

Emitted when async dispatch mode queues a chain tx-intent before runtime submit.

**data**

* `tx_intent_id`
* `chain_id`
* `operation_type`
* `status` (`initiated`)
* `dispatch_status` (`queued`)

### chain.tx_submitted

Emitted when a chain transaction intent is submitted.

**data**

* `tx_intent_id`
* `chain_id`
* `operation_type`
* `status` (`submitted`)

Notes:

* Submit path no longer emits terminal outcomes.
* `chain.tx_confirmed` and `chain.tx_failed` are emitted asynchronously by the finality worker.
* Hedera CLI mode preserves normalized adapter metadata (`provider`, `operation_type`, `network`, `tx_hash`) so tx-intent, submission, and receipt records are traceable across deploy/control flows.

### chain.tx_dispatch_failed

Emitted when async dispatch reaches a terminal submit failure before finality polling.

**data**

* `tx_intent_id`
* `operation_type`
* `failure_reason`
* `status` (`failed`)

### chain.tx_confirmed

Emitted when chain transaction intent finalizes as confirmed.

**data**

* `tx_intent_id`
* `chain_id`
* `tx_hash`
* `status` (`confirmed`)

### chain.tx_failed

Emitted when chain transaction intent finalizes as failed.

**data**

* `tx_intent_id`
* `chain_id`
* `tx_hash`
* `status` (`failed`)
* `failure_reason`

### chain.bootstrap_completed

Emitted when a CityChain bootstrap run completes and summary output is persisted.

**data**

* `chain_id`
* `network`
* `status` (`completed`)
* `rpc_url`
* `evm_chain_id`
* `manifest_path`

### chain.evidence_attached

Emitted when a CityChain evidence record is attached for a bootstrap run.

**data**

* `chain_evidence_id`
* `chain_id`
* `chain_bootstrap_run_id`
* `slot`
* `explorer_url` (nullable)
* `screenshot_uri` (nullable)
* `reference`

### quest.created

Emitted when a CityChain quest is created.

**data**

* `quest_id`
* `program_id`
* `chain_id`
* `quest_type`
* `status`

### quest.attestation_issued

Emitted when quest evidence verification issues an attestation.

**data**

* `quest_id`
* `attestation_id`
* `participant_id`
* `status` (`issued`)

### quest.claim_submitted

Emitted when quest claim request is submitted and linked to a tx-intent.

**data**

* `quest_id`
* `claim_id`
* `participant_id`
* `tx_intent_id`
* `status` (`submitted|confirmed|failed`)

### quest.claim_confirmed

Emitted when a quest claim reaches confirmed finality.

**data**

* `quest_id`
* `claim_id`
* `participant_id`
* `tx_intent_id`
* `status` (`confirmed`)

### quest.claim_failed

Emitted when a quest claim reaches failed finality.

**data**

* `quest_id`
* `claim_id`
* `participant_id`
* `tx_intent_id`
* `status` (`failed`)
* `failure_reason`

### redemption.chain_settlement_submitted

Emitted when redemption chain settlement request is submitted and linked to a tx-intent.

**data**

* `redemption_id`
* `redemption_chain_settlement_id`
* `chain_id`
* `tx_intent_id`
* `status` (`submitted|confirmed|failed`)

### redemption.chain_settlement_confirmed

Emitted when redemption chain settlement reaches confirmed finality.

**data**

* `redemption_id`
* `redemption_chain_settlement_id`
* `chain_id`
* `tx_intent_id`
* `status` (`confirmed`)

### redemption.chain_settlement_failed

Emitted when redemption chain settlement reaches failed finality.

**data**

* `redemption_id`
* `redemption_chain_settlement_id`
* `chain_id`
* `tx_intent_id`
* `status` (`failed`)
* `failure_reason`

### chain.indexer_cursor_advanced

Emitted when a chain indexer cursor is advanced, optionally with indexed event inserts.

**data**

* `chain_id`
* `cursor_id`
* `cursor_name`
* `block_number` (nullable)
* `indexed_events_count`

### custody.signer_created

Emitted when a signer profile is created.

**data**

* `signer_id`
* `provider`
* `status`

### custody.kms_key_provisioned

Emitted when a signer gets an initial KMS key version and aliases are created.

**data**

* `signer_id`
* `key_version_id`
* `version`
* `key_reference` (alias `/current`)
* `kms_key_id`
* `kms_key_arn`

**idempotency_key pattern**

* `custody.kms_key_provisioned:<signer_id>:v<version>`

### custody.kms_key_rotated

Emitted when a signer KMS key is rotated via alias cutover.

**data**

* `signer_id`
* `key_version_id`
* `version`
* `key_reference` (alias `/current`)
* `kms_key_id`
* `kms_key_arn`

**idempotency_key pattern**

* `custody.kms_key_rotated:<signer_id>:v<version>`

### custody.sign_requested

Emitted when a signer job is requested and queued.

**data**

* `sign_job_id`
* `signer_id`
* `operation_type`
* `status` (`requested`)

### custody.sign_completed

Emitted when a signer job completes successfully.

**data**

* `sign_job_id`
* `signer_id`
* `operation_type`
* `status` (`signed`)
* `external_reference` (nullable)
* `metadata.provider_metadata` (when provider supplies correlation fields such as `aws_request_id`, `kms_key_id`, `kms_key_arn`, `signing_algorithm`)

### custody.sign_failed

Emitted when a signer job fails.

**data**

* `sign_job_id`
* `signer_id`
* `operation_type`
* `status` (`failed`)
* `failure_reason`

### custody.vault_created

Emitted when a custody vault is created.

**data**

* `vault_id`
* `name`
* `status`

### custody.policy_created

Emitted when a custody signing policy is created.

**data**

* `policy_id`
* `name`
* `enabled`
* `approval_required`

### custody.approval_requested

Emitted when a sign job enters approval-required flow.

**data**

* `approval_id`
* `sign_job_id`
* `status` (`pending`)
* `required_approvals`

### custody.approval_decided

Emitted when an approval request is approved or rejected.

**data**

* `approval_id`
* `sign_job_id`
* `decision` (`approve|reject`)
* `status`
* `decision_by_actor_id`

### custody.webhook_received

Emitted when a custody webhook receipt is persisted.

**data**

* `webhook_receipt_id`
* `provider`
* `event_type`
* `status`

---

## Embedded platform events

### embed.client_registered

Emitted when an embedded client is created.

**data**

* `embedded_client_id`
* `partner_organization_id`
* `name`
* `status`

### embed.config_saved

Emitted when embedded program config is created/updated.

**data**

* `program_embed_config_id`
* `embedded_client_id`
* `program_id`
* `status`

### embed.session_created

Emitted when an embed session is issued from partner API-key auth.

**data**

* `embed_session_id`
* `embedded_client_id`
* `program_id`
* `participant_id` (nullable)
* `partner_api_key_id`
* `status`

### embed.session_expired

Emitted when an embed session is explicitly expired.

**data**

* `embed_session_id`
* `embedded_client_id`
* `status`

### embed.webhook_subscription_saved

Emitted when embedded webhook subscription is created/updated.

**data**

* `embed_webhook_subscription_id`
* `embedded_client_id`
* `endpoint_url`
* `status`

---

## Developer platform events

### developer.app_created

Emitted when a developer app is created.

**data**

* `developer_app_id`
* `name`
* `status`

### developer.app_updated

Emitted when a developer app is updated.

**data**

* `developer_app_id`
* `status`

### developer.api_key_generated

Emitted when developer API key is generated.

**data**

* `developer_api_key_id`
* `developer_app_id`
* `key_name`
* `status`

### developer.api_key_revoked

Emitted when developer API key is revoked.

**data**

* `developer_api_key_id`
* `developer_app_id`
* `status`

### developer.sdk_session_created

Emitted when SDK session is created.

**data**

* `sdk_session_id`
* `developer_app_id`
* `program_id`
* `participant_id` (nullable)
* `signing_mode`
* `status`

### developer.sdk_session_expired

Emitted when SDK session is expired.

**data**

* `sdk_session_id`
* `developer_app_id`
* `status`

### SDK package scaffolding note (ST-027 deepening)

ST-027 package scaffolding (`sdk/packages/sdk`, `sdk/packages/react`) does not add new outbox event types.
It consumes the existing developer event set above and existing `/api/v1` domain endpoints.

---

## Ramp orchestration events

### ramp.provider_created

Emitted when ramp provider is created.

**data**

* `ramp_provider_id`
* `provider_code`
* `mode`
* `status`

### ramp.quote_requested

Emitted when ramp quote is requested.

**data**

* `ramp_quote_id`
* `ramp_provider_id`
* `quote_type`
* `status`

### ramp.fx_rate_captured

Emitted alongside quote request with captured FX context.

**data**

* `ramp_quote_id`
* `fx_rate`
* `source_currency`
* `destination_currency`

### ramp.quote_accepted

Emitted when quote is accepted.

**data**

* `ramp_quote_id`
* `ramp_provider_id`
* `quote_type`
* `status`

### ramp.order_initiated

Emitted when ramp order is created.

**data**

* `ramp_order_id`
* `ramp_provider_id`
* `order_type`
* `status`
* `amount_cents`
* `currency`

### ramp.order_completed

Emitted when ramp order reaches completed status.

**data**

* `ramp_order_id`
* `ramp_provider_id`
* `status` (`completed`)
* `provider_order_ref`

### ramp.order_failed

Emitted when ramp order reaches failed status.

**data**

* `ramp_order_id`
* `ramp_provider_id`
* `status` (`failed`)
* `failure_reason`

### ramp.slippage_policy_saved

Emitted when a ramp slippage/deviation policy is created or updated.

**data**

* `ramp_slippage_policy_id`
* `provider_id` (nullable for wildcard scope)
* `program_id` (nullable for wildcard scope)
* `max_slippage_bps`
* `max_fx_deviation_bps`
* `status`

### ramp.webhook_received

Emitted when a provider webhook receipt is persisted.

**data**

* `ramp_webhook_receipt_id`
* `ramp_provider_id`
* `provider_code`
* `event_type`
* `normalized_event_type`
* `signature_status`
* `status`

### ramp.webhook_processed

Emitted when webhook processing completes (with optional linked order update).

**data**

* `ramp_webhook_receipt_id`
* `ramp_provider_id`
* `normalized_event_type`
* `status`
* `ramp_order_id` (nullable)

### ramp.slippage_exceeded

Emitted when completion data breaches configured slippage/deviation thresholds.

**data**

* `ramp_order_id`
* `ramp_provider_id`
* `provider_order_ref`
* `slippage_bps`
* `max_slippage_bps`
* `fx_deviation_bps`
* `max_fx_deviation_bps`
* `failure_reason`

---

## Corridor settlement events

### corridor.created

Emitted when corridor is created.

**data**

* `corridor_id`
* `name`
* `status`

### corridor.policy_updated

Emitted when corridor configuration/policy is updated.

**data**

* `corridor_id`
* `status`

### corridor.settlement_window_opened

Emitted when corridor settlement window opens.

**data**

* `corridor_id`
* `window_id`
* `status`

### corridor.settlement_window_closed

Emitted when corridor settlement window closes.

**data**

* `corridor_id`
* `window_id`
* `status`

### corridor.settlement_initiated

Emitted when corridor settlement batch is created.

**data**

* `corridor_id`
* `window_id`
* `corridor_settlement_batch_id`
* `status`

### corridor.settlement_completed

Emitted when corridor settlement batch rollup reaches terminal completed state.

**data**

* `corridor_id`
* `window_id`
* `corridor_settlement_batch_id`
* `status`
* `total_obligation_count`
* `pending_obligation_count`
* `settled_obligation_count`
* `failed_obligation_count`
* `total_amount_cents`
* `pending_amount_cents`
* `settled_amount_cents`
* `failed_amount_cents`
* `failure_reason`

### corridor.settlement_failed

Emitted when corridor settlement batch rollup reaches terminal failed state.

**data**

* `corridor_id`
* `window_id`
* `corridor_settlement_batch_id`
* `status`
* `total_obligation_count`
* `pending_obligation_count`
* `settled_obligation_count`
* `failed_obligation_count`
* `total_amount_cents`
* `pending_amount_cents`
* `settled_amount_cents`
* `failed_amount_cents`
* `failure_reason`

---

## Interop events

### interop.protocol_upserted

Emitted when interop protocol is created/updated.

**data**

* `protocol_id`
* `name`
* `protocol_type`
* `status`

### interop.asset_policy_upserted

Emitted when interop asset canonicality policy is created/updated.

**data**

* `asset_policy_id`
* `asset_code`
* `home_chain_id`
* `mirror_mode`
* `allowed_destination_chain_ids`

### interop.route_planned

Emitted when route plan is created.

**data**

* `route_plan_id`
* `source_chain_id`
* `destination_chain_id`
* `protocol_id`

### interop.transfer_initiated

Emitted when transfer is initiated or retried into source-pending state.

**data**

* `transfer_id`
* `route_plan_id` (nullable on retry events)
* `status`
* `source_tx_intent_id`

### interop.transfer_policy_blocked

Emitted when transfer initiation is blocked by canonicality policy checks.

**data**

* `route_plan_id`
* `source_chain_id`
* `destination_chain_id`
* `amount_cents`
* `currency`
* `reason`
* `details`

### interop.hop_recorded

Emitted when an internal interop hop record is persisted (additive observability event).

**data**

* `interop_hop_id`
* `transfer_id`
* `hop_type`
* `status`
* `chain_id` (nullable)
* `tx_intent_id` (nullable)

### interop.checkpoint_recorded

Emitted when an internal interop checkpoint is persisted (additive observability event).

**data**

* `interop_checkpoint_id`
* `transfer_id`
* `checkpoint`
* `status`

### interop.source_confirmed

Emitted when source side confirms.

**data**

* `transfer_id`
* `status`

### interop.dest_confirmed

Emitted when destination side confirms and transfer completes.

**data**

* `transfer_id`
* `status`
* `dest_tx_intent_id`

### interop.message_stuck

Emitted when transfer transitions to stuck.

**data**

* `transfer_id`
* `status`

### interop.manual_intervention_required

Emitted when operator intervention is required.

**data**

* `transfer_id`
* `status`

### interop.transfer_failed

Emitted when transfer transitions to failed.

**data**

* `transfer_id`
* `status`
* `failure_reason`

### interop.webhook_received

Emitted when a protocol webhook receipt is persisted.

**data**

* `interop_webhook_receipt_id`
* `protocol_id`
* `event_type`
* `signature_status`

### interop.webhook_processed

Emitted when protocol webhook processing succeeds.

**data**

* `interop_webhook_receipt_id`
* `protocol_id`
* `event_type`
* `status` (`processed`)
* `transfer_id` (nullable)

### interop.webhook_failed

Emitted when protocol webhook processing fails.

**data**

* `interop_webhook_receipt_id`
* `protocol_id`
* `event_type`
* `status` (`failed`)
* `transfer_id` (nullable)
* `processing_error` (nullable)

Notes:

* `interop.hop_recorded` and `interop.checkpoint_recorded` are additive observability events and do not alter existing transfer state/event semantics.

---

## Participant events

### participant.enrolled

**data**

* `participant_id`
* `status`

**idempotency_key pattern**

* `participant.enrolled:<participant_id>`

### participant.eligibility_updated

**data**

* `participant_id`
* `eligibility_status`
* `eligibility_reason`

**idempotency_key pattern**

* `participant.eligibility_updated:<participant_id>`

### participant.suspended_by_admin

Emitted when an operator suspends a participant from admin workflows.

**data**

* `participant_id`
* `program_id`
* `status` (`suspended`)
* `manual_action_id`
* `action_type` (`suspend_participant`)
* `justification` (nullable)

**idempotency_key pattern**

* `participant.suspended_by_admin:<manual_action_id>`

### participant.reinstated_by_admin

Emitted when an operator reinstates a participant.

**data**

* `participant_id`
* `program_id`
* `status` (`enrolled`)
* `manual_action_id`
* `action_type` (`reinstate_participant`)
* `justification` (nullable)

**idempotency_key pattern**

* `participant.reinstated_by_admin:<manual_action_id>`

---

## Admin-operation events

### admin.merchant_settlement_initiated

Emitted when an operator triggers a merchant settlement execution via the admin console.

**data**

* `manual_action_id`
* `action_type` (`merchant_settlement_initiated`)
* `subject_type` (`merchant`)
* `subject_id` (merchant_id)
* `batch_id`
* `merchant_id`
* `status`

### admin.report_export_requested

Emitted when an operator requests a report export via the admin console.

**data**

* `manual_action_id`
* `action_type` (`report_export_requested`)
* `subject_type`
* `subject_id`
* `report_id`
* `template_id`
* `program_id` (nullable)

### manual_action.performed

Emitted whenever an admin manual action record is persisted.

**data**

* `manual_action_id`
* `action_type`
* `subject_type`
* `subject_id`
* `status`
* `justification` (nullable)

**idempotency_key pattern**

* `manual_action.performed:<manual_action_id>`

---

## Identity & compliance events

### identity.verification_requested

Emitted when participant verification is started.

**data**

* `identity_verification_id`
* `participant_id`
* `kyc_level`
* `status`

**idempotency_key pattern**

* `identity.verification_requested:<identity_verification_id>`

### eligibility.check_performed

Emitted when eligibility evaluation runs for a participant/program pair.

**data**

* `eligibility_check_id`
* `participant_id`
* `overall_result` (`pass|fail|manual_review`)
* `rule_results`

**idempotency_key pattern**

* `eligibility.check_performed:<eligibility_check_id>`

### compliance.screening_performed

Emitted when compliance screening is recorded.

**data**

* `screening_id`
* `participant_id`
* `screening_type`
* `result`

**idempotency_key pattern**

* `compliance.screening_performed:<screening_id>`

### compliance.watchlist_match_detected

Emitted when screening result is non-clear (`potential_match|confirmed_match`).

**data**

* `screening_id`
* `participant_id`
* `screening_type`
* `result`

**idempotency_key pattern**

* `compliance.watchlist_match_detected:<screening_id>`

### manual_review.required

Emitted when verification/eligibility/screening escalates to manual review.

**data**

* `manual_review_id`
* `participant_id`
* `source_type`
* `reason`

**idempotency_key pattern**

* `manual_review.required:<manual_review_id>`

### manual_review.completed

Emitted when manual review is approved/rejected.

**data**

* `manual_review_id`
* `participant_id`
* `status` (`approved|rejected`)
* `source_type`

**idempotency_key pattern**

* `manual_review.completed:<manual_review_id>`

### identity.webhook_received

Emitted when a provider webhook receipt is persisted.

**data**

* `identity_webhook_receipt_id`
* `provider`
* `event_type`
* `status`

**idempotency_key pattern**

* `identity.webhook.receipt:<identity_webhook_receipt_id>`

### identity.verification_updated_from_provider

Emitted when provider webhook processing updates participant verification state.

**data**

* `identity_webhook_receipt_id`
* `provider`
* `participant_id`

**idempotency_key pattern**

* `identity.webhook.processed:<identity_webhook_receipt_id>`

### compliance.screening_updated_from_provider

Emitted when provider webhook processing updates participant screening state.

**data**

* `identity_webhook_receipt_id`
* `provider`
* `participant_id`

**idempotency_key pattern**

* `identity.webhook.processed:<identity_webhook_receipt_id>`

### identity.consent_requested

Emitted when portability consent is requested for a source/target participant pair.

**data**

* `consent_id`
* `source_participant_id`
* `target_participant_id`
* `status` (`pending`)
* `expires_at` (nullable)

**idempotency_key pattern**

* `identity.consent_requested:<consent_id>`

### identity.consent_decided

Emitted when portability consent is approved or revoked.

**data**

* `consent_id`
* `source_participant_id`
* `target_participant_id`
* `status` (`approved|revoked`)
* `decision_reason` (nullable)

**idempotency_key pattern**

* `identity.consent_decided:<consent_id>`

### identity.merge_applied

Emitted when a controlled participant merge is applied from an approved consent.

**data**

* `merge_id`
* `consent_id`
* `source_participant_id`
* `target_participant_id`
* `status` (`applied`)

**idempotency_key pattern**

* `identity.merge_applied:<merge_id>`

---

## Adapter events

### adapter.provisioned

Emitted when an adapter instance is created.

**data**

* `adapter_id`
* `provider`
* `adapter_type`
* `status`

### adapter.health_check_failed

Emitted when a recorded health check marks adapter status as unhealthy.

**data**

* `adapter_id`
* `provider`
* `adapter_type`
* `error`

### adapter.deprecated

Emitted when adapter status transitions to deprecated.

**data**

* `adapter_id`
* `status` (`deprecated`)
* `deprecated_at`

---

## Orchestration events

### transaction.initiated

Emitted when a transaction intent is created.

**data**

* `transaction_id`
* `wallet_account_id`
* `participant_id`
* `transaction_type`
* `amount_cents`
* `currency`

---

## Reconciliation events

### reconciliation.run_started

**data**

* `run_id`
* `status` (`running`)

### reconciliation.run_completed

**data**

* `run_id`
* `status` (`completed` | `failed`)
* `summary`

### reconciliation.discrepancy_detected

**data**

* `run_id`
* `discrepancy_id`
* `discrepancy_type`
* `delta_cents`

### reconciliation.discrepancy_resolved

**data**

* `discrepancy_id`
* `run_id`
* `status` (`resolved`)
* `resolution_notes`

---

## Generic pilot onboarding events

ST-002 implementation is generic (opportunity-agnostic), so onboarding events are not city-namespaced.

### onboarding.session_started

**data**

* `session_id`
* `participant_id`
* `channel`
* `status` (`started`)

### onboarding.session_completed

**data**

* `session_id`
* `participant_id`
* `status` (`completed`)
* `completed_at`

### onboarding.session_abandoned

**data**

* `session_id`
* `participant_id`
* `status` (`abandoned`)
* `abandoned_at`
* `reason` (nullable)

---

## Integrations registry events

### integration.created

**data**

* `integration_id`
* `name`
* `integration_type`
* `status`
* `priority`

### integration.updated

**data**

* `integration_id`
* `status`
* `priority`

### integration.adapter_status_updated

**data**

* `adapter_status_id`
* `integration_id`
* `production_readiness_status`
* `test_coverage_percent` (nullable integer `0..100`)

### integration.dependency_added

**data**

* `dependency_id`
* `integration_id`
* `dependency_integration_id`
* `status`

### integration.dependency_updated

**data**

* `dependency_id`
* `integration_id`
* `dependency_integration_id`
* `status`

### grant.created

**data**

* `grant_id`
* `name`
* `ecosystem`
* `status`

### grant.updated

**data**

* `grant_id`
* `status`
* `application_deadline` (nullable ISO8601)

### grant.deadline_set

**data**

* `deadline_id`
* `grant_id`
* `deadline_type`
* `due_at` (nullable ISO8601)
* `status` (present for deadline updates)

### grant.eligibility_updated

**data**

* `eligibility_check_id`
* `grant_id`
* `status`
* `met`

---

## Relationship graph events

### relationship.node_created

**data**

* `node_id`
* `node_type`
* `display_name`

### relationship.edge_created

**data**

* `edge_id`
* `source_node_id`
* `target_node_id`
* `relationship_type`

### deal_thread.created

**data**

* `deal_thread_id`
* `stage`
* `name`

### deal_thread.updated

**data**

* `deal_thread_id`
* `stage`
* `status`

### graph.path_plan_computed

**data**

* `path_plan_id`
* `source_node_id`
* `target_node_id`
* `status` (`computed|no_path`)
* `hop_count`

### deal_thread.next_actions_generated

**data**

* `deal_thread_id`
* `recommendation_id`
* `algorithm_version`
* `count`

### touchpoint.logged

**data**

* `touchpoint_id`
* `touchpoint_type`
* `deal_thread_id` (nullable)
* `occurred_at`

---

## Template events

### template.created

**data**

* `template_id`
* `name`
* `category`
* `status`

### template.updated

**data**

* `template_id`
* `name`
* `category`
* `status`

### template.status_changed

**data**

* `template_id`
* `from_status`
* `to_status`

### template.version_created

**data**

* `template_version_id`
* `template_id`
* `version_no`
* `status` (`draft`)

### template.version_published

**data**

* `template_version_id`
* `template_id`
* `version_no`
* `status` (`published`)

### template.instantiated

**data**

* `template_id`
* `template_name`
* `program_id`
* `program_name`
* `template_version_id` (nullable)
* `template_version_no` (nullable)

---

## Partner portal events

### partner.organization_saved

**data**

* `partner_organization_id`
* `organization_name`
* `status`

### partner.user_invited

**data**

* `partner_user_id`
* `email`
* `role`
* `status`

### partner.program_configuration_saved

**data**

* `program_configuration_id`
* `program_id`
* `configuration_version`

### partner.api_key_generated

**data**

* `partner_api_key_id`
* `key_name`
* `status`

### partner.api_key_revoked

**data**

* `partner_api_key_id`
* `key_name`
* `status`

### partner.ticket_created

**data**

* `partner_ticket_id`
* `issue_type`
* `priority`
* `status`

### partner.provider_profile_saved

**data**

* `partner_provider_profile_id`
* `wallet_adapter`
* `issuer_adapter`
* `liquidity_adapter`
* `orchestration_adapter`
* `custody_adapter`
* `issuer_transition_state`

### partner.program_provider_overrides_saved

**data**

* `program_provider_overrides_id`
* `program_id`
* `status`
* `wallet_adapter` (nullable)
* `issuer_adapter` (nullable)
* `liquidity_adapter` (nullable)
* `orchestration_adapter` (nullable)
* `custody_adapter` (nullable)

### partner.program_go_live_checklist_saved

**data**

* `program_go_live_checklist_id`
* `program_id`
* `status` (`not_started|in_progress|ready|blocked`)

### partner.program_munus_policy_saved

**data**

* `program_munus_policy_id`
* `program_id`
* `status` (`disabled|pilot_enabled|live_enabled|paused`)
* `activation_mode` (`partner_pilot|partner_production`)

### partner.program_munus_policy_live_enabled

**data**

* `program_munus_policy_id`
* `program_id`
* `status` (`live_enabled`)
* `activation_mode` (`partner_production`)

### partner.program_munus_readiness_checked

**data**

* `program_id`
* `status`
* `activation_mode`
* `ready` (boolean)
* `missing_capabilities` (list)

---

## Rules & campaign events

### rules.version_published

Emitted when a draft rule version is promoted to `published` (and any previously published version is retired).

**data**

* `ruleset_id`
* `rule_version_id`
* `version_number`
* `published_at`

### rules.evaluated

Emitted when a rules runtime evaluation is recorded with passing outcome.

**data**

* `evaluation_id`
* `ruleset_id`
* `rule_version_id`
* `source` (`test|manual|runtime`)
* `status` (`passed`)
* `failure_reason` (null)
* `action`

**idempotency_key pattern**

* `rules.evaluated:<evaluation_id>`

### rules.failed

Emitted when a rules runtime evaluation is recorded with failing outcome.

**data**

* `evaluation_id`
* `ruleset_id`
* `rule_version_id`
* `source` (`test|manual|runtime`)
* `status` (`failed`)
* `failure_reason`
* `action`

**idempotency_key pattern**

* `rules.failed:<evaluation_id>`

### rules.override_requested

Emitted when a manual rules override request is created.

**data**

* `override_id`
* `ruleset_id`
* `rule_evaluation_id` (nullable)
* `status` (`pending`)
* `reason`

**idempotency_key pattern**

* `rules.override_requested:<override_id>`

### rules.override_approved

Emitted when a pending rules override is approved.

**data**

* `override_id`
* `ruleset_id`
* `rule_evaluation_id` (nullable)
* `status` (`approved`)
* `reason`
* `approved_at`

**idempotency_key pattern**

* `rules.override_approved:<override_id>`

### campaign.started

**data**

* `campaign_id`
* `start_at`

### campaign.ended

**data**

* `campaign_id`
* `end_at`

---

## Value movement events

### reward.issued

**data**

* `reward_id`
* `participant_id`
* `campaign_id` (nullable)
* `source` (purchase|volunteer|event|admin_grant)
* `amount_cents`
* `currency`
* `metadata` (small, reviewed; e.g., `external_txn_id`, `external_event_id`, `activity`, `hours`, `pos_provider`, `receipt_id`, `partner`, `location`)

### reward.reversed

**data**

* `reward_id`
* `reason`

### redemption.initiated

**data**

* `redemption_id`
* `participant_id`
* `merchant_id`
* `location_id` (nullable)
* `amount_cents`
* `currency`
* `method`
* `metadata` (small, reviewed; e.g., `terminal_id`, `receipt_id`, `merchant_ref`, `note`)

### redemption.authorized

**data**

* `redemption_id`
* `participant_id`
* `merchant_id` (nullable)
* `location_id` (nullable)
* `authorization_code`
* `amount_cents`
* `currency`
* `metadata` (small, reviewed; e.g., `terminal_id`, `receipt_id`, `merchant_ref`, `note`)

### redemption.declined

**data**

* `redemption_id`
* `participant_id`
* `merchant_id` (nullable)
* `location_id` (nullable)
* `reason`

### voucher.granted

**data**

* `voucher_id`
* `program_id`
* `participant_id`
* `amount_cents`
* `remaining_cents`
* `currency`
* `grant_reason`
* `expires_at`
* `status`

### voucher.redeemed

**data**

* `voucher_id`
* `program_id`
* `participant_id`
* `amount_cents`
* `remaining_cents`
* `currency`
* `status`

### voucher.expired

**data**

* `voucher_id`
* `program_id`
* `participant_id`
* `remaining_cents`
* `expired_at`
* `status` (`expired`)

### voucher.extended

**data**

* `voucher_id`
* `program_id`
* `participant_id`
* `previous_expires_at`
* `new_expires_at`
* `status`

### points.earned

**data**

* `points_activity_id`
* `program_id`
* `participant_id`
* `activity_type`
* `activity_kind` (`earned`)
* `points_delta`
* `points_available`
* `currency`

### points.redeemed

**data**

* `points_activity_id`
* `program_id`
* `participant_id`
* `redemption_option_id`
* `activity_kind` (`redeemed`)
* `points_delta` (negative)
* `points_available`
* `currency`

### points.expired

**data**

* `points_activity_id`
* `program_id`
* `participant_id`
* `source_points_activity_id`
* `activity_kind` (`expired`)
* `points_delta` (negative)
* `expired_at`
* `currency`

### rail_policy_pack.updated

**data**

* `policy_pack_id`
* `status` (`active|inactive`)
* `caps`
* `windows`
* `redemption_constraints`

---

## Settlement events

Additive settlement-driver receipt/error metadata is emitted when tenant flag
`settlement_driver_runtime_enabled` is enabled for the executing tenant.
For `runtime_kind=cari`, execution additionally requires
`cari_dvp_policy_metadata_enabled` and `munus_deposit_token_rail_enabled`
for the same tenant.

### settlement.batch_computed

Emitted when a settlement compute run creates a batch and per-merchant line items.

**data**

* `batch_id`
* `settlement_window_id` (nullable)
* `period_start`
* `period_end`
* `currency`
* `rail`
* `total_cents`
* `merchant_items` (array)

  * `merchant_id`
  * `gross_cents`
  * `fees_cents`
  * `net_cents`
  * `redemption_count`

### settlement.batch_execution_started

Emitted when instruction orchestration begins for a batch.

**data**

* `batch_id`
* `status` (`processing`)
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)

### settlement.instruction_sent

Emitted when a settlement instruction is sent for execution.

**data**

* `instruction_id`
* `batch_id`
* `merchant_id`
* `method`
* `amount_cents`
* `currency`
* `status` (`sent`)
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)

### settlement.instruction_confirmed

Emitted when a settlement instruction confirms successfully.

**data**

* `instruction_id`
* `batch_id`
* `merchant_id`
* `status` (`confirmed`)
* `provider_reference`
* `failure_reason` (nullable)
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)
* `driver_error_code` (nullable additive metadata)
* `driver_retry_posture` (nullable additive metadata)
* `driver_receipt_refs` (optional additive metadata)

### settlement.instruction_failed

Emitted when a settlement instruction fails.

**data**

* `instruction_id`
* `batch_id`
* `merchant_id`
* `status` (`failed`)
* `provider_reference`
* `failure_reason`
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)
* `driver_error_code` (optional additive metadata)
* `driver_retry_posture` (optional additive metadata)
* `driver_receipt_refs` (optional additive metadata)

### settlement.instruction_retried

Emitted when a failed settlement instruction is retried.

**data**

* `instruction_id`
* `batch_id`
* `merchant_id`
* `status`
* `retry_count`
* `max_retries`
* `provider_reference`
* `failure_reason` (nullable)
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)
* `driver_error_code` (optional additive metadata)
* `driver_retry_posture` (optional additive metadata)
* `driver_receipt_refs` (optional additive metadata)

### settlement.batch_execution_completed

Emitted when instruction execution completes successfully.

**data**

* `batch_id`
* `status` (`paid`)
* `paid_item_count`
* `failed_item_count`

### settlement.batch_execution_failed

Emitted when instruction execution completes with failures.

**data**

* `batch_id`
* `status` (`failed`)
* `paid_item_count`
* `failed_item_count`

### settlement.window_opened

Emitted when a settlement window is created for a program.

**data**

* `window_id`
* `window_type` (`daily` | `weekly` | `on_demand`)
* `status` (`open`)
* `open_timestamp`
* `close_timestamp`
* `cutoff_time` (nullable)

### settlement.window_closed

Emitted when a settlement window transitions from `open` to `closed`.

**data**

* `window_id`
* `window_type`
* `status` (`closed`)
* `closed_at`

### settlement.batch_approved

**data**

* `batch_id`
* `status`
* `item_count`
* `total_cents`

### settlement.batch_paid

**data**

* `batch_id`
* `status` (`paid` | `failed`)
* `paid_item_count`
* `failed_item_count`

### settlement.item_paid

**data**

* `batch_id`
* `merchant_id`
* `net_cents`
* `payout_ref`

### settlement.item_failed

**data**

* `batch_id`
* `merchant_id`
* `net_cents`
* `failure_reason`

### settlement.retry_initiated

Emitted when failed settlement items are moved back to `pending_payout` and the batch returns to `approved`.

**data**

* `batch_id`
* `status` (`approved`)
* `retried_item_count`

---

## Case events

### case.opened

Emitted when an operator/support workflow opens a case.

**data**

* `case_id`
* `case_type` (`dispute` | `fraud` | `ops`)
* `subject_type`
* `subject_id`
* `status` (`open`)
* `priority`

### case.resolved

Emitted when a case transitions to `resolved`.

**data**

* `case_id`
* `status` (`resolved`)
* `resolved_at`
* `resolution_summary`

### case.escalated

Emitted when a case is escalated from an operator/support queue to a target queue.

**data**

* `case_id`
* `status` (`investigating` or existing in-progress status)
* `queue`
* `escalated_to_queue`
* `escalated_at`
* `escalation_reason`
* `auto_escalation` (boolean, present when generated by SLA-breach automation)

### case.message_added

Emitted when a threaded case message is persisted.

**data**

* `case_id`
* `case_message_id`
* `message_type` (`internal_note|participant_reply|merchant_reply|system_event`)
* `visibility` (`internal|external`)

### case.evidence_added

Emitted when case evidence metadata is attached.

**data**

* `case_id`
* `case_evidence_id`
* `evidence_type` (`document|image|link|log|other`)
* `storage_ref`

### fraud.flagged

Raised when risk heuristics or manual review identifies suspicious behavior.

**data**

* `case_id`
* `case_status` (`investigating` or existing in-progress fraud state)
* `subject_type` (`participant` | `merchant` | `redemption` | `reward` | `transaction` | `other`)
* `subject_id`
* `blocked_entity_id`
* `reason`

---

## Risk events

### risk.event_detected

Emitted for each persisted risk evaluation.

**data**

* `risk_event_id`
* `subject_type`
* `subject_id`
* `decision` (`allow` | `review` | `block`)
* `risk_score`
* `reason` (nullable)

### risk.transaction_blocked

Emitted when risk evaluation decision resolves to `block`.

**data**

* `risk_event_id`
* `subject_type`
* `subject_id`
* `decision` (`block`)
* `risk_score`
* `reason` (nullable)

### risk.entity_blocked

Emitted when an entity is newly added to the active tenant block list.

**data**

* `blocked_entity_id`
* `entity_type`
* `entity_id`
* `status` (`active`)
* `reason`

### risk.entity_unblocked

Emitted when an active blocked entity is released.

**data**

* `blocked_entity_id`
* `entity_type`
* `entity_id`
* `status` (`released`)
* `reason`

---

## Reporting events

### report.generated

Emitted when a synchronous report generation artifact is created.

**data**

* `report_id`
* `template_id`
* `template_code`
* `format` (`json` | `csv`)
* `artifact_uri`

### report.subscription_created

Emitted when an operator creates a report subscription.

**data**

* `subscription_id`
* `template_id`
* `program_id` (nullable)
* `status` (`active`)
* `delivery_channel` (`email` | `webhook` | `none`)

### report.subscription_deleted

Emitted when a report subscription is soft-deleted.

**data**

* `subscription_id`
* `template_id`
* `program_id` (nullable)
* `status` (`deleted`)
* `reason`

---

## Audit operations events

### audit.snapshot_created

Emitted when a state snapshot is captured.

**data**

* `snapshot_id`
* `program_id` (nullable)
* `status` (`captured`)
* `label`

### audit.snapshot_restored

Emitted when a captured snapshot is restored (dev/test gated).

**data**

* `snapshot_id`
* `program_id` (nullable)
* `status` (`restored`)
* `label`
* `reason`

### audit.compliance_package_created

Emitted when a compliance package artifact is generated.

**data**

* `compliance_package_id`
* `artifact_type` (`audit_export` | `snapshot_bundle`)
* `snapshot_id` (nullable)
* `artifact_uri`
* `status` (`generated`)

---

## Public measurement events

### public.dashboard_config_updated

Emitted when public dashboard configuration is created or updated.

**data**

* `dashboard_config_id`
* `status`
* `visibility`

### public.metric_snapshot_captured

Emitted when a public metric snapshot is captured.

**data**

* `metric_snapshot_id`
* `metric_type`
* `program_id` (nullable)
* `captured_at`

### public.dataset_released

Emitted when a public dataset release is published.

**data**

* `dataset_release_id`
* `status` (`released`)
* `snapshot_count`
* `suppression_applied`

---

## Munus guardrailed events (`munus.*`)

These events are emitted when the target program has an enabled Munus policy and guarded operations
pass readiness/compliance controls. Global feature flags remain optional override controls.

### munus.offering_created

**data**

* `offering_id`
* `offering_type`
* `status`

### munus.token_action_requested

**data**

* `token_action_id`
* `offering_id`
* `action_type`
* `status`

### munus.token_action_decided

**data**

* `token_action_id`
* `decision` (`approved` | `rejected`)
* `status`

### munus.bond_token_deploy_requested

Emitted when `POST /munus/offerings/:id/deploy-token` persists a new deployment request.

**data**

* `deployment_id`
* `offering_id`
* `canonical_mode` (`hts` | `evm`)
* `status` (`requested`)

### munus.offering_open_requested

Emitted when `POST /munus/offerings/:id/open` persists a new lifecycle request.

**data**

* `offering_id`
* `token_action_id`
* `status` (`pending_approvals`)

### munus.offering_close_requested

Emitted when `POST /munus/offerings/:id/close` persists a new lifecycle request.

**data**

* `offering_id`
* `token_action_id`
* `status` (`pending_approvals`)

### munus.token_action_submitted

Emitted when approval threshold is met and chain submission is created.

**data**

* `token_action_id`
* `decision` (`approved`)
* `status` (`submitted`)

Notes:

* For live Hedera runtime, token-action submissions are linked through `mn_chain_links` and finality transitions reconcile through `chain.tx_confirmed` / `chain.tx_failed`.

### munus.token_action_confirmed

Emitted when a submitted token action reaches confirmed chain finality.

**data**

* `token_action_id`
* `decision` (`approved`)
* `status` (`confirmed`)

### munus.token_action_failed

Emitted when submitted token action finality resolves to failed.

**data**

* `token_action_id`
* `decision` (`approved`)
* `status` (`failed`)

### munus.distribution_created

**data**

* `distribution_id`
* `offering_id`
* `participant_id`
* `amount_cents`
* `currency`
* `status`

### munus.transfer_control_created

**data**

* `transfer_control_id`
* `offering_id`
* `control_type`
* `control_value`
* `status`

### munus.custody_control_requested

Emitted when a custody-governed transfer control action (`freeze|unfreeze|seize|burn`) is requested.

**data**

* `transfer_control_id`
* `offering_id`
* `control_type`
* `control_value`
* `sign_job_id`
* `approval_required`
* `approval_status`

### munus.custody_control_executed

Emitted when a custody-governed control executes immediately via signer workflow.

**data**

* `transfer_control_id`
* `offering_id`
* `control_type`
* `sign_job_id`
* `approval_status`

### munus.offering_document_added

**data**

* `document_id`
* `offering_id`
* `document_type`
* `status`

### munus.disclosure_published

**data**

* `disclosure_id`
* `offering_id`
* `document_id` (nullable)
* `hcs_reference` (nullable)
* `status`

### munus.disclosure_acknowledged

**data**

* `acknowledgement_id`
* `offering_id`
* `disclosure_id`
* `investor_wallet`
* `status`

### munus.filing_preflight_failed

**data**

* `filing_id`
* `offering_id`
* `state` (`preflight_pending`)
* `preflight_errors`

### munus.filing_preflight_passed

**data**

* `filing_id`
* `offering_id`
* `state` (`preflight_passed`)

### munus.filing_submitted

**data**

* `filing_id`
* `offering_id`
* `filing_receipt_id`
* `state` (`submitted`)

### munus.filing_published

**data**

* `filing_id`
* `offering_id`
* `filing_confirmation_id`
* `state` (`published`)

### munus.filing_corrected

**data**

* `filing_id`
* `offering_id`
* `filing_confirmation_id`
* `state` (`corrected_or_amended`)
* `corrected_from_filing_id` (nullable)

### munus.financial_report_published

**data**

* `report_id`
* `offering_id`
* `reporting_period`
* `status`

### munus.material_event_recorded

**data**

* `material_event_id`
* `offering_id`
* `event_type`
* `status`

### munus.communication_sent

**data**

* `communication_id`
* `offering_id`
* `channel`
* `status`

### munus.transfer_restriction_created

**data**

* `transfer_restriction_id`
* `offering_id`
* `restriction_type`
* `status`

### munus.investor_approved

**data**

* `approval_id`
* `offering_id`
* `investor_wallet`
* `status`

### munus.purchase_recorded

**data**

* `purchase_id`
* `offering_id`
* `investor_wallet`
* `amount_cents`
* `currency`
* `status`

### munus.coupon_paid

**data**

* `coupon_payment_id`
* `offering_id`
* `coupon_ref`
* `amount_cents`
* `currency`
* `status`

### munus.transfer_checked

**data**

* `transfer_check_id`
* `offering_id`
* `decision` (`allowed` | `blocked`)
* `reason` (nullable)

Notes:

* Continuous-eligibility request payloads are persisted in MN-008 lineage metadata (`disclosure_history_record`, `confirmation`) rather than this transfer-check outbox payload.

### munus.policy_evaluated

Emitted when a subscribe/transfer intent is evaluated against published tranche policy and terms.

**data**

* `policy_evaluation_id`
* `offering_id`
* `action` (`subscribe_intent` | `transfer_intent`)
* `status` (`approved` | `blocked` | `review_required`)
* `reason_codes` (includes continuous-eligibility and token-form deterministic reason codes when policy mode is `advisory|enforce`)
* `policy_version_id`

Notes:

* `continuous_eligibility_outcome` and `token_form_outcome` are persisted in policy/disclosure artifacts and response payloads; outbox payload remains compact and reason-code-centric.

### munus.suitability_flags_evaluated

Emitted when MN-008 suitability/tax flags are persisted for a policy intent or money-adjacent execution.

**data**

* `suitability_flag_set_id`
* `offering_id`
* `action_type` (`subscribe_intent` | `transfer_intent` | `purchase` | `coupon_payment` | `transfer_check`)

### munus.disclosure_history_recorded

Emitted when MN-008 disclosure-history lineage is recorded.

**data**

* `disclosure_history_record_id`
* `offering_id`
* `action_type` (`subscribe_intent` | `transfer_intent` | `purchase` | `coupon_payment` | `transfer_check`)

### munus.confirmation_recorded

Emitted when MN-008 confirmation artifact is recorded for a money-adjacent Munus write.

**data**

* `confirmation_id`
* `offering_id`
* `action_type` (`purchase` | `coupon_payment` | `transfer_check`)

### munus.reporting_export_generated

Emitted when a Munus export report is generated through the shared reporting backend.

**data**

* `report_id`
* `template_id`
* `status`
* `offering_id`
* `export_type` (`tax_lot_summary` | `registry_holders` | `disclosure_history` | `confirmation_history`)

### munus.venue_policy_applied

Emitted when a policy intent evaluation applies venue controls from program policy metadata.

**data**

* `policy_evaluation_id`
* `offering_id`
* `mode`
* `requested_mode` (nullable)
* `ats_risk_gate`

### munus.settlement_execution_started

Emitted when money-adjacent Munus flow starts settlement execution tracking.

**data**

* `source_type` (`purchase` | `coupon_payment`)
* `source_id`
* `requested_rail` (nullable)
* `selected_rail` (`fiat` | `stablecoin`, plus `deposit_token` when tenant flag `munus_deposit_token_rail_enabled` is enabled and settlement mode is `dual`)
* `policy_mode` (`fiat` | `stablecoin` | `dual`)
* `execution_mode`
* `finality_timeout_seconds`
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)

### munus.settlement_execution_completed

Emitted when settlement execution step completes for the source flow.

**data**

* `source_type`
* `source_id`
* `requested_rail` (nullable)
* `selected_rail`
* `policy_mode`
* `execution_mode`
* `finality_timeout_seconds`
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)

### munus.settlement_finality_confirmed

Emitted when settlement finality is confirmed for the source flow.

**data**

* `source_type`
* `source_id`
* `requested_rail` (nullable)
* `selected_rail`
* `policy_mode`
* `execution_mode`
* `finality_timeout_seconds`
* `money_form_ref` (optional, feature-flagged additive metadata)
* `settlement_intent_ref` (optional, feature-flagged additive metadata)

### munus.transfer_decision_recorded

**data**

* `offering_id`
* `transfer_check_id`
* `transfer_decision_id`
* `decision` (`approved` | `rejected`)
* `reason`
* `override_count`

### munus.transfer_decision_overridden

**data**

* `offering_id`
* `transfer_check_id`
* `transfer_decision_id`
* `decision` (`approved` | `rejected`)
* `reason`
* `override_count` (>= 1)

### munus.compliance_evidence_attached

**data**

* `offering_id`
* `transfer_check_id`
* `compliance_evidence_id`
* `evidence_type`
* `uri` (nullable)
* `checksum` (nullable)

### munus.corporate_action_announced

**data**

* `corporate_action_id`
* `offering_id`
* `action_type` (`coupon` | `call`)
* `status`
* `allocation_method` (`none` | `lottery` | `pro_rata`)

### munus.corporate_action_snapshot_captured

**data**

* `corporate_action_id`
* `offering_id`
* `snapshot_id`

### munus.corporate_action_allocated

**data**

* `corporate_action_id`
* `offering_id`
* `allocation_count`
* `total_allocated_cents`

### munus.corporate_action_executed

**data**

* `corporate_action_id`
* `offering_id`
* `action_type` (`coupon` | `call`)

### munus.corporate_action_reconciled

**data**

* `corporate_action_id`
* `variance_cents`

### munus.corporate_action_cancelled

**data**

* `corporate_action_id`
* `reason`

### munus.corporate_action_reversed

**data**

* `corporate_action_id`
* `reason`

---

## Versioning & compatibility

* Event types are stable; fields may be added over time.
* Do not remove or repurpose fields without a major version change.
* Consumers must ignore unknown fields.

## Generated Event Catalog (Drift Gate)
<!-- EVENT_CATALOG_BEGIN -->
- adapter.deprecated
- adapter.health_check_failed
- adapter.provisioned
- audit.compliance_package_created
- audit.snapshot_created
- audit.snapshot_restored
- case.escalated
- case.evidence_added
- case.message_added
- case.opened
- case.resolved
- chain.bootstrap_completed
- chain.connection_created
- chain.decision_class_changed
- chain.evidence_attached
- chain.governance_updated
- chain.indexer_cursor_advanced
- chain.profile_created
- chain.profile_updated
- chain.tx_dispatch_failed
- chain.tx_queued
- chain.tx_submitted
- chain.validators_updated
- compliance.screening_performed
- compliance.watchlist_match_detected
- corridor.created
- corridor.policy_updated
- corridor.settlement_initiated
- corridor.settlement_window_closed
- corridor.settlement_window_opened
- custody.approval_decided
- custody.approval_requested
- custody.policy_created
- custody.signer_created
- custody.vault_created
- custody.webhook_received
- deal_thread.created
- deal_thread.next_actions_generated
- deal_thread.updated
- developer.api_key_generated
- developer.api_key_revoked
- developer.app_created
- developer.app_updated
- developer.sdk_session_created
- developer.sdk_session_expired
- eligibility.check_performed
- embed.client_registered
- embed.config_saved
- embed.session_created
- embed.session_expired
- embed.webhook_subscription_saved
- fraud.flagged
- grant.created
- grant.deadline_set
- grant.eligibility_updated
- grant.updated
- graph.path_plan_computed
- identity.consent_decided
- identity.consent_requested
- identity.merge_applied
- identity.verification_requested
- identity.webhook_received
- integration.adapter_status_updated
- integration.created
- integration.dependency_added
- integration.dependency_updated
- integration.updated
- interop.asset_policy_upserted
- interop.checkpoint_recorded
- interop.dest_confirmed
- interop.hop_recorded
- interop.manual_intervention_required
- interop.message_stuck
- interop.protocol_upserted
- interop.route_planned
- interop.source_confirmed
- interop.transfer_failed
- interop.transfer_initiated
- interop.transfer_policy_blocked
- interop.webhook_received
- manual_action.performed
- manual_review.completed
- manual_review.required
- merchant.approved
- merchant.invited
- merchant.location_added
- merchant.location_updated
- merchant.offline_payment_recorded
- merchant.pos_event_ingested
- merchant.pos_webhook_processed
- merchant.pos_webhook_received
- merchant.program_enrollment_approved
- merchant.program_enrollment_requested
- merchant.qr_payment_request_created
- merchant.terminal_registered
- merchant.terminal_updated
- munus.bond_token_deploy_requested
- munus.communication_sent
- munus.compliance_evidence_attached
- munus.confirmation_recorded
- munus.corporate_action_allocated
- munus.corporate_action_announced
- munus.corporate_action_cancelled
- munus.corporate_action_executed
- munus.corporate_action_reconciled
- munus.corporate_action_reversed
- munus.corporate_action_snapshot_captured
- munus.coupon_paid
- munus.custody_control_executed
- munus.custody_control_requested
- munus.disclosure_acknowledged
- munus.disclosure_history_recorded
- munus.disclosure_published
- munus.distribution_created
- munus.filing_submitted
- munus.financial_report_published
- munus.investor_approved
- munus.material_event_recorded
- munus.offering_created
- munus.offering_document_added
- munus.policy_evaluated
- munus.purchase_recorded
- munus.registry_reconciliation_failed
- munus.registry_snapshot_created
- munus.suitability_flags_evaluated
- munus.token_action_requested
- munus.transfer_checked
- munus.transfer_control_created
- munus.transfer_restriction_created
- munus.venue_policy_applied
- onboarding.session_abandoned
- onboarding.session_completed
- onboarding.session_started
- participant.eligibility_updated
- participant.enrolled
- partner.api_key_generated
- partner.api_key_revoked
- partner.organization_saved
- partner.program_configuration_saved
- partner.program_go_live_checklist_saved
- partner.program_munus_policy_live_enabled
- partner.program_munus_policy_saved
- partner.program_munus_readiness_checked
- partner.program_provider_overrides_saved
- partner.provider_profile_saved
- partner.ticket_created
- partner.user_invited
- points.earned
- points.expired
- points.redeemed
- public.dashboard_config_updated
- public.dataset_released
- public.metric_snapshot_captured
- quest.attestation_issued
- quest.claim_submitted
- quest.created
- rail_policy_pack.updated
- ramp.fx_rate_captured
- ramp.order_completed
- ramp.order_failed
- ramp.order_initiated
- ramp.provider_created
- ramp.quote_accepted
- ramp.quote_requested
- ramp.slippage_exceeded
- ramp.slippage_policy_saved
- ramp.webhook_processed
- ramp.webhook_received
- reconciliation.discrepancy_detected
- reconciliation.discrepancy_resolved
- reconciliation.run_completed
- reconciliation.run_started
- redemption.authorized
- redemption.chain_settlement_submitted
- redemption.declined
- redemption.initiated
- relationship.edge_created
- relationship.node_created
- report.subscription_created
- report.subscription_deleted
- reward.issued
- risk.entity_blocked
- risk.entity_unblocked
- risk.event_detected
- risk.transaction_blocked
- rules.override_approved
- rules.override_requested
- rules.version_published
- settlement.batch_approved
- settlement.batch_computed
- settlement.batch_execution_started
- settlement.batch_paid
- settlement.instruction_retried
- settlement.instruction_sent
- settlement.retry_initiated
- settlement.window_closed
- settlement.window_opened
- template.created
- template.instantiated
- template.status_changed
- template.updated
- template.version_created
- template.version_published
- touchpoint.logged
- transaction.initiated
- voucher.expired
- voucher.extended
- voucher.granted
- voucher.redeemed
<!-- EVENT_CATALOG_END -->
