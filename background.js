const CAPTURE_RUNTIME_FILE = "vendor/figma-capture.js";
const CAPTURE_SELECTOR = "body";
const BADGE_CLEAR_DELAY_MS = 2200;

const isCapturableUrl = (url = "") =>
    url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://");

const setBadge = async (tabId, text, color) => {
    await Promise.all([
        chrome.action.setBadgeText({tabId, text}),
        chrome.action.setBadgeBackgroundColor({tabId, color}),
    ]);
};

const clearBadgeLater = (tabId) => {
    globalThis.setTimeout(() => {
        void chrome.action.setBadgeText({tabId, text: ""});
    }, BADGE_CLEAR_DELAY_MS);
};

const runCapture = async (tabId) => {
    // MAIN is shared with the page, so never trust a pre-existing page global.
    // Loading our packaged runtime each time replaces any stale or page-defined version.
    await chrome.scripting.executeScript({
        target: {tabId},
        world: "MAIN",
        files: [CAPTURE_RUNTIME_FILE],
    });

    const [execution] = await chrome.scripting.executeScript({
        target: {tabId},
        world: "MAIN",
        args: [CAPTURE_SELECTOR],
        func: async (selector) => {
            const captureForDesign = globalThis.figma?.captureForDesign;

            if (typeof captureForDesign !== "function") {
                return {
                    ok: false,
                    error: "The Figma capture runtime did not initialize.",
                };
            }

            try {
                await captureForDesign({selector, delayMs: 150});
                return {ok: true};
            } catch (error) {
                return {
                    ok: false,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
    });

    return execution?.result ?? {ok: false, error: "Chrome returned no capture result."};
};

const captureTab = async (tab) => {
    const tabId = tab.id;

    if (tabId === undefined) {
        return;
    }

    if (!isCapturableUrl(tab.url)) {
        await setBadge(tabId, "!", "#b3261e");
        clearBadgeLater(tabId);
        return;
    }

    await setBadge(tabId, "…", "#5551ff");

    try {
        const result = await runCapture(tabId);

        if (!result.ok) {
            throw new Error(result.error);
        }

        await setBadge(tabId, "✓", "#198754");
    } catch (error) {
        await setBadge(tabId, "!", "#b3261e");
        console.error("Bolt FrameDrop failed", error);
    } finally {
        clearBadgeLater(tabId);
    }
};

chrome.action.onClicked.addListener((tab) => {
    void captureTab(tab);
});
