#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_PATH="$EXTENSION_DIR/vendor/figma-capture.js"
SNIPPET_PATH="$EXTENSION_DIR/figma-capture-devtools-snippet.js"

if ! grep -Fq "captureForDesign" "$RUNTIME_PATH"; then
    echo "Bundled runtime does not expose Figma captureForDesign." >&2
    exit 1
fi

cp "$RUNTIME_PATH" "$SNIPPET_PATH"
printf '\n\nvoid (async () => {\n  const capture = globalThis.figma?.captureForDesign;\n  if (typeof capture !== "function") {\n    throw new Error("Figma capture runtime did not initialize.");\n  }\n\n  await capture({selector: "body", delayMs: 150});\n  console.info("Figma capture complete. Paste into Figma with Cmd/Ctrl+V.");\n})().catch((error) => console.error("Figma capture failed:", error));\n' >> "$SNIPPET_PATH"

node --check "$SNIPPET_PATH"
echo "Built $SNIPPET_PATH"
