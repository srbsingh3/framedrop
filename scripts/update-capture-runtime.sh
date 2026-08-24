#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
EXTENSION_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
RUNTIME_URL="https://mcp.figma.com/mcp/html-to-design/capture.js"
RUNTIME_PATH="$EXTENSION_DIR/vendor/figma-capture.js"
SOURCE_NOTE_PATH="$EXTENSION_DIR/RUNTIME_SOURCE.md"
TEMP_PATH="$RUNTIME_PATH.download"

cleanup() {
    rm -f "$TEMP_PATH"
}

trap cleanup EXIT INT TERM

curl --fail --location --silent --show-error "$RUNTIME_URL" --output "$TEMP_PATH"

if ! grep -q "captureForDesign" "$TEMP_PATH"; then
    echo "Downloaded file does not look like the Figma capture runtime." >&2
    exit 1
fi

mv "$TEMP_PATH" "$RUNTIME_PATH"

CHECKSUM=$(shasum -a 256 "$RUNTIME_PATH" | awk '{print $1}')
FETCHED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

sed \
    -e "s|^Fetched:.*|Fetched: $FETCHED_AT|" \
    -e "s|^SHA-256:.*|SHA-256: $CHECKSUM|" \
    "$SOURCE_NOTE_PATH" > "$SOURCE_NOTE_PATH.tmp"
mv "$SOURCE_NOTE_PATH.tmp" "$SOURCE_NOTE_PATH"

echo "Updated Figma capture runtime."
echo "SHA-256: $CHECKSUM"
