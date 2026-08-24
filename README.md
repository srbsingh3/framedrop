# Bolt FrameDrop

A small, local-only Chrome extension that copies the current web page as editable Figma layers.

Built by Saurabh Singh.

It is app-agnostic: it works against the rendered DOM of normal `http://`, `https://`, and (when enabled) `file://` pages. It does not need repository access or a localhost helper.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this Bolt FrameDrop folder.
5. Pin **Bolt FrameDrop** from Chrome's Extensions menu if you want the toolbar button visible.

## Use

1. Open the page and reach the exact UI state you want.
2. Click the extension icon, or press **Option+Shift+F**. The shortcut is best for open menus and popovers.
3. Wait for the green check and confirmation message.
4. Paste into Figma with **Cmd+V**.

If the shortcut is already assigned, open `chrome://extensions/shortcuts` and assign **Option+Shift+F** (or another shortcut) to **Bolt FrameDrop**.

For local HTML files, enable **Allow access to file URLs** in the extension's Details screen.

## Privacy and security

- The extension requests `activeTab`, not permanent access to every website.
- It runs only after you click its icon or use its configured shortcut.
- Capture the page only when you are allowed to copy its content into Figma.
- Check for customer data, credentials, tokens, private messages, or other sensitive content before capturing.
- The bundled Figma capture runtime may read linked page assets in order to reconstruct the design.

## Expected limitations

Chrome blocks extensions on browser-owned pages such as `chrome://` and the Chrome Web Store. Cross-origin iframes, canvas/WebGL, video, browser PDF viewers, closed shadow roots, and some protected assets may not convert faithfully. The result is a design reconstruction, not a pixel-perfect screenshot.

## Updating the Figma runtime

First download and validate the current runtime without changing any files:

```sh
./scripts/update-capture-runtime.sh
```

Review the reported checksum and then apply that exact version:

```sh
./scripts/update-capture-runtime.sh --apply <sha256>
```

The script fetches from Figma's official MCP endpoint over HTTPS, checks that the result is valid JavaScript with the required capture API, and only replaces the bundled runtime when its checksum matches the value you approved. Review the resulting Git diff before committing, then reload the extension from `chrome://extensions`.

## Uninstall

Remove **Bolt FrameDrop** from `chrome://extensions`, then delete this folder.
