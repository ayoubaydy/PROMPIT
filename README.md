# Promp it

[![Version](https://img.shields.io/badge/version-1.10.13-blue.svg)](https://github.com/baydy-art/Promp_it)
[![Manifest V3](https://img.shields.io/badge/manifest-V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Developed by Baydy Art](https://img.shields.io/badge/developed%20by-baydy.art-cyan.svg)](https://baydy.art)

Promp it is a Manifest V3 extension for Brave, Chrome, Edge, Firefox, and Safari. **Describe any image in one click** with your chosen vision model, then receive a complete AI image-generation prompt. **Developed by [https://baydy.art](https://baydy.art)**. By default it uses local Ollama; it can also use a user-configured OpenAI-compatible vision API. It turns a web image or captured page area into:

- a detailed English image-generation prompt;
- structured JSON covering subject, composition, style, lighting, palette, materials, camera language, mood, environment, typography, negative details, and confidence notes.

Ollama remains the private default. External pixels are sent only when the user explicitly selects the Vision API runtime or enables its automatic fallback.

## Local setup

Promp it uses `http://127.0.0.1:11434` as the default local Ollama URL. Model availability is deliberately detected from your own Ollama installation; no account, API key, or hosted model is required for the local-only path.

## Load it in Brave or Chrome

1. Open `brave://extensions` or `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `Promp_it` folder.
4. If Promp it is already loaded, press **Reload** on its extension card.
5. Reload website tabs that were already open.
6. Confirm that `v1.10.13` appears beside **Promp it** in the analysis panel.

Browser-internal pages, extension stores, and some protected viewers do not allow content scripts. Test on a normal `http://` or `https://` page.

## Vision settings

Open Promp it settings and detect the models already installed in Ollama:

```text
Local server URL: http://127.0.0.1:11434
Model selection:  Automatic — strongest installed vision model
```

The **Installed Ollama model** dropdown is populated from the local `/api/tags` response. Promp it labels models that are likely to support vision based on their names, but the label is not a capability guarantee; press **Test vision runtime** before the first analysis. Automatic mode ranks known local vision models, while manual mode uses exactly the selected model.

The **Vision provider** dropdown has three modes: **Ollama — local only** (default), **Vision API — external**, and **Automatic — Ollama, then API fallback**. The external adapter accepts an OpenAI-compatible base URL, model name, and API key. Its key is kept in `chrome.storage.local`; when that provider is used, the selected image pixels are sent to the configured endpoint. Automatic mode keeps local Ollama first and moves to the external provider only when Ollama is unavailable.

The analysis runtime scales image and context budgets to practical memory classes:

| Approximate available memory | Model | Use case |
| --- | --- | --- |
| 6 GB | `qwen3.5:4b` | Compact local analysis with reduced image and context budgets |
| 12 GB | `qwen3.5:9b` | Balanced accuracy and speed |
| 24 GB | `qwen3.6:27b` | Maximum prompt fidelity, camera geometry, and lighting analysis |

Memory figures are practical targets, not hard guarantees. GPU architecture, other running applications, context size, quantization, and Ollama CPU offload affect actual usage.

Use **Professional prompt refinement** to enable a separate text-only Ollama pass after image analysis. **Art-directed reconstruction** converts the factual draft into cohesive production language for angle, lens behavior, perspective, depth, lighting, shadows, composition, materials, and finish. **Premium campaign reconstruction** emphasizes campaign hierarchy and material polish.

Version 1.9 adds two controls that compensate for a local model's limited awareness of current visual culture:

- **Creative direction** chooses Contemporary auto, source matching, cinematic naturalism, contemporary editorial tension, luxury campaign, direct-flash culture, analog tactile, sculptural product, surreal perspective, or documentary realism. Auto selects one coherent system from the verified image instead of stacking unrelated trend terms.
- **Creative latitude** chooses Strict, Directed, or Exploratory. Directed is the default: it preserves subject, pose, wardrobe, crop, camera view, scene layout, and visible light logic while modernizing color science, texture, spatial energy, and art-direction language.

The refinement stage rejects empty prestige tags such as “8K,” “masterpiece,” “ultra-detailed,” or unexplained “cinematic.” It instead writes causal production decisions: viewpoint → perspective effect, source → light behavior, and palette/material → finish. Custom refinement direction is stored locally and cannot override verified visual evidence.

Version 1.10 adds per-image control over that stage:

- **Prompt refinement** is a 0–100 slider. Low values stay source-locked, middle values apply restrained current art direction, and high values make one stronger coherent interpretation without changing verified subject, pose, camera, lighting direction, or composition facts.
- **Refine prompt** and **Local learning memory** are independent switches. Learning is an honest local preference memory—not model-weight training. A prompt is learned only after you copy it, and only generalized direction/craft signals are retained.
- **Select section** lets the image-level action analyze a specific part of the image. A moving dot-grid marks targeting and processing, is disabled for reduced-motion users, and appears only after the browser screenshot has been taken so it never becomes part of the model input.

Use **Analysis instructions** for constraints that should affect the original vision inspection itself. Keep analysis instructions factual; use the refinement direction for creative prompt treatment.

Install the model for the system you intend to use:

```powershell
ollama pull qwen3.5:4b
ollama pull qwen3.5:9b
ollama pull qwen3.6:27b
```

You only need one compatible vision model. Use **Detect installed models** in Settings after pulling it, then run **Test vision runtime** before your first analysis.

## Use it

- Hover or keyboard-focus an image at least 140 × 90 px, then select **Prompt image** above it. The compact chooser opens on **Focus**; choose **All details** or one or more focused domains: Subject, Pose, Camera, Angle, Composition, Lighting, Style & color, or Background.
- Open **Output** to select Generic, Flux, Qwen Image, ChatGPT Images, or Nano Banana. Promp it formats the same grounded visual analysis for the selected generator.
- Open **Refine** to set the 0–100 strength, professional pass, and local-learning preference. The tab summaries and pinned action footer keep the current configuration visible without a long scrolling sheet.
- Keep **Visuals only** enabled to ignore wording in the source and request no text, captions, logos, signatures, or watermarks in the generated image. Disable it when exact visible text is part of the design you want to recreate.
- Toggle **Negative prompt** to include or omit image-specific exclusions. For Flux, Promp it converts essential exclusions into affirmative safeguards because FLUX.2 does not use a negative-prompt channel.
- Set **Prompt refinement** from 0 to 100 for each image, or turn **Refine prompt** off for the shortest faithful reconstruction. Settings still provides the default treatment and creative direction.
- Keep **Local learning memory** enabled if copied prompts should softly influence future art-direction phrasing. Reset the memory at any time in Settings.
- Enable **Select section** directly beneath the Focus choices, confirm, then draw a box inside that image. Only the pixels within that box are sent to the selected vision runtime.
- Promp it remembers your last Focus, target platform, text/negative-prompt rules, refinement strength, and section choice locally, so the compact chooser reopens in your preferred state.
- Focused analyses produce a tailored English prompt fragment and a reduced JSON object containing only the selected domains plus a minimal subject anchor. For example, **Angle** returns angle and perspective guidance without unrelated lighting or style prose.
- Promp it captures the exact visible image pixels instead of trusting a potentially stale CDN or lazy-loading URL.
- Right-click an image and choose **Generate prompt with Promp it**. The same exact-pixel capture is used when the image element is visible.
- Select the toolbar button, right-click the page and choose **Capture area**, or press `Ctrl+Shift+P`, then drag around the area.
- Use the minimize icon to collapse an active analysis into a corner pill without stopping Ollama. The panel shows live elapsed time and records the final generation time in seconds.
- Switch between **EN** and **{ }**, copy the active result, or reopen a saved analysis from **History**.
- In the English result, use **Refine prompt** for one more local, text-only professional pass. It preserves the saved focus and platform rules, reuses the current background finish when one is active, shows its own duration, and updates that history item without resending image pixels.
- Use **Keep scene** to restore the detected environment or **Replace background** to remove scene/backdrop clauses and insert a black, white, green, gray studio, cream studio, or editorial-studio background. The selected finish is saved with that local history entry.
- Select **Export ZIP** in History or **Export history ZIP** in Settings. Promp it creates one ZIP containing a prompt-kind-named folder for every saved entry, with `image`, `prompt.txt`, and `analysis.json` when the local image is available.

## Troubleshooting

### The panel shows an older version

On `brave://extensions`, press **Reload** on Promp it and then hard-refresh the website with `Ctrl+Shift+R`. Content scripts already running in an open tab are not replaced until the page reloads.

### Ollama cannot be reached

Confirm Ollama is running:

```powershell
ollama list
```

Then open `http://127.0.0.1:11434/api/tags` in a browser. It should return JSON containing the configured vision model.

### Ollama returns 403 Forbidden

Ollama does not require an API key locally, but it normally rejects browser-extension origins unless they are explicitly allowed. Version 1.1.1 installs a narrowly scoped browser rule that removes the `Origin` header only from `/api/chat` and `/api/tags` requests sent to a configured loopback address (`127.0.0.1`, `localhost`, or `::1`). Reload the extension after updating so Brave activates the new permission.

If a proxy or non-loopback Ollama URL still returns 403, explicitly allow the extension origin with `OLLAMA_ORIGINS` and restart Ollama. The official Ollama FAQ documents `chrome-extension://*` for allowing Chrome/Brave extensions.

### The generated image is still not identical

A text prompt can preserve subject traits, composition, palette, lighting, and style, but it cannot encode every pixel or a person's exact identity. For near-identical reconstruction, use the original image as an image reference or image-to-image input in the generator and pair it with Promp it's English prompt. Version 1.3.0 adds camera-geometry, perspective, depth-plane, multi-light, shadow, exposure, and color-temperature audits to make prompt-only results substantially closer.

## Privacy and migration

- Version 1.10.13 updates the extension and marketplace descriptions to lead with the actual result: one-click visual understanding that produces a complete generation prompt, with detailed camera, lighting, composition, material, and style language.
- Version 1.10.12 adds a toolbar right-click menu with a direct enable/disable checkbox, the active vision model label, Settings, and About. The menu stays reachable while website interactions are off, so Promp it can always be re-enabled without opening a webpage.
- Version 1.10.11 adds the remembered **Promp it on websites** switch in Settings. Off removes right-click actions, hides the image button, stops capture/UI flows, and prevents new vision requests; it preserves all provider settings and local history so turning it back on restores your workflow.
- Version 1.10.10 gives the floating **Prompt image** control a restrained rotating glass edge, removes the artificial empty height from the loading card, and moves the animated halftone scan to the original selected browser image. It begins only after Chromium captures the pixels, so the visual indicator is never part of the image sent to Ollama.
- Version 1.10.9 registers PNG versions of the supplied Promp it app logo as the browser toolbar, extension management, installation, and context-menu icon, so the same mark appears throughout Brave and Chrome.
- Version 1.10.8 places the scan-time halftone dot-wave directly over the image being processed, uses the supplied Promp it logo in the panel and Settings, and allows the result prompt to use all available height while desktop History is open.
- Version 1.10.7 remembers pre-analysis choices, renames crop analysis to **Select section**, adds the scan-time halftone dot-wave, and introduces the optional OpenAI-compatible Vision API runtime. The API key and provider settings stay in this browser profile. Ollama remains the default; automatic fallback uses the API only after a local-runtime failure.

- Version 1.10.6 adds a dedicated **dice icon** beside the compact Finish icon. It rolls an image-compatible modern visual direction directly from the result, with the resolved direction saved to local history. The minimized dock now uses a clear maximize icon to restore the panel.

- Version 1.10.5 folds post-generation controls into one bounded **Finish** icon popover, revealing the background picker only after **Replace background** is selected. **Roll modern** now selects a direction and a small finishing touch from image-compatible profiles (portrait, product, documentary, architecture, or graphic), so it keeps verified subjects, geometry, and light logic intact instead of applying a generic trend phrase.

- Version 1.10.4 restores the cool graphite/cyan control accent but keeps headings, prompts, labels, and secondary copy on a neutral white-to-black scale. Cyan is reserved for icons, focus rings, and selected control surfaces.

- Version 1.10.3 replaces the cool-blue identity with a warm spark-amber accent and spark mark, removes the Settings marketing introduction, moves image crop analysis into the default Focus pane, and adds **Refine prompt** after generation. The local text-only pass preserves any active background replacement and persists the refined version with its timing.

- Version 1.10.2 adds compact post-generation finishing capsules: restore the source scene or deterministically replace background wording. The finished result persists with history, which now exports as one ZIP with folders named by prompt kind instead of loose downloads.

- Version 1.10.1 replaces the long pre-analysis sheet with compact Focus, Output, and Refine tabs, a 3 × 3 Lucide focus matrix, live tab summaries, keyboard arrow navigation, and a pinned summary/action footer.
- Version 1.10.0 adds per-image refinement strength, slide switches, image-contained drag selection, a capture-safe animated dot-grid state, and opt-in local accepted-prompt preference memory with a Settings reset. The memory never retrains Ollama and never overrides image evidence.
- Version 1.9.0 adds a curated current visual-language library, ten coherent creative directions, strict/directed/exploratory latitude, causal camera-light-perspective writing, anti-trend-soup rules, target-specific prompt strategy, style-decision metadata, and correct affirmative Flux safeguards instead of a negative-prompt section.
- Version 1.8.0 adds minimization with restore, live and saved generation time, the redesigned Promp it capture-command logo, automatic installed-model discovery, a settings-controlled text-only professional refinement pass, and paired image/prompt/JSON history export. New history entries retain the normalized analyzed image locally for export; `unlimitedStorage` prevents the 20-entry image archive from hitting Chrome's small default local-storage quota.
- Version 1.7.0 adds per-analysis text handling, optional negative prompts, platform-specific formatting for Generic, Flux, Qwen Image, ChatGPT Images, and Nano Banana, plus faithful, automatic, and premium-advertisement enhancement modes. These choices are stored with each local history entry.
- Version 1.6.0 adds a pre-analysis focus chooser to image, context-menu, and area-capture flows. Users can select one domain or combine several, and both Ollama's schema and the final prompt are narrowed to that selection.
- Version 1.5.0 adds automatic installed-model selection, 6/12/24 GB memory profiles, Qwen3.5/Qwen3.6-native Ollama requests, and model-specific image, context, and output budgets. The current workstation uses the installed `qwen3.6:27b`; smaller systems can use `qwen3.5:4b` or `qwen3.5:9b` without changing the analysis pipeline.
- Version 1.4.0 removes Arabic processing and its settings/history payload, then uses the freed local-model pass for an image-aware verification of subject, crop, camera geometry, perspective, focus, lighting, and shadows.
- Version 1.3.2 reduces the vision response schema, increases context headroom, retries malformed output against the original image with a compact schema, and reserves text-only repair as the final fallback.
- Version 1.3.1 constrains Qwen with Ollama's vision-compatible JSON schema, tolerates fenced/trailing-comma output, and automatically performs one local structured-output repair before reporting an error.
- Version 1.3.0 adds a geometry-first reconstruction brief, editable local analysis instructions, and a compact Lucide-based liquid-glass interface refinement.
- Version 1.2.0 replaces the generic Gemma prompt pass with the stronger installed Qwen vision model, preserves the selected crop dimensions and aspect ratio, and adds reconstruction-specific spatial and negative constraints.
- Version 1.1.2 captures the selected image element's visible pixels so Ollama cannot receive an unrelated lazy-loaded, placeholder, or recycled image URL.
- Version 1.1.1 fixes Ollama's browser-extension origin rejection for loopback requests without adding an API key or cloud provider.
- Version 1.1.0 migrates `prompitConfig` to only `ollamaBaseUrl` and `ollamaModel`, removing old cloud-provider and API-key fields from `chrome.storage.local`.
- Image pixels are sent only to the configured Ollama server unless the user selects the external Vision API or enables its automatic fallback.
- Prompt history, thumbnails, normalized export images, refinement settings, accepted-prompt preference memory, and timing metadata remain in `chrome.storage.local` and are never synced by Promp it.
- `<all_urls>` lets the extension add its image action and read a selected image on normal websites.
- `activeTab` enables user-triggered area capture without requesting browsing-history permission.
- `contextMenus` provides image and area actions; `clipboardWrite` supports prompt copying.
- `declarativeNetRequestWithHostAccess` removes the browser-extension `Origin` header only for configured loopback Ollama chat and model-list requests.
- `downloads` writes user-requested history exports; `unlimitedStorage` keeps the local 20-image export archive from silently dropping images.

## Project map

- `PROMP_IT_SYSTEM_CONVERSATION_AND_ENHANCEMENT.md` — complete conversation-derived decision record, system architecture, analysis pipeline, and in-depth enhancement specification.
- `manifest.json` — extension permissions, content script, command, and Ollama settings entry.
- `background.js` — local Ollama and optional OpenAI-compatible vision adapters, capture and image preparation, history, and context menus.
- `content.js` / `content.css` — hover action, liquid-glass analysis dock, tabs, history, and area selector.
- `options.html` / `options.js` / `options.css` — local Ollama and optional external vision settings with connection tests.
- `tokens.css` — shared visual tokens.
- `preview.html` — mocked interaction harness for visual QA.
- `bare-preview.html` — Shadow DOM styling regression harness.

## Development & Verification

Execute the standard npm workflow:

```bash
# Run syntax checks across JS files
npm run lint

# Run unit & payload smoke tests
npm test

# Build store release archives (Chrome, Edge, Firefox, Safari)
npm run build
```

Optional live-model check against a local image:

```powershell
node tests/live-ollama.test.js C:\path\to\image.png --refine --model=qwen3.6:27b --platform=nanobanana --direction=contemporary_auto --strength=75
```

## Credits & License

- **Developer**: Developed by **[Baydy Art](https://baydy.art)** (`https://baydy.art`)
- **License**: Open source under the [MIT License](LICENSE).
