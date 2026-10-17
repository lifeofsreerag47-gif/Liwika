
/* ==================================
   LIWI-KA — MY ORDERS
   Frontend demo with sample orders
================================== */

// SAMPLE DATA
// Later, these orders will come from your backend/database.

const orders = [
    {
        id: "LK10245",
        date: "12 Oct 2026",
        status: "Out for Delivery",
        expectedDelivery: "14 Oct 2026",
        customer: "Demo Customer",
        address: "Demo delivery address",
        items: [
            {
                name: "Dark Indulgence",
                flavour: "Classic Dark",
                quantity: 2,
                price: 499,
                image: "../images/choco1.jpg"
            },
            {
                name: "Golden Milk",
                flavour: "Caramel Milk",
                quantity: 1,
                price: 699,
                image: "../images/choco2.jpg"
            }
        ],
        delivery: 0,
        timeline: [
            {
                title: "Order Placed",
                date: "12 Oct · 10:30 AM",
                description: "Your order has been received."
            },
            {
                title: "Order Confirmed",
                date: "12 Oct · 10:35 AM",
                description: "Your order has been confirmed."
            },
            {
                title: "Being Prepared",
                date: "13 Oct · 11:00 AM",
                description: "Your chocolates are being prepared."
            },
            {
                title: "Shipped",
                date: "13 Oct · 5:00 PM",
                description: "Your package has been dispatched."
            },
            {
                title: "Out for Delivery",
                date: "14 Oct · 9:00 AM",
                description: "Your package is with the delivery agent."
            },
            {
                title: "Delivered",
                date: "Pending",
                description: "Your package will be marked delivered."
            }
        ]
    },

    {
        id: "LK10218",
        date: "08 Oct 2026",
        status: "Delivered",
        expectedDelivery: "10 Oct 2026",
        customer: "Demo Customer",
        address: "Demo delivery address",
        items: [
            {
                name: "Hazelnut Bliss",
                flavour: "Classic Hazelnut",
                quantity: 1,
                price: 899,
                image: "../images/choco3.jpg"
            }
        ],
        delivery: 0,
        timeline: [
            {
                title: "Order Placed",
                date: "08 Oct · 9:00 AM",
                description: "Your order has been received."
            },
            {
                title: "Order Confirmed",
                date: "08 Oct · 9:10 AM",
                description: "Your order has been confirmed."
            },
            {
                title: "Being Prepared",
                date: "08 Oct · 2:00 PM",
                description: "Your chocolates are being prepared."
            },
            {
                title: "Shipped",
                date: "09 Oct · 8:00 AM",
                description: "Your package has been dispatched."
            },
            {
                title: "Out for Delivery",
                date: "10 Oct · 9:00 AM",
                description: "Your package is with the delivery agent."
            },
            {
                title: "Delivered",
                date: "10 Oct · 1:30 PM",
                description: "Your order has been delivered."
            }
        ]
    },

    {
        id: "LK10192",
        date: "14 Oct 2026",
        status: "Processing",
        expectedDelivery: "17–19 Oct 2026",
        customer: "Demo Customer",
        address: "Demo delivery address",
        items: [
            {
                name: "Golden Milk",
                flavour: "Vanilla Milk",
                quantity: 2,
                price: 699,
                image: "../images/choco2.jpg"
            }
        ],
        delivery: 50,
        timeline: [
            {
                title: "Order Placed",
                date: "14 Oct · 10:00 AM",
                description: "Your order has been received."
            },
            {
                title: "Order Confirmed",
                date: "Pending",
                description: "Waiting for order confirmation."
            },
            {
                title: "Being Prepared",
                date: "Pending",
                description: "Your chocolates will be prepared."
            },
            {
                title: "Shipped",
                date: "Pending",
                description: "Your package will be dispatched."
            },
            {
                title: "Out for Delivery",
                date: "Pending",
                description: "Your package will be handed to the delivery agent."
            },
            {
                title: "Delivered",
                date: "Pending",
                description: "Your package will be marked delivered."
            }
        ]
    },

    {
        id: "LK10176",
        date: "05 Oct 2026",
        status: "Cancelled",
        expectedDelivery: "Not applicable",
        customer: "Demo Customer",
        address: "Demo delivery address",
        items: [
            {
                name: "Dark Indulgence",
                flavour: "Orange Dark",
                quantity: 1,
                price: 499,
                image: "../images/choco1.jpg"
            }
        ],
        delivery: 0,
        timeline: [
            {
                title: "Order Placed",
                date: "05 Oct · 11:00 AM",
                description: "Your order was received."
            },
            {
                title: "Order Cancelled",
                date: "05 Oct · 11:30 AM",
                description: "This sample order has been cancelled."
            }
        ]
    }
];

const ordersList = document.getElementById("ordersList");
const emptyOrders = document.getElementById("emptyOrders");
const orderSearch = document.getElementById("orderSearch");
const statusFilter = document.getElementById("statusFilter");

const trackingModal = document.getElementById("trackingModal");
const closeTracking = document.getElementById("closeTracking");

// Format prices in Indian Rupees.
function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

// Calculate total order value.
function getOrderTotal(order) {
    const itemsTotal = order.items.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);

    return itemsTotal + order.delivery;
}

// Work out the current progress of an order.
function getProgressIndex(order) {
    if (order.status === "Cancelled") {
        return -1;
    }

    const statusIndex = {
        "Processing": 1,
        "Shipped": 3,
        "Out for Delivery": 4,
        "Delivered": 5
    };

    return statusIndex[order.status] ?? 0;
}

// Update the three summary numbers.
function updateSummary() {
    document.getElementById("totalOrders").textContent =
        orders.length;

    document.getElementById("activeOrders").textContent =
        orders.filter(order =>
            ["Processing", "Shipped", "Out for Delivery"]
                .includes(order.status)
        ).length;

    document.getElementById("deliveredOrders").textContent =
        orders.filter(order => order.status === "Delivered").length;
}

// Create an order card.
function createOrderCard(order) {
    const firstItem = order.items[0];
    const totalQuantity = order.items.reduce(
        (sum, item) => sum + item.quantity, 0
    );

    const additionalItems = order.items.length - 1;

    const statusClass = order.status
        .toLowerCase()
        .replaceAll(" ", "-");

    const itemsDescription = order.items.map(item =>
        `${item.name} (${item.flavour}) × ${item.quantity}`
    ).join(", ");

    return `
        <article class="order-card">

            <div class="order-topline">
                <div>
                    <div class="order-number">
                        ORDER #${order.id}
                    </div>
                    <div class="order-date">
                        Placed on ${order.date}
                    </div>
                </div>

                <div class="order-status status-${statusClass}">
                    <span class="status-dot"></span>
                    ${order.status}
                </div>
            </div>

            <div class="order-body">
                <img
                    class="order-product-image"
                    src="${firstItem.image}"
                    alt="${firstItem.name}"
                    onerror="this.style.display='none'"
                >

                <div class="order-product-info">
                    <h3>${firstItem.name}</h3>
                    <p>
                        ${firstItem.flavour}<br>
                        Quantity: ${firstItem.quantity}
                    </p>

                    ${additionalItems > 0 ? `
                        <p class="more-items">
                            + ${additionalItems} more product(s)
                        </p>
                    ` : ""}

                    <p class="more-items">
                        ${totalQuantity} item(s) in this order
                    </p>
                </div>

                <div class="order-total">
                    <span>ORDER TOTAL</span>
                    <strong>${formatPrice(getOrderTotal(order))}</strong>
                </div>
            </div>

            <div class="order-bottom">
                <div class="delivery-summary">
                    ${order.status === "Delivered"
                        ? `<strong>Delivered</strong><br>${order.expectedDelivery}`
                        : order.status === "Cancelled"
                        ? `<strong>Order cancelled</strong>`
                        : `<strong>Expected delivery</strong><br>${order.expectedDelivery}`
                    }
                </div>

                <div class="order-actions">
                    <button
                        type="button"
                        class="outline-button"
                        data-track="${order.id}"
                    >
                        Track Order
                    </button>

                    <button
                        type="button"
                        class="gold-button"
                        data-details="${order.id}"
                    >
                        View Details
                    </button>
                </div>
            </div>

        </article>
    `;
}

// Display orders based on search and selected status.
function renderOrders() {
    const searchText = orderSearch.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredOrders = orders.filter(order => {
        const matchesStatus =
            selectedStatus === "All" ||
            order.status === selectedStatus;

        const searchableText = [
            order.id,
            ...order.items.map(item =>
                `${item.name} ${item.flavour}`
            )
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);

        return matchesStatus && matchesSearch;
    });

    ordersList.innerHTML = filteredOrders
        .map(createOrderCard)
        .join("");

    emptyOrders.hidden = filteredOrders.length > 0;
}

// Open and populate the tracking modal.
function openTracking(orderId) {
    const order = orders.find(item => item.id === orderId);

    if (!order) return;

    document.getElementById("trackingTitle").textContent =
        "Track your order";

    document.getElementById("trackingOrderId").textContent =
        `Order #${order.id}`;

    document.getElementById("trackingStatus").textContent =
        order.status;

    document.getElementById("expectedDelivery").textContent =
        order.expectedDelivery;

    const messages = {
        "Processing": "We've received your order and it is being processed.",
        "Shipped": "Your package has left our facility.",
        "Out for Delivery": "Your package is with the delivery agent.",
        "Delivered": "Your order has reached its destination.",
        "Cancelled": "This order has been cancelled."
    };

    document.getElementById("trackingMessage").textContent =
        messages[order.status];

    const progress = document.getElementById("trackingProgress");

    if (order.status === "Cancelled") {
        progress.innerHTML = `
            <div class="timeline-step completed">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <strong>Order Placed</strong>
                    <p>${order.timeline[0].date}</p>
                </div>
            </div>

            <div class="timeline-step completed">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <strong>Order Cancelled</strong>
                    <p>${order.timeline[1].date}</p>
                    <p>${order.timeline[1].description}</p>
                </div>
            </div>
        `;
    } else {
        const currentIndex = getProgressIndex(order);

        progress.innerHTML = order.timeline.map((step, index) => `
            <div class="timeline-step ${
                index <= currentIndex ? "completed" : ""
            }">
                <div class="timeline-marker"></div>

                <div class="timeline-content">
                    <strong>${step.title}</strong>
                    <p>${step.date}</p>
                    <p>${step.description}</p>
                </div>
            </div>
        `).join("");
    }

    document.getElementById("trackingNote").textContent =
        "Demonstration tracking data only. Actual delivery updates " +
        "will be available when courier tracking is connected.";

    trackingModal.classList.add("is-open");
    trackingModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    closeTracking.focus();
}

// Close the modal.
function closeTrackingModal() {
    trackingModal.classList.remove("is-open");
    trackingModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// Handle clicks on order buttons.
ordersList.addEventListener("click", event => {
    const trackButton = event.target.closest("[data-track]");
    const detailsButton = event.target.closest("[data-details]");

    if (trackButton) {
        openTracking(trackButton.dataset.track);
    }

    if (detailsButton) {
        const order = orders.find(item =>
            item.id === detailsButton.dataset.details
        );

        if (order) {
            const itemLines = order.items.map(item =>
                `${item.name} — ${item.flavour} × ${item.quantity}: ` +
                formatPrice(item.price * item.quantity)
            ).join("\n");

            alert(
                `ORDER #${order.id}\n\n` +
                `${itemLines}\n\n` +
                `Delivery: ${formatPrice(order.delivery)}\n` +
                `Total: ${formatPrice(getOrderTotal(order))}\n` +
                `Status: ${order.status}\n` +
                `Expected delivery: ${order.expectedDelivery}\n\n` +
                `Delivery address: ${order.address}`
            );
        }
    }
});

// Search and status filter.
orderSearch.addEventListener("input", renderOrders);
statusFilter.addEventListener("change", renderOrders);

// Modal close actions.
closeTracking.addEventListener("click", closeTrackingModal);

trackingModal.addEventListener("click", event => {
    if (event.target === trackingModal) {
        closeTrackingModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" &&
        trackingModal.classList.contains("is-open")) {
        closeTrackingModal();
    }
});

// INITIALIZE PAGE.
updateSummary();
renderOrders();
