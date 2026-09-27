# Changelog

All notable changes to **Promp it** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.10.13] - 2026-09-27

### Changed
- Rewrote the extension and store descriptions around the one-click outcome: describe any image with a selected vision model and receive a complete, detailed AI image-generation prompt.

## [1.10.12] - 2026-09-27

### Added
- Toolbar-icon context menu: a persistent **Enable Promp it on websites** checkbox, a read-only selected vision runtime/model line, Settings shortcut, and About shortcut to Baydy Art. The menu remains available while website interactions are turned off.

## [1.10.11] - 2026-09-25

### Added
- A remembered **Promp it on websites** switch in Settings. Turning it off removes Promp it context-menu items, hides and disables the per-image action, stops captures and in-page panels, and prevents new local or API analysis requests while keeping settings and history intact.
- Browser action title feedback that identifies the extension as turned off until it is re-enabled.

## [1.10.10] - 2026-09-07

### Added
- Official developer attribution: Developed by [Baydy Art](https://baydy.art) across extension metadata (`manifest.json`), options page footer, Shadow DOM overlay footer (`content.js`), local preview harness (`preview.html`), and GitHub repository documentation.
- Production package configuration (`package.json`) with `test`, `build`, and `lint` npm scripts.
- Open source `LICENSE` (MIT © 2026 Baydy Art).
- Complete GitHub repository infrastructure: GitHub Actions CI workflow, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, bug report/feature request templates, and pull request template.
- Restrained glass edge for floating **Prompt image** control and halftone scan refinement over captured element bounds.

## [1.10.9] - 2026-09-07

### Added
- Standardized PNG icon set across browser toolbar, extension management, installation screens, and context menu.

## [1.10.8] - 2026-09-06

### Improved
- Placed scan-time halftone dot-wave over processed image area.
- Brand logo integration across panel headers and Settings.

## [1.10.7] - 2026-09-05

### Added
- Optional OpenAI-compatible Vision API runtime adapter with automatic Ollama fallback.
- Section selection tool for targeted image region analysis.

## [1.10.0] - 2026-08-30

### Added
- 0–100 prompt refinement strength slider.
- Opt-in local accepted-prompt learning memory.
- Multi-browser package exporter script (`scripts/build-store-packages.js`).
