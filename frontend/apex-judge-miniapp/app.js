const BUNDLE_URL = new URL("../../artifacts/hedera_apex_judge_demo_bundle.json", import.meta.url);
const REQUIRED_SLOTS = ["hts_deploy_tx", "evm_deploy_tx", "hts_token_identifier", "evm_contract_address", "native_lifecycle_paths"];

function renderList(id, rows) {
  const root = document.getElementById(id);
  root.innerHTML = "";
  for (const row of rows) {
    const item = document.createElement("li");
    item.textContent = row.label;
    item.className = row.ok ? "good" : "bad";
    root.appendChild(item);
  }
}

async function run() {
  const status = document.getElementById("status");
  try {
    const response = await fetch(BUNDLE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const bundle = await response.json();
    const flags = bundle.proof_flags || {};
    const slots = Array.isArray(bundle.required_slots) ? bundle.required_slots : [];
    const attached = new Set(slots.filter((slot) => slot && slot.attached).map((slot) => slot.slot));

    status.textContent = [
      `track=${bundle.track || "n/a"}`,
      `mode=${bundle.requested_mode || "n/a"}/${bundle.effective_mode || "n/a"}`,
      `coverage=${bundle.coverage || "n/a"}`,
      `generated_at=${bundle.generated_at || "n/a"}`
    ].join("\n");

    renderList("flags", [
      { label: `strict_live_passed=${String(flags.strict_live_passed === true)}`, ok: flags.strict_live_passed === true },
      { label: `hts_proof_present=${String(flags.hts_proof_present === true)}`, ok: flags.hts_proof_present === true },
      { label: `evm_proof_present=${String(flags.evm_proof_present === true)}`, ok: flags.evm_proof_present === true },
      { label: `lifecycle_native_only=${String(flags.lifecycle_native_only === true)}`, ok: flags.lifecycle_native_only === true }
    ]);

    renderList(
      "slots",
      REQUIRED_SLOTS.map((slot) => ({
        label: `${slot} attached=${String(attached.has(slot))}`,
        ok: attached.has(slot)
      }))
    );
  } catch (error) {
    status.textContent = `Failed to load bundle at ${BUNDLE_URL.href}\n${String(error)}`;
    renderList("flags", []);
    renderList("slots", []);
  }
}

run();
