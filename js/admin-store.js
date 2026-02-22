/* =====================================================
   ADMIN STORE — Server-Synced Data Management
   ИСПРАВЛЕННАЯ ВЕРСИЯ v2
   ===================================================== */

class AdminStore {
    constructor() {
        this.data = null;
        this.listeners = new Map();
        this._listenerIdCounter = 0;
        this.changesCount = parseInt(
            sessionStorage.getItem('tish_changes_today') || '0'
        );
        this._loaded = false;
        this._loadPromise = null;
        this._isDirty = false;
        this._saveTimeout = null;
    }

    getDefaults() {
        return {
            team: [
                {
                    id: 'sanya',
                    name: { en: 'Sanya', ru: 'Саня' },
                    role: { en: 'Lead Designer', ru: 'Lead дизайнер' },
                    photo: '',
                    level: 'Figma • Presentations • WB Cards • Logos • Brandbooks',
                    description: {
                        en: 'Creates presentations, marketplace product cards, logos and complete brand identity.',
                        ru: 'Создаёт презентации, карточки товаров для маркетплейсов, логотипы и полную айдентику.'
                    },
                    conditions: {
                        en: 'Projects from 2-3 days, 50% prepayment. Rush orders +30% extra.',
                        ru: 'Проекты от 2-3 дней, предоплата 50%. Срочные заказы +30%.'
                    },
                    portfolioItems: [
                        { title: 'Pitch Deck', media: '', type: 'image' },
                        { title: 'Brandbook', media: '', type: 'image' },
                        { title: 'Logo Design', media: '', type: 'image' },
                        { title: 'WB Cards', media: '', type: 'image' },
                        { title: 'Presentation', media: '', type: 'image' },
                        { title: 'Identity', media: '', type: 'image' }
                    ],
                    tags: ['Figma', 'Presentations', 'WB'],
                    status: 'online'
                },
                {
                    id: 'yarik',
                    name: { en: 'Yarik', ru: 'Ярик' },
                    role: { en: 'Design & Branding', ru: 'Дизайн & Брендинг' },
                    photo: '',
                    level: 'Presentations • Brandbooks • Logos • Print Design',
                    description: {
                        en: 'Creates presentations, brandbooks and logos that you want to look at again.',
                        ru: 'Создаёт презентации, брендбуки и логотипы, на которые хочется смотреть снова.'
                    },
                    conditions: {
                        en: 'Full branding packages or individual elements available.',
                        ru: 'Полные пакеты брендинга или отдельные элементы.'
                    },
                    portfolioItems: [
                        { title: 'Brandbook', media: '', type: 'image' },
                        { title: 'Logo Design', media: '', type: 'image' },
                        { title: 'Presentation', media: '', type: 'image' },
                        { title: 'Print', media: '', type: 'image' },
                        { title: 'Corporate ID', media: '', type: 'image' },
                        { title: 'Guidelines', media: '', type: 'image' }
                    ],
                    tags: ['Branding', 'Logos', 'Print'],
                    status: 'online'
                },
                {
                    id: 'kirya',
                    name: { en: 'Kirya', ru: 'Киря' },
                    role: { en: 'Development', ru: 'Разработка' },
                    photo: '',
                    level: 'Websites • Telegram Bots • Apps • Plugins • Code',
                    description: {
                        en: 'Turns design into working products. Websites, bots, applications, plugins.',
                        ru: 'Превращает дизайн в работающие продукты. Сайты, боты, приложения, плагины.'
                    },
                    conditions: {
                        en: 'Websites and apps turnkey. Support after delivery.',
                        ru: 'Сайты и приложения под ключ. Поддержка после сдачи.'
                    },
                    portfolioItems: [
                        { title: 'Landing Page', media: '', type: 'image' },
                        { title: 'Corporate Site', media: '', type: 'image' },
                        { title: 'Telegram Bot', media: '', type: 'image' },
                        { title: 'Web App', media: '', type: 'image' },
                        { title: 'Plugin', media: '', type: 'image' },
                        { title: 'E-commerce', media: '', type: 'image' }
                    ],
                    tags: ['Websites', 'Bots', 'Apps'],
                    status: 'online'
                }
            ],
            works: [
                { id: 'branding', title: { en: 'Branding', ru: 'Брендинг' }, description: { en: 'Identity & Logos', ru: 'Логотипы, брендбуки и айдентика' }, photos: [], icon: 'layers', order: 0 },
                { id: 'presentations', title: { en: 'Presentations', ru: 'Презентации' }, description: { en: 'Pitch decks & slides', ru: 'Pitch-деки и слайды' }, photos: [], icon: 'monitor', order: 1 },
                { id: 'marketplace', title: { en: 'WB Cards', ru: 'Карточки WB' }, description: { en: 'Product cards for marketplaces', ru: 'Карточки товаров для маркетплейсов' }, photos: [], icon: 'clipboard', order: 2 },
                { id: 'advertising', title: { en: 'Advertising', ru: 'Реклама' }, description: { en: 'Banners & promo materials', ru: 'Баннеры и промо-материалы' }, photos: [], icon: 'rocket', order: 3 },
                { id: 'websites', title: { en: 'Websites', ru: 'Сайты' }, description: { en: 'Landing pages & web apps', ru: 'Лендинги и веб-приложения' }, photos: [], icon: 'globe', order: 4 },
                { id: 'other', title: { en: 'Other', ru: 'Прочее' }, description: { en: 'Various design projects', ru: 'Разные дизайн-проек��ы' }, photos: [], icon: 'circles', order: 5 }
            ],
            hero: { stats: { projects: 150, clients: 50, years: 3 } },
            settings: {
                password: 'tish2024',
                siteName: 'TISH TEAM',
                lastModified: null
            },
            activity: []
        };
    }

    // ===== ЗАГРУЗКА =====
    async load(forAdmin = false) {
        try {
            const url = forAdmin ? '/api/admin/data' : '/api/data';
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const serverData = await res.json();
            this.data = this.deepMerge(this.getDefaults(), serverData);
            this._loaded = true;
            this._isDirty = false;
            console.log('✅ Data loaded from server');
            this.notify();
            return this.data;
        } catch (e) {
            console.warn('⚠️ Server load failed:', e.message);
            // Fallback: localStorage
            try {
                const saved = localStorage.getItem('tish_admin_data');
                if (saved) {
                    this.data = this.deepMerge(this.getDefaults(), JSON.parse(saved));
                    console.log('📦 Loaded from localStorage');
                } else {
                    this.data = this.getDefaults();
                    console.log('🔧 Using defaults');
                }
            } catch {
                this.data = this.getDefaults();
            }
            this._loaded = true;
            return this.data;
        }
    }

    async ensureLoaded(forAdmin = false) {
        if (this._loaded && this.data) return this.data;
        if (!this._loadPromise) {
            this._loadPromise = this.load(forAdmin);
        }
        return this._loadPromise;
    }

    // ===== СОХРАНЕНИЕ =====
    async save() {
        if (!this.data) return false;
        try {
            this.data.settings.lastModified = new Date().toISOString();

            const res = await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // Backup в localStorage
            try {
                localStorage.setItem('tish_admin_data', JSON.stringify(this.data));
            } catch (storageErr) {
                console.warn('localStorage save failed:', storageErr.message);
            }

            this.changesCount++;
            sessionStorage.setItem('tish_changes_today', String(this.changesCount));
            this._isDirty = false;
            this.notify();
            return true;
        } catch (e) {
            console.error('Save error:', e.message);
            // Fallback: localStorage
            try {
                localStorage.setItem('tish_admin_data', JSON.stringify(this.data));
            } catch {}
            this.notify();
            return false;
        }
    }

    // Отложенное сохранение
    debouncedSave(delay = 1500) {
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => this.save(), delay);
    }

    // ===== DEEP MERGE =====
    deepMerge(target, source) {
        if (!source) return target;
        const output = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }

    // ===== LISTENERS =====
    onChange(callback) {
        const id = ++this._listenerIdCounter;
        this.listeners.set(id, callback);
        return id;
    }

    offChange(id) {
        return this.listeners.delete(id);
    }

    clearListeners() {
        this.listeners.clear();
    }

    notify() {
        this.listeners.forEach(cb => {
            try { cb(this.data); }
            catch (err) { console.error('Listener error:', err); }
        });
    }

    // ===== DIRTY STATE =====
    markDirty() { this._isDirty = true; }
    isDirty() { return this._isDirty; }

    hasChanges() {
        return this._isDirty;
    }

    // ===== RESET =====
    async reset() {
        try {
            await fetch('/api/admin/reset', { method: 'POST' });
        } catch {}
        this.data = this.getDefaults();
        this._isDirty = false;
        try { localStorage.removeItem('tish_admin_data'); } catch {}
        this.notify();
    }

    // ===== ACTIVITY LOG =====
    async addActivity(text, type = 'info') {
        try {
            await fetch('/api/admin/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type })
            });
        } catch (e) {
            console.warn('Activity log failed:', e.message);
            // Локальный fallback
            if (this.data) {
                if (!this.data.activity) this.data.activity = [];
                this.data.activity.unshift({
                    text, type, time: new Date().toISOString()
                });
                if (this.data.activity.length > 100) this.data.activity.length = 100;
            }
        }
    }

    async getActivities() {
        try {
            const res = await fetch('/api/admin/activity');
            if (!res.ok) return this.data?.activity || [];
            return await res.json();
        } catch {
            return this.data?.activity || [];
        }
    }

    async clearActivities() {
        try {
            await fetch('/api/admin/activity', { method: 'DELETE' });
        } catch {}
        if (this.data) this.data.activity = [];
    }

    // ===== UPLOAD =====
    async uploadImage(base64, filename) {
        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, filename })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const result = await res.json();
            return result.url;
        } catch (e) {
            console.error('Upload error:', e.message);
            // Fallback: возвращаем base64 как URL (тяжело, но работает)
            console.warn('⚠️ Using base64 fallback');
            return base64;
        }
    }

    // ===== УТИЛИТЫ =====
    getAuthorName(authorId, lang = 'en') {
        if (!this.data || !authorId) return authorId || '';
        const member = this.data.team.find(m => m.id === authorId);
        if (member) return member.name[lang] || member.name.en || authorId;
        return authorId;
    }

    getWorksSorted() {
        if (!this.data?.works) return [];
        return [...this.data.works].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    getMemberById(id) {
        if (!this.data || !id) return null;
        return this.data.team.find(m => m.id === id) || null;
    }

    getWorkById(id) {
        if (!this.data || !id) return null;
        return this.data.works.find(w => w.id === id) || null;
    }
}

if (typeof window !== 'undefined') {
    window.AdminStore = AdminStore;
}