#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
EXTENSION_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
RUNTIME_URL="https://mcp.figma.com/mcp/html-to-design/capture.js"
RUNTIME_PATH="$EXTENSION_DIR/vendor/figma-capture.js"
SOURCE_NOTE_PATH="$EXTENSION_DIR/RUNTIME_SOURCE.md"
TEMP_PATH="$RUNTIME_PATH.download.js"

usage() {
    echo "Usage: $0 [--apply <sha256>]" >&2
    exit 64
}

APPLY=0
EXPECTED_CHECKSUM=""

case "${1:-}" in
    "")
        ;;
    --apply)
        [ "$#" -eq 2 ] || usage
        APPLY=1
        EXPECTED_CHECKSUM="$2"
        ;;
    *)
        usage
        ;;
esac

cleanup() {
    rm -f "$TEMP_PATH"
}

trap cleanup EXIT INT TERM

curl --fail --location --proto '=https' --tlsv1.2 --silent --show-error "$RUNTIME_URL" --output "$TEMP_PATH"

if ! grep -Fq "captureForDesign" "$TEMP_PATH"; then
    echo "Downloaded file does not look like the Figma capture runtime." >&2
    exit 1
fi

if ! node --check "$TEMP_PATH"; then
    echo "Downloaded runtime is not valid JavaScript." >&2
    exit 1
fi

CHECKSUM=$(shasum -a 256 "$TEMP_PATH" | awk '{print $1}')

if [ "$APPLY" -ne 1 ]; then
    echo "Downloaded and validated a candidate runtime; no files were changed."
    echo "SHA-256: $CHECKSUM"
    echo "Review it, then apply this exact version with:"
    echo "  $0 --apply $CHECKSUM"
    exit 0
fi

if [ "$CHECKSUM" != "$EXPECTED_CHECKSUM" ]; then
    echo "Downloaded runtime checksum does not match the approved checksum." >&2
    echo "Expected: $EXPECTED_CHECKSUM" >&2
    echo "Actual:   $CHECKSUM" >&2
    exit 1
fi

mv "$TEMP_PATH" "$RUNTIME_PATH"

FETCHED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

sed \
    -e "s|^Fetched:.*|Fetched: $FETCHED_AT|" \
    -e "s|^SHA-256:.*|SHA-256: $CHECKSUM|" \
    "$SOURCE_NOTE_PATH" > "$SOURCE_NOTE_PATH.tmp"
mv "$SOURCE_NOTE_PATH.tmp" "$SOURCE_NOTE_PATH"

echo "Updated Figma capture runtime with the approved checksum."
echo "SHA-256: $CHECKSUM"
