/* =====================================================
   ADMIN — Users Module (v3 — Multi-user from server)
   ===================================================== */

((Admin) => {
    let _selectedUserId = null;
    let _users = [];
    let _searchQuery = '';
    let _sortBy = 'newest';
    let _statusFilter = 'all';

    // ── helpers ─────────────────────────────────────────
    function _avatar(p) {
        if (p.avatar) return `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'">`;
        const initials = ((p.name || p.email || '?')[0]).toUpperCase();
        return `<span style="font-size:1.2rem;font-weight:800;color:var(--purple-400);">${initials}</span>`;
    }

    function _statusBadge(p) {
        if (p.blocked)    return `<span style="padding:2px 8px;background:rgba(239,68,68,0.12);color:#ef4444;border-radius:20px;font-size:0.68rem;font-weight:700;">🚫 Заблокирован</span>`;
        if (p.muted)      return `<span style="padding:2px 8px;background:rgba(245,158,11,0.12);color:#d97706;border-radius:20px;font-size:0.68rem;font-weight:700;">🔇 Замьючен</span>`;
        if (p.restricted) return `<span style="padding:2px 8px;background:rgba(59,130,246,0.12);color:#3b82f6;border-radius:20px;font-size:0.68rem;font-weight:700;">⛔ Ограничен</span>`;
        if (p.verified)   return `<span style="padding:2px 8px;background:rgba(34,197,94,0.12);color:#16a34a;border-radius:20px;font-size:0.68rem;font-weight:700;">✅ Верифицирован</span>`;
        return `<span style="padding:2px 8px;background:rgba(139,92,246,0.08);color:var(--purple-500);border-radius:20px;font-size:0.68rem;font-weight:700;">👤 Активен</span>`;
    }

    // ── tab render ───────────────────────────────────────
    async function renderUsersTab(c) {
        c.innerHTML = `
        <div class="admin-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap;">
                <h2 style="font-size:1.1rem;font-weight:800;margin:0;">👥 Пользователи</h2>
                <div style="display:flex;gap:8px;align-items:center;">
                    <input id="adminUsersSearch" type="text" class="input" placeholder="🔍 Поиск..." 
                        style="padding:8px 14px;font-size:0.82rem;width:180px;"
                        oninput="Admin.filterAdminUsers(this.value)">
                    <select class="input" style="padding:8px 12px;font-size:0.8rem;width:170px;" onchange="Admin.setAdminUsersSort(this.value)">
                        <option value="newest" ${_sortBy === 'newest' ? 'selected' : ''}>Сначала новые</option>
                        <option value="oldest" ${_sortBy === 'oldest' ? 'selected' : ''}>Сначала старые</option>
                        <option value="level_desc" ${_sortBy === 'level_desc' ? 'selected' : ''}>Уровень: по убыванию</option>
                        <option value="orders_desc" ${_sortBy === 'orders_desc' ? 'selected' : ''}>Заказы: по убыванию</option>
                        <option value="balance_desc" ${_sortBy === 'balance_desc' ? 'selected' : ''}>Баланс: по убыванию</option>
                        <option value="name_asc" ${_sortBy === 'name_asc' ? 'selected' : ''}>Имя: А-Я</option>
                    </select>
                    <select class="input" style="padding:8px 12px;font-size:0.8rem;width:160px;" onchange="Admin.setAdminUsersStatus(this.value)">
                        <option value="all" ${_statusFilter === 'all' ? 'selected' : ''}>Все статусы</option>
                        <option value="active" ${_statusFilter === 'active' ? 'selected' : ''}>Только активные</option>
                        <option value="blocked" ${_statusFilter === 'blocked' ? 'selected' : ''}>Заблокированные</option>
                        <option value="muted" ${_statusFilter === 'muted' ? 'selected' : ''}>Замьюченные</option>
                        <option value="restricted" ${_statusFilter === 'restricted' ? 'selected' : ''}>Ограниченные</option>
                    </select>
                    <button class="btn btn-secondary btn-sm" onclick="Admin.refreshAdminUsers()">🔄 Обновить</button>
                </div>
            </div>
            <div id="adminUsersList" style="display:flex;flex-direction:column;gap:10px;">
                <div style="text-align:center;color:var(--color-muted);padding:40px;">Загрузка...</div>
            </div>
        </div>`;

        await _loadUsers();
        _renderUsersList();
    }

    function _normalizeUser(profile = {}, keyHint = '', idx = 0) {
        const gidRaw = String(profile.googleId || '').trim();
        const inferredId = keyHint && keyHint.startsWith('tish_profile_') ? keyHint.replace('tish_profile_', '') : '';
        const fallbackId = gidRaw || inferredId || (profile.email ? ('email_' + String(profile.email).toLowerCase()) : ('local_' + idx));

        return {
            key: keyHint || ('tish_profile_' + fallbackId),
            googleId: fallbackId,
            name: profile.name || profile.username || profile.fullName || 'Без имени',
            email: profile.email || '',
            avatar: profile.avatar || profile.avatarUrl || null,
            joinDate: profile.joinDate || profile.createdAt || null,
            level: Number(profile.level || 1) || 1,
            balance: Number(profile.balance || profile.tishara || 0) || 0,
            blocked: !!profile.blocked,
            muted: !!profile.muted,
            restricted: !!profile.restricted,
            blockReason: profile.blockReason || '',
            orders: Number(profile.orders || 0) || 0
        };
    }

    function _loadUsersLocalFallback() {
        const map = new Map();

        const upsert = (profile, keyHint = '') => {
            const normalized = _normalizeUser(profile, keyHint, map.size + 1);
            const key = normalized.googleId || normalized.email || normalized.key;
            const prev = map.get(key) || {};
            map.set(key, {
                ...prev,
                ...normalized,
                name: normalized.name || prev.name || 'Без имени',
                email: normalized.email || prev.email || '',
                avatar: normalized.avatar || prev.avatar || null,
                joinDate: normalized.joinDate || prev.joinDate || null,
                level: Math.max(Number(normalized.level || 1), Number(prev.level || 1)),
                balance: Number(normalized.balance || prev.balance || 0),
                blocked: normalized.blocked || prev.blocked || false,
                muted: normalized.muted || prev.muted || false,
                restricted: normalized.restricted || prev.restricted || false,
                blockReason: normalized.blockReason || prev.blockReason || ''
            });
        };

        try {
            const active = JSON.parse(localStorage.getItem('tish_profile') || 'null');
            if (active && typeof active === 'object') upsert(active, 'tish_profile');
        } catch {}

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            if (key.startsWith('tish_profile_') && !key.includes('review')) {
                try {
                    const profile = JSON.parse(localStorage.getItem(key) || 'null');
                    if (profile && typeof profile === 'object') upsert(profile, key);
                } catch {}
            }

            if (key.startsWith('chat_support_')) {
                const gid = key.replace('chat_support_', '');
                if (!gid) continue;
                if (!map.has(gid)) {
                    upsert({ googleId: gid, name: 'Пользователь' }, 'tish_profile_' + gid);
                }
            }
        }

        if (!map.size) {
            const legacySupport = localStorage.getItem('chat_support');
            if (legacySupport) {
                upsert({ googleId: 'support_local', name: 'Пользователь' }, 'tish_profile_support_local');
            }
        }

        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
        } catch {
            orders = [];
        }

        const users = Array.from(map.values());
        users.forEach((u) => {
            u.orders = orders.filter((o) => String(o.userId || '') === String(u.googleId || '') || String(o.userEmail || '') === String(u.email || '')).length;
        });

        return users;
    }

    async function _loadUsers() {
        let loaded = [];

        try {
            const res = await fetch('/api/store/admin/users');
            const json = await res.json();
            if (json.success && Array.isArray(json.users)) {
                loaded = json.users;
            }
        } catch {}

        if (!loaded.length) {
            loaded = _loadUsersLocalFallback();
        }

        if (!loaded.length) {
            const p = Admin.getProfile();
            if (p && (p.googleId || p.email || p.name)) {
                loaded = [_normalizeUser(p, 'tish_profile', 1)];
            }
        }

        const unique = new Map();
        loaded.forEach((u, idx) => {
            const normalized = _normalizeUser(u, u.key || '', idx + 1);
            const key = normalized.googleId || normalized.email || ('local_' + idx);
            if (!unique.has(key)) unique.set(key, normalized);
            else {
                const prev = unique.get(key);
                unique.set(key, { ...prev, ...normalized, orders: Math.max(Number(prev.orders || 0), Number(normalized.orders || 0)) });
            }
        });

        _users = Array.from(unique.values());
    }

    function _renderUsersList() {
        const box = document.getElementById('adminUsersList');
        if (!box) return;

        const q = _searchQuery.toLowerCase();
        let filtered = q
            ? _users.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
            : [..._users];

        if (_statusFilter === 'active') {
            filtered = filtered.filter((u) => !u.blocked && !u.muted && !u.restricted);
        } else if (_statusFilter === 'blocked') {
            filtered = filtered.filter((u) => !!u.blocked);
        } else if (_statusFilter === 'muted') {
            filtered = filtered.filter((u) => !!u.muted);
        } else if (_statusFilter === 'restricted') {
            filtered = filtered.filter((u) => !!u.restricted);
        }

        const toTs = (v) => {
            const t = Date.parse(v || '');
            return Number.isNaN(t) ? 0 : t;
        };

        filtered.sort((a, b) => {
            switch (_sortBy) {
                case 'oldest':
                    return toTs(a.joinDate) - toTs(b.joinDate);
                case 'level_desc':
                    return Number(b.level || 0) - Number(a.level || 0);
                case 'orders_desc':
                    return Number(b.orders || 0) - Number(a.orders || 0);
                case 'balance_desc':
                    return Number(b.balance || 0) - Number(a.balance || 0);
                case 'name_asc':
                    return String(a.name || '').localeCompare(String(b.name || ''), 'ru');
                case 'newest':
                default:
                    return toTs(b.joinDate) - toTs(a.joinDate);
            }
        });

        if (!filtered.length) {
            box.innerHTML = `<div style="text-align:center;color:var(--color-muted);padding:40px;">
                ${_users.length ? 'Нет результатов поиска' : 'Нет пользователей. Они появятся когда кто-то войдёт в аккаунт.'}
            </div>`;
            return;
        }

        box.innerHTML = filtered.map(u => `
        <div style="display:grid;grid-template-columns:48px 1fr auto;gap:14px;align-items:center;
            background:var(--color-bg-elevated,#fff);border:1px solid var(--color-border);
            border-radius:16px;padding:14px 18px;
            ${_selectedUserId === u.googleId ? 'border-color:var(--purple-400);box-shadow:0 0 0 2px rgba(139,92,246,0.1);' : ''}">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(168,85,247,0.06));
                border:2px solid rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                ${_avatar(u)}
            </div>
            <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                    <span style="font-weight:700;font-size:0.9rem;">${u.name || 'Без имени'}</span>
                    ${_statusBadge(u)}
                </div>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <span style="font-size:0.75rem;color:var(--color-muted);">${u.email || '—'}</span>
                    <span style="font-size:0.75rem;color:var(--color-muted);">Ур. <strong>${u.level || 1}</strong></span>
                    <span style="font-size:0.75rem;color:var(--color-muted);">Заказов: <strong>${u.orders || 0}</strong></span>
                    <span style="font-size:0.75rem;color:var(--color-muted);">Баланс: <strong>${u.balance || 0} ✦</strong></span>
                </div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
                <button class="btn btn-ghost btn-sm" onclick="Admin.viewAdminUser('${u.googleId}')" style="padding:6px 10px;font-size:0.75rem;">
                    ℹ️ Инфо
                </button>
                <button class="btn btn-sm ${u.blocked ? 'btn-secondary' : ''}" onclick="Admin.toggleAdminUserBlock('${u.googleId}')"
                    style="padding:6px 10px;font-size:0.75rem;${u.blocked ? 'color:#16a34a;' : 'color:#ef4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);'}">
                    ${u.blocked ? '✅ Разблок.' : '🚫 Блок.'}
                </button>
                <button class="btn btn-sm" onclick="Admin.openAdminUserActions('${u.googleId}')"
                    style="padding:6px 10px;font-size:0.75rem;background:rgba(139,92,246,0.08);color:var(--purple-500);border:1px solid rgba(139,92,246,0.2);">
                    ⚡ Действия
                </button>
            </div>
        </div>
        `).join('');
    }

    function filterUsers(q) {
        _searchQuery = q;
        _renderUsersList();
    }

    function setSort(value) {
        _sortBy = value || 'newest';
        _renderUsersList();
    }

    function setStatusFilter(value) {
        _statusFilter = value || 'all';
        _renderUsersList();
    }

    async function refreshUsers() {
        await _loadUsers();
        _renderUsersList();
    }

    // ── user actions ─────────────────────────────────────
    function viewUser(googleId) {
        const u = _users.find(x => x.googleId === googleId);
        if (!u) return;
        Admin.showAdminModal({
            title: '👤 Профиль пользователя',
            width: '520px',
            hideFooter: true,
            body: `
            <div style="text-align:center;margin-bottom:20px;">
                <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(168,85,247,0.06));border:2px solid rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;overflow:hidden;margin:0 auto 12px;">
                    ${_avatar(u)}
                </div>
                <div style="font-weight:800;font-size:1.05rem;">${u.name || '—'}</div>
                <div style="color:var(--color-muted);font-size:0.82rem;">${u.email || '—'}</div>
                <div style="margin-top:8px;">${_statusBadge(u)}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                ${[
                ['Google ID', u.googleId || '—'],
                ['Уровень', u.level || 1],
                ['Баланс', (u.balance || 0) + ' ✦'],
                ['Заказов', u.orders || 0],
                ['Дата регистрации', u.joinDate ? new Date(u.joinDate).toLocaleDateString('ru') : '—'],
                ['Статус', u.blocked ? '🚫 Заблокирован' : u.muted ? '🔇 Замьючен' : '✅ Активен']
            ].map(([l, v]) => `<div style="padding:8px 12px;background:var(--color-bg);border-radius:10px;"><div style="font-size:0.68rem;color:var(--color-muted);margin-bottom:2px;">${l}</div><div style="font-weight:600;font-size:0.85rem;">${v}</div></div>`).join('')}
            </div>`
        });
    }

    async function toggleBlock(googleId) {
        const u = _users.find(x => x.googleId === googleId);
        if (!u) return;
        u.blocked = !u.blocked;
        try {
            await fetch('/api/store/admin/users/' + googleId + '/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocked: u.blocked })
            });
        } catch {}
        Admin.logAction(u.blocked ? 'Блокировка' : 'Разблокировка', u.name || u.email);
        App.showToast(u.blocked ? '🚫 Заблокирован' : '✅ Разблокирован', u.blocked ? 'warning' : 'success');
        _renderUsersList();
    }

    function openUserActions(googleId) {
        const u = _users.find(x => x.googleId === googleId);
        if (!u) return;
        _selectedUserId = googleId;
        Admin.showAdminModal({
            title: `⚡ Действия: ${u.name || u.email}`,
            width: '500px',
            body: `
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn btn-sm" onclick="Admin.toggleAdminUserBlock('${googleId}');document.querySelector('.admin-modal').remove();"
                        style="${u.blocked ? 'color:#16a34a;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);' : 'color:#ef4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);'}">
                        ${u.blocked ? '✅ Разблокировать' : '🚫 Заблокировать'}
                    </button>
                    <button class="btn btn-sm" onclick="Admin._adminToggleMute('${googleId}');document.querySelector('.admin-modal').remove();"
                        style="${u.muted ? 'color:#16a34a;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);' : 'color:#d97706;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);'}">
                        ${u.muted ? '🔊 Размьютить' : '🔇 Замьютить'}
                    </button>
                    <button class="btn btn-sm" onclick="Admin._adminToggleRestrict('${googleId}');document.querySelector('.admin-modal').remove();"
                        style="${u.restricted ? 'color:#16a34a;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);' : 'color:#3b82f6;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);'}">
                        ${u.restricted ? '🔓 Снять ограничения' : '⛔ Ограничить'}
                    </button>
                </div>
                <hr style="border:none;border-top:1px solid var(--color-border);">
                <div>
                    <div style="font-size:0.8rem;font-weight:700;margin-bottom:8px;">💰 Начислить TISHARA</div>
                    <div style="display:flex;gap:8px;">
                        <input type="number" class="input" id="actionsAmount" placeholder="100" min="1" style="width:100px;">
                        <input type="text" class="input" id="actionsReason" placeholder="Причина" style="flex:1;">
                        <button class="btn btn-primary btn-sm" onclick="Admin._adminAddTishara('${googleId}',document.getElementById('actionsAmount').value,document.getElementById('actionsReason').value);">+</button>
                    </div>
                </div>
            </div>`,
            footer: `<button class="btn btn-ghost btn-sm" onclick="document.querySelector('.admin-modal').remove();">Закрыть</button>`
        });
    }

    async function _setUserStatus(googleId, patch) {
        const u = _users.find(x => x.googleId === googleId);
        if (!u) return;
        Object.assign(u, patch);
        try {
            await fetch('/api/store/admin/users/' + googleId + '/status', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch)
            });
        } catch {}
        _renderUsersList();
    }

    async function _adminAddTishara(googleId, amountStr, reason) {
        const amount = parseInt(amountStr);
        if (!amount || amount <= 0) { App.showToast('Укажите количество', 'warning'); return; }
        // Read user's profile, update tishara, write back
        try {
            const res = await fetch('/api/store/data/tish_profile_' + googleId);
            const json = await res.json();
            const profile = json.value || {};
            profile.tishara = (profile.tishara || 0) + amount;
            if (!profile.tisharaHistory) profile.tisharaHistory = [];
            profile.tisharaHistory.unshift({ type: reason || 'Бонус от админа', label: reason || 'Бонус', value: amount, date: new Date().toISOString().split('T')[0] });
            await fetch('/api/store/data/tish_profile_' + googleId, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: profile })
            });
            Admin.logAction('TISHARA', `+${amount} → ${googleId}`);
            App.showToast(`+${amount} ✦ начислено`, 'success');
        } catch { App.showToast('Ошибка', 'error'); }
    }

    // Legacy single-user actions (forwarded from admin-main)
    function addTishara() {
        const amount = parseInt(document.getElementById('adminTisharaAmount')?.value);
        const reason = document.getElementById('adminTisharaReason')?.value?.trim() || 'Бонус от админа';
        if (!amount || amount <= 0) { App.showToast('Введите количество', 'warning'); return; }
        const p = Admin.getProfile();
        if (!p.googleId) { App.showToast('Выберите пользователя', 'warning'); return; }
        _adminAddTishara(p.googleId, String(amount), reason);
    }

    Admin.registerTab('users', renderUsersTab);
    Admin.filterAdminUsers = filterUsers;
    Admin.setAdminUsersSort = setSort;
    Admin.setAdminUsersStatus = setStatusFilter;
    Admin.refreshAdminUsers = refreshUsers;
    Admin.viewAdminUser = viewUser;
    Admin.toggleAdminUserBlock = toggleBlock;
    Admin.openAdminUserActions = openUserActions;
    Admin._adminToggleMute = (id) => _setUserStatus(id, { muted: !(_users.find(u => u.googleId === id)?.muted) });
    Admin._adminToggleRestrict = (id) => _setUserStatus(id, { restricted: !(_users.find(u => u.googleId === id)?.restricted) });
    Admin._adminAddTishara = _adminAddTishara;
    Admin.addTisharaToUser = addTishara;
    // Keep legacy stubs for any code referencing them
    Admin.toggleBlock = () => {};
    Admin.toggleMute = () => {};
    Admin.toggleRestrict = () => {};
    Admin.toggleVerify = () => {};
    Admin.quickTishara = (v) => { const p = Admin.getProfile(); if (p?.googleId) _adminAddTishara(p.googleId, String(v), 'Быстрый бонус'); };
    Admin.quickLevel = () => {};
    Admin.setUserLevel = () => {};
    Admin.openUserProfile = () => {};
})(Admin);