(() => {
  if (window.__prompitLoaded) return;
  window.__prompitLoaded = true;
  const extensionVersion = chrome.runtime.getManifest?.().version || "preview";
  const focusOrder = ["subject", "pose", "camera", "angle", "composition", "lighting", "style", "background"];
  const focusLabels = {
    all: "All details",
    subject: "Subject",
    pose: "Pose",
    camera: "Camera",
    angle: "Angle",
    composition: "Composition",
    lighting: "Lighting",
    style: "Style & color",
    background: "Background & text"
  };
  const PROMPT_SETUP_STORAGE_KEY = "prompitLastPromptSetup";
  const defaultPromptOptions = Object.freeze({
    textMode: "visuals_only",
    includeNegative: true,
    platform: "generic",
    enhancement: "professional",
    creativeDirection: "contemporary_auto",
    creativeLatitude: "directed",
    refinementEnabled: true,
    refinementStrength: 50,
    learningEnabled: true,
    selectionMode: "full_image"
  });
  const platformLabels = {
    generic: "Generic",
    flux: "Flux",
    qwen: "Qwen Image",
    chatgpt: "ChatGPT Images",
    nanobanana: "Nano Banana"
  };
  const enhancementLabels = {
    faithful: "faithful",
    auto: "auto refine",
    professional: "pro refine",
    premium_ad: "premium ad"
  };
  const creativeDirectionLabels = {
    source_match: "source match",
    contemporary_auto: "current art direction",
    cinematic_naturalism: "cinematic naturalism",
    editorial_tension: "editorial tension",
    luxury_campaign: "luxury campaign",
    direct_flash: "direct flash",
    analog_tactile: "analog tactile",
    sculptural_product: "sculptural product",
    surreal_perspective: "surreal perspective",
    documentary_realism: "documentary realism",
    soft_future_editorial: "soft future editorial",
    raw_material_realism: "raw material realism",
    graphic_spatial_layering: "graphic spatial layering",
    contemporary_cg_tactility: "contemporary CG tactility",
    modern_campaign_minimalism: "modern campaign minimalism"
  };
  const creativeLatitudeLabels = {
    strict: "strict",
    directed: "directed",
    exploratory: "exploratory"
  };
  const backgroundPresets = Object.freeze([
    { id: "black-solid", label: "Black solid", prompt: "solid black seamless backdrop" },
    { id: "white-solid", label: "White solid", prompt: "solid white seamless backdrop" },
    { id: "green-solid", label: "Green solid", prompt: "solid chroma-green backdrop" },
    { id: "gray-studio", label: "Gray studio", prompt: "soft neutral-gray studio sweep" },
    { id: "cream-studio", label: "Cream studio", prompt: "warm cream studio sweep" },
    { id: "editorial-studio", label: "Editorial studio", prompt: "restrained editorial studio set with a soft tonal gradient" }
  ]);

  const host = document.createElement("div");
  host.id = "prompit-extension-root";
  const shadow = host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = chrome.runtime.getURL("content.css?v=1.10.13");
  shadow.append(stylesheet);
  const appLogoUrl = chrome.runtime.getURL("PROMPIT_LOGO.svg");

  const stage = document.createElement("div");
  stage.className = "pi-stage";
  stage.innerHTML = `
    <button class="pi-image-action" type="button" aria-label="Generate a prompt for this image" data-visible="false">
      <span class="pi-image-action__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3-1.9 5.1L5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9L12 3Z"></path><path d="m19 15-.8 2.2L16 18l2.2.8L19 21l.8-2.2L22 18l-2.2-.8L19 15Z"></path></svg>
      </span>
      <span>Prompt image</span>
    </button>

    <div class="pi-page-scan" aria-hidden="true" data-active="false">
      <canvas class="pi-scan-wave__canvas" aria-hidden="true"></canvas>
    </div>

    <dialog class="pi-focus-dialog" aria-labelledby="pi-focus-title" aria-describedby="pi-focus-description">
      <div class="pi-focus-sheet">
        <header class="pi-focus-header">
          <div>
            <span class="pi-kicker">Prompt focus</span>
            <h2 id="pi-focus-title">Choose what to describe</h2>
          </div>
          <button class="pi-icon-button pi-focus-close" type="button" aria-label="Cancel prompt focus selection">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </header>
        <p class="pi-focus-description" id="pi-focus-description">Choose what the vision runtime should study, then tune the output.</p>
        <div class="pi-setup-tabs" role="tablist" aria-label="Prompt configuration">
          <button class="pi-setup-tab" id="pi-setup-tab-focus" type="button" role="tab" data-setup-tab="focus" aria-controls="pi-setup-panel-focus" aria-selected="true" tabindex="0" data-state="success">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span><strong>Focus</strong><small class="pi-setup-tab__focus-meta">All</small></span>
          </button>
          <button class="pi-setup-tab" id="pi-setup-tab-output" type="button" role="tab" data-setup-tab="output" aria-controls="pi-setup-panel-output" aria-selected="false" tabindex="-1" data-state="default">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"></path><path d="M8 9h8"></path><path d="M8 13h5"></path><path d="M8 17h3"></path></svg>
            <span><strong>Output</strong><small class="pi-setup-tab__output-meta">Generic</small></span>
          </button>
          <button class="pi-setup-tab" id="pi-setup-tab-refine" type="button" role="tab" data-setup-tab="refine" aria-controls="pi-setup-panel-refine" aria-selected="false" tabindex="-1" data-state="default">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M20 21v-5"></path><path d="M20 12V3"></path><path d="M2 14h4"></path><path d="M10 8h4"></path><path d="M18 16h4"></path></svg>
            <span><strong>Refine</strong><small class="pi-setup-tab__refine-meta">50</small></span>
          </button>
        </div>
        <div class="pi-setup-panels">
          <section class="pi-setup-panel" id="pi-setup-panel-focus" role="tabpanel" data-setup-panel="focus" aria-labelledby="pi-setup-tab-focus">
            <header class="pi-setup-panel__intro">
              <h3>Visual focus</h3>
              <p>Pick one detail or combine several.</p>
            </header>
            <div class="pi-focus-options" role="group" aria-label="Visual details to analyze">
          <button class="pi-focus-option pi-focus-option--all" type="button" data-focus="all" aria-pressed="true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span><strong>All details</strong><small>Complete reconstruction</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="subject" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>
            <span><strong>Subject</strong><small>Appearance and traits</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="pose" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2"></circle><path d="m6 8 3 2 1 4-3 7"></path><path d="m18 8-3 2-1 4 3 7"></path><path d="M9 10h6"></path></svg>
            <span><strong>Pose</strong><small>Gesture and expression</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="camera" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z"></path><circle cx="12" cy="13" r="3"></circle></svg>
            <span><strong>Camera</strong><small>Lens, focus, depth</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="angle" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m16 8-2 6-6 2 2-6Z"></path></svg>
            <span><strong>Angle</strong><small>View and perspective</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="composition" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path><path d="M15 3v18"></path><path d="M3 9h18"></path><path d="M3 15h18"></path></svg>
            <span><strong>Framing</strong><small>Crop and placement</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="lighting" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.42 1.42"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
            <span><strong>Lighting</strong><small>Sources and shadows</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="style" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="10.5" r="2.5"></circle><circle cx="8.5" cy="7.5" r="2.5"></circle><circle cx="6.5" cy="12.5" r="2.5"></circle><path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-1.4a2 2 0 0 0-1.8 2.8l.2.4A2 2 0 0 1 13.2 22Z"></path></svg>
            <span><strong>Style</strong><small>Medium and palette</small></span>
          </button>
          <button class="pi-focus-option" type="button" data-focus="background" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path></svg>
            <span><strong>Scene</strong><small>Environment and wording</small></span>
          </button>
            </div>
            <div class="pi-main-area-control">
              <label class="pi-prompt-toggle pi-selected-area-toggle">
                <input class="pi-selected-area" type="checkbox" />
                <span class="pi-prompt-toggle__copy">
                  <strong>Select section</strong>
                  <small>Draw a box on the image to analyze only that section.</small>
                </span>
                <span class="pi-prompt-toggle__control" aria-hidden="true"><span></span></span>
              </label>
            </div>
          </section>
          <section class="pi-setup-panel" id="pi-setup-panel-output" role="tabpanel" data-setup-panel="output" aria-labelledby="pi-setup-tab-output" hidden>
            <header class="pi-setup-panel__intro">
              <h3>Output rules</h3>
              <p>Shape the prompt without changing the visual reading.</p>
            </header>
            <div class="pi-prompt-fields pi-prompt-fields--single">
              <label class="pi-prompt-field">
                <span>Target format</span>
                <span class="pi-select-wrap">
                  <select class="pi-prompt-platform" data-state="default">
                    <option value="generic">Generic</option>
                    <option value="flux">Flux</option>
                    <option value="qwen">Qwen Image</option>
                    <option value="chatgpt">ChatGPT Images</option>
                    <option value="nanobanana">Nano Banana</option>
                  </select>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                </span>
              </label>
            </div>
            <div class="pi-prompt-toggles">
              <label class="pi-prompt-toggle">
                <input class="pi-visuals-only" type="checkbox" checked />
                <span class="pi-prompt-toggle__copy">
                  <strong>Visuals only</strong>
                  <small>Ignore wording, logos, and watermarks.</small>
                </span>
                <span class="pi-prompt-toggle__control" aria-hidden="true"><span></span></span>
              </label>
              <label class="pi-prompt-toggle">
                <input class="pi-include-negative" type="checkbox" checked />
                <span class="pi-prompt-toggle__copy">
                  <strong>Negative prompt</strong>
                  <small>Add image-specific mismatches to avoid.</small>
                </span>
                <span class="pi-prompt-toggle__control" aria-hidden="true"><span></span></span>
              </label>
            </div>
          </section>
          <section class="pi-setup-panel" id="pi-setup-panel-refine" role="tabpanel" data-setup-panel="refine" aria-labelledby="pi-setup-tab-refine" hidden>
            <header class="pi-setup-panel__intro">
              <h3>Refinement</h3>
              <p>Stay literal or add stronger contemporary art direction.</p>
            </header>
            <div class="pi-refinement" style="--pi-strength: 50">
              <div class="pi-refinement__heading">
                <span>
                  <strong>Prompt strength</strong>
                  <small>Exact reconstruction to interpretive direction</small>
                </span>
              </div>
              <div class="pi-refinement__range-wrap">
                <output class="pi-refinement__value" for="pi-refinement-strength">50</output>
                <input class="pi-refinement-strength" id="pi-refinement-strength" type="range" min="0" max="100" step="5" value="50" aria-label="Prompt refinement strength" />
                <span class="pi-refinement__ticks" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              </div>
              <div class="pi-refinement__labels" aria-hidden="true"><span>Exact</span><span>Interpretive</span></div>
            </div>
            <div class="pi-prompt-toggles">
              <label class="pi-prompt-toggle">
                <input class="pi-refinement-enabled" type="checkbox" checked />
                <span class="pi-prompt-toggle__copy">
                  <strong>Refine prompt</strong>
                  <small>Apply the professional art-direction pass.</small>
                </span>
                <span class="pi-prompt-toggle__control" aria-hidden="true"><span></span></span>
              </label>
              <label class="pi-prompt-toggle">
                <input class="pi-learning-enabled" type="checkbox" checked />
                <span class="pi-prompt-toggle__copy">
                  <strong>Local learning</strong>
                  <small>Learn soft preferences from prompts you copy.</small>
                </span>
                <span class="pi-prompt-toggle__control" aria-hidden="true"><span></span></span>
              </label>
            </div>
          </section>
        </div>
        <div class="pi-focus-footer">
          <span class="pi-focus-summary" aria-live="polite">All details selected</span>
          <div>
            <button class="pi-text-button pi-focus-cancel" type="button">Cancel</button>
            <button class="pi-button pi-focus-confirm" type="button" data-state="default">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="m9 12 2 2 4-4"></path></svg>
              <span class="pi-focus-confirm__label">Analyze</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>

    <div class="pi-shell" data-open="false" data-history="false" data-minimized="false" data-mode="idle" aria-hidden="true">
      <button class="pi-minimized-dock" type="button" aria-label="Maximize Promp it" title="Maximize panel" hidden>
        <span class="pi-brand__logo" aria-hidden="true">
          <img src="${appLogoUrl}" alt="" />
        </span>
        <span class="pi-minimized-dock__copy"><strong>Promp it</strong><small class="pi-minimized-dock__time">Ready</small></span>
        <svg class="pi-minimized-dock__restore" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"></path><path d="m21 3-7 7"></path><path d="M9 21H3v-6"></path><path d="m3 21 7-7"></path></svg>
      </button>
      <section class="pi-card pi-card--analysis" aria-label="Promp it image analysis">
        <header class="pi-header">
          <div class="pi-brand">
            <span class="pi-brand__logo" aria-hidden="true">
              <img src="${appLogoUrl}" alt="" />
            </span>
            <span class="pi-brand__wordmark"><span>Promp</span><span>it</span></span>
            <span class="pi-brand__version">v${extensionVersion}</span>
          </div>
          <div class="pi-header__actions">
            <button class="pi-icon-button pi-minimize" type="button" aria-label="Minimize Promp it" title="Minimize panel">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path></svg>
            </button>
            <button class="pi-icon-button pi-history-toggle" type="button" aria-label="Open prompt history" aria-pressed="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>
            </button>
            <button class="pi-icon-button pi-settings" type="button" aria-label="Open vision settings">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="pi-icon-button pi-close" type="button" aria-label="Close Promp it">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>
        </header>

        <div class="pi-context">
          <div class="pi-preview" aria-hidden="true">
            <img class="pi-preview__image" alt="" />
            <span class="pi-preview__fallback">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path></svg>
            </span>
          </div>
          <div class="pi-context__copy">
            <span class="pi-kicker">Visual analysis</span>
            <strong class="pi-title">Building your prompt</strong>
            <span class="pi-provider">Preparing vision runtime</span>
            <span class="pi-generation-time" hidden>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>
              <span class="pi-generation-time__value">0.0 s</span>
            </span>
          </div>
        </div>

        <div class="pi-loading" aria-live="polite">
          <div class="pi-progress" aria-hidden="true"><span class="pi-progress__bar"></span></div>
          <div class="pi-progress__meta">
            <span class="pi-progress__label">Reading the image…</span>
            <span class="pi-progress__value">8%</span>
          </div>
        </div>

        <div class="pi-error" hidden role="alert">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
          <div>
            <strong>Analysis stopped</strong>
            <p class="pi-error__message"></p>
          </div>
          <button class="pi-button pi-error__settings" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle></svg><span>Open settings</span></button>
        </div>

        <div class="pi-result" hidden>
          <div class="pi-result-toolbar">
            <div class="pi-tabs" role="tablist" aria-label="Prompt format">
              <button class="pi-tab" type="button" role="tab" aria-selected="true" data-tab="english">EN</button>
              <button class="pi-tab" type="button" role="tab" aria-selected="false" data-tab="json">{ }</button>
            </div>
            <div class="pi-result-toolbar__actions">
              <button class="pi-result-dice" type="button" aria-label="Roll a tailored modern prompt direction" title="Roll tailored modern direction" data-state="default">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M8 8h.01"></path><path d="M16 8h.01"></path><path d="M12 12h.01"></path><path d="M8 16h.01"></path><path d="M16 16h.01"></path></svg>
              </button>
              <button class="pi-result-tools-toggle" type="button" aria-label="Open prompt finishing tools" title="Finish prompt" aria-expanded="false" aria-controls="pi-result-editor" data-state="default">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M20 21v-5"></path><path d="M20 12V3"></path><path d="M2 14h4"></path><path d="M10 8h4"></path><path d="M18 16h4"></path></svg>
              </button>
            </div>
          </div>
          <section class="pi-result-editor" id="pi-result-editor" aria-label="Prompt tools" hidden>
            <header class="pi-result-editor__header">
              <span class="pi-result-editor__label">Finish</span>
              <button class="pi-result-editor__close" type="button" aria-label="Close prompt tools">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
              </button>
            </header>
            <div class="pi-result-editor__controls">
              <button class="pi-editor-refine" type="button" data-state="default">
                <span class="pi-button__spinner" aria-hidden="true"></span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3-1.9 5.1L5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9L12 3Z"></path><path d="m19 15-.8 2.2L16 18l2.2.8L19 21l.8-2.2L22 18l-2.2-.8L19 15Z"></path></svg>
                <span class="pi-editor-refine__label">Refine prompt</span>
              </button>
              <button class="pi-editor-randomize" type="button" data-state="default">
                <span class="pi-button__spinner" aria-hidden="true"></span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M8 8h.01"></path><path d="M16 8h.01"></path><path d="M12 12h.01"></path><path d="M8 16h.01"></path><path d="M16 16h.01"></path></svg>
                <span class="pi-editor-randomize__label">Roll modern</span>
              </button>
              <div class="pi-editor-capsules" role="group" aria-label="Background treatment">
                <button class="pi-editor-capsule" type="button" data-background-mode="source" aria-pressed="true">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <span>Keep scene</span>
                </button>
                <button class="pi-editor-capsule" type="button" data-background-mode="replace" aria-pressed="false">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path></svg>
                  <span>Replace background</span>
                </button>
              </div>
              <label class="pi-result-editor__select">
                <span class="sr-only">Replacement background</span>
                <span class="pi-select-wrap">
                  <select class="pi-background-select" disabled>
                    <option value="">Choose background</option>
                    <option value="black-solid">Black solid</option>
                    <option value="white-solid">White solid</option>
                    <option value="green-solid">Green solid</option>
                    <option value="gray-studio">Gray studio</option>
                    <option value="cream-studio">Cream studio</option>
                    <option value="editorial-studio">Editorial studio</option>
                  </select>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                </span>
              </label>
            </div>
            <p class="pi-result-editor__hint">Dice rolls one image-compatible modern direction; scene facts stay locked.</p>
          </section>
          <div class="pi-output-wrap">
            <pre class="pi-output" tabindex="0"></pre>
          </div>
          <div class="pi-tags" aria-label="Detected visual traits"></div>
        </div>

        <footer class="pi-footer">
          <span class="pi-footer__hint">English · JSON</span>
          <a class="pi-footer__brand-link" href="https://baydy.art" target="_blank" rel="noopener noreferrer" title="Developed by https://baydy.art">Developed by baydy.art</a>
          <button class="pi-button pi-copy" type="button" disabled data-state="disabled">
            <span class="pi-button__spinner" aria-hidden="true"></span>
            <span class="pi-copy__icon" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"></path></svg></span>
            <span class="pi-copy__check" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg></span>
            <span class="pi-copy__label">Copy prompt</span>
          </button>
        </footer>
      </section>

      <aside class="pi-card pi-card--history" aria-label="Prompt history" aria-hidden="true">
        <header class="pi-history__header">
          <div>
            <strong>History</strong>
            <span class="pi-history__count">0 / 20</span>
          </div>
          <div class="pi-history__actions">
            <button class="pi-text-button pi-history-export" type="button" data-state="default" aria-label="Export prompt history">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>
              <span>Export ZIP</span>
            </button>
            <button class="pi-text-button pi-history-clear" type="button">Clear all</button>
            <button class="pi-icon-button pi-history-close" type="button" aria-label="Close prompt history">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>
        </header>
        <div class="pi-history__list"></div>
        <div class="pi-history__empty" hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path></svg>
          <strong>No prompts saved yet</strong>
          <span>Analyze an image and it will appear here.</span>
          <button class="pi-button pi-history-empty-close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg><span>Close history</span></button>
        </div>
      </aside>
    </div>

    <div class="pi-capture" data-active="false" aria-hidden="true">
      <div class="pi-capture__instruction">
        <span>Drag around the area to analyze</span>
        <kbd>Esc</kbd>
      </div>
      <div class="pi-capture__box" hidden></div>
    </div>

    <div class="pi-image-area" data-active="false" data-processing="false" aria-hidden="true">
      <div class="pi-image-area__surface" tabindex="-1">
        <div class="pi-image-area__dots" aria-hidden="true"></div>
        <div class="pi-image-area__instruction">
          <span>Drag inside the image to select the section</span>
          <kbd>Esc</kbd>
        </div>
        <div class="pi-image-area__box" hidden></div>
      </div>
    </div>
  `;
  shadow.append(stage);
  document.documentElement.append(host);

  const refs = {
    action: shadow.querySelector(".pi-image-action"),
    focusDialog: shadow.querySelector(".pi-focus-dialog"),
    setupTabs: [...shadow.querySelectorAll(".pi-setup-tab")],
    setupPanels: [...shadow.querySelectorAll(".pi-setup-panel")],
    setupFocusMeta: shadow.querySelector(".pi-setup-tab__focus-meta"),
    setupOutputMeta: shadow.querySelector(".pi-setup-tab__output-meta"),
    setupRefineMeta: shadow.querySelector(".pi-setup-tab__refine-meta"),
    focusOptions: [...shadow.querySelectorAll(".pi-focus-option")],
    focusSummary: shadow.querySelector(".pi-focus-summary"),
    focusConfirm: shadow.querySelector(".pi-focus-confirm"),
    focusConfirmLabel: shadow.querySelector(".pi-focus-confirm__label"),
    promptPlatform: shadow.querySelector(".pi-prompt-platform"),
    refinement: shadow.querySelector(".pi-refinement"),
    refinementEnabled: shadow.querySelector(".pi-refinement-enabled"),
    refinementStrength: shadow.querySelector(".pi-refinement-strength"),
    refinementValue: shadow.querySelector(".pi-refinement__value"),
    learningEnabled: shadow.querySelector(".pi-learning-enabled"),
    selectedArea: shadow.querySelector(".pi-selected-area"),
    selectedAreaToggle: shadow.querySelector(".pi-selected-area-toggle"),
    visualsOnly: shadow.querySelector(".pi-visuals-only"),
    includeNegative: shadow.querySelector(".pi-include-negative"),
    shell: shadow.querySelector(".pi-shell"),
    minimize: shadow.querySelector(".pi-minimize"),
    minimizedDock: shadow.querySelector(".pi-minimized-dock"),
    minimizedTime: shadow.querySelector(".pi-minimized-dock__time"),
    historyToggle: shadow.querySelector(".pi-history-toggle"),
    historyClose: shadow.querySelector(".pi-history-close"),
    historyCard: shadow.querySelector(".pi-card--history"),
    historyList: shadow.querySelector(".pi-history__list"),
    historyCount: shadow.querySelector(".pi-history__count"),
    historyEmpty: shadow.querySelector(".pi-history__empty"),
    historyClear: shadow.querySelector(".pi-history-clear"),
    historyExport: shadow.querySelector(".pi-history-export"),
    loading: shadow.querySelector(".pi-loading"),
    pageScan: shadow.querySelector(".pi-page-scan"),
    scanWaveCanvas: shadow.querySelector(".pi-scan-wave__canvas"),
    progressBar: shadow.querySelector(".pi-progress__bar"),
    progressLabel: shadow.querySelector(".pi-progress__label"),
    progressValue: shadow.querySelector(".pi-progress__value"),
    error: shadow.querySelector(".pi-error"),
    errorMessage: shadow.querySelector(".pi-error__message"),
    result: shadow.querySelector(".pi-result"),
    output: shadow.querySelector(".pi-output"),
    tabs: [...shadow.querySelectorAll(".pi-tab")],
    resultDice: shadow.querySelector(".pi-result-dice"),
    resultToolsToggle: shadow.querySelector(".pi-result-tools-toggle"),
    resultEditor: shadow.querySelector(".pi-result-editor"),
    resultToolsClose: shadow.querySelector(".pi-result-editor__close"),
    resultRefine: shadow.querySelector(".pi-editor-refine"),
    resultRefineLabel: shadow.querySelector(".pi-editor-refine__label"),
    resultRandomize: shadow.querySelector(".pi-editor-randomize"),
    resultRandomizeLabel: shadow.querySelector(".pi-editor-randomize__label"),
    backgroundCapsules: [...shadow.querySelectorAll(".pi-editor-capsule")],
    backgroundPicker: shadow.querySelector(".pi-result-editor__select"),
    backgroundSelect: shadow.querySelector(".pi-background-select"),
    tags: shadow.querySelector(".pi-tags"),
    copy: shadow.querySelector(".pi-copy"),
    copyLabel: shadow.querySelector(".pi-copy__label"),
    footer: shadow.querySelector(".pi-footer"),
    provider: shadow.querySelector(".pi-provider"),
    generationTime: shadow.querySelector(".pi-generation-time"),
    generationTimeValue: shadow.querySelector(".pi-generation-time__value"),
    title: shadow.querySelector(".pi-title"),
    preview: shadow.querySelector(".pi-preview__image"),
    capture: shadow.querySelector(".pi-capture"),
    captureBox: shadow.querySelector(".pi-capture__box"),
    imageArea: shadow.querySelector(".pi-image-area"),
    imageAreaSurface: shadow.querySelector(".pi-image-area__surface"),
    imageAreaInstruction: shadow.querySelector(".pi-image-area__instruction span"),
    imageAreaBox: shadow.querySelector(".pi-image-area__box")
  };

  let activeImage = null;
  let activeTab = "english";
  let currentAnalysis = null;
  let currentPromptEdit = null;
  let backgroundEditMode = "source";
  let currentEntryId = "";
  let currentImageUrl = "";
  let contextImage = null;
  let processingImage = null;
  let hideActionTimer = 0;
  let progressTimer = 0;
  let progress = 8;
  let captureOrigin = null;
  let copyResetTimer = 0;
  let activeFocus = ["all"];
  let activeSetupTab = "focus";
  let lastFocus = ["all"];
  let activePromptOptions = { ...defaultPromptOptions };
  let lastPromptOptions = { ...defaultPromptOptions };
  let resultToolsOpen = false;
  let focusResolver = null;
  let generationStartedAt = 0;
  let elapsedTimer = 0;
  let currentDurationMs = 0;
  let focusCanSelectArea = false;
  let imageAreaTarget = null;
  let imageAreaOrigin = null;
  let imageAreaSelection = null;
  let imageAreaPositionFrame = 0;
  let pageScanPositionFrame = 0;
  let scanWaveFrame = 0;
  let scanWaveStartedAt = 0;
  let extensionEnabled = false;

  document.addEventListener("mouseover", onDocumentMouseOver, true);
  document.addEventListener("mouseout", onDocumentMouseOut, true);
  document.addEventListener("focusin", onDocumentFocus, true);
  document.addEventListener("contextmenu", onDocumentContextMenu, true);
  window.addEventListener("scroll", scheduleActionPosition, { passive: true });
  window.addEventListener("resize", scheduleActionPosition, { passive: true });
  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.prompitConfig) return;
    setExtensionEnabled(changes.prompitConfig.newValue?.extensionEnabled !== false);
  });

  refs.action.addEventListener("pointerenter", () => clearTimeout(hideActionTimer));
  refs.action.addEventListener("pointerleave", scheduleHideAction);
  refs.action.addEventListener("click", async () => {
    const image = activeImage;
    if (!image) return;
    const choice = await chooseAnalysisFocus(image.currentSrc || image.src || "", true);
    if (!choice.ok) return;
    if (choice.promptOptions.selectionMode === "selected_area") {
      startImageAreaSelection(image, choice.focus, choice.promptOptions);
    } else {
      await analyzeElement(image, choice.focus, choice.promptOptions);
    }
  });
  refs.focusOptions.forEach((option) => option.addEventListener("click", () => toggleFocusOption(option.dataset.focus)));
  refs.setupTabs.forEach((tab) => {
    tab.addEventListener("click", () => selectSetupTab(tab.dataset.setupTab, true));
    tab.addEventListener("keydown", onSetupTabKeydown);
  });
  [refs.promptPlatform, refs.refinementEnabled, refs.learningEnabled, refs.selectedArea, refs.visualsOnly, refs.includeNegative].forEach((control) => {
    control.addEventListener("change", () => {
      updateFocusSummary();
      persistPromptSetup();
    });
  });
  refs.refinementEnabled.addEventListener("change", () => {
    updateRefinementState();
    persistPromptSetup();
  });
  refs.refinementStrength.addEventListener("input", () => {
    updateRefinementState();
    persistPromptSetup();
  });
  refs.focusConfirm.addEventListener("click", confirmFocusChoice);
  shadow.querySelector(".pi-focus-close").addEventListener("click", cancelFocusChoice);
  shadow.querySelector(".pi-focus-cancel").addEventListener("click", cancelFocusChoice);
  refs.focusDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    cancelFocusChoice();
  });
  refs.focusDialog.addEventListener("pointerdown", (event) => {
    if (event.target === refs.focusDialog) cancelFocusChoice();
  });
  shadow.querySelector(".pi-close").addEventListener("click", closeDock);
  refs.minimize.addEventListener("click", minimizeDock);
  refs.minimizedDock.addEventListener("click", restoreDock);
  shadow.querySelector(".pi-settings").addEventListener("click", openSettings);
  shadow.querySelector(".pi-error__settings").addEventListener("click", openSettings);
  refs.historyToggle.addEventListener("click", () => toggleHistory());
  refs.historyClose.addEventListener("click", () => toggleHistory(false));
  shadow.querySelector(".pi-history-empty-close").addEventListener("click", () => toggleHistory(false));
  refs.historyClear.addEventListener("click", clearHistory);
  refs.historyExport.addEventListener("click", exportHistory);
  refs.copy.addEventListener("click", copyCurrentPrompt);
  refs.tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
    tab.addEventListener("keydown", onTabKeydown);
  });
  refs.resultToolsToggle.addEventListener("click", () => toggleResultTools());
  refs.resultToolsClose.addEventListener("click", () => toggleResultTools(false));
  refs.resultDice.addEventListener("click", () => randomizeCurrentPrompt());
  refs.backgroundCapsules.forEach((capsule) => {
    capsule.addEventListener("click", () => setBackgroundEditMode(capsule.dataset.backgroundMode));
  });
  refs.backgroundSelect.addEventListener("change", () => applyBackgroundPreset(refs.backgroundSelect.value));
  refs.resultRefine.addEventListener("click", refineCurrentPrompt);
  refs.resultRandomize.addEventListener("click", () => randomizeCurrentPrompt({ keepToolsOpen: true }));

  refs.capture.addEventListener("pointerdown", startCaptureDrag);
  refs.capture.addEventListener("pointermove", moveCaptureDrag);
  refs.capture.addEventListener("pointerup", finishCaptureDrag);
  refs.capture.addEventListener("pointercancel", cancelCapture);
  refs.imageAreaSurface.addEventListener("pointerdown", startImageAreaDrag);
  refs.imageAreaSurface.addEventListener("pointermove", moveImageAreaDrag);
  refs.imageAreaSurface.addEventListener("pointerup", finishImageAreaDrag);
  refs.imageAreaSurface.addEventListener("pointercancel", cancelImageAreaSelection);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && refs.capture.dataset.active === "true") cancelCapture();
    if (event.key === "Escape" && refs.imageArea.dataset.active === "true") cancelImageAreaSelection();
    if (event.key === "Escape" && resultToolsOpen) {
      event.preventDefault();
      toggleResultTools(false);
      refs.resultToolsToggle.focus({ preventScroll: true });
    }
  }, true);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!extensionEnabled) {
      if (["PROMPIT_START_CAPTURE", "PROMPIT_CHOOSE_ANALYSIS_FOCUS", "PROMPIT_START_IMAGE_AREA_SELECTION"].includes(message?.type)) {
        sendResponse({ ok: false, error: "Promp it is turned off. Enable it in Settings to use image analysis." });
      }
      return undefined;
    }
    if (message?.type === "PROMPIT_STATUS") {
      if (message.state === "loading") showLoading(message);
      if (message.state === "error") showError(message.error, message.provider, message.durationMs);
    }
    if (message?.type === "PROMPIT_RESULT" && message.ok) showResult(message);
    if (message?.type === "PROMPIT_SELECTION_CAPTURED" && message.selectionMode === "selected_area") {
      showImageAreaProcessing(message.selection);
    }
    if (message?.type === "PROMPIT_START_CAPTURE") {
      chooseAnalysisFocus("", false).then((choice) => {
        if (choice.ok) startCapture(choice.focus, choice.promptOptions);
        sendResponse(choice);
      });
      return true;
    }
    if (message?.type === "PROMPIT_CHOOSE_ANALYSIS_FOCUS") {
      const image = findContextImage(message.imageUrl);
      if (image) {
        activeImage = image;
        processingImage = image;
      }
      chooseAnalysisFocus(message.imageUrl, Boolean(image)).then(sendResponse);
      return true;
    }
    if (message?.type === "PROMPIT_START_IMAGE_AREA_SELECTION") {
      const image = findContextImage(message.imageUrl);
      if (!image) {
        sendResponse({ ok: false, error: "The selected image is no longer visible on this page." });
        return undefined;
      }
      activeImage = image;
      startImageAreaSelection(image, message.focus, message.promptOptions);
      sendResponse({ ok: true });
      return undefined;
    }
    if (message?.type === "PROMPIT_RESOLVE_IMAGE") {
      resolveImageData(message.imageUrl).then(sendResponse);
      return true;
    }
    if (message?.type === "PROMPIT_GET_CONTEXT_IMAGE_SELECTION") {
      getContextImageSelection(message.imageUrl).then(sendResponse);
      return true;
    }
    return undefined;
  });

  function onDocumentMouseOver(event) {
    if (!extensionEnabled) return;
    const image = event.target instanceof Element ? event.target.closest("img") : null;
    if (!image || !isEligibleImage(image)) return;
    activeImage = image;
    currentImageUrl = image.currentSrc || image.src || "";
    showAction();
  }

  function onDocumentMouseOut(event) {
    if (!activeImage || event.target !== activeImage) return;
    const related = event.relatedTarget;
    if (related && (related === host || host.contains?.(related))) return;
    scheduleHideAction();
  }

  function onDocumentFocus(event) {
    if (!extensionEnabled) return;
    const image = event.target instanceof Element ? event.target.closest("img") : null;
    if (!image || !isEligibleImage(image)) return;
    activeImage = image;
    currentImageUrl = image.currentSrc || image.src || "";
    showAction();
  }

  function onDocumentContextMenu(event) {
    if (!extensionEnabled) return;
    contextImage = event.target instanceof Element ? event.target.closest("img") : null;
  }

  function isEligibleImage(image) {
    const rect = image.getBoundingClientRect();
    const style = getComputedStyle(image);
    return rect.width >= 140 && rect.height >= 90 && style.visibility !== "hidden" && style.display !== "none";
  }

  function showAction() {
    if (!extensionEnabled) return;
    clearTimeout(hideActionTimer);
    refs.action.dataset.visible = "true";
    refs.action.tabIndex = 0;
    positionAction();
  }

  function scheduleHideAction() {
    clearTimeout(hideActionTimer);
    hideActionTimer = window.setTimeout(() => {
      refs.action.dataset.visible = "false";
      refs.action.tabIndex = -1;
    }, 240);
  }

  let positionFrame = 0;
  function scheduleActionPosition() {
    scheduleImageAreaPosition();
    schedulePageScanPosition();
    cancelAnimationFrame(positionFrame);
    positionFrame = requestAnimationFrame(positionAction);
  }

  function positionAction() {
    if (!extensionEnabled) return;
    if (!activeImage || refs.action.dataset.visible !== "true") return;
    const rect = activeImage.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
      refs.action.dataset.visible = "false";
      return;
    }
    const estimatedWidth = 150;
    const x = clamp(rect.right - estimatedWidth, 8, window.innerWidth - estimatedWidth - 8);
    const y = rect.top >= 52 ? rect.top - 48 : Math.max(8, rect.top + 8);
    refs.action.style.setProperty("--pill-x", `${Math.round(x)}px`);
    refs.action.style.setProperty("--pill-y", `${Math.round(y)}px`);
  }

  function getPageScanTarget() {
    const candidate = processingImage?.isConnected ? processingImage : null;
    return candidate && isEligibleImage(candidate) ? candidate : null;
  }

  function positionPageScan(target = getPageScanTarget()) {
    const bounds = getImageAreaBounds(target);
    if (!bounds || bounds.width < 24 || bounds.height < 24) {
      refs.pageScan.dataset.active = "false";
      return false;
    }
    const style = getComputedStyle(target);
    refs.pageScan.style.transform = `translate3d(${Math.round(bounds.x)}px, ${Math.round(bounds.y)}px, 0)`;
    refs.pageScan.style.width = `${Math.round(bounds.width)}px`;
    refs.pageScan.style.height = `${Math.round(bounds.height)}px`;
    refs.pageScan.style.borderRadius = style.borderRadius;
    refs.pageScan.dataset.active = "true";
    return true;
  }

  function schedulePageScanPosition() {
    if (refs.pageScan.dataset.active !== "true") return;
    cancelAnimationFrame(pageScanPositionFrame);
    pageScanPositionFrame = requestAnimationFrame(() => positionPageScan());
  }

  async function chooseAnalysisFocus(imageUrl = "", canSelectArea = false) {
    if (!extensionEnabled) {
      return { ok: false, error: "Promp it is turned off. Enable it in Settings to use image analysis." };
    }
    if (focusResolver) cancelFocusChoice();
    currentImageUrl = imageUrl || currentImageUrl;
    focusCanSelectArea = Boolean(canSelectArea && activeImage?.isConnected);
    const [configuredEnhancement, rememberedSetup] = await Promise.all([
      getConfiguredEnhancement(),
      getRememberedPromptSetup()
    ]);
    if (rememberedSetup) {
      lastFocus = rememberedSetup.focus;
      lastPromptOptions = { ...lastPromptOptions, ...configuredEnhancement, ...rememberedSetup.promptOptions };
    } else {
      lastPromptOptions = { ...lastPromptOptions, ...configuredEnhancement };
    }
    setFocusSelection(lastFocus);
    setPromptOptions(lastPromptOptions);
    selectSetupTab("focus", false);
    refs.action.dataset.visible = "false";
    return new Promise((resolve) => {
      focusResolver = resolve;
      refs.focusDialog.showModal();
      requestAnimationFrame(() => {
        const selected = refs.focusOptions.find((option) => option.getAttribute("aria-pressed") === "true");
        selected?.focus({ preventScroll: true });
      });
    });
  }

  function toggleFocusOption(name) {
    if (name === "all") {
      setFocusSelection(["all"]);
      persistPromptSetup();
      return;
    }
    const selected = new Set(getFocusSelection().filter((item) => item !== "all"));
    if (selected.has(name)) selected.delete(name);
    else selected.add(name);
    setFocusSelection(selected.size ? [...selected] : ["all"]);
    persistPromptSetup();
  }

  function selectSetupTab(name, shouldFocus = false) {
    const next = refs.setupTabs.some((tab) => tab.dataset.setupTab === name) ? name : "focus";
    activeSetupTab = next;
    refs.setupTabs.forEach((tab) => {
      const selected = tab.dataset.setupTab === next;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.dataset.state = selected ? "success" : "default";
    });
    refs.setupPanels.forEach((panel) => {
      panel.hidden = panel.dataset.setupPanel !== next;
    });
    if (shouldFocus) {
      refs.setupTabs.find((tab) => tab.dataset.setupTab === next)?.focus({ preventScroll: true });
    }
  }

  function onSetupTabKeydown(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = Math.max(0, refs.setupTabs.findIndex((tab) => tab.dataset.setupTab === activeSetupTab));
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? refs.setupTabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + refs.setupTabs.length) % refs.setupTabs.length;
    selectSetupTab(refs.setupTabs[nextIndex].dataset.setupTab, true);
  }

  function setFocusSelection(focus) {
    const selected = sanitizeFocus(focus);
    refs.focusOptions.forEach((option) => {
      option.setAttribute("aria-pressed", String(selected.includes(option.dataset.focus)));
      option.dataset.state = selected.includes(option.dataset.focus) ? "success" : "default";
    });
    updateFocusSummary();
  }

  function getFocusSelection() {
    return sanitizeFocus(
      refs.focusOptions
        .filter((option) => option.getAttribute("aria-pressed") === "true")
        .map((option) => option.dataset.focus)
    );
  }

  function confirmFocusChoice() {
    const focus = getFocusSelection();
    const promptOptions = getPromptOptions();
    lastFocus = focus;
    lastPromptOptions = promptOptions;
    activeFocus = focus;
    activePromptOptions = promptOptions;
    persistPromptSetup({ focus, promptOptions });
    finishFocusChoice({ ok: true, focus, promptOptions });
  }

  function cancelFocusChoice() {
    finishFocusChoice({ ok: false, cancelled: true });
  }

  function finishFocusChoice(result) {
    if (refs.focusDialog.open) refs.focusDialog.close();
    const resolve = focusResolver;
    focusResolver = null;
    resolve?.(result);
  }

  function sanitizeFocus(value) {
    const input = Array.isArray(value) ? value : [value];
    if (input.some((item) => item === "all")) return ["all"];
    const selected = focusOrder.filter((item) => input.includes(item));
    return selected.length ? selected : ["all"];
  }

  function setPromptOptions(value) {
    const options = sanitizePromptOptions(value);
    refs.promptPlatform.value = options.platform;
    refs.refinementEnabled.checked = options.refinementEnabled;
    refs.refinementStrength.value = String(options.refinementStrength);
    refs.learningEnabled.checked = options.learningEnabled;
    refs.selectedArea.checked = focusCanSelectArea && options.selectionMode === "selected_area";
    refs.selectedArea.disabled = !focusCanSelectArea;
    refs.selectedAreaToggle.dataset.state = focusCanSelectArea ? "default" : "disabled";
    refs.selectedAreaToggle.querySelector("small").textContent = focusCanSelectArea
      ? "Draw a box on this image; only those pixels are analyzed."
      : "Available from the Prompt image button above a web image.";
    refs.visualsOnly.checked = options.textMode === "visuals_only";
    refs.includeNegative.checked = options.includeNegative;
    updateRefinementState();
    updateFocusSummary();
  }

  function getPromptOptions() {
    return sanitizePromptOptions({
      textMode: refs.visualsOnly.checked ? "visuals_only" : "include_text",
      includeNegative: refs.includeNegative.checked,
      platform: refs.promptPlatform.value,
      enhancement: lastPromptOptions.enhancement,
      creativeDirection: lastPromptOptions.creativeDirection,
      creativeLatitude: lastPromptOptions.creativeLatitude,
      refinementEnabled: refs.refinementEnabled.checked,
      refinementStrength: Number(refs.refinementStrength.value),
      learningEnabled: refs.learningEnabled.checked,
      selectionMode: focusCanSelectArea && refs.selectedArea.checked ? "selected_area" : "full_image"
    });
  }

  function sanitizePromptOptions(value = {}) {
    const input = value && typeof value === "object" ? value : {};
    return {
      textMode: input.textMode === "include_text" ? "include_text" : "visuals_only",
      includeNegative: input.includeNegative !== false,
      platform: Object.prototype.hasOwnProperty.call(platformLabels, input.platform)
        ? input.platform
        : defaultPromptOptions.platform,
      enhancement: Object.prototype.hasOwnProperty.call(enhancementLabels, input.enhancement)
        ? input.enhancement
        : defaultPromptOptions.enhancement,
      creativeDirection: Object.prototype.hasOwnProperty.call(creativeDirectionLabels, input.creativeDirection)
        ? input.creativeDirection
        : defaultPromptOptions.creativeDirection,
      creativeLatitude: Object.prototype.hasOwnProperty.call(creativeLatitudeLabels, input.creativeLatitude)
        ? input.creativeLatitude
        : defaultPromptOptions.creativeLatitude,
      refinementEnabled: input.refinementEnabled !== false,
      refinementStrength: Number.isFinite(Number(input.refinementStrength))
        ? clamp(Math.round(Number(input.refinementStrength)), 0, 100)
        : defaultPromptOptions.refinementStrength,
      learningEnabled: input.learningEnabled !== false,
      selectionMode: input.selectionMode === "selected_area" ? "selected_area" : "full_image"
    };
  }

  async function getRememberedPromptSetup() {
    try {
      const stored = await chrome.storage.local.get(PROMPT_SETUP_STORAGE_KEY);
      const saved = stored?.[PROMPT_SETUP_STORAGE_KEY];
      if (!saved || typeof saved !== "object") return null;
      return {
        focus: sanitizeFocus(saved.focus),
        promptOptions: sanitizePromptOptions({
          textMode: saved.promptOptions?.textMode,
          includeNegative: saved.promptOptions?.includeNegative,
          platform: saved.promptOptions?.platform,
          refinementStrength: saved.promptOptions?.refinementStrength,
          selectionMode: saved.promptOptions?.selectionMode
        })
      };
    } catch {
      return null;
    }
  }

  function persistPromptSetup(value = null) {
    const focus = sanitizeFocus(value?.focus || getFocusSelection());
    const options = sanitizePromptOptions(value?.promptOptions || getPromptOptions());
    const savedOptions = {
      textMode: options.textMode,
      includeNegative: options.includeNegative,
      platform: options.platform,
      refinementStrength: options.refinementStrength,
      selectionMode: options.selectionMode
    };
    chrome.storage.local.set({
      [PROMPT_SETUP_STORAGE_KEY]: { version: 1, focus, promptOptions: savedOptions }
    }).catch(() => {});
  }

  function updateRefinementState() {
    const enabled = refs.refinementEnabled.checked;
    const strength = clamp(Math.round(Number(refs.refinementStrength.value) || 0), 0, 100);
    refs.refinement.style.setProperty("--pi-strength", String(strength));
    refs.refinement.dataset.state = enabled ? "default" : "disabled";
    refs.refinementStrength.disabled = !enabled;
    refs.refinementStrength.setAttribute("aria-disabled", String(!enabled));
    refs.learningEnabled.disabled = !enabled;
    refs.learningEnabled.closest(".pi-prompt-toggle").dataset.state = enabled ? "default" : "disabled";
    refs.refinementValue.value = String(strength);
    refs.refinementValue.textContent = String(strength);
    updateFocusSummary();
  }

  function updateFocusSummary() {
    const selected = getFocusSelection();
    const options = getPromptOptions();
    const focusSummary = selected[0] === "all"
      ? "All details"
      : selected.map((item) => focusLabels[item]).join(" + ");
    const textSummary = options.textMode === "visuals_only" ? "visuals only" : "include text";
    const refinementSummary = options.refinementEnabled ? `refine ${options.refinementStrength}` : "exact";
    const areaSummary = options.selectionMode === "selected_area" ? "selected area" : "full image";
    refs.focusSummary.textContent = `${focusSummary} · ${platformLabels[options.platform]} · ${refinementSummary} · ${areaSummary} · ${textSummary}`;
    refs.focusConfirmLabel.textContent = options.selectionMode === "selected_area" ? "Select section" : "Analyze";
    refs.setupFocusMeta.textContent = selected[0] === "all" ? "All" : String(selected.length);
    refs.setupOutputMeta.textContent = platformLabels[options.platform];
    refs.setupRefineMeta.textContent = options.refinementEnabled ? String(options.refinementStrength) : "Off";
  }

  async function getConfiguredEnhancement() {
    try {
      const config = await chrome.runtime.sendMessage({ type: "PROMPIT_GET_PROMPT_DEFAULTS" }) || {};
      return {
        enhancement: config.promptEnhancementEnabled === false
          ? "faithful"
          : ["professional", "premium_ad"].includes(config.promptEnhancementPreset)
            ? config.promptEnhancementPreset
            : defaultPromptOptions.enhancement,
        creativeDirection: Object.prototype.hasOwnProperty.call(creativeDirectionLabels, config.promptCreativeDirection)
          ? config.promptCreativeDirection
          : defaultPromptOptions.creativeDirection,
        creativeLatitude: Object.prototype.hasOwnProperty.call(creativeLatitudeLabels, config.promptCreativeLatitude)
          ? config.promptCreativeLatitude
          : defaultPromptOptions.creativeLatitude,
        refinementEnabled: config.promptEnhancementEnabled !== false,
        refinementStrength: config.promptCreativeLatitude === "strict" ? 20 : config.promptCreativeLatitude === "exploratory" ? 80 : 50,
        learningEnabled: config.promptLearningEnabled !== false
      };
    } catch {
      return {
        enhancement: defaultPromptOptions.enhancement,
        creativeDirection: defaultPromptOptions.creativeDirection,
        creativeLatitude: defaultPromptOptions.creativeLatitude,
        refinementEnabled: defaultPromptOptions.refinementEnabled,
        refinementStrength: defaultPromptOptions.refinementStrength,
        learningEnabled: defaultPromptOptions.learningEnabled
      };
    }
  }

  function focusLabel(focus = activeFocus) {
    const selected = sanitizeFocus(focus);
    return selected[0] === "all" ? "complete" : selected.map((item) => focusLabels[item].toLowerCase()).join(" + ");
  }

  async function analyzeElement(image, focus = ["all"], promptOptions = defaultPromptOptions) {
    if (!extensionEnabled) return;
    const imageUrl = image.currentSrc || image.src || "";
    activeFocus = sanitizeFocus(focus);
    activePromptOptions = sanitizePromptOptions(promptOptions);
    currentImageUrl = imageUrl;
    processingImage = image;
    refs.action.dataset.visible = "false";

    const selection = getVisibleImageSelection(image);
    if (!selection) {
      showError("Promp it could not see enough of this image. Scroll it into view or use Capture area.");
      return;
    }

    try {
      await waitForPaint();
      const response = await chrome.runtime.sendMessage({
        type: "PROMPIT_CAPTURE_SELECTION",
        selection,
        focus: activeFocus,
        promptOptions: activePromptOptions
      });
      if (response?.ok) showResult(response);
      else if (response?.error) showError(response.error, response.provider, response.durationMs);
    } catch {
      showError("The extension connection closed before the analysis finished. Reload this page and try again.");
    }
  }

  async function getContextImageSelection(imageUrl) {
    if (!extensionEnabled) return { ok: false };
    const image = findContextImage(imageUrl);
    const selection = getVisibleImageSelection(image);
    if (!selection) return { ok: false };
    refs.action.dataset.visible = "false";
    processingImage = image;
    await waitForPaint();
    return { ok: true, selection };
  }

  function findContextImage(imageUrl = "") {
    if (contextImage?.isConnected) return contextImage;
    if (!imageUrl) return null;
    return [...document.images].find((candidate) => {
      const sources = [candidate.currentSrc, candidate.src].filter(Boolean);
      return sources.includes(imageUrl);
    }) || null;
  }

  function getVisibleImageSelection(image) {
    if (!image) return null;
    const rect = image.getBoundingClientRect();
    const x = Math.max(0, rect.left);
    const y = Math.max(0, rect.top);
    const right = Math.min(window.innerWidth, rect.right);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    const width = right - x;
    const height = bottom - y;
    if (width < 24 || height < 24) return null;
    return {
      x,
      y,
      width,
      height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  function openDock() {
    refs.shell.dataset.open = "true";
    refs.shell.setAttribute("aria-hidden", "false");
  }

  function minimizeDock() {
    refs.shell.dataset.minimized = "true";
    refs.minimizedDock.hidden = false;
    toggleHistory(false);
    refs.minimizedDock.focus({ preventScroll: true });
  }

  function restoreDock() {
    refs.shell.dataset.minimized = "false";
    refs.minimizedDock.hidden = true;
    refs.minimize.focus({ preventScroll: true });
  }

  function closeDock() {
    stopProgress();
    refs.shell.dataset.mode = "idle";
    refs.shell.dataset.open = "false";
    refs.shell.dataset.minimized = "false";
    refs.minimizedDock.hidden = true;
    refs.shell.setAttribute("aria-hidden", "true");
    toggleHistory(false);
  }

  function showLoading({ progress: nextProgress = 8, label = "Reading the image…", imageUrl = currentImageUrl, provider = "" } = {}) {
    openDock();
    if (!generationStartedAt) beginGenerationTimer();
    currentImageUrl = imageUrl || currentImageUrl;
    refs.shell.dataset.mode = "loading";
    refs.loading.hidden = false;
    refs.error.hidden = true;
    refs.result.hidden = true;
    refs.title.textContent = activeFocus[0] === "all" ? "Building your prompt" : `Building ${focusLabel()} prompt`;
    refs.provider.textContent = provider ? `Analyzing ${focusLabel()} with ${provider}` : "Preparing vision runtime";
    refs.footer.dataset.mode = "loading";
    refs.copy.hidden = false;
    refs.copy.disabled = true;
    refs.copy.dataset.state = "loading";
    refs.copyLabel.textContent = "Analyzing";
    setPreview(currentImageUrl);
    setProgress(nextProgress, label);
    startProgress();
    startScanWave();
  }

  function setProgress(value, label) {
    progress = Math.max(progress, Math.min(96, Number(value) || 0));
    refs.progressBar.style.setProperty("--progress", `${progress / 100}`);
    refs.progressValue.textContent = `${Math.round(progress)}%`;
    if (label) refs.progressLabel.textContent = label;
  }

  function startProgress() {
    if (progressTimer) return;
    progressTimer = window.setInterval(() => {
      if (progress >= 82) return;
      setProgress(progress + (progress < 40 ? 5 : 2));
    }, 850);
  }

  function stopProgress() {
    clearInterval(progressTimer);
    progressTimer = 0;
    stopScanWave();
  }

  function startScanWave() {
    if (!positionPageScan()) return;
    if (scanWaveFrame || !refs.scanWaveCanvas) return;
    const canvas = refs.scanWaveCanvas;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    scanWaveStartedAt = performance.now();
    const dotColor = getComputedStyle(refs.pageScan).color;
    const draw = (time) => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * pixelRatio);
      const pixelHeight = Math.round(height * pixelRatio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      const seconds = (time - scanWaveStartedAt) / 1000;
      const movement = reducedMotion ? 0 : seconds * 0.8;
      const spacing = Math.max(13, Math.min(22, Math.round(Math.min(width, height) / 42)));
      for (let y = spacing * 0.5; y < height; y += spacing) {
        for (let x = spacing * 0.5; x < width; x += spacing) {
          const diagonal = (x / width) + (y / height);
          const wavePositionA = 0.72 + Math.sin(movement) * 0.10;
          const wavePositionB = 1.48 + Math.cos(movement * 0.75) * 0.10;
          const waveA = Math.exp(-Math.pow(diagonal - wavePositionA, 2) / 0.045);
          const waveB = Math.exp(-Math.pow(diagonal - wavePositionB, 2) / 0.065);
          const ripple = reducedMotion ? 0.9 : 0.78 + 0.22 * Math.sin(x * 0.025 - y * 0.018 - movement * 2.4);
          const intensity = Math.max(waveA, waveB) * ripple * 0.85;
          const radius = 0.45 + 2.9 * intensity;
          context.globalAlpha = 0.12 + intensity * 0.55;
          context.fillStyle = dotColor;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
      if (!reducedMotion) scanWaveFrame = requestAnimationFrame(draw);
    };
    draw(performance.now());
  }

  function stopScanWave() {
    refs.pageScan.dataset.active = "false";
    if (scanWaveFrame) cancelAnimationFrame(scanWaveFrame);
    scanWaveFrame = 0;
    scanWaveStartedAt = 0;
    const canvas = refs.scanWaveCanvas;
    const context = canvas?.getContext("2d");
    if (context && canvas) context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function beginGenerationTimer() {
    generationStartedAt = performance.now();
    currentDurationMs = 0;
    refs.generationTime.hidden = false;
    updateGenerationTime();
    clearInterval(elapsedTimer);
    elapsedTimer = window.setInterval(updateGenerationTime, 100);
  }

  function finishGenerationTimer(durationMs = 0) {
    clearInterval(elapsedTimer);
    elapsedTimer = 0;
    const measured = generationStartedAt ? performance.now() - generationStartedAt : 0;
    currentDurationMs = Math.max(0, Number(durationMs) || measured);
    generationStartedAt = 0;
    refs.generationTime.hidden = currentDurationMs <= 0;
    updateGenerationTime();
  }

  function updateGenerationTime() {
    const elapsed = generationStartedAt ? performance.now() - generationStartedAt : currentDurationMs;
    const value = `${(Math.max(0, elapsed) / 1000).toFixed(1)} s`;
    refs.generationTimeValue.textContent = value;
    refs.minimizedTime.textContent = generationStartedAt ? `Working · ${value}` : value;
  }

  function showError(message, provider = "", durationMs = 0) {
    finishImageAreaProcessing();
    openDock();
    stopProgress();
    processingImage = null;
    finishGenerationTimer(durationMs);
    refs.shell.dataset.mode = "error";
    refs.loading.hidden = true;
    refs.result.hidden = true;
    refs.error.hidden = false;
    refs.errorMessage.textContent = String(message || "Promp it could not complete the analysis.");
    refs.title.textContent = "Prompt unavailable";
    refs.provider.textContent = provider ? `${provider} could not complete the request` : "Check vision settings";
    refs.footer.dataset.mode = "error";
    refs.copy.hidden = true;
    refs.copy.disabled = true;
    refs.copy.dataset.state = "disabled";
    refs.copyLabel.textContent = "Copy prompt";
  }

  function showResult(response, { keepToolsOpen = false } = {}) {
    if (!response?.analysis) return;
    finishImageAreaProcessing();
    openDock();
    stopProgress();
    processingImage = null;
    finishGenerationTimer(response.durationMs || response.entry?.durationMs || 0);
    refs.shell.dataset.mode = "result";
    activeFocus = sanitizeFocus(response.focus || response.entry?.focus || response.analysis?.json?.analysis_focus);
    activePromptOptions = sanitizePromptOptions(
      response.promptOptions || response.entry?.promptOptions || response.analysis?.json?.prompt_options
    );
    currentAnalysis = response.analysis;
    currentEntryId = String(response.entry?.id || "");
    currentPromptEdit = getPromptEdit(response.entry?.promptEdit, currentAnalysis);
    backgroundEditMode = currentPromptEdit.backgroundPreset ? "replace" : "source";
    resultToolsOpen = keepToolsOpen && activeTab === "english";
    refs.loading.hidden = true;
    refs.error.hidden = true;
    refs.result.hidden = false;
    refs.title.textContent = response.randomStyle?.label
      ? `${response.randomStyle.label} prompt ready`
      : activeFocus[0] === "all" ? "Prompt ready" : `${focusLabel()} prompt ready`;
    const target = platformLabels[activePromptOptions.platform];
    const enhancement = activePromptOptions.refinementEnabled
      ? `${enhancementLabels[activePromptOptions.enhancement]} ${activePromptOptions.refinementStrength}`
      : "exact";
    const direction = creativeDirectionLabels[activePromptOptions.creativeDirection] || "current art direction";
    refs.provider.textContent = response.provider
      ? `Generated with ${response.provider} · ${target} · ${enhancement} · ${direction}`
      : `Saved to local history · ${target} · ${enhancement} · ${direction}`;
    refs.footer.dataset.mode = "result";
    refs.copy.hidden = false;
    refs.copy.disabled = false;
    refs.copy.dataset.state = "default";
    refs.copyLabel.textContent = "Copy prompt";
    syncResultEditor();
    selectTab(activeTab);
    renderTags(currentAnalysis.json);
    loadHistory();
  }

  function selectTab(name) {
    if (!currentAnalysis) return;
    activeTab = ["english", "json"].includes(name) ? name : "english";
    refs.tabs.forEach((tab) => {
      const selected = tab.dataset.tab === activeTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    refs.output.dir = "ltr";
    refs.output.lang = activeTab === "english" ? "en" : "";
    refs.output.textContent = getCurrentText();
    syncResultTools();
  }

  function toggleResultTools(force) {
    if (!currentAnalysis || activeTab !== "english") return;
    resultToolsOpen = typeof force === "boolean" ? force : !resultToolsOpen;
    syncResultTools();
    if (resultToolsOpen) refs.resultRefine.focus({ preventScroll: true });
  }

  function syncResultTools() {
    const available = Boolean(currentAnalysis) && activeTab === "english";
    const open = available && resultToolsOpen;
    refs.resultToolsToggle.hidden = !available;
    refs.resultToolsToggle.disabled = !available;
    refs.resultDice.hidden = !available;
    refs.resultDice.disabled = !available;
    refs.resultToolsToggle.setAttribute("aria-expanded", String(open));
    refs.resultToolsToggle.dataset.state = open ? "success" : "default";
    refs.resultEditor.hidden = !open;
  }

  function onTabKeydown(event) {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const current = refs.tabs.findIndex((tab) => tab.dataset.tab === activeTab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = refs.tabs[(current + direction + refs.tabs.length) % refs.tabs.length];
    next.focus({ preventScroll: true });
    selectTab(next.dataset.tab);
  }

  function getCurrentText() {
    if (!currentAnalysis) return "";
    if (activeTab === "json") return JSON.stringify(currentAnalysis.json, null, 2);
    return String(currentAnalysis[activeTab] || "");
  }

  function getPromptEdit(value, analysis) {
    const input = value && typeof value === "object" ? value : {};
    const background = backgroundPresets.find((preset) => preset.id === input.backgroundPreset) || null;
    return {
      originalEnglish: String(input.originalEnglish || analysis?.english || ""),
      originalGenerationPrompt: String(input.originalGenerationPrompt || analysis?.json?.generation_prompt_en || analysis?.english || ""),
      originalBackground: String(input.originalBackground || analysis?.json?.background || ""),
      originalEnvironment: String(input.originalEnvironment || analysis?.json?.environment || ""),
      backgroundPreset: background?.id || ""
    };
  }

  function syncResultEditor() {
    const preset = backgroundPresets.find((item) => item.id === currentPromptEdit?.backgroundPreset) || null;
    const replacing = backgroundEditMode === "replace";
    refs.backgroundCapsules.forEach((capsule) => {
      const active = capsule.dataset.backgroundMode === (replacing ? "replace" : "source");
      capsule.setAttribute("aria-pressed", String(active));
    });
    refs.backgroundSelect.disabled = !replacing;
    refs.backgroundPicker.hidden = !replacing;
    refs.backgroundSelect.value = preset?.id || "";
  }

  function setBackgroundEditMode(mode) {
    if (!currentAnalysis || !currentPromptEdit) return;
    if (mode === "source") {
      restoreSourceBackground();
      return;
    }
    backgroundEditMode = "replace";
    refs.backgroundSelect.disabled = false;
    syncResultEditor();
    refs.backgroundSelect.focus({ preventScroll: true });
  }

  function applyBackgroundPreset(presetId) {
    if (!currentAnalysis || !currentPromptEdit) return;
    const preset = backgroundPresets.find((item) => item.id === presetId);
    if (!preset) return;
    backgroundEditMode = "replace";
    currentAnalysis.english = replaceBackgroundInPrompt(currentPromptEdit.originalEnglish, preset.prompt);
    if (currentAnalysis.json && typeof currentAnalysis.json === "object") {
      currentAnalysis.json = {
        ...currentAnalysis.json,
        background: preset.prompt,
        environment: preset.prompt,
        generation_prompt_en: replaceBackgroundInPrompt(currentPromptEdit.originalGenerationPrompt, preset.prompt),
        background_override: { id: preset.id, label: preset.label, prompt: preset.prompt }
      };
    }
    currentPromptEdit.backgroundPreset = preset.id;
    syncResultEditor();
    selectTab(activeTab);
    renderTags(currentAnalysis.json);
    persistPromptEdit();
  }

  function restoreSourceBackground() {
    if (!currentAnalysis || !currentPromptEdit) return;
    currentAnalysis.english = currentPromptEdit.originalEnglish;
    if (currentAnalysis.json && typeof currentAnalysis.json === "object") {
      const { background_override: _backgroundOverride, ...json } = currentAnalysis.json;
      currentAnalysis.json = {
        ...json,
        background: currentPromptEdit.originalBackground,
        environment: currentPromptEdit.originalEnvironment,
        generation_prompt_en: currentPromptEdit.originalGenerationPrompt
      };
    }
    currentPromptEdit.backgroundPreset = "";
    backgroundEditMode = "source";
    syncResultEditor();
    selectTab(activeTab);
    renderTags(currentAnalysis.json);
    persistPromptEdit();
  }

  function replaceBackgroundInPrompt(value, replacement) {
    const source = String(value || "").replace(/\s+/g, " ").trim();
    const backgroundTerms = "background|backdrop|environment|surroundings|scenery|studio|seamless|wall|floor";
    const clauses = source
      .split(/(?<=[.;])\s+|\s*;\s*/)
      .map((clause) => clause.trim())
      .filter((clause) => clause && !new RegExp(`\\b(?:${backgroundTerms})\\b`, "i").test(clause));
    const withoutBackground = clauses.join(" ")
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/[;,\s]+$/g, "")
      .trim();
    const normalized = withoutBackground ? `${withoutBackground.replace(/[.]+$/g, "")}.` : "";
    return `${normalized}${normalized ? " " : ""}Background: ${replacement}.`.trim();
  }

  function persistPromptEdit() {
    if (!currentEntryId || !currentAnalysis || !currentPromptEdit) return;
    chrome.runtime.sendMessage({
      type: "PROMPIT_UPDATE_HISTORY_PROMPT",
      entryId: currentEntryId,
      analysis: currentAnalysis,
      promptEdit: currentPromptEdit
    }).then(() => loadHistory()).catch(() => {});
  }

  async function refineCurrentPrompt() {
    if (!currentEntryId || !currentAnalysis || refs.resultRefine.disabled || refs.resultRandomize.disabled || refs.resultDice.disabled) return;
    refs.resultRefine.disabled = true;
    refs.resultRandomize.disabled = true;
    refs.resultDice.disabled = true;
    refs.resultRefine.dataset.state = "loading";
    refs.resultRefineLabel.textContent = "Refining";
    try {
      const response = await chrome.runtime.sendMessage({
        type: "PROMPIT_REFINE_HISTORY_PROMPT",
        entryId: currentEntryId
      });
      if (!response?.ok || !response.analysis) throw new Error(response?.error || "Promp it could not refine this prompt.");
      showResult(response, { keepToolsOpen: true });
      refs.resultRefine.dataset.state = "success";
      refs.resultRefineLabel.textContent = "Refined";
      window.setTimeout(() => {
        refs.resultRefine.dataset.state = "default";
        refs.resultRefineLabel.textContent = "Refine prompt";
      }, 2200);
    } catch (error) {
      refs.resultRefine.dataset.state = "error";
      refs.resultRefineLabel.textContent = "Try again";
      window.setTimeout(() => {
        refs.resultRefine.dataset.state = "default";
        refs.resultRefineLabel.textContent = "Refine prompt";
      }, 2500);
    } finally {
      refs.resultRefine.disabled = false;
      refs.resultRandomize.disabled = false;
      refs.resultDice.disabled = false;
    }
  }

  function setRandomizeState(state, label = "Roll modern", title = "Roll tailored modern direction") {
    refs.resultRandomize.dataset.state = state;
    refs.resultRandomizeLabel.textContent = label;
    refs.resultDice.dataset.state = state;
    refs.resultDice.title = title;
    refs.resultDice.setAttribute("aria-label", title);
  }

  async function randomizeCurrentPrompt({ keepToolsOpen = false } = {}) {
    if (!currentEntryId || !currentAnalysis || refs.resultRandomize.disabled || refs.resultRefine.disabled || refs.resultDice.disabled) return;
    refs.resultRandomize.disabled = true;
    refs.resultRefine.disabled = true;
    refs.resultDice.disabled = true;
    setRandomizeState("loading", "Rolling", "Rolling tailored modern direction");
    try {
      const response = await chrome.runtime.sendMessage({
        type: "PROMPIT_RANDOMIZE_HISTORY_PROMPT",
        entryId: currentEntryId
      });
      if (!response?.ok || !response.analysis) throw new Error(response?.error || "Promp it could not roll a new visual direction.");
      showResult(response, { keepToolsOpen });
      const rolledLabel = response.randomStyle?.label || "Modern direction";
      setRandomizeState("success", rolledLabel, `${rolledLabel} applied`);
      window.setTimeout(() => {
        setRandomizeState("default");
      }, 2600);
    } catch (error) {
      setRandomizeState("error", "Try again", "Try rolling a tailored modern direction again");
      window.setTimeout(() => {
        setRandomizeState("default");
      }, 2500);
    } finally {
      refs.resultRandomize.disabled = false;
      refs.resultRefine.disabled = false;
      refs.resultDice.disabled = false;
    }
  }

  function renderTags(details = {}) {
    const candidates = [
      details.camera_angle || details.camera,
      details.key_light || details.lighting,
      details.perspective_geometry,
      details.depth_of_field || details.style
    ]
      .filter(Boolean)
      .map((value) => String(value).split(/[.;]/)[0].trim())
      .filter(Boolean)
      .slice(0, 4);
    refs.tags.replaceChildren(...candidates.map((label) => {
      const tag = document.createElement("span");
      tag.textContent = label;
      return tag;
    }));
  }

  async function copyCurrentPrompt() {
    const text = getCurrentText();
    if (!text) return;
    refs.copy.dataset.state = "loading";
    refs.copyLabel.textContent = "Copying";
    try {
      await navigator.clipboard.writeText(text);
      if (activeTab === "english" && currentEntryId && activePromptOptions.learningEnabled) {
        chrome.runtime.sendMessage({ type: "PROMPIT_RECORD_LEARNING", entryId: currentEntryId }).catch(() => {});
      }
      refs.copy.dataset.state = "success";
      refs.copyLabel.textContent = "Copied";
      clearTimeout(copyResetTimer);
      copyResetTimer = window.setTimeout(() => {
        refs.copy.dataset.state = "default";
        refs.copyLabel.textContent = "Copy prompt";
      }, 2500);
    } catch {
      refs.copy.dataset.state = "error";
      refs.copyLabel.textContent = "Copy failed";
    }
  }

  async function toggleHistory(force) {
    const open = typeof force === "boolean" ? force : refs.shell.dataset.history !== "true";
    refs.shell.dataset.history = String(open);
    refs.historyToggle.setAttribute("aria-pressed", String(open));
    refs.historyCard.setAttribute("aria-hidden", String(!open));
    if (open) await loadHistory();
  }

  async function loadHistory() {
    const stored = await chrome.storage.local.get("prompitHistory");
    const history = Array.isArray(stored.prompitHistory) ? stored.prompitHistory : [];
    refs.historyList.replaceChildren();
    refs.historyCount.textContent = `${history.length} / 20`;
    refs.historyEmpty.hidden = history.length !== 0;
    refs.historyClear.hidden = history.length === 0;
    refs.historyExport.hidden = history.length === 0;

    history.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "pi-history-item";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `Open prompt from ${formatDate(entry.createdAt)}`);

      const image = document.createElement("div");
      image.className = "pi-history-item__image";
      if (entry.imagePreview) {
        const thumb = document.createElement("img");
        thumb.src = entry.imagePreview;
        thumb.alt = "";
        image.append(thumb);
      } else {
        image.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path></svg>`;
      }

      const copy = document.createElement("div");
      copy.className = "pi-history-item__copy";
      const title = document.createElement("strong");
      title.textContent = compact(entry.analysis?.english || "Saved prompt", 72);
      const meta = document.createElement("span");
      const entryOptions = sanitizePromptOptions(entry.promptOptions || entry.analysis?.json?.prompt_options);
      const duration = Number(entry.durationMs) > 0 ? ` · ${(Number(entry.durationMs) / 1000).toFixed(1)} s` : "";
      meta.textContent = `${formatDate(entry.createdAt)} · ${platformLabels[entryOptions.platform]} · ${providerLabel(entry.provider)}${duration}`;
      copy.append(title, meta);

      const remove = document.createElement("button");
      remove.className = "pi-icon-button pi-history-item__delete";
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove this history item");
      remove.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
      remove.addEventListener("click", async (event) => {
        event.stopPropagation();
        item.dataset.state = "loading";
        await chrome.runtime.sendMessage({ type: "PROMPIT_DELETE_HISTORY", id: entry.id });
        await loadHistory();
      });

      const openEntry = () => {
        currentAnalysis = entry.analysis;
        activeFocus = sanitizeFocus(entry.focus || entry.analysis?.json?.analysis_focus);
        activePromptOptions = sanitizePromptOptions(entry.promptOptions || entry.analysis?.json?.prompt_options);
        currentImageUrl = entry.imagePreview || "";
        setPreview(currentImageUrl);
        showResult({
          analysis: entry.analysis,
          provider: providerLabel(entry.provider),
          focus: activeFocus,
          promptOptions: activePromptOptions,
          entry
        });
      };
      item.addEventListener("click", openEntry);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEntry();
        }
      });

      item.append(image, copy, remove);
      refs.historyList.append(item);
    });
  }

  async function clearHistory() {
    refs.historyClear.dataset.state = "loading";
    refs.historyClear.textContent = "Clearing";
    await chrome.runtime.sendMessage({ type: "PROMPIT_CLEAR_HISTORY" });
    refs.historyClear.dataset.state = "success";
    refs.historyClear.textContent = "History cleared";
    await loadHistory();
    window.setTimeout(() => {
      refs.historyClear.dataset.state = "default";
      refs.historyClear.textContent = "Clear all";
    }, 1800);
  }

  async function exportHistory() {
    const label = refs.historyExport.querySelector("span");
    refs.historyExport.dataset.state = "loading";
    refs.historyExport.disabled = true;
    label.textContent = "Exporting";
    const response = await chrome.runtime.sendMessage({ type: "PROMPIT_EXPORT_HISTORY" });
    refs.historyExport.disabled = false;
    if (response?.ok) {
      refs.historyExport.dataset.state = "success";
      label.textContent = "Exported";
      window.setTimeout(() => {
        refs.historyExport.dataset.state = "default";
        label.textContent = "Export ZIP";
      }, 2200);
      return;
    }
    refs.historyExport.dataset.state = "error";
    label.textContent = "Export failed";
    window.setTimeout(() => {
      refs.historyExport.dataset.state = "default";
      label.textContent = "Export ZIP";
    }, 2400);
  }

  function setPreview(url) {
    if (!url) {
      refs.preview.removeAttribute("src");
      refs.preview.dataset.loaded = "false";
      return;
    }
    refs.preview.onload = () => { refs.preview.dataset.loaded = "true"; };
    refs.preview.onerror = () => { refs.preview.dataset.loaded = "false"; };
    refs.preview.src = url;
  }

  function openSettings() {
    chrome.runtime.sendMessage({ type: "PROMPIT_OPEN_OPTIONS" });
  }

  function startImageAreaSelection(image, focus = ["all"], promptOptions = defaultPromptOptions) {
    if (!extensionEnabled) return;
    const bounds = getImageAreaBounds(image);
    if (!bounds || bounds.width < 24 || bounds.height < 24) {
      showError("Promp it cannot select inside this image while it is outside the visible page. Scroll it into view and try again.");
      return;
    }
    activeFocus = sanitizeFocus(focus);
    activePromptOptions = sanitizePromptOptions({ ...promptOptions, selectionMode: "selected_area" });
    imageAreaTarget = image;
    processingImage = image;
    imageAreaOrigin = null;
    imageAreaSelection = null;
    closeDock();
    refs.action.dataset.visible = "false";
    refs.imageArea.dataset.processing = "false";
    refs.imageArea.dataset.active = "true";
    refs.imageArea.setAttribute("aria-hidden", "false");
    refs.imageAreaInstruction.textContent = "Drag inside the image to select the section";
    refs.imageAreaBox.hidden = true;
    positionImageArea(bounds);
    requestAnimationFrame(() => refs.imageAreaSurface.focus({ preventScroll: true }));
  }

  function getImageAreaBounds(image = imageAreaTarget) {
    if (!image?.isConnected) return null;
    const rect = image.getBoundingClientRect();
    const x = Math.max(0, rect.left);
    const y = Math.max(0, rect.top);
    const right = Math.min(window.innerWidth, rect.right);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    return {
      x,
      y,
      width: Math.max(0, right - x),
      height: Math.max(0, bottom - y)
    };
  }

  function positionImageArea(bounds = getImageAreaBounds()) {
    if (!bounds) return;
    refs.imageAreaSurface.style.transform = `translate3d(${Math.round(bounds.x)}px, ${Math.round(bounds.y)}px, 0)`;
    refs.imageAreaSurface.style.width = `${Math.round(bounds.width)}px`;
    refs.imageAreaSurface.style.height = `${Math.round(bounds.height)}px`;
  }

  function scheduleImageAreaPosition() {
    if (refs.imageArea.dataset.active !== "true" || imageAreaOrigin) return;
    cancelAnimationFrame(imageAreaPositionFrame);
    imageAreaPositionFrame = requestAnimationFrame(() => {
      const bounds = getImageAreaBounds();
      if (bounds?.width >= 24 && bounds?.height >= 24) positionImageArea(bounds);
      else cancelImageAreaSelection();
    });
  }

  function startImageAreaDrag(event) {
    if (refs.imageArea.dataset.active !== "true" || event.button !== 0) return;
    const bounds = getImageAreaBounds();
    if (!bounds) return;
    refs.imageAreaSurface.setPointerCapture(event.pointerId);
    imageAreaOrigin = {
      x: clamp(event.clientX, bounds.x, bounds.x + bounds.width),
      y: clamp(event.clientY, bounds.y, bounds.y + bounds.height),
      pointerId: event.pointerId
    };
    refs.imageAreaBox.hidden = false;
    updateImageAreaBox(event.clientX, event.clientY);
  }

  function moveImageAreaDrag(event) {
    if (!imageAreaOrigin || event.pointerId !== imageAreaOrigin.pointerId) return;
    updateImageAreaBox(event.clientX, event.clientY);
  }

  async function finishImageAreaDrag(event) {
    if (!imageAreaOrigin || event.pointerId !== imageAreaOrigin.pointerId) return;
    const bounds = getImageAreaBounds();
    if (!bounds) return cancelImageAreaSelection();
    const selection = boundedCaptureRect(imageAreaOrigin.x, imageAreaOrigin.y, event.clientX, event.clientY, bounds);
    imageAreaOrigin = null;
    if (selection.width < 24 || selection.height < 24) {
      refs.imageAreaBox.hidden = true;
      return;
    }
    imageAreaSelection = selection;
    refs.imageArea.dataset.active = "false";
    refs.imageArea.setAttribute("aria-hidden", "true");
    await waitForPaint();
    try {
      const response = await chrome.runtime.sendMessage({
        type: "PROMPIT_CAPTURE_SELECTION",
        selection: {
          ...selection,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        },
        focus: activeFocus,
        promptOptions: activePromptOptions
      });
      if (response?.ok) showResult(response);
      else if (response?.error) showError(response.error, response.provider, response.durationMs);
    } catch {
      showError("The extension connection closed before the selected image area was analyzed. Reload this page and try again.");
    }
  }

  function updateImageAreaBox(x, y) {
    const bounds = getImageAreaBounds();
    if (!bounds || !imageAreaOrigin) return;
    const rect = boundedCaptureRect(imageAreaOrigin.x, imageAreaOrigin.y, x, y, bounds);
    refs.imageAreaBox.style.transform = `translate3d(${rect.x - bounds.x}px, ${rect.y - bounds.y}px, 0)`;
    refs.imageAreaBox.style.width = `${rect.width}px`;
    refs.imageAreaBox.style.height = `${rect.height}px`;
  }

  function boundedCaptureRect(x1, y1, x2, y2, bounds) {
    const boundedX2 = clamp(x2, bounds.x, bounds.x + bounds.width);
    const boundedY2 = clamp(y2, bounds.y, bounds.y + bounds.height);
    return {
      x: Math.max(bounds.x, Math.min(x1, boundedX2)),
      y: Math.max(bounds.y, Math.min(y1, boundedY2)),
      width: Math.abs(boundedX2 - x1),
      height: Math.abs(boundedY2 - y1)
    };
  }

  function showImageAreaProcessing(selection) {
    if (!selection || !imageAreaTarget) return;
    const bounds = getImageAreaBounds();
    if (!bounds) return;
    imageAreaSelection = selection;
    processingImage = imageAreaTarget;
    positionImageArea(bounds);
    refs.imageAreaBox.hidden = false;
    refs.imageAreaBox.style.transform = `translate3d(${selection.x - bounds.x}px, ${selection.y - bounds.y}px, 0)`;
    refs.imageAreaBox.style.width = `${selection.width}px`;
    refs.imageAreaBox.style.height = `${selection.height}px`;
    refs.imageAreaInstruction.textContent = "Analyzing the selected section";
    refs.imageArea.dataset.active = "false";
    refs.imageArea.dataset.processing = "true";
    refs.imageArea.setAttribute("aria-hidden", "false");
  }

  function cancelImageAreaSelection() {
    imageAreaOrigin = null;
    imageAreaSelection = null;
    imageAreaTarget = null;
    refs.imageArea.dataset.active = "false";
    refs.imageArea.dataset.processing = "false";
    refs.imageArea.setAttribute("aria-hidden", "true");
    refs.imageAreaBox.hidden = true;
  }

  function finishImageAreaProcessing() {
    if (refs.imageArea.dataset.processing !== "true") return;
    cancelImageAreaSelection();
  }

  function startCapture(focus = ["all"], promptOptions = defaultPromptOptions) {
    if (!extensionEnabled) return;
    activeFocus = sanitizeFocus(focus);
    activePromptOptions = sanitizePromptOptions(promptOptions);
    processingImage = null;
    closeDock();
    refs.action.dataset.visible = "false";
    refs.capture.dataset.active = "true";
    refs.capture.setAttribute("aria-hidden", "false");
    refs.captureBox.hidden = true;
    captureOrigin = null;
  }

  function startCaptureDrag(event) {
    if (refs.capture.dataset.active !== "true" || event.button !== 0) return;
    refs.capture.setPointerCapture(event.pointerId);
    captureOrigin = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    refs.captureBox.hidden = false;
    updateCaptureBox(event.clientX, event.clientY);
  }

  function moveCaptureDrag(event) {
    if (!captureOrigin || event.pointerId !== captureOrigin.pointerId) return;
    updateCaptureBox(event.clientX, event.clientY);
  }

  async function finishCaptureDrag(event) {
    if (!extensionEnabled) {
      cancelCapture();
      return;
    }
    if (!captureOrigin || event.pointerId !== captureOrigin.pointerId) return;
    const selection = captureRect(captureOrigin.x, captureOrigin.y, event.clientX, event.clientY);
    captureOrigin = null;
    if (selection.width < 24 || selection.height < 24) {
      refs.captureBox.hidden = true;
      return;
    }
    refs.capture.dataset.active = "false";
    refs.capture.setAttribute("aria-hidden", "true");
    refs.captureBox.hidden = true;
    await waitForPaint();
    const response = await chrome.runtime.sendMessage({
      type: "PROMPIT_CAPTURE_SELECTION",
      selection: {
        ...selection,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      },
      focus: activeFocus,
      promptOptions: activePromptOptions
    });
    if (response?.ok) showResult(response);
    else if (response?.error) showError(response.error, response.provider, response.durationMs);
  }

  function cancelCapture() {
    captureOrigin = null;
    refs.capture.dataset.active = "false";
    refs.capture.setAttribute("aria-hidden", "true");
    refs.captureBox.hidden = true;
  }

  async function loadExtensionState() {
    try {
      const config = await chrome.runtime.sendMessage({ type: "PROMPIT_GET_CONFIG" });
      setExtensionEnabled(config?.extensionEnabled !== false);
    } catch {
      // If the service worker is waking up, keep controls hidden rather than showing a broken action.
      setExtensionEnabled(false);
    }
  }

  function setExtensionEnabled(enabled) {
    extensionEnabled = Boolean(enabled);
    if (extensionEnabled) return;
    clearTimeout(hideActionTimer);
    activeImage = null;
    contextImage = null;
    processingImage = null;
    refs.action.dataset.visible = "false";
    refs.action.tabIndex = -1;
    cancelCapture();
    cancelImageAreaSelection();
    if (focusResolver) cancelFocusChoice();
    closeDock();
  }

  loadExtensionState();

  function updateCaptureBox(x, y) {
    const rect = captureRect(captureOrigin.x, captureOrigin.y, x, y);
    refs.captureBox.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
    refs.captureBox.style.width = `${rect.width}px`;
    refs.captureBox.style.height = `${rect.height}px`;
  }

  function captureRect(x1, y1, x2, y2) {
    return {
      x: Math.max(0, Math.min(x1, x2)),
      y: Math.max(0, Math.min(y1, y2)),
      width: Math.min(window.innerWidth, Math.abs(x2 - x1)),
      height: Math.min(window.innerHeight, Math.abs(y2 - y1))
    };
  }

  function waitForPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function resolveImageData(imageUrl, image = activeImage) {
    try {
      if (imageUrl.startsWith("data:")) return { ok: true, dataUrl: imageUrl };
      const response = await fetch(imageUrl, { credentials: "include" });
      if (response.ok) return { ok: true, dataUrl: await blobToDataUrl(await response.blob()) };
    } catch {
      // Fall through to canvas for same-origin image elements.
    }
    try {
      if (!image) throw new Error("Image element unavailable");
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      return { ok: true, dataUrl: canvas.toDataURL("image/jpeg", 0.92) };
    } catch {
      return { ok: false, error: "This image blocks direct access. Use Capture area from the toolbar instead." };
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Saved";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function providerLabel(provider) {
    if (provider === "ollama") return "Ollama";
    if (provider === "vision_api") return "Vision API";
    return "Legacy entry";
  }

  function compact(value, limit) {
    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length <= limit ? text : `${text.slice(0, limit - 1).trim()}…`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
