/*
   Liwi-Ka Occasion Theme
   -----------------------
   Handles:
   1. Dynamic background colour from the occasion hero image.
   2. Initial position at the absolute top.
   3. 1.4 second pause.
   4. Slow cinematic scroll to the first products.
*/

(function () {

    /* =========================================
       DYNAMIC HERO IMAGE THEME
    ========================================= */

    function applyImageTheme(image) {

        const page = document.querySelector(".occasion-page");

        if (!page || !image.naturalWidth || !image.naturalHeight) {
            return;
        }

        const canvas = document.createElement("canvas");
        const size = 32;

        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d", {
            willReadFrequently: true
        });

        if (!context) {
            return;
        }

        try {

            context.drawImage(image, 0, 0, size, size);

            const pixels = context.getImageData(
                0,
                0,
                size,
                size
            ).data;

            let red = 0;
            let green = 0;
            let blue = 0;
            let count = 0;

            for (let index = 0; index < pixels.length; index += 4) {

                const brightness =
                    (
                        pixels[index] +
                        pixels[index + 1] +
                        pixels[index + 2]
                    ) / 3;

                if (
                    pixels[index + 3] > 0 &&
                    brightness > 12
                ) {

                    red += pixels[index];
                    green += pixels[index + 1];
                    blue += pixels[index + 2];

                    count++;
                }
            }

            if (!count) {
                return;
            }

            const shade = 0.22;

            page.style.setProperty(
                "--occasion-surface",
                `rgb(
                    ${Math.round((red / count) * shade)},
                    ${Math.round((green / count) * shade)},
                    ${Math.round((blue / count) * shade)}
                )`
            );

        } catch (error) {
            // Keep CSS fallback colour.
        }
    }




    /* =========================================
       INITIALIZATION — NO AUTO SCROLL
       The occasion page opens wherever the user/browser
       places it. This file only derives the visual theme
       from the hero image.
    ========================================= */
    document.addEventListener("DOMContentLoaded", () => {
        const image = document.querySelector(".occasion-hero-background");
        if (!image) return;

        if (image.complete) {
            applyImageTheme(image);
        }

        image.addEventListener(
            "load",
            () => applyImageTheme(image),
            { once: true }
        );
    }, { once: true });

})();
