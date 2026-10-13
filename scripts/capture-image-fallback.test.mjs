import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const fallbackSource = await readFile(new URL("../capture-image-fallback.js", import.meta.url), "utf8");

const IMAGE_URL = "https://cdn.example.com/photo.jpg";

const loadFallback = ({fetch, images = [], elementAtPoint = null}) => {
    const screenshotRequests = [];
    const context = {
        fetch,
        Response,
        TypeError,
        window: {
            innerWidth: 1000,
            innerHeight: 800,
            getComputedStyle: () => ({
                borderLeftWidth: "0px",
                borderTopWidth: "0px",
                borderRightWidth: "0px",
                borderBottomWidth: "0px",
                paddingLeft: "0px",
                paddingTop: "0px",
                paddingRight: "0px",
                paddingBottom: "0px",
            }),
        },
        document: {images, elementFromPoint: () => elementAtPoint},
        chrome: {
            runtime: {
                sendMessage: async (message) => {
                    screenshotRequests.push(message);
                    return {};
                },
            },
        },
    };
    context.globalThis = context;
    vm.runInNewContext(fallbackSource, context);
    return {fetch: context.fetch, screenshotRequests};
};

test("retries a blocked image past the browser cache", async () => {
    const calls = [];
    const {fetch} = loadFallback({
        fetch: async (url, init) => {
            calls.push(init?.cache);
            if (init?.cache !== "no-store") {
                throw new TypeError("Failed to fetch");
            }
            return new Response("image", {status: 200});
        },
    });

    const response = await fetch(IMAGE_URL, {});

    assert.equal(await response.text(), "image");
    assert.deepEqual(calls, [undefined, "no-store"]);
});

test("leaves aborted requests alone", async () => {
    let calls = 0;
    const {fetch} = loadFallback({
        fetch: async () => {
            calls += 1;
            throw new DOMException("Aborted", "AbortError");
        },
    });

    await assert.rejects(fetch(IMAGE_URL), {name: "AbortError"});
    assert.equal(calls, 1);
});

test("still fails silently when the image is covered and cannot be screenshotted", async () => {
    const image = {
        currentSrc: IMAGE_URL,
        getBoundingClientRect: () => ({left: 10, top: 10, right: 110, bottom: 110}),
    };
    const {fetch, screenshotRequests} = loadFallback({
        fetch: async () => {
            throw new TypeError("Failed to fetch");
        },
        images: [image],
        elementAtPoint: {},
    });

    await assert.rejects(fetch(IMAGE_URL), TypeError);
    assert.equal(screenshotRequests.length, 0);
});

test("asks for one screenshot when a visible image cannot be downloaded", async () => {
    const image = {
        currentSrc: IMAGE_URL,
        getBoundingClientRect: () => ({left: 10, top: 10, right: 110, bottom: 110}),
    };
    const {fetch, screenshotRequests} = loadFallback({
        fetch: async () => new Response("", {status: 403}),
        images: [image],
        elementAtPoint: image,
    });

    const [first, second] = await Promise.all([fetch(IMAGE_URL), fetch(IMAGE_URL)]);

    // The stubbed screenshot is empty, so the original response is returned unchanged.
    assert.equal(first.status, 403);
    assert.equal(second.status, 403);
    assert.deepEqual(screenshotRequests.map(({type}) => type), ["capture-visible-tab"]);
});
