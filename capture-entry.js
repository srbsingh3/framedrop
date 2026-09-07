(() => {
    const selector = "body";
    const delayMs = 150;

    return (async () => {
        const captureForDesign = globalThis.figma?.captureForDesign;

        if (typeof captureForDesign !== "function") {
            return {
                ok: false,
                error: "The bundled Figma capture runtime did not initialize.",
            };
        }

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
        }
    })();
})();
