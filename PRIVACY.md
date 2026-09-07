# Bolt FrameDrop privacy

Bolt FrameDrop copies the current web page into your clipboard so you can paste it into Figma as editable layers.

## What it accesses

When you click FrameDrop, it reads the rendered content of that page: its text, layout, styles, and the assets needed to recreate it. This can include content further down a long page, not only what is visible on screen.

It copies the current values and states of ordinary form controls so a design can reflect the state you see, including text fields, checkboxes, radio buttons, and selected options. Password-field values are excluded. Sensitive information can also appear as ordinary text or imagery, so use FrameDrop only on pages you are allowed to put into a design file.

## Where it goes

The capture is created on your device and copied to your local clipboard. FrameDrop does not upload it to a Bolt service, a FrameDrop service, or a Figma upload endpoint.

The capture may request page-referenced assets directly from their original locations so the design can be reconstructed. It does not use a proxy for those requests.

Nothing is sent to Figma until you choose to paste the result there. At that point, the content is handled by your Figma account and its applicable policies.

## What it does not do

- No account or sign-in
- No analytics or cloud sync
- No background monitoring or automatic capture
- No stored capture history
- No permanent access to every website

## Permissions

FrameDrop uses `activeTab` to access only the page you choose, when you click the extension or use its shortcut. It uses `scripting` to run the bundled capture tool on that page.

You can close the in-page capture bar at any time, remove the extension in `chrome://extensions`, or replace the clipboard contents to discard a capture.
