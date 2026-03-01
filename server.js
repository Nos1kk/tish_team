const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// SSE clients for real-time sync
const sseClients = new Set();

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
        // ВАЖНО: пароль пустой по умолчанию — админка открыта без пароля
        settings: { password: '', siteName: 'TISH TEAM', lastModified: null },
        activity: []
    };
}

function deepMerge(target, source) {
    if (!source) return target;
    const output = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] !== null && source[key] !== undefined &&
            typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            output[key] = source[key];
        }
    }
    return output;
}

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            if (raw.trim()) {
                return deepMerge(getDefaults(), JSON.parse(raw));
            }
        }
    } catch (e) {
        console.error('❌ Load error:', e.message);
    }
    const defaults = getDefaults();
    try { fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2), 'utf-8'); } catch {}
    return defaults;
}

function saveData(data) {
    try {
        if (!data.settings) data.settings = {};
        data.settings.lastModified = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        broadcastSSE({ type: 'update', time: Date.now() });
        return true;
    } catch (e) {
        console.error('❌ Save error:', e.message);
        return false;
    }
}

function broadcastSSE(payload) {
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach(client => {
        try { client.write(msg); } catch { sseClients.delete(client); }
    });
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`📡 ${req.method} ${req.path}`);
    }
    next();
});

app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname)));

// ═══════════════════════ API ═══════════════════════

// Health (ИСПРАВЛЕНО — возвращает правильные поля)
app.get('/api/health', (req, res) => {
    const dataExists = fs.existsSync(DATA_FILE);
    res.json({
        status: 'ok',
        server: true,
        dataFile: dataExists,
        time: new Date().toISOString(),
        version: '3.0',
        clients: sseClients.size
    });
});

// SSE — мгновенная синхронизация
app.get('/api/sse', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*'
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', clients: sseClients.size + 1 })}\n\n`);
    sseClients.add(res);
    broadcastSSE({ type: 'clients', count: sseClients.size });

    const heartbeat = setInterval(() => {
        try { res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`); }
        catch { clearInterval(heartbeat); sseClients.delete(res); }
    }, 25000);

    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
        broadcastSSE({ type: 'clients', count: sseClients.size });
    });
});

// Проверка: нужен ли пароль
app.get('/api/admin/check-auth', (req, res) => {
    const data = loadData();
    const pw = data.settings?.password;
    const required = !!(pw && pw.trim().length > 0);
    res.json({ required });
});

// Количество подключённых клиентов
app.get('/api/admin/clients', (req, res) => {
    res.json({ count: sseClients.size });
});

// Public data (без пароля)
app.get('/api/data', (req, res) => {
    const data = loadData();
    const pub = JSON.parse(JSON.stringify(data));
    if (pub.settings) delete pub.settings.password;
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
        res.json({ success: true, lastModified: data.settings?.lastModified });
    } else {
        res.status(500).json({ error: 'Save failed' });
    }
});

// Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(401).json({ error: 'No password' });

    const data = loadData();
    const stored = (data.settings?.password || '').trim();

    // Если пароль не установлен, пускаем всех
    if (!stored) return res.json({ success: true });

    // Env variable как резервный пароль
    const envPw = process.env.ADMIN_PASSWORD;

    if (password === stored || (envPw && password === envPw)) {
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
        res.json({ dataSize, uploadsSize, uploadsCount, sseClients: sseClients.size });
    } catch { res.json({ dataSize: 0, uploadsSize: 0, uploadsCount: 0, sseClients: 0 }); }
});

// Change password
app.post('/api/admin/password', (req, res) => {
    const { password } = req.body;
    const data = loadData();
    data.settings.password = (password || '').trim();
    if (saveData(data)) {
        res.json({ success: true, hasPassword: data.settings.password.length > 0 });
    } else {
        res.status(500).json({ error: 'Failed' });
    }
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
    console.log(`🟣  TISH Server v3.0 on port ${port}`);
    console.log(`🔐  Password: ${loadData().settings?.password ? 'SET' : 'NOT SET (open access)'}`);
    console.log(`🔑  Env ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? 'SET' : 'not set'}`);
    console.log(`📁  Data: ${DATA_FILE}`);
    console.log(`🖼   Uploads: ${UPLOADS_DIR}`);
    console.log('🟣 ═══════════════════════════════════');
    console.log('');
});