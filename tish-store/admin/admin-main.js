/* =====================================================
   TISH STORE — ADMIN CORE (admin-main.js)
   Auth, layout, tabs, universal modal, data helpers
   ===================================================== */

const Admin = (() => {
    let currentTab = 'dashboard';
    let isAuthenticated = false;
    let _adminNotifPollTimer = null;
    let _adminPresenceTimer = null;
    let _knownIncomingNotificationIds = new Set();
    let _lastSupportUnreadTotal = 0;
    let _presenceUnloadBound = false;
    let _badgeListenersBound = false;
    let _adminSharedSyncTimer = null;
    let _adminSharedSyncInFlight = false;

    // ===== AUTH =====
    function checkAuth() {
        return isAuthenticated;
    }

    async function _ensureAdminSessionRole() {
        try {
            const res = await fetch('/api/store/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: '' })
            });
            const json = await res.json();
            return !!(res.ok && json && json.success && json.admin);
        } catch {
            return false;
        }
    }

    async function _refreshAuthState() {
        const token = (typeof Security !== 'undefined' && typeof Security.getUserToken === 'function')
            ? Security.getUserToken()
            : (localStorage.getItem('tish_api_token') || '');

        if (!token) {
            isAuthenticated = false;
            return false;
        }

        try {
            const res = await fetch('/api/store/admin/validate-session');
            const json = await res.json();

            if (!res.ok || !json) {
                isAuthenticated = false;
                return false;
            }

            if (json.passwordRequired === false) {
                if (json.admin) {
                    isAuthenticated = true;
                    return true;
                }
                isAuthenticated = await _ensureAdminSessionRole();
                return isAuthenticated;
            }

            isAuthenticated = !!json.valid;
            return isAuthenticated;
        } catch {
            isAuthenticated = false;
            return false;
        }
    }

    function _readCallNotificationsLocal() {
        try {
            const raw = localStorage.getItem('tish_admin_notifications');
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function _isIncomingNotification(n) {
        return !!n && (n.type === 'call_admin' || n.type === 'payment_check');
    }

    function _getUnreadIncomingCount() {
        return _readCallNotificationsLocal().filter((n) => _isIncomingNotification(n) && !n.read).length;
    }

    function _updateSidebarNotificationBadge() {
        const btn = document.querySelector('.admin-sidebar__item[data-tab="notifications"]');
        if (!btn) return;
        const label = btn.querySelector('.admin-sidebar__item-label');
        if (!label) return;
        const count = _getUnreadIncomingCount();
        let badge = btn.querySelector('.admin-sidebar__badge');
        if (count <= 0) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'admin-sidebar__badge';
            label.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : String(count);
    }

    function _notificationId(n) {
        if (!n) return '';
        return String(n.id || `${n.chatId || ''}_${n.time || ''}_${n.message || ''}`);
    }

    function _playAdminCallSound() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const now = ctx.currentTime;

            const toneA = ctx.createOscillator();
            const gainA = ctx.createGain();
            toneA.type = 'sine';
            toneA.frequency.setValueAtTime(820, now);
            gainA.gain.setValueAtTime(0.0001, now);
            gainA.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
            gainA.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
            toneA.connect(gainA);
            gainA.connect(ctx.destination);
            toneA.start(now);
            toneA.stop(now + 0.2);

            const toneB = ctx.createOscillator();
            const gainB = ctx.createGain();
            toneB.type = 'sine';
            toneB.frequency.setValueAtTime(980, now + 0.18);
            gainB.gain.setValueAtTime(0.0001, now + 0.18);
            gainB.gain.exponentialRampToValueAtTime(0.12, now + 0.22);
            gainB.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
            toneB.connect(gainB);
            gainB.connect(ctx.destination);
            toneB.start(now + 0.18);
            toneB.stop(now + 0.36);

            setTimeout(() => {
                try { ctx.close(); } catch {}
            }, 500);
        } catch {}
    }

    async function _pollCallNotifications(notifyOnNew = true) {
        let notifications = _readCallNotificationsLocal();

        try {
            const res = await fetch('/api/store/data/tish_admin_notifications');
            const json = await res.json();
            const incoming = json.value !== undefined ? json.value : json.data;
            if (json.success && Array.isArray(incoming)) {
                notifications = incoming;
                localStorage.setItem('tish_admin_notifications', JSON.stringify(incoming));
            }
        } catch {}

        const callNotifs = notifications.filter((n) => _isIncomingNotification(n));
        let newCount = 0;

        callNotifs.forEach((n) => {
            const id = _notificationId(n);
            if (!id) return;
            if (!_knownIncomingNotificationIds.has(id)) {
                _knownIncomingNotificationIds.add(id);
                if (notifyOnNew) newCount++;
            }
        });

        _updateSidebarNotificationBadge();

        let newChatMessages = 0;
        try {
            const chatRes = await fetch('/api/store/admin/support-chats');
            const chatJson = await chatRes.json();
            if (chatJson.success && Array.isArray(chatJson.chats)) {
                const supportUnreadTotal = chatJson.chats.reduce((sum, chat) => sum + Number(chat.unread || 0), 0);
                if (notifyOnNew && supportUnreadTotal > _lastSupportUnreadTotal) {
                    newChatMessages = supportUnreadTotal - _lastSupportUnreadTotal;
                }
                _lastSupportUnreadTotal = supportUnreadTotal;
            }
        } catch {}

        const totalNew = newCount + newChatMessages;
        if (totalNew > 0) {
            const isBackground = document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus());
            if (!isBackground && typeof App !== 'undefined') {
                if (newCount > 0) {
                    App.showToast(`Новых входящих уведомлений: ${newCount}`, 'warning');
                }
                if (newChatMessages > 0) {
                    App.showToast(`Новых сообщений в чатах: ${newChatMessages}`, 'info');
                }
            }
            if (isBackground) {
                _playAdminCallSound();
            }
            document.dispatchEvent(new CustomEvent('adminCallNotificationsUpdated', {
                detail: { count: totalNew, notifications }
            }));
        }
    }

    function _startAdminRealtime() {
        if (_adminNotifPollTimer) return;
        _knownIncomingNotificationIds = new Set(_readCallNotificationsLocal()
            .filter((n) => _isIncomingNotification(n))
            .map(_notificationId)
            .filter(Boolean));
        _lastSupportUnreadTotal = 0;

        _pollCallNotifications(false);
        _adminNotifPollTimer = setInterval(() => {
            _pollCallNotifications(true);
        }, 8000);
    }

    function _stopAdminRealtime() {
        if (_adminNotifPollTimer) {
            clearInterval(_adminNotifPollTimer);
            _adminNotifPollTimer = null;
        }
    }

    function _buildAdminPresence(online = true) {
        const profile = getProfile() || {};
        return {
            online,
            isAdmin: true,
            role: 'admin',
            name: profile.name || 'Tish Team',
            googleId: profile.googleId || '',
            lastSeen: new Date().toISOString()
        };
    }

    function _writeAdminPresence(online = true) {
        const presence = _buildAdminPresence(online);
        localStorage.setItem('tish_admin_presence', JSON.stringify(presence));

        if (typeof Storage !== 'undefined') {
            if (typeof Storage.setNow === 'function') {
                Storage.setNow('tish_admin_presence', presence).catch(() => {
                    if (typeof Storage.set === 'function') Storage.set('tish_admin_presence', presence);
                });
            } else if (typeof Storage.set === 'function') {
                Storage.set('tish_admin_presence', presence);
            }
        }
    }

    function _startAdminPresence() {
        if (_adminPresenceTimer) return;

        const profile = getProfile();
        if (profile && profile.role !== 'admin') {
            profile.role = 'admin';
            saveProfile(profile);
        }

        _writeAdminPresence(true);
        _adminPresenceTimer = setInterval(() => {
            _writeAdminPresence(true);
        }, 15000);

        if (!_presenceUnloadBound) {
            _presenceUnloadBound = true;
            window.addEventListener('beforeunload', () => {
                if (checkAuth()) {
                    _writeAdminPresence(false);
                }
            });
        }
    }

    function _stopAdminPresence() {
        if (_adminPresenceTimer) {
            clearInterval(_adminPresenceTimer);
            _adminPresenceTimer = null;
        }
        _writeAdminPresence(false);
    }

    function _setLocalCacheKey(key, value) {
        if (typeof Storage !== 'undefined' && typeof Storage.set === 'function') {
            Storage.set(key, value);
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {}
    }

    async function _pullDataKey(key) {
        try {
            const res = await fetch('/api/store/data/' + encodeURIComponent(key));
            const json = await res.json();
            const value = json.value !== undefined ? json.value : json.data;
            if (res.ok && json.success && value !== undefined) {
                _setLocalCacheKey(key, value);
                return true;
            }
        } catch {}
        return false;
    }

    async function _syncSharedAdminData(silent = true) {
        if (!checkAuth()) return false;
        if (_adminSharedSyncInFlight) return false;

        _adminSharedSyncInFlight = true;
        try {
            const jobs = [];

            jobs.push((async () => {
                try {
                    const res = await fetch('/api/store/orders');
                    const json = await res.json();
                    if (res.ok && json.success && Array.isArray(json.orders)) {
                        _setLocalCacheKey('tish_orders', json.orders);
                    }
                } catch {}
            })());

            [
                'tish_admin_products',
                'tish_admin_log',
                'tish_admin_notifs',
                'tish_tishara_shop_products',
                'tish_admin_notifications',
                'tish_review_counts'
            ].forEach((key) => {
                jobs.push(_pullDataKey(key));
            });

            jobs.push((async () => {
                try {
                    const res = await fetch('/api/store/admin/users');
                    const json = await res.json();
                    if (res.ok && json.success && Array.isArray(json.users)) {
                        _setLocalCacheKey('tish_admin_users_cache', json.users);
                    }
                } catch {}
            })());

            jobs.push((async () => {
                try {
                    const res = await fetch('/api/store/admin/analytics/events?limit=5000');
                    const json = await res.json();
                    if (res.ok && json.success && Array.isArray(json.events)) {
                        _setLocalCacheKey('tish_analytics_events', json.events);
                    }
                } catch {}
            })());

            await Promise.allSettled(jobs);
            return true;
        } finally {
            _adminSharedSyncInFlight = false;
        }
    }

    function _startAdminSharedSync() {
        if (_adminSharedSyncTimer) return;
        _syncSharedAdminData(true);

        _adminSharedSyncTimer = setInterval(() => {
            if (!checkAuth()) {
                _stopAdminSharedSync();
                return;
            }
            _syncSharedAdminData(true);
        }, 10000);
    }

    function _stopAdminSharedSync() {
        if (_adminSharedSyncTimer) {
            clearInterval(_adminSharedSyncTimer);
            _adminSharedSyncTimer = null;
        }
    }

    async function openAdmin() {
        const ok = await _refreshAuthState();
        ok ? App.showPage('admin') : login();
    }

    function login() {
        showAdminModal({
            title: '🔐 Вход в админ-панель',
            body: `<div class="admin-form-group"><label class="admin-form-label">Пароль</label>
                   <input type="password" class="input" id="adminPasswordInput" placeholder="Введите пароль" autofocus></div>`,
            confirmText: 'Войти',
            onConfirm: async () => {
                const pwd = (document.getElementById('adminPasswordInput')?.value || '').trim();

                try {
                    const checkRes = await fetch('/api/store/admin/check-auth');
                    const checkJson = await checkRes.json();
                    const required = !!checkJson?.required;

                    if (required && !pwd) {
                        App.showToast('Введите пароль', 'warning');
                        return;
                    }

                    const res = await fetch('/api/store/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: pwd || '' })
                    });
                    const json = await res.json();

                    if (!res.ok || !json?.success) {
                        App.showToast(json?.error || 'Неверный пароль', 'error');
                        return;
                    }

                    isAuthenticated = true;
                    if (typeof Security !== 'undefined' && typeof Security.setAdminToken === 'function') {
                        const userToken = typeof Security.getUserToken === 'function' ? Security.getUserToken() : '';
                        if (userToken) Security.setAdminToken(userToken);
                    }

                    logAction('Вход в админ-панель');
                    _startAdminRealtime();
                    _startAdminPresence();
                    _startAdminSharedSync();
                    await _syncSharedAdminData(true);
                    closeAdminModal();
                    App.showToast('Вход в админ-панель ✅', 'success');
                    App.showPage('admin');
                } catch (e) {
                    App.showToast('Сервер недоступен', 'error');
                }
            }
        });
    }

    function logout() {
        isAuthenticated = false;
        if (typeof Security !== 'undefined' && typeof Security.clearAdminToken === 'function') {
            Security.clearAdminToken();
        }
        fetch('/api/store/admin/logout', { method: 'POST' }).catch(() => {});
        _stopAdminRealtime();
        _stopAdminPresence();
        _stopAdminSharedSync();
        App.showPage('catalog');
        App.showToast('Вышли из админ-панели', 'info');
    }

    // ===== UNIVERSAL MODAL =====
    function showAdminModal(opts) {
        let modal = document.getElementById('adminUniversalModal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'profile-modal is-open';
        modal.id = 'adminUniversalModal';
        modal.innerHTML = `
            <div class="profile-modal__backdrop" onclick="Admin.closeAdminModal()"></div>
            <div class="profile-modal__container" style="max-width:${opts.width || '520px'}">
                <div class="profile-modal__header">
                    <div class="profile-modal__title">${opts.title || 'Действие'}</div>
                    <button class="profile-modal__close" onclick="Admin.closeAdminModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="profile-modal__body">${opts.body || ''}</div>
                ${opts.hideFooter ? '' : `
                <div class="profile-modal__footer">
                    <button class="btn btn-secondary btn-sm" onclick="Admin.closeAdminModal()">Отмена</button>
                    <button class="btn btn-primary btn-sm" id="adminModalConfirmBtn">${opts.confirmText || 'Подтвердить'}</button>
                </div>`}
            </div>`;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        if (opts.onConfirm) {
            document.getElementById('adminModalConfirmBtn')?.addEventListener('click', opts.onConfirm);
        }
        setTimeout(() => {
            const inp = modal.querySelector('input:not([type=hidden]),textarea,select');
            if (inp) inp.focus();
        }, 100);

        if (opts.onConfirm) {
            modal.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.target.matches('textarea')) {
                    e.preventDefault();
                    opts.onConfirm();
                }
            });
        }
    }

    function closeAdminModal() {
        const m = document.getElementById('adminUniversalModal');
        if (m) { m.remove(); document.body.style.overflow = ''; }
    }

    // ===== DATA HELPERS (shared across all modules) =====
    const _sync = (k, v) => { if (typeof Storage !== 'undefined' && Storage.set) Storage.set(k, v); };
    const TISHARA_SHOP_KEY = 'tish_tishara_shop_products';
    const DEFAULT_TISHARA_SHOP_PRODUCTS = [
        { id:'d3', name:'Скидка 3%', percent:3, cost:100, icon:'tag', description:'Персональный промокод', active:true },
        { id:'d5', name:'Скидка 5%', percent:5, cost:150, icon:'tag', description:'Персональный промокод', active:true },
        { id:'d7', name:'Скидка 7%', percent:7, cost:200, icon:'zap', description:'Персональный промокод', active:true },
    ];

    function _readStore(key, fallback) {
        if (typeof Storage !== 'undefined' && typeof Storage.get === 'function') {
            return Storage.get(key, fallback);
        }
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function _writeStore(key, value) {
        if (typeof Storage !== 'undefined' && typeof Storage.setNow === 'function') {
            Storage.setNow(key, value).catch(() => {
                if (typeof Storage.set === 'function') Storage.set(key, value);
            });
        } else if (typeof Storage !== 'undefined' && typeof Storage.set === 'function') {
            Storage.set(key, value);
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {}
    }

    function getOrders() { return _readStore('tish_orders', []); }
    function saveOrders(o) { _writeStore('tish_orders', o); }
    function getProfile() { return _readStore('tish_profile', {}); }
    function saveProfile(p) { _writeStore('tish_profile', p); }
    function getProducts() { return _readStore('tish_admin_products', []); }
    function saveProducts(p) { _writeStore('tish_admin_products', p); }
    function getAdminLog() { return _readStore('tish_admin_log', []); }
    function saveAdminLog(l) { _writeStore('tish_admin_log', l); }
    function getAdminNfts() { return _readStore('tish_admin_nfts', []); }
    function saveAdminNfts(n) { _writeStore('tish_admin_nfts', n); }
    function getAdminCollections() { return _readStore('tish_admin_collections', []); }
    function saveAdminCollections(c) { _writeStore('tish_admin_collections', c); }
    function getAdminCases() { return _readStore('tish_admin_cases', []); }
    function saveAdminCases(c) { _writeStore('tish_admin_cases', c); }
    function getAchievements() { return _readStore('tish_admin_achievements', []); }
    function saveAchievements(a) { _writeStore('tish_admin_achievements', a); }
    function getNotifications() { return _readStore('tish_admin_notifs', []); }
    function saveNotifications(n) { _writeStore('tish_admin_notifs', n); }
    function getSiteSettings() { return _readStore('tish_site_settings', {}); }
    function saveSiteSettings(s) { _writeStore('tish_site_settings', s); }
    function getRefSettings() { return _readStore('tish_ref_settings', { regBonus: 50, firstPurchaseBonus: 100, percentFromPurchases: 5, maxReferrals: 50 }); }
    function saveRefSettings(s) { _writeStore('tish_ref_settings', s); }
    function getTisharaShopProducts() {
        const parsed = _readStore(TISHARA_SHOP_KEY, null);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        return DEFAULT_TISHARA_SHOP_PRODUCTS.map((item) => ({ ...item }));
    }
    function saveTisharaShopProducts(items) {
        const safe = Array.isArray(items) ? items : [];
        _writeStore(TISHARA_SHOP_KEY, safe);
    }

    function logAction(action, details) {
        const log = getAdminLog();
        log.unshift({ id: Date.now(), action, details: details || '', date: new Date().toISOString() });
        if (log.length > 200) log.length = 200;
        saveAdminLog(log);
    }

    function fmtDate(d) {
        if (!d) return '';
        const dt = new Date(d);
        const m = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
        return `${dt.getDate()} ${m[dt.getMonth()]}`;
    }

    function fmtDateTime(d) {
        if (!d) return '';
        const dt = new Date(d);
        return `${fmtDate(d)} ${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
    }

    function syncProfile() {
        if (typeof Profile === 'undefined') return;
        if (typeof Profile.renderAll === 'function') {
            try {
                Profile.renderAll();
                return;
            } catch {}
        }
        if (typeof Profile.init === 'function') {
            try { Profile.init(); } catch {}
        }
    }

    function ic(svg) {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svg}</svg>`;
    }

    // ===== STATUS CONFIG =====
    const STATUS = {
        'pending_prepayment': { label: 'Ожидает предоплату', color: '#f59e0b', icon: '⏳' },
        'prepayment_verification': { label: 'Предоплата на проверке', color: '#f97316', icon: '🧾' },
        'prepaid': { label: 'Предоплачен', color: '#3b82f6', icon: '💳' },
        'in_progress': { label: 'В работе', color: '#8b5cf6', icon: '🔨' },
        'invoice_sent': { label: 'Счёт выставлен', color: '#f59e0b', icon: '📄' },
        'payment_verification': { label: 'Оплата на проверке', color: '#f97316', icon: '🧾' },
        'paid': { label: 'Оплачен', color: '#22c55e', icon: '✅' },
        'completed': { label: 'Завершён', color: '#16a34a', icon: '🎉' }
    };

    // ===== TABS CONFIG =====
    const TABS = [
        { id:'dashboard', label:'Дашборд', icon:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
        { id:'products', label:'Товары', icon:'<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>' },
        { id:'tishara_shop', label:'Магазин TISHARA', icon:'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>' },
        { id:'nft', label:'NFT', icon:'<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/>' },
        { id:'users', label:'Пользователи', icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' },
        { id:'orders', label:'Заказы', icon:'<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>' },
        { id:'achievements', label:'Достижения', icon:'<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>' },
        { id:'reviews', label:'Отзывы', icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
        { id:'chat', label:'Чат', icon:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
        { id:'notifications', label:'Уведомления', icon:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
        { id:'referrals', label:'Рефералы', icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' },
        { id:'settings', label:'Настройки', icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1.08H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82V4.68a2 2 0 1 1 2.83-2.83l.06.06c.5.5 1.21.71 1.82.33H9c.49-.19.85-.63.91-1.13V3a2 2 0 0 1 4 0v.09c.06.5.42.94.91 1.13.5.18 1.1.01 1.52-.41l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.42.42-.59 1.02-.41 1.52.18.49.63.85 1.13.91H21a2 2 0 0 1 0 4h-.09c-.5.06-.94.42-1.13.91z"/>' },
        { id:'analytics', label:'Аналитика', icon:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
    ];

    // ===== MAIN RENDER =====
    function render() {
        const container = document.querySelector('#page-admin .container');
        if (!container) return;

        if (!checkAuth()) {
            _stopAdminRealtime();
            _stopAdminPresence();
            _stopAdminSharedSync();
            container.innerHTML = `
                <div style="text-align:center;padding:100px 20px;">
                    <div style="width:80px;height:80px;margin:0 auto 20px;border-radius:50%;background:var(--purple-50);display:flex;align-items:center;justify-content:center;">
                        ${ic('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>')}
                    </div>
                    <h2 style="font-family:var(--font-mono);font-weight:800;font-size:1.5rem;margin-bottom:8px;">Админ-панель</h2>
                    <p style="color:var(--color-muted);margin-bottom:24px;">Введите пароль для входа</p>
                    <button class="btn btn-primary" onclick="Admin.login()">Войти</button>
                </div>`;
            return;
        }

        _startAdminRealtime();
        _startAdminPresence();
        _startAdminSharedSync();

        container.innerHTML = `
            <div class="admin-page">
                <div class="admin-header">
                    <div>
                        <h1 class="admin-header__title">Панель управления</h1>
                        <p style="color:var(--color-muted);font-size:0.85rem;margin-top:4px;">TISH STORE Admin</p>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span class="admin-header__badge">${ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>')} ADMIN</span>
                        <button class="btn btn-ghost btn-sm" onclick="Admin.logout()" style="color:#ef4444;">
                            ${ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>')} Выйти
                        </button>
                    </div>
                </div>
                <div class="admin-layout">
                    <div class="admin-sidebar" id="adminSidebar">
                        ${TABS.map(t => `
                            <button class="admin-sidebar__item ${currentTab===t.id?'active':''}" data-tab="${t.id}" onclick="Admin.switchTab('${t.id}')">
                                ${ic(t.icon)}
                                <span class="admin-sidebar__item-label">
                                    ${t.label}
                                    ${t.id === 'notifications' && _getUnreadIncomingCount() > 0 ? `<span class="admin-sidebar__badge">${_getUnreadIncomingCount() > 99 ? '99+' : _getUnreadIncomingCount()}</span>` : ''}
                                </span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="admin-content" id="adminTabContent"></div>
                </div>
            </div>`;
        renderTab();
        _updateSidebarNotificationBadge();
        _syncSharedAdminData(true).then(() => {
            renderTab();
            _updateSidebarNotificationBadge();
        });
    }

    function switchTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.admin-sidebar__item').forEach(t =>
            t.classList.toggle('active', t.dataset.tab === tab)
        );
        renderTab();
        _updateSidebarNotificationBadge();
        _syncSharedAdminData(true).then(() => {
            if (currentTab === tab) {
                renderTab();
                _updateSidebarNotificationBadge();
            }
        });
    }

    function renderTab() {
        const c = document.getElementById('adminTabContent');
        if (!c) return;

        // Each module registers its renderer
        const renderers = Admin._renderers || {};
        const fn = renderers[currentTab];
        if (fn) {
            fn(c);
        } else {
            c.innerHTML = `<div class="admin-empty"><p>Модуль "${currentTab}" не загружен</p></div>`;
        }
    }

    // Module registration system
    const _renderers = {};
    function registerTab(tabId, renderFn) {
        _renderers[tabId] = renderFn;
    }

    // ===== INIT =====
    async function init() {
        await _refreshAuthState();
        render();
        if (checkAuth()) {
            _startAdminSharedSync();
            _syncSharedAdminData(true);
        }
        if (!_badgeListenersBound) {
            _badgeListenersBound = true;
            window.addEventListener('storage', (e) => {
                if (e.key === 'tish_admin_notifications') {
                    _updateSidebarNotificationBadge();
                }
            });
            document.addEventListener('adminCallNotificationsUpdated', () => {
                _updateSidebarNotificationBadge();
            });
        }
    }

    // ===== PUBLIC API =====
    return {
        // Core
        init, login, logout, openAdmin, checkAuth, switchTab, render,
        refreshSharedData: _syncSharedAdminData,
        showAdminModal, closeAdminModal,
        registerTab,
        _renderers,

        // Data helpers (used by all sub-modules)
        getOrders, saveOrders,
        getProfile, saveProfile,
        getProducts,saveProducts,
        getAdminLog, saveAdminLog,
        getAdminNfts, saveAdminNfts,
        getAdminCollections, saveAdminCollections,
        getAdminCases, saveAdminCases,
        getAchievements, saveAchievements,
        getNotifications, saveNotifications,
        getSiteSettings, saveSiteSettings,
        getRefSettings, saveRefSettings,
        getTisharaShopProducts, saveTisharaShopProducts,
        logAction, fmtDate, fmtDateTime,
        syncProfile, ic, STATUS, TABS,

        // Product modal (delegated)
        openAddProduct: () => { const m = document.getElementById('adminProductModal'); if(m){m.classList.add('is-open');document.body.style.overflow='hidden';} },
        closeProductModal: () => { const m = document.getElementById('adminProductModal'); if(m){m.classList.remove('is-open');document.body.style.overflow='';} },
        saveProduct: () => {
            const form = document.getElementById('adminProductForm');
            if (!form) return;
            const title = form.querySelector('[name=title]')?.value?.trim();
            if (!title) { App.showToast('Введите название','warning'); return; }
            Admin.logAction('Товар создан', title);
            App.showToast(`Товар "${title}" создан ✅`, 'success');
            Admin.closeProductModal();
        }
    };
})();