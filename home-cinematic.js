/* =========================================================================
   LIWI-KA — HOME PAGE ONLY: CINEMATIC SCROLL SEQUENCE
   Loaded only by index.html. Pure scroll-linked animation (no library):
     - one tall track (.cine) + one sticky stage (.cine-stage)
     - normal browser scrolling is never hijacked; scroll position -> timeline
     - only transform / opacity / filter / translate are animated
   Scenes: hero -> zoom into the "l" of "Indulge" -> white -> collection
           -> black -> bestsellers -> heritage.
   ========================================================================= */
(function () {
    "use strict";

    var root = document.documentElement;

    /* ---- Bestseller names: product-ui.js builds the on-card label by joining
       the two <span> words ("DarkIndulgence"). On the HOME page only, rebuild
       that label so each word sits on its own line ("Dark" / "Indulgence"). ---- */
    (function wrapBestsellerNames() {
        function run() {
            var cards = document.querySelectorAll(".cine-bests .product-card");
            var pending = 0;
            Array.prototype.forEach.call(cards, function (card) {
                var label = card.querySelector(".card-corner-name");
                var words = card.querySelectorAll(".product-info h3 span");
                if (!label) { pending++; return; }
                if (label.__wrapped || !words.length) return;
                label.__wrapped = true;
                label.textContent = "";
                Array.prototype.forEach.call(words, function (w, i) {
                    if (i) label.appendChild(document.createElement("br"));
                    label.appendChild(document.createTextNode(w.textContent.trim()));
                });
            });
            return pending;
        }
        if (run() === 0) return;
        var mo = new MutationObserver(function () { if (run() === 0) mo.disconnect(); });
        mo.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { mo.disconnect(); run(); }, 4000);
    })();
    var cine = document.getElementById("homeCine");
    if (!cine || !root.classList.contains("cine-on")) {
        initStoryReveal();            /* still safe: reveal does nothing without cine-on */
        return;
    }

    /* ========================================================================
       LIWI-KA HERO ZOOM TARGET
       Adjust these values to fine-tune the camera target for the "l" in
       "Indulge" (the 5th letter of the word).

       The script MEASURES the real position of the "l" in the rendered text
       (so it stays correct on every screen size). x / y below are NUDGES added
       on top of that measured position, in HALF-SCREEN units:

           x:  0 = exactly on the "l"
               +1 = move the target one half-screen-width to the RIGHT
               -1 = move the target one half-screen-width to the LEFT
               (so +0.10 moves it right by 5% of the screen width)

           y:  0 = exactly on the "l"
               +1 = move the target one half-screen-height UP
               -1 = move the target one half-screen-height DOWN
               (so +0.10 moves it up by 5% of the screen height)

       If you ever want to ignore the measurement and aim at a fixed spot,
       set autoDetect to false. Then x / y become ABSOLUTE screen coordinates:
           x: -1 = far left,   0 = center, +1 = far right
           y: -1 = bottom,     0 = center, +1 = top
       ======================================================================== */
    var HERO_ZOOM_TARGET = {
        autoDetect: true,
        desktop: { x: 0.00, y: 0.00 },
        mobile:  { x: 0.00, y: 0.00 }
    };

    /* How far the camera travels in (final scale). Higher = deeper dive. */
    var HERO_ZOOM_DEPTH = { desktop: 230, mobile: 190 };

    /* ---------------------------------------------------------------------- */

    var mqMobile = window.matchMedia("(max-width: 900px)");
    var stage = cine.querySelector(".cine-stage");
    var hero = cine.querySelector(".hero");
    var camera = cine.querySelector(".cine-camera");
    var video = cine.querySelector(".hero-video");
    var h1 = cine.querySelector(".hero-content h1");
    var heroGoldText = h1 ? h1.querySelector("span") : null;
    var heroFadeEls = Array.prototype.slice.call(cine.querySelectorAll(
        ".hero-content .small-heading, .hero-content .hero-description, .hero-content .shop-button, .hero .scroll-indicator"));
    var heroContent = cine.querySelector(".hero-content");
    var bloom = cine.querySelector(".cine-bloom");
    var veilLight = cine.querySelector(".cine-veil-light");
    var veilDark = cine.querySelector(".cine-veil-dark");
    var collection = cine.querySelector(".cine-collection");
    var bestsEl = cine.querySelector(".cine-bests");
    var heritageEl = cine.querySelector(".cine-heritage");
    if (!stage || !hero || !camera || !h1 || !collection || !bestsEl || !heritageEl) return;

    /* ---------- tiny math helpers ---------- */
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function seg(t, a, b) { return b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
    function lerp(a, b, p) { return a + (b - a) * p; }
    function smooth(p) { return p * p * (3 - 2 * p); }
    function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
    function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    function easeSine(p) { return -(Math.cos(Math.PI * p) - 1) / 2; }

    /* write a style value only when it changed (keeps frames cheap) */
    function put(el, prop, val) {
        var c = el.__cs || (el.__cs = {});
        if (c[prop] !== val) {
            c[prop] = val;
            if (prop.charAt(0) === "-") el.style.setProperty(prop, val);
            else el.style[prop] = val;
        }
    }
    function fx(el, op, blur, y) {
        if (op <= 0.003) { put(el, "visibility", "hidden"); put(el, "opacity", "0"); }
        else {
            put(el, "visibility", "");
            put(el, "opacity", op >= 0.999 ? "" : op.toFixed(3));
        }
        put(el, "filter", blur > 0.15 ? "blur(" + blur.toFixed(1) + "px)" : "");
        put(el, "translate", Math.abs(y) > 0.3 ? "0 " + y.toFixed(1) + "px" : "");
    }
    function offTop(el, stopAt) {          /* layout offset, ignores transforms */
        var y = 0;
        while (el && el !== stopAt) { y += el.offsetTop; el = el.offsetParent; }
        return y;
    }

    /* ---------- state ---------- */
    var W = 0, H = 0, mobile = false;
    var T = null;                           /* timeline (units: viewport heights of scroll) */
    var L = { x: 0, y: 0 };                 /* camera target (px, inside the stage) */
    var smax = 60;
    var cur = 0, target = 0, rafId = 0, lastTs = 0;
    var cineTopDoc = 0;
    var scenes = { bests: null, heritage: null };

    /* =====================================================================
       MEASURE THE "l"
       ===================================================================== */
    function measureL() {
        var node = null, i;
        for (i = 0; i < h1.childNodes.length; i++) {
            var n = h1.childNodes[i];
            if (n.nodeType === 3 && n.data.indexOf("Indulge") !== -1) { node = n; break; }
        }
        var prev = camera.style.transform;
        camera.style.transform = "none";
        var cam = camera.getBoundingClientRect();
        var cx = W / 2, cy = H / 2;
        var autoOk = false;
        var measuredW = 0, measuredH = 0, inkW = 0, inkH = 0;
        if (node && HERO_ZOOM_TARGET.autoDetect) {
            var idx = node.data.indexOf("Indulge") + 4;          /* I-n-d-u-[l]-g-e */
            var range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + 1);
            var r = range.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                var inkX = r.left + r.width / 2, inkY = r.top + r.height / 2;
                try {
                    var cs = getComputedStyle(h1);
                    var ctx = document.createElement("canvas").getContext("2d");
                    ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
                    var m = ctx.measureText("l");
                    if (m.fontBoundingBoxAscent !== undefined && m.actualBoundingBoxAscent !== undefined) {
                        var baseline = r.top + m.fontBoundingBoxAscent;
                        inkY = baseline - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
                        inkX = r.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
                        inkW = m.actualBoundingBoxRight + m.actualBoundingBoxLeft;
                        inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
                    }
                } catch (e) { /* keep rect centre */ }
                /* The hero text slides in with a CSS animation (translateY).
                   If we measure mid-animation the target is off by that
                   amount (this made the camera land at the bottom of the
                   \"l\"). Subtract the animation's current offset. */
                var animX = 0, animY = 0;
                try {
                    var mt = new DOMMatrix(getComputedStyle(heroContent || h1).transform);
                    animX = mt.m41; animY = mt.m42;
                } catch (e2) {}
                L.x = inkX - animX - cam.left;
                L.y = inkY - animY - cam.top;
                measuredW = Math.max(1, r.width);
                measuredH = Math.max(1, r.height);
                autoOk = true;
            }
        }
        camera.style.transform = prev;

        var cfg = mobile ? HERO_ZOOM_TARGET.mobile : HERO_ZOOM_TARGET.desktop;
        if (autoOk) {
            L.x += cfg.x * (W / 2);
            L.y -= cfg.y * (H / 2);
        } else {
            L.x = cx + cfg.x * (W / 2);
            L.y = cy - cfg.y * (H / 2);
        }
        L.x = clamp(L.x, 0, W);
        L.y = clamp(L.y, 0, H);
        L.w = measuredW;
        L.h = measuredH;
        L.iw = inkW > 1 ? inkW : measuredW * 0.8;     /* real glyph ink size */
        L.ih = inkH > 1 ? inkH : measuredH * 0.5;
    }

    /* =====================================================================
       LAYOUT + TIMELINE
       ===================================================================== */
    function measureScene(el, kind) {
        var head = el.querySelector(".cine-head");
        var wrap = el.querySelector(".cine-items-wrap");
        var rail = el.querySelector(".cine-rail");
        var grid = el.querySelector(".cine-items");
        var small = head.querySelector(".small-heading");
        var h2 = head.querySelector("h2");
        var desc = head.querySelector(".section-description");
        var tail = el.querySelector(".cine-tail");

        /* clear dynamic transforms so offsets are pure layout */
        head.style.transform = "";
        var s = { el: el, kind: kind, head: head, wrap: wrap, rail: rail, grid: grid, desc: desc, tail: tail, cfg: null };

        var lineTop = head.offsetTop + small.offsetTop;
        var lineBottom = head.offsetTop + h2.offsetTop + h2.offsetHeight;
        s.dyCenter = H / 2 - (lineTop + lineBottom) / 2;
        s.headBottom = head.offsetTop + head.offsetHeight;
        s.cards = Array.prototype.slice.call(grid.children);
        s.fxEls = s.cards.concat(tail ? [tail] : []);
        return s;
    }

    /* Desktop: if heading + items + link do not fit the stage, scale the item
       grid uniformly (shape of every card is preserved). */
    function fitZoom(s) {
        s.el.style.setProperty("--cine-zoom", "1");
        s.rail.style.transform = "none";
        s.fxEls.forEach(function (el) {
            el.style.translate = ""; el.style.filter = ""; el.style.opacity = ""; el.style.visibility = "";
            el.__cs = null;
        });
        var wasLive = s.el.classList.contains("is-live");
        s.el.style.visibility = "hidden";                        /* measure without flashing */
        s.el.classList.add("is-live");
        s.head.style.transform = "none";
        var stageTop = stage.getBoundingClientRect().top;
        var g = s.grid.getBoundingClientRect(), r = s.rail.getBoundingClientRect();
        var gridTop = g.top - stageTop, gh = g.height;
        var extra = r.height - gh;
        var z = (H - 22 - gridTop - extra) / gh;
        z = clamp(z, 0.42, 1);
        s.el.style.setProperty("--cine-zoom", z.toFixed(4));
        s.el.style.visibility = "";
        if (!wasLive) s.el.classList.remove("is-live");
        s.zoom = z;
    }

    function layout() {
        mobile = mqMobile.matches;
        W = stage.clientWidth;
        H = stage.clientHeight;
        if (H < 100 || W < 100) { T = null; return; }   /* hidden (phone app-shell outer document) */
        [bestsEl, heritageEl].forEach(function (el) { el.style.removeProperty("--cine-zoom"); });
        scenes.bests = measureScene(bestsEl, "bests");
        scenes.heritage = measureScene(heritageEl, "heritage");

        var b = scenes.bests, h = scenes.heritage, d;

        if (mobile) {
            [b, h].forEach(function (s) {
                s.el.style.setProperty("--cine-wrap-top", Math.round(s.headBottom + 4) + "px");
            });
            [b, h].forEach(function (s) {
                s.vpH = s.wrap.clientHeight;
                s.railH = s.rail.offsetHeight;
                s.cardOff = s.fxEls.map(function (c) { return offTop(c, s.rail); });
                s.cardH = s.fxEls.map(function (c) { return c.offsetHeight; });
            });
        } else {
            b.el.style.removeProperty("--cine-wrap-top");
            h.el.style.removeProperty("--cine-wrap-top");
            fitZoom(b);
            fitZoom(h);
        }

        /* ---------- timeline ---------- */
        var t = {};
        if (!mobile) {
            t.heroFade = [0, 30];
            t.zoom = [30, 120];
            t.colIn = [125, 143];
            t.colMove = [172, 212];
            t.dark = [200, 240];
            b.cfg = { liveA: 234, liveB: 462, inA: 236, inB: 258, moveA: 282, moveB: 316,
                      itemsA: 312, itemsDur: 36, stag: 9, exA: 418, exDur: 34, exStag: 3,
                      headExA: 428, headExB: 456, rail: false };
            h.cfg = { liveA: 446, liveB: Infinity, inA: 448, inB: 472, moveA: 498, moveB: 532,
                      itemsA: 528, itemsDur: 36, stag: 9, exA: 1e9, exDur: 1, exStag: 0,
                      headExA: 1e9, headExB: 1e9 + 1, rail: false };
            t.end = 630;
        } else {
            t.heroFade = [0, 26];
            t.zoom = [26, 104];
            t.colIn = [109, 126];
            t.colMove = [150, 184];
            t.dark = [172, 210];
            var K = 0.85;                                           /* vh of scroll per vh of card travel */
            var Rb = ((b.vpH + b.railH) / H) * 100 * K;
            b.cfg = { liveA: 204, liveB: 0, inA: 206, inB: 226, moveA: 244, moveB: 272,
                      railA: 268, railB: 268 + Rb, rail: true, exit: true,
                      headExA: 268 + Rb - 26, headExB: 268 + Rb };
            b.cfg.liveB = b.cfg.railB + 14;
            var hIn0 = b.cfg.railB - 12;
            var hMove0 = hIn0 + 12 + 22;
            var yEnd = Math.min(0, h.vpH - h.railH);
            var Rh = ((h.vpH - yEnd) / H) * 100 * K;
            h.cfg = { liveA: hIn0 - 2, liveB: Infinity, inA: hIn0, inB: hIn0 + 24,
                      moveA: hMove0, moveB: hMove0 + 30,
                      railA: hMove0 + 22, railB: hMove0 + 22 + Rh, rail: true, exit: false,
                      headExA: 1e9, headExB: 1e9 + 1 };
            t.end = h.cfg.railB + 26;
        }
        T = t;

        /* track height: stage + scroll distance */
        var px = Math.round(H + (T.end / 100) * H);
        cine.style.setProperty("--cine-track", px + "px");
        cineTopDoc = cine.getBoundingClientRect().top + window.pageYOffset;

        /* light colour = the real colour of the hero "Indulge" text */
        var light = getComputedStyle(h1).color;
        cine.style.setProperty("--cine-light", light);
        cine.__light = parseRGB(light);
        cine.__dark = parseRGB("rgb(8,7,6)");

        /* Measure first, then choose a scale that lets the actual glyph
           become larger than the viewport before the final white takeover. */
        measureL();
        var baseZoom = mobile ? HERO_ZOOM_DEPTH.mobile : HERO_ZOOM_DEPTH.desktop;
        var coverZoom = Math.max(W / Math.max(1, L.iw), H / Math.max(1, L.ih)) * 1.6;
        smax = Math.max(baseZoom, Math.min(520, coverZoom));
        invalidate();
    }

    function parseRGB(str) {
        var m = /rgba?\(([^)]+)\)/.exec(str);
        if (!m) return [255, 255, 255];
        var p = m[1].split(",").map(parseFloat);
        return [p[0], p[1], p[2]];
    }

    /* =====================================================================
       RENDER (t = scroll position inside the track, in viewport heights)
       ===================================================================== */
    var heroHidden = false;
    var videoPausedByZoom = false;

    function renderHero(t) {
        var fade = seg(t, T.heroFade[0], T.heroFade[1]);
        var op = 1 - easeSine(fade);
        for (var i = 0; i < heroFadeEls.length; i++) fx(heroFadeEls[i], op, 0, 0);

        var zp = seg(t, T.zoom[0], T.zoom[1]);
        /* While diving, switch off the effects that get re-drawn at huge size
           every frame (blurred text-shadow + drop-shadow filter). Text itself
           stays 100% live vector text, so sharpness is unchanged. */
        var zooming = zp > 0;
        if (zooming !== cine.__zooming) { cine.__zooming = zooming; cine.classList.toggle("is-zooming", zooming); }
        if (zp <= 0) {
            put(camera, "transform", "");
        } else {
            var ez = easeSine(zp);
            var s = Math.exp(Math.log(smax) * ez);
            var cx = W / 2, cy = H / 2;
            /* Let the camera finish exactly on the measured "l". The old
               coverage clamp intentionally stopped short, which is why the
               final frame landed near the letter instead of inside it. */
            var f = 1 - Math.pow(1 - ez, 3);
            var Fx = cx + f * (L.x - cx);
            var Fy = cy + f * (L.y - cy);
            var tx = cx - s * Fx, ty = cy - s * Fy;
            put(camera, "transform", "translate(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px) scale(" + s.toFixed(4) + ")");
        }

        /* Keep the gold "Something Extraordinary." text visible through most
           of the dive. It only fades when the camera is already fairly close
           to the final target, avoiding an early visual disappearance. */
        if (heroGoldText) {
            var goldFade = smooth(seg(zp, mobile ? 0.76 : 0.78, mobile ? 0.91 : 0.92));
            put(heroGoldText, "opacity", (1 - goldFade).toFixed(3));
            if (goldFade >= 1) put(heroGoldText, "visibility", "hidden");
            else put(heroGoldText, "visibility", "");
        }

        /* Performance: the video is only touched AFTER every hero text has
           finished fading (t >= T.heroFade[1], which is where the zoom starts).
           Then the video fades out, and once invisible it is paused and removed
           from rendering. Scrolling back up shows it again, fades it in and
           resumes from the exact moment it was paused. */
        if (video) {
            var vFade = smooth(seg(t, T.heroFade[1], T.heroFade[1] + (mobile ? 8 : 10)));
            var vGone = vFade >= 1;
            if (vGone !== videoPausedByZoom) {
                videoPausedByZoom = vGone;
                if (vGone) {
                    try { video.pause(); } catch (e) {}
                    put(video, "display", "none");
                } else {
                    put(video, "display", "");
                    try { var vpr = video.play(); if (vpr && vpr.catch) vpr.catch(function () {}); } catch (e) {}
                }
            }
            if (!vGone) put(video, "opacity", (1 - vFade).toFixed(3));
        }

        /* No bloom/flash. Only the final instant, once the "l" is already
           enormous, lifts the last visible pixels to a clean white screen. */
        put(veilLight, "opacity", smooth(seg(zp, 0.90, 0.965)).toFixed(3));

        /* once fully white, stop painting / decoding the hero */
        var shouldHide = t > T.zoom[1] + 4;
        if (shouldHide !== heroHidden) {
            heroHidden = shouldHide;
            put(hero, "visibility", shouldHide ? "hidden" : "");
        }
    }
    function fmax(S, Lc, s) {            /* keeps the scaled scene covering the whole stage */
        var d = Math.abs(Lc - S / 2);
        if (d < 1e-3) return 1;
        return (S / 2) * (1 - 1 / s) / d * 0.995;
    }

    function renderCollection(t) {
        var inP = easeOut(seg(t, T.colIn[0], T.colIn[1]));
        var mv = easeInOut(seg(t, T.colMove[0], T.colMove[1]));
        var fadeOut = smooth(seg(t, lerp(T.colMove[0], T.colMove[1], 0.35), T.colMove[1]));
        var live = t >= T.colIn[0] - 2 && t <= T.colMove[1] + 2;
        toggleLive(collection, live);
        if (!live) return;
        var y = lerp(25, 0, inP) - mv * H * 0.3;
        put(collection, "opacity", (inP * (1 - fadeOut)).toFixed(3));
        put(collection, "transform", "translate3d(0," + y.toFixed(1) + "px,0)");
    }

    function renderDark(t) {
        var p = easeInOut(seg(t, T.dark[0], T.dark[1]));
        put(veilDark, "opacity", p >= 0.999 ? "1" : p.toFixed(3));
        /* background colour behind the stage (fills the phone svh/lvh gap) */
        var rgb = cine.__light, d = cine.__dark;
        var base = t < T.zoom[1] ? 0 : 1;                    /* 0 = hero dark, 1 = white */
        var bgp = t < T.zoom[0] ? 0 : (t < T.zoom[1] ? seg(t, lerp(T.zoom[0], T.zoom[1], 0.7), T.zoom[1]) : 1 - p);
        var a = t < T.zoom[1] ? [5, 5, 5] : rgb;
        var b2 = t < T.zoom[1] ? rgb : d;
        var k = t < T.zoom[1] ? bgp : p;
        var col = "rgb(" + Math.round(lerp(a[0], b2[0], k)) + "," + Math.round(lerp(a[1], b2[1], k)) + "," + Math.round(lerp(a[2], b2[2], k)) + ")";
        void base;
        put(cine, "--cine-bg", col);
    }

    function toggleLive(el, on) {
        if (el.__live !== on) { el.__live = on; el.classList.toggle("is-live", on); }
    }

    function renderScene(s, t) {
        var c = s.cfg;
        var live = t >= c.liveA && t <= c.liveB;
        toggleLive(s.el, live);
        if (!live) return;

        /* ----- heading group ----- */
        var pin = easeOut(seg(t, c.inA, c.inB));
        var mv = easeInOut(seg(t, c.moveA, c.moveB));
        var settle = smooth(seg(t, c.moveB, c.moveB + 18));
        var ex = smooth(seg(t, c.headExA, c.headExB));
        var op = pin * (1 - 0.22 * settle) * (1 - ex);
        var y = s.dyCenter * (1 - mv) + 32 * (1 - pin) - 40 * ex;
        var sc = 0.96 + 0.04 * pin;
        var blur = 8 * ex + 6 * (1 - pin);
        put(s.head, "opacity", op <= 0.003 ? "0" : (op >= 0.999 ? "" : op.toFixed(3)));
        put(s.head, "visibility", op <= 0.003 ? "hidden" : "");
        put(s.head, "transform", "translate3d(0," + y.toFixed(1) + "px,0) scale(" + sc.toFixed(4) + ")");
        put(s.head, "filter", blur > 0.15 ? "blur(" + blur.toFixed(1) + "px)" : "");
        if (s.desc) {
            var dop = smooth(seg(t, lerp(c.moveA, c.moveB, 0.45), c.moveB));
            put(s.desc, "opacity", dop >= 0.999 ? "" : dop.toFixed(3));
        }

        /* ----- items ----- */
        var i, e;
        if (!c.rail) {
            for (i = 0; i < s.fxEls.length; i++) {
                var a = c.itemsA + i * c.stag;
                e = easeOut(seg(t, a, a + c.itemsDur));
                var xo = smooth(seg(t, c.exA + i * c.exStag, c.exA + i * c.exStag + c.exDur));
                fx(s.fxEls[i], e * (1 - xo), 12 * (1 - e) + 8 * xo, 80 * (1 - e) - 50 * xo);
            }
        } else {
            var p = seg(t, c.railA, c.railB);
            var yEnd = c.exit ? -s.railH : Math.min(0, s.vpH - s.railH);
            var ry = lerp(s.vpH, yEnd, p);
            put(s.rail, "transform", "translate3d(0," + ry.toFixed(1) + "px,0)");
            for (i = 0; i < s.fxEls.length; i++) {
                var top = ry + s.cardOff[i], bottom = top + s.cardH[i];
                var enter = easeOut(seg(1 - top / s.vpH, 0.02, 0.34));
                var leave = c.exit ? smooth(seg(0.5 - bottom / s.vpH, 0, 0.42)) : 0;
                fx(s.fxEls[i], enter * (1 - leave), 12 * (1 - enter) + 8 * leave, 50 * (1 - enter) - 30 * leave);
            }
        }
    }

    function render(t) {
        renderHero(t);
        renderCollection(t);
        renderDark(t);
        renderScene(scenes.bests, t);
        renderScene(scenes.heritage, t);
    }

    /* =====================================================================
       SCROLL -> TIMELINE (with a light glide so wheel steps feel luxurious)
       ===================================================================== */
    function readTarget() {
        var top = cine.getBoundingClientRect().top;          /* negative while scrolled in */
        target = clamp((-top / H) * 100, 0, T.end);
    }
    function invalidate() {
        if (!rafId) { lastTs = 0; rafId = requestAnimationFrame(tick); }
    }
    var first = true;
    function tick(ts) {
        rafId = 0;
        if (!T) return;
        readTarget();
        var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
        lastTs = ts;
        if (first) { cur = target; first = false; }
        var diff = target - cur;
        if (Math.abs(diff) < 0.02) cur = target;
        else cur += diff * (1 - Math.exp(-dt * 11));
        render(cur);
        if (cur !== target) rafId = requestAnimationFrame(tick);
    }
    window.addEventListener("scroll", invalidate, { passive: true });

    var resizeTimer = 0, lastW = 0, lastH = 0;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            var w = stage.clientWidth, h = stage.clientHeight;
            if (w === lastW && h === lastH && mobile === mqMobile.matches) return;
            lastW = w; lastH = h;
            first = true;
            layout();
        }, 120);
    }
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });

    if (heroContent) heroContent.addEventListener("animationend", function () { if (T) { first = true; layout(); } });

    function boot() {
        lastW = stage.clientWidth; lastH = stage.clientHeight;
        layout();
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { boot(); });
    }
    if (document.readyState === "complete") boot();
    else window.addEventListener("load", boot);
    boot();

    /* "Our Story" links jump to the end of the heritage scene */
    document.addEventListener("click", function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href="#our-story"], a[href="#our story"]') : null;
        if (!a || !T) return;
        ev.preventDefault();
        ev.stopPropagation();
        window.scrollTo({ top: cineTopDoc + (T.end / 100) * H, behavior: "smooth" });
    }, true);

    /* debug / test hook (read-only) */
    window.LiwikaHomeCinematic = {
        state: function () { return { t: cur, target: target, end: T && T.end, H: H, W: W, mobile: mobile, L: { x: L.x, y: L.y }, T: T, smax: smax }; }
    };

    initStoryReveal();

    /* =====================================================================
       Story blocks that stay in normal flow after the pinned sequence
       ===================================================================== */
    function initStoryReveal() {
        if (!root.classList.contains("cine-on")) return;
        var targets = [];
        function add(sel, stagger) {
            var nodes = document.querySelectorAll(sel);
            for (var i = 0; i < nodes.length; i++) targets.push([nodes[i], stagger ? i * 0.12 : 0]);
        }
        add(".our-story .story-image-frame", false);
        add(".our-story .story-quote-card", false);
        add(".our-story .story-chapter", true);
        add(".our-story .story-stats-row", false);
        add(".our-story .story-cta-banner", false);
        if (!targets.length) return;

        function done(el) {
            el.classList.remove("cine-rv", "is-in");
            el.style.removeProperty("--rv-d");
        }
        if (!("IntersectionObserver" in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting || en.boundingClientRect.top < 0) {
                    var el = en.target;
                    io.unobserve(el);
                    el.classList.add("is-in");
                    var fin = function (e) {
                        if (e.target !== el || e.propertyName !== "translate") return;
                        el.removeEventListener("transitionend", fin);
                        done(el);
                    };
                    el.addEventListener("transitionend", fin);
                    setTimeout(function () { if (el.classList.contains("cine-rv")) done(el); }, 2600);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
        targets.forEach(function (pair) {
            pair[0].classList.add("cine-rv");
            pair[0].style.setProperty("--rv-d", pair[1] + "s");
            io.observe(pair[0]);
        });
    }
})();
