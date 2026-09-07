# Bundled capture runtime

Upstream source: https://mcp.figma.com/mcp/html-to-design/capture.js

Fetched: 2026-08-24T08:46:59Z

Upstream SHA-256: 21036217c289b95e49a3f597f03fdfa95da0b1741c4658164cc1c36f8e20f772

Packaged SHA-256: 99dd4479070d38e7ff261b5bc85dd723dd53f3ca7d09a2db0796631509dbd14c

The packaged runtime is a reviewed, reduced copy of Figma's HTML-to-design capture script. `scripts/sanitize-capture-runtime.mjs` makes these pinned, fail-closed changes:

- removes URL-triggered and selection-triggered upload flows
- removes capture IDs, Figma endpoints, POST submission, and file-opening paths
- removes Figma's image-proxy fallback while retaining direct page-asset loading
- removes dynamic `new Function` evaluation
- removes page-origin local storage for capture UI preferences
- removes stale source-map comments
- removes live form values and checked or selected state from captured attributes
- forces `captureForDesign` to use its local clipboard path

FrameDrop injects the result in Chrome's isolated extension world and invokes only `captureForDesign` for the page body.

The runtime is bundled so Chrome can execute it without downloading executable code during capture. It never updates itself. A newer Figma runtime requires a deliberate code review, extension version bump, and Chrome Web Store release.

Figma's public documentation describes the clipboard capture workflow, but it does not clearly grant permission to redistribute a modified copy of this script. Confirm that right with Bolt Legal or Figma before publishing, even for domain-private distribution.
