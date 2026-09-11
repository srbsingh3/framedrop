# FrameDrop Store Listing

The complete privacy and security statement is [PRIVACY.md](PRIVACY.md). Before Chrome Web Store publication, publish that same text at a publicly accessible URL you control and use it for the Store privacy-policy field.

Short description:

Copy the current web page body into Figma as editable layers.

Long description:

FrameDrop is a one-click capture tool for the active `http://` or `https://` page.

Use the extension icon or `Alt+Shift+F` to copy the current page body to the local clipboard, then paste it into Figma.

The extension uses only `activeTab` and `scripting`.

It does not transmit analytics, use storage, create user accounts, download remote code, call a Figma upload endpoint, or use a Figma proxy.

It may fetch page-referenced assets directly from the page only to reconstruct the capture.

It preserves visible form values and control state for design fidelity, while excluding password-field values.

Current DOM text and contenteditable content can still be included.

Chrome Web Store privacy disclosures must identify that the extension handles website content and page-referenced resources, and that processing happens locally on the device.

Recommended listing notes:

- No automatic capture
- No background monitoring
- No cloud sync
- No account sign-in

Public distribution steps:

1. Publish the complete text in `PRIVACY.md` at a public URL before release.
2. Verify the Store privacy disclosures match the actual local clipboard-only behavior.
