/* =====================================================
   TISH TEAM — ADMIN PANEL
   with Portfolio Manager & Photo Editor
   ===================================================== */

const AdminApp = {
    store: null,
    openModal(id) {
        document.getElementById(id)?.classList.add('open');
        document.body.style.overflow = 'hidden';
    },
    closeModal(id) {
        document.getElementById(id)?.classList.remove('open');
        document.body.style.overflow = '';
    }
};

// ===== TOAST =====
class Toast {
    static show(msg, type = 'info', dur = 4000) {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast toast--${type}`;
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        t.innerHTML = `<span class="toast__icon">${icons[type]||icons.info}</span><span class="toast__text">${msg}</span>
            <button class="toast__close" onclick="this.parentElement.classList.add('removing');setTimeout(()=>this.parentElement.remove(),300)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
        c.appendChild(t);
        setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, dur);
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
        if (sessionStorage.getItem('tish_admin_auth') === 'true') this.showAdmin();
        this.form.addEventListener('submit', e => this.login(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('toggle-password').addEventListener('click', () => {
            this.passInput.type = this.passInput.type === 'password' ? 'text' : 'password';
        });
        this.passInput.addEventListener('input', () => { this.passInput.classList.remove('error'); this.errorEl.classList.remove('visible'); });
    }
    login(e) {
        e.preventDefault();
        const pw = this.passInput.value.trim();
        if (!pw) { this.passInput.classList.add('error'); return; }
        this.btn.classList.add('loading');
        setTimeout(() => {
            if (pw === this.store.data.settings.password) {
                sessionStorage.setItem('tish_admin_auth', 'true');
                this.showAdmin();
                Toast.show('Добро пожаловать!', 'success');
            } else {
                this.passInput.classList.add('error');
                this.errorEl.classList.add('visible');
                this.btn.classList.remove('loading');
            }
        }, 600);
    }
    showAdmin() { document.getElementById('login-screen').classList.add('hidden'); document.getElementById('admin-layout').classList.add('visible'); }
    logout() { sessionStorage.removeItem('tish_admin_auth'); document.getElementById('admin-layout').classList.remove('visible'); document.getElementById('login-screen').classList.remove('hidden'); this.passInput.value=''; this.btn.classList.remove('loading'); }
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
            dashboard:['Дашборд','Главная панель'],team:['Команда','Участники'],works:['Категории','Управление категориями'],
            portfolio:['Портфолио','Управление фотографиями'],hero:['Hero секция','Статистика'],settings:['Настройки','Конфигурация']
        };
        this.links.forEach(l => l.addEventListener('click', () => this.go(l.dataset.page)));
        document.getElementById('burger-btn')?.addEventListener('click', () => this.sidebar.classList.toggle('open'));
    }
    go(id) {
        this.links.forEach(l => l.classList.toggle('active', l.dataset.page === id));
        this.pages.forEach(p => { p.classList.remove('active'); if(p.id===`page-${id}`){p.classList.add('active');p.style.animation='none';p.offsetHeight;p.style.animation='';} });
        const i = this.titles[id]||[id,''];
        this.titleEl.textContent = i[0]; this.breadEl.textContent = i[1];
        this.sidebar.classList.remove('open');
        window.dispatchEvent(new CustomEvent('adminPageChange', { detail: { page: id } }));
    }
}

// ===== DASHBOARD =====
class Dashboard {
    constructor(store) {
        this.store = store; this.update(); this.renderLog();
        document.getElementById('clear-log-btn')?.addEventListener('click', () => { store.clearActivities(); this.renderLog(); Toast.show('Лог очищен','info'); });
        document.getElementById('save-all-btn')?.addEventListener('click', () => { if(store.save()){Toast.show('Сохранено!','success');store.addActivity('Ручное сохранение','success');this.renderLog();this.update();} });
        store.onChange(() => { this.update(); this.renderLog(); });
    }
    update() {
        const d=this.store.data;
        document.getElementById('stat-works').textContent=d.works.length;
        document.getElementById('stat-team').textContent=d.team.length;
        document.getElementById('stat-changes').textContent=this.store.changesCount;
        const bt=document.getElementById('badge-team'),bw=document.getElementById('badge-works'),bp=document.getElementById('badge-photos');
        if(bt)bt.textContent=d.team.length; if(bw)bw.textContent=d.works.length;
        let photos=0; d.works.forEach(w=>photos+=(w.photos||[]).length);
        document.getElementById('stat-photos').textContent=photos;
        if(bp)bp.textContent=photos;
    }
    renderLog() {
        const el=document.getElementById('activity-list'),acts=this.store.getActivities();
        if(!acts.length){el.innerHTML='<div class="activity-empty">Пока нет действий</div>';return;}
        el.innerHTML=acts.map(a=>{const t=new Date(a.time);return`<div class="activity-item"><div class="activity-item__dot activity-item__dot--${a.type}"></div><div><div class="activity-item__text">${a.text}</div><div class="activity-item__time">${t.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}, ${t.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</div></div></div>`;}).join('');
    }
}

// ===== PHOTO EDITOR ENGINE =====
class PhotoEditorEngine {
    constructor() {
        this.canvas = document.getElementById('pe-canvas');
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
        document.getElementById('pe-save-btn').addEventListener('click', () => this.save());
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
        if (!this.currentImage) return;
        const img = this.currentImage;
        const maxW = 600, maxH = 400;
        let w = img.width, h = img.height;

        // Scale down
        if (w > maxW) { h = h * (maxW / w); w = maxW; }
        if (h > maxH) { w = w * (maxH / h); h = maxH; }

        const isRotated = this.rotation === 90 || this.rotation === 270;
        this.canvas.width = isRotated ? h : w;
        this.canvas.height = isRotated ? w : h;

        const b = document.getElementById('pe-brightness').value;
        const c = document.getElementById('pe-contrast').value;
        const s = document.getElementById('pe-saturate').value;
        const blur = document.getElementById('pe-blur').value;

        document.getElementById('pe-brightness-val').textContent = b + '%';
        document.getElementById('pe-contrast-val').textContent = c + '%';
        document.getElementById('pe-saturate-val').textContent = s + '%';
        document.getElementById('pe-blur-val').textContent = blur + 'px';

        let filterStr = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
        if (parseFloat(blur) > 0) filterStr += ` blur(${blur}px)`;

        // Named filters
        switch (this.filterName) {
            case 'grayscale': filterStr += ' grayscale(100%)'; break;
            case 'sepia': filterStr += ' sepia(80%)'; break;
            case 'warm': filterStr += ' sepia(30%) saturate(140%)'; break;
            case 'cool': filterStr += ' hue-rotate(30deg) saturate(80%)'; break;
            case 'vintage': filterStr += ' sepia(40%) contrast(90%) brightness(110%)'; break;
        }

        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate((this.rotation * Math.PI) / 180);
        this.ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
        this.ctx.filter = filterStr;
        this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
        this.ctx.restore();
    }

    updateFilters() { this.draw(); }

    rotate(deg) {
        this.rotation = (this.rotation + deg + 360) % 360;
        this.draw();
    }

    flip(axis) {
        if (axis === 'h') this.flipH = !this.flipH;
        else this.flipV = !this.flipV;
        this.draw();
    }

    applyFilter(name) {
        this.filterName = name;
        this.draw();
    }

    reset() {
        this.rotation = 0;
        this.flipH = false;
        this.flipV = false;
        this.filterName = 'none';
        document.getElementById('pe-brightness').value = 100;
        document.getElementById('pe-contrast').value = 100;
        document.getElementById('pe-saturate').value = 100;
        document.getElementById('pe-blur').value = 0;
        this.hideCrop();
        if (this.originalImage) {
            this.currentImage = this.originalImage;
            this.draw();
        }
    }

    // ===== CROP =====
    toggleCrop() {
        if (this.cropMode) {
            this.applyCrop();
        } else {
            this.showCrop();
        }
    }

    showCrop() {
        this.cropMode = true;
        this.cropOverlay.style.display = 'block';
        document.getElementById('pe-crop-btn').classList.add('active');
        document.getElementById('pe-crop-btn').innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Применить`;
        // Reset crop box
        this.cropBox.style.top = '10%';
        this.cropBox.style.left = '10%';
        this.cropBox.style.width = '80%';
        this.cropBox.style.height = '80%';
    }

    hideCrop() {
        this.cropMode = false;
        this.cropOverlay.style.display = 'none';
        document.getElementById('pe-crop-btn').classList.remove('active');
        document.getElementById('pe-crop-btn').innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></svg> Обрезка`;
    }

    applyCrop() {
        const wrap = document.getElementById('pe-canvas-wrap');
        const wrapRect = wrap.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();

        const box = this.cropBox.getBoundingClientRect();

        // Calculate crop coordinates relative to canvas display
        const scaleX = this.canvas.width / canvasRect.width;
        const scaleY = this.canvas.height / canvasRect.height;

        const cropX = (box.left - canvasRect.left) * scaleX;
        const cropY = (box.top - canvasRect.top) * scaleY;
        const cropW = box.width * scaleX;
        const cropH = box.height * scaleY;

        if (cropW < 10 || cropH < 10) {
            Toast.show('Область слишком маленькая', 'warning');
            return;
        }

        // Get cropped image data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropW;
        tempCanvas.height = cropH;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Create new image from cropped data
        const croppedImg = new Image();
        croppedImg.onload = () => {
            this.currentImage = croppedImg;
            this.rotation = 0;
            this.flipH = false;
            this.flipV = false;
            this.draw();
            Toast.show('Обрезано!', 'success');
        };
        croppedImg.src = tempCanvas.toDataURL('image/jpeg', 0.95);

        this.hideCrop();
    }

    _setupCrop() {
        let isDragging = false;
        let dragType = '';
        let startX, startY, startLeft, startTop, startW, startH;

        const onDown = (e) => {
            if (!this.cropMode) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;

            const handle = e.target.dataset?.handle;
            if (handle) {
                dragType = handle;
            } else if (e.target === this.cropBox || e.target.parentElement === this.cropBox) {
                dragType = 'move';
            } else return;

            isDragging = true;
            const rect = this.cropBox.getBoundingClientRect();
            const parentRect = this.cropBox.parentElement.getBoundingClientRect();
            startLeft = rect.left - parentRect.left;
            startTop = rect.top - parentRect.top;
            startW = rect.width;
            startH = rect.height;
        };

        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const parent = this.cropBox.parentElement.getBoundingClientRect();

            if (dragType === 'move') {
                let newLeft = Math.max(0, Math.min(startLeft + dx, parent.width - startW));
                let newTop = Math.max(0, Math.min(startTop + dy, parent.height - startH));
                this.cropBox.style.left = (newLeft / parent.width * 100) + '%';
                this.cropBox.style.top = (newTop / parent.height * 100) + '%';
            } else {
                let newL = startLeft, newT = startTop, newW = startW, newH = startH;
                if (dragType.includes('e')) newW = Math.max(30, startW + dx);
                if (dragType.includes('w')) { newW = Math.max(30, startW - dx); newL = startLeft + dx; }
                if (dragType.includes('s')) newH = Math.max(30, startH + dy);
                if (dragType.includes('n')) { newH = Math.max(30, startH - dy); newT = startTop + dy; }
                this.cropBox.style.left = (newL / parent.width * 100) + '%';
                this.cropBox.style.top = (newT / parent.height * 100) + '%';
                this.cropBox.style.width = (newW / parent.width * 100) + '%';
                this.cropBox.style.height = (newH / parent.height * 100) + '%';
            }
        };

        const onUp = () => { isDragging = false; dragType = ''; };

        this.cropOverlay.addEventListener('mousedown', onDown);
        this.cropOverlay.addEventListener('touchstart', onDown, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchend', onUp);
    }

    getDataURL() {
        try { return this.canvas.toDataURL('image/jpeg', 0.9); }
        catch(e) { console.warn('CORS'); return null; }
    }

    save() {
        if (this.onSave) this.onSave();
    }
}

// ===== TEAM EDITOR =====
class TeamEditor {
    constructor(store) {
        this.store = store;
        this.grid = document.getElementById('team-edit-grid');
        this.render();
        document.getElementById('add-member-btn').addEventListener('click', () => this.addMember());
        document.getElementById('attach-works-save')?.addEventListener('click', () => this.saveAttached());
        window.addEventListener('adminPageChange', e => { if(e.detail.page==='team') this.render(); });
    }

    render() {
        this.grid.innerHTML = this.store.data.team.map((m, i) => `
        <div class="team-edit-card">
            <div class="team-edit-card__header">
                <div class="team-edit-card__avatar">
                    ${m.photo ? `<img src="${m.photo}" alt="">` : `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
                </div>
                <div class="team-edit-card__meta"><h3>${m.name.ru||m.name.en}</h3><p>${m.role.ru||m.role.en}</p></div>
                <div class="team-edit-card__actions">
                    <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="teamEditor.removeMember(${i})">🗑</button>
                </div>
            </div>
            <div class="team-edit-card__body">
                <div class="form-row form-row--full"><div class="form-field"><label class="form-field__label">Фото</label>
                    <div style="display:flex;gap:8px;">
                        <input type="url" class="admin-input" value="${m.photo||''}" placeholder="https://..." onchange="teamEditor.updateField(${i},'photo',this.value)">
                        <label class="admin-btn admin-btn--sm" style="cursor:pointer;">📁<input type="file" accept="image/*" style="display:none" onchange="teamEditor.uploadPhoto(${i},this)"></label>
                    </div>
                </div></div>
                <div class="form-row">
                    <div class="form-field"><label class="form-field__label">Имя EN</label><input class="admin-input" value="${m.name.en}" onchange="teamEditor.updateField(${i},'name.en',this.value)"></div>
                    <div class="form-field"><label class="form-field__label">Имя RU</label><input class="admin-input" value="${m.name.ru}" onchange="teamEditor.updateField(${i},'name.ru',this.value)"></div>
                </div>
                <div class="form-row">
                    <div class="form-field"><label class="form-field__label">Роль EN</label><input class="admin-input" value="${m.role.en}" onchange="teamEditor.updateField(${i},'role.en',this.value)"></div>
                    <div class="form-field"><label class="form-field__label">Роль RU</label><input class="admin-input" value="${m.role.ru}" onchange="teamEditor.updateField(${i},'role.ru',this.value)"></div>
                </div>
                <div class="form-row form-row--full"><div class="form-field"><label class="form-field__label">Навыки</label><input class="admin-input" value="${m.level}" onchange="teamEditor.updateField(${i},'level',this.value)"></div></div>
                <div class="form-row">
                    <div class="form-field"><label class="form-field__label">О себе EN</label><textarea class="admin-textarea" onchange="teamEditor.updateField(${i},'description.en',this.value)">${m.description.en}</textarea></div>
                    <div class="form-field"><label class="form-field__label">О себе RU</label><textarea class="admin-textarea" onchange="teamEditor.updateField(${i},'description.ru',this.value)">${m.description.ru}</textarea></div>
                </div>
                <div class="form-row">
                    <div class="form-field"><label class="form-field__label">Условия EN</label><textarea class="admin-textarea" onchange="teamEditor.updateField(${i},'conditions.en',this.value)">${m.conditions.en}</textarea></div>
                    <div class="form-field"><label class="form-field__label">Условия RU</label><textarea class="admin-textarea" onchange="teamEditor.updateField(${i},'conditions.ru',this.value)">${m.conditions.ru}</textarea></div>
                </div>
                <div class="form-row form-row--full"><div class="form-field"><label class="form-field__label">Теги</label>
                    <div class="tag-list">${(m.tags||[]).map((t,ti)=>`<span class="tag-item">${t}<button class="tag-item__remove" onclick="teamEditor.removeTag(${i},${ti})">×</button></span>`).join('')}</div>
                    <div class="tag-add"><input class="admin-input" placeholder="Тег..." id="tag-${i}" onkeydown="if(event.key==='Enter'){event.preventDefault();teamEditor.addTag(${i})}"><button class="admin-btn admin-btn--sm" onclick="teamEditor.addTag(${i})">+</button></div>
                </div></div>
                <div class="form-row form-row--full"><div class="form-field"><label class="form-field__label">📸 Привязанные работы</label>
                    <div class="member-works-grid">${this.renderWorks(m.id)}</div>
                    <button class="admin-btn admin-btn--sm admin-btn--primary" style="margin-top:10px;" onclick="teamEditor.openAttach(${i})">📎 Привязать работы</button>
                </div></div>
                <div class="form-row form-row--full"><div class="form-field"><label class="form-field__label">Статус</label>
                    <select class="admin-select" onchange="teamEditor.updateField(${i},'status',this.value)">
                        <option value="online" ${m.status==='online'?'selected':''}>🟢 Online</option>
                        <option value="busy" ${m.status==='busy'?'selected':''}>🟡 Busy</option>
                        <option value="offline" ${m.status==='offline'?'selected':''}>🔴 Offline</option>
                    </select>
                </div></div>
            </div>
        </div>`).join('');
    }

    renderWorks(id) {
        let h='',c=0;
        this.store.data.works.forEach(w=>{(w.photos||[]).filter(p=>p.author===id).forEach(p=>{c++;
            h+=`<div class="member-work-thumb" style="position:relative"><img src="${p.url}" alt=""><span>${p.name||''}</span>
            <button onclick="teamEditor.detach('${id}','${w.id}','${p.url}')" style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,0.9);border:none;border-radius:50%;width:16px;height:16px;color:white;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button></div>`;
        });});
        return c?h:'<span style="color:#9ca3af;font-size:0.85rem;">Нет работ. Нажмите «Привязать»</span>';
    }

    detach(mid,wid,url){const w=this.store.data.works.find(x=>x.id===wid);if(!w)return;const p=w.photos.find(x=>x.url===url&&x.author===mid);if(p){p.author='';this.store.save();this.render();Toast.show('Отвязано','info');}}

    openAttach(idx) {
        this._aidx=idx;const m=this.store.data.team[idx];
        const c=document.getElementById('attach-works-grid');let h='';
        this.store.data.works.forEach((w,wi)=>{if(!w.photos||!w.photos.length)return;
            h+=`<div style="margin-bottom:16px;"><h4 style="font-size:0.85rem;font-weight:600;margin-bottom:8px;">📂 ${w.title.ru||w.title.en}</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px;">`;
            w.photos.forEach((p,pi)=>{const on=p.author===m.id;
                h+=`<label style="position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;cursor:pointer;border:3px solid ${on?'#a855f7':'rgba(139,92,246,0.1)'}">
                    <input type="checkbox" data-wi="${wi}" data-pi="${pi}" ${on?'checked':''} style="position:absolute;top:4px;left:4px;z-index:5;accent-color:#a855f7" onchange="this.parentElement.style.borderColor=this.checked?'#a855f7':'rgba(139,92,246,0.1)'">
                    <img src="${p.url}" style="width:100%;height:100%;object-fit:cover;"></label>`;});
            h+=`</div></div>`;});
        if(!h)h='<p style="color:#9ca3af;text-align:center;padding:30px;">Нет фото в категориях</p>';
        c.innerHTML=h;document.getElementById('attach-works-member-name').textContent=m.name.ru||m.name.en;
        AdminApp.openModal('attach-works-modal');
    }

    saveAttached(){
        const m=this.store.data.team[this._aidx];
        document.querySelectorAll('#attach-works-grid input[type="checkbox"]').forEach(cb=>{
            const p=this.store.data.works[cb.dataset.wi]?.photos?.[cb.dataset.pi];if(!p)return;
            if(cb.checked)p.author=m.id;else if(p.author===m.id)p.author='';});
        this.store.save();AdminApp.closeModal('attach-works-modal');this.render();Toast.show('Сохранено!','success');
    }

    updateField(i,path,val){const p=path.split('.');let o=this.store.data.team[i];for(let k=0;k<p.length-1;k++)o=o[p[k]];o[p[p.length-1]]=val;this.store.save();if(path==='photo')this.render();}
    uploadPhoto(i,input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{this.updateField(i,'photo',e.target.result);this.render();Toast.show('Загружено!','success');};r.readAsDataURL(f);}
    addTag(i){const inp=document.getElementById(`tag-${i}`);const v=inp.value.trim();if(!v)return;this.store.data.team[i].tags.push(v);this.store.save();this.render();}
    removeTag(i,ti){this.store.data.team[i].tags.splice(ti,1);this.store.save();this.render();}
    addMember(){this.store.data.team.push({id:'m_'+Date.now(),name:{en:'New',ru:'Новый'},role:{en:'Role',ru:'Роль'},photo:'',level:'',description:{en:'',ru:''},conditions:{en:'',ru:''},portfolio:[],tags:[],status:'online'});this.store.save();this.render();Toast.show('Добавлен!','success');}
    removeMember(i){if(!confirm('Удалить?'))return;this.store.data.team.splice(i,1);this.store.save();this.render();Toast.show('Удалён','warning');}
}

// ===== WORKS EDITOR (Categories) =====
class WorksEditor {
    constructor(store){this.store=store;this.list=document.getElementById('works-edit-list');this.render();
        document.getElementById('add-category-btn').addEventListener('click',()=>this.addCat());
        window.addEventListener('adminPageChange',e=>{if(e.detail.page==='works')this.render();});
    }
    render(){
        this.list.innerHTML=this.store.data.works.map((w,i)=>`
        <div class="works-edit-item">
            <div class="works-edit-item__header" onclick="worksEditor.toggle(${i})">
                <div class="works-edit-item__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                <div class="works-edit-item__info"><div class="works-edit-item__title">${w.title.ru||w.title.en}</div><div class="works-edit-item__subtitle">${w.description.ru||w.description.en}</div></div>
                <div class="works-edit-item__meta"><span class="works-edit-item__count">${(w.photos||[]).length} фото</span></div>
            </div>
            <div class="works-edit-item__body" id="wbody-${i}">
                <div class="form-row" style="margin-bottom:16px;">
                    <div class="form-field"><label class="form-field__label">Название EN</label><input class="admin-input" value="${w.title.en}" onchange="worksEditor.updateField(${i},'title.en',this.value)"></div>
                    <div class="form-field"><label class="form-field__label">Название RU</label><input class="admin-input" value="${w.title.ru}" onchange="worksEditor.updateField(${i},'title.ru',this.value)"></div>
                </div>
                <div class="form-row" style="margin-bottom:16px;">
                    <div class="form-field"><label class="form-field__label">Описание EN</label><input class="admin-input" value="${w.description.en}" onchange="worksEditor.updateField(${i},'description.en',this.value)"></div>
                    <div class="form-field"><label class="form-field__label">Описание RU</label><input class="admin-input" value="${w.description.ru}" onchange="worksEditor.updateField(${i},'description.ru',this.value)"></div>
                </div>
                <div style="display:flex;gap:8px;"><button class="admin-btn admin-btn--sm admin-btn--danger" onclick="worksEditor.removeCat(${i})">Удалить категорию</button></div>
            </div>
        </div>`).join('');
    }
    toggle(i){document.getElementById(`wbody-${i}`)?.classList.toggle('open');}
    updateField(i,path,val){const p=path.split('.');let o=this.store.data.works[i];for(let k=0;k<p.length-1;k++)o=o[p[k]];o[p[p.length-1]]=val;this.store.save();}
    addCat(){this.store.data.works.push({id:'cat_'+Date.now(),title:{en:'New',ru:'Новая'},description:{en:'',ru:''},photos:[],icon:'circles'});this.store.save();this.render();Toast.show('Создана!','success');}
    removeCat(i){if(!confirm('Удалить?'))return;this.store.data.works.splice(i,1);this.store.save();this.render();Toast.show('Удалена','warning');}
}

// ===== ★ PORTFOLIO MANAGER ★ =====
class PortfolioManager {
    constructor(store, photoEditor) {
        this.store = store;
        this.editor = photoEditor;
        this.currentCat = null;
        this._pendingFile = null;
        this.render();

        window.addEventListener('adminPageChange', e => {
            if (e.detail.page === 'portfolio') this.render();
        });

        // Photo add modal
        document.getElementById('modal-photo-save').addEventListener('click', () => this.saveNewPhoto());
        const upload = document.getElementById('modal-photo-upload');
        const fileInput = document.getElementById('modal-file-input');
        upload.addEventListener('click', () => fileInput.click());
        upload.addEventListener('dragover', e => { e.preventDefault(); upload.classList.add('dragover'); });
        upload.addEventListener('dragleave', () => upload.classList.remove('dragover'));
        upload.addEventListener('drop', e => { e.preventDefault(); upload.classList.remove('dragover'); if(e.dataTransfer.files[0])this.previewFile(e.dataTransfer.files[0]); });
        fileInput.addEventListener('change', () => { if(fileInput.files[0])this.previewFile(fileInput.files[0]); });

        this.store.onChange(() => this.renderWorkspace());
    }

    render() {
        this.renderCategories();
        this.renderWorkspace();
    }

    renderCategories() {
        const el = document.getElementById('portfolio-categories');
        el.innerHTML = this.store.data.works.map((w, i) => `
            <button class="portfolio-cat-btn ${this.currentCat === i ? 'active' : ''}" onclick="portfolioManager.selectCat(${i})">
                ${w.title.ru || w.title.en}
                <span class="portfolio-cat-btn__count">${(w.photos || []).length}</span>
            </button>
        `).join('');
    }

    selectCat(i) {
        this.currentCat = i;
        this.renderCategories();
        this.renderWorkspace();
    }

    renderWorkspace() {
        const el = document.getElementById('portfolio-workspace');
        if (this.currentCat === null) {
            el.innerHTML = `<div class="portfolio-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Выберите категорию</p>
            </div>`;
            return;
        }

        const w = this.store.data.works[this.currentCat];
        if (!w) return;

        const photos = w.photos || [];

        el.innerHTML = `
            <div class="portfolio-grid-header">
                <h3>📂 ${w.title.ru || w.title.en} <span style="color:#9ca3af;font-weight:400;">(${photos.length} фото)</span></h3>
                <button class="admin-btn admin-btn--primary" onclick="portfolioManager.openAddModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Добавить фото
                </button>
            </div>
            ${photos.length === 0 ? `
                <div class="portfolio-empty" style="padding:60px 20px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <p>Нет фотографий в этой категории</p>
                    <button class="admin-btn admin-btn--primary" onclick="portfolioManager.openAddModal()">Добавить первое фото</button>
                </div>
            ` : `
                <div class="portfolio-photo-grid">
                    ${photos.map((p, pi) => `
                        <div class="portfolio-photo-card" onclick="portfolioManager.openEditor(${pi})">
                            <div class="portfolio-photo-card__actions">
                                <button class="portfolio-photo-card__action" onclick="event.stopPropagation();portfolioManager.openEditor(${pi})" title="Редактировать">✏️</button>
                                <button class="portfolio-photo-card__action portfolio-photo-card__action--delete" onclick="event.stopPropagation();portfolioManager.deletePhoto(${pi})" title="Удалить">🗑</button>
                            </div>
                            <img class="portfolio-photo-card__img" src="${p.url}" alt="${p.name || ''}">
                            <div class="portfolio-photo-card__info">
                                <div class="portfolio-photo-card__name">${p.name || 'Без названия'}</div>
                                <div class="portfolio-photo-card__meta">${p.author ? this.store.getAuthorName(p.author, 'ru') : 'Автор не указан'}${p.date ? ' · ' + new Date(p.date).toLocaleDateString('ru-RU') : ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    }

    // Add photo
    openAddModal() {
        this._pendingFile = null;
        document.getElementById('modal-url-input').value = '';
        document.getElementById('modal-photo-name').value = '';
        document.getElementById('modal-photo-author').value = '';
        document.getElementById('modal-photo-desc').value = '';
        document.getElementById('modal-photo-format').value = 'auto';
        document.getElementById('modal-file-input').value = '';
        document.getElementById('modal-photo-preview').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

        const sel = document.getElementById('modal-photo-author');
        sel.innerHTML = '<option value="">— Не указан —</option>';
        this.store.data.team.forEach(m => { sel.innerHTML += `<option value="${m.id}">${m.name.ru || m.name.en}</option>`; });

        AdminApp.openModal('photo-modal');
    }

    previewFile(file) {
        const r = new FileReader();
        r.onload = e => {
            this._pendingFile = e.target.result;
            document.getElementById('modal-photo-preview').innerHTML = `<img src="${e.target.result}" alt="preview">`;
        };
        r.readAsDataURL(file);
    }

    saveNewPhoto() {
        const url = this._pendingFile || document.getElementById('modal-url-input').value.trim();
        if (!url) { Toast.show('Выберите фото', 'error'); return; }
        if (this.currentCat === null) return;

        const w = this.store.data.works[this.currentCat];
        if (!w.photos) w.photos = [];

        w.photos.push({
            url,
            name: document.getElementById('modal-photo-name').value.trim() || `Работа ${w.photos.length + 1}`,
            author: document.getElementById('modal-photo-author').value,
            description: document.getElementById('modal-photo-desc').value.trim(),
            format: document.getElementById('modal-photo-format').value || 'auto',
            date: new Date().toISOString()
        });

        this.store.save();
        this.store.addActivity(`Фото добавлено в "${w.title.ru}"`, 'success');
        AdminApp.closeModal('photo-modal');
        this.renderWorkspace();
        this.renderCategories();
        Toast.show('Фото добавлено!', 'success');
    }

    // Edit photo in editor
    openEditor(photoIndex) {
        if (this.currentCat === null) return;
        const photo = this.store.data.works[this.currentCat].photos[photoIndex];
        if (!photo) return;

        this._editingIndex = photoIndex;

        // Load into photo editor
        this.editor.load(photo.url);

        // Fill info fields
        document.getElementById('pe-photo-name').value = photo.name || '';
        document.getElementById('pe-photo-desc').value = photo.description || '';
        document.getElementById('pe-photo-format').value = photo.format || 'auto';

        const sel = document.getElementById('pe-photo-author');
        sel.innerHTML = '<option value="">— Не указан —</option>';
        this.store.data.team.forEach(m => {
            sel.innerHTML += `<option value="${m.id}" ${m.id === photo.author ? 'selected' : ''}>${m.name.ru || m.name.en}</option>`;
        });

        // Set save callback
        this.editor.onSave = () => this.saveEditor();

        AdminApp.openModal('edit-photo-modal');
    }

    saveEditor() {
        if (this.currentCat === null || this._editingIndex === undefined) return;
        const photo = this.store.data.works[this.currentCat].photos[this._editingIndex];
        if (!photo) return;

        photo.name = document.getElementById('pe-photo-name').value.trim();
        photo.description = document.getElementById('pe-photo-desc').value.trim();
        photo.author = document.getElementById('pe-photo-author').value;
        photo.format = document.getElementById('pe-photo-format').value;

        const newUrl = this.editor.getDataURL();
        if (newUrl) photo.url = newUrl;

        this.store.save();
        this.store.addActivity(`Фото "${photo.name}" отредактировано`, 'success');
        AdminApp.closeModal('edit-photo-modal');
        this.renderWorkspace();
        Toast.show('Сохранено!', 'success');
    }

    deletePhoto(pi) {
        if (!confirm('Удалить фото?')) return;
        this.store.data.works[this.currentCat].photos.splice(pi, 1);
        this.store.save();
        this.renderWorkspace();
        this.renderCategories();
        Toast.show('Удалено', 'warning');
    }
}

// ===== HERO EDITOR =====
class HeroEditor {
    constructor(store){this.store=store;this.el=document.getElementById('hero-editor');this.render();
        window.addEventListener('adminPageChange',e=>{if(e.detail.page==='hero')this.render();});}
    render(){const s=this.store.data.hero.stats;
        this.el.innerHTML=`<div style="background:white;border:1px solid rgba(139,92,246,0.1);border-radius:16px;padding:24px;">
        <h3 style="margin-bottom:16px;font-size:1rem;">📊 Статистика на сайте</h3>
        <div class="form-row"><div class="form-field"><label class="form-field__label">Проектов</label><input type="number" class="admin-input" value="${s.projects}" onchange="heroEditor.set('projects',+this.value)"></div>
        <div class="form-field"><label class="form-field__label">Клиентов</label><input type="number" class="admin-input" value="${s.clients}" onchange="heroEditor.set('clients',+this.value)"></div></div>
        <div class="form-row form-row--full"><div class="form-field"><label class="form-field__label">Лет опыта</label><input type="number" class="admin-input" value="${s.years}" onchange="heroEditor.set('years',+this.value)"></div></div></div>`;}
    set(k,v){this.store.data.hero.stats[k]=v;this.store.save();Toast.show('Обновлено!','success');}
}

// ===== SETTINGS =====
class SettingsEditor {
    constructor(store){this.store=store;this.el=document.getElementById('settings-editor');this.render();
        window.addEventListener('adminPageChange',e=>{if(e.detail.page==='settings')this.render();});}
    render(){const s=this.store.data.settings;const lm=s.lastModified?new Date(s.lastModified).toLocaleString('ru-RU'):'Никогда';
        this.el.innerHTML=`
        <div style="background:white;border:1px solid rgba(139,92,246,0.1);border-radius:16px;padding:24px;margin-bottom:16px;">
            <h3 style="margin-bottom:12px;">🔐 Пароль</h3>
            <div style="display:flex;gap:8px;"><input type="password" class="admin-input" value="${s.password}" id="set-pw">
            <button class="admin-btn admin-btn--sm" onclick="settingsEditor.togglePw()">👁</button>
            <button class="admin-btn admin-btn--sm admin-btn--primary" onclick="settingsEditor.savePw()">Сохранить</button></div>
        </div>
        <div style="background:white;border:1px solid rgba(139,92,246,0.1);border-radius:16px;padding:24px;margin-bottom:16px;">
            <p style="font-size:0.85rem;color:#6b7280;">Последнее изменение: ${lm}</p>
        </div>
        <div style="background:white;border:1px solid rgba(239,68,68,0.15);border-radius:16px;padding:24px;">
            <h3 style="margin-bottom:12px;">⚠️ Опасная зона</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button class="admin-btn admin-btn--danger" onclick="settingsEditor.resetAll()">Сбросить</button>
                <button class="admin-btn" onclick="settingsEditor.exportJSON()">Экспорт</button>
            </div>
        </div>`;}
    togglePw(){const e=document.getElementById('set-pw');e.type=e.type==='password'?'text':'password';}
    savePw(){const p=document.getElementById('set-pw').value.trim();if(p.length<4){Toast.show('Мин. 4 символа','error');return;}this.store.data.settings.password=p;this.store.save();Toast.show('Сохранён!','success');}
    resetAll(){if(!confirm('Сбросить?'))return;if(!confirm('Точно?'))return;this.store.reset();setTimeout(()=>location.reload(),500);}
    exportJSON(){const b=new Blob([JSON.stringify(this.store.data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`tish-${new Date().toISOString().slice(0,10)}.json`;a.click();Toast.show('Экспортировано!','success');}
}

// ===== INIT =====
let teamEditor, worksEditor, portfolioManager, heroEditor, settingsEditor, photoEditor;

document.addEventListener('DOMContentLoaded', () => {
    const store = new AdminStore();
    AdminApp.store = store;

    new AuthSystem(store);
    new Navigation();
    new Dashboard(store);

    photoEditor = new PhotoEditorEngine();
    teamEditor = new TeamEditor(store);
    worksEditor = new WorksEditor(store);
    portfolioManager = new PortfolioManager(store, photoEditor);
    heroEditor = new HeroEditor(store);
    settingsEditor = new SettingsEditor(store);

    window.teamEditor = teamEditor;
    window.worksEditor = worksEditor;
    window.portfolioManager = portfolioManager;
    window.heroEditor = heroEditor;
    window.settingsEditor = settingsEditor;
    window.photoEditor = photoEditor;

    console.log('🟣 TISH Admin Panel ready');
});