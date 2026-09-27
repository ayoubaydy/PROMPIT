# Cross-Store Submission Guide

## Build the four upload packages

Run this from the project root:

```powershell
node scripts/build-store-packages.js
```

It writes these files to `release/stores/` with `manifest.json` at the archive root:

- `Promp-it-v1.10.13-chrome.zip`
- `Promp-it-v1.10.13-edge.zip`
- `Promp-it-v1.10.13-firefox.xpi`
- `Promp-it-v1.10.13-safari-web-extension-input.zip`

The Firefox package has the permanent add-on ID `{d3b6a055-60c5-4c77-873e-441d73b6d27e}` and declares `websiteContent` as required because the extension sends the image the user selects to their configured inference server. The Safari input package requires Safari 16.4 or later because the extension’s narrowly scoped local-Ollama header rule uses Declarative Net Request header modification.

## Before every submission

1. Run `node tests/smoke.test.js`.
2. Test the exact ZIP locally in the target browser where the browser permits it.
3. Host the finished `store/PRIVACY_POLICY.md` at a public HTTPS URL after replacing its effective date and contact details.
4. Capture real screenshots from the current version and create the 440 × 280 Chrome/Edge promo tile.
5. Read `store/STORE_LISTING.md` and `store/REVIEW_NOTES.md`; replace the reviewer test placeholder with a safe, working test route.
6. Increment `manifest.json` before every later store upload.

## Chrome Web Store

Upload `Promp-it-v1.10.13-chrome.zip` in the Chrome Web Store Developer Dashboard. Add the short and full description, privacy URL, the 128px icon, a 440 × 280 promo tile, and at least one real 1280 × 800 screenshot.

## Microsoft Edge Add-ons

Upload `Promp-it-v1.10.13-edge.zip` in Microsoft Partner Center. Use the same listing copy, screenshots, privacy URL, and permission justification. Edge asks for an explicit single-purpose statement, data practices, remote-code declaration, and permission explanations.

## Firefox Add-ons (AMO)

Upload `Promp-it-v1.10.13-firefox.xpi` to AMO. The source code is plain, unminified JavaScript and CSS; include the GitHub source ZIP if AMO asks for a source submission. Do not remove or change the Firefox add-on ID after the first public release, or users will not receive updates.

## Safari App Store

The Safari ZIP is an input, not the final App Store app. Upload it to App Store Connect’s Safari Web Extension Packager, or use the macOS command-line tool:

```text
xcrun safari-web-extension-packager /path/to/Promp-it-v1.10.13-safari-web-extension-input.zip
```

Use the generated macOS and/or iOS app project to test in Safari, then submit the signed containing app through App Store Connect. Safari on iPhone and iPad does not support extension context menus, so users should use the toolbar capture action there. A public privacy-policy URL and App Privacy answers are required before App Store submission.
