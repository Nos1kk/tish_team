class AdminStore {
    constructor() {
        this.data = null;
        this.listeners = new Map();
        this._listenerIdCounter = 0;
        this.changesCount = parseInt(sessionStorage.getItem('tish_changes_today') || '0');
        this._loaded = false;
        this._loadPromise = null;
        this._lastSavedJSON = null;
    }

    _adminFetch(url, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = sessionStorage.getItem('tish_admin_token') || '';
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', 'Bearer ' + token);
        }
        return fetch(url, { ...options, headers });
    }

    getDefaults() {
        return {
            team: [
                { id: 'sanya', name: { en: 'Sanya', ru: 'Саня' }, role: { en: 'Lead Designer', ru: 'Lead дизайнер' }, photo: '', level: 'Figma • Presentations • WB Cards', description: { en: 'Creates presentations, logos and brand identity.', ru: 'Создаёт презентации, логотипы и айдентику.' }, conditions: { en: 'Projects from 2-3 days, 50% prepayment.', ru: 'Проекты от 2-3 дней, предоплата 50%.' }, portfolioItems: [], tags: ['Figma', 'Presentations', 'WB'], status: 'online' },
                { id: 'yarik', name: { en: 'Yarik', ru: 'Ярик' }, role: { en: 'Design & Branding', ru: 'Дизайн & Брендинг' }, photo: '', level: 'Presentations • Brandbooks • Logos', description: { en: 'Creates presentations and brandbooks.', ru: 'Создаёт презентации и брендбуки.' }, conditions: { en: 'Full branding packages available.', ru: 'Полные пакеты брендинга.' }, portfolioItems: [], tags: ['Branding', 'Logos', 'Print'], status: 'online' },
                { id: 'kirya', name: { en: 'Kirya', ru: 'Киря' }, role: { en: 'Development', ru: 'Разработка' }, photo: '', level: 'Websites • Telegram Bots • Apps', description: { en: 'Turns design into working products.', ru: 'Превращает дизайн в продукты.' }, conditions: { en: 'Websites and apps turnkey.', ru: 'Сайты и приложения под ключ.' }, portfolioItems: [], tags: ['Websites', 'Bots', 'Apps'], status: 'online' }
            ],
            works: [
                { id: 'branding', title: { en: 'Branding', ru: 'Брендинг' }, description: { en: 'Identity & Logos', ru: 'Логотипы и айдентика' }, photos: [], icon: 'layers', order: 0 },
                { id: 'presentations', title: { en: 'Presentations', ru: 'Презентации' }, description: { en: 'Pitch decks', ru: 'Питч-деки' }, photos: [], icon: 'monitor', order: 1 },
                { id: 'marketplace', title: { en: 'WB Cards', ru: 'Карточки WB' }, description: { en: 'Product cards', ru: 'Карточки товаров' }, photos: [], icon: 'clipboard', order: 2 },
                { id: 'advertising', title: { en: 'Advertising', ru: 'Реклама' }, description: { en: 'Banners', ru: 'Баннеры' }, photos: [], icon: 'rocket', order: 3 },
                { id: 'websites', title: { en: 'Websites', ru: 'Сайты' }, description: { en: 'Landing pages', ru: 'Лендинги' }, photos: [], icon: 'globe', order: 4 },
                { id: 'other', title: { en: 'Other', ru: 'Прочее' }, description: { en: 'Various', ru: 'Разное' }, photos: [], icon: 'circles', order: 5 }
            ],
            hero: { stats: { projects: 150, clients: 50, years: 3 } },
            settings: { password: '', siteName: 'TISH TEAM', lastModified: null },
            activity: []
        };
    }

    async load(forAdmin = false) {
        try {
            const url = forAdmin ? '/api/admin/data' : '/api/data';
            const res = forAdmin ? await this._adminFetch(url) : await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const serverData = await res.json();
            this.data = this.deepMerge(this.getDefaults(), serverData);
            this._loaded = true;
            this._lastSavedJSON = JSON.stringify(this.data);
            console.log('✅ Data loaded from server');
            this.notify();
            return this.data;
        } catch (e) {
            console.warn('⚠️ Server unavailable:', e.message);
            this.data = this.getDefaults();
            this._loaded = true;
            this._lastSavedJSON = JSON.stringify(this.data);
            return this.data;
        }
    }

    async ensureLoaded(forAdmin = false) {
        if (this._loaded && this.data) return this.data;
        if (!this._loadPromise) this._loadPromise = this.load(forAdmin);
        return this._loadPromise;
    }

    hasChanges() {
        if (!this.data || !this._lastSavedJSON) return false;
        try {
            return JSON.stringify(this.data) !== this._lastSavedJSON;
        } catch {
            return false;
        }
    }

    async save() {
        if (!this.data) return false;
        try {
            this.data.settings.lastModified = new Date().toISOString();
            const res = await this._adminFetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this._lastSavedJSON = JSON.stringify(this.data);
            this.changesCount++;
            sessionStorage.setItem('tish_changes_today', String(this.changesCount));
            this.notify();
            return true;
        } catch (e) {
            console.error('❌ Save failed:', e.message);
            return false;
        }
    }

    deepMerge(target, source) {
        if (!source) return target;
        const output = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] !== null && source[key] !== undefined &&
                typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }

    onChange(cb) { const id = ++this._listenerIdCounter; this.listeners.set(id, cb); return id; }
    offChange(id) { return this.listeners.delete(id); }
    clearListeners() { this.listeners.clear(); }
    notify() {
        this.listeners.forEach(cb => { try { cb(this.data); } catch (e) { console.error('Listener error:', e); } });
    }

    async reset() {
        try { await this._adminFetch('/api/admin/reset', { method: 'POST' }); } catch {}
        this.data = this.getDefaults();
        this._lastSavedJSON = JSON.stringify(this.data);
        this.changesCount = 0;
        this.notify();
    }

    async addActivity(text, type = 'info') {
        try {
            await this._adminFetch('/api/admin/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type })
            });
        } catch {}
        if (this.data) {
            if (!this.data.activity) this.data.activity = [];
            this.data.activity.unshift({ text, type, time: new Date().toISOString() });
            if (this.data.activity.length > 100) this.data.activity.length = 100;
        }
    }

    async getActivities() {
        try {
            const res = await this._adminFetch('/api/admin/activity');
            if (res.ok) return await res.json();
        } catch {}
        return this.data?.activity || [];
    }

    async clearActivities() {
        try { await this._adminFetch('/api/admin/activity', { method: 'DELETE' }); } catch {}
        if (this.data) this.data.activity = [];
    }

    async uploadImage(base64, filename) {
        try {
            const res = await this._adminFetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, filename })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()).url;
        } catch (e) {
            console.error('Upload error:', e);
            return base64;
        }
    }

    getAuthorName(authorId, lang = 'en') {
        if (!this.data || !authorId) return '';
        const m = this.data.team.find(m => m.id === authorId);
        return m ? (m.name[lang] || m.name.en || authorId) : authorId;
    }

    getWorksSorted() {
        if (!this.data?.works) return [];
        return [...this.data.works].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
}

if (typeof window !== 'undefined') window.AdminStore = AdminStore;