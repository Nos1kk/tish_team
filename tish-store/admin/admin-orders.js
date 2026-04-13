/* =====================================================
   ADMIN — Orders Module
   ===================================================== */

((Admin) => {
    function esc(v) {
        return String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const CURRENCY_META = {
        USD: { symbol: '$', code: 'USD' },
        RUB: { symbol: '₽', code: 'RUB' }
    };

    function normalizeCurrency(currency, fallback = '') {
        const code = String(currency || '').toUpperCase();
        if (CURRENCY_META[code]) return code;
        const fb = String(fallback || '').toUpperCase();
        return CURRENCY_META[fb] ? fb : '';
    }

    function getOrderCurrency(order, fallback = 'USD') {
        if (!order || typeof order !== 'object') return normalizeCurrency(fallback);
        const fromOrder = normalizeCurrency(order.currency || order.invoiceCurrency || order.prepaymentCurrency || '');
        if (fromOrder) return fromOrder;
        if (String(order.region || '').toUpperCase() === 'RU') return 'RUB';
        return normalizeCurrency(fallback, 'USD') || 'USD';
    }

    function formatMoney(amount, currency, withCode = false) {
        const numeric = Math.max(0, Math.round(Number(amount || 0)));
        const code = normalizeCurrency(currency, 'USD') || 'USD';
        const meta = CURRENCY_META[code] || CURRENCY_META.USD;
        const spaced = String(numeric).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return withCode ? `${meta.symbol}${spaced} ${meta.code}` : `${meta.symbol}${spaced}`;
    }

    function formatOrderMoney(order, amount, withCode = false) {
        return formatMoney(amount, getOrderCurrency(order), withCode);
    }

    function getPendingPaymentRequest(order) {
        const list = Array.isArray(order?.paymentRequests) ? order.paymentRequests : [];
        for (let i = list.length - 1; i >= 0; i--) {
            const req = list[i];
            if (req && req.status === 'pending') return req;
        }
        return null;
    }

    function getOrderPreviewImage(order) {
        if (!order) return null;
        if (order.productImage) return String(order.productImage);
        const products = typeof Admin.getProducts === 'function' ? Admin.getProducts() : [];
        const product = products.find((p) => String(p?.id ?? '') === String(order.productId ?? ''));
        if (!product || !Array.isArray(product.media)) return null;
        const firstImage = product.media.find((m) => m && m.type === 'image' && m.url);
        return firstImage ? String(firstImage.url) : null;
    }

    function renderOrderPreview(order) {
        const image = getOrderPreviewImage(order);
        if (image) {
            return `<div class="admin-product-cell__preview"><img src="${esc(image)}" alt="${esc(order?.productName || 'Товар')}" loading="lazy"></div>`;
        }
        return `<div class="admin-product-cell__preview" style="background:${esc(order?.productGradient || 'var(--purple-100)')}">${Admin.ic('<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>')}</div>`;
    }

    function fmtChatTime(value) {
        const date = value ? new Date(value) : new Date();
        return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    }

    function ensureOrderChatThread(order) {
        if (!order || !order.chatId) return;
        const key = 'chat_' + order.chatId;
        let messages = [];
        try {
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) messages = parsed;
        } catch {
            messages = [];
        }
        if (messages.length > 0) return;

        const introText = order.isUrgent
            ? 'Срочная предоплата подтверждена. Работа по заказу начинается.'
            : `Предоплата по заказу ${order.id} подтверждена. Чат активирован.`;

        messages = [
            { id: Date.now(), from: 'system', type: 'system', text: 'Чат заказа активирован.' },
            { id: Date.now() + 1, from: 'admin', type: 'text', text: introText, time: fmtChatTime(order.prepaidAt || order.urgentPrepaidAt || order.createdAt), read: false, reactions: {} }
        ];

        localStorage.setItem(key, JSON.stringify(messages));
        if (typeof Storage !== 'undefined' && Storage.set) {
            Storage.set(key, messages);
        }
    }

    function renderOrdersTab(c) {
        const orders = Admin.getOrders();
        c.innerHTML = `
            <div class="admin-card__header" style="margin-bottom:20px;">
                <h3 class="admin-card__title">📦 Заказы (${orders.length})</h3>
                <select class="input" id="orderStatusFilter" onchange="Admin.filterOrders()" style="width:auto;font-size:0.82rem;">
                    <option value="all">Все</option>
                    ${Object.entries(Admin.STATUS).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
                </select>
            </div>
            <div id="ordersListContent">${renderTable(orders)}</div>`;
    }

    function filterOrders() {
        const f = document.getElementById('orderStatusFilter')?.value || 'all';
        let orders = Admin.getOrders();
        if (f !== 'all') orders = orders.filter(o => o.status === f);
        const c = document.getElementById('ordersListContent');
        if (c) c.innerHTML = renderTable(orders);
    }

    function renderTable(orders) {
        if (!orders.length) return '<div class="admin-empty"><p>Нет заказов</p></div>';
        return `<div class="admin-table-wrapper"><table class="admin-table">
            <thead><tr><th>ID</th><th>Товар</th><th>Цена</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
            <tbody>${orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(o => {
                const st = Admin.STATUS[o.status] || { label: o.status, color: '#6b7280', icon: '❓' };
                return `<tr>
                    <td><code style="font-family:var(--font-mono);font-size:0.72rem;font-weight:700;color:var(--purple-600);">${o.id}</code></td>
                    <td><div class="admin-product-cell">${renderOrderPreview(o)}<div class="admin-product-cell__name">${esc(o.productName || 'Товар')}${o.isUrgent ? ' <span class="admin-urgent-badge">⚡ Срочно</span>' : ''}</div></div></td>
                    <td><strong>${formatOrderMoney(o, o.price || 0)}</strong></td>
                    <td><span style="padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${st.color}15;color:${st.color};">${st.icon} ${st.label}</span></td>
                    <td style="font-size:0.78rem;color:var(--color-muted);">${Admin.fmtDate(o.createdAt)}</td>
                    <td>${renderActions(o)}</td>
                </tr>`;
            }).join('')}</tbody></table></div>`;
    }

    function renderActions(o) {
        const s = 'font-size:0.72rem;padding:6px 12px;';
        let b = '';
        switch (o.status) {
            case 'pending_prepayment':
                b = `<span class="admin-status-waiting" data-tooltip="Ожидание заявки на оплату от клиента">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>`;
                break;
            case 'prepayment_verification':
                b = `<button class="btn btn-sm btn-primary admin-action-btn" onclick="Admin.reviewPaymentRequest('${o.id}')" style="${s}" data-tooltip="Проверить предоплату">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c-1.2 4.2-4.7 7-9 7-4.3 0-7.8-2.8-9-7 1.2-4.2 4.7-7 9-7 4.3 0 7.8 2.8 9 7z"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost admin-action-btn" onclick="Admin.openOrderChat('${o.id}')" style="${s}" data-tooltip="Чат">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>`;
                break;
            case 'prepaid':
                b = `<button class="btn btn-sm btn-primary admin-action-btn" onclick="Admin.startWork('${o.id}')" style="${s}" data-tooltip="Начать работу">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost admin-action-btn" onclick="Admin.openOrderChat('${o.id}')" style="${s}" data-tooltip="Открыть чат">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>`;
                break;
            case 'in_progress':
                b = `<button class="btn btn-sm btn-primary admin-action-btn" onclick="Admin.openInvoiceForm('${o.id}')" style="${s}" data-tooltip="Выставить счёт">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost admin-action-btn" onclick="Admin.openOrderChat('${o.id}')" style="${s}" data-tooltip="Чат">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>`;
                break;
            case 'invoice_sent':
                b = `<span class="admin-status-waiting" data-tooltip="Ожидание оплаты">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <button class="btn btn-sm btn-ghost admin-action-btn" onclick="Admin.openOrderChat('${o.id}')" style="${s}" data-tooltip="Чат">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>`;
                break;
            case 'payment_verification':
                b = `<button class="btn btn-sm btn-primary admin-action-btn" onclick="Admin.reviewPaymentRequest('${o.id}')" style="${s}" data-tooltip="Проверить финальную оплату">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c-1.2 4.2-4.7 7-9 7-4.3 0-7.8-2.8-9-7 1.2-4.2 4.7-7 9-7 4.3 0 7.8 2.8 9 7z"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost admin-action-btn" onclick="Admin.openOrderChat('${o.id}')" style="${s}" data-tooltip="Чат">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>`;
                break;
            case 'paid':
                b = `<button class="btn btn-sm admin-action-btn" onclick="Admin.completeOrder('${o.id}')" style="${s}background:#22c55e;color:white;border:none;" data-tooltip="Завершить заказ">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost admin-action-btn" onclick="Admin.openOrderChat('${o.id}')" style="${s}" data-tooltip="Чат">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>`;
                break;
            case 'completed':
                b = `<span style="color:#16a34a;font-weight:700;" data-tooltip="Завершён">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </span>`;
                break;
        }
        return `<div style="display:flex;gap:6px;align-items:center;">${b}</div>`;
    }

    function downloadPaymentReceipt(orderId, requestId) {
        const orders = Admin.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const req = (order.paymentRequests || []).find(r => String(r.id) === String(requestId));
        if (!req || !req.receiptData) {
            App.showToast('Чек не найден', 'warning');
            return;
        }
        const a = document.createElement('a');
        a.href = req.receiptData;
        a.download = req.receiptName || 'payment-receipt';
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function reviewPaymentRequest(id) {
        const order = Admin.getOrders().find(x => x.id === id);
        if (!order) return;
        const req = getPendingPaymentRequest(order);
        if (!req) {
            App.showToast('По заказу нет платежа на проверке', 'warning');
            return;
        }

        const typeMap = {
            prepayment: 'Предоплата',
            urgent_prepayment: 'Срочная предоплата',
            invoice: 'Финальная оплата'
        };
        const transferAt = req.transferAt ? Admin.fmtDateTime(req.transferAt) : 'Не указано';
        const amount = Number(req.amount || 0);
        const reqCurrency = normalizeCurrency(req.currency || getOrderCurrency(order));
        const method = req.method === 'sber_card' ? 'Карта Сбербанка' : (req.method || 'Не указан');
        const receiptBlock = req.receiptData
            ? (String(req.receiptData).startsWith('data:image/')
                ? `<img src="${esc(req.receiptData)}" alt="receipt" style="width:100%;max-height:280px;object-fit:contain;border:1px solid var(--color-border-soft);border-radius:10px;background:var(--color-bg-muted);">`
                : `<button class="btn btn-ghost btn-sm" onclick="Admin.downloadPaymentReceipt('${esc(order.id)}','${esc(req.id)}')">Скачать чек (${esc(req.receiptName || 'файл')})</button>`)
            : '<span style="color:var(--color-muted);font-size:0.82rem;">Чек не приложен</span>';

        Admin.showAdminModal({
            title: '🧾 Проверка оплаты',
            hideFooter: true,
            width: '640px',
            body: `
                <div style="padding:14px;background:var(--color-bg-muted);border-radius:12px;margin-bottom:12px;">
                    <div style="font-weight:800;margin-bottom:6px;">${esc(order.productName || 'Заказ')} · ${esc(order.id)}</div>
                    <div style="font-size:0.82rem;color:var(--color-muted);line-height:1.55;">
                        Тип: <strong>${esc(typeMap[req.type] || req.type || 'Платеж')}</strong><br>
                        Сумма: <strong>${formatMoney(amount, reqCurrency, true)}</strong><br>
                        Метод: <strong>${esc(method)}</strong>${req.cardNumber ? ` (${esc(req.cardNumber)})` : ''}<br>
                        Отправитель: <strong>${esc(req.senderName || 'Не указан')}</strong>${req.senderCardTail ? ` (•••• ${esc(req.senderCardTail)})` : ''}<br>
                        Время перевода: <strong>${esc(transferAt)}</strong>
                    </div>
                    ${req.comment ? `<div style="margin-top:8px;font-size:0.82rem;"><strong>Комментарий:</strong> ${esc(req.comment)}</div>` : ''}
                </div>
                <div style="margin-bottom:12px;">${receiptBlock}</div>
                <div class="admin-form-group" style="margin-bottom:12px;">
                    <label class="admin-form-label">Причина отклонения (если нужно)</label>
                    <textarea class="textarea" id="paymentRejectReason" rows="3" placeholder="Например: не совпадает сумма/нечитаемый чек..."></textarea>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-secondary btn-sm" onclick="Admin.closeAdminModal()">Закрыть</button>
                    <button class="btn btn-ghost btn-sm" style="border-color:#ef4444;color:#ef4444;" onclick="Admin.rejectPaymentRequest('${esc(order.id)}')">Отклонить</button>
                    <button class="btn btn-primary btn-sm" onclick="Admin.approvePaymentRequest('${esc(order.id)}')">Подтвердить</button>
                </div>`
        });
    }

    function applyPaymentDecisionFallback(id, approved, reason) {
        const orders = Admin.getOrders();
        const o = orders.find(x => x.id === id);
        if (!o) return false;
        const req = getPendingPaymentRequest(o);
        if (!req) return false;

        const now = new Date().toISOString();
        req.status = approved ? 'approved' : 'rejected';
        req.reviewedAt = now;
        req.reviewedBy = 'admin';
        if (!approved) req.rejectReason = reason || '';

        if (approved) {
            if (req.type === 'invoice') {
                o.status = 'paid';
                o.paidAt = now;
            } else if (req.type === 'urgent_prepayment') {
                o.status = 'in_progress';
                o.urgentPrepaid = true;
                o.urgentPrepaidAt = now;
                o.chatId = o.chatId || ('chat_' + o.id);
            } else {
                o.status = 'prepaid';
                o.prepaidAt = now;
                o.chatId = o.chatId || ('chat_' + o.id);
            }
            o.lastPaymentStatus = 'approved';
        } else {
            if (req.type === 'invoice') o.status = 'invoice_sent';
            else if (req.type === 'urgent_prepayment') o.status = 'pending_prepayment';
            else o.status = 'pending_prepayment';
            o.lastPaymentStatus = 'rejected';
        }

        Admin.saveOrders(orders);
        return true;
    }

    function approvePaymentRequest(id) {
        let ok = false;
        if (typeof Chat !== 'undefined' && Chat.adminApprovePaymentRequest) {
            try {
                ok = !!Chat.adminApprovePaymentRequest(id);
            } catch {
                ok = false;
            }
        }
        if (!ok) {
            ok = applyPaymentDecisionFallback(id, true, '');
        }
        if (!ok) {
            App.showToast('Не удалось подтвердить платеж', 'warning');
            return;
        }

        const orders = Admin.getOrders();
        const o = orders.find(x => x.id === id);
        if (o && o.status !== 'pending_prepayment') {
            if (!o.chatId) {
                o.chatId = 'chat_' + o.id;
            }
            Admin.saveOrders(orders);
            ensureOrderChatThread(o);
        }

        document.dispatchEvent(new CustomEvent('orderStatusChanged', {
            detail: { orderId: id, text: `Оплата по заказу ${id} подтверждена` }
        }));

        Admin.logAction('Оплата подтверждена', id);
        Admin.closeAdminModal();
        App.showToast('Платеж подтвержден', 'success');
        Admin.render();
        Admin.syncProfile();
    }

    function rejectPaymentRequest(id) {
        const reason = (document.getElementById('paymentRejectReason')?.value || '').trim();
        if (!reason) {
            App.showToast('Укажите причину отклонения', 'warning');
            return;
        }

        let ok = false;
        if (typeof Chat !== 'undefined' && Chat.adminRejectPaymentRequest) {
            try {
                ok = !!Chat.adminRejectPaymentRequest(id, reason);
            } catch {
                ok = false;
            }
        }
        if (!ok) {
            ok = applyPaymentDecisionFallback(id, false, reason);
        }
        if (!ok) {
            App.showToast('Не удалось отклонить платеж', 'warning');
            return;
        }
        Admin.logAction('Оплата отклонена', `${id}: ${reason}`);
        Admin.closeAdminModal();
        App.showToast('Платеж отклонен', 'info');
        Admin.render();
        Admin.syncProfile();
    }

    // ===== ORDER ACTIONS =====
    function confirmPrepayment(id) {
        const orders = Admin.getOrders();
        const o = orders.find(x => x.id === id);
        if (!o) return;
        if (o.status === 'pending_prepayment') {
            o.status = 'prepaid';
            o.prepaidAt = new Date().toISOString();
            o.chatId = o.chatId || ('chat_' + o.id);
            Admin.saveOrders(orders);
            ensureOrderChatThread(o);
            Admin.logAction('Ручное подтверждение предоплаты', o.productName);
            App.showToast('Предоплата подтверждена вручную', 'success');
            Admin.render();
            Admin.syncProfile();
            return;
        }
        approvePaymentRequest(id);
    }

    function startWork(id) {
        let ok = false;
        if (typeof Chat !== 'undefined' && Chat.adminStartWork) {
            ok = !!Chat.adminStartWork(id);
        }

        if (!ok) {
            const orders = Admin.getOrders();
            const o = orders.find(x => x.id === id);
            if (!o) {
                App.showToast('Заказ не найден', 'warning');
                return;
            }
            o.chatId = o.chatId || ('chat_' + o.id);
            o.status = 'in_progress';
            o.startedAt = o.startedAt || new Date().toISOString();
            Admin.saveOrders(orders);
            ensureOrderChatThread(o);
            ok = true;
        }

        if (!ok) {
            App.showToast('Не удалось перевести заказ в работу', 'warning');
            return;
        }

        document.dispatchEvent(new CustomEvent('orderStatusChanged', {
            detail: { orderId: id, text: `Работа по заказу ${id} начата` }
        }));

        Admin.logAction('Работа начата', id);
        App.showToast('Работа над проектом начата!', 'success', 4000);
        Admin.render();
        Admin.syncProfile();
    }

    function openInvoiceForm(id) {
        const orders = Admin.getOrders(); const o = orders.find(x => x.id === id); if (!o) return;
        const orderCurrency = getOrderCurrency(o);
        const remaining = (o.price || 0) - (o.prepayment || 0);
        Admin.showAdminModal({
            title: '📄 Выставить счёт',
            body: `
                <div style="padding:14px;background:var(--color-bg-muted);border-radius:12px;margin-bottom:16px;">
                    <div style="font-weight:700;">${o.productName}</div>
                    <div style="font-size:0.82rem;color:var(--color-muted);">Цена: ${formatMoney(o.price || 0, orderCurrency)} • Предоплата: ${formatMoney(o.prepayment || 0, orderCurrency)} • Остаток: <strong>${formatMoney(remaining, orderCurrency, true)}</strong></div>
                </div>
                <div class="admin-form-group"><label class="admin-form-label">Сумма (${CURRENCY_META[orderCurrency]?.code || orderCurrency})</label><input type="number" class="input" id="invoiceAmount" value="${remaining}" min="1"></div>
                <div class="admin-form-group"><label class="admin-form-label">Описание</label><textarea class="textarea" id="invoiceDesc" rows="2">${o.productName}</textarea></div>`,
            confirmText: 'Выставить',
            onConfirm: () => {
                const amount = parseInt(document.getElementById('invoiceAmount')?.value);
                if (!amount || amount <= 0) { App.showToast('Сумма', 'warning'); return; }
                if (typeof Chat !== 'undefined' && Chat.adminSendInvoice) Chat.adminSendInvoice(id, amount, document.getElementById('invoiceDesc')?.value || '');
                else { const orders = Admin.getOrders(); const o = orders.find(x => x.id === id); if (o) { o.invoiceAmount = amount; o.status = 'invoice_sent'; Admin.saveOrders(orders); } }
                const amountText = formatMoney(amount, orderCurrency, true);
                Admin.logAction('Счёт', amountText);
                Admin.closeAdminModal(); App.showToast(`Счёт ${amountText}!`, 'success'); Admin.render();
            }
        });
    }

    function completeOrder(id) {
        if (typeof Chat !== 'undefined' && Chat.adminConfirmPayment) Chat.adminConfirmPayment(id);
        else {
            const orders = Admin.getOrders();
            const o = orders.find(x => x.id === id);
            if (o) {
                o.status = 'completed';
                o.completedAt = new Date().toISOString();
                Admin.saveOrders(orders);
            }
        }

        const orders = Admin.getOrders();
        const o = orders.find(x => x.id === id);
        if (o && typeof Subscription !== 'undefined' && Subscription.recordPurchase) {
            const catMap = { 'Веб / IT': 'web', 'Дизайн': 'design', 'Видео': 'video', 'Маркетинг': 'marketing' };
            Subscription.recordPurchase(catMap[o.category] || 'web', o.productName, (o.price || 0) * 100);
        }
        Admin.logAction('Завершён', id);
        App.showToast('Заказ завершен', 'success');
        Admin.render();
        Admin.syncProfile();
    }

    function openOrderChat(id) {
        const orders = Admin.getOrders();
        const o = orders.find(x => x.id === id);
        if (!o) {
            App.showToast('Заказ не найден', 'warning');
            return;
        }

        if (!o.chatId && o.status !== 'pending_prepayment') {
            o.chatId = 'chat_' + o.id;
            Admin.saveOrders(orders);
        }

        if (o.chatId) {
            ensureOrderChatThread(o);
        }

        if (!o?.chatId) { App.showToast('Нет чата', 'warning'); return; }
        App.showPage('chat');
        setTimeout(() => { if (typeof Chat !== 'undefined') Chat.openChat(o.chatId); }, 300);
    }

    Admin.registerTab('orders', renderOrdersTab);
    Admin.filterOrders = filterOrders;
    Admin.confirmPrepayment = confirmPrepayment;
    Admin.reviewPaymentRequest = reviewPaymentRequest;
    Admin.downloadPaymentReceipt = downloadPaymentReceipt;
    Admin.approvePaymentRequest = approvePaymentRequest;
    Admin.rejectPaymentRequest = rejectPaymentRequest;
    Admin.startWork = startWork;
    Admin.openInvoiceForm = openInvoiceForm;
    Admin.completeOrder = completeOrder;
    Admin.openOrderChat = openOrderChat;
})(Admin);