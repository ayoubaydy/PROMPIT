# Store Review Notes

## Single purpose

Promp it analyzes a user-selected image or selected page area and returns a detailed English image-generation prompt plus structured JSON.

## Permission justification

| Permission | Why it is needed |
| --- | --- |
| `activeTab` | Captures the currently active tab only after the user starts image or area analysis. |
| `clipboardWrite` | Copies a user-visible finished prompt. |
| `contextMenus` | Adds the user-requested image and page context-menu actions on browsers that support those menus. |
| `declarativeNetRequestWithHostAccess` | Removes the `Origin` header only from the configured loopback Ollama server’s `/api/chat` and `/api/tags` requests, which avoids local-server CORS rejection. |
| `downloads` | Exports the user’s local prompt history as a ZIP file. |
| `storage`, `unlimitedStorage` | Stores user settings, local prompt history, and optional retained source images inside the browser profile. |
| `<all_urls>` | Lets the image action work on ordinary websites instead of a fixed allowlist. |

## Reviewer test route

1. Install the extension package.
2. Open Settings and configure a reachable Ollama server with a vision-capable model, or provide a reviewer-only OpenAI-compatible vision endpoint in the settings form.
3. Visit a normal HTTPS webpage containing a visible image.
4. Hover the image and select **Prompt image**, or use the toolbar action to capture an area.
5. Keep the default **All details** focus and choose **Analyze**.
6. Confirm that the prompt and JSON result appear, then use **Copy prompt** or **Export ZIP** from History.

Before submission, replace this paragraph with a reviewer-accessible test configuration. Do not place any real API key, account password, or private Ollama address in this repository.

## Data disclosure

The extension sends selected website image content to the user-configured Ollama server for its core functionality. When a user explicitly enables the optional external vision provider or automatic fallback, it sends that same selected image content to the user-configured endpoint. It has no analytics, advertising, remote executable code, or developer-operated backend.
