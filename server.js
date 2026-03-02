const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ═══════════════════════════════════════
// SSE — УНИКАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ
// ═══════════════════════════════════════
const sseUsers = new Map(); // sessionId -> { res, lastSeen }

function getUniqueUserCount() {
    return sseUsers.size;
}

function broadcastSSE(payload) {
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    const dead = [];
    sseUsers.forEach((client, sessionId) => {
        try {
            client.res.write(msg);
        } catch {
            dead.push(sessionId);
        }
    });
    dead.forEach(id => sseUsers.delete(id));
}

// ═══════════════════════════════════════
// ДЕФОЛТНЫЕ ДАННЫЕ
// ═══════════════════════════════════════
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

function migrateData(data) {
    if (!data || !data.settings) return data;
    const oldDefaults = ['tish2024', 'admin', 'password', '1234'];
    if (oldDefaults.includes(data.settings.password)) {
        console.log('🔄 MIGRATION: Removing old default password');
        data.settings.password = '';
    }
    return data;
}

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            if (raw.trim()) {
                let parsed = JSON.parse(raw);
                let data = deepMerge(getDefaults(), parsed);
                data = migrateData(data);
                return data;
            }
        }
    } catch (e) {
        console.error('❌ Load error:', e.message);
    }

    const defaults = getDefaults();
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
        console.log('✅ Created fresh data file (no password)');
    } catch (e) {
        console.error('❌ Cannot write data file:', e.message);
    }
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

// ═══════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════
function loadAnalytics() {
    try {
        if (fs.existsSync(ANALYTICS_FILE)) {
            const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
            if (raw.trim()) return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Analytics load error:', e.message);
    }
    return { events: [] };
}

function saveAnalytics(data) {
    try {
        fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Analytics save error:', e.message);
    }
}

function computeAnalyticsStats(events, since) {
    const filtered = events.filter(e => {
        try {
            return new Date(e.timestamp).getTime() >= since;
        } catch { return false; }
    });

    const uniqueSessions = new Set();
    const categoryClicks = {};
    const teamClicks = {};
    let portfolioClicks = 0;
    let botClicks = 0;
    let pageViews = 0;
    const hourlyActivity = new Array(24).fill(0);

    filtered.forEach(e => {
        if (e.sessionId) uniqueSessions.add(e.sessionId);

        switch (e.event) {
            case 'page_view':
                pageViews++;
                break;
            case 'portfolio_click':
                portfolioClicks++;
                break;
            case 'bot_click':
                botClicks++;
                break;
            case 'category_click':
                if (e.data?.category) {
                    categoryClicks[e.data.category] = (categoryClicks[e.data.category] || 0) + 1;
                }
                break;
            case 'team_click':
                if (e.data?.member) {
                    teamClicks[e.data.member] = (teamClicks[e.data.member] || 0) + 1;
                }
                break;
        }

        try {
            const hour = new Date(e.timestamp).getHours();
            if (hour >= 0 && hour < 24) hourlyActivity[hour]++;
        } catch {}
    });

    return {
        uniqueVisitors: uniqueSessions.size,
        pageViews,
        portfolioClicks,
        botClicks,
        categoryClicks,
        teamClicks,
        hourlyActivity,
        totalEvents: filtered.length
    };
}

// ═══════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════

// Health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        server: true,
        dataFile: fs.existsSync(DATA_FILE),
        time: new Date().toISOString(),
        version: '3.2',
        uniqueUsers: getUniqueUserCount()
    });
});

// ═══════════════════════════════════════
// SSE — ИСПРАВЛЕНО: УНИКАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ
// ═══════════════════════════════════════
app.get('/api/sse', (req, res) => {
    const sessionId = req.query.sessionId || ('anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*'
    });

    // Если у этого пользователя уже есть SSE соединение — закрываем старое
    const existing = sseUsers.get(sessionId);
    if (existing) {
        try { existing.res.end(); } catch {}
    }

    sseUsers.set(sessionId, { res, lastSeen: Date.now() });

    const uniqueCount = getUniqueUserCount();

    // Сообщаем новому клиенту
    res.write(`data: ${JSON.stringify({ type: 'connected', uniqueUsers: uniqueCount })}\n\n`);

    // Уведомляем всех об обновлении счётчика
    broadcastSSE({ type: 'clients', uniqueUsers: uniqueCount });

    // Heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
            const entry = sseUsers.get(sessionId);
            if (entry) entry.lastSeen = Date.now();
        } catch {
            clearInterval(heartbeat);
            sseUsers.delete(sessionId);
        }
    }, 25000);

    // Cleanup при отключении
    req.on('close', () => {
        clearInterval(heartbeat);
        sseUsers.delete(sessionId);
        // Уведомляем всех
        setTimeout(() => {
            broadcastSSE({ type: 'clients', uniqueUsers: getUniqueUserCount() });
        }, 100);
    });
});

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
app.get('/api/admin/check-auth', (req, res) => {
    const data = loadData();
    const pw = (data.settings?.password || '').trim();
    const required = pw.length > 0;
    console.log(`🔐 check-auth: password="${pw ? '***' : ''}", required=${required}`);
    res.json({ required });
});

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const data = loadData();
    const stored = (data.settings?.password || '').trim();

    console.log(`🔐 Login attempt. Has stored password: ${stored.length > 0}`);

    if (!stored || stored.length === 0) {
        console.log('✅ Login OK — no password required');
        return res.json({ success: true });
    }

    if (!password) {
        console.log('❌ No password provided');
        return res.status(401).json({ error: 'Password required' });
    }

    const envPw = process.env.ADMIN_PASSWORD;
    if (password === stored || (envPw && password === envPw)) {
        console.log('✅ Login OK — password matched');
        return res.json({ success: true });
    }

    console.log('❌ Login FAILED — wrong password');
    return res.status(401).json({ error: 'Wrong password' });
});

// ═══════════════════════════════════════
// VALIDATE SESSION (НОВЫЙ — проверка актуальности пароля)
// ═══════════════════════════════════════
app.get('/api/admin/validate-session', (req, res) => {
    const data = loadData();
    const pw = (data.settings?.password || '').trim();

    // Если пароль не установлен — сессия всегда валидна
    if (!pw || pw.length === 0) {
        return res.json({ valid: true, passwordRequired: false });
    }

    // Пароль установлен — клиент должен заново проходить логин
    // (клиент передаёт флаг "у меня есть сессия", сервер проверяет актуальность)
    return res.json({ valid: false, passwordRequired: true });
});

// Password management
app.post('/api/admin/password', (req, res) => {
    const { password } = req.body;
    const data = loadData();
    data.settings.password = (password || '').trim();
    if (saveData(data)) {
        const has = data.settings.password.length > 0;
        console.log(`🔐 Password ${has ? 'SET' : 'REMOVED'}`);

        // При смене пароля — инвалидируем все сессии через SSE
        broadcastSSE({ type: 'password_changed', hasPassword: has });

        res.json({ success: true, hasPassword: has });
    } else {
        res.status(500).json({ error: 'Failed' });
    }
});

// Public data
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
        res.json({ dataSize, uploadsSize, uploadsCount, uniqueUsers: getUniqueUserCount() });
    } catch { res.json({ dataSize: 0, uploadsSize: 0, uploadsCount: 0, uniqueUsers: 0 }); }
});

// ═══════════════════════════════════════
// ANALYTICS ENDPOINTS (НОВЫЕ)
// ═══════════════════════════════════════
app.post('/api/analytics', (req, res) => {
    const { event, data: eventData, sessionId, timestamp } = req.body;
    if (!event) return res.status(400).json({ error: 'No event' });

    const analytics = loadAnalytics();
    if (!analytics.events) analytics.events = [];

    analytics.events.push({
        event,
        data: eventData || {},
        sessionId: sessionId || 'unknown',
        timestamp: timestamp || new Date().toISOString()
    });

    // Лимит — 10000 последних событий
    if (analytics.events.length > 10000) {
        analytics.events = analytics.events.slice(-5000);
    }

    saveAnalytics(analytics);
    res.json({ success: true });
});

app.get('/api/analytics/stats', (req, res) => {
    const period = req.query.period || '7d';
    const analytics = loadAnalytics();
    const events = analytics.events || [];

    const now = Date.now();
    let since = 0;
    switch (period) {
        case '24h': since = now - 24 * 60 * 60 * 1000; break;
        case '7d': since = now - 7 * 24 * 60 * 60 * 1000; break;
        case '30d': since = now - 30 * 24 * 60 * 60 * 1000; break;
        default: since = 0; // all
    }

    const stats = computeAnalyticsStats(events, since);
    res.json(stats);
});

// Очистка аналитики
app.delete('/api/analytics', (req, res) => {
    saveAnalytics({ events: [] });
    res.json({ success: true });
});

// Force reset password
app.get('/api/admin/force-reset-password', (req, res) => {
    const data = loadData();
    data.settings.password = '';
    saveData(data);
    console.log('🔓 PASSWORD FORCE RESET via URL');
    res.json({ success: true, message: 'Password removed. Admin panel is now open.' });
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

// ═══════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════
function startupMigration() {
    console.log('🔄 Running startup migration...');
    const data = loadData();
    const pw = (data.settings?.password || '').trim();

    if (pw === 'tish2024') {
        console.log('🔄 Found old default password — removing');
        data.settings.password = '';
        saveData(data);
    } else if (pw) {
        console.log(`🔐 Custom password is set (length: ${pw.length})`);
    } else {
        console.log('🔓 No password — open access');
    }
}

// Периодическая очистка мертвых SSE соединений
setInterval(() => {
    const now = Date.now();
    const timeout = 60000; // 60 секунд без heartbeat
    const dead = [];
    sseUsers.forEach((client, sessionId) => {
        if (now - client.lastSeen > timeout) {
            dead.push(sessionId);
        }
    });
    if (dead.length > 0) {
        dead.forEach(id => {
            try { sseUsers.get(id)?.res.end(); } catch {}
            sseUsers.delete(id);
        });
        broadcastSSE({ type: 'clients', uniqueUsers: getUniqueUserCount() });
        console.log(`🧹 Cleaned ${dead.length} stale SSE connections`);
    }
}, 30000);

app.listen(port, '0.0.0.0', () => {
    startupMigration();

    const data = loadData();
    const hasPass = !!(data.settings?.password?.trim());

    console.log('');
    console.log('🟣 ═══════════════════════════════════');
    console.log(`🟣  TISH Server v3.2 on port ${port}`);
    console.log(`🔐  Password: ${hasPass ? 'SET' : 'NOT SET (open access)'}`);
    console.log(`📁  Data: ${DATA_FILE}`);
    console.log(`📁  Exists: ${fs.existsSync(DATA_FILE)}`);
    console.log(`🖼   Uploads: ${UPLOADS_DIR}`);
    console.log(`📊  Analytics: ${ANALYTICS_FILE}`);
    console.log('🟣 ═══════════════════════════════════');
    console.log('');
});