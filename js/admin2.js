/* =====================================================
   TISH TEAM — ADMIN2.JS
   Исправления: Auth, Online, Loading, DetailModals,
   Statistics, Password validation
   ===================================================== */

// ═══════════════════════════════════════
// SESSION ID — уникальный для каждого пользователя
// ═══════════════════════════════════════
const AdminSession = {
    _id: null,

    getId() {
        if (this._id) return this._id;
        let id = sessionStorage.getItem('tish_session_id');
        if (!id) {
            id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('tish_session_id', id);
        }
        this._id = id;
        return id;
    },

    clear() {
        sessionStorage.removeItem('tish_session_id');
        sessionStorage.removeItem('tish_admin_auth');
        sessionStorage.removeItem('tish_admin_auth_time');
        this._id = null;
    }
};

// ═══════════════════════════════════════
// LOADING SCREEN — исправляет мигание формы
// ═══════════════════════════════════════
class LoadingScreen {
    constructor() {
        this._el = null;
        this._styleEl = null;
        this.create();
    }

    create() {
        if (document.getElementById('admin-loading-screen')) return;

        this._styleEl = document.createElement('style');
        this._styleEl.textContent = `
            #admin-loading-screen {
                position: fixed; inset: 0; z-index: 99999;
                background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #faf5ff 100%);
                display: flex; align-items: center; justify-content: center;
                transition: opacity 0.5s ease, visibility 0.5s ease;
            }
            [data-theme="dark"] #admin-loading-screen {
                background: linear-gradient(135deg, #0f0a1a 0%, #1a1025 50%, #0f0a1a 100%);
            }
            #admin-loading-screen.hidden {
                opacity: 0; visibility: hidden; pointer-events: none;
            }
            .als-content { text-align: center; }
            .als-logo {
                width: 72px; height: 72px;
                background: linear-gradient(135deg, #9333ea, #d946ef);
                border-radius: 18px;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Space Grotesk', monospace;
                font-size: 1.6rem; font-weight: 700; color: white;
                margin: 0 auto 20px;
                animation: alsLogoPulse 2s ease-in-out infinite;
                box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
            }
            .als-spinner {
                width: 36px; height: 36px;
                border: 3px solid rgba(139, 92, 246, 0.15);
                border-top-color: #a855f7;
                border-radius: 50%;
                margin: 0 auto 14px;
                animation: alsSpin 0.8s linear infinite;
            }
            .als-text {
                color: #9ca3af;
                font-family: 'Poppins', sans-serif;
                font-size: 0.85rem;
            }
            [data-theme="dark"] .als-text { color: #6b7280; }
            @keyframes alsLogoPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            @keyframes alsSpin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(this._styleEl);

        this._el = document.createElement('div');
        this._el.id = 'admin-loading-screen';
        this._el.innerHTML = `
            <div class="als-content">
                <div class="als-logo">Ti</div>
                <div class="als-spinner"></div>
                <div class="als-text">Загрузка панели...</div>
            </div>
        `;
        document.body.insertBefore(this._el, document.body.firstChild);
    }

    hide() {
        if (this._el) {
            this._el.classList.add('hidden');
            setTimeout(() => {
                if (this._el && this._el.parentNode) this._el.remove();
                if (this._styleEl && this._styleEl.parentNode) this._styleEl.remove();
            }, 500);
        }
    }
}

// ═══════════════════════════════════════
// AUTH SYSTEM V2 — заменяет старую
// Исправляет: мигание, пароль, сессия
// ═══════════════════════════════════════
class AuthSystemV2 {
    constructor(store) {
        this.store = store;
        this.form = document.getElementById('login-form');
        this.passInput = document.getElementById('login-password');
        this.errorEl = document.getElementById('login-error');
        this.btn = document.getElementById('login-btn');
        this.loadingScreen = new LoadingScreen();

        // Скрываем ВСЁ до проверки — именно это фиксит мигание
        const login = document.getElementById('login-screen');
        const admin = document.getElementById('admin-layout');
        if (login) { login.style.visibility = 'hidden'; login.style.opacity = '0'; }
        if (admin) { admin.style.visibility = 'hidden'; admin.style.opacity = '0'; }

        if (!this.form) {
            this.loadingScreen.hide();
            return;
        }

        this.form.addEventListener('submit', e => this.login(e));
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        document.getElementById('toggle-password')?.addEventListener('click', () => {
            if (this.passInput) {
                this.passInput.type = this.passInput.type === 'password' ? 'text' : 'password';
            }
        });
        this.passInput?.addEventListener('input', () => {
            this.passInput.classList.remove('error');
            this.errorEl?.classList.remove('visible');
        });

        // Запускаем проверку
        this.checkAuth();
    }

    async checkAuth() {
        console.log('🔐 AuthV2: checking authorization...');

        try {
            const res = await fetch('/api/admin/check-auth');
            if (!res.ok) throw new Error('Server error');

            const { required } = await res.json();
            console.log('🔐 AuthV2: password required =', required);

            if (!required) {
                // Пароль НЕ установлен — прямой доступ
                this._showAdmin();
                return;
            }

            // Пароль установлен — проверяем сессию на СЕРВЕРЕ
            const hasSession = sessionStorage.getItem('tish_admin_auth') === 'true';
            if (hasSession) {
                // Валидируем сессию на сервере (вдруг пароль поменяли)
                const valid = await this._validateServerSession();
                if (valid) {
                    console.log('🔐 AuthV2: session still valid');
                    this._showAdmin();
                    return;
                }
                // Сессия невалидна — очищаем
                console.log('🔐 AuthV2: session invalidated (password changed on server)');
                sessionStorage.removeItem('tish_admin_auth');
                sessionStorage.removeItem('tish_admin_auth_time');
            }

            // Показываем форму логина
            this._showLogin();

        } catch (err) {
            console.warn('🔐 AuthV2: server check failed:', err.message);
            // Сервер недоступен — показываем логин (безопасный вариант)
            this._showLogin();
        }
    }

    async _validateServerSession() {
        try {
            const res = await fetch('/api/admin/validate-session');
            if (!res.ok) return false;
            const { valid, passwordRequired } = await res.json();
            // Если пароль больше не требуется — сессия валидна
            if (!passwordRequired) return true;
            // Если пароль требуется — возвращаем серверный ответ
            return valid;
        } catch {
            return false;
        }
    }

    _showLogin() {
        const login = document.getElementById('login-screen');
        const admin = document.getElementById('admin-layout');
        if (login) {
            login.classList.remove('hidden');
            login.style.visibility = 'visible';
            login.style.opacity = '1';
        }
        if (admin) {
            admin.classList.remove('visible');
            admin.style.visibility = 'hidden';
            admin.style.opacity = '0';
        }
        this.loadingScreen.hide();
    }

    _showAdmin() {
        const login = document.getElementById('login-screen');
        const admin = document.getElementById('admin-layout');
        if (login) {
            login.classList.add('hidden');
            login.style.visibility = 'hidden';
            login.style.opacity = '0';
        }
        if (admin) {
            admin.classList.add('visible');
            admin.style.visibility = 'visible';
            admin.style.opacity = '1';
        }
        if (this.btn) this.btn.classList.remove('loading');
        this.loadingScreen.hide();
    }

    async login(e) {
        e.preventDefault();
        const pw = this.passInput?.value?.trim();
        if (!pw) {
            this.passInput?.classList.add('error');
            return;
        }

        if (this.btn) this.btn.classList.add('loading');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw })
            });

            if (res.ok) {
                sessionStorage.setItem('tish_admin_auth', 'true');
                sessionStorage.setItem('tish_admin_auth_time', Date.now().toString());
                this._showAdmin();
                Toast.show('Добро пожаловать!', 'success');
                return;
            }

            this._showError('⚠️ Неверный пароль');

        } catch (err) {
            console.warn('Login error:', err.message);
            this._showError('⚠️ Ошибка сервера');
        }
    }

    _showError(msg) {
        this.passInput?.classList.add('error');
        if (this.errorEl) {
            this.errorEl.textContent = msg;
            this.errorEl.classList.add('visible');
        }
        if (this.btn) this.btn.classList.remove('loading');
    }

    logout() {
        if (AdminApp.hasUnsavedChanges()) {
            if (!confirm('Есть несохранённые изменения. Выйти?')) return;
        }
        AdminSession.clear();
        this._showLogin();
        if (this.passInput) this.passInput.value = '';
        if (this.btn) this.btn.classList.remove('loading');
    }
}

// ═══════════════════════════════════════
// ONLINE COUNTER — уникальные пользователи
// ═══════════════════════════════════════
class OnlineCounterV2 {
    constructor() {
        this.sessionId = AdminSession.getId();
        this._sse = null;
        this._reconnectTimeout = null;
        this.connect();
    }

    connect() {
        if (this._sse) {
            try { this._sse.close(); } catch {}
        }

        try {
            this._sse = new EventSource(`/api/sse?sessionId=${encodeURIComponent(this.sessionId)}`);

            this._sse.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'clients' || data.type === 'connected') {
                        const count = data.uniqueUsers ?? data.count ?? 0;
                        const el = document.getElementById('online-count');
                        if (el) el.textContent = count;
                    }

                    // Обработка смены пароля — разлогинить
                    if (data.type === 'password_changed') {
                        console.log('🔐 Password changed remotely — re-checking auth');
                        sessionStorage.removeItem('tish_admin_auth');
                        // Перезагрузить страницу для повторной проверки
                        if (data.hasPassword) {
                            Toast.show('Пароль изменён. Требуется повторный вход.', 'warning');
                            setTimeout(() => location.reload(), 2000);
                        }
                    }

                    // Обработка обновления данных
                    if (data.type === 'update') {
                        // Можно добавить автообновление данных
                    }
                } catch {}
            };

            this._sse.onerror = () => {
                console.warn('SSE error, will reconnect...');
                this._sse.close();
                this._reconnectTimeout = setTimeout(() => this.connect(), 5000);
            };
        } catch (e) {
            console.warn('SSE not available:', e);
        }
    }

    destroy() {
        if (this._sse) { try { this._sse.close(); } catch {} }
        if (this._reconnectTimeout) clearTimeout(this._reconnectTimeout);
    }
}

// ═══════════════════════════════════════
// DETAIL MODALS — клик на статистику
// ═══════════════════════════════════════
class DetailModals {
    constructor(store) {
        this.store = store;
        this._createModal();
        this._bindStatCards();
    }

    _createModal() {
        if (document.getElementById('detail-modal')) return;

        const style = document.createElement('style');
        style.textContent = `
            .dm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
            .dm-card {
                display: flex; gap: 14px; padding: 16px;
                background: rgba(139,92,246,0.03);
                border: 1px solid rgba(139,92,246,0.1);
                border-radius: 12px; transition: all 0.2s;
            }
            .dm-card:hover { border-color: rgba(139,92,246,0.25); }
            .dm-card__icon {
                width: 44px; height: 44px;
                background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(168,85,247,0.1));
                border-radius: 12px; display: flex; align-items: center; justify-content: center;
                font-size: 1.4rem; flex-shrink: 0;
            }
            .dm-card__info h4 { margin: 0 0 4px; font-size: 0.92rem; font-weight: 600; color: #4a3f5c; }
            .dm-card__info p { margin: 0 0 6px; font-size: 0.78rem; color: #9ca3af; }
            .dm-badge {
                display: inline-block; padding: 2px 8px;
                background: rgba(139,92,246,0.1); border-radius: 100px;
                font-size: 0.68rem; color: #a855f7;
            }
            .dm-info {
                padding: 10px 14px; background: rgba(139,92,246,0.04);
                border-radius: 8px; margin-bottom: 14px;
                font-size: 0.83rem; color: #6b7280;
            }
            .dm-photos {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;
            }
            .dm-photo {
                position: relative; aspect-ratio: 4/3;
                border-radius: 10px; overflow: hidden;
            }
            .dm-photo img, .dm-photo video { width: 100%; height: 100%; object-fit: cover; }
            .dm-photo__ov {
                position: absolute; inset: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
                display: flex; flex-direction: column; justify-content: flex-end;
                padding: 8px; opacity: 0; transition: opacity 0.2s;
            }
            .dm-photo:hover .dm-photo__ov { opacity: 1; }
            .dm-photo__ov span { color: white; font-size: 0.75rem; font-weight: 500; }
            .dm-photo__ov small { color: rgba(255,255,255,0.7); font-size: 0.65rem; }
            .dm-team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
            .dm-team-card {
                display: flex; gap: 14px; padding: 14px;
                background: white; border: 1px solid rgba(139,92,246,0.1);
                border-radius: 12px;
            }
            .dm-team-av {
                position: relative; width: 52px; height: 52px;
                border-radius: 14px; overflow: hidden;
                background: linear-gradient(135deg, #9333ea, #d946ef);
                display: flex; align-items: center; justify-content: center;
                flex-shrink: 0;
            }
            .dm-team-av img { width: 100%; height: 100%; object-fit: cover; }
            .dm-team-av > span { color: white; font-size: 1.2rem; font-weight: 600; }
            .dm-status {
                position: absolute; bottom: 1px; right: 1px;
                width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;
            }
            .dm-status--online { background: #22c55e; }
            .dm-status--busy { background: #f59e0b; }
            .dm-status--offline { background: #9ca3af; }
            .dm-team-info h4 { margin: 0 0 3px; font-size: 0.9rem; font-weight: 600; color: #4a3f5c; }
            .dm-team-info p { margin: 0 0 6px; font-size: 0.78rem; color: #9ca3af; }
            .dm-team-tags { display: flex; flex-wrap: wrap; gap: 4px; }
            .dm-team-tags span {
                padding: 2px 8px; background: rgba(139,92,246,0.08);
                border-radius: 100px; font-size: 0.63rem; color: #a855f7;
            }
            .dm-changes { display: flex; flex-direction: column; gap: 6px; }
            .dm-ch-item {
                display: flex; align-items: center; gap: 10px;
                padding: 8px 12px; background: rgba(139,92,246,0.02);
                border-radius: 8px;
            }
            .dm-ch-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
            .dm-ch-item--success .dm-ch-dot { background: #22c55e; }
            .dm-ch-item--warning .dm-ch-dot { background: #f59e0b; }
            .dm-ch-item--error .dm-ch-dot { background: #ef4444; }
            .dm-ch-item--info .dm-ch-dot { background: #3b82f6; }
            .dm-ch-text { flex: 1; font-size: 0.83rem; color: #4a3f5c; }
            .dm-ch-time { font-size: 0.72rem; color: #9ca3af; white-space: nowrap; }
            .dm-storage { padding: 16px; }
            .dm-stor-bar { height: 20px; background: rgba(139,92,246,0.1); border-radius: 10px; overflow: hidden; display: flex; margin-bottom: 20px; }
            .dm-stor-fill--data { background: linear-gradient(90deg, #9333ea, #a855f7); }
            .dm-stor-fill--uploads { background: linear-gradient(90deg, #22c55e, #4ade80); }
            .dm-stor-items { display: grid; gap: 10px; }
            .dm-stor-item {
                display: flex; align-items: center; gap: 10px;
                padding: 10px 14px; background: rgba(139,92,246,0.03);
                border-radius: 10px;
            }
            .dm-stor-item--total {
                background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(168,85,247,0.08));
                font-weight: 600;
            }
            .dm-stor-icon { font-size: 1.1rem; }
            .dm-stor-label { flex: 1; color: #6b7280; font-size: 0.85rem; }
            .dm-stor-val { font-family: 'Space Grotesk', monospace; font-weight: 600; color: #4a3f5c; }
            [data-theme="dark"] .dm-card, [data-theme="dark"] .dm-team-card {
                background: rgba(20,20,50,0.8); border-color: rgba(139,92,246,0.15);
            }
            [data-theme="dark"] .dm-card__info h4, [data-theme="dark"] .dm-team-info h4,
            [data-theme="dark"] .dm-ch-text, [data-theme="dark"] .dm-stor-val { color: #e5dff0; }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = 'detail-modal';
        modal.innerHTML = `
            <div class="admin-modal__backdrop" onclick="window._detailModals?.close()"></div>
            <div class="admin-modal__container" style="max-width:880px;max-height:82vh;">
                <div class="admin-modal__header">
                    <h3 class="admin-modal__title" id="dm-title">Детали</h3>
                    <button class="admin-modal__close" onclick="window._detailModals?.close()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="admin-modal__body" id="dm-body" style="max-height:62vh;overflow-y:auto;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    _bindStatCards() {
        document.querySelectorAll('.stat-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => this._handleClick(card));
        });
    }

    _handleClick(card) {
        const label = (card.querySelector('.stat-card__label')?.textContent || '').toLowerCase();
        if (label.includes('категор')) this.showCategories();
        else if (label.includes('файл') || label.includes('фото')) this.showPhotos();
        else if (label.includes('участник')) this.showTeam();
        else if (label.includes('изменен')) this.showChanges();
        else if (label.includes('хранилищ')) this.showStorage();
    }

    _open(title, html) {
        document.getElementById('dm-title').textContent = title;
        document.getElementById('dm-body').innerHTML = html;
        document.getElementById('detail-modal').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    close() {
        document.getElementById('detail-modal')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    _iconMap(name) {
        const m = { layers: '📐', monitor: '🖥', clipboard: '📋', rocket: '🚀', globe: '🌐', circles: '⚫' };
        return m[name] || '📁';
    }

    _fmtTime(t) {
        try {
            const d = new Date(t);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) +
                ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    }

    _fmtBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(2) + ' MB';
    }

    showCategories() {
        const works = this.store.data?.works || [];
        this._open('📂 Все категории', `
            <div class="dm-grid">
                ${works.map(w => `
                    <div class="dm-card">
                        <div class="dm-card__icon">${this._iconMap(w.icon)}</div>
                        <div class="dm-card__info">
                            <h4>${this._esc(w.title?.ru || w.title?.en || w.id)}</h4>
                            <p>${this._esc(w.description?.ru || w.description?.en || '')}</p>
                            <span class="dm-badge">${(w.photos || []).length} фото</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `);
    }

    showPhotos() {
        const works = this.store.data?.works || [];
        let all = [];
        works.forEach(w => {
            (w.photos || []).forEach(p => {
                all.push({ ...p, _cat: w.title?.ru || w.title?.en || w.id });
            });
        });

        this._open('🖼 Все файлы', `
            <div class="dm-info">Всего: ${all.length} файлов</div>
            <div class="dm-photos">
                ${all.map(p => `
                    <div class="dm-photo">
                        ${p.type === 'video'
                            ? `<video src="${p.url}" muted></video>`
                            : `<img src="${p.url}" alt="${this._esc(p.name || '')}">`}
                        <div class="dm-photo__ov">
                            <span>${this._esc(p.name || 'Без названия')}</span>
                            <small>${this._esc(p._cat)}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `);
    }

    showTeam() {
        const team = this.store.data?.team || [];
        this._open('👥 Команда', `
            <div class="dm-team-grid">
                ${team.map(m => `
                    <div class="dm-team-card">
                        <div class="dm-team-av">
                            ${m.photo
                                ? `<img src="${m.photo}" alt="">`
                                : `<span>${(m.name?.ru || m.name?.en || '?')[0]}</span>`}
                            <span class="dm-status dm-status--${m.status || 'offline'}"></span>
                        </div>
                        <div class="dm-team-info">
                            <h4>${this._esc(m.name?.ru || m.name?.en)}</h4>
                            <p>${this._esc(m.role?.ru || m.role?.en)}</p>
                            <div class="dm-team-tags">
                                ${(m.tags || []).slice(0, 4).map(t => `<span>${this._esc(t)}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `);
    }

    async showChanges() {
        let acts = [];
        try { acts = await this.store.getActivities() || []; } catch {}

        this._open('📋 История изменений', `
            <div class="dm-info">Последние ${acts.length} изменений</div>
            <div class="dm-changes">
                ${acts.slice(0, 50).map(a => `
                    <div class="dm-ch-item dm-ch-item--${a.type || 'info'}">
                        <span class="dm-ch-dot"></span>
                        <span class="dm-ch-text">${this._esc(a.text || '')}</span>
                        <span class="dm-ch-time">${this._fmtTime(a.time)}</span>
                    </div>
                `).join('')}
            </div>
        `);
    }

    async showStorage() {
        let s = { dataSize: 0, uploadsSize: 0, uploadsCount: 0 };
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) s = await res.json();
        } catch {}

        const total = s.dataSize + s.uploadsSize;
        const dataPct = total > 0 ? (s.dataSize / total * 100) : 50;

        this._open('💾 Хранилище', `
            <div class="dm-storage">
                <div class="dm-stor-bar">
                    <div class="dm-stor-fill--data" style="width:${dataPct}%"></div>
                    <div class="dm-stor-fill--uploads" style="width:${100 - dataPct}%"></div>
                </div>
                <div class="dm-stor-items">
                    <div class="dm-stor-item">
                        <span class="dm-stor-icon">📄</span>
                        <span class="dm-stor-label">JSON данные</span>
                        <span class="dm-stor-val">${this._fmtBytes(s.dataSize)}</span>
                    </div>
                    <div class="dm-stor-item">
                        <span class="dm-stor-icon">🖼</span>
                        <span class="dm-stor-label">Загруженные файлы</span>
                        <span class="dm-stor-val">${this._fmtBytes(s.uploadsSize)}</span>
                    </div>
                    <div class="dm-stor-item">
                        <span class="dm-stor-icon">📦</span>
                        <span class="dm-stor-label">Кол-во файлов</span>
                        <span class="dm-stor-val">${s.uploadsCount}</span>
                    </div>
                    <div class="dm-stor-item dm-stor-item--total">
                        <span class="dm-stor-icon">💾</span>
                        <span class="dm-stor-label">Общий размер</span>
                        <span class="dm-stor-val">${this._fmtBytes(total)}</span>
                    </div>
                </div>
            </div>
        `);
    }
}

// ═══════════════════════════════════════
// STATISTICS PANEL — новая вкладка
// ═══════════════════════════════════════
class StatisticsPanel {
    constructor(store) {
        this.store = store;
        this.container = document.getElementById('statistics-editor');
        this._currentPeriod = '7d';
        this._injectStyles();
        this.render();
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .sp-panel {
                background: white; border-radius: 16px;
                border: 1px solid rgba(139,92,246,0.1); overflow: hidden;
            }
            [data-theme="dark"] .sp-panel {
                background: rgba(20,20,50,0.9); border-color: rgba(139,92,246,0.15);
            }
            .sp-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 18px 22px; border-bottom: 1px solid rgba(139,92,246,0.08);
                flex-wrap: wrap; gap: 12px;
            }
            .sp-header h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
            .sp-periods { display: flex; gap: 6px; flex-wrap: wrap; }
            .sp-per-btn {
                padding: 5px 14px; background: transparent;
                border: 1px solid rgba(139,92,246,0.2);
                border-radius: 100px; font-size: 0.78rem; color: #6b7280;
                cursor: pointer; transition: all 0.2s;
                font-family: 'Poppins', sans-serif;
            }
            .sp-per-btn:hover { border-color: rgba(139,92,246,0.4); color: #a855f7; }
            .sp-per-btn.active {
                background: linear-gradient(135deg, #9333ea, #d946ef);
                border-color: transparent; color: white;
            }
            .sp-overview {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: 14px; padding: 20px 22px;
            }
            .sp-stat {
                padding: 16px; background: rgba(139,92,246,0.03);
                border-radius: 12px; text-align: center;
            }
            .sp-stat__icon { font-size: 1.8rem; margin-bottom: 6px; }
            .sp-stat__val {
                font-family: 'Space Grotesk', monospace;
                font-size: 1.8rem; font-weight: 700; color: #4a3f5c;
            }
            .sp-stat__lbl { font-size: 0.76rem; color: #9ca3af; margin-top: 2px; }
            [data-theme="dark"] .sp-stat__val { color: #e5dff0; }
            .sp-section {
                padding: 18px 22px;
                border-top: 1px solid rgba(139,92,246,0.08);
            }
            .sp-section h4 {
                margin: 0 0 14px; font-size: 0.92rem; font-weight: 600; color: #4a3f5c;
            }
            [data-theme="dark"] .sp-section h4 { color: #b8a8d0; }
            .sp-empty { color: #9ca3af; font-size: 0.83rem; text-align: center; padding: 16px; }
            .sp-bar-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
            .sp-bar-label {
                width: 110px; font-size: 0.82rem; color: #4a3f5c;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            [data-theme="dark"] .sp-bar-label { color: #b8a8d0; }
            .sp-bar-track {
                flex: 1; height: 7px; background: rgba(139,92,246,0.1);
                border-radius: 4px; overflow: hidden;
            }
            .sp-bar-fill {
                height: 100%; border-radius: 4px; transition: width 0.5s ease;
                background: linear-gradient(90deg, #9333ea, #d946ef);
            }
            .sp-bar-fill--green { background: linear-gradient(90deg, #22c55e, #4ade80); }
            .sp-bar-val {
                width: 36px; text-align: right;
                font-family: 'Space Grotesk', monospace;
                font-weight: 600; font-size: 0.82rem; color: #6b7280;
            }
            .sp-hourly {
                display: flex; gap: 3px; align-items: flex-end; height: 90px; padding: 8px 0;
            }
            .sp-h-bar {
                flex: 1; display: flex; flex-direction: column;
                align-items: center; height: 100%;
            }
            .sp-h-fill {
                width: 100%;
                background: linear-gradient(to top, #9333ea, #d946ef);
                border-radius: 3px 3px 0 0;
                min-height: 2px; transition: height 0.3s;
            }
            .sp-h-lbl { font-size: 0.55rem; color: #9ca3af; margin-top: 3px; }
            .sp-actions { padding: 16px 22px; border-top: 1px solid rgba(139,92,246,0.08); text-align: right; }
        `;
        document.head.appendChild(style);
    }

    async render() {
        if (!this.container) return;

        const stats = await this._fetchStats(this._currentPeriod);

        this.container.innerHTML = `
            <div class="sp-panel">
                <div class="sp-header">
                    <h3>📊 Статистика посещений</h3>
                    <div class="sp-periods">
                        ${['24h', '7d', '30d', 'all'].map(p => `
                            <button class="sp-per-btn ${p === this._currentPeriod ? 'active' : ''}"
                                data-period="${p}">${{ '24h': '24 часа', '7d': '7 дней', '30d': '30 дней', 'all': 'Всё время' }[p]}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="sp-overview">
                    <div class="sp-stat">
                        <div class="sp-stat__icon">👥</div>
                        <div class="sp-stat__val" id="sp-visitors">${stats.uniqueVisitors}</div>
                        <div class="sp-stat__lbl">Уникальных посетителей</div>
                    </div>
                    <div class="sp-stat">
                        <div class="sp-stat__icon">👁</div>
                        <div class="sp-stat__val" id="sp-views">${stats.pageViews}</div>
                        <div class="sp-stat__lbl">Просмотров</div>
                    </div>
                    <div class="sp-stat">
                        <div class="sp-stat__icon">🖼</div>
                        <div class="sp-stat__val" id="sp-portfolio">${stats.portfolioClicks}</div>
                        <div class="sp-stat__lbl">Кликов портфолио</div>
                    </div>
                    <div class="sp-stat">
                        <div class="sp-stat__icon">🤖</div>
                        <div class="sp-stat__val" id="sp-bot">${stats.botClicks}</div>
                        <div class="sp-stat__lbl">Переходов в бота</div>
                    </div>
                </div>
                <div class="sp-section">
                    <h4>📂 Клики по категориям</h4>
                    <div id="sp-cats">${this._renderBars(stats.categoryClicks, false)}</div>
                </div>
                <div class="sp-section">
                    <h4>👥 Клики по участникам</h4>
                    <div id="sp-team">${this._renderBars(stats.teamClicks, true)}</div>
                </div>
                <div class="sp-section">
                    <h4>📈 Активность по часам</h4>
                    <div id="sp-hourly">${this._renderHourly(stats.hourlyActivity)}</div>
                </div>
                <div class="sp-actions">
                    <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="window._statisticsPanel?.clearAnalytics()">🗑 Очистить аналитику</button>
                </div>
            </div>
        `;

        this._bindPeriods();
    }

    _renderBars(obj, green) {
        const entries = Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
        if (!entries.length) return '<p class="sp-empty">Нет данных</p>';
        const max = entries[0][1] || 1;
        return entries.map(([name, count]) => `
            <div class="sp-bar-item">
                <span class="sp-bar-label">${this._esc(name)}</span>
                <div class="sp-bar-track"><div class="sp-bar-fill${green ? ' sp-bar-fill--green' : ''}" style="width:${(count / max) * 100}%"></div></div>
                <span class="sp-bar-val">${count}</span>
            </div>
        `).join('');
    }

    _renderHourly(data) {
        const arr = data || new Array(24).fill(0);
        const max = Math.max(...arr, 1);
        return `<div class="sp-hourly">${arr.map((v, h) => `
            <div class="sp-h-bar" title="${h}:00 — ${v} визитов">
                <div class="sp-h-fill" style="height:${(v / max) * 100}%"></div>
                <span class="sp-h-lbl">${h}</span>
            </div>
        `).join('')}</div>`;
    }

    _bindPeriods() {
        this.container?.querySelectorAll('.sp-per-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                this._currentPeriod = btn.dataset.period;
                this.container.querySelectorAll('.sp-per-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const stats = await this._fetchStats(this._currentPeriod);
                this._updateValues(stats);
            });
        });
    }

    _updateValues(stats) {
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('sp-visitors', stats.uniqueVisitors);
        set('sp-views', stats.pageViews);
        set('sp-portfolio', stats.portfolioClicks);
        set('sp-bot', stats.botClicks);
        const cats = document.getElementById('sp-cats');
        if (cats) cats.innerHTML = this._renderBars(stats.categoryClicks, false);
        const team = document.getElementById('sp-team');
        if (team) team.innerHTML = this._renderBars(stats.teamClicks, true);
        const hourly = document.getElementById('sp-hourly');
        if (hourly) hourly.innerHTML = this._renderHourly(stats.hourlyActivity);
    }

    async _fetchStats(period) {
        try {
            const res = await fetch(`/api/analytics/stats?period=${period}`);
            if (res.ok) return await res.json();
        } catch {}
        return { uniqueVisitors: 0, pageViews: 0, portfolioClicks: 0, botClicks: 0, categoryClicks: {}, teamClicks: {}, hourlyActivity: new Array(24).fill(0) };
    }

    async clearAnalytics() {
        if (!confirm('Очистить всю аналитику?')) return;
        try { await fetch('/api/analytics', { method: 'DELETE' }); } catch {}
        Toast.show('Аналитика очищена', 'info');
        this.render();
    }

    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}

// ═══════════════════════════════════════
// OVERRIDE INIT — перехватываем старую AuthSystem
// ═══════════════════════════════════════
(function overrideOldAuth() {
    // Перехватываем инициализацию из admin.js
    const origDOMContentLoaded = [];

    // Ждём загрузки admin-store
    const waitForStore = () => {
        if (typeof AdminStore === 'undefined' || !window.AdminStore) {
            setTimeout(waitForStore, 50);
            return;
        }

        // Подменяем AuthSystem до того, как admin.js его создаст
        if (typeof AuthSystem !== 'undefined') {
            // admin.js уже загружен — нужно перехватить
            const OrigAuthSystem = AuthSystem;
            window.AuthSystem = class extends OrigAuthSystem {
                constructor(store) {
                    // НЕ вызываем super — заменяем полностью
                    this.store = store;
                    // Ничего не делаем — AuthSystemV2 всё возьмёт на себя
                }
            };
        }
    };

    waitForStore();
})();

// ═══════════════════════════════════════
// INIT ADMIN2
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const initAdmin2 = () => {
        // Ждём пока adminStore будет готов
        if (!window.adminStore && !window.AdminStore) {
            setTimeout(initAdmin2, 100);
            return;
        }

        const store = window.adminStore || (window.AdminStore ? new AdminStore() : null);
        if (!store) {
            setTimeout(initAdmin2, 100);
            return;
        }

        // Ждём загрузки данных
        const waitData = async () => {
            await store.ensureLoaded(true);

            console.log('🚀 Admin2.js initializing...');

            // Auth V2 — заменяет старую систему
            const authV2 = new AuthSystemV2(store);

            // Online counter V2
            const onlineV2 = new OnlineCounterV2();

            // Detail modals — после рендера dashboard
            setTimeout(() => {
                window._detailModals = new DetailModals(store);

                // Statistics panel
                if (document.getElementById('statistics-editor')) {
                    window._statisticsPanel = new StatisticsPanel(store);
                }

                console.log('✅ Admin2.js loaded');
            }, 600);
        };

        waitData();
    };

    initAdmin2();
});