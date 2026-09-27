const form = document.querySelector("#settings-form");
const statusLine = document.querySelector("#settings-status");
const testButton = document.querySelector("#test-ollama");
const clearHistoryButton = document.querySelector("#clear-history");
const exportHistoryButton = document.querySelector("#export-history");
const refreshModelsButton = document.querySelector("#refresh-models");
const ollamaRuntimeFields = document.querySelector("#ollama-runtime-fields");
const apiRuntimeFields = document.querySelector("#api-runtime-fields");
const resetInstructionsButton = document.querySelector("#reset-instructions");
const resetLearningButton = document.querySelector("#reset-learning-memory");
const learningMemoryStatus = document.querySelector("#learning-memory-status");
const instructionsCount = document.querySelector("#instructions-count");
const enhancementCount = document.querySelector("#enhancement-count");
const extensionEnabledLabel = document.querySelector("#extension-enabled-label");
const hasExtensionRuntime = Boolean(globalThis.chrome?.runtime?.sendMessage);

const fields = {
  extensionEnabled: document.querySelector("#extension-enabled"),
  visionProvider: document.querySelector("#vision-provider"),
  ollamaBaseUrl: document.querySelector("#ollama-base-url"),
  modelProfile: document.querySelector("#model-profile"),
  ollamaModel: document.querySelector("#ollama-model"),
  apiVisionBaseUrl: document.querySelector("#api-vision-base-url"),
  apiVisionModel: document.querySelector("#api-vision-model"),
  apiVisionKey: document.querySelector("#api-vision-key"),
  customInstructions: document.querySelector("#custom-instructions"),
  promptEnhancementEnabled: document.querySelector("#prompt-enhancement-enabled"),
  promptEnhancementPreset: document.querySelector("#prompt-enhancement-preset"),
  promptCreativeDirection: document.querySelector("#prompt-creative-direction"),
  promptCreativeLatitude: document.querySelector("#prompt-creative-latitude"),
  promptEnhancementInstructions: document.querySelector("#prompt-enhancement-instructions"),
  promptLearningEnabled: document.querySelector("#prompt-learning-enabled")
};

const modelHelp = document.querySelector("#model-help");

const allProviderFields = [
  fields.ollamaBaseUrl,
  fields.ollamaModel,
  fields.apiVisionBaseUrl,
  fields.apiVisionModel,
  fields.apiVisionKey
];

const localDefaults = {
  extensionEnabled: true,
  visionProvider: "ollama",
  ollamaBaseUrl: "http://127.0.0.1:11434",
  modelProfile: "auto",
  ollamaModel: "qwen3.5:4b",
  apiVisionBaseUrl: "",
  apiVisionModel: "",
  apiVisionKey: "",
  customInstructions: "",
  promptEnhancementEnabled: true,
  promptEnhancementPreset: "professional",
  promptCreativeDirection: "contemporary_auto",
  promptCreativeLatitude: "directed",
  promptEnhancementInstructions: "",
  promptLearningEnabled: true
};

const creativeDirections = new Set([
  "source_match",
  "contemporary_auto",
  "cinematic_naturalism",
  "editorial_tension",
  "luxury_campaign",
  "direct_flash",
  "analog_tactile",
  "sculptural_product",
  "surreal_perspective",
  "documentary_realism"
]);
const creativeLatitudes = new Set(["strict", "directed", "exploratory"]);

allProviderFields.forEach((input) => {
  input.addEventListener("blur", () => validateField(input));
  input.addEventListener("input", () => {
    if (input.dataset.touched === "true") validateField(input);
  });
});

form.addEventListener("submit", saveSettings);
testButton.addEventListener("click", testOllama);
clearHistoryButton.addEventListener("click", clearHistory);
exportHistoryButton.addEventListener("click", exportHistory);
refreshModelsButton.addEventListener("click", () => discoverModels(true));
resetInstructionsButton.addEventListener("click", resetInstructions);
resetLearningButton.addEventListener("click", resetLearningMemory);
fields.customInstructions.addEventListener("input", updateInstructionsCount);
fields.promptEnhancementInstructions.addEventListener("input", updateEnhancementCount);
fields.promptEnhancementEnabled.addEventListener("change", applyEnhancementState);
fields.extensionEnabled.addEventListener("change", updateExtensionEnabledState);
fields.visionProvider.addEventListener("change", applyProviderState);
fields.modelProfile.addEventListener("change", applyModelProfile);
fields.ollamaModel.addEventListener("change", () => {
  fields.modelProfile.value = "custom";
  applyModelProfile();
});

loadSettings();

async function loadSettings() {
  const saveButton = form.querySelector('[type="submit"]');
  setButtonState(saveButton, "loading", "Loading");
  if (!hasExtensionRuntime) {
    applyConfig(localDefaults);
    setButtonState(saveButton, "default", "Save settings");
    showStatus("Standalone UI preview · vision-provider calls are disabled.", "default");
    return;
  }

  const response = await chrome.runtime.sendMessage({ type: "PROMPIT_GET_CONFIG" });
  if (response?.ok === false) {
    showStatus(response.error, "error");
    setButtonState(saveButton, "error", "Save settings");
    return;
  }
  applyConfig(response || localDefaults);
  if (fields.visionProvider.value !== "api") await discoverModels(false);
  setButtonState(saveButton, "default", "Save settings");
}

function applyConfig(config) {
  fields.extensionEnabled.checked = config.extensionEnabled !== false;
  fields.visionProvider.value = ["ollama", "api", "auto"].includes(config.visionProvider)
    ? config.visionProvider
    : localDefaults.visionProvider;
  fields.ollamaBaseUrl.value = config.ollamaBaseUrl || localDefaults.ollamaBaseUrl;
  fields.modelProfile.value = config.modelProfile === "auto" ? "auto" : "custom";
  setModelOptions([], config.ollamaModel || localDefaults.ollamaModel);
  fields.apiVisionBaseUrl.value = config.apiVisionBaseUrl || "";
  fields.apiVisionModel.value = config.apiVisionModel || "";
  fields.apiVisionKey.value = config.apiVisionKey || "";
  fields.customInstructions.value = config.customInstructions || "";
  fields.promptEnhancementEnabled.checked = config.promptEnhancementEnabled !== false;
  fields.promptEnhancementPreset.value = ["professional", "premium_ad"].includes(config.promptEnhancementPreset)
    ? config.promptEnhancementPreset
    : localDefaults.promptEnhancementPreset;
  fields.promptCreativeDirection.value = creativeDirections.has(config.promptCreativeDirection)
    ? config.promptCreativeDirection
    : localDefaults.promptCreativeDirection;
  fields.promptCreativeLatitude.value = creativeLatitudes.has(config.promptCreativeLatitude)
    ? config.promptCreativeLatitude
    : localDefaults.promptCreativeLatitude;
  fields.promptEnhancementInstructions.value = config.promptEnhancementInstructions || "";
  fields.promptLearningEnabled.checked = config.promptLearningEnabled !== false;
  applyProviderState();
  updateExtensionEnabledState();
  applyEnhancementState();
  updateInstructionsCount();
  updateEnhancementCount();
  updateLearningMemoryStatus();
}

async function saveSettings(event) {
  event?.preventDefault();
  const button = form.querySelector('[type="submit"]');
  if (!hasExtensionRuntime) {
    setButtonState(button, "default", "Save settings");
    showStatus("Load Promp it as an unpacked extension to save vision settings.", "default");
    return false;
  }
  if (!validateFields()) {
    setButtonState(button, "error", "Check fields");
    showStatus(providerValidationMessage(), "error");
    return false;
  }

  setButtonState(button, "loading", "Saving");
  showStatus("", "default");
  const config = readConfig();
  const response = await chrome.runtime.sendMessage({
    type: "PROMPIT_SAVE_CONFIG",
    config
  });
  if (response?.ok) {
    setButtonState(button, "success", "Saved");
    showStatus(!config.extensionEnabled
      ? "Promp it is off. Its website controls and right-click actions are disabled until you turn it on again."
      : fields.visionProvider.value === "ollama"
      ? "Local Ollama settings saved in this browser profile."
      : "Vision provider settings saved in this browser profile.", "success");
    window.setTimeout(() => setButtonState(button, "default", "Save settings"), 2200);
    return true;
  }

  setButtonState(button, "error", "Save failed");
  showStatus(response?.error || "Promp it could not save the vision settings.", "error");
  return false;
}

async function testOllama() {
  if (!hasExtensionRuntime) {
    showStatus("Load Promp it as an unpacked extension to test the selected vision runtime.", "default");
    return;
  }
  if (!validateFields()) {
    setButtonState(testButton, "error", "Check fields");
    showStatus(providerValidationMessage(), "error");
    return;
  }

  const saved = await saveSettings();
  if (!saved) return;
  setButtonState(testButton, "loading", "Testing");
  showStatus(fields.visionProvider.value === "api" ? "Contacting the vision API…" : "Contacting the selected vision runtime…", "default");
  const response = await chrome.runtime.sendMessage({ type: "PROMPIT_TEST_VISION_PROVIDER" });
  if (response?.ok) {
    setButtonState(testButton, "success", "Connected");
    showStatus(response.message || "The selected vision runtime is ready.", "success");
    window.setTimeout(() => setButtonState(testButton, "default", "Test vision runtime"), 2400);
    return;
  }
  setButtonState(testButton, "error", "Test failed");
  showStatus(response?.error || "Promp it could not reach the selected vision runtime.", "error");
}

async function clearHistory() {
  if (!hasExtensionRuntime) {
    showStatus("Load Promp it as an unpacked extension to manage local history.", "default");
    return;
  }
  setButtonState(clearHistoryButton, "loading", "Clearing");
  const response = await chrome.runtime.sendMessage({ type: "PROMPIT_CLEAR_HISTORY" });
  if (response?.ok) {
    setButtonState(clearHistoryButton, "success", "History cleared");
    showStatus("Local prompt history has been removed.", "success");
    window.setTimeout(() => setButtonState(clearHistoryButton, "default", "Clear local history"), 2200);
    return;
  }
  setButtonState(clearHistoryButton, "error", "Clear failed");
  showStatus(response?.error || "Promp it could not clear local history.", "error");
}

async function exportHistory() {
  if (!hasExtensionRuntime) {
    showStatus("Load Promp it as an unpacked extension to export local history.", "default");
    return;
  }
  setButtonState(exportHistoryButton, "loading", "Building ZIP");
  showStatus("Preparing image, prompt, and JSON files…", "default");
  const response = await chrome.runtime.sendMessage({ type: "PROMPIT_EXPORT_HISTORY" });
  if (response?.ok) {
    setButtonState(exportHistoryButton, "success", "ZIP exported");
    const missing = response.missingImages
      ? ` ${response.missingImages} older entr${response.missingImages === 1 ? "y has" : "ies have"} no stored image.`
      : "";
    showStatus(`${response.entries} history entr${response.entries === 1 ? "y" : "ies"} packed into ${response.archiveName || "the history ZIP"}.${missing}`, "success");
    window.setTimeout(() => setButtonState(exportHistoryButton, "default", "Export history ZIP"), 2600);
    return;
  }
  setButtonState(exportHistoryButton, "error", "Export failed");
  showStatus(response?.error || "Promp it could not export local history.", "error");
}

function readConfig() {
  return {
    extensionEnabled: fields.extensionEnabled.checked,
    visionProvider: fields.visionProvider.value,
    ollamaBaseUrl: fields.ollamaBaseUrl.value.trim(),
    modelProfile: fields.modelProfile.value,
    ollamaModel: fields.ollamaModel.value.trim(),
    apiVisionBaseUrl: fields.apiVisionBaseUrl.value.trim(),
    apiVisionModel: fields.apiVisionModel.value.trim(),
    apiVisionKey: fields.apiVisionKey.value.trim(),
    customInstructions: fields.customInstructions.value.trim(),
    promptEnhancementEnabled: fields.promptEnhancementEnabled.checked,
    promptEnhancementPreset: fields.promptEnhancementPreset.value,
    promptCreativeDirection: fields.promptCreativeDirection.value,
    promptCreativeLatitude: fields.promptCreativeLatitude.value,
    promptEnhancementInstructions: fields.promptEnhancementInstructions.value.trim(),
    promptLearningEnabled: fields.promptLearningEnabled.checked
  };
}

function updateExtensionEnabledState() {
  extensionEnabledLabel.textContent = fields.extensionEnabled.checked ? "Enabled" : "Off";
}

async function updateLearningMemoryStatus() {
  if (!hasExtensionRuntime) {
    learningMemoryStatus.textContent = "Learns generalized art-direction preferences from prompts you copy. Stored only on this device.";
    return;
  }
  const response = await chrome.runtime.sendMessage({ type: "PROMPIT_GET_LEARNING_MEMORY" });
  const count = Number(response?.memory?.acceptedCount) || 0;
  learningMemoryStatus.textContent = count
    ? `${count} accepted prompt${count === 1 ? "" : "s"} learned locally. Memory stays a soft preference and never overrides image evidence.`
    : "No accepted prompts learned yet. Copy a generated prompt to teach generalized art-direction preferences.";
}

async function resetLearningMemory() {
  if (!hasExtensionRuntime) return;
  setButtonState(resetLearningButton, "loading", "Resetting");
  const response = await chrome.runtime.sendMessage({ type: "PROMPIT_RESET_LEARNING" });
  if (!response?.ok) {
    setButtonState(resetLearningButton, "error", "Reset failed");
    showStatus(response?.error || "Promp it could not reset local learning memory.", "error");
    return;
  }
  setButtonState(resetLearningButton, "success", "Memory reset");
  await updateLearningMemoryStatus();
  showStatus("Local prompt preference memory reset.", "success");
  window.setTimeout(() => setButtonState(resetLearningButton, "default", "Reset memory"), 1800);
}

function applyProviderState() {
  const provider = fields.visionProvider.value;
  const apiOnly = provider === "api";
  const showApi = provider !== "ollama";
  ollamaRuntimeFields.hidden = apiOnly;
  apiRuntimeFields.hidden = !showApi;
  [fields.ollamaBaseUrl, fields.modelProfile, fields.ollamaModel, refreshModelsButton].forEach((field) => {
    field.disabled = apiOnly;
    field.setAttribute("aria-disabled", String(apiOnly));
  });
  [fields.apiVisionBaseUrl, fields.apiVisionModel, fields.apiVisionKey].forEach((field) => {
    field.disabled = !showApi;
    field.setAttribute("aria-disabled", String(!showApi));
  });
  testButton.querySelector("span:last-child").textContent = "Test vision runtime";
  if (provider === "api") {
    modelHelp.textContent = "Ollama is kept as a saved local option. The external API will receive selected pixels when you analyze an image.";
  } else if (provider === "auto") {
    modelHelp.textContent = "Ollama runs first. If it is unavailable, Promp it automatically uses the configured external vision API fallback.";
  } else {
    applyModelProfile();
  }
}

function activeRequiredFields() {
  if (fields.visionProvider.value === "api") {
    return [fields.apiVisionBaseUrl, fields.apiVisionModel, fields.apiVisionKey];
  }
  if (fields.visionProvider.value === "auto") {
    const apiReady = fields.apiVisionBaseUrl.value.trim() && fields.apiVisionModel.value.trim() && fields.apiVisionKey.value.trim();
    return apiReady ? [fields.ollamaBaseUrl, fields.ollamaModel, fields.apiVisionBaseUrl, fields.apiVisionModel, fields.apiVisionKey] : [fields.ollamaBaseUrl, fields.ollamaModel];
  }
  return [fields.ollamaBaseUrl, fields.ollamaModel];
}

function providerValidationMessage() {
  if (fields.visionProvider.value === "api") {
    return "Enter an API base URL, a vision-capable model, and its API key.";
  }
  if (fields.visionProvider.value === "auto") {
    return "Enter local Ollama details and complete the API fallback fields when you want automatic fallback.";
  }
  return "Enter the local Ollama URL and an installed local vision model.";
}

function applyModelProfile() {
  const profile = fields.modelProfile.value;
  if (profile === "auto") {
    modelHelp.textContent = `Automatic mode will use the strongest likely vision model detected. Current fallback: ${fields.ollamaModel.value || localDefaults.ollamaModel}.`;
  } else {
    modelHelp.textContent = `${fields.ollamaModel.value || localDefaults.ollamaModel} will be used for both vision analysis and optional prompt refinement.`;
  }
  validateField(fields.ollamaModel);
}

async function discoverModels(announce = true) {
  if (!hasExtensionRuntime) {
    if (announce) showStatus("Load Promp it as an unpacked extension to detect Ollama models.", "default");
    return;
  }
  if (!validateField(fields.ollamaBaseUrl)) {
    showStatus("Enter a valid local Ollama URL before detecting models.", "error");
    return;
  }

  setIconButtonState(refreshModelsButton, "loading", "Detecting installed Ollama models");
  modelHelp.textContent = "Reading installed models from local Ollama…";
  const response = await chrome.runtime.sendMessage({
    type: "PROMPIT_LIST_MODELS",
    ollamaBaseUrl: fields.ollamaBaseUrl.value.trim()
  });
  if (!response?.ok) {
    setIconButtonState(refreshModelsButton, "error", "Model detection failed");
    modelHelp.textContent = response?.error || "Promp it could not read the installed Ollama models.";
    if (announce) showStatus(modelHelp.textContent, "error");
    return;
  }

  const previous = fields.ollamaModel.value || localDefaults.ollamaModel;
  const likelyVision = response.models.filter((model) => model.visionLikely);
  const preferred = fields.modelProfile.value === "auto"
    ? likelyVision.find((model) => model.recommended)?.name || likelyVision[0]?.name || previous
    : previous;
  setModelOptions(response.models, preferred);
  setIconButtonState(refreshModelsButton, "success", "Installed models detected");
  const count = response.models.length;
  const visionCount = likelyVision.length;
  modelHelp.textContent = count
    ? `${count} installed model${count === 1 ? "" : "s"} detected · ${visionCount} likely vision-capable. Detection is name-based; test the selected model before analysis.`
    : "Ollama responded, but no installed models were returned. Pull a vision model, then detect again.";
  if (announce) showStatus(modelHelp.textContent, count ? "success" : "error");
  window.setTimeout(() => setIconButtonState(refreshModelsButton, "default", "Detect installed Ollama models"), 2200);
}

function setModelOptions(models, selectedModel) {
  const entries = Array.isArray(models) ? [...models] : [];
  const selected = String(selectedModel || localDefaults.ollamaModel);
  fields.ollamaModel.replaceChildren();
  if (!entries.some((model) => model.name === selected)) {
    entries.unshift({ name: selected, visionLikely: true, parameterSize: "", quantization: "", size: 0 });
  }
  entries.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.name;
    const details = [
      model.visionLikely ? "vision likely" : "vision unknown",
      model.parameterSize,
      model.quantization,
      formatBytes(model.size)
    ].filter(Boolean).join(" · ");
    option.textContent = `${model.name}${details ? ` — ${details}` : ""}`;
    fields.ollamaModel.append(option);
  });
  fields.ollamaModel.value = selected;
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (!bytes) return "";
  return `${(bytes / (1024 ** 3)).toFixed(bytes >= 10 * (1024 ** 3) ? 0 : 1)} GB`;
}

function applyEnhancementState() {
  const enabled = fields.promptEnhancementEnabled.checked;
  [
    fields.promptEnhancementPreset,
    fields.promptCreativeDirection,
    fields.promptCreativeLatitude,
    fields.promptEnhancementInstructions
  ].forEach((field) => {
    field.disabled = !enabled;
    field.setAttribute("aria-disabled", String(!enabled));
  });
}

function validateFields() {
  return activeRequiredFields().map(validateField).every(Boolean);
}

function resetInstructions() {
  fields.customInstructions.value = "";
  updateInstructionsCount();
  setButtonState(resetInstructionsButton, "success", "Reset");
  showStatus("Additional instructions reset. Save settings to apply the change.", "success");
  window.setTimeout(() => setButtonState(resetInstructionsButton, "default", "Reset"), 1800);
}

function updateInstructionsCount() {
  instructionsCount.textContent = `${fields.customInstructions.value.length} / 4000`;
}

function updateEnhancementCount() {
  enhancementCount.textContent = `${fields.promptEnhancementInstructions.value.length} / 2400`;
}

function validateField(input) {
  input.dataset.touched = "true";
  let valid = input.value.trim().length > 0;
  if (valid && input.type === "url") {
    try {
      const url = new URL(input.value.trim());
      valid = ["http:", "https:"].includes(url.protocol);
    } catch {
      valid = false;
    }
  }
  input.setAttribute("aria-invalid", String(!valid));
  input.dataset.state = valid ? "success" : "error";
  return valid;
}

function setButtonState(button, state, label) {
  button.dataset.state = state;
  button.disabled = state === "loading";
  const text = button.querySelector("span:last-child") || button;
  text.textContent = label;
}

function setIconButtonState(button, state, label) {
  button.dataset.state = state;
  button.disabled = state === "loading";
  button.setAttribute("aria-label", label);
}

function showStatus(message, tone) {
  statusLine.textContent = message;
  statusLine.dataset.tone = tone;
}
