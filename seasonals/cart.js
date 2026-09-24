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

        saveItems(items, addedItem) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items, item: addedItem || null } }));
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'LIWIKA_CART_UPDATED', item: addedItem || null }, '*');
                }
            } catch (err) {
                console.error('Failed to save cart to localStorage:', err);
            }
        },

        addItem(item) {
            // Expected item: { id, name, flavour, price (unit price), quantity, image, occasion, isGiftWrapped, giftMessage }
            const items = this.getItems();
            const existing = items.find(
                i => i.id === item.id && i.flavour === item.flavour && (i.occasion || '') === (item.occasion || '')
            );

            if (existing) {
                existing.quantity += item.quantity || 1;
                if (item.isGiftWrapped !== undefined) existing.isGiftWrapped = Boolean(item.isGiftWrapped);
                if (item.giftMessage !== undefined) existing.giftMessage = item.giftMessage;
            } else {
                items.push({
                    id: item.id || ('prod_' + Date.now()),
                    name: item.name || 'Artisanal Chocolate',
                    flavour: item.flavour || 'Classic',
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 1,
                    image: item.image || '',
                    occasion: item.occasion || '',
                    isGiftWrapped: Boolean(item.isGiftWrapped),
                    giftMessage: item.giftMessage || ''
                });
            }

            this.saveItems(items, item);
        },

        updateQuantity(id, flavour, occasion, newQty) {
            let items = this.getItems();
            if (newQty <= 0) {
                this.removeItem(id, flavour, occasion);
                return;
            }
            const target = items.find(i => i.id === id && i.flavour === flavour && (i.occasion || '') === (occasion || ''));
            if (target) {
                target.quantity = newQty;
                this.saveItems(items);
            }
        },

        updateGifting(id, flavour, occasion, isGiftWrapped, giftMessage) {
            let items = this.getItems();
            const target = items.find(i => i.id === id && i.flavour === flavour && (i.occasion || '') === (occasion || ''));
            if (target) {
                target.isGiftWrapped = Boolean(isGiftWrapped);
                if (giftMessage !== undefined) target.giftMessage = giftMessage;
                this.saveItems(items);
            }
        },

        removeItem(id, flavour, occasion) {
            let items = this.getItems();
            items = items.filter(i => !(i.id === id && i.flavour === flavour && (i.occasion || '') === (occasion || '')));
            this.saveItems(items);
        },

        getSubtotal() {
            const items = this.getItems();
            return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        getGiftWrappingTotal() {
            const items = this.getItems();
            return items.filter(i => i.isGiftWrapped).length * 50;
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
})(window);
