const BUNDLE_URL = new URL("../../artifacts/hedera_apex_judge_demo_bundle.json", import.meta.url);
const WORKFLOW_URL = new URL("./data/workflow.json", import.meta.url);

const REQUIRED_SLOTS = [
  "hts_deploy_tx",
  "evm_deploy_tx",
  "hts_token_identifier",
  "evm_contract_address",
  "native_lifecycle_paths"
];

const WORKFLOW_CARD_DEFS = [
  { key: "documents", title: "Offering bootstrap / document attachment" },
  { key: "disclosures", title: "Disclosure publication / signer-backed operation" },
  { key: "investor", title: "Investor approval + purchase" },
  { key: "transfer_check", title: "Transfer compliance check / decision" },
  { key: "coupon", title: "Coupon payment" },
  { key: "deployment", title: "Deployment / proof visibility" }
];

const state = {
  bundle: null,
  workflow: null,
  stepIndex: 0,
  personaId: null,
  offeringId: null
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function currentPersona() {
  return asArray(state.workflow?.personas).find((entry) => entry.id === state.personaId) || null;
}

function currentOffering() {
  return asArray(state.workflow?.offerings).find((entry) => entry.id === state.offeringId) || null;
}

function currentStep() {
  return asArray(state.workflow?.steps)[state.stepIndex] || null;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function buildTag(label, className) {
  const span = document.createElement("span");
  span.className = `tag ${className}`;
  span.textContent = label;
  return span;
}

function renderStepper() {
  const root = document.getElementById("stepper");
  root.innerHTML = "";

  asArray(state.workflow?.steps).forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `step-btn${index === state.stepIndex ? " active" : ""}`;
    button.textContent = step.title;
    button.addEventListener("click", () => {
      state.stepIndex = index;
      renderStepDetail();
      renderStepper();
    });
    root.appendChild(button);
  });
}

function renderStepDetail() {
  const root = document.getElementById("step-detail");
  const step = currentStep();
  const persona = currentPersona();
  const offering = currentOffering();

  if (!step) {
    root.innerHTML = "<h2>Step Details</h2><p>Missing step fixture data.</p>";
    return;
  }

  const highlights = asArray(step.highlights)
    .map((entry) => `<li>${entry}</li>`)
    .join("");

  root.innerHTML = `
    <h2>${step.title}</h2>
    <p>${step.description || ""}</p>
    <div class="tag-row" aria-label="truth labels"></div>
    <p><strong>Active persona:</strong> ${persona?.name || "n/a"}</p>
    <p><strong>Active offering:</strong> ${offering?.name || "n/a"}</p>
    <p><strong>Execution context:</strong> ${offering?.execution_context || "sandbox-scoped"}</p>
    <p><strong>Permissions lens:</strong> ${offering?.permissions || "guided read-through"}</p>
    <h3>What this step demonstrates</h3>
    <ul>${highlights}</ul>
  `;

  const tagRow = root.querySelector(".tag-row");
  const labels = asObject(state.workflow?.meta?.labels);
  tagRow.appendChild(buildTag(labels.guided || "Guided demo state", "guided"));
  tagRow.appendChild(buildTag(labels.proof || "Precomputed submission evidence", "proof"));
  tagRow.appendChild(buildTag(labels.walkthrough || "Non-destructive walkthrough", "walk"));
}

function workflowCardStatus(key, section) {
  if (key === "investor") {
    return `approval=${section.approval_status || "n/a"} | purchase=${section.purchase_status || "n/a"}`;
  }
  return `status=${section.status || "n/a"}`;
}

function renderWorkflowCards() {
  const root = document.getElementById("workflow-cards");
  root.innerHTML = "";

  const offering = currentOffering();
  const labels = asObject(state.workflow?.meta?.labels);

  WORKFLOW_CARD_DEFS.forEach((card) => {
    const section = asObject(offering?.[card.key]);
    const items = asArray(section.items);

    const article = document.createElement("article");
    article.className = "flow-card";

    const itemList = items.map((entry) => `<li>${entry}</li>`).join("");
    article.innerHTML = `
      <h3>${card.title}</h3>
      <p class="status-line">${workflowCardStatus(card.key, section)}</p>
      <div class="tag-row"></div>
      <p><strong>Demonstrates:</strong> ${section.demonstrates || card.title}</p>
      <ul>${itemList}</ul>
    `;

    const tagRow = article.querySelector(".tag-row");
    tagRow.appendChild(buildTag(labels.guided || "Guided demo state", "guided"));
    tagRow.appendChild(buildTag(labels.proof || "Precomputed submission evidence", "proof"));
    tagRow.appendChild(buildTag(labels.walkthrough || "Non-destructive walkthrough", "walk"));

    root.appendChild(article);
  });
}

function appendProofLink(root, label, url) {
  if (!url) return;

  const item = document.createElement("li");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noreferrer noopener";
  anchor.textContent = `${label} (Hashscan)`;
  item.appendChild(anchor);
  root.appendChild(item);
}

function renderDeploymentPanel() {
  const summary = document.getElementById("deployment-summary");
  const linksRoot = document.getElementById("proof-links");
  const smoke = asObject(state.bundle?.smoke);
  const links = asObject(state.bundle?.links);
  const results = asArray(smoke.results);
  const evidenceSummary = asObject(smoke.evidence_summary);

  const hts = results.find((entry) => entry.mode === "hts") || {};
  const evm = results.find((entry) => entry.mode === "evm") || {};

  summary.textContent = [
    `guided_demo_state=non_destructive`,
    `strict_live_mode=${state.bundle?.requested_mode || "n/a"}/${state.bundle?.effective_mode || "n/a"}`,
    `coverage=${state.bundle?.coverage || "n/a"}`,
    `deployment_row_status=${evidenceSummary.deployment_row_status || "n/a"}`,
    `tx_intent_present=${String(evidenceSummary.tx_intent_present === true)}`,
    `hts_deploy_execution_path=${hts.deploy_execution_path || "n/a"}`,
    `evm_deploy_execution_path=${evm.deploy_execution_path || "n/a"}`,
    `hts_token_id=${hts.hts_token_id || "n/a"}`,
    `evm_contract_address=${evm.evm_contract_address || "n/a"}`
  ].join("\n");

  linksRoot.innerHTML = "";
  appendProofLink(linksRoot, "HTS deploy tx", links?.hts?.deploy_tx);
  appendProofLink(linksRoot, "HTS open tx", links?.hts?.open_tx);
  appendProofLink(linksRoot, "HTS close tx", links?.hts?.close_tx);
  appendProofLink(linksRoot, "HTS token id", links?.hts?.token_id_url);
  appendProofLink(linksRoot, "HTS token address", links?.hts?.token_address_url);
  appendProofLink(linksRoot, "EVM deploy tx", links?.evm?.deploy_tx);
  appendProofLink(linksRoot, "EVM open tx", links?.evm?.open_tx);
  appendProofLink(linksRoot, "EVM close tx", links?.evm?.close_tx);
  appendProofLink(linksRoot, "EVM contract address", links?.evm?.contract_address_url);

  if (!linksRoot.firstChild) {
    const item = document.createElement("li");
    item.textContent = "No proof links found in bundle.";
    linksRoot.appendChild(item);
  }
}

function renderRoleHandoffs() {
  const root = document.getElementById("role-handoffs");
  root.innerHTML = "";

  asArray(state.workflow?.role_handoffs).forEach((entry) => {
    const card = document.createElement("article");
    card.className = "handoff";
    card.innerHTML = `
      <h3>${entry.role}</h3>
      <p><strong>What they look at:</strong> ${entry.what_to_look_at || "n/a"}</p>
      <p><strong>Decision/evidence:</strong> ${entry.decision_or_evidence || "n/a"}</p>
      <p><strong>Click next:</strong> ${entry.next_click || "n/a"}</p>
    `;
    root.appendChild(card);
  });
}

function renderWhatProves() {
  const root = document.getElementById("what-proves");
  root.innerHTML = "";

  asArray(state.workflow?.what_this_proves).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    root.appendChild(item);
  });
}

function renderProofFlags(flags) {
  const root = document.getElementById("flags");
  root.innerHTML = "";

  const rows = [
    { label: `strict_live_passed=${String(flags.strict_live_passed === true)}`, ok: flags.strict_live_passed === true },
    { label: `coverage_both=${String(flags.coverage_both === true)}`, ok: flags.coverage_both === true },
    { label: `hts_proof_present=${String(flags.hts_proof_present === true)}`, ok: flags.hts_proof_present === true },
    { label: `evm_proof_present=${String(flags.evm_proof_present === true)}`, ok: flags.evm_proof_present === true },
    { label: `lifecycle_native_only=${String(flags.lifecycle_native_only === true)}`, ok: flags.lifecycle_native_only === true }
  ];

  rows.forEach((row) => {
    const item = document.createElement("li");
    item.textContent = row.label;
    item.className = row.ok ? "good" : "bad";
    root.appendChild(item);
  });
}

function renderRequiredSlots(slots) {
  const root = document.getElementById("slots");
  root.innerHTML = "";

  const slotMap = new Map(asArray(slots).map((entry) => [entry.slot, entry]));

  REQUIRED_SLOTS.forEach((slot) => {
    const entry = asObject(slotMap.get(slot));
    const attached = entry.attached === true;

    const item = document.createElement("li");
    item.className = attached ? "good" : "bad";
    item.textContent = `${slot} attached=${String(attached)}`;

    if (entry.explorer_url) {
      item.appendChild(document.createTextNode(" — "));
      const link = document.createElement("a");
      link.href = entry.explorer_url;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
      link.textContent = "proof link";
      item.appendChild(link);
    }

    root.appendChild(item);
  });
}

function renderProofIntegrity() {
  const status = document.getElementById("status");
  const flags = asObject(state.bundle?.proof_flags);
  const requiredSlots = asArray(state.bundle?.required_slots);

  status.textContent = [
    `track=${state.bundle?.track || "n/a"}`,
    `mode=${state.bundle?.requested_mode || "n/a"}/${state.bundle?.effective_mode || "n/a"}`,
    `coverage=${state.bundle?.coverage || "n/a"}`,
    `generated_at=${state.bundle?.generated_at || "n/a"}`,
    `demo_state=guided_non_destructive`,
    `evidence_state=precomputed_submission_bundle`
  ].join("\n");

  renderProofFlags(flags);
  renderRequiredSlots(requiredSlots);
}

function bindSelectors() {
  const personaSelect = document.getElementById("persona-select");
  const offeringSelect = document.getElementById("offering-select");

  personaSelect.innerHTML = "";
  offeringSelect.innerHTML = "";

  asArray(state.workflow?.personas).forEach((persona) => {
    const option = document.createElement("option");
    option.value = persona.id;
    option.textContent = persona.name;
    personaSelect.appendChild(option);
  });

  asArray(state.workflow?.offerings).forEach((offering) => {
    const option = document.createElement("option");
    option.value = offering.id;
    option.textContent = offering.name;
    offeringSelect.appendChild(option);
  });

  personaSelect.value = state.personaId;
  offeringSelect.value = state.offeringId;

  personaSelect.addEventListener("change", (event) => {
    state.personaId = event.target.value;
    renderStepDetail();
  });

  offeringSelect.addEventListener("change", (event) => {
    state.offeringId = event.target.value;
    renderStepDetail();
    renderWorkflowCards();
  });
}

function renderAll() {
  bindSelectors();
  renderStepper();
  renderStepDetail();
  renderWorkflowCards();
  renderDeploymentPanel();
  renderRoleHandoffs();
  renderWhatProves();
  renderProofIntegrity();
}

function renderFatal(error) {
  const status = document.getElementById("status");
  status.textContent = `Failed to initialize guided demo\n${String(error)}`;
}

async function run() {
  try {
    const [bundle, workflow] = await Promise.all([fetchJson(BUNDLE_URL), fetchJson(WORKFLOW_URL)]);
    state.bundle = bundle;
    state.workflow = workflow;

    state.personaId = asArray(workflow.personas)[0]?.id || null;
    state.offeringId = asArray(workflow.offerings)[0]?.id || null;
    state.stepIndex = 0;

    renderAll();
  } catch (error) {
    renderFatal(error);
  }
}

run();
