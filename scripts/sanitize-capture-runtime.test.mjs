import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import {
    assertClipboardOnlyRuntime,
    sanitizeCaptureRuntime,
} from "./sanitize-capture-runtime.mjs";

const unsafeRuntimeFixture = [
    "(()=>{",
    "function Nr(r){return r}",
    "function Rr(r){let e=Nr.toString();return new Function(`return ${e}`)()(r)}",
    "function Wm(e){return e}",
    "function Sn(e,t){return fetch(e).then(t)}",
    'var Vm;Vm="https://cors-image-proxy.figma.com";',
    "function Km(e){return Promise.resolve(null).then(n=>n||Sn(`${Vm}?url=${encodeURIComponent(e)}`,t))}",
    'function Ub(e){let t={};for(let{name:n,value:r}of e.attributes){let o=n.toLowerCase();(Vb.has(o)||o.startsWith("aria-"))&&(t[n]=r)}return e instanceof HTMLVideoElement&&e.poster&&(t.poster=e.poster),(e instanceof HTMLImageElement||e instanceof HTMLVideoElement)&&e.currentSrc&&(t.currentSrc=e.currentSrc),e instanceof HTMLInputElement&&t.type==null&&(t.type=e.type),e instanceof HTMLInputElement&&(e.type==="checkbox"||e.type==="radio")&&(t.checked=String(e.checked),e.indeterminate&&(t.indeterminate="true")),e instanceof HTMLOptionElement&&(t.selected=String(e.selected),t.label=e.label),e instanceof HTMLInputElement&&e.type==="password"?delete t.value:(e instanceof HTMLInputElement&&Ru.has(e.type)||e instanceof HTMLTextAreaElement)&&(t.value=e.value),t}',
    'var Kb=["figma.com"];function Gb(e){return e}function Yb(){return location.hash.includes("figmacapture")?"figmaendpoint":null}function Lu({startMultiCaptureAutomaticFlow:e}){return e()}',
    "var Ne=class extends Error{};",
    'function Kt(e){window.open(e,"_blank")}',
    'function bm(e,t,n){return fetch(n,{method:"POST",body:JSON.stringify({captureId:t})}).then(r=>({claimUrl:r.fileUrl}))}',
    "function Cm(){return bm()}",
    "function o0(){return bm()}",
    "function w(){return Promise.resolve()}",
    "function ir(){return Promise.resolve()}",
    "function Sm(){return {promise:Promise.resolve(),showSuccess(){}}}",
    "function L(){}",
    "function ro(){}",
    "function _s(){}",
    "function et(e){return String(e)}",
    "function Mn(){}",
    "function Pe(){}",
    'var Du="figma.capturePreferences";function na(){try{let e=localStorage.getItem(Du);if(e)return JSON.parse(e)}catch(e){}return{}}function Bu(e){try{let t=na(),n=v(v({},t),e);localStorage.setItem(Du,JSON.stringify(n))}catch(t){}}',
    "function ym(e){return e.endpoint?Cm(e.captureId,e.endpoint):ir(e.selector,e.extractSourceData)}",
    "window.figma={};window.figma.captureForDesign=ym;",
    "Lu({startMultiCaptureAutomaticFlow:Cm});",
    "})();",
    "//# sourceMappingURL=capture.min.js.map",
].join("");

test("sanitizer removes every non-clipboard capability from an upstream-shaped runtime", () => {
    const sanitized = sanitizeCaptureRuntime(unsafeRuntimeFixture);

    assert.doesNotThrow(() => new vm.Script(sanitized));
    assert.doesNotThrow(() => assertClipboardOnlyRuntime(sanitized));
    assert.match(sanitized, /captureForDesign=ym/);
    assert.match(sanitized, /function Rr\(r\)\{return Nr\(r\)\}/);
    assert.match(sanitized, /t\.checked=String\(e\.checked\)/);
    assert.match(sanitized, /t\.selected=String\(e\.selected\)/);
    assert.match(sanitized, /e\.type==="password"\?delete t\.value/);
    assert.doesNotMatch(sanitized, /figmacapture|figmaendpoint|captureId|method:"POST"/);
    assert.doesNotMatch(sanitized, /cors-image-proxy|new Function|window\.open\(/);
    assert.doesNotMatch(sanitized, /localStorage|figma\.capturePreferences/);
});

test("bundled runtime is safe and sanitizer-idempotent", async () => {
    const runtime = await readFile(new URL("../vendor/figma-capture.js", import.meta.url), "utf8");

    assert.doesNotThrow(() => assertClipboardOnlyRuntime(runtime));
    assert.equal(sanitizeCaptureRuntime(runtime), runtime);
});

test("runtime assertion fails closed if a forbidden capability returns", async () => {
    const runtime = await readFile(new URL("../vendor/figma-capture.js", import.meta.url), "utf8");

    for (const marker of [
        "figmaendpoint",
        'method:"POST"',
        "https://cors-image-proxy.figma.com",
        "new Function",
    ]) {
        assert.throws(() => assertClipboardOnlyRuntime(`${runtime}${marker}`));
    }
});

test("extension keeps the minimum permission and execution-world contract", async () => {
    const [background, captureEntry, manifestSource] = await Promise.all([
        readFile(new URL("../background.js", import.meta.url), "utf8"),
        readFile(new URL("../capture-entry.js", import.meta.url), "utf8"),
        readFile(new URL("../manifest.json", import.meta.url), "utf8"),
    ]);
    const manifest = JSON.parse(manifestSource);

    assert.deepEqual(manifest.permissions, ["activeTab", "scripting"]);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(manifest.content_scripts, undefined);
    assert.equal(manifest.web_accessible_resources, undefined);
    assert.doesNotMatch(background, /world:\s*"MAIN"/);
    assert.equal((background.match(/world:\s*"ISOLATED"/g) ?? []).length, 1);
    assert.match(background, /files:\s*\[CAPTURE_RUNTIME_FILE, CAPTURE_ENTRY_FILE\]/);
    assert.match(background, /executions\[0\]\?\.result/);
    assert.doesNotMatch(background, /file:\/\//);
    assert.match(captureEntry, /^\(\(\) => \{/);
    assert.doesNotMatch(captureEntry, /^const CAPTURE_/m);
    assert.doesNotMatch(captureEntry, /void\s*\(async/);
    assert.match(captureEntry, /return \{ok: true\}/);
});
