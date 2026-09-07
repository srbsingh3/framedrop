# Bolt FrameDrop Privacy

Support URL: `BOLT_SUPPORT_URL`

Privacy URL: `BOLT_PRIVACY_URL`

Security URL: `BOLT_SECURITY_URL`

Bolt FrameDrop runs only when the user clicks the extension icon or presses its shortcut.

It uses only `activeTab` and `scripting`.

It does not use:

- analytics or telemetry transmission
- storage
- user accounts
- remote code
- a Figma upload endpoint
- a Figma proxy

The extension captures the current `http://` or `https://` page body to the local clipboard so the user can paste it into Figma.

It may fetch page-referenced assets directly from those pages only to reconstruct the capture.

It strips typed form values, checked state, selected state, and passwords.

Current DOM text and contenteditable content can still be included.

The capture stays local on the device until the user pastes it into Figma.
