((Admin) => {
    function _readIncoming() {
        try {
            const raw = localStorage.getItem('tish_admin_notifications');
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    async function _refreshIncoming() {
        try {
            const res = await fetch('/api/store/data/tish_admin_notifications');
            const json = await res.json();
            const value = json.value !== undefined ? json.value : json.data;
            if (json.success && Array.isArray(value)) {
                localStorage.setItem('tish_admin_notifications', JSON.stringify(value));
            }
        } catch {}
    }

    function _markIncomingRead(id) {
        const list = _readIncoming();
        const next = list.map(n => String(n.id) === String(id) ? { ...n, read: true } : n);
        localStorage.setItem('tish_admin_notifications', JSON.stringify(next));
        if (typeof Storage !== 'undefined' && Storage.set) {
            Storage.set('tish_admin_notifications', next);
        }
        Admin.render();
    }

    function _markAllIncomingRead() {
        const list = _readIncoming();
        const next = list.map(n => ({ ...n, read: true }));
        localStorage.setItem('tish_admin_notifications', JSON.stringify(next));
        if (typeof Storage !== 'undefined' && Storage.set) {
            Storage.set('tish_admin_notifications', next);
        }
        Admin.render();
    }

    function _openIncomingChat(chatId, notifId) {
        _markIncomingRead(notifId);
        Admin.switchTab('chat');
        setTimeout(() => {
            if (typeof Admin.openChat === 'function') {
                Admin.openChat(chatId);
            }
        }, 80);
    }

    function _openIncomingPayment(orderId, notifId) {
        _markIncomingRead(notifId);
        Admin.switchTab('orders');
        setTimeout(() => {
            const all = document.querySelectorAll('.admin-table tbody tr');
            all.forEach(r => r.style.outline = '');
            const rows = Array.from(document.querySelectorAll('.admin-table tbody tr'));
            const hit = rows.find(r => (r.textContent || '').includes(orderId));
            if (hit) {
                hit.style.outline = '2px solid rgba(139,92,246,0.35)';
                hit.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 120);
    }

    function _escInline(value) {
        return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    function renderTab(c) {
        const notifs = Admin.getNotifications();
        const incoming = _readIncoming().filter(n => n && (n.type === 'call_admin' || n.type === 'payment_check'));
        const unreadIncoming = incoming.filter(n => !n.read).length;

        _refreshIncoming().then(() => {
            const refreshed = _readIncoming().filter(n => n && (n.type === 'call_admin' || n.type === 'payment_check')).length;
            if (refreshed !== incoming.length) Admin.render();
        });

        c.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">
                <div class="admin-card">
                    <h3 class="admin-card__title" style="margin-bottom:14px;">📢 Отправить</h3>
                    <div class="admin-form-group"><label class="admin-form-label">Тип</label><select class="input" id="notifType"><option value="info">ℹ️ Инфо</option><option value="promo">🎉 Акция</option><option value="warning">⚠️ Внимание</option></select></div>
                    <div class="admin-form-group"><label class="admin-form-label">Заголовок</label><input type="text" class="input" id="notifTitle" placeholder="Заголовок"></div>
                    <div class="admin-form-group"><label class="admin-form-label">Текст</label><textarea class="textarea" id="notifText" placeholder="Текст..." rows="3"></textarea></div>
                    <button class="btn btn-primary btn-sm" onclick="Admin.sendNotification()">📤 Отправить</button>
                </div>
                <div class="admin-card">
                    <h3 class="admin-card__title" style="margin-bottom:14px;">📋 История (${notifs.length})</h3>
                    <div class="admin-list" style="max-height:400px;overflow-y:auto;">
                        ${notifs.length === 0 ? '<p class="admin-empty-text">Пусто</p>' :
                        notifs.slice(0, 20).map(n => `
                            <div class="admin-list__item" style="padding:10px 0;"><div style="flex:1;"><div style="font-size:0.82rem;font-weight:600;">${n.title || '—'}</div><div style="font-size:0.75rem;color:var(--color-muted);">${n.text || ''}</div></div>
                            <div style="font-size:0.7rem;color:var(--color-muted);">${Admin.fmtDateTime(n.date)}</div></div>`).join('')}
                    </div>
                </div>
            </div>`;

        const incomingCard = document.createElement('div');
        incomingCard.className = 'admin-card';
        incomingCard.style.marginTop = '20px';
        incomingCard.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
                <h3 class="admin-card__title" style="margin:0;">🔔 Входящие запросы (${incoming.length})</h3>
                <button class="btn btn-ghost btn-sm" onclick="Admin.markAllIncomingCallsRead()" ${incoming.length ? '' : 'disabled'}>Прочитать все</button>
            </div>
            <div style="font-size:0.76rem;color:var(--color-muted);margin-bottom:10px;">Непрочитанных: ${unreadIncoming}</div>
            <div class="admin-list" style="max-height:360px;overflow-y:auto;">
                ${incoming.length === 0 ? '<p class="admin-empty-text">Нет новых запросов</p>' : incoming.slice(0, 40).map(n => {
                    const chatIdSafe = _escInline(n.chatId);
                    const orderIdSafe = _escInline(n.orderId);
                    const notifIdSafe = _escInline(n.id);
                    if (n.type === 'payment_check') {
                        return `
                    <div class="admin-list__item" style="padding:10px 0;align-items:flex-start;${n.read ? 'opacity:.75;' : 'border-left:3px solid #f97316;padding-left:10px;'}">
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:0.82rem;font-weight:700;">🧾 Проверка оплаты ${n.orderId ? `по заказу ${n.orderId}` : ''}</div>
                            <div style="font-size:0.75rem;color:var(--color-muted);margin-top:2px;">${n.message || 'Клиент отправил платеж на проверку'}</div>
                            <div style="font-size:0.72rem;color:var(--color-muted);margin-top:2px;">${Admin.fmtDateTime(n.time || n.date)}</div>
                            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                                <button class="btn btn-primary btn-sm" onclick="Admin.openIncomingPayment('${orderIdSafe}','${notifIdSafe}')">К заказу</button>
                                ${n.chatId ? `<button class="btn btn-ghost btn-sm" onclick="Admin.openIncomingCallChat('${chatIdSafe}','${notifIdSafe}')">К чату</button>` : ''}
                                ${n.read ? '' : `<button class="btn btn-ghost btn-sm" onclick="Admin.markIncomingCallRead('${notifIdSafe}')">Прочитано</button>`}
                            </div>
                        </div>
                    </div>
                `;
                    }
                    return `
                    <div class="admin-list__item" style="padding:10px 0;align-items:flex-start;${n.read ? 'opacity:.75;' : 'border-left:3px solid #22c55e;padding-left:10px;'}">
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:0.82rem;font-weight:700;">${n.user ? `Пользователь: ${n.user}` : 'Вызов администратора'}</div>
                            <div style="font-size:0.75rem;color:var(--color-muted);margin-top:2px;">${n.message || 'Пользователь позвал администратора'}</div>
                            <div style="font-size:0.72rem;color:var(--color-muted);margin-top:2px;">${Admin.fmtDateTime(n.time || n.date)}</div>
                            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                                <button class="btn btn-primary btn-sm" onclick="Admin.openIncomingCallChat('${chatIdSafe}','${notifIdSafe}')">Открыть чат</button>
                                ${n.read ? '' : `<button class="btn btn-ghost btn-sm" onclick="Admin.markIncomingCallRead('${notifIdSafe}')">Прочитано</button>`}
                            </div>
                        </div>
                    </div>
                `;}).join('')}
            </div>
        `;
        c.appendChild(incomingCard);
    }

    function send() {
        const title = document.getElementById('notifTitle')?.value?.trim();
        const text = document.getElementById('notifText')?.value?.trim();
        const type = document.getElementById('notifType')?.value || 'info';
        if (!text && !title) { App.showToast('Текст', 'warning'); return; }

        // Save to admin notification history
        const notifs = Admin.getNotifications();
        notifs.unshift({ id: Date.now(), title, text, type, date: new Date().toISOString() });
        Admin.saveNotifications(notifs);
        Admin.logAction('Уведомление', title || text);

        // Push to user-visible notification panel
        if (typeof Notifications !== 'undefined') {
            const typeIcons = { info: 'ℹ️', promo: '🎉', warning: '⚠️' };
            const notifType = type === 'promo' ? 'success' : type;
            Notifications.push(typeIcons[type] || '🔔', title || 'Сообщение от админа', text || '', notifType);
        }

        App.showToast('📤 Отправлено!', 'success');
        document.getElementById('notifTitle').value = '';
        document.getElementById('notifText').value = '';
        Admin.render();
    }

    Admin.registerTab('notifications', renderTab);
    Admin.sendNotification = send;
    Admin.markIncomingCallRead = _markIncomingRead;
    Admin.markAllIncomingCallsRead = _markAllIncomingRead;
    Admin.openIncomingCallChat = _openIncomingChat;
    Admin.openIncomingPayment = _openIncomingPayment;
})(Admin);