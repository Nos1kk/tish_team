const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// ═══════════════════════════════════════
// МАСТЕР-ПАРОЛЬ — ВСЕГДА РАБОТАЕТ
// Не зависит от данных в JSON файле
// ═══════════════════════════════════════
const MASTER_PASSWORD = 'tish2024';

const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function getDefaults() {
    return {
        team: [
            {
                id: 'sanya', name: { en: 'Sanya', ru: 'Саня' },
                role: { en: 'Lead Designer', ru: 'Lead дизайнер' },
                photo: '', level: 'Figma • Presentations • WB Cards • Logos • Brandbooks',
                description: {
                    en: 'Creates presentations, marketplace product cards, logos and complete brand identity.',
                    ru: 'Создаёт презентации, карточки товаров, логотипы и полную айдентику.'
                },
                conditions: {
                    en: 'Projects from 2-3 days, 50% prepayment. Rush orders +30%.',
                    ru: 'Проекты от 2-3 дней, предоплата 50%. Срочные +30%.'
                },
                portfolioItems: [], tags: ['Figma', 'Presentations', 'WB'], status: 'online'
            },
            {
                id: 'yarik', name: { en: 'Yarik', ru: 'Ярик' },
                role: { en: 'Design & Branding', ru: 'Дизайн & Брендинг' },
                photo: '', level: 'Presentations • Brandbooks • Logos • Print Design',
                description: {
                    en: 'Creates presentations, brandbooks and logos.',
                    ru: 'Создаёт презентации, брендбуки и логотипы.'
                },
                conditions: {
                    en: 'Full branding packages or individual elements.',
                    ru: 'Полные пакеты брендинга или отдельные элементы.'
                },
                portfolioItems: [], tags: ['Branding', 'Logos', 'Print'], status: 'online'
            },
            {
                id: 'kirya', name: { en: 'Kirya', ru: 'Киря' },
                role: { en: 'Development', ru: 'Разработка' },
                photo: '', level: 'Websites • Telegram Bots • Apps • Plugins',
                description: {
                    en: 'Turns design into working products.',
                    ru: 'Превращает дизайн в работающие продукты.'
                },
                conditions: {
                    en: 'Websites and apps turnkey. Support after delivery.',
                    ru: 'Сайты и приложения под ключ. Поддержка после сдачи.'
                },
                portfolioItems: [], tags: ['Websites', 'Bots', 'Apps'], status: 'online'
            }
        ],
        works: [
            { id: 'branding', title: { en: 'Branding', ru: 'Брендинг' }, description: { en: 'Identity & Logos', ru: 'Логотипы и айдентика' }, photos: [], icon: 'layers', order: 0 },
            { id: 'presentations', title: { en: 'Presentations', ru: 'Презентации' }, description: { en: 'Pitch decks', ru: 'Питч-деки' }, photos: [], icon: 'monitor', order: 1 },
            { id: 'marketplace', title: { en: 'WB Cards', ru: 'Карточки WB' }, description: { en: 'Product cards', ru: 'Карточки товаров' }, photos: [], icon: 'clipboard', order: 2 },
            { id: 'advertising', title: { en: 'Advertising', ru: 'Реклама' }, description: { en: 'Banners & Creatives', ru: 'Баннеры и креативы' }, photos: [], icon: 'rocket', order: 3 },
            { id: 'websites', title: { en: 'Websites', ru: 'Сайты' }, description: { en: 'Landing pages', ru: 'Лендинги' }, photos: [], icon: 'globe', order: 4 },
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
            if (raw.trim()) {
                const parsed = JSON.parse(raw);
                return deepMerge(getDefaults(), parsed);
            }
        }
    } catch (e) {
        console.error('❌ Load error:', e.message);
    }
    const defaults = getDefaults();
    // Сохраняем defaults если файла нет
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
    } catch (e) {}
    return defaults;
}

function saveData(data) {
    try {
        if (!data.settings) data.settings = {};
        data.settings.lastModified = new Date().toISOString();
        // Гарантируем что пароль не пустой
        if (!data.settings.password) data.settings.password = MASTER_PASSWORD;
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('❌ Save error:', e.message);
        return false;
    }
}

function deepMerge(target, source) {
    if (!source) return target;
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

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Logging
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`📡 ${req.method} ${req.path}`);
    }
    next();
});

// Static
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname)));

// ═══════════════════════ API ═══════════════════════

// Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0' });
});

// Public data
app.get('/api/data', (req, res) => {
    const data = loadData();
    const pub = JSON.parse(JSON.stringify(data));
    delete pub.settings.password;
    delete pub.activity;
    res.json(pub);
});

// Admin data
app.get('/api/admin/data', (req, res) => {
    res.json(loadData());
});

// Save
app.post('/api/admin/data', (req, res) => {
    const data = req.body;
    if (!data) return res.status(400).json({ error: 'No data' });
    if (saveData(data)) {
        res.json({ success: true, lastModified: data.settings.lastModified });
    } else {
        res.status(500).json({ error: 'Save failed' });
    }
});

// ═══════════════════════ LOGIN ═══════════════════════
// КРИТИЧЕСКИ ВАЖНЫЙ ЭНДПОИНТ
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(401).json({ error: 'No password' });
    }

    // Загружаем данные
    const data = loadData();
    const storedPassword = (data.settings && data.settings.password) ? data.settings.password : '';

    console.log('🔐 Login:', {
        provided: password,
        stored: storedPassword,
        master: MASTER_PASSWORD,
        matchMaster: password === MASTER_PASSWORD,
        matchStored: password === storedPassword
    });

    // Проверяем: мастер-пароль ИЛИ сохранённый пароль
    if (password === MASTER_PASSWORD || (storedPassword && password === storedPassword)) {
        console.log('✅ Login OK');
        return res.json({ success: true });
    }

    console.log('❌ Login FAILED');
    return res.status(401).json({ error: 'Wrong password' });
});

// Upload
app.post('/api/admin/upload', (req, res) => {
    const { image, filename } = req.body;
    if (!image) return res.status(400).json({ error: 'No image' });

    const matches = image.match(/^data:(image|video)\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid format' });

    const ext = matches[2] === 'jpeg' ? 'jpg' : (matches[2] === 'quicktime' ? 'mov' : matches[2]);
    const safeName = (filename || `file_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalName = `${safeName}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, finalName);

    try {
        fs.writeFileSync(filePath, matches[3], 'base64');
        res.json({ success: true, url: `/uploads/${finalName}` });
    } catch (e) {
        console.error('Upload error:', e);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Activity
app.get('/api/admin/activity', (req, res) => {
    res.json(loadData().activity || []);
});

app.post('/api/admin/activity', (req, res) => {
    const { text, type } = req.body;
    const data = loadData();
    if (!data.activity) data.activity = [];
    data.activity.unshift({ text: text || '', type: type || 'info', time: new Date().toISOString() });
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

// Reset
app.post('/api/admin/reset', (req, res) => {
    saveData(getDefaults()) ? res.json({ success: true }) : res.status(500).json({ error: 'Failed' });
});

// Import
app.post('/api/admin/import', (req, res) => {
    const data = req.body;
    if (!data || !data.team || !data.works) return res.status(400).json({ error: 'Invalid' });
    const merged = deepMerge(getDefaults(), data);
    saveData(merged) ? res.json({ success: true }) : res.status(500).json({ error: 'Failed' });
});

// Stats
app.get('/api/admin/stats', (req, res) => {
    try {
        const dataSize = fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).size : 0;
        let uploadsSize = 0, uploadsCount = 0;
        if (fs.existsSync(UPLOADS_DIR)) {
            fs.readdirSync(UPLOADS_DIR).forEach(f => {
                try { uploadsSize += fs.statSync(path.join(UPLOADS_DIR, f)).size; uploadsCount++; } catch {}
            });
        }
        res.json({ dataSize, uploadsSize, uploadsCount });
    } catch { res.json({ dataSize: 0, uploadsSize: 0, uploadsCount: 0 }); }
});

// SPA fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Internal error' });
});

app.listen(port, '0.0.0.0', () => {
    console.log('');
    console.log('🟣 ═══════════════════════════════════');
    console.log(`🟣  TISH Server on port ${port}`);
    console.log(`🔐  Master password: ${MASTER_PASSWORD}`);
    console.log(`📁  Data: ${DATA_FILE}`);
    console.log(`🖼   Uploads: ${UPLOADS_DIR}`);
    console.log('🟣 ═══════════════════════════════════');
    console.log('');
});