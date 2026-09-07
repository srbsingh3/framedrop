#!/usr/bin/env node

import {readFile, writeFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {Script} from "node:vm";

const AUTO_CAPTURE_CALL = /\b[$A-Z_a-z][$\w]*\(\{startMultiCaptureAutomaticFlow:/g;
const AUTO_CAPTURE_SUPPORT_START = "var Kb=[";
const AUTO_CAPTURE_SUPPORT_END = "var Ne=class";
const FIGMA_PROXY_ASSIGNMENT = 'Vm="https://cors-image-proxy.figma.com";';

const UNSAFE_QUICKSORT_FACTORY =
    "function Rr(r){let e=Nr.toString();return new Function(\\`return \\${e}\\`)()(r)}";
const UNSAFE_INLINE_QUICKSORT_FACTORY =
    "function Rr(r){let e=Nr.toString();return new Function(`return ${e}`)()(r)}";
const SAFE_QUICKSORT_FACTORY = "function Rr(r){return Nr(r)}";
const SAFE_SVG_FETCH =
    "function Km(e){return w(this,null,function*(){let t=r=>w(this,null,function*(){return r.ok?Wm(yield r.text()):null});return Sn(e,t,AbortSignal.timeout(8e3)).catch(()=>null)})}";
const SAFE_FORM_ATTRIBUTES =
    'function Ub(e){let t={};for(let{name:n,value:r}of e.attributes){let o=n.toLowerCase();(Vb.has(o)||o.startsWith("aria-"))&&o!=="value"&&o!=="checked"&&o!=="selected"&&(t[n]=r)}return e instanceof HTMLVideoElement&&e.poster&&(t.poster=e.poster),(e instanceof HTMLImageElement||e instanceof HTMLVideoElement)&&e.currentSrc&&(t.currentSrc=e.currentSrc),e instanceof HTMLInputElement&&t.type==null&&(t.type=e.type),e instanceof HTMLOptionElement&&e.label&&(t.label=e.label),t}';
const SAFE_CLIPBOARD_CAPTURE =
    'function ym(e={}){return w(this,null,function*(){let{selector:r="body",delayMs:i}=e;L.log("Starting clipboard capture...",{selector:r}),ro(),i&&i>0&&(L.log(`Waiting ${i}ms before capture...`),yield new Promise(c=>setTimeout(c,i)));try{let c=yield ir(r,!1);L.log("Copying to clipboard...");try{yield _s(c),L.log("Success! Capture copied to clipboard.")}catch(l){let d=et(l);return L.error("Clipboard error:",d),Mn(`Clipboard error: ${d}`),{success:!1,error:`Clipboard error: ${d}`}}}catch(c){let l=et(c);return L.error("Error:",l),l.includes("Element not found")?Pe():Mn(c instanceof Error?c:l),{success:!1,error:l}}let{promise:s,showSuccess:u}=Sm(r,!1);return u(),s})}';
const STORED_CAPTURE_PREFERENCES =
    'var Du="figma.capturePreferences";function na(){try{let e=localStorage.getItem(Du);if(e)return JSON.parse(e)}catch(e){}return{}}function Bu(e){try{let t=na(),n=v(v({},t),e);localStorage.setItem(Du,JSON.stringify(n))}catch(t){}}';
const MEMORY_ONLY_CAPTURE_PREFERENCES = "function na(){return{}}function Bu(e){}";
const WORKER_SOURCE_MAP_COMMENT =
    "\n//# sourceMappingURL=worker_thread_entry.iife.js.map\n";

const FORBIDDEN_MARKERS = [
    "startMultiCaptureAutomaticFlow",
    "figmacapture",
    "figmaendpoint",
    "captureId",
    "endpoint",
    'method:"POST"',
    "claimUrl",
    "fileUrl",
    "window.open(",
    "https://cors-image-proxy.figma.com",
    "new Function",
    ".value=e.value",
    ".checked=String(",
    ".selected=String(",
    "localStorage",
    "figma.capturePreferences",
    WORKER_SOURCE_MAP_COMMENT,
    "//# sourceMappingURL=capture.min.js.map",
];

const usage = () => {
    console.error("Usage: node scripts/sanitize-capture-runtime.mjs <input.js> <output.js>");
    process.exit(64);
};

const autoCaptureCallStarts = (source) =>
    [...source.matchAll(AUTO_CAPTURE_CALL)].filter(
        (match) => !source.slice(0, match.index).endsWith("function "),
    );

const findClosingDelimiter = (source, openingIndex, opening, closing) => {
    let depth = 0;
    let quote = null;

    for (let index = openingIndex; index < source.length; index += 1) {
        const character = source[index];
        if (quote !== null) {
            if (character === "\\") {
                index += 1;
            } else if (character === quote) {
                quote = null;
            }
            continue;
        }

        if (character === "'" || character === '"' || character === "`") {
            quote = character;
        } else if (character === opening) {
            depth += 1;
        } else if (character === closing) {
            depth -= 1;
            if (depth === 0) {
                return index;
            }
        }
    }

    throw new Error(`Could not find closing ${closing} in Figma runtime.`);
};

const replaceFunction = (source, name, replacement) => {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);

    if (start === -1) {
        if (source.includes(replacement)) {
            return source;
        }
        throw new Error(`Could not find Figma runtime function ${name}.`);
    }

    if (source.indexOf(marker, start + marker.length) !== -1) {
        throw new Error(`Found more than one Figma runtime function ${name}.`);
    }

    const openingBrace = source.indexOf("{", start + marker.length);
    const closingBrace = findClosingDelimiter(source, openingBrace, "{", "}");
    return `${source.slice(0, start)}${replacement}${source.slice(closingBrace + 1)}`;
};

const removeFunction = (source, name) => {
    const marker = `function ${name}(`;
    if (!source.includes(marker)) {
        return source;
    }
    return replaceFunction(source, name, "");
};

const replaceExactlyOnce = (source, expected, replacement, label) => {
    const first = source.indexOf(expected);

    if (first === -1 || source.indexOf(expected, first + expected.length) !== -1) {
        throw new Error(`Expected exactly one ${label} in the pinned Figma runtime.`);
    }

    return `${source.slice(0, first)}${replacement}${source.slice(first + expected.length)}`;
};

const removeAutomaticCaptureCall = (source) => {
    const matches = autoCaptureCallStarts(source);

    if (matches.length === 0) {
        return source;
    }

    if (matches.length !== 1 || matches[0].index === undefined) {
        throw new Error(
            `Expected at most one Figma automatic capture call; found ${matches.length}.`,
        );
    }

    const callStart = matches[0].index;
    const openingParenthesis = source.indexOf("(", callStart);
    const callEnd = findClosingDelimiter(source, openingParenthesis, "(", ")");
    return `${source.slice(0, callStart)}void 0${source.slice(callEnd + 1)}`;
};

const removeAutomaticCaptureSupport = (source) => {
    const start = source.indexOf(AUTO_CAPTURE_SUPPORT_START);
    const end = source.indexOf(AUTO_CAPTURE_SUPPORT_END, start);

    if (start === -1) {
        return source;
    }

    if (end === -1) {
        throw new Error("Could not isolate Figma's automatic URL capture support.");
    }

    return `${source.slice(0, start)}${source.slice(end)}`;
};

const assertValidJavaScript = (source, stage) => {
    try {
        new Script(source);
    } catch (error) {
        throw new Error(`Sanitized runtime became invalid after ${stage}.`, {cause: error});
    }
};

export const assertClipboardOnlyRuntime = (source) => {
    if (!source.includes("captureForDesign=ym")) {
        throw new Error("Runtime does not expose the reviewed clipboard capture function.");
    }

    if (!source.includes(SAFE_CLIPBOARD_CAPTURE)) {
        throw new Error("Runtime does not contain the reviewed clipboard-only entry point.");
    }

    if (!source.includes(SAFE_FORM_ATTRIBUTES)) {
        throw new Error("Runtime does not contain the reviewed form-state redaction.");
    }

    for (const marker of FORBIDDEN_MARKERS) {
        if (source.includes(marker)) {
            throw new Error(`Runtime still contains forbidden capability: ${marker}`);
        }
    }
};

export const sanitizeCaptureRuntime = (source) => {
    if (!source.includes("captureForDesign")) {
        throw new Error("Downloaded file does not expose Figma captureForDesign.");
    }

    assertValidJavaScript(source, "reading the source");

    let sanitized = removeAutomaticCaptureCall(source);
    assertValidJavaScript(sanitized, "removing the automatic capture call");
    sanitized = removeAutomaticCaptureSupport(sanitized);
    assertValidJavaScript(sanitized, "removing automatic capture support");

    for (const name of ["Kt", "bm", "Cm", "o0"]) {
        sanitized = removeFunction(sanitized, name);
        assertValidJavaScript(sanitized, `removing ${name}`);
    }

    if (sanitized.includes("new Function")) {
        const unsafeFactory = sanitized.includes(UNSAFE_QUICKSORT_FACTORY)
            ? UNSAFE_QUICKSORT_FACTORY
            : UNSAFE_INLINE_QUICKSORT_FACTORY;
        sanitized = replaceExactlyOnce(
            sanitized,
            unsafeFactory,
            SAFE_QUICKSORT_FACTORY,
            "dynamic quicksort factory",
        );
        assertValidJavaScript(sanitized, "removing dynamic code evaluation");
    }

    if (sanitized.includes("https://cors-image-proxy.figma.com")) {
        sanitized = replaceFunction(sanitized, "Km", SAFE_SVG_FETCH);
        sanitized = sanitized.replace(FIGMA_PROXY_ASSIGNMENT, "");
        assertValidJavaScript(sanitized, "removing the Figma image proxy");
    }

    if (
        sanitized.includes(".value=e.value") ||
        sanitized.includes(".checked=String(") ||
        sanitized.includes(".selected=String(")
    ) {
        sanitized = replaceFunction(sanitized, "Ub", SAFE_FORM_ATTRIBUTES);
        assertValidJavaScript(sanitized, "redacting form state");
    }

    if (!sanitized.includes(SAFE_CLIPBOARD_CAPTURE)) {
        sanitized = replaceFunction(sanitized, "ym", SAFE_CLIPBOARD_CAPTURE);
        assertValidJavaScript(sanitized, "restricting capture to the clipboard");
    }

    if (sanitized.includes("localStorage")) {
        sanitized = replaceExactlyOnce(
            sanitized,
            STORED_CAPTURE_PREFERENCES,
            MEMORY_ONLY_CAPTURE_PREFERENCES,
            "stored capture preference block",
        );
        assertValidJavaScript(sanitized, "removing page-origin storage");
    }

    if (sanitized.includes(WORKER_SOURCE_MAP_COMMENT)) {
        sanitized = replaceExactlyOnce(
            sanitized,
            WORKER_SOURCE_MAP_COMMENT,
            "\n",
            "embedded worker source-map comment",
        );
        assertValidJavaScript(sanitized, "removing the embedded worker source map");
    }

    sanitized = sanitized.replace(/\n?\/\/# sourceMappingURL=[^\n]*\n?$/, "\n");
    assertClipboardOnlyRuntime(sanitized);
    return sanitized;
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
    if (process.argv.length !== 4) {
        usage();
    }

    const [, , inputPath, outputPath] = process.argv;
    const source = await readFile(inputPath, "utf8");
    await writeFile(outputPath, sanitizeCaptureRuntime(source));
}
