/* =====================================================
   LIWI-KA CART MANAGER (localStorage-backed)
   Shared across all pages (Home, Shop, Seasonals, Cart)
   ===================================================== */

(function (window) {
    'use strict';

    const STORAGE_KEY = 'liwika_cart_items';

    const Cart = {
        getItems() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (err) {
                console.error('Failed to load cart from localStorage:', err);
                return [];
            }
        },

        saveItems(items) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items } }));
            } catch (err) {
                console.error('Failed to save cart to localStorage:', err);
            }
        },

        addItem(item) {
            // Expected item: { id, name, flavour, price (unit price), quantity, image }
            const items = this.getItems();
            const existing = items.find(
                i => i.id === item.id && i.flavour === item.flavour
            );

            if (existing) {
                existing.quantity += item.quantity || 1;
            } else {
                items.push({
                    id: item.id || ('prod_' + Date.now()),
                    name: item.name || 'Artisanal Chocolate',
                    flavour: item.flavour || 'Classic',
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 1,
                    image: item.image || ''
                });
            }

            this.saveItems(items);
        },

        updateQuantity(id, flavour, newQty) {
            let items = this.getItems();
            if (newQty <= 0) {
                this.removeItem(id, flavour);
                return;
            }
            const target = items.find(i => i.id === id && i.flavour === flavour);
            if (target) {
                target.quantity = newQty;
                this.saveItems(items);
            }
        },

        removeItem(id, flavour) {
            let items = this.getItems();
            items = items.filter(i => !(i.id === id && i.flavour === flavour));
            this.saveItems(items);
        },

        getSubtotal() {
            const items = this.getItems();
            return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        getTotalCount() {
            const items = this.getItems();
            return items.reduce((sum, item) => sum + item.quantity, 0);
        },

        clearCart() {
            this.saveItems([]);
        }
    };

    window.LiwikaCart = Cart;

    // Cart Toast helper
    function injectToast() {
        if (document.getElementById('cart-toast')) return;
        const toast = document.createElement('div');
        toast.id = 'cart-toast';
        toast.innerHTML = `
            <div class="cart-toast-icon">✓</div>
            <div class="cart-toast-body">
                <span class="cart-toast-label">Added to cart</span>
                <span class="cart-toast-name" id="cart-toast-name"></span>
            </div>
        `;
        document.body.appendChild(toast);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectToast);
    } else {
        injectToast();
    }

    let toastTimeout = null;
    window.showCartToast = function (productName) {
        injectToast();
        const toast = document.getElementById('cart-toast');
        const nameEl = document.getElementById('cart-toast-name');
        if (!toast || !nameEl) return;

        nameEl.textContent = productName;

        if (toastTimeout) {
            clearTimeout(toastTimeout);
            toastTimeout = null;
        }

        toast.classList.remove('show');
        void toast.offsetHeight;
        toast.classList.add('show');

        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            toastTimeout = null;
        }, 2500);
    };

})(window);
