const CAPTURE_RUNTIME_FILE = "vendor/figma-capture.js";
const CAPTURE_ENTRY_FILE = "capture-entry.js";

const isCapturableUrl = (url = "") =>
    url.startsWith("http://") || url.startsWith("https://");

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
        console.warn("Bolt FrameDrop can capture only http:// and https:// pages.");
        return;
    }

    try {
        const result = await runCapture(tabId);

        if (!result.ok) {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Bolt FrameDrop failed", error);
    }
};

chrome.action.onClicked.addListener((tab) => {
    void captureTab(tab);
});
