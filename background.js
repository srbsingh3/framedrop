const CAPTURE_RUNTIME_FILE = "vendor/figma-capture.js";
const CAPTURE_ENTRY_FILE = "capture-entry.js";
const BADGE_CLEAR_DELAY_MS = 2200;

const isCapturableUrl = (url = "") =>
    url.startsWith("http://") || url.startsWith("https://");

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
    // These execute together in the extension-private isolated world. That avoids a
    // cross-injection global handoff and prevents the page from replacing Figma's API.
    const executions = await chrome.scripting.executeScript({
        target: {tabId},
        world: "ISOLATED",
        files: [CAPTURE_RUNTIME_FILE, CAPTURE_ENTRY_FILE],
    });

    const result = executions[0]?.result;

    if (result === undefined) {
        return {
            ok: false,
            error:
                "Chrome did not return a capture status. Reload the extension and try the page again.",
        };
    }

    return result;
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
