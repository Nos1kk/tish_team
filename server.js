const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function getDefaults() {
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
            { id: 'marketplace', title: { en: 'WB Cards', ru: 'Карточки WB' }, description: { en: 'Product cards', ru: 'Карточки товаров' }, photos: [], icon: 'clipboard', order: 2 },
            { id: 'advertising', title: { en: 'Advertising', ru: 'Реклама' }, description: { en: 'Banners & promo', ru: 'Баннеры и промо' }, photos: [], icon: 'rocket', order: 3 },
            { id: 'websites', title: { en: 'Websites', ru: 'Сайты' }, description: { en: 'Landing pages & apps', ru: 'Лендинги и приложения' }, photos: [], icon: 'globe', order: 4 },
            { id: 'other', title: { en: 'Other', ru: 'Прочее' }, description: { en: 'Various projects', ru: 'Разные проекты' }, photos: [], icon: 'circles', order: 5 }
        ],
        hero: { stats: { projects: 150, clients: 50, years: 3 } },
        settings: { password: 'tish2024', siteName: 'TISH TEAM', lastModified: null },
        activity: []
    };
}

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            return deepMerge(getDefaults(), JSON.parse(raw));
        }
    } catch (e) { console.error('Load error:', e); }
    return getDefaults();
}

function saveData(data) {
    try {
        data.settings.lastModified = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) { console.error('Save error:', e); return false; }
}

function deepMerge(target, source) {
    const output = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            output[key] = source[key];
        }
    }
    return output;
}

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname)));

// ===== API =====
app.get('/api/data', (req, res) => {
    const data = loadData();
    const pub = JSON.parse(JSON.stringify(data));
    delete pub.settings.password;
    delete pub.activity;
    res.json(pub);
});

app.get('/api/admin/data', (req, res) => res.json(loadData()));

app.post('/api/admin/data', (req, res) => {
    const data = req.body;
    if (!data) return res.status(400).json({ error: 'No data' });
    if (saveData(data)) res.json({ success: true, lastModified: data.settings.lastModified });
    else res.status(500).json({ error: 'Save failed' });
});

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const data = loadData();
    if (password === data.settings.password) res.json({ success: true });
    else res.status(401).json({ error: 'Wrong password' });
});

// БАГ #2 FIX: поддержка image и video
app.post('/api/admin/upload', (req, res) => {
    const { image, filename } = req.body;
    if (!image) return res.status(400).json({ error: 'No file' });

    const matches = image.match(/^data:(image|video)\/(\w+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid format' });

    const mediaType = matches[1]; // image or video
    const extRaw = matches[2];
    const ext = extRaw === 'jpeg' ? 'jpg' : (extRaw === 'quicktime' ? 'mov' : extRaw);
    const data = matches[3];
    const safeName = (filename || `${mediaType}_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const name = `${safeName}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, name);

    fs.writeFileSync(filePath, data, 'base64');
    res.json({ success: true, url: `/uploads/${name}` });
});

app.get('/api/admin/activity', (req, res) => {
    const data = loadData();
    res.json(data.activity || []);
});

app.post('/api/admin/activity', (req, res) => {
    const { text, type } = req.body;
    const data = loadData();
    if (!data.activity) data.activity = [];
    data.activity.unshift({ text, type: type || 'info', time: new Date().toISOString() });
    if (data.activity.length > 100) data.activity.length = 100;
    saveData(data);
    res.json({ success: true });
});

app.delete('/api/admin/activity', (req, res) => {
    const data = loadData();
    data.activity = [];
    saveData(data);
    res.json({ success: true });
});

app.post('/api/admin/reset', (req, res) => {
    saveData(getDefaults());
    res.json({ success: true });
});

// Импорт JSON (обновление #5)
app.post('/api/admin/import', (req, res) => {
    const data = req.body;
    if (!data || !data.team || !data.works) return res.status(400).json({ error: 'Invalid data' });
    if (saveData(data)) res.json({ success: true });
    else res.status(500).json({ error: 'Import failed' });
});

// Размер данных (обновление #10)
app.get('/api/admin/stats', (req, res) => {
    try {
        const dataSize = fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).size : 0;
        let uploadsSize = 0;
        let uploadsCount = 0;
        if (fs.existsSync(UPLOADS_DIR)) {
            fs.readdirSync(UPLOADS_DIR).forEach(f => {
                uploadsSize += fs.statSync(path.join(UPLOADS_DIR, f)).size;
                uploadsCount++;
            });
        }
        res.json({ dataSize, uploadsSize, uploadsCount });
    } catch { res.json({ dataSize: 0, uploadsSize: 0, uploadsCount: 0 }); }
});

app.get('*', (req, res) => {
    // API routes — return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => console.log(`🟣 TISH server on port ${port}`));