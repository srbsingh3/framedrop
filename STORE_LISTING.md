# Bolt FrameDrop Store Listing

Support URL: `BOLT_SUPPORT_URL`

Privacy policy URL: `BOLT_PRIVACY_URL`

Security URL: `BOLT_SECURITY_URL`

Short description:

Copy the current web page body into Figma as editable layers.

Long description:

Bolt FrameDrop is a one-click capture tool for the active `http://` or `https://` page.

Use the extension icon or `Alt+Shift+F` to copy the current page body to the local clipboard, then paste it into Figma.

The extension uses only `activeTab` and `scripting`.

It does not transmit analytics, use storage, create user accounts, download remote code, call a Figma upload endpoint, or use a Figma proxy.

It may fetch page-referenced assets directly from the page only to reconstruct the capture.

It strips typed form values, checked state, selected state, and passwords.

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
3. Keep the privacy policy and support URLs on owned domains before release.
4. Verify the store disclosure text matches the actual local clipboard-only behavior.
