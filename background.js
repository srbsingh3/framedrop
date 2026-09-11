const CAPTURE_RUNTIME_FILE = "vendor/figma-capture.js";
const CAPTURE_ENTRY_FILE = "capture-entry.js";
const CAPTURE_MODES = {
    CURRENT: "current",
    EXPANDED: "expanded",
};

const isCapturableUrl = (url = "") =>
    url.startsWith("http://") || url.startsWith("https://");

const runCapture = async (tabId, mode) => {
    // These execute together in the extension-private isolated world. That avoids a
    // cross-injection global handoff and prevents the page from replacing Figma's API.
    await chrome.scripting.executeScript({
        target: {tabId},
        world: "ISOLATED",
        func: (captureMode) => {
            globalThis.__frameDropCaptureMode = captureMode;
        },
        args: [mode],
    });

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

const captureTab = async (tab, mode = CAPTURE_MODES.CURRENT) => {
    const tabId = tab.id;

    if (tabId === undefined) {
        throw new Error("No active tab is available to capture.");
    }

    if (!isCapturableUrl(tab.url)) {
        throw new Error("FrameDrop can capture only http:// and https:// pages.");
    }

    try {
        const result = await runCapture(tabId, mode);

        if (!result.ok) {
            throw new Error(result.error);
        }

        return result;
    } catch (error) {
        console.error("FrameDrop failed", error);
        throw error;
    }
};

const captureActiveTab = async (mode) => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (!tab) {
        return {ok: false, error: "No active tab is available to capture."};
    }

    return captureTab(tab, mode);
};

chrome.commands.onCommand.addListener((command) => {
    const mode =
        command === "capture-expanded-layout" ? CAPTURE_MODES.EXPANDED : CAPTURE_MODES.CURRENT;

    void captureActiveTab(mode);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "capture") {
        return;
    }

    const mode = message.mode === CAPTURE_MODES.EXPANDED ? CAPTURE_MODES.EXPANDED : CAPTURE_MODES.CURRENT;

    void captureActiveTab(mode)
        .then(() => sendResponse({ok: true}))
        .catch((error) =>
            sendResponse({
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            }),
        );

    return true;
});
