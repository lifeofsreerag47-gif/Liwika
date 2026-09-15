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
       FORCE PAGE TO THE VERY TOP
    ========================================= */

    function forceTop() {

        window.scrollTo(0, 0);

        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

    }


    /* =========================================
       SLOW CINEMATIC AUTO SCROLL
    ========================================= */

    function playOccasionEntryScroll() {

        /*
           Only perform the animation when the user
           came from the Seasonals occasion cards.
        */

        const enteredFromSeasonals =
            sessionStorage.getItem("occasionEntry");

        if (enteredFromSeasonals !== "true") {
            return;
        }

        /*
           Remove immediately.

           This means refreshing the occasion page
           will NOT replay the animation.
        */

        sessionStorage.removeItem("occasionEntry");


        /*
           FIRST:
           Make absolutely sure the page is at the top.
        */

        forceTop();


        /*
           Wait 1.4 seconds.
        */

        setTimeout(() => {

            /*
               Force top once again immediately before
               starting the animation.

               This protects against browser scroll
               restoration.
            */

            forceTop();


            const products =
                document.querySelector(".occasion-products");

            if (!products) {
                return;
            }


            /*
               Calculate the exact position of the
               product section.
            */

            const startPosition = window.scrollY;

            const productsPosition =
                products.getBoundingClientRect().top +
                window.scrollY;

            /*
               Keep the first product row comfortably
               visible below the navbar.
            */

            const navbar =
                document.querySelector(".navbar");

            const navbarHeight =
                navbar ? navbar.offsetHeight : 0;

            const targetPosition =
                Math.max(
                    0,
                    productsPosition -
                    navbarHeight -
                    30
                );


            /*
               If we're already at/near the target,
               don't animate.
            */

            if (targetPosition <= startPosition + 5) {
                return;
            }


            /* =====================================
               VERY SLOW SCROLL
            ===================================== */

            /*
               5000ms = 5 seconds.

               Increase this to 6000 or 7000 if
               you want it even slower.
            */

            const duration = 5000;

            const startTime =
                performance.now();


            /*
               Cinematic easing.

               Starts gently,
               moves smoothly,
               then gradually comes to a stop.
            */

            function easeInOutCubic(t) {

                return t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2;

            }


            function animateScroll(currentTime) {

                const elapsed =
                    currentTime - startTime;

                const progress =
                    Math.min(
                        elapsed / duration,
                        1
                    );

                const easedProgress =
                    easeInOutCubic(progress);


                const currentPosition =
                    startPosition +
                    (
                        targetPosition -
                        startPosition
                    ) *
                    easedProgress;


                window.scrollTo(
                    0,
                    currentPosition
                );


                if (progress < 1) {

                    requestAnimationFrame(
                        animateScroll
                    );

                }

            }


            requestAnimationFrame(
                animateScroll
            );

        }, 1400);
    }


    /* =========================================
       INITIALIZATION
    ========================================= */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /*
               Prevent browser from restoring the
               previous scroll position.
            */

            if ("scrollRestoration" in history) {
                history.scrollRestoration = "manual";
            }


            /*
               Immediately force the occasion page
               to the absolute top.
            */

            forceTop();


            /*
               Hero image colour detection.
            */

            const image =
                document.querySelector(
                    ".occasion-hero-background"
                );

            if (image) {

                if (image.complete) {
                    applyImageTheme(image);
                }

                image.addEventListener(
                    "load",
                    () => applyImageTheme(image),
                    { once: true }
                );

            }


            /*
               Start the occasion entry animation.
            */

            playOccasionEntryScroll();

        }
    );


    /*
       Browser pageshow event.

       This is particularly useful for browsers that
       restore scroll position when navigating back/forward.
    */

    window.addEventListener(
        "pageshow",
        () => {

            const enteredFromSeasonals =
                sessionStorage.getItem("occasionEntry");

            if (enteredFromSeasonals === "true") {
                forceTop();
            }

        }
    );

})();