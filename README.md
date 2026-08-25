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

## DevTools fallback (when extensions are blocked)

Some managed Chrome profiles do not allow custom extensions. For that case, this repository includes [figma-capture-devtools-snippet.js](./figma-capture-devtools-snippet.js): a self-contained DevTools Snippet containing the same bundled Figma capture runtime as the extension.

### One-time setup

1. Open a normal web page, then press **Option+Command+I** to open Chrome DevTools.
2. Open **Sources** → **Snippets** → **New snippet**.
3. Name it `Copy page to Figma`.
4. Paste the complete contents of `figma-capture-devtools-snippet.js` and save it.

### Each time you want to capture

1. Open the page and reach the exact state you want to copy.
2. Press **Option+Command+I** → **Sources** → **Snippets**.
3. Select `Copy page to Figma` and press **Command+Enter**.
4. Click once on the actual webpage. Chrome requires the page to regain focus before the snippet can write to the clipboard.
5. In Figma, paste with **Command+V**.

The snippet does nothing until someone explicitly runs it. It does not install an extension or run in the background. It reads the current page and puts Figma-compatible content on the clipboard; the result only reaches Figma if the user chooses to paste it there. Use it only for pages and content that you are allowed to copy into Figma.

### Why the snippet is self-contained

A short console snippet could download Figma's runtime from `mcp.figma.com`, but some websites block that request with a Content Security Policy (CSP). The supplied snippet embeds the reviewed runtime, so it makes no network request to load the capture code and works on those pages too.

DevTools may show a **Source map failed to load** notice while it runs. That only affects debugging of Figma's minified runtime; it does not stop capture. The usual reason a capture remains on “Capturing page for clipboard” is that DevTools still has focus: click the webpage once.

The runtime is provided by Figma and is large/minified, so it is not independently audited by this project. As with the extension, it may read linked page assets while reconstructing the design. It cannot reliably reproduce protected assets, cross-origin iframes, canvas/WebGL, video, browser PDF viewers, or closed shadow roots.

### Regenerate after updating the runtime

After using the approved updater in the next section, rebuild the DevTools Snippet so it contains the same version:

```sh
./scripts/build-devtools-snippet.sh
```

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
