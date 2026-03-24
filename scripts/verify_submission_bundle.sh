#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BUNDLE_PATH="$ROOT_DIR/artifacts/hedera_apex_judge_demo_bundle.json"

[[ -f "$BUNDLE_PATH" ]] || {
  echo "[verify] missing required artifact: artifacts/hedera_apex_judge_demo_bundle.json" >&2
  exit 1
}

node - <<'NODE' "$BUNDLE_PATH"
const fs = require("fs");

const [bundlePath] = process.argv.slice(2);
const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isTxHash(value) {
  return typeof value === "string" && /^(0x)?[0-9a-fA-F]{64}$/.test(value);
}

function isAddress(value) {
  return typeof value === "string" && /^(0x)?[0-9a-fA-F]{40}$/.test(value);
}

ensure(bundle.track === "hedera-apex", "bundle.track must equal hedera-apex");
ensure(bundle.requested_mode === "live", "bundle.requested_mode must equal live");
ensure(bundle.effective_mode === "live", "bundle.effective_mode must equal live");
ensure(bundle.coverage === "both", "bundle.coverage must equal both");

const flags = bundle.proof_flags || {};
ensure(flags.strict_live_passed === true, "proof_flags.strict_live_passed must equal true");
ensure(flags.hts_proof_present === true, "proof_flags.hts_proof_present must equal true");
ensure(flags.evm_proof_present === true, "proof_flags.evm_proof_present must equal true");
ensure(flags.lifecycle_native_only === true, "proof_flags.lifecycle_native_only must equal true");

const smokeResults = (((bundle.smoke || {}).results) || []);
ensure(Array.isArray(smokeResults) && smokeResults.length >= 2, "smoke.results must include hts and evm rows");
const hts = smokeResults.find((row) => row && row.mode === "hts");
const evm = smokeResults.find((row) => row && row.mode === "evm");
ensure(hts, "missing hts smoke row");
ensure(evm, "missing evm smoke row");
ensure(isTxHash(hts.deploy_tx_hash), "hts deploy tx hash missing/invalid");
ensure(isTxHash(evm.deploy_tx_hash), "evm deploy tx hash missing/invalid");
ensure(typeof hts.hts_token_id === "string" && hts.hts_token_id.trim() !== "", "hts token id missing");
ensure(isAddress(hts.hts_token_address), "hts token address missing/invalid");
ensure(isAddress(evm.evm_contract_address), "evm contract address missing/invalid");

const requiredSlots = bundle.required_slots || [];
ensure(Array.isArray(requiredSlots), "required_slots must be an array");
for (const key of ["hts_deploy_tx", "evm_deploy_tx", "hts_token_identifier", "evm_contract_address", "native_lifecycle_paths"]) {
  const slot = requiredSlots.find((entry) => entry && entry.slot === key);
  ensure(slot, `missing required slot: ${key}`);
  ensure(slot.attached === true, `required slot not attached: ${key}`);
}

console.log("[verify] submission bundle passed");
console.log(`[verify] bundle_path=${bundlePath}`);
console.log(`[verify] coverage=${bundle.coverage} requested_mode=${bundle.requested_mode} effective_mode=${bundle.effective_mode}`);
NODE

echo "[verify] done"
