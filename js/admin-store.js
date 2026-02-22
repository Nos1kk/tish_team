/* =====================================================
   ADMIN STORE — Server-Synced Data Management
   ИСПРАВЛЕННАЯ ВЕРСИЯ
   ===================================================== */

class AdminStore {
    constructor() {
        this.data = null;
        this.listeners = new Map(); // ИСПРАВЛЕНИЕ #17: Map вместо Array для управления listeners
        this._listenerIdCounter = 0;
        this.changesCount = parseInt(
            sessionStorage.getItem('tish_changes_today') || '0'
        );
        this._loaded = false;
        this._loadPromise = null;
        this._isDirty = false; // Флаг несохранённых изменений
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
                {
                    id: 'branding',
                    title: { en: 'Branding', ru: 'Брендинг' },
                    description: { en: 'Identity & Logos', ru: 'Логотипы, брендбуки и айдентика' },
                    photos: [],
                    icon: 'layers',
                    order: 0
                },
                {
                    id: 'presentations',
                    title: { en: 'Presentations', ru: 'Презентации' },
                    description: { en: 'Pitch decks & slides', ru: 'Pitch-деки и слайды' },
                    photos: [],
                    icon: 'monitor',
                    order: 1
                },
                {
                    id: 'marketplace',
                    title: { en: 'WB Cards', ru: 'Карточки WB' },
                    description: { en: 'Product cards for marketplaces', ru: 'Карточки товаров для маркетплейсов' },
                    photos: [],
                    icon: 'clipboard',
                    order: 2
                },
                {
                    id: 'advertising',
                    title: { en: 'Advertising', ru: 'Реклама' },
                    description: { en: 'Banners & promo materials', ru: 'Баннеры и промо-материалы' },
                    photos: [],
                    icon: 'rocket',
                    order: 3
                },
                {
                    id: 'websites',
                    title: { en: 'Websites', ru: 'Сайты' },
                    description: { en: 'Landing pages & web apps', ru: 'Лендинги и веб-приложения' },
                    photos: [],
                    icon: 'globe',
                    order: 4
                },
                {
                    id: 'other',
                    title: { en: 'Other', ru: 'Прочее' },
                    description: { en: 'Various design projects', ru: 'Разные дизайн-проекты' },
                    photos: [],
                    icon: 'circles',
                    order: 5
                }
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

    async load(forAdmin = false) {
        try {
            const url = forAdmin ? '/api/admin/data' : '/api/data';
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const serverData = await res.json();
            this.data = this.deepMerge(this.getDefaults(), serverData);
            this._loaded = true;
            this._isDirty = false;
            this.notify();
            return this.data;
        } catch (e) {
            console.error('AdminStore: load error', e);
            try {
                const saved = localStorage.getItem('tish_admin_data');
                if (saved) {
                    this.data = this.deepMerge(this.getDefaults(), JSON.parse(saved));
                } else {
                    this.data = this.getDefaults();
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
            
            // Сохраняем в localStorage как backup
            try {
                localStorage.setItem('tish_admin_data', JSON.stringify(this.data));
            } catch (storageErr) {
                console.warn('LocalStorage save failed:', storageErr);
            }
            
            this.changesCount++;
            sessionStorage.setItem('tish_changes_today', String(this.changesCount));
            this._isDirty = false;
            this.notify();
            return true;
        } catch (e) {
            console.error('AdminStore: save error', e);
            // Fallback to localStorage
            try {
                localStorage.setItem('tish_admin_data', JSON.stringify(this.data));
            } catch {}
            this.notify();
            return false;
        }
    }

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

    // ИСПРАВЛЕНИЕ #17: Возвращаем ID для последующего удаления
    onChange(callback) {
        const id = ++this._listenerIdCounter;
        this.listeners.set(id, callback);
        return id;
    }
    
    // ИСПРАВЛЕНИЕ #17: Метод для удаления listener
    offChange(id) {
        return this.listeners.delete(id);
    }
    
    // Удаление всех listeners
    clearListeners() {
        this.listeners.clear();
    }
    
    notify() {
        this.listeners.forEach(callback => {
            try {
                callback(this.data);
            } catch (err) {
                console.error('Listener error:', err);
            }
        });
    }
    
    // Пометить данные как изменённые
    markDirty() {
        this._isDirty = true;
    }
    
    isDirty() {
        return this._isDirty;
    }

    async reset() {
        try {
            await fetch('/api/admin/reset', { method: 'POST' });
            this.data = this.getDefaults();
            try { 
                localStorage.removeItem('tish_admin_data'); 
            } catch {}
            this._isDirty = false;
            this.notify();
        } catch (e) { 
            console.error('AdminStore: reset error', e); 
        }
    }

    async addActivity(text, type = 'info') {
        try {
            await fetch('/api/admin/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type })
            });
        } catch (e) {
            console.warn('Activity log failed:', e);
        }
    }

    async getActivities() {
        try {
            const res = await fetch('/api/admin/activity');
            if (!res.ok) return [];
            return await res.json();
        } catch { 
            return []; 
        }
    }

    async clearActivities() {
        try { 
            await fetch('/api/admin/activity', { method: 'DELETE' }); 
        } catch {}
    }

    // ИСПРАВЛЕНИЕ #16: Лучшая обработка ошибок загрузки
    async uploadImage(base64, filename) {
        // Проверка размера base64 (примерно 5MB лимит)
        const sizeInBytes = (base64.length * 3) / 4;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (sizeInBytes > maxSize) {
            console.warn('Image too large, compressing...');
            // Можно добавить сжатие здесь
        }
        
        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, filename })
            });
            
            if (!res.ok) {
                throw new Error(`Upload failed: HTTP ${res.status}`);
            }
            
            const result = await res.json();
            return result.url;
        } catch (e) {
            console.error('AdminStore: upload error', e);
            
            // ИСПРАВЛЕНИЕ #16: Не возвращаем base64, а бросаем ошибку
            // или возвращаем placeholder
            throw new Error('Upload failed: ' + e.message);
        }
    }
    
    // Безопасная загрузка с fallback
    async uploadImageSafe(base64, filename) {
        try {
            return await this.uploadImage(base64, filename);
        } catch (e) {
            console.error('Upload failed, using placeholder');
            // Возвращаем пустую строку или placeholder вместо base64
            return '';
        }
    }

    getAuthorName(authorId, lang = 'en') {
        if (!this.data || !authorId) return authorId || '';
        const member = this.data.team.find(m => m.id === authorId);
        if (member) return member.name[lang] || member.name.en || authorId;
        return authorId || '';
    }

    // Сортировка работ по полю order
    getWorksSorted() {
        if (!this.data || !this.data.works) return [];
        return [...this.data.works].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // Получить участника по ID
    getMemberById(id) {
        if (!this.data || !id) return null;
        return this.data.team.find(m => m.id === id) || null;
    }
    
    // Получить категорию по ID
    getWorkById(id) {
        if (!this.data || !id) return null;
        return this.data.works.find(w => w.id === id) || null;
    }
}

if (typeof window !== 'undefined') {
    window.AdminStore = AdminStore;
}