(() => {
    const selector = "body";
    const delayMs = 150;
    const mode = globalThis.__frameDropCaptureMode || "current";
    delete globalThis.__frameDropCaptureMode;

    const expandScrollableLayout = () => {
        const elements = [document.documentElement, document.body, ...document.body.querySelectorAll("*")];
        const affectedElements = elements.filter((element) => {
            const styles = window.getComputedStyle(element);
            const clipsVertically =
                (styles.overflowY === "auto" || styles.overflowY === "scroll" || styles.overflowY === "hidden") &&
                element.scrollHeight > element.clientHeight;

            return clipsVertically;
        });
        const originals = affectedElements.map((element) => ({
            element,
            style: element.getAttribute("style"),
        }));

        affectedElements.forEach((element) => {
            element.style.setProperty("height", "auto", "important");
            element.style.setProperty("max-height", "none", "important");
            element.style.setProperty("overflow", "visible", "important");
        });

        return () => {
            originals.forEach(({element, style}) => {
                if (style === null) {
                    element.removeAttribute("style");
                } else {
                    element.setAttribute("style", style);
                }
            });
        };
    };

    return (async () => {
        const captureForDesign = globalThis.figma?.captureForDesign;

        if (typeof captureForDesign !== "function") {
            return {
                ok: false,
                error: "The bundled Figma capture runtime did not initialize.",
            };
        }

        const restoreLayout = mode === "expanded" ? expandScrollableLayout() : undefined;

        try {
            const result = await captureForDesign({selector, delayMs});

            if (result?.success === false) {
                return {
                    ok: false,
                    error: result.error || "Figma could not capture this page.",
                };
            }

            return {ok: true};
        } catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            };
        } finally {
            restoreLayout?.();
        }
    })();
})();
