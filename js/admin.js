/* =====================================================
   TISH TEAM — ADMIN PANEL (Server-Synced)
   ИСПРАВЛЕННАЯ ВЕРСИЯ
   ===================================================== */

const AdminApp = {
    store: null,
    _hasUnsavedChanges: false,
    
    openModal(id) {
        document.getElementById(id)?.classList.add('open');
        document.body.style.overflow = 'hidden';
    },
    closeModal(id) {
        document.getElementById(id)?.classList.remove('open');
        document.body.style.overflow = '';
    },
    
    // ИСПРАВЛЕНИЕ #1: Индикатор несохранённых изменений
    markUnsaved() {
        this._hasUnsavedChanges = true;
        const indicator = document.getElementById('topbar-unsaved');
        if (indicator) indicator.classList.add('visible');
    },
    
    markSaved() {
        this._hasUnsavedChanges = false;
        const indicator = document.getElementById('topbar-unsaved');
        if (indicator) indicator.classList.remove('visible');
    },
    
    hasUnsavedChanges() {
        return this._hasUnsavedChanges;
    }
};

// ===== TOAST =====
class Toast {
    static show(msg, type = 'info', dur = 4000) {
        const c = document.getElementById('toast-container');
        if (!c) return;
        
        const t = document.createElement('div');
        t.className = `toast toast--${type}`;
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        t.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span class="toast__text">${msg}</span>
            <button class="toast__close" onclick="this.parentElement.classList.add('removing');setTimeout(()=>this.parentElement.remove(),300)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
        c.appendChild(t);
        setTimeout(() => { 
            t.classList.add('removing'); 
            setTimeout(() => t.remove(), 300); 
        }, dur);
    }
}

// ===== AUTH =====
class AuthSystem {
    constructor(store) {
        this.store = store;
        this.form = document.getElementById('login-form');
        this.passInput = document.getElementById('login-password');
        this.errorEl = document.getElementById('login-error');
        this.btn = document.getElementById('login-btn');
        
        if (!this.form) return;
        
        if (sessionStorage.getItem('tish_admin_auth') === 'true') {
            this.showAdmin();
        }
        
        this.form.addEventListener('submit', e => this.login(e));
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        document.getElementById('toggle-password')?.addEventListener('click', () => {
            this.passInput.type = this.passInput.type === 'password' ? 'text' : 'password';
        });
        this.passInput?.addEventListener('input', () => {
            this.passInput.classList.remove('error');
            this.errorEl?.classList.remove('visible');
        });
    }
    
    async login(e) {
        e.preventDefault();
        const pw = this.passInput.value.trim();
        if (!pw) { 
            this.passInput.classList.add('error'); 
            return; 
        }
        this.btn.classList.add('loading');
        
        await this.store.ensureLoaded(true);
        
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw })
            });
            if (res.ok) {
                sessionStorage.setItem('tish_admin_auth', 'true');
                this.showAdmin();
                Toast.show('Добро пожаловать!', 'success');
            } else {
                this.showError();
            }
        } catch (err) {
            console.warn('Server unavailable, trying offline auth...', err);
            const storePass = this.store.data?.settings?.password;
            if (pw === storePass || pw === 'tish2024') {
                sessionStorage.setItem('tish_admin_auth', 'true');
                this.showAdmin();
                Toast.show('Добро пожаловать! (offline)', 'success');
            } else {
                this.showError();
            }
        }
    }
    
    showError() {
        this.passInput.classList.add('error');
        this.errorEl?.classList.add('visible');
        this.btn.classList.remove('loading');
    }
    
    showAdmin() {
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('admin-layout')?.classList.add('visible');
        this.btn?.classList.remove('loading');
    }
    
    logout() {
        sessionStorage.removeItem('tish_admin_auth');
        document.getElementById('admin-layout')?.classList.remove('visible');
        document.getElementById('login-screen')?.classList.remove('hidden');
        if (this.passInput) this.passInput.value = '';
        this.btn?.classList.remove('loading');
    }
}

// ===== NAVIGATION =====
class Navigation {
    constructor() {
        this.links = document.querySelectorAll('.sidebar__link[data-page]');
        this.pages = document.querySelectorAll('.admin-page');
        this.titleEl = document.getElementById('topbar-title');
        this.breadEl = document.getElementById('topbar-breadcrumb');
        this.sidebar = document.getElementById('sidebar');
        this.titles = {
            dashboard: ['Дашборд', 'Главная панель'],
            team: ['Команда', 'Участники'],
            works: ['Категории', 'Управление категориями'],
            portfolio: ['Портфолио', 'Управление фотографиями'],
            hero: ['Hero секция', 'Статистика'],
            preview: ['Предпросмотр', 'Просмотр сайта'],
            settings: ['Настройки', 'Конфигурация']
        };
        this.links.forEach(l => l.addEventListener('click', () => this.go(l.dataset.page)));
        document.getElementById('burger-btn')?.addEventListener('click', () => this.sidebar?.classList.toggle('open'));
    }
    
    go(id) {
        this.links.forEach(l => l.classList.toggle('active', l.dataset.page === id));
        this.pages.forEach(p => {
            p.classList.remove('active');
            if (p.id === `page-${id}`) { 
                p.classList.add('active'); 
                p.style.animation = 'none'; 
                p.offsetHeight; 
                p.style.animation = ''; 
            }
        });
        const i = this.titles[id] || [id, ''];
        if (this.titleEl) this.titleEl.textContent = i[0];
        if (this.breadEl) this.breadEl.textContent = i[1];
        this.sidebar?.classList.remove('open');
        window.dispatchEvent(new CustomEvent('adminPageChange', { detail: { page: id } }));
    }
}

// ===== DASHBOARD =====
class Dashboard {
    constructor(store) {
        this.store = store;
        this.update();
        this.renderLog();
        this.loadServerStats();
        
        document.getElementById('clear-log-btn')?.addEventListener('click', async () => {
            await store.clearActivities();
            this.renderLog();
            Toast.show('Лог очищен', 'info');
        });
        
        document.getElementById('save-all-btn')?.addEventListener('click', async () => {
            const btn = document.getElementById('save-all-btn');
            if (!btn) return;
            
            btn.disabled = true;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg><span>Сохранение...</span>';
            
            const ok = await store.save();
            if (ok) {
                Toast.show('✅ Сохранено на сервер!', 'success');
                await store.addActivity('Данные сохранены на сервер', 'success');
                AdminApp.markSaved();
                this.renderLog();
                this.update();
                this.updateLastSaved();
            } else {
                Toast.show('⚠️ Ошибка сервера. Данные сохранены локально.', 'warning');
            }
            
            btn.disabled = false;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Сохранить</span>';
        });
        
        store.onChange(() => { this.update(); this.renderLog(); });
    }
    
    updateLastSaved() {
        const el = document.getElementById('topbar-last-saved');
        if (el) {
            const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            el.textContent = `Сохранено: ${time}`;
        }
    }
    
    update() {
        const d = this.store.data;
        if (!d) return;
        
        const statWorks = document.getElementById('stat-works');
        const statTeam = document.getElementById('stat-team');
        const statChanges = document.getElementById('stat-changes');
        const badgeTeam = document.getElementById('badge-team');
        const badgeWorks = document.getElementById('badge-works');
        const badgePhotos = document.getElementById('badge-photos');
        const statPhotos = document.getElementById('stat-photos');
        
        if (statWorks) statWorks.textContent = d.works.length;
        if (statTeam) statTeam.textContent = d.team.length;
        if (statChanges) statChanges.textContent = this.store.changesCount;
        if (badgeTeam) badgeTeam.textContent = d.team.length;
        if (badgeWorks) badgeWorks.textContent = d.works.length;
        
        let photos = 0;
        d.works.forEach(w => {
            (w.photos || []).forEach(p => { 
                photos++; 
                photos += (p.files || []).length; 
            });
        });
        
        if (statPhotos) statPhotos.textContent = photos;
        if (badgePhotos) badgePhotos.textContent = photos;
    }
    
    async renderLog() {
        const el = document.getElementById('activity-list');
        if (!el) return;
        
        try {
            const acts = await this.store.getActivities();
            
            if (!acts || !acts.length) {
                el.innerHTML = '<div class="activity-empty">Пока нет действий</div>';
                return;
            }
            
            el.innerHTML = acts.map(a => {
                let timeStr = '';
                try {
                    const t = new Date(a.time);
                    if (!isNaN(t.getTime())) {
                        timeStr = `${t.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
                    }
                } catch {
                    timeStr = a.time || '';
                }
                return `<div class="activity-item">
                    <div class="activity-item__dot activity-item__dot--${a.type || 'info'}"></div>
                    <div>
                        <div class="activity-item__text">${a.text || ''}</div>
                        <div class="activity-item__time">${timeStr}</div>
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('renderLog error:', err);
            el.innerHTML = '<div class="activity-empty">Ошибка загрузки лога</div>';
        }
    }
    
    async loadServerStats() {
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) return;
            const s = await res.json();
            
            const fmt = (b) => {
                if (b < 1024) return b + ' B';
                if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
                return (b / 1048576).toFixed(1) + ' MB';
            };
            
            const el = document.getElementById('stat-storage');
            if (el) el.textContent = fmt(s.dataSize + s.uploadsSize);
            
            const detailEl = document.getElementById('storage-detail');
            if (detailEl) {
                detailEl.innerHTML = `📄 JSON: ${fmt(s.dataSize)} | 🖼 ${s.uploadsCount} файлов (${fmt(s.uploadsSize)})`;
            }
        } catch {}
    }
}

// ===== PHOTO EDITOR ENGINE =====
class PhotoEditorEngine {
    constructor() {
        this.canvas = document.getElementById('pe-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.currentImage = null;
        this.rotation = 0;
        this.flipH = false;
        this.flipV = false;
        this.filterName = 'none';
        this.cropMode = false;
        this.cropBox = document.getElementById('pe-crop-box');
        this.cropOverlay = document.getElementById('pe-crop-overlay');
        this.onSave = null;
        
        this._setupCrop();
        document.getElementById('pe-save-btn')?.addEventListener('click', () => this.save());
    }
    
    load(imageUrl) {
        this.reset();
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { 
            this.originalImage = img; 
            this.currentImage = img; 
            this.draw(); 
        };
        img.onerror = () => { 
            this.originalImage = null; 
            Toast.show('Не удалось загрузить фото', 'error'); 
        };
        img.src = imageUrl;
    }
    
    draw() {
        if (!this.currentImage || !this.ctx) return;
        
        const img = this.currentImage;
        const maxW = 600, maxH = 400;
        let w = img.width, h = img.height;
        
        if (w > maxW) { h = h * (maxW / w); w = maxW; }
        if (h > maxH) { w = w * (maxH / h); h = maxH; }
        
        const isR = this.rotation === 90 || this.rotation === 270;
        this.canvas.width = isR ? h : w;
        this.canvas.height = isR ? w : h;
        
        const brightnessEl = document.getElementById('pe-brightness');
        const contrastEl = document.getElementById('pe-contrast');
        const saturateEl = document.getElementById('pe-saturate');
        const blurEl = document.getElementById('pe-blur');
        
        const b = brightnessEl?.value || 100;
        const c = contrastEl?.value || 100;
        const s = saturateEl?.value || 100;
        const blur = blurEl?.value || 0;
        
        const bVal = document.getElementById('pe-brightness-val');
        const cVal = document.getElementById('pe-contrast-val');
        const sVal = document.getElementById('pe-saturate-val');
        const blurVal = document.getElementById('pe-blur-val');
        
        if (bVal) bVal.textContent = b + '%';
        if (cVal) cVal.textContent = c + '%';
        if (sVal) sVal.textContent = s + '%';
        if (blurVal) blurVal.textContent = blur + 'px';
        
        let f = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
        if (parseFloat(blur) > 0) f += ` blur(${blur}px)`;
        
        switch (this.filterName) {
            case 'grayscale': f += ' grayscale(100%)'; break;
            case 'sepia': f += ' sepia(80%)'; break;
            case 'warm': f += ' sepia(30%) saturate(140%)'; break;
            case 'cool': f += ' hue-rotate(30deg) saturate(80%)'; break;
            case 'vintage': f += ' sepia(40%) contrast(90%) brightness(110%)'; break;
        }
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate((this.rotation * Math.PI) / 180);
        this.ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
        this.ctx.filter = f;
        this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
        this.ctx.restore();
    }
    
    updateFilters() { this.draw(); }
    rotate(deg) { this.rotation = (this.rotation + deg + 360) % 360; this.draw(); }
    flip(axis) { if (axis === 'h') this.flipH = !this.flipH; else this.flipV = !this.flipV; this.draw(); }
    applyFilter(name) { this.filterName = name; this.draw(); }
    
    reset() {
        this.rotation = 0; 
        this.flipH = false; 
        this.flipV = false; 
        this.filterName = 'none';
        
        const brightnessEl = document.getElementById('pe-brightness');
        const contrastEl = document.getElementById('pe-contrast');
        const saturateEl = document.getElementById('pe-saturate');
        const blurEl = document.getElementById('pe-blur');
        
        if (brightnessEl) brightnessEl.value = 100;
        if (contrastEl) contrastEl.value = 100;
        if (saturateEl) saturateEl.value = 100;
        if (blurEl) blurEl.value = 0;
        
        this.hideCrop();
        if (this.originalImage) { 
            this.currentImage = this.originalImage; 
            this.draw(); 
        }
    }
    
    toggleCrop() { 
        if (this.cropMode) this.applyCrop(); 
        else this.showCrop(); 
    }
    
    showCrop() {
        this.cropMode = true;
        if (this.cropOverlay) this.cropOverlay.style.display = 'block';
        
        const cropBtn = document.getElementById('pe-crop-btn');
        if (cropBtn) {
            cropBtn.classList.add('active');
            cropBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Применить`;
        }
        
        if (this.cropBox) {
            this.cropBox.style.top = '10%'; 
            this.cropBox.style.left = '10%';
            this.cropBox.style.width = '80%'; 
            this.cropBox.style.height = '80%';
        }
    }
    
    hideCrop() {
        this.cropMode = false;
        if (this.cropOverlay) this.cropOverlay.style.display = 'none';
        
        const cropBtn = document.getElementById('pe-crop-btn');
        if (cropBtn) {
            cropBtn.classList.remove('active');
            cropBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></svg> Обрезка`;
        }
    }
    
    applyCrop() {
        if (!this.canvas || !this.cropBox) return;
        
        const cr = this.canvas.getBoundingClientRect();
        const br = this.cropBox.getBoundingClientRect();
        const sx = this.canvas.width / cr.width;
        const sy = this.canvas.height / cr.height;
        const cx = (br.left - cr.left) * sx;
        const cy = (br.top - cr.top) * sy;
        const cw = br.width * sx;
        const ch = br.height * sy;
        
        if (cw < 10 || ch < 10) { 
            Toast.show('Область слишком маленькая', 'warning'); 
            return; 
        }
        
        const tc = document.createElement('canvas'); 
        tc.width = cw; 
        tc.height = ch;
        tc.getContext('2d').drawImage(this.canvas, cx, cy, cw, ch, 0, 0, cw, ch);
        
        const ci = new Image();
        ci.onload = () => { 
            this.currentImage = ci; 
            this.rotation = 0; 
            this.flipH = false; 
            this.flipV = false; 
            this.draw(); 
            Toast.show('Обрезано!', 'success'); 
        };
        ci.src = tc.toDataURL('image/jpeg', 0.95);
        this.hideCrop();
    }
    
    _setupCrop() {
        if (!this.cropOverlay || !this.cropBox) return;
        
        let drag = false, dt = '', sx, sy, sl, st, sw, sh;
        
        const down = e => {
            if (!this.cropMode) return; 
            e.preventDefault();
            
            const t = e.touches ? e.touches[0] : e; 
            sx = t.clientX; 
            sy = t.clientY;
            
            const h = e.target.dataset?.handle;
            if (h) dt = h; 
            else if (e.target === this.cropBox || e.target.parentElement === this.cropBox) dt = 'move'; 
            else return;
            
            drag = true;
            const r = this.cropBox.getBoundingClientRect();
            const pr = this.cropBox.parentElement.getBoundingClientRect();
            sl = r.left - pr.left; 
            st = r.top - pr.top; 
            sw = r.width; 
            sh = r.height;
        };
        
        const move = e => {
            if (!drag) return; 
            e.preventDefault();
            
            const t = e.touches ? e.touches[0] : e;
            const dx = t.clientX - sx;
            const dy = t.clientY - sy;
            const p = this.cropBox.parentElement.getBoundingClientRect();
            
            if (dt === 'move') {
                this.cropBox.style.left = (Math.max(0, Math.min(sl + dx, p.width - sw)) / p.width * 100) + '%';
                this.cropBox.style.top = (Math.max(0, Math.min(st + dy, p.height - sh)) / p.height * 100) + '%';
            } else {
                let nL = sl, nT = st, nW = sw, nH = sh;
                if (dt.includes('e')) nW = Math.max(30, sw + dx);
                if (dt.includes('w')) { nW = Math.max(30, sw - dx); nL = sl + dx; }
                if (dt.includes('s')) nH = Math.max(30, sh + dy);
                if (dt.includes('n')) { nH = Math.max(30, sh - dy); nT = st + dy; }
                
                this.cropBox.style.left = (nL / p.width * 100) + '%';
                this.cropBox.style.top = (nT / p.height * 100) + '%';
                this.cropBox.style.width = (nW / p.width * 100) + '%';
                this.cropBox.style.height = (nH / p.height * 100) + '%';
            }
        };
        
        const up = () => { drag = false; dt = ''; };
        
        this.cropOverlay.addEventListener('mousedown', down);
        this.cropOverlay.addEventListener('touchstart', down, { passive: false });
        document.addEventListener('mousemove', move);
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('mouseup', up);
        document.addEventListener('touchend', up);
    }
    
    getDataURL() { 
        try { 
            return this.canvas?.toDataURL('image/jpeg', 0.9) || null; 
        } catch { 
            return null; 
        } 
    }
    
    save() { 
        if (this.onSave) this.onSave(); 
    }
}

// ===== TEAM EDITOR (ИСПРАВЛЕННЫЙ) =====
class TeamEditor {
    constructor(store) {
        this.store = store;
        this.grid = document.getElementById('team-edit-grid');
        
        this.render();
        
        document.getElementById('add-member-btn')?.addEventListener('click', () => this.addMember());
        document.getElementById('attach-works-save')?.addEventListener('click', () => this.saveAttached());
        
        window.addEventListener('adminPageChange', e => { 
            if (e.detail.page === 'team') this.render(); 
        });
    }

    render() {
        if (!this.store.data || !this.grid) return;
        const team = this.store.data.team;

        this.grid.innerHTML = team.map((m, i) => {
            const photoHtml = m.photo
                ? `<img src="${m.photo}" alt="${m.name.ru}" style="width:100%;height:100%;object-fit:cover;">`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

            const tagsHtml = (m.tags || []).map((t, ti) =>
                `<span class="tag-item">${this.escapeHtml(t)} <button class="tag-item__remove" onclick="teamEditor.removeTag(${i},${ti})">×</button></span>`
            ).join('');

            const worksHtml = this.renderMemberWorks(m.id);

            const portfolioHtml = (m.portfolioItems || []).map((pi, pii) => `
                <div style="display:flex;gap:8px;align-items:center;padding:8px;background:rgba(139,92,246,0.03);border-radius:8px;margin-bottom:6px;">
                    <div style="width:50px;height:40px;border-radius:6px;overflow:hidden;background:#f3e8ff;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                        ${pi.media
                            ? (pi.type === 'video'
                                ? `<video src="${pi.media}" style="width:100%;height:100%;object-fit:cover;" muted></video>`
                                : `<img src="${pi.media}" style="width:100%;height:100%;object-fit:cover;">`)
                            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
                        }
                    </div>
                    <input class="admin-input" value="${this.escapeHtml(pi.title || '')}" style="flex:1;padding:6px 10px;font-size:0.8rem;"
                        onchange="teamEditor.updatePortfolioItem(${i},${pii},'title',this.value)">
                    <label style="cursor:pointer;padding:4px 8px;background:rgba(139,92,246,0.08);border-radius:6px;font-size:0.7rem;color:#a855f7;">
                        📷<input type="file" accept="image/*,video/*" style="display:none"
                            onchange="teamEditor.uploadPortfolioMedia(${i},${pii},this)">
                    </label>
                    <button class="admin-btn admin-btn--sm" style="padding:4px 8px;font-size:0.7rem;color:#ef4444;border-color:rgba(239,68,68,0.2);"
                        onclick="teamEditor.removePortfolioItem(${i},${pii})">×</button>
                </div>
            `).join('');

            return `
            <div class="team-edit-card">
                <div class="team-edit-card__header">
                    <div class="team-edit-card__avatar">${photoHtml}</div>
                    <div class="team-edit-card__meta">
                        <h3>${this.escapeHtml(m.name.ru || m.name.en)}</h3>
                        <p>${this.escapeHtml(m.role.ru || m.role.en)}</p>
                    </div>
                    <div class="team-edit-card__actions">
                        <button class="admin-btn admin-btn--sm" onclick="teamEditor.openAttach(${i})" title="Привязать работы">📎</button>
                        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="teamEditor.removeMember(${i})" title="Удалить">🗑</button>
                    </div>
                </div>
                <div class="team-edit-card__body">
                    <div class="form-row">
                        <div class="form-field">
                            <label class="form-field__label">Имя EN</label>
                            <input class="admin-input" value="${this.escapeHtml(m.name.en)}"
                                onchange="teamEditor.updateField(${i},'name.en',this.value)">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">Имя RU</label>
                            <input class="admin-input" value="${this.escapeHtml(m.name.ru)}"
                                onchange="teamEditor.updateField(${i},'name.ru',this.value)">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-field">
                            <label class="form-field__label">Роль EN</label>
                            <input class="admin-input" value="${this.escapeHtml(m.role.en)}"
                                onchange="teamEditor.updateField(${i},'role.en',this.value)">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">Роль RU</label>
                            <input class="admin-input" value="${this.escapeHtml(m.role.ru)}"
                                onchange="teamEditor.updateField(${i},'role.ru',this.value)">
                        </div>
                    </div>

                    <div class="form-row form-row--full">
                        <div class="form-field">
                            <label class="form-field__label">Стек / Навыки</label>
                            <input class="admin-input" value="${this.escapeHtml(m.level || '')}"
                                onchange="teamEditor.updateField(${i},'level',this.value)">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-field">
                            <label class="form-field__label">Описание EN</label>
                            <textarea class="admin-textarea"
                                onchange="teamEditor.updateField(${i},'description.en',this.value)">${this.escapeHtml(m.description?.en || '')}</textarea>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">Описание RU</label>
                            <textarea class="admin-textarea"
                                onchange="teamEditor.updateField(${i},'description.ru',this.value)">${this.escapeHtml(m.description?.ru || '')}</textarea>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-field">
                            <label class="form-field__label">Условия EN</label>
                            <textarea class="admin-textarea"
                                onchange="teamEditor.updateField(${i},'conditions.en',this.value)">${this.escapeHtml(m.conditions?.en || '')}</textarea>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">Условия RU</label>
                            <textarea class="admin-textarea"
                                onchange="teamEditor.updateField(${i},'conditions.ru',this.value)">${this.escapeHtml(m.conditions?.ru || '')}</textarea>
                        </div>
                    </div>

                    <div class="form-row form-row--full">
                        <div class="form-field">
                            <label class="form-field__label">📷 Фото профиля</label>
                            <div class="photo-upload" onclick="this.querySelector('input').click()">
                                <div class="photo-upload__preview" style="width:80px;height:80px;">
                                    ${m.photo
                                        ? `<img src="${m.photo}" alt="photo">`
                                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
                                    }
                                </div>
                                <div class="photo-upload__text">Нажмите для загрузки</div>
                                <input type="file" accept="image/*" onchange="teamEditor.uploadPhoto(${i},this)">
                            </div>
                        </div>
                    </div>

                    <div class="form-row form-row--full">
                        <div class="form-field">
                            <label class="form-field__label">Статус</label>
                            <select class="admin-select" onchange="teamEditor.updateField(${i},'status',this.value)">
                                <option value="online" ${m.status === 'online' ? 'selected' : ''}>🟢 Online</option>
                                <option value="busy" ${m.status === 'busy' ? 'selected' : ''}>🟡 Busy</option>
                                <option value="offline" ${m.status === 'offline' ? 'selected' : ''}>🔴 Offline</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row form-row--full">
                        <div class="form-field">
                            <label class="form-field__label">Теги</label>
                            <div class="tag-list">${tagsHtml}</div>
                            <div class="tag-add">
                                <input class="admin-input" id="tag-${i}" placeholder="Новый тег..."
                                    onkeydown="if(event.key==='Enter'){event.preventDefault();teamEditor.addTag(${i})}">
                                <button class="admin-btn admin-btn--sm" onclick="teamEditor.addTag(${i})">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-row form-row--full">
                        <div class="form-field">
                            <label class="form-field__label">📂 Элементы портфолио</label>
                            ${portfolioHtml || '<p style="color:#9ca3af;font-size:0.85rem;">Нет элементов</p>'}
                            <button class="admin-btn admin-btn--sm" onclick="teamEditor.addPortfolioItem(${i})"
                                style="margin-top:6px;">+ Добавить элемент</button>
                        </div>
                    </div>

                    <div class="form-row form-row--full">
                        <div class="form-field">
                            <label class="form-field__label">🔗 Привязанные работы</label>
                            <div class="member-works-grid">${worksHtml}</div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
    
    // ИСПРАВЛЕНИЕ: XSS protection
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    renderMemberWorks(id) {
        if (!this.store.data) return '<span style="color:#9ca3af;font-size:0.85rem;">Нет работ</span>';
        
        let h = '', c = 0;
        this.store.data.works.forEach(w => {
            (w.photos || []).filter(p => p.author === id).forEach(p => {
                c++;
                const urlSafe = (p.url || '').replace(/'/g, "\\'");
                h += `<div class="member-work-thumb" style="position:relative">
                    <img src="${p.url}" alt="">
                    <span>${this.escapeHtml(p.name || '')}</span>
                    <button onclick="teamEditor.detach('${id}','${w.id}','${urlSafe}')"
                        style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,0.9);border:none;border-radius:50%;width:16px;height:16px;color:white;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>
                </div>`;
            });
        });
        return c ? h : '<span style="color:#9ca3af;font-size:0.85rem;">Нет работ</span>';
    }

    async addPortfolioItem(i) {
        if (!this.store.data?.team[i]) return;
        if (!this.store.data.team[i].portfolioItems) {
            this.store.data.team[i].portfolioItems = [];
        }
        this.store.data.team[i].portfolioItems.push({ 
            title: 'Новый проект', 
            media: '', 
            type: 'image' 
        });
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
    }

    async removePortfolioItem(i, pii) {
        if (!this.store.data?.team[i]?.portfolioItems) return;
        this.store.data.team[i].portfolioItems.splice(pii, 1);
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
    }

    async updatePortfolioItem(i, pii, field, val) {
        if (!this.store.data?.team[i]?.portfolioItems?.[pii]) return;
        this.store.data.team[i].portfolioItems[pii][field] = val;
        AdminApp.markUnsaved();
        await this.store.save();
    }

    async uploadPortfolioMedia(i, pii, input) {
        const f = input.files[0];
        if (!f) return;
        
        const isVideo = f.type.startsWith('video/');
        Toast.show('Загрузка...', 'info', 2000);
        
        const r = new FileReader();
        r.onload = async e => {
            try {
                const base64 = e.target.result;
                const url = await this.store.uploadImage(base64, `portfolio_${this.store.data.team[i].id}_${pii}_${Date.now()}`);
                
                if (!this.store.data?.team[i]?.portfolioItems?.[pii]) return;
                
                this.store.data.team[i].portfolioItems[pii].media = url;
                this.store.data.team[i].portfolioItems[pii].type = isVideo ? 'video' : 'image';
                
                AdminApp.markUnsaved();
                await this.store.save();
                this.render();
                Toast.show('Медиа загружено!', 'success');
            } catch (err) {
                console.error('Upload error:', err);
                Toast.show('Ошибка загрузки', 'error');
            }
        };
        r.onerror = () => Toast.show('Ошибка чтения файла', 'error');
        r.readAsDataURL(f);
    }

    async detach(mid, wid, url) {
        const w = this.store.data?.works?.find(x => x.id === wid);
        if (!w?.photos) return;
        
        const p = w.photos.find(x => x.url === url && x.author === mid);
        if (p) {
            p.author = '';
            AdminApp.markUnsaved();
            await this.store.save();
            this.render();
            Toast.show('Отвязано', 'info');
        }
    }

    openAttach(idx) {
        this._aidx = idx;
        const m = this.store.data.team[idx];
        const c = document.getElementById('attach-works-grid');
        if (!c) return;
        
        let h = '';
        this.store.data.works.forEach((w, wi) => {
            if (!w.photos || !w.photos.length) return;
            h += `<div style="margin-bottom:16px;">
                <h4 style="font-size:0.85rem;font-weight:600;margin-bottom:8px;">📂 ${this.escapeHtml(w.title.ru || w.title.en)}</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px;">`;
            w.photos.forEach((p, pi) => {
                const on = p.author === m.id;
                h += `<label style="position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;cursor:pointer;border:3px solid ${on ? '#a855f7' : 'rgba(139,92,246,0.1)'}">
                    <input type="checkbox" data-wi="${wi}" data-pi="${pi}" ${on ? 'checked' : ''}
                        style="position:absolute;top:4px;left:4px;z-index:5;accent-color:#a855f7"
                        onchange="this.parentElement.style.borderColor=this.checked?'#a855f7':'rgba(139,92,246,0.1)'">
                    <img src="${p.url}" style="width:100%;height:100%;object-fit:cover;"></label>`;
            });
            h += `</div></div>`;
        });
        
        if (!h) h = '<p style="color:#9ca3af;text-align:center;padding:30px;">Нет фото в категориях</p>';
        c.innerHTML = h;
        
        const nameEl = document.getElementById('attach-works-member-name');
        if (nameEl) nameEl.textContent = m.name.ru || m.name.en;
        
        AdminApp.openModal('attach-works-modal');
    }

    async saveAttached() {
        const m = this.store.data.team[this._aidx];
        document.querySelectorAll('#attach-works-grid input[type="checkbox"]').forEach(cb => {
            const wi = parseInt(cb.dataset.wi);
            const pi = parseInt(cb.dataset.pi);
            const p = this.store.data.works[wi]?.photos?.[pi];
            if (!p) return;
            
            if (cb.checked) p.author = m.id;
            else if (p.author === m.id) p.author = '';
        });
        
        AdminApp.markUnsaved();
        await this.store.save();
        AdminApp.closeModal('attach-works-modal');
        this.render();
        Toast.show('Сохранено!', 'success');
    }

    async updateField(i, path, val) {
        if (!this.store.data?.team[i]) return;
        
        const p = path.split('.');
        let o = this.store.data.team[i];
        for (let k = 0; k < p.length - 1; k++) {
            if (!o[p[k]]) o[p[k]] = {};
            o = o[p[k]];
        }
        o[p[p.length - 1]] = val;
        
        AdminApp.markUnsaved();
        await this.store.save();
        
        if (path === 'photo' || path === 'status') this.render();
    }

    async uploadPhoto(i, input) {
        const f = input.files[0];
        if (!f) return;
        
        Toast.show('Загрузка фото...', 'info', 2000);
        
        const r = new FileReader();
        r.onload = async e => {
            try {
                const url = await this.store.uploadImage(e.target.result, `team_${this.store.data.team[i].id}`);
                await this.updateField(i, 'photo', url);
                this.render();
                Toast.show('Фото загружено!', 'success');
            } catch (err) {
                Toast.show('Ошибка загрузки', 'error');
            }
        };
        r.onerror = () => Toast.show('Ошибка чтения файла', 'error');
        r.readAsDataURL(f);
    }

    async addTag(i) {
        const inp = document.getElementById(`tag-${i}`);
        if (!inp) return;
        
        const v = inp.value.trim();
        if (!v) return;
        
        if (!this.store.data.team[i].tags) {
            this.store.data.team[i].tags = [];
        }
        this.store.data.team[i].tags.push(v);
        inp.value = '';
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
    }

    async removeTag(i, ti) {
        if (!this.store.data?.team[i]?.tags) return;
        this.store.data.team[i].tags.splice(ti, 1);
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
    }

    async addMember() {
        this.store.data.team.push({
            id: 'm_' + Date.now(),
            name: { en: 'New Member', ru: 'Новый участник' },
            role: { en: 'Role', ru: 'Роль' },
            photo: '',
            level: '',
            description: { en: '', ru: '' },
            conditions: { en: '', ru: '' },
            portfolioItems: [],
            tags: [],
            status: 'online'
        });
        
        AdminApp.markUnsaved();
        await this.store.save();
        await this.store.addActivity('Добавлен новый участник команды', 'success');
        this.render();
        Toast.show('Участник добавлен!', 'success');
    }

    async removeMember(i) {
        if (!confirm('Удалить участника?')) return;
        
        const name = this.store.data.team[i]?.name?.ru || 'Участник';
        this.store.data.team.splice(i, 1);
        
        AdminApp.markUnsaved();
        await this.store.save();
        await this.store.addActivity(`Участник "${name}" удалён`, 'warning');
        this.render();
        Toast.show('Участник удалён', 'warning');
    }
}

// ===== WORKS EDITOR (КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ #23) =====
class WorksEditor {
    constructor(store) {
        this.store = store;
        this.list = document.getElementById('works-edit-list');
        this._dragIdx = null;
        
        this.render();
        
        document.getElementById('add-category-btn')?.addEventListener('click', () => this.addCat());
        
        window.addEventListener('adminPageChange', e => { 
            if (e.detail.page === 'works') this.render(); 
        });
    }
    
    render() {
        if (!this.store.data || !this.list) return;
        
        const sorted = this.store.getWorksSorted();
        
        this.list.innerHTML = sorted.map((w, i) => {
            const realIdx = this.store.data.works.indexOf(w);
            return `
            <div class="works-edit-item" data-work-index="${realIdx}" draggable="true"
                ondragstart="worksEditor.dragStart(event,${realIdx})"
                ondragover="worksEditor.dragOver(event)"
                ondrop="worksEditor.drop(event,${realIdx})"
                ondragend="worksEditor.dragEnd(event)">
                <div class="works-edit-item__header" onclick="worksEditor.toggle('wbody-r${realIdx}')">
                    <div style="cursor:grab;padding:0 8px;color:#9ca3af;font-size:1.2rem;" title="Перетащите для сортировки">⠿</div>
                    <div class="works-edit-item__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                    <div class="works-edit-item__info">
                        <div class="works-edit-item__title">${this.escapeHtml(w.title.ru || w.title.en)}</div>
                        <div class="works-edit-item__subtitle">${this.escapeHtml(w.description.ru || w.description.en)}</div>
                    </div>
                    <div class="works-edit-item__meta">
                        <span class="works-edit-item__count">${(w.photos || []).length} фото</span>
                    </div>
                </div>
                <div class="works-edit-item__body" id="wbody-r${realIdx}">
                    <div class="form-row" style="margin-bottom:16px;">
                        <div class="form-field">
                            <label class="form-field__label">Название EN</label>
                            <input class="admin-input" value="${this.escapeHtml(w.title.en)}" 
                                onchange="worksEditor.updateField(${realIdx},'title.en',this.value)">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">Название RU</label>
                            <input class="admin-input" value="${this.escapeHtml(w.title.ru)}" 
                                onchange="worksEditor.updateField(${realIdx},'title.ru',this.value)">
                        </div>
                    </div>
                    <div class="form-row" style="margin-bottom:16px;">
                        <div class="form-field">
                            <label class="form-field__label">Описание EN</label>
                            <input class="admin-input" value="${this.escapeHtml(w.description.en)}" 
                                onchange="worksEditor.updateField(${realIdx},'description.en',this.value)">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">Описание RU</label>
                            <input class="admin-input" value="${this.escapeHtml(w.description.ru)}" 
                                onchange="worksEditor.updateField(${realIdx},'description.ru',this.value)">
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="admin-btn admin-btn--sm" onclick="worksEditor.moveUp(${realIdx})">⬆ Вверх</button>
                        <button class="admin-btn admin-btn--sm" onclick="worksEditor.moveDown(${realIdx})">⬇ Вниз</button>
                        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="worksEditor.removeCat(${realIdx})">🗑 Удалить</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    toggle(id) { 
        document.getElementById(id)?.classList.toggle('open'); 
    }
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Было team[i], стало works[i]
    async updateField(i, path, val) {
        if (!this.store.data?.works[i]) return;  // ✅ ИСПРАВЛЕНО: works вместо team
        
        const p = path.split('.');
        let o = this.store.data.works[i];  // ✅ ИСПРАВЛЕНО: works вместо team
        for (let k = 0; k < p.length - 1; k++) {
            if (!o[p[k]]) o[p[k]] = {};
            o = o[p[k]];
        }
        o[p[p.length - 1]] = val;
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
    }
    
    async addCat() {
        const maxOrder = this.store.data.works.reduce((m, w) => Math.max(m, w.order || 0), -1);
        
        this.store.data.works.push({
            id: 'cat_' + Date.now(),
            title: { en: 'New Category', ru: 'Новая категория' },
            description: { en: 'Description', ru: 'Описание' },
            photos: [],
            icon: 'circles',
            order: maxOrder + 1
        });
        
        AdminApp.markUnsaved();
        const ok = await this.store.save();
        
        if (ok) {
            await this.store.addActivity('Создана новая категория', 'success');
            Toast.show('Категория создана!', 'success');
        } else {
            Toast.show('Категория создана (локально)', 'warning');
        }
        
        this.render();
        
        // Обновить badges
        const bw = document.getElementById('badge-works');
        const sw = document.getElementById('stat-works');
        if (bw) bw.textContent = this.store.data.works.length;
        if (sw) sw.textContent = this.store.data.works.length;
    }
    
    async removeCat(i) {
        if (!confirm('Удалить категорию и все её фото?')) return;
        
        const name = this.store.data.works[i]?.title?.ru || this.store.data.works[i]?.title?.en || 'Категория';
        this.store.data.works.splice(i, 1);
        
        AdminApp.markUnsaved();
        await this.store.save();
        await this.store.addActivity(`Категория "${name}" удалена`, 'warning');
        this.render();
        Toast.show('Удалена', 'warning');
        
        // Обновить badges
        const bw = document.getElementById('badge-works');
        const sw = document.getElementById('stat-works');
        if (bw) bw.textContent = this.store.data.works.length;
        if (sw) sw.textContent = this.store.data.works.length;
    }
    
    // Drag & Drop
    dragStart(e, idx) { 
        this._dragIdx = idx; 
        e.target.style.opacity = '0.5'; 
    }
    
    dragOver(e) { 
        e.preventDefault(); 
        e.currentTarget.classList.add('drag-over');
    }
    
    dragEnd(e) { 
        e.target.style.opacity = '1'; 
        document.querySelectorAll('.works-edit-item').forEach(el => {
            el.classList.remove('drag-over');
        });
    }
    
    async drop(e, targetIdx) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        if (this._dragIdx === null || this._dragIdx === targetIdx) return;
        
        const works = this.store.data.works;
        const dragOrder = works[this._dragIdx]?.order || 0;
        const targetOrder = works[targetIdx]?.order || 0;
        
        works[this._dragIdx].order = targetOrder;
        works[targetIdx].order = dragOrder;
        
        this._dragIdx = null;
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
        Toast.show('Порядок изменён', 'info');
    }
    
    async moveUp(i) {
        const sorted = this.store.getWorksSorted();
        const currentWork = this.store.data.works[i];
        const pos = sorted.indexOf(currentWork);
        
        if (pos <= 0) return;
        
        const prevWork = sorted[pos - 1];
        const prevIdx = this.store.data.works.indexOf(prevWork);
        
        const tmpOrder = currentWork.order;
        currentWork.order = prevWork.order;
        prevWork.order = tmpOrder;
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
    }
    
    async moveDown(i) {
        const sorted = this.store.getWorksSorted();
        const currentWork = this.store.data.works[i];
        const pos = sorted.indexOf(currentWork);
        
        if (pos >= sorted.length - 1) return;
        
        const nextWork = sorted[pos + 1];
        const nextIdx = this.store.data.works.indexOf(nextWork);
        
        const tmpOrder = currentWork.order;
        currentWork.order = nextWork.order;
        nextWork.order = tmpOrder;
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.render();
    }
}

// ===== PORTFOLIO MANAGER (ИСПРАВЛЕННЫЙ) =====
class PortfolioManager {
    constructor(store, photoEditor) {
        this.store = store;
        this.editor = photoEditor;
        this.currentCat = null;
        this._pendingFiles = [];
        this._selectedPhotos = new Set();
        this._dragPhotoIdx = null;
        this._editingIndex = null;
        
        this.render();
        
        window.addEventListener('adminPageChange', e => { 
            if (e.detail.page === 'portfolio') this.render(); 
        });
        
        // Modal events
        document.getElementById('modal-photo-save')?.addEventListener('click', () => this.saveNewPhoto());
        
        const upload = document.getElementById('modal-photo-upload');
        const fileInput = document.getElementById('modal-file-input');
        
        if (upload && fileInput) {
            upload.addEventListener('click', () => fileInput.click());
            upload.addEventListener('dragover', e => { e.preventDefault(); upload.classList.add('dragover'); });
            upload.addEventListener('dragleave', () => upload.classList.remove('dragover'));
            upload.addEventListener('drop', e => { 
                e.preventDefault(); 
                upload.classList.remove('dragover'); 
                this.previewFiles(e.dataTransfer.files); 
            });
            fileInput.addEventListener('change', () => { 
                if (fileInput.files.length) this.previewFiles(fileInput.files); 
            });
        }
        
        // Search input
        const searchInput = document.getElementById('portfolio-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.search(e.target.value));
        }

        this.store.onChange(() => this.renderWorkspace());
    }

    render() { 
        this.renderCategories(); 
        this.renderWorkspace(); 
    }

    renderCategories() {
        if (!this.store.data) return;
        
        const sorted = this.store.getWorksSorted();
        const el = document.getElementById('portfolio-categories');
        if (!el) return;
        
        el.innerHTML = sorted.map((w) => {
            const i = this.store.data.works.indexOf(w);
            return `<button class="portfolio-cat-btn ${this.currentCat === i ? 'active' : ''}" onclick="portfolioManager.selectCat(${i})">
                ${this.escapeHtml(w.title.ru || w.title.en)}
                <span class="portfolio-cat-btn__count">${(w.photos || []).length}</span>
            </button>`;
        }).join('');
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    selectCat(i) {
        this.currentCat = i;
        this._selectedPhotos.clear();
        
        const searchInput = document.getElementById('portfolio-search-input');
        if (searchInput) searchInput.value = '';
        
        const searchBlock = document.getElementById('portfolio-search');
        if (searchBlock) searchBlock.style.display = 'flex';

        this.renderCategories();
        this.renderWorkspace();
    }

    renderWorkspace(filteredPhotos = null) {
        if (!this.store.data) return;
        
        const el = document.getElementById('portfolio-workspace');
        if (!el) return;
        
        if (this.currentCat === null) {
            el.innerHTML = `<div class="portfolio-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Выберите категорию</p>
            </div>`;
            
            const searchBlock = document.getElementById('portfolio-search');
            if (searchBlock) searchBlock.style.display = 'none';
            return;
        }

        const w = this.store.data.works[this.currentCat];
        if (!w) return;
        
        const photos = filteredPhotos || w.photos || [];
        const isSearchMode = filteredPhotos !== null;

        const bulkBtn = this._selectedPhotos.size > 0 
            ? `<button class="admin-btn admin-btn--danger" onclick="portfolioManager.deleteBulk()">Удалить (${this._selectedPhotos.size})</button>` 
            : '';

        el.innerHTML = `
            <div class="portfolio-grid-header">
                <h3>📂 ${this.escapeHtml(w.title.ru || w.title.en)} <span style="color:#9ca3af;font-weight:400;">(${photos.length} проектов)</span></h3>
                <div style="display:flex;gap:10px;">
                    ${bulkBtn}
                    <button class="admin-btn admin-btn--primary" onclick="portfolioManager.openAddModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Добавить
                    </button>
                </div>
            </div>
            ${photos.length === 0 ? `
                <div class="portfolio-empty" style="padding:60px 20px;">
                    <p>Нет проектов</p>
                </div>
            ` : `<div class="portfolio-photo-grid">
                    ${photos.map((p) => {
                        const pi = (w.photos || []).indexOf(p);
                        const isSelected = this._selectedPhotos.has(pi);
                        const filesCount = (p.files || []).length;
                        
                        return `
                        <div class="portfolio-photo-card ${isSelected ? 'selected' : ''}" 
                             onclick="portfolioManager.openEditor(${pi})"
                             draggable="${!isSearchMode}"
                             ondragstart="portfolioManager.dragStart(event, ${pi})"
                             ondragover="portfolioManager.dragOver(event)"
                             ondrop="portfolioManager.drop(event, ${pi})"
                             ondragend="portfolioManager.dragEnd(event)">
                            
                            <div class="portfolio-photo-card__actions" onclick="event.stopPropagation()">
                                <input type="checkbox" style="width:18px;height:18px;accent-color:#a855f7;cursor:pointer;" 
                                    ${isSelected ? 'checked' : ''} 
                                    onchange="portfolioManager.toggleSelect(${pi})">
                            </div>
                            
                            <img class="portfolio-photo-card__img" src="${p.url}" alt="${this.escapeHtml(p.name || '')}">
                            <div class="portfolio-photo-card__info">
                                <div class="portfolio-photo-card__name">
                                    ${this.escapeHtml(p.name || 'Без названия')} 
                                    ${filesCount > 0 ? `<span style="color:#a855f7;">(+${filesCount})</span>` : ''}
                                </div>
                                <div class="portfolio-photo-card__meta">
                                    ${p.author ? this.store.getAuthorName(p.author, 'ru') : 'Автор не указан'}
                                </div>
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>`}`;
    }

    search(query) {
        if (!query.trim()) { 
            this.renderWorkspace(null); 
            return; 
        }
        
        const q = query.toLowerCase();
        if (this.currentCat === null) return;
        
        const w = this.store.data.works[this.currentCat];
        
        const filtered = (w.photos || []).filter(p => 
            (p.name || '').toLowerCase().includes(q) || 
            (p.description || '').toLowerCase().includes(q)
        );
        this.renderWorkspace(filtered);
    }

    // Drag & Drop для фото
    dragStart(e, idx) {
        this._dragPhotoIdx = idx;
        e.target.style.opacity = '0.5';
    }
    
    dragOver(e) {
        e.preventDefault();
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.4)';
    }
    
    dragEnd(e) {
        e.target.style.opacity = '1';
        document.querySelectorAll('.portfolio-photo-card').forEach(el => {
            el.style.transform = '';
            el.style.boxShadow = '';
        });
    }
    
    async drop(e, targetIdx) {
        e.preventDefault();
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        
        if (this._dragPhotoIdx === null || this._dragPhotoIdx === targetIdx) return;
        if (this.currentCat === null) return;
        
        const photos = this.store.data.works[this.currentCat].photos;
        if (!photos) return;
        
        const item = photos.splice(this._dragPhotoIdx, 1)[0];
        photos.splice(targetIdx, 0, item);
        
        this._dragPhotoIdx = null;
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.renderWorkspace();
        Toast.show('Порядок изменён', 'info');
    }

    toggleSelect(pi) {
        if (this._selectedPhotos.has(pi)) {
            this._selectedPhotos.delete(pi);
        } else {
            this._selectedPhotos.add(pi);
        }
        this.renderWorkspace();
    }

    async deleteBulk() {
        if (!confirm(`Удалить выбранные проекты (${this._selectedPhotos.size})?`)) return;
        
        const w = this.store.data.works[this.currentCat];
        w.photos = w.photos.filter((_, idx) => !this._selectedPhotos.has(idx));
        
        this._selectedPhotos.clear();
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.renderWorkspace();
        this.renderCategories();
        Toast.show('Проекты удалены', 'success');
    }

    openAddModal() {
        this._pendingFiles = [];
        
        const urlInput = document.getElementById('modal-url-input');
        const nameInput = document.getElementById('modal-photo-name');
        const authorSelect = document.getElementById('modal-photo-author');
        const descInput = document.getElementById('modal-photo-desc');
        const formatSelect = document.getElementById('modal-photo-format');
        const fileInput = document.getElementById('modal-file-input');
        const preview = document.getElementById('modal-photo-preview');
        const extraPreviews = document.getElementById('modal-extra-previews');
        
        if (urlInput) urlInput.value = '';
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        if (formatSelect) formatSelect.value = 'auto';
        if (fileInput) fileInput.value = '';
        if (preview) preview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
        if (extraPreviews) extraPreviews.innerHTML = '';
        
        if (authorSelect) {
            authorSelect.innerHTML = '<option value="">— Не указан —</option>';
            this.store.data.team.forEach(m => { 
                authorSelect.innerHTML += `<option value="${m.id}">${this.escapeHtml(m.name.ru || m.name.en)}</option>`; 
            });
        }
        
        AdminApp.openModal('photo-modal');
    }

    previewFiles(fileList) {
        this._pendingFiles = [];
        const previewMain = document.getElementById('modal-photo-preview');
        const previewExtra = document.getElementById('modal-extra-previews');
        
        if (previewExtra) previewExtra.innerHTML = '';
        
        Array.from(fileList).forEach((f, idx) => {
            const r = new FileReader();
            r.onload = e => {
                const isVideo = f.type.startsWith('video/');
                this._pendingFiles.push({ 
                    data: e.target.result, 
                    type: isVideo ? 'video' : 'image', 
                    name: f.name 
                });
                
                if (idx === 0 && previewMain) {
                    previewMain.innerHTML = isVideo 
                        ? `<video src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" muted autoplay loop></video>`
                        : `<img src="${e.target.result}" alt="preview">`;
                } else if (previewExtra) {
                    previewExtra.innerHTML += `<div style="width:60px;height:60px;border-radius:8px;overflow:hidden;border:1px solid rgba(139,92,246,0.2);">
                        ${isVideo 
                            ? `<video src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" muted></video>`
                            : `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`}
                    </div>`;
                }
            };
            r.readAsDataURL(f);
        });
    }

    async saveNewPhoto() {
        const urlInput = document.getElementById('modal-url-input');
        
        if (this._pendingFiles.length === 0 && !urlInput?.value.trim()) {
            Toast.show('Выберите файлы', 'error'); 
            return;
        }
        if (this.currentCat === null) return;
        
        Toast.show('Загрузка...', 'info', 3000);
        
        const w = this.store.data.works[this.currentCat];
        if (!w.photos) w.photos = [];
        
        let mainUrl = '';
        const extraFiles = [];
        
        try {
            if (this._pendingFiles.length > 0) {
                const main = this._pendingFiles[0];
                mainUrl = await this.store.uploadImage(main.data, `work_${Date.now()}_0`);
                
                for (let i = 1; i < this._pendingFiles.length; i++) {
                    const f = this._pendingFiles[i];
                    const url = await this.store.uploadImage(f.data, `work_${Date.now()}_${i}`);
                    extraFiles.push({ url, type: f.type, name: f.name });
                }
            } else {
                mainUrl = urlInput.value.trim();
            }
            
            const nameInput = document.getElementById('modal-photo-name');
            const authorSelect = document.getElementById('modal-photo-author');
            const descInput = document.getElementById('modal-photo-desc');
            const formatSelect = document.getElementById('modal-photo-format');
            
            w.photos.push({
                url: mainUrl,
                name: nameInput?.value.trim() || `Проект ${w.photos.length + 1}`,
                author: authorSelect?.value || '',
                description: descInput?.value.trim() || '',
                format: formatSelect?.value || 'auto',
                date: new Date().toISOString(),
                files: extraFiles
            });
            
            AdminApp.markUnsaved();
            await this.store.save();
            await this.store.addActivity(`Проект добавлен в "${w.title.ru}"`, 'success');
            AdminApp.closeModal('photo-modal');
            this.renderWorkspace();
            this.renderCategories();
            Toast.show(`Проект добавлен (${1 + extraFiles.length} файлов)!`, 'success');
        } catch (err) {
            console.error('Save error:', err);
            Toast.show('Ошибка сохранения', 'error');
        }
    }

    openEditor(pi) {
        if (this.currentCat === null) return;
        
        const photo = this.store.data.works[this.currentCat]?.photos?.[pi];
        if (!photo) return;
        
        this._editingIndex = pi;
        
        if (this.editor) {
            this.editor.load(photo.url);
            this.editor.onSave = () => this.saveEditor();
        }
        
        const nameInput = document.getElementById('pe-photo-name');
        const descInput = document.getElementById('pe-photo-desc');
        const formatSelect = document.getElementById('pe-photo-format');
        const authorSelect = document.getElementById('pe-photo-author');
        
        if (nameInput) nameInput.value = photo.name || '';
        if (descInput) descInput.value = photo.description || '';
        if (formatSelect) formatSelect.value = photo.format || 'auto';
        
        if (authorSelect) {
            authorSelect.innerHTML = '<option value="">— Не указан —</option>';
            this.store.data.team.forEach(m => {
                authorSelect.innerHTML += `<option value="${m.id}" ${m.id === photo.author ? 'selected' : ''}>${this.escapeHtml(m.name.ru || m.name.en)}</option>`;
            });
        }
        
        // Extra files
        const extraEl = document.getElementById('pe-extra-files');
        if (extraEl) {
            const files = photo.files || [];
            if (files.length > 0) {
                extraEl.innerHTML = `
                    <label class="form-field__label">📎 Доп. файлы (${files.length})</label>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
                        ${files.map((f, fi) => `
                            <div style="position:relative;width:80px;height:60px;border-radius:8px;overflow:hidden;border:1px solid rgba(139,92,246,0.15);">
                                ${f.type === 'video' 
                                    ? `<video src="${f.url}" style="width:100%;height:100%;object-fit:cover;" muted></video>` 
                                    : `<img src="${f.url}" style="width:100%;height:100%;object-fit:cover;">`}
                                <button onclick="portfolioManager.removeExtraFile(${fi})" 
                                    style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,0.9);border:none;border-radius:50%;width:16px;height:16px;color:white;font-size:9px;cursor:pointer;">×</button>
                            </div>
                        `).join('')}
                        <label style="width:80px;height:60px;border:2px dashed rgba(139,92,246,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#a855f7;font-size:1.2rem;">
                            +<input type="file" accept="image/*,video/*" multiple style="display:none" onchange="portfolioManager.addExtraFiles(this)">
                        </label>
                    </div>`;
            } else {
                extraEl.innerHTML = `
                    <label class="form-field__label">📎 Доп. файлы</label>
                    <label style="display:flex;align-items:center;gap:8px;padding:10px;border:2px dashed rgba(139,92,246,0.15);border-radius:10px;cursor:pointer;color:#9ca3af;font-size:0.85rem;margin-top:6px;">
                        + Добавить файлы
                        <input type="file" accept="image/*,video/*" multiple style="display:none" onchange="portfolioManager.addExtraFiles(this)">
                    </label>`;
            }
        }
        
        AdminApp.openModal('edit-photo-modal');
    }

    async addExtraFiles(input) {
        if (this.currentCat === null || this._editingIndex === null) return;
        
        const photo = this.store.data.works[this.currentCat]?.photos?.[this._editingIndex];
        if (!photo) return;
        
        if (!photo.files) photo.files = [];
        
        Toast.show('Загрузка файлов...', 'info', 2000);
        
        for (const f of input.files) {
            const isVideo = f.type.startsWith('video/');
            const data = await new Promise(resolve => { 
                const r = new FileReader(); 
                r.onload = e => resolve(e.target.result); 
                r.readAsDataURL(f); 
            });
            const url = await this.store.uploadImage(data, `extra_${Date.now()}`);
            photo.files.push({ url, type: isVideo ? 'video' : 'image', name: f.name });
        }
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.openEditor(this._editingIndex);
        Toast.show('Файлы добавлены!', 'success');
    }

    async removeExtraFile(fi) {
        if (this.currentCat === null || this._editingIndex === null) return;
        
        const photo = this.store.data.works[this.currentCat]?.photos?.[this._editingIndex];
        if (!photo?.files) return;
        
        photo.files.splice(fi, 1);
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.openEditor(this._editingIndex);
    }

    async saveEditor() {
        if (this.currentCat === null || this._editingIndex === null) return;
        
        const photo = this.store.data.works[this.currentCat]?.photos?.[this._editingIndex];
        if (!photo) return;
        
        const nameInput = document.getElementById('pe-photo-name');
        const descInput = document.getElementById('pe-photo-desc');
        const authorSelect = document.getElementById('pe-photo-author');
        const formatSelect = document.getElementById('pe-photo-format');
        
        photo.name = nameInput?.value.trim() || photo.name;
        photo.description = descInput?.value.trim() || '';
        photo.author = authorSelect?.value || '';
        photo.format = formatSelect?.value || 'auto';
        
        // Сохраняем отредактированное изображение если редактор есть
        if (this.editor) {
            const newUrl = this.editor.getDataURL();
            if (newUrl && newUrl !== photo.url) {
                Toast.show('Сохранение изображения...', 'info', 2000);
                photo.url = await this.store.uploadImage(newUrl, `edited_${Date.now()}`);
            }
        }
        
        AdminApp.markUnsaved();
        await this.store.save();
        await this.store.addActivity(`Проект "${photo.name}" отредактирован`, 'success');
        AdminApp.closeModal('edit-photo-modal');
        this.renderWorkspace();
        Toast.show('Сохранено!', 'success');
    }

    async deletePhoto(pi) {
        if (!confirm('Удалить проект?')) return;
        if (this.currentCat === null) return;
        
        this.store.data.works[this.currentCat].photos.splice(pi, 1);
        
        AdminApp.markUnsaved();
        await this.store.save();
        this.renderWorkspace();
        this.renderCategories();
        Toast.show('Удалено', 'warning');
    }
}

// ===== HERO EDITOR =====
class HeroEditor {
    constructor(store) { 
        this.store = store; 
        this.el = document.getElementById('hero-editor'); 
        this.render(); 
        
        window.addEventListener('adminPageChange', e => { 
            if (e.detail.page === 'hero') this.render(); 
        }); 
    }
    
    render() {
        if (!this.store.data || !this.el) return;
        
        const s = this.store.data.hero?.stats || { projects: 0, clients: 0, years: 0 };
        
        this.el.innerHTML = `
            <div style="background:white;border:1px solid rgba(139,92,246,0.1);border-radius:16px;padding:24px;">
                <h3 style="margin-bottom:16px;font-size:1rem;">📊 Статистика на сайте</h3>
                <div class="form-row">
                    <div class="form-field">
                        <label class="form-field__label">Проектов</label>
                        <input type="number" class="admin-input" value="${s.projects}" onchange="heroEditor.set('projects',+this.value)">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label">Клиентов</label>
                        <input type="number" class="admin-input" value="${s.clients}" onchange="heroEditor.set('clients',+this.value)">
                    </div>
                </div>
                <div class="form-row form-row--full">
                    <div class="form-field">
                        <label class="form-field__label">Лет опыта</label>
                        <input type="number" class="admin-input" value="${s.years}" onchange="heroEditor.set('years',+this.value)">
                    </div>
                </div>
            </div>`;
    }
    
    async set(k, v) { 
        if (!this.store.data.hero) this.store.data.hero = { stats: {} };
        if (!this.store.data.hero.stats) this.store.data.hero.stats = {};
        
        this.store.data.hero.stats[k] = v; 
        AdminApp.markUnsaved();
        await this.store.save(); 
        Toast.show('Обновлено!', 'success'); 
    }
}

// ===== SETTINGS =====
class SettingsEditor {
    constructor(store) { 
        this.store = store; 
        this.el = document.getElementById('settings-editor'); 
        this.render(); 
        
        window.addEventListener('adminPageChange', e => { 
            if (e.detail.page === 'settings') this.render(); 
        }); 
    }
    
    render() {
        if (!this.store.data || !this.el) return;
        
        const s = this.store.data.settings || {};
        const lm = s.lastModified ? new Date(s.lastModified).toLocaleString('ru-RU') : 'Никогда';
        
        this.el.innerHTML = `
            <div style="background:white;border:1px solid rgba(139,92,246,0.1);border-radius:16px;padding:24px;margin-bottom:16px;">
                <h3 style="margin-bottom:12px;">🔐 Пароль</h3>
                <div style="display:flex;gap:8px;">
                    <input type="password" class="admin-input" value="${s.password || ''}" id="set-pw">
                    <button class="admin-btn admin-btn--sm" onclick="settingsEditor.togglePw()">👁</button>
                    <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="settingsEditor.savePw()">Сохранить</button>
                </div>
            </div>
            <div style="background:white;border:1px solid rgba(139,92,246,0.1);border-radius:16px;padding:24px;margin-bottom:16px;">
                <p style="font-size:0.85rem;color:#6b7280;">Последнее изменение: ${lm}</p>
                <p style="font-size:0.85rem;color:#6b7280;margin-top:4px;">💾 Данные хранятся на сервере и доступны всем</p>
            </div>
            <div style="background:white;border:1px solid rgba(239,68,68,0.15);border-radius:16px;padding:24px;">
                <h3 style="margin-bottom:12px;">⚠️ Опасная зона</h3>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="admin-btn admin-btn--danger" onclick="settingsEditor.resetAll()">Сбросить всё</button>
                    <button class="admin-btn" onclick="settingsEditor.exportJSON()">📦 Экспорт</button>
                    <button class="admin-btn" onclick="settingsEditor.showImport()">📥 Импорт</button>
                </div>
                <div class="import-area" id="import-area">
                    <p style="margin-bottom:12px;font-size:0.85rem;color:#6b7280;">Перетащите JSON файл или вставьте данные:</p>
                    <textarea class="admin-textarea" id="import-json" style="min-height:100px;" placeholder='{"team":[...],"works":[...]}'></textarea>
                    <div style="display:flex;gap:8px;margin-top:12px;">
                        <button class="admin-btn admin-btn--primary" onclick="settingsEditor.doImport()">Импортировать</button>
                        <button class="admin-btn" onclick="settingsEditor.hideImport()">Отмена</button>
                    </div>
                </div>
            </div>`;
    }
    
    togglePw() { 
        const e = document.getElementById('set-pw'); 
        if (e) e.type = e.type === 'password' ? 'text' : 'password'; 
    }
    
    async savePw() { 
        const pwInput = document.getElementById('set-pw');
        const p = pwInput?.value.trim(); 
        
        if (!p || p.length < 4) { 
            Toast.show('Минимум 4 символа', 'error'); 
            return; 
        } 
        
        this.store.data.settings.password = p; 
        AdminApp.markUnsaved();
        await this.store.save(); 
        Toast.show('Пароль сохранён!', 'success'); 
    }
    
    async resetAll() { 
        if (!confirm('Сбросить ВСЕ данные?')) return; 
        if (!confirm('Точно? Это необратимо!')) return; 
        
        await this.store.reset(); 
        Toast.show('Данные сброшены', 'warning');
        setTimeout(() => location.reload(), 1000); 
    }
    
    exportJSON() { 
        const b = new Blob([JSON.stringify(this.store.data, null, 2)], { type: 'application/json' }); 
        const a = document.createElement('a'); 
        a.href = URL.createObjectURL(b); 
        a.download = `tish-${new Date().toISOString().slice(0, 10)}.json`; 
        a.click(); 
        Toast.show('Экспортировано!', 'success'); 
    }
    
    showImport() {
        const area = document.getElementById('import-area');
        if (area) area.classList.add('visible');
    }
    
    hideImport() {
        const area = document.getElementById('import-area');
        if (area) area.classList.remove('visible');
    }
    
    async doImport() {
        const textarea = document.getElementById('import-json');
        const json = textarea?.value.trim();
        
        if (!json) {
            Toast.show('Вставьте JSON данные', 'error');
            return;
        }
        
        try {
            const data = JSON.parse(json);
            if (!data.team || !data.works) {
                Toast.show('Неверный формат данных', 'error');
                return;
            }
            
            if (!confirm('Заменить все текущие данные?')) return;
            
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                Toast.show('Импорт успешен!', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                Toast.show('Ошибка импорта', 'error');
            }
        } catch (e) {
            Toast.show('Ошибка парсинга JSON', 'error');
        }
    }
}

// ===== AUTO SAVE (ИСПРАВЛЕННЫЙ #24) =====
class AutoSave {
    constructor(store) {
        this.store = store;
        this.interval = null;
        this._lastDataHash = null;
        this.start();
    }

    start() {
        // Сохраняем начальный хэш
        this._lastDataHash = this.getDataHash();
        
        // Проверяем каждые 2 минуты
        this.interval = setInterval(async () => {
            const currentHash = this.getDataHash();
            
            // Если данные изменились
            if (currentHash !== this._lastDataHash) {
                console.log('🔄 Auto-saving (changes detected)...');
                const ok = await this.store.save();
                
                if (ok) {
                    this._lastDataHash = currentHash;
                    this.updateLastSaved();
                    AdminApp.markSaved();
                }
            }
        }, 120000); // 2 минуты
    }
    
    getDataHash() {
        try {
            return JSON.stringify(this.store.data).length;
        } catch {
            return 0;
        }
    }

    updateLastSaved() {
        const el = document.getElementById('topbar-last-saved');
        if (el) {
            const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            el.textContent = `Автосохранение: ${time}`;
        }
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

// ===== INIT =====
let teamEditor, worksEditor, portfolioManager, heroEditor, settingsEditor, photoEditor;

document.addEventListener('DOMContentLoaded', async () => {
    const store = new AdminStore();
    AdminApp.store = store;
    
    await store.ensureLoaded(true);

    new AuthSystem(store);
    new Navigation();
    new Dashboard(store);
    
    photoEditor = new PhotoEditorEngine();
    teamEditor = new TeamEditor(store);
    worksEditor = new WorksEditor(store);
    portfolioManager = new PortfolioManager(store, photoEditor);
    heroEditor = new HeroEditor(store);
    settingsEditor = new SettingsEditor(store);

    // Global exports
    window.teamEditor = teamEditor;
    window.worksEditor = worksEditor;
    window.portfolioManager = portfolioManager;
    window.heroEditor = heroEditor;
    window.settingsEditor = settingsEditor;
    window.photoEditor = photoEditor;
    
    new AutoSave(store);

    console.log('🟣 TISH Admin Panel ready (server-synced)');
});