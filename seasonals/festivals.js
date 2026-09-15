/* =====================================================
   LIWI-KA DYNAMIC FESTIVALS ENGINE
   Loads festival data from JSON / JS fallback, evaluates date ranges,
   renders dynamic cards on seasonals.html, and updates festival page content.
   ===================================================== */

(function (window) {
    'use strict';

    const FESTIVALS_FALLBACK = [
        {
            "id": "makar-sankranti",
            "name": "Makar Sankranti",
            "startMonth": 1,
            "startDay": 8,
            "endMonth": 1,
            "endDay": 17,
            "emoji": "🪁",
            "cardDesc": "Sweet traditional celebrations",
            "heading": "Makar Sankranti",
            "spanHeading": "Sweetness of harvest & traditions.",
            "description": "Celebrate the warmth, joy, and golden harvest festival of togetherness with our handcrafted luxury chocolates.",
            "bgImage": "../images/bg1.jpeg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "ramadan",
            "name": "Ramadan",
            "startMonth": 2,
            "startDay": 8,
            "endMonth": 3,
            "endDay": 9,
            "emoji": "🌙",
            "cardDesc": "Blessed moments & sweet dates",
            "heading": "Ramadan Blessings",
            "spanHeading": "Pure sweetness for holy nights.",
            "description": "Share warmth, gratitude, and decadent artisanal sweets during this blessed holy month.",
            "bgImage": "../images/bg2.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "eid",
            "name": "Eid al-Fitr",
            "startMonth": 3,
            "startDay": 3,
            "endMonth": 3,
            "endDay": 10,
            "emoji": "✨",
            "cardDesc": "Celebrate joyful feasts",
            "heading": "Eid al-Fitr",
            "spanHeading": "Sweetness for cherished gatherings.",
            "description": "Bring joy to your family and friends with our specially curated Eid chocolate collections.",
            "bgImage": "../images/bg3.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "holi",
            "name": "Holi",
            "startMonth": 3,
            "startDay": 16,
            "endMonth": 3,
            "endDay": 23,
            "emoji": "🎨",
            "cardDesc": "Festival of vibrant colors",
            "heading": "Festival of Colors",
            "spanHeading": "Vibrant flavors for joyful celebrations.",
            "description": "Color your celebrations with luscious, colorful chocolate creations made for sharing.",
            "bgImage": "../images/bg4.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "easter",
            "name": "Easter",
            "startMonth": 3,
            "startDay": 22,
            "endMonth": 3,
            "endDay": 29,
            "emoji": "🐰",
            "cardDesc": "Springtime sweet treats",
            "heading": "Happy Easter",
            "spanHeading": "Delightful treats for springtime joy.",
            "description": "Hop into sweetness with our artisan chocolate eggs and handcrafted holiday treats.",
            "bgImage": "../images/bg5.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "raksha-bandhan",
            "name": "Raksha Bandhan",
            "startMonth": 8,
            "startDay": 11,
            "endMonth": 8,
            "endDay": 18,
            "emoji": "🎀",
            "cardDesc": "Bond of love & sweetness",
            "heading": "Raksha Bandhan",
            "spanHeading": "A bond of love sealed with chocolate.",
            "description": "Celebrate the eternal bond between siblings with elegant chocolate gift boxes.",
            "bgImage": "../images/bg1.jpeg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "janmashtami",
            "name": "Janmashtami",
            "startMonth": 8,
            "startDay": 19,
            "endMonth": 8,
            "endDay": 26,
            "emoji": "🪈",
            "cardDesc": "Divine sweet offerings",
            "heading": "Janmashtami Sweetness",
            "spanHeading": "Pure butter & cocoa bliss.",
            "description": "Honor the divine celebration with rich, handcrafted chocolate offerings crafted with love.",
            "bgImage": "../images/bg2.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "ganesh-chaturthi",
            "name": "Ganesh Chaturthi",
            "startMonth": 8,
            "startDay": 29,
            "endMonth": 9,
            "endDay": 6,
            "emoji": "🐘",
            "cardDesc": "Auspicious festive sweetness",
            "heading": "Ganesh Chaturthi Special",
            "spanHeading": "Sweet blessings for new beginnings.",
            "description": "Welcome Lord Ganesha with opulent chocolate creations and festive treats.",
            "bgImage": "../images/bg3.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "onam",
            "name": "Onam",
            "startMonth": 9,
            "startDay": 6,
            "endMonth": 9,
            "endDay": 13,
            "emoji": "🌸",
            "cardDesc": "Grand harvest festivities",
            "heading": "Happy Onam",
            "spanHeading": "Golden moments of sweet harvest.",
            "description": "Celebrate the grand harvest festival of Kerala with artisanal, golden chocolate delicacies.",
            "bgImage": "../images/bg4.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "navratri",
            "name": "Navratri / Dussehra",
            "startMonth": 9,
            "startDay": 30,
            "endMonth": 10,
            "endDay": 10,
            "emoji": "🪔",
            "cardDesc": "Nine nights of celebration",
            "heading": "Navratri & Dussehra",
            "spanHeading": "Celebrate victory with sweet joy.",
            "description": "Embrace nine divine nights of festivities and triumph with luxurious chocolate gifts.",
            "bgImage": "../images/bg5.jpg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "diwali",
            "name": "Diwali",
            "startMonth": 10,
            "startDay": 22,
            "endMonth": 10,
            "endDay": 31,
            "emoji": "🎆",
            "cardDesc": "Festival of lights & joy",
            "heading": "Diwali Lights & Sweetness",
            "spanHeading": "Illuminate your moments with chocolate.",
            "description": "Brighten your festival of lights with handcrafted artisanal chocolate boxes and luxury hampers.",
            "bgImage": "../images/bg1.jpeg",
            "badge": "SEASONAL FESTIVAL"
        },
        {
            "id": "christmas",
            "name": "Christmas",
            "startMonth": 12,
            "startDay": 18,
            "endMonth": 12,
            "endDay": 25,
            "emoji": "🎄",
            "cardDesc": "A little Christmas sweetness",
            "heading": "Christmas Joy",
            "spanHeading": "Unwrap the magic of the season.",
            "description": "Celebrate the season of giving with festive holiday flavors and handcrafted cocoa creations.",
            "bgImage": "../images/bg2.jpg",
            "badge": "SEASONAL FESTIVAL"
        }
    ];

    function isDateInFestival(month, day, fest) {
        const currentVal = month * 100 + day;
        const startVal = fest.startMonth * 100 + fest.startDay;
        const endVal = fest.endMonth * 100 + fest.endDay;

        if (startVal <= endVal) {
            return currentVal >= startVal && currentVal <= endVal;
        } else {
            // Wraps over year end
            return currentVal >= startVal || currentVal <= endVal;
        }
    }

    async function loadFestivals() {
        try {
            const path = window.location.pathname.includes('/occassions/') ? '../festivals.json' : './festivals.json';
            const res = await fetch(path);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            // Fallback for static file:// execution
        }
        return FESTIVALS_FALLBACK;
    }

    function getActiveFestivalsList(festivals, date) {
        const urlParams = new URLSearchParams(window.location.search);
        const festivalParam = urlParams.get('festival');
        
        // Check if URL specifies a test date like ?date=12-20
        const dateParam = urlParams.get('date');
        let m = date.getMonth() + 1;
        let d = date.getDate();
        
        if (dateParam && dateParam.includes('-')) {
            const parts = dateParam.split('-');
            m = parseInt(parts[0], 10);
            d = parseInt(parts[1], 10);
        }

        if (festivalParam) {
            const specified = festivals.find(f => f.id === festivalParam);
            if (specified) return [specified];
        }

        const active = festivals.filter(f => isDateInFestival(m, d, f));
        if (active.length > 0) return active;

        // If no festival is strictly active today, find the next upcoming festival
        const currentVal = m * 100 + d;
        let upcoming = festivals.find(f => (f.startMonth * 100 + f.startDay) >= currentVal);
        if (!upcoming) upcoming = festivals[0]; // Loop around to first festival of year

        upcoming = Object.assign({}, upcoming, { isUpcoming: true });
        return [upcoming];
    }

    async function initSeasonalsGrid() {
        const container = document.getElementById("dynamicFestivalContainer") || document.querySelector(".occasion-grid");
        if (!container || !window.location.pathname.includes("seasonals.html")) return;

        const festivals = await loadFestivals();
        const now = new Date();
        const activeFestivals = getActiveFestivalsList(festivals, now);

        // Remove any old Christmas or static seasonal festival cards
        const existingDynamic = container.querySelectorAll(".dynamic-festival-card");
        existingDynamic.forEach(el => el.remove());

        activeFestivals.forEach(fest => {
            const card = document.createElement("a");
            card.href = `occassions/christmas.html?festival=${fest.id}`;
            card.className = "occasion-card dynamic-festival-card";

            const badgeText = fest.isUpcoming ? `UPCOMING FESTIVAL` : `ACTIVE FESTIVAL`;

            card.innerHTML = `
                <div class="occasion-icon">${fest.emoji}</div>
                <h2>${fest.name.toUpperCase()}</h2>
                <p>${fest.cardDesc}</p>
                <span class="festival-card-badge" style="font-size: 10px; color: #d9a441; margin-top: 6px; letter-spacing: 1px; display: inline-block;">✦ ${badgeText}</span>
            `;

            // Insert as the first card or grid element
            container.insertBefore(card, container.firstElementChild);
        });
    }

    async function initFestivalPage() {
        if (!window.location.pathname.includes("christmas.html")) return;

        const festivals = await loadFestivals();
        const activeFestivals = getActiveFestivalsList(festivals, new Date());
        const fest = activeFestivals[0] || festivals[0];

        window.occasionTitle = fest.name;
        document.title = `Liwi-Ka | ${fest.name}`;

        const labelEl = document.querySelector(".occasion-label");
        if (labelEl) labelEl.textContent = fest.name.toUpperCase();

        const headingEl = document.querySelector(".occasion-hero h1");
        if (headingEl) {
            headingEl.innerHTML = `${fest.heading} <span>${fest.spanHeading}</span>`;
        }

        const introEl = document.querySelector(".occasion-intro");
        if (introEl) introEl.textContent = fest.description;

        const bgImgEl = document.querySelector(".occasion-hero-background");
        if (bgImgEl && fest.bgImage) {
            bgImgEl.src = fest.bgImage;
            bgImgEl.alt = fest.name;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initSeasonalsGrid();
        initFestivalPage();
    });

})(window);
