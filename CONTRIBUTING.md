# Contributing to Promp it

Thank you for your interest in contributing to **Promp it**! Developed by [Baydy Art](https://baydy.art), Promp it is built to provide high-precision image-to-prompt reconstruction with strict local privacy standards.

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please keep all interactions respectful and collaborative.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to ensure it hasn't already been reported. When filing a bug report, use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

1. **Browser & Version** (e.g. Brave 1.68 / Chrome 127).
2. **Promp it Version** (found in Settings or footer, e.g. `v1.10.13`).
3. **Vision Provider** (Local Ollama model name, or Vision API).
4. **Steps to Reproduce**.
5. **Expected vs Actual Behavior**.

### Requesting Features

We welcome feature requests! Please use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) to describe the problem your proposed feature solves and why it would benefit the community.

### Pull Requests

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Create a Feature Branch**: `git checkout -b feature/my-amazing-feature`.
3. **Follow Architectural Standards**:
   - Maintain local-first default privacy (no remote tracking or analytics).
   - Use standard Vanilla CSS (CSS tokens in `tokens.css`, `content.css`, `options.css`).
   - Use standard Vanilla JavaScript (no external npm bundles or framework overhead).
4. **Verify Locally**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
5. **Submit Pull Request**: Open a PR targeting the `main` branch with a clear title and description.

## Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/baydy-art/Promp_it.git
   cd Promp_it
   ```

2. **Load Unpacked in Browser**:
   - Open `chrome://extensions` or `brave://extensions`.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select the repository root directory.

3. **Run Tests**:
   ```bash
   npm test
   ```

4. **Build Release Archives**:
   ```bash
   npm run build
   ```

## Author & Attribution

Developed with care by [Baydy Art](https://baydy.art).
