#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST_PATH="$EXTENSION_DIR/manifest.json"
BACKGROUND_PATH="$EXTENSION_DIR/background.js"
CAPTURE_ENTRY_PATH="$EXTENSION_DIR/capture-entry.js"
CAPTURE_MENU_SCRIPT_PATH="$EXTENSION_DIR/capture-menu.js"
RUNTIME_PATH="$EXTENSION_DIR/vendor/figma-capture.js"
RUNTIME_NOTE_PATH="$EXTENSION_DIR/RUNTIME_SOURCE.md"
SANITIZER_PATH="$EXTENSION_DIR/scripts/sanitize-capture-runtime.mjs"
SANITIZER_TEST_PATH="$EXTENSION_DIR/scripts/sanitize-capture-runtime.test.mjs"
DIST_DIR="$EXTENSION_DIR/dist"

ALLOWLIST=(
    "manifest.json"
    "background.js"
    "capture-entry.js"
    "capture-menu.html"
    "capture-menu.js"
    "capture-menu.css"
    "vendor/figma-capture.js"
    "icons/icon-16.png"
    "icons/icon-32.png"
    "icons/icon-48.png"
    "icons/icon-128.png"
)

require_file() {
    local path="$1"

    if [[ ! -f "$path" ]]; then
        echo "Missing required package file: ${path#$EXTENSION_DIR/}" >&2
        exit 1
    fi
}

manifest_version="$(
    python3 - "$MANIFEST_PATH" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    manifest = json.load(handle)

version = manifest.get("version")
if not isinstance(version, str) or not version:
    raise SystemExit("Manifest version is missing or invalid.")

print(version)
PY
)"

case "$manifest_version" in
    (*[!0-9A-Za-z._-]*)
        echo "Manifest version contains unsupported characters: $manifest_version" >&2
        exit 1
        ;;
esac

expected_runtime_sha="$(
    awk -F': ' '/^Packaged SHA-256: / { print $2; exit }' "$RUNTIME_NOTE_PATH"
)"

if [[ -z "$expected_runtime_sha" ]]; then
    echo "Could not read packaged runtime checksum from RUNTIME_SOURCE.md." >&2
    exit 1
fi

for relative_path in "${ALLOWLIST[@]}"; do
    require_file "$EXTENSION_DIR/$relative_path"
done

python3 -m json.tool "$MANIFEST_PATH" >/dev/null
node --check "$BACKGROUND_PATH"
node --check "$CAPTURE_ENTRY_PATH"
node --check "$CAPTURE_MENU_SCRIPT_PATH"
node --check "$SANITIZER_PATH"
node --test "$SANITIZER_TEST_PATH"

actual_runtime_sha="$(shasum -a 256 "$RUNTIME_PATH" | awk '{print $1}')"
if [[ "$actual_runtime_sha" != "$expected_runtime_sha" ]]; then
    echo "Bundled runtime checksum mismatch." >&2
    echo "Expected: $expected_runtime_sha" >&2
    echo "Actual:   $actual_runtime_sha" >&2
    exit 1
fi

mkdir -p "$DIST_DIR"
staging_dir="$(mktemp -d "$DIST_DIR/.package-staging.XXXXXX")"
output_dir="$(mktemp -d "$DIST_DIR/.package-output.XXXXXX")"
output_zip="$output_dir/framedrop-$manifest_version.zip"
final_zip="$DIST_DIR/framedrop-$manifest_version.zip"

cleanup() {
    rm -rf "$staging_dir" "$output_dir"
}

trap cleanup EXIT INT TERM

for relative_path in "${ALLOWLIST[@]}"; do
    target_path="$staging_dir/$relative_path"
    mkdir -p "$(dirname "$target_path")"
    cp "$EXTENSION_DIR/$relative_path" "$target_path"
    touch -t 198001010000 "$target_path"
done

python3 - "$staging_dir" "$output_zip" <<'PY'
from __future__ import annotations

import pathlib
import sys
import zipfile

allowlist = [
    "manifest.json",
    "background.js",
    "capture-entry.js",
    "capture-menu.html",
    "capture-menu.js",
    "capture-menu.css",
    "vendor/figma-capture.js",
    "icons/icon-16.png",
    "icons/icon-32.png",
    "icons/icon-48.png",
    "icons/icon-128.png",
]

stage_dir = pathlib.Path(sys.argv[1])
output_zip = pathlib.Path(sys.argv[2])

with zipfile.ZipFile(output_zip, "w") as archive:
    for relative_path in allowlist:
        source_path = stage_dir / relative_path
        if not source_path.is_file():
            raise SystemExit(f"Missing staged package file: {relative_path}")

        info = zipfile.ZipInfo(relative_path, (1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_STORED
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        with source_path.open("rb") as handle:
            archive.writestr(info, handle.read())

with zipfile.ZipFile(output_zip, "r") as archive:
    entries = archive.namelist()
    if entries != allowlist:
        raise SystemExit(
            "Package entries do not match the allowlist: "
            + ", ".join(entries)
        )

print("Verified package entries against allowlist.")
PY

mv "$output_zip" "$final_zip"
package_sha="$(shasum -a 256 "$final_zip" | awk '{print $1}')"

printf 'Built %s\n' "$final_zip"
printf 'SHA-256: %s\n' "$package_sha"
printf 'Entries: %s\n' "${ALLOWLIST[*]}"
