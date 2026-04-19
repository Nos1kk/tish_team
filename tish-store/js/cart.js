/* =====================================================
   TISH STORE — CART SYSTEM v2
   Updated: region check + dual pricing
   ===================================================== */

const Cart = (() => {
    let items = [];

    function load() {
        try {
            const s = localStorage.getItem('tish_cart');
            items = s ? JSON.parse(s) : [];
        } catch(e) { items = []; }
        hydrateCartItemImages();
    }

    function save() {
        try { localStorage.setItem('tish_cart', JSON.stringify(items)); } catch(e) {}
        if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_cart', items);
        updateBadge();
        renderQuickView();
    }

    /* Получить регион пользователя */
    function getUserRegion() {
        try {
            const prof = JSON.parse(localStorage.getItem('tish_profile') || '{}');
            return prof.region || null;
        } catch { return null; }
    }

    function getUserCurrency() {
        const region = getUserRegion();
        if (region === 'RU') return 'RUB';
        if (region === 'OTHER') return 'USD';
        return (navigator.language && navigator.language.startsWith('ru')) ? 'RUB' : 'USD';
    }

    /* Получить правильную цену товара */
    function getPrice(product, field) {
        const cur = getUserCurrency();
        if (cur === 'RUB') {
            if (field === 'price') return product.priceRub || product.price || 0;
            if (field === 'oldPrice') return product.oldPriceRub || product.oldPrice || null;
            if (field === 'prepay') return product.prepayPriceRub || product.prepayPrice || Math.ceil((product.priceRub || product.price || 0) * 0.3);
        } else {
            if (field === 'price') return product.priceUsd || product.price || 0;
            if (field === 'oldPrice') return product.oldPriceUsd || product.oldPrice || null;
            if (field === 'prepay') return product.prepayPriceUsd || product.prepayPrice || Math.ceil((product.priceUsd || product.price || 0) * 0.3);
        }
        return 0;
    }

    function formatCartPrice(value) {
        const cur = getUserCurrency();
        const n = Number(value || 0);
        if (cur === 'USD') return '$\u202f' + n.toLocaleString('en-US');
        return n.toLocaleString('ru-RU') + '\u00a0₽';
    }

    function formatOrderPrice(value, currency) {
        const n = Number(value || 0);
        if (String(currency || '').toUpperCase() === 'USD') {
            return '$\u202f' + n.toLocaleString('en-US');
        }
        return n.toLocaleString('ru-RU') + '\u00a0₽';
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
        return String(str || '')
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r/g, ' ')
            .replace(/\n/g, ' ');
    }

    function escapeHtmlAttr(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function getProductImage(product) {
        if (!product || !Array.isArray(product.media)) return null;
        const firstImage = product.media.find(m => m && m.type === 'image' && m.url);
        return firstImage ? String(firstImage.url) : null;
    }

    function getCatalogProducts() {
        if (typeof Catalog !== 'undefined' && Catalog.getProducts) {
            const list = Catalog.getProducts() || [];
            if (Array.isArray(list) && list.length > 0) return list;
        }

        try {
            const raw = localStorage.getItem('tish_admin_products');
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.items)) return parsed.items;
        } catch (e) {}

        return [];
    }

    function resolveCartItemImage(item, products) {
        if (!item) return null;
        if (item.image) return String(item.image);
        const list = Array.isArray(products) ? products : getCatalogProducts();
        const id = String(item.id ?? item.productId ?? '');
        const product = list.find((p) => String(p?.id ?? '') === id);
        return getProductImage(product);
    }

    function hydrateCartItemImages() {
        if (!Array.isArray(items) || items.length === 0) return;
        const products = getCatalogProducts();
        let changed = false;
        items = items.map((item) => {
            if (!item || item.image) return item;
            const image = resolveCartItemImage(item, products);
            if (!image) return item;
            changed = true;
            return { ...item, image };
        });
        if (!changed) return;

        try { localStorage.setItem('tish_cart', JSON.stringify(items)); } catch (e) {}
        if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_cart', items);
    }

    function getPendingPrepaymentOrders() {
        try {
            const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
            return orders
                .filter(o => o && o.status === 'pending_prepayment')
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } catch (e) {
            return [];
        }
    }

    function renderPendingPrepaymentOrders(list) {
        if (!Array.isArray(list) || list.length === 0) return '';
        return `
            <div class="cart-pending">
                <div class="cart-pending__title">Оформленные заказы, ожидающие предоплату</div>
                <div class="cart-pending__desc">Оплатить можно прямо из корзины, переход в профиль не нужен.</div>
                <div class="cart-pending__list">
                    ${list.map(o => {
                        const orderId = escapeAttr(o.id || '');
                        const name = escapeHtml(o.productName || 'Товар');
                        const currency = o.prepaymentCurrency || o.currency || getUserCurrency();
                        const prepayText = formatOrderPrice(o.prepayment || 0, currency);
                        return `
                            <div class="cart-pending-order">
                                <div class="cart-pending-order__main">
                                    <div class="cart-pending-order__name">${name}</div>
                                    <div class="cart-pending-order__id">${escapeHtml(o.id || '')}</div>
                                </div>
                                <div class="cart-pending-order__side">
                                    <div class="cart-pending-order__amount">${prepayText}</div>
                                    <button class="btn btn-primary btn-sm" onclick="Cart.payPrepayment('${orderId}')">Оплатить предоплату</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    function addItem(productId) {
        // Проверка региона
        if (!getUserRegion()) {
            App.showToast('Сначала выберите регион в профиле', 'warning');
            return;
        }

        if (items.find(i => i.id === productId)) {
            App.showToast('Уже в корзине', 'warning');
            return;
        }
        const products = typeof Catalog !== 'undefined' && Catalog.getProducts ? Catalog.getProducts() : [];
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const price = getPrice(product, 'price');
        const prepay = getPrice(product, 'prepay');

        items.push({
            id: product.id,
            title: product.title,
            price: price,
            priceRub: product.priceRub || product.price,
            priceUsd: product.priceUsd,
            oldPrice: getPrice(product, 'oldPrice'),
            prepayment: prepay || Math.ceil(price * 0.3),
            gradient: product.gradient,
            image: getProductImage(product),
            category: product.category,
            author: product.executor || product.author,
            addedAt: new Date().toISOString(),
            currency: getUserCurrency()
        });
        save();

        if (typeof Admin !== 'undefined' && Admin._analytics) {
            Admin._analytics.track('cart_add', { name: product.title, price: price });
        }

        App.showToast(`"${product.title}" добавлен в корзину 🛒`, 'success');
    }

    function removeItem(productId) {
        const removed = items.find(i => i.id === productId);
        if (removed && typeof Admin !== 'undefined' && Admin._analytics) {
            Admin._analytics.track('cart_remove', { name: removed.title, price: removed.price });
        }
        items = items.filter(i => i.id !== productId);
        save();
        App.showToast('Убрано из корзины', 'info');
    }

    function clearCart() {
        items = [];
        save();
    }

    function getItems() { return items; }
    function getCount() { return items.length; }
    function getTotal() { return items.reduce((s, i) => s + i.price, 0); }
    function getPrepaymentTotal() { return items.reduce((s, i) => s + (i.prepayment || Math.ceil(i.price * 0.3)), 0); }
    function isInCart(productId) { return items.some(i => i.id === productId); }

    function updateBadge() {
        const count = items.length;
        document.querySelectorAll('[data-cart-count]').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? '' : 'none';
        });
    }

    function renderQuickView() {
        const c = document.getElementById('cartQuickContent');
        if (!c) return;
        if (items.length === 0) {
            c.innerHTML = '<div style="font-size:0.85rem;color:var(--color-muted);padding:8px 0;">Корзина пуста</div>';
            return;
        }
        const products = getCatalogProducts();
        c.innerHTML = `
            <div style="font-size:0.85rem;color:var(--color-muted);margin-bottom:8px;">${items.length} товар${items.length>1?(items.length>4?'ов':'а'):''}</div>
            ${items.slice(0, 3).map(it => {
                const previewImage = resolveCartItemImage(it, products);
                const safeImage = previewImage ? escapeHtmlAttr(previewImage) : '';
                const safeTitle = escapeHtml(it.title || 'Товар');
                const fallbackBg = it.gradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)';
                return `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
                    <div style="width:32px;height:32px;border-radius:8px;flex-shrink:0;overflow:hidden;${previewImage ? '' : `background:${fallbackBg};`}" >
                        ${previewImage
                            ? `<img src="${safeImage}" alt="${safeTitle}" style="width:100%;height:100%;object-fit:cover;display:block;">`
                            : ''}
                    </div>
                    <div style="flex:1;min-width:0;"><div style="font-size:0.78rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeTitle}</div></div>
                    <div style="font-family:var(--font-mono);font-weight:700;font-size:0.82rem;color:var(--purple-600);">${formatCartPrice(it.price)}</div>
                </div>
            `;
            }).join('')}
            ${items.length > 3 ? `<div style="font-size:0.75rem;color:var(--color-muted);padding-top:4px;">...и ещё ${items.length - 3}</div>` : ''}
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border-soft);display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-size:0.72rem;color:var(--color-muted);">Предоплата:</div><div style="font-family:var(--font-mono);font-weight:800;color:var(--purple-600);">${formatCartPrice(getPrepaymentTotal())}</div></div>
                <button class="btn btn-primary btn-sm" onclick="Cart.openCartModal()">Оформить</button>
            </div>
        `;
    }

    function payPrepayment(orderId) {
        const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        if (order.status !== 'pending_prepayment') {
            if (order.status === 'prepayment_verification') {
                App.showToast('Предоплата уже отправлена на проверку администратору', 'info');
            } else {
                App.showToast('Предоплата уже внесена', 'info');
            }
            return;
        }

        let opened = false;
        try {
            if (typeof Chat !== 'undefined') {
                if (typeof Chat.requestPaymentVerification === 'function') {
                    opened = !!Chat.requestPaymentVerification(orderId, 'prepayment');
                } else if (typeof Chat.openPaymentRequestModal === 'function') {
                    opened = !!Chat.openPaymentRequestModal(orderId, 'prepayment');
                }
            }
        } catch (e) {
            opened = false;
        }

        if (opened) return;

        // Fallback: переключаемся в чат и повторяем открытие модалки после рендера страницы.
        if (typeof App !== 'undefined' && typeof App.showPage === 'function') {
            App.showPage('chat');
        }

        setTimeout(() => {
            try {
                if (typeof Chat !== 'undefined' && typeof Chat.openPaymentRequestModal === 'function') {
                    const retried = !!Chat.openPaymentRequestModal(orderId, 'prepayment');
                    if (!retried) {
                        App.showToast('Не удалось открыть окно оплаты. Обновите страницу и попробуйте снова.', 'warning');
                    }
                    return;
                }
                App.showToast('Модуль оплаты ещё загружается. Повторите через секунду.', 'warning');
            } catch (e) {
                App.showToast('Ошибка при открытии окна оплаты. Обновите страницу.', 'error');
            }
        }, 120);
    }

    function openCartModal() {
        const c = document.getElementById('cartModalContent');
        if (!c) return;
        const pendingOrders = getPendingPrepaymentOrders();

        if (items.length === 0) {
            if (pendingOrders.length > 0) {
                c.innerHTML = renderPendingPrepaymentOrders(pendingOrders);
            } else {
                c.innerHTML = `
                    <div class="profile-empty">
                        <div class="profile-empty__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
                        <div class="profile-empty__title">Корзина пуста</div>
                        <div class="profile-empty__desc">Добавьте товары из каталога</div>
                        <button class="btn btn-primary btn-sm" onclick="Profile.closeModal('cartModal');App.showPage('catalog')">В каталог</button>
                    </div>
                `;
            }
        } else {
            const regionOk = !!getUserRegion();
            const products = getCatalogProducts();
            c.innerHTML = `
                ${items.map(it => {
                    const previewImage = resolveCartItemImage(it, products);
                    const safeImage = previewImage ? escapeHtmlAttr(previewImage) : '';
                    const safeTitle = escapeHtml(it.title || 'Товар');
                    const safeCategory = escapeHtml(it.category || '');
                    const fallbackBg = it.gradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)';
                    return `
                    <div class="cart-item">
                        <div class="cart-item__preview" style="${previewImage ? '' : `background:${fallbackBg};`}">
                            ${previewImage
                                ? `<img src="${safeImage}" alt="${safeTitle}" loading="lazy">`
                                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>'
                            }
                        </div>
                        <div class="cart-item__info">
                            <div class="cart-item__name">${safeTitle}</div>
                            <div class="cart-item__meta">${safeCategory}</div>
                            <div class="cart-item__pricing">
                                <div class="cart-item__prepay">Предоплата: ${formatCartPrice(it.prepayment)}</div>
                                <div class="cart-item__price">Полная: ${formatCartPrice(it.price)}</div>
                            </div>
                        </div>
                        <button class="cart-item__remove" onclick="Cart.removeItem(${it.id});Cart.openCartModal();">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                `;
                }).join('')}
                <div class="cart-summary">
                    <div class="cart-summary__row">
                        <span>Товаров:</span>
                        <span>${items.length}</span>
                    </div>
                    <div class="cart-summary__row">
                        <span>Итого:</span>
                        <span class="cart-summary__total">${formatCartPrice(getTotal())}</span>
                    </div>
                    <div class="cart-summary__row cart-summary__row--highlight">
                        <span>Предоплата:</span>
                        <span class="cart-summary__prepay">${formatCartPrice(getPrepaymentTotal())}</span>
                    </div>
                    ${!regionOk ? `
                    <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:0.82rem;color:#f97316;text-align:center">
                        ⚠️ Выберите регион в <a style="color:#7c3aed;font-weight:700;cursor:pointer;text-decoration:underline" onclick="Profile.closeModal('cartModal');App.showPage('profile')">профиле</a>, чтобы оформить заказ
                    </div>` : ''}
                    <button class="btn btn-primary btn-block cart-summary__checkout-btn" onclick="Cart.checkout()" style="margin-top:16px;${!regionOk ? 'opacity:.5;cursor:not-allowed;' : ''}" ${!regionOk ? 'disabled' : ''}>
                        ${regionOk ? `Оформить заказ — ${formatCartPrice(getPrepaymentTotal())} предоплата` : 'Сначала выберите регион'}
                    </button>
                </div>
                ${renderPendingPrepaymentOrders(pendingOrders)}
            `;
        }

        Profile.openModal('cartModal');
    }

    function checkout() {
        if (items.length === 0) return;
        
        // Проверка региона
        if (!getUserRegion()) {
            App.showToast('Сначала выберите регион в профиле', 'warning');
            return;
        }

        const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
        const createdOrderIds = [];
        const profile = JSON.parse(localStorage.getItem('tish_profile') || '{}');
        const userId = String(profile.googleId || '');
        const userEmail = String(profile.email || '');

        items.forEach(item => {
            const order = {
                id: 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase(),
            userId,
            userEmail,
                productId: item.id,
                productName: item.title,
                productGradient: item.gradient,
                productImage: item.image || null,
                category: item.category,
                author: item.author,
                price: item.price,
                currency: getUserCurrency(),
                prepayment: item.prepayment,
                status: 'pending_prepayment',
                createdAt: new Date().toISOString(),
                prepaidAt: null,
                completedAt: null,
                chatId: null,
                invoiceAmount: null,
                invoiceDiscounts: [],
                reviewed: false,
                paymentRequests: [],
                lastPaymentRequestId: null,
                lastPaymentType: null,
                lastPaymentStatus: null,
                paymentRequestedAt: null
            };
            orders.push(order);
            createdOrderIds.push(order.id);

            if (typeof Admin !== 'undefined' && Admin._analytics) {
                Admin._analytics.track('purchase', { name: item.title, amount: item.price, orderId: order.id });
            }
        });

        localStorage.setItem('tish_orders', JSON.stringify(orders));
        if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_orders', orders);
        clearCart();
        Profile.closeModal('cartModal');
        App.showToast('Заказы оформлены! Оплатите предоплату для начала работы 🎉', 'success', 5000);

        if (typeof Profile !== 'undefined' && Profile.renderAll) Profile.renderAll();

        // Открываем то же окно оплаты сразу после оформления, чтобы не искать его в профиле.
        if (createdOrderIds.length > 0) {
            setTimeout(() => payPrepayment(createdOrderIds[0]), 140);
            if (createdOrderIds.length > 1) {
                App.showToast('Сначала оплатите первый заказ, затем остальные в корзине или профиле', 'info', 4500);
            }
        }
    }

    function init() {
        load();
        updateBadge();
        renderQuickView();
    }

    return {
        init, addItem, removeItem, clearCart,
        getItems, getCount, getTotal, getPrepaymentTotal, isInCart,
        updateBadge, renderQuickView, openCartModal, checkout, payPrepayment
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Cart.init());
} else {
    Cart.init();
}