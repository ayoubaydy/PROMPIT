# Promp it Privacy Policy

**Effective date:** Replace this line before publishing.  
**Contact:** Replace this line with a public support email or privacy contact.

## Summary

Promp it is a browser extension that analyzes an image a user selects and writes an image-generation prompt. Promp it has no account system, analytics, advertising, or developer-operated cloud service.

## Information stored locally

Promp it stores the following in the browser’s extension storage:

- vision-provider settings, including the selected Ollama URL and model;
- an optional OpenAI-compatible endpoint, model name, and API key when the user enters them;
- prompt preferences, local learning preferences, prompt history, and any history image that the user chooses to retain.

Users can clear history and reset local learning preferences in Settings. Removing the extension removes its browser-managed storage, subject to the browser’s own retention behavior.

## Image analysis and transmission

When a user starts an analysis, Promp it captures only the selected full image, selected image section, or user-drawn page area.

- With the default local Ollama configuration, those pixels are sent to the Ollama server configured by the user, normally `http://127.0.0.1:11434` on the same device.
- If the user explicitly selects an external OpenAI-compatible vision endpoint or enables automatic fallback, those pixels and the request text are sent to that endpoint. That provider’s privacy policy then applies to its handling of the request.

Promp it does not send pixels to any developer-operated server. It does not sell, share for advertising, or use selected images to train a developer-operated model.

## Website access

Promp it requests access to ordinary webpages so it can place a temporary action above an image, capture the exact user-selected pixels, and open its own interface. It does not change website content, redirect browsing, or read webpage data for unrelated purposes.

## Security

The extension does not load executable remote code. Optional endpoint credentials are stored in the browser’s extension storage and are sent only to the endpoint the user configures for that purpose.

## Changes and contact

Update this policy when Promp it’s data practices change. For privacy questions or requests, contact the address at the top of this policy.
