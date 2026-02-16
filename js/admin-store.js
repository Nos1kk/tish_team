/* =====================================================
   ADMIN STORE — Shared Data Management
   ===================================================== */

class AdminStore {
    constructor() {
        this.STORAGE_KEY = 'tish_admin_data';
        this.ACTIVITY_KEY = 'tish_admin_activity';
        this.data = this.load();
        this.listeners = [];
        this.changesCount = parseInt(sessionStorage.getItem('tish_changes_today') || '0');
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
                        en: 'Creates presentations, marketplace product cards, logos and complete brand identity. Loves when every detail is polished to perfection.',
                        ru: 'Создаёт презентации, карточки товаров для маркетплейсов, логотипы и полную айдентику. Любит, когда каждая деталь доведена до совершенства.'
                    },
                    conditions: {
                        en: 'Projects from 2-3 days, 50% prepayment. Rush orders +30% extra.',
                        ru: 'Проекты от 2-3 дней, предоплата 50%. Срочные заказы +30%.'
                    },
                    portfolio: ['Pitch Deck', 'Brandbook', 'Logo Design', 'WB Cards', 'Presentation', 'Identity'],
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
                    portfolio: ['Brandbook', 'Logo Design', 'Presentation', 'Print', 'Corporate ID', 'Guidelines'],
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
                    portfolio: ['Landing Page', 'Corporate Site', 'Telegram Bot', 'Web App', 'Plugin', 'E-commerce'],
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
                    icon: 'layers'
                },
                {
                    id: 'presentations',
                    title: { en: 'Presentations', ru: 'Презентации' },
                    description: { en: 'Pitch decks & slides', ru: 'Pitch-деки и слайды' },
                    photos: [],
                    icon: 'monitor'
                },
                {
                    id: 'marketplace',
                    title: { en: 'WB Cards', ru: 'Карточки WB' },
                    description: { en: 'Product cards for marketplaces', ru: 'Карточки товаров для маркетплейсов' },
                    photos: [],
                    icon: 'clipboard'
                },
                {
                    id: 'advertising',
                    title: { en: 'Advertising', ru: 'Реклама' },
                    description: { en: 'Banners & promo materials', ru: 'Баннеры и промо-материалы' },
                    photos: [],
                    icon: 'rocket'
                },
                {
                    id: 'websites',
                    title: { en: 'Websites', ru: 'Сайты' },
                    description: { en: 'Landing pages & web apps', ru: 'Лендинги и веб-приложения' },
                    photos: [],
                    icon: 'globe'
                },
                {
                    id: 'other',
                    title: { en: 'Other', ru: 'Прочее' },
                    description: { en: 'Various design projects', ru: 'Разные дизайн-проекты' },
                    photos: [],
                    icon: 'circles'
                }
            ],

            hero: {
                stats: {
                    projects: 150,
                    clients: 50,
                    years: 3
                }
            },

            settings: {
                password: 'tish2024',
                siteName: 'TISH TEAM',
                lastModified: null
            }
        };
    }

    /*  Формат каждого фото в works[].photos[]:
        {
            url: string,           — ссылка или base64
            name: string,          — название работы
            author: string,        — кто сделал (id или имя)
            description: string,   — описание работы
            format: string,        — 'square' | 'landscape' | 'portrait' | 'auto'
            date: string           — ISO дата добавления
        }
    */

    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return this.deepMerge(this.getDefaults(), JSON.parse(saved));
            }
            return this.getDefaults();
        } catch (e) {
            console.error('AdminStore: load error', e);
            return this.getDefaults();
        }
    }

    save() {
        try {
            this.data.settings.lastModified = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            this.changesCount++;
            sessionStorage.setItem('tish_changes_today', String(this.changesCount));
            this.notify();
            return true;
        } catch (e) {
            console.error('AdminStore: save error', e);
            return false;
        }
    }

    deepMerge(target, source) {
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

    onChange(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.data));
    }

    reset() {
        this.data = this.getDefaults();
        this.save();
    }

    addActivity(text, type = 'info') {
        const activities = this.getActivities();
        activities.unshift({ text, type, time: new Date().toISOString() });
        if (activities.length > 50) activities.length = 50;
        localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(activities));
    }

    getActivities() {
        try {
            return JSON.parse(localStorage.getItem(this.ACTIVITY_KEY) || '[]');
        } catch {
            return [];
        }
    }

    clearActivities() {
        localStorage.setItem(this.ACTIVITY_KEY, '[]');
    }

    listenCrossTabs() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY && e.newValue) {
                try {
                    this.data = JSON.parse(e.newValue);
                    this.notify();
                } catch (err) {
                    console.error('AdminStore: cross-tab sync error', err);
                }
            }
        });
    }

    // Получить имя автора по id
    getAuthorName(authorId, lang = 'en') {
        const member = this.data.team.find(m => m.id === authorId);
        if (member) return member.name[lang] || member.name.en;
        return authorId || '';
    }
}