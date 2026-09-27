const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const requests = [];
const dynamicRuleUpdates = [];
const downloadRequests = [];
const contextMenuRequests = [];
const storageState = {};
const result = JSON.stringify({
  english: "Detailed English prompt",
  json: {
    subject: "subject",
    subject_details: "literal subject details",
    pose_expression: "frontal neutral pose",
    composition: "composition",
    spatial_layout: "subject centered in the focal plane",
    camera_angle: "eye-level frontal camera with no roll",
    perspective_geometry: "weak convergence and neutral depth compression",
    depth_of_field: "sharp subject with a softly blurred background",
    style: "style",
    lighting: "lighting",
    key_light: "large soft key from upper image-left",
    fill_ambient: "weak neutral frontal fill",
    rim_backlight: "none",
    shadow_behavior: "soft shadows toward lower image-right",
    exposure_color_temperature: "balanced neutral exposure",
    background: "plain neutral background",
    visible_text: "none",
    color_palette: ["blue"],
    materials: ["glass"],
    camera: "camera",
    mood: "mood",
    environment: "environment",
    typography: "none",
    negative_details: ["clutter"],
    negative_prompt: "wrong crop",
    generation_prompt_en: "English generation prompt",
    confidence_notes: "Visual estimate"
  }
});

const chrome = {
  runtime: {
    onInstalled: { addListener() {} },
    onStartup: { addListener() {} },
    onMessage: { addListener() {} },
    openOptionsPage: async () => {}
  },
  action: { onClicked: { addListener() {} } },
  contextMenus: {
    onClicked: { addListener() {} },
    removeAll(callback) { callback?.(); },
    create(options) { contextMenuRequests.push(options); }
  },
  declarativeNetRequest: {
    async updateDynamicRules(update) { dynamicRuleUpdates.push(update); }
  },
  storage: {
    local: {
      async get(key) {
        if (typeof key === "string") return { [key]: storageState[key] };
        if (Array.isArray(key)) return Object.fromEntries(key.map((name) => [name, storageState[name]]));
        return { ...storageState };
      },
      async set(value) { Object.assign(storageState, value); }
    }
  },
  downloads: {
    async download(options) {
      downloadRequests.push(options);
      return downloadRequests.length;
    }
  },
  tabs: {
    async sendMessage() {},
    async captureVisibleTab() { return "data:image/png;base64,"; }
  }
};

async function fetch(url, options = {}) {
  requests.push({ url, options });
  const requestBody = options.body ? JSON.parse(options.body) : {};
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    async text() {
      if (url.endsWith("/api/tags")) {
        return JSON.stringify({
          models: [{
            name: "qwen3.6:27b",
            model: "qwen3.6:27b",
            size: 16800000000,
            details: { parameter_size: "27B", quantization_level: "Q4_K_M" }
          }]
        });
      }
      if (url.includes("vision.example")) {
        return JSON.stringify({ choices: [{ message: { content: result } }] });
      }
      if (requestBody.format?.properties?.positive_prompt) {
        return JSON.stringify({
          message: {
            content: JSON.stringify({
              positive_prompt: "Professional high-fashion portrait with an eye-level frontal camera, neutral perspective compression, precise shallow focus, soft upper-left key light, controlled fill, crisp material response, and restrained editorial color grading.",
              negative_prompt: "wrong camera angle, harsh frontal flash, plastic skin",
              creative_direction: "Contemporary editorial tension preserves the source composition while making the lighting and finish production-specific.",
              style_decisions: [
                "Eye-level view keeps facial geometry neutral",
                "Soft upper-left key creates gradual cheek highlight falloff",
                "Restrained editorial color separates skin from background"
              ]
            })
          }
        });
      }
      return JSON.stringify({ message: { content: result } });
    }
  };
}

const context = vm.createContext({
  AbortController,
  URL,
  chrome,
  clearTimeout,
  console,
  crypto,
  fetch,
  setTimeout
});

const sourcePath = path.join(__dirname, "..", "background.js");
const source = fs.readFileSync(sourcePath, "utf8");
vm.runInContext(`${source}\n;globalThis.__prompit = { callOllama, callVisionAnalysis, retryOllamaAnalysis, repairAnalysisJson, refineOllamaAnalysis, enhanceAnalysisPrompt, isUsableRefinement, mergeAnalysisResults, composeGenerationPrompt, normalizeAnalysis, parseModelJson, sanitizeConfig, sanitizeHistory, sanitizePromptEdit, sanitizeNegativePrompt, sanitizeFocusedNegativePrompt, sanitizeConfidenceNotes, presentOllamaError, presentProviderError, syncOllamaOriginRule, setupContextMenus, actionModelMenuTitle, describeFrame, buildAnalysisPrompt, createOllamaChatPayload, getModelRuntime, resolveRuntimeConfig, sanitizeAnalysisFocus, sanitizePromptOptions, getFocusedSchema, tailorAnalysisToFocus, buildFocusDirective, buildVerificationAudit, buildTextHandlingDirective, applyPromptEnhancement, applyConfiguredPromptEnhancement, refinementLatitudeFromStrength, refinementDirective, sanitizeLearningMemory, classifyStyleSignals, buildLearningMemoryDirective, recordLearningSignal, formatPromptForPlatform, buildFluxPositiveConstraints, buildPlatformPromptStrategy, resolveCreativeDirection, sanitizeStyleDecisions, listOllamaModels, isLikelyVisionModel, exportHistory, updateHistoryPrompt, refineHistoryPrompt, randomizeHistoryPrompt, pickRandomModernStyle, classifyRandomStyleFamily, buildHistoryPromptFile, imageExtensionFromDataUrl, historyPromptKind, createZipArchive, dataUrlToBytes, base64ToBytes };`, context);

async function run() {
  const api = context.__prompit;
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));
  const contentSource = fs.readFileSync(path.join(__dirname, "..", "content.js"), "utf8");
  const contentStyles = fs.readFileSync(path.join(__dirname, "..", "content.css"), "utf8");
  const optionsSource = fs.readFileSync(path.join(__dirname, "..", "options.html"), "utf8");
  const optionsStyles = fs.readFileSync(path.join(__dirname, "..", "options.css"), "utf8");
  const themeTokens = fs.readFileSync(path.join(__dirname, "..", "tokens.css"), "utf8");
  const image = {
    base64: "aW1hZ2U=",
    dataUrl: "data:image/jpeg;base64,aW1hZ2U=",
    mimeType: "image/jpeg",
    width: 800,
    height: 1200
  };

  const text = await api.callOllama({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3-vl:8b",
    customInstructions: "Keep the finished English prompt under 220 words."
  }, image);
  assert.equal(api.normalizeAnalysis(text).english, "Detailed English prompt. Exclude: wrong crop.");
  assert.equal(api.normalizeAnalysis(text).json.subject, "subject");
  assert.equal(api.normalizeAnalysis(text).json.generation_prompt_en, "Detailed English prompt. Exclude: wrong crop.");
  assert.equal(api.sanitizeNegativePrompt("text, logos, text, watermarks, logos", "portrait"), "text, logos, watermarks");
  const consistent = api.normalizeAnalysis(JSON.stringify({
    english: "Frontal portrait with shallow depth of field, a softly blurred background, and visible text that reads HEAD. Exclude: shallow depth of field, blurry background, text overlay, 8K, multiple people.",
    json: { negative_prompt: "shallow depth of field, blurry background, text overlay, 8K, multiple people" }
  }));
  assert.equal(consistent.english, "Frontal portrait with shallow depth of field, a softly blurred background, and visible text that reads HEAD. Exclude: multiple people.");
  assert.equal(consistent.json.negative_prompt, "multiple people");
  const aliased = api.normalizeAnalysis(JSON.stringify({
    prompt: "Recovered aliased prompt",
    negative_prompt: "wrong crop"
  }));
  assert.equal(aliased.english, "Recovered aliased prompt. Exclude: wrong crop.");
  assert.throws(
    () => api.normalizeAnalysis('{"english":"","json":{}}'),
    (error) => error.code === "PROMPIT_INVALID_JSON"
  );

  const body = JSON.parse(requests[0].options.body);
  assert.equal(requests[0].url, "http://127.0.0.1:11434/api/chat");
  assert.equal(body.model, "qwen3-vl:8b");
  assert.equal(body.think, false);
  assert.equal(body.raw, true);
  assert.equal(body.options.temperature, 0);
  assert.equal(body.options.num_ctx, 8192);
  assert.equal(body.options.num_predict, 2600);
  assert.equal(body.format.type, "object");
  assert.equal(body.format.additionalProperties, false);
  assert.ok(body.format.required.includes("english"));
  assert.equal(body.format.required.includes("arabic"), false);
  assert.ok(body.format.properties.json.required.includes("camera_angle"));
  assert.equal("visible_text" in body.format.properties.json.properties, false);
  assert.equal(body.format.properties.json.required.includes("generation_prompt_ar"), false);
  assert.equal(body.messages[0].images[0], image.base64);
  assert.match(body.messages[0].content, /800 by 1200 pixels, approximately 2:3 portrait/);
  assert.match(body.messages[0].content, /report approximate elevation, level versus roll/);
  assert.match(body.messages[0].content, /Audit lighting from highlights/);
  assert.match(body.messages[0].content, /remove every contradiction/);
  assert.match(body.messages[0].content, /Keep the finished English prompt under 220 words/);
  assert.equal(body.messages[1].content, "<think>\n\n</think>\n\n");
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.equal(manifest.version, "1.10.13");
  assert.deepEqual(manifest.icons, {
    "16": "icons/prompit-16.png",
    "32": "icons/prompit-32.png",
    "48": "icons/prompit-48.png",
    "128": "icons/prompit-128.png"
  });
  assert.deepEqual(manifest.action.default_icon, manifest.icons);
  assert.equal(manifest.browser_specific_settings.gecko.id, "{d3b6a055-60c5-4c77-873e-441d73b6d27e}");
  assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required, ["websiteContent"]);
  assert.equal(manifest.browser_specific_settings.safari.strict_min_version, "16.4");
  assert.equal((contentSource.match(/role="tabpanel"/g) || []).length, 3);
  assert.match(contentSource, /data-setup-tab="focus"/);
  assert.match(contentSource, /data-setup-tab="output"/);
  assert.match(contentSource, /data-setup-tab="refine"/);
  assert.match(contentSource, /function onSetupTabKeydown/);
  assert.match(contentSource, /pi-result-editor/);
  assert.match(contentSource, /Select section/);
  assert.match(contentSource, /prompitLastPromptSetup/);
  assert.match(contentSource, /pi-page-scan/);
  assert.doesNotMatch(contentSource, /pi-preview__scan-wave/);
  assert.doesNotMatch(contentSource, /Scanning visual evidence/);
  assert.match(contentSource, /Refine prompt/);
  assert.match(contentSource, /Roll modern/);
  assert.match(contentSource, /pi-result-dice/);
  assert.match(contentSource, /Roll a tailored modern prompt direction/);
  assert.match(contentSource, /Replace background/);
  assert.match(contentSource, /PROMPIT_UPDATE_HISTORY_PROMPT/);
  assert.match(contentSource, /PROMPIT_REFINE_HISTORY_PROMPT/);
  assert.match(contentSource, /PROMPIT_RANDOMIZE_HISTORY_PROMPT/);
  assert.match(contentSource, /PROMPIT_LOGO\.svg/);
  assert.match(contentSource, /setExtensionEnabled/);
  assert.match(contentSource, /Promp it is turned off/);
  assert.match(source, /prompit-action-enabled/);
  assert.match(source, /prompit-action-settings/);
  assert.match(source, /prompit-action-model/);
  assert.match(source, /prompit-action-about/);
  assert.ok(manifest.web_accessible_resources[0].resources.includes("PROMPIT_LOGO.svg"));
  assert.match(manifest.description, /One-click vision analysis for any image/);
  assert.equal(manifest.homepage_url, "https://baydy.art");
  assert.equal(manifest.author, "Baydy Art (https://baydy.art)");
  assert.match(contentSource, /Developed by baydy\.art/);
  assert.match(optionsSource, /PROMPIT_LOGO\.svg/);
  assert.match(optionsSource, /Promp it on websites/);
  assert.match(optionsSource, /extension-enabled/);
  assert.match(optionsSource, /About Baydy Art/);
  assert.match(optionsSource, /https:\/\/baydy\.art/);
  assert.match(optionsSource, /https:\/\/www\.linkedin\.com\/in\/ayoubaydy\//);
  assert.match(optionsSource, /Developed by/);
  assert.doesNotMatch(optionsSource, /Local vision runtime|Choose what sees the image|Detect installed Ollama models, choose/i);
  assert.match(optionsSource, /OpenAI-compatible vision endpoint/);
  assert.match(optionsSource, /api-vision-key/);
  assert.match(themeTokens, /--color-accent:\s*oklch\(76% 0\.155 215\)/);
  assert.match(themeTokens, /--color-ink:\s*oklch\(97% 0\.005 80\)/);
  assert.match(contentStyles, /\.pi-kicker\s*\{[\s\S]*?color:\s*var\(--color-ink-2\)/);
  assert.match(optionsStyles, /\.options-kicker\s*\{[\s\S]*?color:\s*var\(--color-ink-2\)/);
  assert.match(contentStyles, /\.pi-focus-options\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,/);
  assert.match(contentStyles, /\.pi-focus-sheet\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(contentStyles, /\.pi-setup-panels\s*\{[\s\S]*?display:\s*grid[\s\S]*?overflow:\s*hidden/);
  assert.match(contentStyles, /\.pi-setup-panel\s*\{[\s\S]*?min-block-size:\s*0[\s\S]*?overflow-y:\s*auto/);
  assert.match(contentStyles, /\.pi-result-toolbar\s*\{[\s\S]*?justify-content:\s*space-between/);
  assert.match(contentStyles, /\.pi-result-toolbar__actions\s*\{[\s\S]*?display:\s*inline-flex/);
  assert.match(contentStyles, /\.pi-shell\[data-mode="loading"\] \.pi-card--analysis\s*\{[\s\S]*?min-block-size:\s*0/);
  assert.match(contentStyles, /\.pi-page-scan\s*\{[\s\S]*?pointer-events:\s*none/);
  assert.match(contentStyles, /\.pi-result-editor\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(contentStyles, /\.pi-result-editor\s*\{[\s\S]*?inline-size:\s*min\(20rem, 100%\)/);
  assert.match(contentStyles, /\.pi-editor-refine,\s*\.pi-editor-randomize\s*\{/);
  assert.ok(manifest.permissions.includes("declarativeNetRequestWithHostAccess"));
  assert.ok(manifest.permissions.includes("downloads"));
  assert.ok(manifest.permissions.includes("unlimitedStorage"));
  assert.ok(fs.existsSync(path.join(__dirname, "..", "scripts", "build-store-packages.js")));
  assert.ok(fs.existsSync(path.join(__dirname, "..", "store", "STORE_SUBMISSION.md")));

  await api.callOllama({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3.6:27b",
    customInstructions: ""
  }, image);
  const modernBody = JSON.parse(requests[1].options.body);
  assert.equal(modernBody.model, "qwen3.6:27b");
  assert.equal(modernBody.think, false);
  assert.equal("raw" in modernBody, false);
  assert.equal(modernBody.messages.length, 1);
  assert.doesNotMatch(modernBody.messages[0].content, /\/no_think/);
  assert.equal(modernBody.options.num_ctx, 12288);
  assert.equal(modernBody.options.num_predict, 3200);

  const tolerant = api.normalizeAnalysis('<think>ignored</think>\n```json\n{"english":"Recovered prompt","json":{"negative_prompt":"",},}\n```');
  assert.equal(tolerant.english, "Recovered prompt");

  const repaired = await api.repairAnalysisJson({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3-vl:8b"
  }, '{"english":"truncated');
  assert.equal(api.normalizeAnalysis(repaired).english, "Detailed English prompt. Exclude: wrong crop.");
  const repairBody = JSON.parse(requests[2].options.body);
  assert.equal(repairBody.model, "qwen3-vl:8b");
  assert.equal(repairBody.format.type, "object");
  assert.match(repairBody.messages[0].content, /MALFORMED RESPONSE/);

  const retried = await api.retryOllamaAnalysis({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3-vl:8b",
    customInstructions: "Preserve the exact camera height."
  }, image);
  assert.equal(api.normalizeAnalysis(retried).english, "Detailed English prompt. Exclude: wrong crop.");
  const retryBody = JSON.parse(requests[3].options.body);
  assert.equal(retryBody.messages[0].images[0], image.base64);
  assert.equal(retryBody.options.num_ctx, 8192);
  assert.equal(retryBody.options.num_predict, 2200);
  assert.match(retryBody.messages[0].content, /Preserve the exact camera height/);

  const refined = await api.refineOllamaAnalysis({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3-vl:8b",
    customInstructions: "Preserve the exact camera height."
  }, image, api.normalizeAnalysis(text));
  const refinedAnalysis = api.normalizeAnalysis(refined);
  const refineBody = JSON.parse(requests[4].options.body);
  assert.equal(refineBody.messages[0].images[0], image.base64);
  assert.equal(refineBody.options.num_ctx, 8192);
  assert.equal(refineBody.options.num_predict, 2600);
  assert.equal(refineBody.think, false);
  assert.match(refineBody.messages[0].content, /fresh specialist visual pass/);
  assert.doesNotMatch(refineBody.messages[0].content, /DRAFT TO VERIFY/);
  assert.match(refineBody.format.properties.json.properties.camera_angle.description, /elevation/);
  assert.match(refineBody.format.properties.json.properties.key_light.description, /hardness/);
  assert.equal(api.isUsableRefinement({ ...refinedAnalysis, english: "x".repeat(120) }), true);
  const mergedResult = api.mergeAnalysisResults(api.normalizeAnalysis(text), refinedAnalysis);
  assert.match(mergedResult.english, /Angle and perspective:/);
  assert.match(mergedResult.english, /Lighting:/);
  assert.match(mergedResult.english, /eye-level frontal camera with no roll/);
  assert.equal("arabic" in mergedResult, false);

  await api.callOllama({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3.6:27b",
    customInstructions: ""
  }, image, ["angle"], {
    textMode: "visuals_only",
    includeNegative: false,
    platform: "flux",
    enhancement: "premium_ad"
  });
  const angleBody = JSON.parse(requests[5].options.body);
  assert.deepEqual(Array.from(angleBody.format.properties.json.required), [
    "subject",
    "camera_angle",
    "perspective_geometry",
    "confidence_notes"
  ]);
  assert.equal("lighting" in angleBody.format.properties.json.properties, false);
  assert.equal("negative_prompt" in angleBody.format.properties.json.properties, false);
  assert.match(angleBody.messages[0].content, /ONLY Angle & perspective/);
  assert.match(angleBody.messages[0].content, /VISUALS ONLY/);
  assert.match(angleBody.messages[0].content, /Do not create or mention a negative prompt/);
  assert.doesNotMatch(angleBody.messages[0].content, /Audit lighting from highlights/);
  const angleOnly = api.tailorAnalysisToFocus(mergedResult, ["angle"], {
    textMode: "visuals_only",
    includeNegative: false,
    platform: "flux",
    enhancement: "premium_ad"
  });
  assert.deepEqual(Array.from(angleOnly.json.analysis_focus), ["angle"]);
  assert.equal("lighting" in angleOnly.json, false);
  assert.equal("style" in angleOnly.json, false);
  assert.match(angleOnly.english, /Angle and perspective,/);
  assert.match(angleOnly.english, /Luxury campaign/);
  assert.match(angleOnly.english, /text-free and unbranded/);
  assert.equal(angleOnly.json.target_platform, "Flux");
  assert.equal(angleOnly.json.prompt_options.includeNegative, false);
  assert.doesNotMatch(angleOnly.english, /Lighting:/);
  const focusedAnglePrompt = api.composeGenerationPrompt({
    subject: "female portrait",
    camera_angle: "straight-on frontal view at eye level",
    perspective_geometry: "minimal foreshortening",
    negative_prompt: "profile view, extreme roll, harsh shadows, warm color cast"
  }, "", ["angle"], {
    textMode: "include_text",
    includeNegative: true,
    platform: "generic",
    enhancement: "faithful"
  });
  assert.match(focusedAnglePrompt, /profile view/);
  assert.doesNotMatch(focusedAnglePrompt, /Exclude: no /);
  assert.doesNotMatch(focusedAnglePrompt, /harsh shadows|warm color cast/);
  const chatGptPrompt = api.composeGenerationPrompt({
    subject: "luxury beauty portrait",
    style: "editorial commercial photography",
    negative_prompt: "plastic skin"
  }, "", ["subject", "style"], {
    textMode: "visuals_only",
    includeNegative: true,
    platform: "chatgpt",
    enhancement: "premium_ad"
  });
  assert.match(chatGptPrompt, /^Create an image with the following visual direction:/);
  assert.match(chatGptPrompt, /refined material response/);
  assert.match(chatGptPrompt, /Do not include:/);
  assert.match(chatGptPrompt, /text, captions, typography/);
  assert.deepEqual(JSON.parse(JSON.stringify(api.sanitizePromptOptions({
    textMode: "include_text",
    includeNegative: false,
    platform: "nanobanana",
    enhancement: "faithful",
    creativeDirection: "editorial_tension",
    creativeLatitude: "strict",
    refinementEnabled: true,
    refinementStrength: 85,
    learningEnabled: false,
    selectionMode: "selected_area"
  }))), {
    textMode: "include_text",
    includeNegative: false,
    platform: "nanobanana",
    enhancement: "faithful",
    creativeDirection: "editorial_tension",
    creativeLatitude: "strict",
    refinementEnabled: true,
    refinementStrength: 85,
    learningEnabled: false,
    selectionMode: "selected_area"
  });
  await api.callOllama({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3.6:27b",
    customInstructions: ""
  }, image, ["style"], {
    textMode: "include_text",
    includeNegative: true,
    platform: "qwen",
    enhancement: "auto"
  });
  const includeTextBody = JSON.parse(requests[6].options.body);
  assert.equal("visible_text" in includeTextBody.format.properties.json.properties, true);
  assert.match(includeTextBody.messages[0].content, /transcribe only clearly readable text exactly/);
  assert.equal(api.sanitizeConfidenceNotes("The angle is clearly frontal with even lighting."), "");
  assert.match(api.sanitizeConfidenceNotes("The horizon is uncertain because it is not visible. Extra sentence."), /horizon is uncertain/);
  assert.deepEqual(Array.from(api.sanitizeAnalysisFocus(["lighting", "camera", "lighting"])), ["camera", "lighting"]);
  assert.deepEqual(Array.from(api.sanitizeAnalysisFocus([])), ["all"]);

  const clean = api.sanitizeConfig({ apiKey: "legacy-secret", cloudModel: "legacy" });
  assert.equal(JSON.stringify(clean), JSON.stringify({
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
    promptLearningEnabled: true,
    configVersion: 10
  }));
  assert.equal("apiKey" in clean, false);
  assert.equal(api.sanitizeConfig({ extensionEnabled: false }).extensionEnabled, false);
  await api.setupContextMenus({ ...clean, extensionEnabled: false });
  const disabledActionMenu = contextMenuRequests.filter((item) => item.contexts?.includes("action"));
  assert.equal(disabledActionMenu.find((item) => item.id === "prompit-action-enabled")?.checked, false);
  assert.match(disabledActionMenu.find((item) => item.id === "prompit-action-model")?.title || "", /Ollama/);
  assert.equal(contextMenuRequests.some((item) => item.id === "prompit-analyze-image"), false);
  assert.match(api.actionModelMenuTitle({ visionProvider: "api", apiVisionModel: "vision-model" }), /vision-model/);

  const migrated = api.sanitizeConfig({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "gemma3:4b"
  });
  assert.equal(migrated.ollamaModel, "qwen3.5:4b");
  const fixedTier = api.sanitizeConfig({ ...migrated, modelProfile: "balanced", ollamaModel: "wrong:model" });
  assert.equal(fixedTier.ollamaModel, "qwen3.5:9b");
  assert.equal(api.getModelRuntime("qwen3.5:4b").maxImageSide, 1280);
  assert.equal(api.getModelRuntime("qwen3.5:9b").maxImageSide, 1600);
  assert.equal(api.getModelRuntime("qwen3.6:27b").maxImageSide, 2048);
  const customized = api.sanitizeConfig({ ...migrated, customInstructions: "  Prioritize vanishing points.  " });
  assert.equal(customized.customInstructions, "Prioritize vanishing points.");
  const refinementConfig = api.sanitizeConfig({
    ...customized,
    promptEnhancementEnabled: false,
    promptEnhancementPreset: "premium_ad",
    promptCreativeDirection: "surreal_perspective",
    promptCreativeLatitude: "exploratory",
    promptEnhancementInstructions: "  Stress forced perspective without changing the pose.  "
  });
  assert.equal(refinementConfig.promptEnhancementEnabled, false);
  assert.equal(refinementConfig.promptEnhancementPreset, "premium_ad");
  assert.equal(refinementConfig.promptCreativeDirection, "surreal_perspective");
  assert.equal(refinementConfig.promptCreativeLatitude, "exploratory");
  assert.equal(refinementConfig.promptEnhancementInstructions, "Stress forced perspective without changing the pose.");
  assert.equal(api.applyConfiguredPromptEnhancement({ enhancement: "professional" }, refinementConfig).enhancement, "faithful");
  const localRefinement = api.applyConfiguredPromptEnhancement({
    enhancement: "professional",
    refinementEnabled: true,
    refinementStrength: 85,
    learningEnabled: false
  }, refinementConfig);
  assert.equal(localRefinement.enhancement, "premium_ad");
  assert.equal(localRefinement.creativeLatitude, "exploratory");
  assert.equal(localRefinement.learningEnabled, false);
  assert.equal(api.refinementLatitudeFromStrength(30), "strict");
  assert.equal(api.refinementLatitudeFromStrength(50), "directed");
  assert.equal(api.refinementLatitudeFromStrength(71), "exploratory");
  assert.match(api.refinementDirective(85), /interpretive/);
  const withoutArabic = api.sanitizeConfig({ ...customized, arabicModel: "command-r7b-arabic:latest" });
  assert.equal("arabicModel" in withoutArabic, false);
  assert.equal(withoutArabic.customInstructions, "Prioritize vanishing points.");
  const cleanedHistory = api.sanitizeHistory([{
    id: "old-entry",
    analysis: {
      english: "Keep this",
      arabic: "remove this",
      json: { generation_prompt_en: "Keep this", generation_prompt_ar: "remove this" }
    }
  }]);
  assert.equal(cleanedHistory[0].analysis.english, "Keep this");
  assert.equal("arabic" in cleanedHistory[0].analysis, false);
  assert.equal("generation_prompt_ar" in cleanedHistory[0].analysis.json, false);
  assert.deepEqual(JSON.parse(JSON.stringify(cleanedHistory[0].promptOptions)), {
    textMode: "include_text",
    includeNegative: true,
    platform: "generic",
    enhancement: "faithful",
    creativeDirection: "contemporary_auto",
    creativeLatitude: "directed",
    refinementEnabled: true,
    refinementStrength: 50,
    learningEnabled: true,
    selectionMode: "full_image"
  });
  const promptEdit = api.sanitizePromptEdit({
    originalEnglish: "Original image prompt",
    originalGenerationPrompt: "Original generation prompt",
    originalBackground: "Original background",
    originalEnvironment: "Original environment",
    backgroundPreset: "black-solid"
  }, { english: "Changed prompt", json: {} });
  assert.equal(promptEdit.backgroundPreset, "black-solid");
  assert.equal(promptEdit.originalEnglish, "Original image prompt");
  assert.match(api.formatPromptForPlatform("precise portrait", "plastic skin", "qwen"), /^Generate a visually precise image/);
  assert.match(api.formatPromptForPlatform("precise portrait", "plastic skin", "nanobanana"), /^Generate or edit the image/);
  assert.match(api.formatPromptForPlatform("precise portrait", "", "flux"), /^precise portrait\.$/);
  assert.doesNotMatch(api.formatPromptForPlatform("precise portrait", "wrong crop, text, plastic skin", "flux"), /Negative prompt:/);
  assert.match(api.formatPromptForPlatform("precise portrait", "wrong crop, text, plastic skin", "flux"), /Desired safeguards: text-free, unbranded composition/);
  assert.equal(api.describeFrame(1920, 1080), "1920 by 1080 pixels, approximately 16:9 landscape");

  const autoResolved = await api.resolveRuntimeConfig(clean);
  assert.equal(autoResolved.ollamaModel, "qwen3.6:27b");

  const detected = await api.listOllamaModels("http://127.0.0.1:11434");
  assert.equal(detected.ok, true);
  assert.equal(detected.models[0].name, "qwen3.6:27b");
  assert.equal(detected.models[0].visionLikely, true);
  assert.equal(detected.models[0].parameterSize, "27B");
  assert.equal(api.isLikelyVisionModel("llava:7b"), true);
  assert.equal(api.isLikelyVisionModel("mistral:7b"), false);

  const professional = await api.enhanceAnalysisPrompt({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3.6:27b",
    promptEnhancementInstructions: "Keep the detected camera height exact."
  }, mergedResult, ["all"], {
    textMode: "visuals_only",
    includeNegative: true,
    platform: "chatgpt",
    enhancement: "professional",
    creativeDirection: "contemporary_auto",
    creativeLatitude: "directed"
  });
  assert.match(professional.english, /^Create an image with the following visual direction:/);
  assert.match(professional.english, /eye-level frontal camera/);
  assert.match(professional.english, /Do not include:/);
  assert.match(professional.english, /text, captions, typography/);
  assert.equal(professional.json.prompt_enhancement, "ollama_text_refinement");
  assert.equal(professional.json.prompt_visual_language_version, "2026.09");
  assert.equal(professional.json.prompt_memory_used, false);
  assert.match(professional.json.prompt_creative_direction, /Contemporary editorial tension/);
  assert.equal(professional.json.prompt_style_decisions.length, 3);
  const enhancementBody = JSON.parse(requests.at(-1).options.body);
  assert.equal("images" in enhancementBody.messages[0], false);
  assert.match(enhancementBody.messages[0].content, /text-only editing pass/);
  assert.match(enhancementBody.messages[0].content, /Current visual systems/);
  assert.match(enhancementBody.messages[0].content, /Trend-soup is a failure/);
  assert.match(enhancementBody.messages[0].content, /ChatGPT Images strategy/);
  assert.match(enhancementBody.messages[0].content, /Creative latitude/);
  assert.match(enhancementBody.messages[0].content, /Refinement strength 50\/100/);
  assert.match(enhancementBody.messages[0].content, /Local preference memory/);
  assert.match(enhancementBody.messages[0].content, /Keep the detected camera height exact/);

  storageState.prompitHistory = [{
    id: "refine-entry",
    createdAt: "2026-08-17T10:20:30.000Z",
    provider: "ollama",
    model: "qwen3.5:4b",
    focus: ["all"],
    promptOptions: {
      textMode: "visuals_only",
      includeNegative: true,
      platform: "generic",
      enhancement: "faithful",
      creativeDirection: "contemporary_auto",
      creativeLatitude: "directed",
      refinementEnabled: true,
      refinementStrength: 50,
      learningEnabled: true,
      selectionMode: "full_image"
    },
    analysis: {
      english: "A finished prompt. Background: solid black seamless backdrop.",
      json: {
        generation_prompt_en: "A finished prompt. Background: solid black seamless backdrop.",
        background: "solid black seamless backdrop",
        environment: "solid black seamless backdrop"
      }
    },
    promptEdit: {
      originalEnglish: "Source portrait with a warm gallery background.",
      originalGenerationPrompt: "Source portrait with a warm gallery background.",
      originalBackground: "warm gallery background",
      originalEnvironment: "warm gallery interior",
      backgroundPreset: "black-solid"
    }
  }];
  const refinedHistory = await api.refineHistoryPrompt("refine-entry");
  assert.equal(refinedHistory.ok, true);
  assert.equal(refinedHistory.promptOptions.enhancement, "professional");
  assert.match(refinedHistory.analysis.english, /Professional high-fashion portrait/);
  assert.match(refinedHistory.analysis.english, /solid black seamless backdrop/);
  assert.equal(refinedHistory.entry.promptEdit.backgroundPreset, "black-solid");
  assert.match(refinedHistory.entry.promptEdit.originalEnglish, /Professional high-fashion portrait/);
  const refinedHistoryBody = JSON.parse(requests.at(-1).options.body);
  assert.match(refinedHistoryBody.messages[0].content, /warm gallery background/);

  const randomizedHistory = await api.randomizeHistoryPrompt("refine-entry");
  assert.equal(randomizedHistory.ok, true);
  assert.equal(randomizedHistory.promptOptions.enhancement, "professional");
  assert.equal(randomizedHistory.promptOptions.creativeLatitude, "exploratory");
  assert.ok(randomizedHistory.promptOptions.refinementStrength >= 70);
  assert.notEqual(randomizedHistory.randomStyle.id, "contemporary_auto");
  assert.ok(randomizedHistory.randomStyle.touch?.id);
  assert.equal(randomizedHistory.analysis.json.prompt_random_style, randomizedHistory.randomStyle.id);
  assert.equal(randomizedHistory.analysis.json.prompt_random_family, randomizedHistory.randomStyle.family);
  assert.equal(randomizedHistory.analysis.json.prompt_random_touch, randomizedHistory.randomStyle.touch.id);
  assert.match(randomizedHistory.analysis.english, /solid black seamless backdrop/);
  assert.equal(randomizedHistory.entry.promptEdit.backgroundPreset, "black-solid");
  const randomizedHistoryBody = JSON.parse(requests.at(-1).options.body);
  assert.equal("images" in randomizedHistoryBody.messages[0], false);
  assert.match(randomizedHistoryBody.messages[0].content, /Selected creative direction/i);
  assert.match(randomizedHistoryBody.messages[0].content, /Rolled finishing touch/);

  assert.equal(api.classifyRandomStyleFamily({ subject: "matte fragrance bottle" }), "product");
  assert.equal(api.classifyRandomStyleFamily({ subject: "fashion portrait of a model" }), "portrait");
  assert.equal(api.classifyRandomStyleFamily({ style: "screen-printed graphic poster" }), "graphic");
  const productRoll = api.pickRandomModernStyle("", { subject: "matte skincare product bottle" });
  assert.equal(productRoll.family, "product");
  assert.ok(productRoll.touch?.label);

  assert.deepEqual(Array.from(api.classifyStyleSignals([
    "Motivated practical light with negative fill",
    "Controlled palette and tactile skin texture"
  ])), ["motivated_light", "tactile_texture", "restrained_palette"]);
  const learnedDirective = api.buildLearningMemoryDirective({
    acceptedCount: 3,
    directionWeights: { editorial_tension: 2 },
    styleSignalWeights: { motivated_light: 3, tactile_texture: 2 }
  }, { learningEnabled: true });
  assert.equal(learnedDirective.used, true);
  assert.match(learnedDirective.text, /Contemporary editorial/);
  assert.match(learnedDirective.text, /soft tie-breakers/);

  storageState.prompitHistory = [{
    id: "learn-entry",
    focus: ["lighting", "style"],
    promptOptions: { platform: "qwen", creativeDirection: "editorial_tension", refinementStrength: 70 },
    analysis: { json: { prompt_style_decisions: ["Motivated light with negative fill", "Tactile surface texture"] } }
  }];
  const learned = await api.recordLearningSignal("learn-entry");
  assert.equal(learned.ok, true);
  assert.equal(storageState.prompitLearningMemory.acceptedCount, 1);
  assert.equal(storageState.prompitLearningMemory.styleSignalWeights.motivated_light, 1);
  const duplicateLearning = await api.recordLearningSignal("learn-entry");
  assert.equal(duplicateLearning.duplicate, true);

  storageState.prompitHistory = [{
    id: "export-entry",
    createdAt: "2026-08-16T10:20:30.000Z",
    sourceUrl: "https://example.com/image",
    imageData: "data:image/jpeg;base64,aW1hZ2U=",
    imagePreview: "data:image/jpeg;base64,dGh1bWI=",
    provider: "ollama",
    model: "qwen3.6:27b",
    focus: ["all"],
    durationMs: 12840,
    promptOptions: { textMode: "visuals_only", includeNegative: true, platform: "flux", enhancement: "professional", creativeDirection: "contemporary_auto", creativeLatitude: "directed" },
    analysis: { english: "Professional exported prompt.", json: { camera_angle: "eye-level" } }
  }];
  const exported = await api.exportHistory();
  assert.equal(exported.ok, true);
  assert.equal(exported.entries, 1);
  assert.equal(exported.files, 3);
  assert.equal(downloadRequests.length, 1);
  assert.match(downloadRequests[0].filename, /^Promp-it-history-.*\.zip$/);
  assert.match(downloadRequests[0].url, /^data:application\/zip;base64,/);
  const archiveBytes = api.base64ToBytes(downloadRequests[0].url.split(",")[1]);
  const archiveText = String.fromCharCode(...archiveBytes);
  assert.match(archiveText, /01-complete-prompt-2026-08-16T10-20-30-000Z\/image\.jpg/);
  assert.match(archiveText, /01-complete-prompt-2026-08-16T10-20-30-000Z\/prompt\.txt/);
  assert.match(archiveText, /Prompt kind: complete-prompt/);
  assert.equal(api.historyPromptKind(storageState.prompitHistory[0]), "complete-prompt");
  assert.equal(api.imageExtensionFromDataUrl("data:image/png;base64,AA=="), "png");

  const updatedPrompt = await api.updateHistoryPrompt("export-entry", {
    english: "Rewritten prompt. Background: solid black seamless backdrop.",
    json: { generation_prompt_en: "Rewritten prompt", background: "solid black seamless backdrop" }
  }, {
    originalEnglish: "Professional exported prompt.",
    originalGenerationPrompt: "Professional exported prompt.",
    originalBackground: "Plain gray background",
    originalEnvironment: "Studio",
    backgroundPreset: "black-solid"
  });
  assert.equal(updatedPrompt.ok, true);
  assert.equal(storageState.prompitHistory[0].promptEdit.backgroundPreset, "black-solid");
  assert.match(storageState.prompitHistory[0].analysis.english, /solid black/);

  const apiVision = await api.callVisionAnalysis({
    visionProvider: "api",
    apiVisionBaseUrl: "https://vision.example/v1",
    apiVisionModel: "vision-model",
    apiVisionKey: "local-test-key",
    customInstructions: ""
  }, image, ["angle"]);
  const apiVisionBody = JSON.parse(requests.at(-1).options.body);
  assert.equal(apiVision.providerMode, "api");
  assert.equal(requests.at(-1).url, "https://vision.example/v1/chat/completions");
  assert.equal(apiVisionBody.model, "vision-model");
  assert.equal(apiVisionBody.messages[0].content[1].image_url.url, image.dataUrl);
  assert.equal(requests.at(-1).options.headers.Authorization, "Bearer local-test-key");
  assert.equal(apiVisionBody.response_format.type, "json_schema");
  assert.match(api.presentProviderError(new Error("Vision API request failed: 403 Forbidden"), { visionProvider: "api" }), /credentials/i);

  await api.syncOllamaOriginRule(clean);
  const localUpdate = dynamicRuleUpdates.at(-1);
  assert.deepEqual(Array.from(localUpdate.removeRuleIds), [11434]);
  assert.equal(localUpdate.addRules.length, 1);
  assert.equal(localUpdate.addRules[0].action.type, "modifyHeaders");
  assert.equal(localUpdate.addRules[0].action.requestHeaders[0].header, "Origin");
  assert.equal(localUpdate.addRules[0].action.requestHeaders[0].operation, "remove");
  assert.match(localUpdate.addRules[0].condition.regexFilter, /127\\\.0\\\.0\\\.1:11434/);
  assert.match(localUpdate.addRules[0].condition.regexFilter, /api\/\(\?:chat\|tags\)/);
  assert.deepEqual(Array.from(localUpdate.addRules[0].condition.resourceTypes), ["xmlhttprequest"]);

  await api.syncOllamaOriginRule({ ...clean, ollamaBaseUrl: "https://ollama.example.com" });
  assert.equal(dynamicRuleUpdates.at(-1).addRules.length, 0);
  await api.syncOllamaOriginRule({ ...clean, extensionEnabled: false });
  assert.equal(dynamicRuleUpdates.at(-1).addRules.length, 0);

  assert.match(
    api.presentOllamaError(new Error("Ollama request failed: 403 Forbidden"), clean),
    /OLLAMA_ORIGINS/
  );
  assert.match(
    api.presentOllamaError(new Error("Failed to fetch"), clean),
    /cannot reach local Ollama/
  );

  console.log("vision-provider payload smoke test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
