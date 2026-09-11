const buttons = [...document.querySelectorAll("[data-capture-mode]")];
const status = document.querySelector(".status");

const setLoading = (isLoading) => {
    buttons.forEach((button) => {
        button.disabled = isLoading;
    });
};

const showStatus = (message, isError = false) => {
    status.textContent = message;
    status.dataset.error = String(isError);
};

buttons.forEach((button) => {
    button.addEventListener("click", async () => {
        setLoading(true);
        showStatus("Capturing for Figma…");

        try {
            const result = await chrome.runtime.sendMessage({
                type: "capture",
                mode: button.dataset.captureMode,
            });

            if (!result?.ok) {
                throw new Error(result?.error || "FrameDrop could not start the capture.");
            }

            showStatus("Capture started. Paste into Figma with Cmd+V.");
        } catch (error) {
            showStatus(error instanceof Error ? error.message : String(error), true);
            setLoading(false);
        }
    });
});
