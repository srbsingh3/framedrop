const CAPTURE_RUNTIME_FILE = "vendor/figma-capture.js";
const CAPTURE_SELECTOR = "body";
const BADGE_CLEAR_DELAY_MS = 2200;
let successfulCaptureCount = 0;

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

const getCaptureSuccessMessage = () => {
    successfulCaptureCount += 1;

    return successfulCaptureCount % 7 === 0
        ? "Seven frames dropped. Bolt FrameDrop was built by Saurabh Singh."
        : "Copied for Figma. Paste with ⌘V.";
};

const showToast = async (tabId, message, tone) => {
    try {
        await chrome.scripting.executeScript({
            target: {tabId},
            args: [message, tone],
            func: (toastMessage, toastTone) => {
                const toastId = "__figma-web-capture-toast__";
                document.getElementById(toastId)?.remove();

                const host = document.createElement("div");
                host.id = toastId;
                Object.assign(host.style, {
                    all: "initial",
                    position: "fixed",
                    right: "20px",
                    bottom: "20px",
                    zIndex: "2147483647",
                });

                const shadow = host.attachShadow({mode: "closed"});
                const toast = document.createElement("div");
                toast.textContent = toastMessage;
                Object.assign(toast.style, {
                    boxSizing: "border-box",
                    maxWidth: "340px",
                    padding: "12px 14px",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: "10px",
                    background: toastTone === "success" ? "#1f2d26" : "#352323",
                    color: "#ffffff",
                    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.28)",
                    font: "600 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    letterSpacing: "0",
                });

                shadow.appendChild(toast);
                document.documentElement.appendChild(host);
                globalThis.setTimeout(() => host.remove(), 3200);
            },
        });
    } catch {
        // Restricted Chrome pages also prevent status UI. The toolbar badge remains visible.
    }
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
        await showToast(
            tabId,
            "Chrome does not allow extensions to capture this page.",
            "error",
        );
        return;
    }

    await setBadge(tabId, "…", "#5551ff");

    try {
        const result = await runCapture(tabId);

        if (!result.ok) {
            throw new Error(result.error);
        }

        await setBadge(tabId, "✓", "#198754");
        await showToast(tabId, getCaptureSuccessMessage(), "success");
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        await setBadge(tabId, "!", "#b3261e");
        await showToast(tabId, `Figma capture failed: ${detail}`, "error");
        console.error("Bolt FrameDrop failed", error);
    } finally {
        clearBadgeLater(tabId);
    }
};

chrome.action.onClicked.addListener((tab) => {
    void captureTab(tab);
});
