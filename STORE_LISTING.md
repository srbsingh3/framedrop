# Bolt FrameDrop Store Listing

Internal owner and maintainer: Saurabh Singh.

For this internal release, the complete privacy and security statement is [PRIVACY.md](PRIVACY.md). Before Chrome Web Store publication, publish that same text at a Bolt-controlled URL and use it for the Store privacy-policy field.

Short description:

Copy the current web page body into Figma as editable layers.

Long description:

Bolt FrameDrop is a one-click capture tool for the active `http://` or `https://` page.

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

Domain-private distribution steps:

1. Publish only to the approved internal domain or managed Chrome environment.
2. Restrict installation to the intended organization or domain group.
3. Publish the complete text in `PRIVACY.md` on a Bolt-controlled URL before release.
4. Verify the store disclosure text matches the actual local clipboard-only behavior.
