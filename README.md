# FrameDrop

A small Chrome extension that copies the current page into Figma as editable layers.

Owner and maintainer: Saurabh Singh.

It works on normal `http://` and `https://` pages. There is no settings UI or account flow.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this FrameDrop folder.
5. Pin **FrameDrop** from Chrome's Extensions menu if you want the toolbar button visible.

## Use

1. Open the page and reach the exact UI state you want.
2. Click the extension icon and choose a capture mode:
   - **Current layout** preserves the page as it is arranged now.
   - **Expanded layout** temporarily opens clipped or scrollable sections, captures them, then restores the page.
   You can also press **Option+Shift+F** for Current layout or **Option+Shift+G** for Expanded layout. Shortcuts are best for open menus and popovers.
3. Wait for the green check and confirmation message.
4. Paste into Figma with **Cmd+V**.

If the shortcut is already assigned, open `chrome://extensions/shortcuts` and assign **Option+Shift+F** (or another shortcut) to **FrameDrop**.

## Privacy and security

- The extension requests `activeTab`, not permanent access to every website.
- It runs only after you click its icon or use its configured shortcut.
- FrameDrop uses only Figma's clipboard capture path.
- The capture runtime runs in Chrome's isolated extension world, so the page cannot invoke or replace it.
- Capture the page only when you are allowed to copy its content into Figma.
- Check for customer data, credentials, tokens, private messages, or other sensitive content before capturing.
- The bundled Figma capture runtime may read linked page assets in order to reconstruct the design.

## Expected limitations

Chrome blocks extensions on browser-owned pages such as `chrome://` and the Chrome Web Store. Cross-origin iframes, canvas/WebGL, video, browser PDF viewers, closed shadow roots, and some protected assets may not convert faithfully. The result is a design reconstruction, not a pixel-perfect screenshot.

## Pinned runtime

FrameDrop ships one reviewed copy of Figma's capture runtime. It does not check for, download, or execute newer runtime code while someone captures a page.

If Figma makes a breaking change, updating this copy is a deliberate new extension release: review the code, rebuild the package, and publish a new version through the Chrome Web Store.

## Package

Build the store zip with:

```sh
bash scripts/package-extension.sh
```

The package contains only the manifest, background script, capture entry point, vendored runtime, and icons.

## Manual test

1. Load the unpacked folder in Chrome.
2. Open a normal `http://` or `https://` page.
3. Click the extension icon and test both capture modes, or use **Option+Shift+F** and **Option+Shift+G**.
4. Wait for the green check.
5. Paste into Figma and confirm the page structure appears as editable layers.

## Uninstall

Remove **FrameDrop** from `chrome://extensions`, then delete this folder.
