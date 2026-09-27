# Security & Privacy Policy

## Local-First Privacy Guarantee

**Promp it** is designed with a privacy-first architecture:

1. **Zero Tracking & Analytics**: Promp it contains no telemetry, tracking scripts, or analytics endpoints.
2. **Local Processing Default**: By default, image analysis is performed 100% locally via your Ollama server (`http://127.0.0.1:11434`). No image data leaves your machine.
3. **Optional External Vision API**: If you explicitly configure an OpenAI-compatible Vision API, image pixels are transmitted *only* to the custom endpoint you specified. Your API key is stored securely in `chrome.storage.local`.
4. **Local Storage**: Promp it history, options, and preferences remain strictly inside your browser's local profile (`chrome.storage.local`).

## Reporting a Vulnerability

We take the security and privacy of Promp it very seriously. If you discover a security vulnerability, please report it directly to us rather than opening a public issue.

### How to Report

Please submit vulnerability reports via [https://baydy.art](https://baydy.art) or contact the developer directly.

Please include:
- A detailed description of the vulnerability.
- Steps to reproduce or proof-of-concept code.
- Potential impact of the issue.

### Our Commitment

- We will acknowledge receipt of your report within 48 hours.
- We will investigate and provide regular updates on our progress.
- Once fixed, we will publish an update and credit your contribution (if desired).

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.10.x  | :white_check_mark: Yes |
| < 1.10  | :x: Upgrade Recommended |

---

*Developed by [Baydy Art](https://baydy.art)*
