(() => {
    // The capture runtime downloads every image with a plain fetch, which page CORS rules can
    // block (common on CDNs) and which then leaves an empty image in Figma. This wrapper only
    // replaces fetch in FrameDrop's isolated world, never the page's, and recovers silently:
    // first by retrying past the browser cache, then by cropping the image from a screenshot.
    const nativeFetch = (globalThis.__frameDropNativeFetch ??= globalThis.fetch);
    let screenshotPromise;

    const decodeDataUrl = (dataUrl) => {
        const [header, base64] = dataUrl.split(",");
        const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
        return new Blob([bytes], {type: header.slice(5).split(";")[0]});
    };

    // One screenshot per capture covers every failed image and stays within Chrome's
    // captureVisibleTab rate limit.
    const takeScreenshot = () =>
        (screenshotPromise ??= chrome.runtime
            .sendMessage({type: "capture-visible-tab"})
            .then((response) => (response?.dataUrl ? createImageBitmap(decodeDataUrl(response.dataUrl)) : null))
            .catch(() => null));

    const contentBox = (image) => {
        const rect = image.getBoundingClientRect();
        const styles = window.getComputedStyle(image);
        const edge = (side) =>
            parseFloat(styles[`border${side}Width`]) + parseFloat(styles[`padding${side}`]);
        const left = rect.left + edge("Left");
        const top = rect.top + edge("Top");

        return {
            left,
            top,
            width: rect.right - edge("Right") - left,
            height: rect.bottom - edge("Bottom") - top,
        };
    };

    // A screenshot also records anything drawn over the image, so only use it when the whole
    // image is on screen and nothing covers its center or corners.
    const isFullyVisible = (image, box) => {
        if (box.width < 1 || box.height < 1) {
            return false;
        }

        const right = box.left + box.width;
        const bottom = box.top + box.height;

        if (box.left < 0 || box.top < 0 || right > window.innerWidth || bottom > window.innerHeight) {
            return false;
        }

        const points = [
            [box.left + box.width / 2, box.top + box.height / 2],
            [box.left + 1, box.top + 1],
            [right - 1, box.top + 1],
            [box.left + 1, bottom - 1],
            [right - 1, bottom - 1],
        ];

        return points.every(([x, y]) => document.elementFromPoint(x, y) === image);
    };

    const cropImageFromScreenshot = async (url) => {
        try {
            const image = [...document.images].find(
                (candidate) => candidate.currentSrc === url && isFullyVisible(candidate, contentBox(candidate)),
            );

            if (!image) {
                return null;
            }

            const box = contentBox(image);
            const screenshot = await takeScreenshot();

            if (!screenshot) {
                return null;
            }

            const scale = screenshot.width / window.innerWidth;
            const canvas = new OffscreenCanvas(
                Math.round(box.width * scale),
                Math.round(box.height * scale),
            );
            canvas
                .getContext("2d")
                .drawImage(
                    screenshot,
                    box.left * scale,
                    box.top * scale,
                    box.width * scale,
                    box.height * scale,
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
            const blob = await canvas.convertToBlob({type: "image/png"});

            return new Response(blob, {headers: {"Content-Type": "image/png"}});
        } catch {
            return null;
        }
    };

    globalThis.fetch = async (input, init) => {
        if (typeof input !== "string") {
            return nativeFetch(input, init);
        }

        let response;

        try {
            response = await nativeFetch(input, init);
        } catch (error) {
            if (!(error instanceof TypeError)) {
                throw error;
            }

            // A CDN that only sends CORS headers when asked can leave a header-less copy in the
            // cache from the page's own <img> load. Skipping the cache asks the CDN again.
            try {
                response = await nativeFetch(input, {...init, cache: "no-store"});
            } catch (retryError) {
                const cropped = await cropImageFromScreenshot(input);

                if (cropped) {
                    return cropped;
                }

                throw retryError;
            }
        }

        if (response.ok) {
            return response;
        }

        return (await cropImageFromScreenshot(input)) ?? response;
    };
})();
