require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const STORE_DIR = path.join(__dirname, 'tish-store');
const STORE_DATA_DIR = process.env.STORE_DATA_DIR || path.join(DATA_DIR, 'store');
const STORE_UPLOADS_DIR = process.env.STORE_UPLOADS_DIR || path.join(UPLOADS_DIR, 'store');

const STORE_SESSION_TTL_MS = Number(process.env.STORE_SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const STORE_GOOGLE_CLIENT_ID = (process.env.STORE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
const STORE_GOOGLE_ALLOWED_DOMAIN = (process.env.STORE_GOOGLE_ALLOWED_DOMAIN || '').trim().toLowerCase();
const STORE_ADMIN_PASSWORD = (process.env.STORE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '098tish123').trim();

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(STORE_DATA_DIR)) fs.mkdirSync(STORE_DATA_DIR, { recursive: true });
if (!fs.existsSync(STORE_UPLOADS_DIR)) fs.mkdirSync(STORE_UPLOADS_DIR, { recursive: true });

// ═══════════════════════════════════════
// SSE — УНИКАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ
// ═══════════════════════════════════════
const sseUsers = new Map(); // sessionId -> { res, lastSeen }
const rootAdminSessions = new Map(); // token -> { createdAt, expiresAt }
const ROOT_ADMIN_SESSION_TTL_MS = Number(process.env.ROOT_ADMIN_SESSION_TTL_MS || 24 * 60 * 60 * 1000);
const rootAdminLoginRate = new Map(); // ip -> timestamps[]

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
        settings: { password: '098tish123', siteName: 'TISH TEAM', lastModified: null },
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
        console.log('🔄 MIGRATION: Replacing old default password');
        data.settings.password = '098tish123';
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
// STORE HELPERS (UNIFIED BACKEND)
// ═══════════════════════════════════════
// ─── Store session management (token-based) ───────────────────────────────
const storeSessions = new Map(); // token -> session
const storeRateBuckets = new Map(); // ip -> timestamps[]

const PUBLIC_DATA_READ_KEYS = new Set(['ping', 'tish_admin_products', 'tish_review_counts', 'tish_tishara_shop_products']);
const USER_READ_WRITE_KEYS = new Set(['tish_notifications', 'tish_cart', 'tish_subscription', 'tish_archived_chats', 'tish_pinned_chats', 'tish_favorites', 'tish_admin_notifications']);
const USER_READ_ONLY_KEYS = new Set(['tish_admin_presence']);
const STORE_UPLOAD_META_KEY = 'tish_upload_meta';
const STORE_UPLOAD_MAX_FILES = Number(process.env.STORE_UPLOAD_MAX_FILES || 10);
const STORE_UPLOAD_RESERVE_BYTES = Number(process.env.STORE_UPLOAD_RESERVE_BYTES || 200 * 1024 * 1024);
const STORE_ANALYTICS_KEY = 'tish_analytics_events';
const STORE_ANALYTICS_MAX = Number(process.env.STORE_ANALYTICS_MAX || 20000);
const STORE_CHAT_INCREMENTAL_LIMIT = Number(process.env.STORE_CHAT_INCREMENTAL_LIMIT || 250);
const STORE_ANALYTICS_ALLOWED_TYPES = new Set(['visit','page_view','product_view','search','cart_add','cart_remove','purchase','favorite','review','referral']);
const STORE_UPLOAD_ALLOWED_MIMES = new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']);
const STORE_UPLOAD_ALLOWED_EXTS = new Set(['.jpg','.jpeg','.png','.webp','.gif','.mp4','.webm','.mov']);
const storeDataCache = new Map();

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function storeCreateSession(payload = {}) {
    const now = Date.now();
    const token = crypto.randomBytes(32).toString('hex');
    const role = payload.role === 'admin' ? 'admin' : 'user';
    const session = { token, role, googleId: String(payload.googleId || ''), email: normalizeEmail(payload.email || ''), name: String(payload.name || ''), createdAt: now, expiresAt: now + STORE_SESSION_TTL_MS };
    storeSessions.set(token, session);
    return session;
}

function storeReadAuthToken(req) {
    const h = String(req.headers.authorization || '').trim();
    if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
    return String(req.headers['x-auth-token'] || '').trim();
}

function storeGetSessionFromRequest(req) {
    const token = storeReadAuthToken(req);
    if (!token) return null;
    const session = storeSessions.get(token);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) { storeSessions.delete(token); return null; }
    return session;
}

function requireStoreAuth(req, res, next) {
    const session = storeGetSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.authSession = session;
    next();
}

function attachOptionalStoreAuth(req, res, next) {
    req.authSession = storeGetSessionFromRequest(req);
    next();
}

function requireStoreAdminToken(req, res, next) {
    const session = storeGetSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (session.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    req.authSession = session;
    next();
}

function storeBuildSessionView(session) {
    if (!session) return null;
    return {
        token: String(session.token || ''),
        role: session.role === 'admin' ? 'admin' : 'user',
        isAdmin: session.role === 'admin',
        googleUser: {
            sub: String(session.googleId || ''),
            email: normalizeEmail(session.email || ''),
            name: String(session.name || ''),
            picture: ''
        }
    };
}

function getStoreSession(req) {
    return storeBuildSessionView(storeGetSessionFromRequest(req));
}

function requireStoreUser(req, res, next) {
    const session = storeGetSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.authSession = session;
    req.storeSession = storeBuildSessionView(session);
    next();
}

function requireStoreAdmin(req, res, next) {
    const session = storeGetSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (session.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    req.authSession = session;
    req.storeSession = storeBuildSessionView(session);
    next();
}

function createStoreSession(payload = {}) {
    const googleUser = payload.googleUser && typeof payload.googleUser === 'object' ? payload.googleUser : {};
    const role = payload.isAdmin ? 'admin' : 'user';
    const session = storeCreateSession({
        role,
        googleId: String(payload.googleId || googleUser.sub || ''),
        email: normalizeEmail(payload.email || googleUser.email || ''),
        name: String(payload.name || googleUser.name || '')
    });
    return session.token;
}

function patchStoreSession(req, patch = {}) {
    const session = req.authSession || storeGetSessionFromRequest(req);
    if (!session) return null;

    if (Object.prototype.hasOwnProperty.call(patch, 'isAdmin')) {
        session.role = patch.isAdmin ? 'admin' : 'user';
    } else if (Object.prototype.hasOwnProperty.call(patch, 'role')) {
        session.role = patch.role === 'admin' ? 'admin' : 'user';
    }

    session.expiresAt = Date.now() + STORE_SESSION_TTL_MS;
    storeSessions.set(session.token, session);
    req.authSession = session;
    req.storeSession = storeBuildSessionView(session);
    return req.storeSession;
}

function clearStoreSessionCookie(req, _res) {
    const token = storeReadAuthToken(req);
    if (token) storeSessions.delete(token);
}

function setStoreSessionCookie(_res, _sid) {
    // Token-based auth: client stores token and sends it as Authorization header.
}

function readRootAdminToken(req) {
    const h = String(req.headers.authorization || '').trim();
    if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
    return String(req.headers['x-admin-token'] || '').trim();
}

function createRootAdminSession() {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    rootAdminSessions.set(token, { createdAt: now, expiresAt: now + ROOT_ADMIN_SESSION_TTL_MS });
    return token;
}

function getRootAdminSession(req) {
    const token = readRootAdminToken(req);
    if (!token) return null;
    const session = rootAdminSessions.get(token);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
        rootAdminSessions.delete(token);
        return null;
    }
    session.expiresAt = Date.now() + ROOT_ADMIN_SESSION_TTL_MS;
    rootAdminSessions.set(token, session);
    return { token, ...session };
}

function clearRootAdminSession(req) {
    const token = readRootAdminToken(req);
    if (token) rootAdminSessions.delete(token);
}

function requireRootAdminAuth(req, res, next) {
    const session = getRootAdminSession(req);
    if (!session) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.rootAdminSession = session;
    next();
}

function allowRootAdminLogin(req) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (rootAdminLoginRate.get(ip) || []).filter((ts) => now - ts < 60_000);
    if (recent.length >= 20) {
        rootAdminLoginRate.set(ip, recent);
        return false;
    }
    recent.push(now);
    rootAdminLoginRate.set(ip, recent);
    return true;
}

function verifyGoogleCredential(credential) {
    return storeVerifyGoogleCredential(credential);
}

function getMainAdminPassword() {
    const data = loadData();
    const stored = String(data.settings?.password || '').trim();
    if (stored) return stored;
    return String(STORE_ADMIN_PASSWORD || '').trim();
}

function isMainAdminPasswordRequired() {
    return getMainAdminPassword().length > 0;
}

function isMainAdminPasswordValid(password) {
    const candidate = String(password || '').trim();
    const expected = getMainAdminPassword();
    if (!expected) return true;
    return candidate === expected;
}

function updateStoreReviewCounts() {
    return storeUpdateReviewCounts();
}

function sanitizeStoreKey(key) {
    return String(key || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getStoreDataFilePath(key) {
    const safeKey = sanitizeStoreKey(key);
    return path.join(STORE_DATA_DIR, `${safeKey}.json`);
}

function storeMessageToken(msg, fallback = 0) {
    if (!msg || typeof msg !== 'object') return fallback;
    const ts = Date.parse(msg.date || msg.createdAt || msg.transferAt || '');
    if (Number.isFinite(ts) && ts > 0) return ts;
    const idNum = Number(msg.id);
    if (Number.isFinite(idNum) && idNum > 0) return idNum;
    const time = String(msg.time || '').trim();
    const m = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (m) {
        const d = new Date();
        d.setHours(Number(m[1]), Number(m[2]), 0, 0);
        return d.getTime();
    }
    return fallback;
}

function storeIsCompactWriteKey(key) {
    return String(key || '').startsWith('chat_') || key === STORE_ANALYTICS_KEY;
}

function storeReadData(key, fallback = null) {
    if (storeDataCache.has(key)) {
        const cached = storeDataCache.get(key);
        return cached === undefined ? fallback : cached;
    }

    const filePath = getStoreDataFilePath(key);
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            if (!raw.trim()) {
                storeDataCache.set(key, undefined);
                return fallback;
            }
            const parsed = JSON.parse(raw);
            storeDataCache.set(key, parsed);
            return parsed;
        }
    } catch (e) {
        console.error(`[store] read error for ${key}:`, e.message);
    }
    storeDataCache.set(key, undefined);
    return fallback;
}

function storeWriteData(key, value) {
    const filePath = getStoreDataFilePath(key);
    const tmpPath = filePath + '.tmp-' + process.pid + '-' + Date.now();
    const compact = storeIsCompactWriteKey(key);
    try {
        storeDataCache.set(key, value);
        fs.writeFileSync(tmpPath, JSON.stringify(value, null, compact ? 0 : 2), 'utf8');
        fs.renameSync(tmpPath, filePath);
        return true;
    } catch (e) {
        console.error(`[store] write error for ${key}:`, e.message);
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
        return false;
    }
}

function storeDeleteData(key) {
    const filePath = getStoreDataFilePath(key);
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        storeDataCache.delete(key);
        return true;
    } catch (e) {
        console.error(`[store] delete error for ${key}:`, e.message);
        return false;
    }
}

function storeListDataKeys() {
    try {
        return fs.readdirSync(STORE_DATA_DIR)
            .filter(name => name.endsWith('.json'))
            .map(name => name.replace(/\.json$/, ''));
    } catch {
        return [];
    }
}


function storeProfileKeyForSession(session) {
    const googleId = String(session?.googleId || '');
    return googleId ? ('tish_profile_' + googleId) : '';
}

function storeOrderBelongsToSession(order, session) {
    if (!order || !session) return false;
    if (session.role === 'admin') return true;
    const orderGoogleId = String(order.userId || '');
    const orderEmail = normalizeEmail(order.userEmail || '');
    if (session.googleId && orderGoogleId && orderGoogleId === session.googleId) return true;
    if (session.email && orderEmail && orderEmail === session.email) return true;
    return false;
}

function storeSanitizeUserOrder(order, session) {
    if (!order || typeof order !== 'object') return null;
    const out = { ...order };
    out.userId = String(session.googleId || out.userId || '');
    out.userEmail = normalizeEmail(session.email || out.userEmail || '');
    return out;
}

function storeFilterOrdersForSession(orders, session) {
    const list = Array.isArray(orders) ? orders : [];
    if (!session) return [];
    if (session.role === 'admin') return list;
    return list.filter(order => storeOrderBelongsToSession(order, session));
}

function storeMergeUserOrders(existingOrders, incomingOrders, session) {
    const allExisting = Array.isArray(existingOrders) ? existingOrders : [];
    const incoming = Array.isArray(incomingOrders) ? incomingOrders : [];
    const keepOtherUsers = allExisting.filter(order => !storeOrderBelongsToSession(order, session));
    const userMap = new Map();
    allExisting.filter(order => storeOrderBelongsToSession(order, session))
        .forEach(order => { if (order && order.id) userMap.set(String(order.id), order); });
    incoming.forEach(order => {
        const safe = storeSanitizeUserOrder(order, session);
        if (!safe || !safe.id) return;
        const k = String(safe.id);
        userMap.set(k, { ...(userMap.get(k) || {}), ...safe });
    });
    return keepOtherUsers.concat(Array.from(userMap.values()));
}

function storeCanAccessChatId(chatId, session) {
    if (!session) return false;
    if (session.role === 'admin') return true;
    const normalized = String(chatId || '');
    if (!normalized) return false;
    if (normalized.startsWith('support_')) {
        if (!session.googleId) return false;
        return normalized.slice('support_'.length) === session.googleId;
    }
    const chatKey = normalized.startsWith('chat_') ? normalized : ('chat_' + normalized);
    const orders = storeReadData('tish_orders', []) || [];
    const order = orders.find(o => String(o?.chatId || '') === chatKey);
    if (!order) return false;
    return storeOrderBelongsToSession(order, session);
}

function storeCanAccessDataKey(session, key, mode = 'read') {
    const safeKey = String(key || '');
    const isRead = mode === 'read';
    const isDelete = mode === 'delete';
    if (!session) { return !isRead ? safeKey === 'ping' : PUBLIC_DATA_READ_KEYS.has(safeKey); }
    if (session.role === 'admin') return true;
    if (safeKey === 'ping') return true;
    if (isRead && PUBLIC_DATA_READ_KEYS.has(safeKey)) return true;
    if (safeKey === 'tish_profile') return !isDelete;
    if (safeKey === storeProfileKeyForSession(session)) return !isDelete;
    if (safeKey.startsWith('tish_profile_')) return false;
    if (safeKey === 'tish_orders') return !isDelete;
    if (safeKey.startsWith('chat_')) return storeCanAccessChatId(safeKey.replace(/^chat_/, ''), session);
    if (USER_READ_WRITE_KEYS.has(safeKey)) return true;
    if (USER_READ_ONLY_KEYS.has(safeKey)) return isRead;
    return false;
}

function storeWriteChatMerged(key, newMessages) {
    if (!Array.isArray(newMessages)) return storeWriteData(key, newMessages);
    const existing = storeReadData(key, []) || [];
    if (!Array.isArray(existing) || existing.length === 0) return storeWriteData(key, newMessages);
    const merged = new Map();
    existing.forEach(m => { if (m && m.id != null) merged.set(m.id, m); });
    newMessages.forEach(m => {
        if (!m || m.id == null) return;
        const prev = merged.get(m.id) || {};
        const out = { ...prev, ...m };
        if (prev.deleted || m.deleted) out.deleted = true;
        merged.set(m.id, out);
    });
    return storeWriteData(key, Array.from(merged.values()));
}

function storeAppendChatMessage(key, message) {
    if (!message || typeof message !== 'object') return null;
    const messages = storeReadData(key, []) || [];
    const list = Array.isArray(messages) ? messages : [];
    const msg = { ...message };
    if (msg.id == null) msg.id = Date.now();

    const idx = list.findIndex((m) => m && m.id != null && String(m.id) === String(msg.id));
    if (idx >= 0) {
        const prev = list[idx] || {};
        list[idx] = { ...prev, ...msg, deleted: !!(prev.deleted || msg.deleted) };
    } else {
        list.push(msg);
    }

    const ok = storeWriteData(key, list);
    return ok ? msg.id : null;
}

function storeSelectChatMessages(messages, sinceTokenRaw, limitRaw) {
    const list = Array.isArray(messages) ? messages : [];
    const sinceToken = Number(sinceTokenRaw || 0);
    const limit = Number.isFinite(Number(limitRaw))
        ? Math.max(1, Math.min(2000, Math.floor(Number(limitRaw))))
        : STORE_CHAT_INCREMENTAL_LIMIT;

    let selected = list;
    const incremental = Number.isFinite(sinceToken) && sinceToken > 0;
    if (incremental) {
        selected = list.filter((m, idx) => storeMessageToken(m, idx + 1) > sinceToken);
        if (selected.length > limit) selected = selected.slice(-limit);
    }

    let lastToken = 0;
    list.forEach((m, idx) => {
        lastToken = Math.max(lastToken, storeMessageToken(m, idx + 1));
    });

    return { messages: selected, incremental, lastToken, total: list.length };
}

function storeReadValueForSession(key, session) {
    if (session && session.role !== 'admin') {
        if (key === 'tish_profile') {
            const profileKey = storeProfileKeyForSession(session);
            if (!profileKey) return {};
            return storeReadData(profileKey, {}) || {};
        }
        if (key === 'tish_orders') return storeFilterOrdersForSession(storeReadData('tish_orders', []) || [], session);
    }
    return storeReadData(key, null);
}

function storeWriteValueForSession(key, value, session) {
    if (key === 'ping') return true;
    if (session && session.role !== 'admin') {
        if (key === 'tish_profile') {
            const profileKey = storeProfileKeyForSession(session);
            if (!profileKey) return false;
            const profile = { ...(value && typeof value === 'object' ? value : {}), googleId: session.googleId || (value && value.googleId) || '', email: session.email || normalizeEmail(value && value.email) };
            const ok = storeWriteData(profileKey, profile);
            if (!ok) return false;
            storeWriteData('tish_profile', profile);
            try { storeUpdateReviewCounts(); } catch (e) {}
            return true;
        }
        if (key === 'tish_orders') {
            const merged = storeMergeUserOrders(storeReadData('tish_orders', []) || [], value, session);
            return storeWriteData('tish_orders', merged);
        }
    }
    if (key.startsWith('chat_')) return storeWriteChatMerged(key, value);
    const ok = storeWriteData(key, value);
    if (ok) {
        if (key === 'tish_profile' && value && typeof value === 'object' && value.googleId) storeWriteData('tish_profile_' + value.googleId, value);
        if (key === 'tish_profile' || key.startsWith('tish_profile_')) { try { storeUpdateReviewCounts(); } catch (e) {} }
    }
    return ok;
}

// ─── Upload helpers ────────────────────────────────────────────────────────
function storeNormalizeUploadFilename(filename) {
    const safe = String(filename || '').trim();
    if (!safe || !/^[a-zA-Z0-9._-]+$/.test(safe) || safe.includes('..')) return '';
    return safe;
}

function storeGetUploadMetaMap() {
    const data = storeReadData(STORE_UPLOAD_META_KEY, {});
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

function storeSetUploadMetaMap(meta) {
    return storeWriteData(STORE_UPLOAD_META_KEY, meta);
}

function storeGetUploadDiskEntries() {
    try {
        return fs.readdirSync(STORE_UPLOADS_DIR, { withFileTypes: true })
            .filter(e => e.isFile())
            .map(e => {
                const safeName = storeNormalizeUploadFilename(e.name);
                if (!safeName) return null;
                try { const stat = fs.statSync(path.join(STORE_UPLOADS_DIR, safeName)); return { filename: safeName, size: Number(stat.size || 0), mtime: stat.mtime ? new Date(stat.mtime).toISOString() : '' }; } catch { return null; }
            }).filter(Boolean);
    } catch { return []; }
}

function storeGetUploadStorageSummary() {
    const files = storeGetUploadDiskEntries();
    const usedBytes = files.reduce((sum, f) => sum + Number(f.size || 0), 0);
    return { fileCount: files.length, usedBytes, remainingBytes: Math.max(0, STORE_UPLOAD_RESERVE_BYTES - usedBytes) };
}

function storeInferMimeType(filename) {
    const ext = path.extname(String(filename || '')).toLowerCase();
    const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };
    return map[ext] || 'application/octet-stream';
}

function storeCanDeleteUpload(session, meta) {
    if (!session) return false;
    if (session.role === 'admin') return true;
    if (!meta || typeof meta !== 'object') return false;
    if (String(meta.ownerRole || '') === 'admin') return false;
    if (session.googleId && String(meta.ownerGoogleId || '') === session.googleId) return true;
    if (session.email && normalizeEmail(meta.ownerEmail || '') === normalizeEmail(session.email)) return true;
    return false;
}

const storeUploadStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, STORE_UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(String(file.originalname || '')).toLowerCase();
        const safeExt = STORE_UPLOAD_ALLOWED_EXTS.has(ext) ? ext : (() => {
            const m = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };
            return m[file.mimetype] || '';
        })();
        cb(null, `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${safeExt}`);
    }
});

function storeCreateUploadParser() {
    return multer({
        storage: storeUploadStorage,
        limits: { fileSize: STORE_UPLOAD_RESERVE_BYTES, files: STORE_UPLOAD_MAX_FILES },
        fileFilter: (_req, file, cb) => {
            if (!STORE_UPLOAD_ALLOWED_MIMES.has(file.mimetype)) {
                const err = new Error('Unsupported file type'); err.code = 'UNSUPPORTED_FILE_TYPE'; return cb(err);
            }
            cb(null, true);
        }
    }).array('files', STORE_UPLOAD_MAX_FILES);
}

// ─── Google verification ───────────────────────────────────────────────────
async function storeVerifyGoogleCredential(credential) {
    if (!credential || !STORE_GOOGLE_CLIENT_ID) throw new Error('Google auth not configured');
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Google verification failed');
    const payload = await response.json();
    if (!payload || !payload.sub || !payload.email) throw new Error('Invalid Google payload');
    if (payload.aud !== STORE_GOOGLE_CLIENT_ID) throw new Error('Invalid Google audience');
    if (payload.email_verified !== true && payload.email_verified !== 'true') throw new Error('Email not verified');
    const email = String(payload.email || '').toLowerCase();
    if (STORE_GOOGLE_ALLOWED_DOMAIN) {
        const hd = String(payload.hd || '').toLowerCase();
        if (hd !== STORE_GOOGLE_ALLOWED_DOMAIN && !email.endsWith('@' + STORE_GOOGLE_ALLOWED_DOMAIN)) throw new Error('Domain not allowed');
    }
    return { sub: payload.sub, email, name: payload.name || payload.given_name || email, picture: payload.picture || '', hd: String(payload.hd || '').toLowerCase() };
}

// ─── Review & analytics helpers ────────────────────────────────────────────
function storeListAllUserProfiles() {
    const profiles = []; const seen = new Set();
    storeListDataKeys().filter(k => k.startsWith('tish_profile_')).forEach(key => {
        const profile = storeReadData(key, null);
        if (!profile || typeof profile !== 'object') return;
        const googleId = String(profile.googleId || key.replace('tish_profile_', ''));
        if (googleId && seen.has(googleId)) return;
        if (googleId) seen.add(googleId);
        profiles.push({ key, profile: { ...profile, googleId } });
    });
    const active = storeReadData('tish_profile', null);
    if (active && typeof active === 'object') {
        const gid = String(active.googleId || '');
        if (gid && !seen.has(gid)) profiles.push({ key: 'tish_profile_' + gid, profile: { ...active, googleId: gid } });
    }
    return profiles;
}

function storeCollectAllReviews() {
    const allReviews = [];
    storeListAllUserProfiles().forEach(({ key, profile }) => {
        const fallbackName = String(profile.name || profile.email || '').trim() || 'Пользователь';
        const reviews = Array.isArray(profile.reviews) ? profile.reviews : [];
        reviews.forEach(review => {
            if (!review || typeof review !== 'object') return;
            allReviews.push({ ...review, profileKey: key, userName: String(review.userName || '').trim() || fallbackName, userEmail: String(review.userEmail || '').trim() || String(profile.email || '').trim(), userGoogleId: String(review.userGoogleId || '').trim() || String(profile.googleId || '').trim() });
        });
    });
    return allReviews;
}

function storeUpdateReviewCounts() {
    const reviews = storeCollectAllReviews().filter(r => !r.status || r.status === 'approved');
    const counts = {};
    reviews.forEach(r => {
        Array.from(new Set([String(r.productId||''), String(r.product||''), String(r.orderId||'')])).filter(k => k && k !== 'NaN' && k !== 'undefined')
            .forEach(key => {
                if (!counts[key]) counts[key] = { count: 0, totalRating: 0, ratings: [] };
                counts[key].count++; counts[key].totalRating += (r.rating || 5); counts[key].ratings.push(r.rating || 5);
            });
    });
    Object.values(counts).forEach(d => { d.avgRating = d.count > 0 ? (d.totalRating / d.count).toFixed(1) : '5.0'; });
    storeWriteData('tish_review_counts', counts);
    return counts;
}

function storeFindReviewRecord(reviewId, profileKeyHint = '') {
    const targetId = String(reviewId || '').trim();
    if (!targetId) return null;
    const tryProfile = (profileKey) => {
        const profile = storeReadData(profileKey, null);
        if (!profile || typeof profile !== 'object') return null;
        const list = Array.isArray(profile.reviews) ? profile.reviews : [];
        const idx = list.findIndex(r => String(r?.id || '') === targetId);
        if (idx === -1) return null;
        return { profileKey, profile, reviews: list, reviewIndex: idx, review: list[idx] };
    };
    if (profileKeyHint) { const r = tryProfile(profileKeyHint); if (r) return r; }
    for (const { key } of storeListAllUserProfiles()) { const r = tryProfile(key); if (r) return r; }
    return null;
}

function storePersistProfileRecord(profileKey, profile) {
    if (!profileKey || !profile) return false;
    const ok = storeWriteData(profileKey, profile);
    if (!ok) return false;
    const googleId = String(profile.googleId || '').trim();
    if (googleId) {
        const canonical = 'tish_profile_' + googleId;
        if (canonical !== profileKey) storeWriteData(canonical, profile);
        const active = storeReadData('tish_profile', null);
        if (active && String(active.googleId || '').trim() === googleId) storeWriteData('tish_profile', profile);
    }
    return true;
}

function storeGetAnalyticsEvents() {
    const events = storeReadData(STORE_ANALYTICS_KEY, []);
    return Array.isArray(events) ? events : [];
}

function storeWriteAnalyticsEvents(events) {
    const safe = Array.isArray(events) ? events.slice(0, STORE_ANALYTICS_MAX) : [];
    return storeWriteData(STORE_ANALYTICS_KEY, safe);
}

function storeAppendAnalyticsEvent(type, meta, session) {
    const safeType = String(type || '').trim().toLowerCase();
    if (!STORE_ANALYTICS_ALLOWED_TYPES.has(safeType)) return null;
    const event = { id: crypto.randomBytes(12).toString('hex'), type: safeType, meta: (meta && typeof meta === 'object' && !Array.isArray(meta)) ? meta : {}, ts: new Date().toISOString(), userGoogleId: String(session?.googleId || ''), userEmail: normalizeEmail(session?.email || '') };
    const events = storeGetAnalyticsEvents(); events.unshift(event);
    const ok = storeWriteAnalyticsEvents(events);
    return ok ? event : null;
}

const STORE_BACKUP_SCOPES = new Set(['products', 'chats', 'clients']);

function storeIsBackupScopeValid(scope) {
    return STORE_BACKUP_SCOPES.has(String(scope || '').toLowerCase());
}

function storeIsBackupKeyAllowed(scope, key) {
    const safeScope = String(scope || '').toLowerCase();
    const safeKey = sanitizeStoreKey(key);

    if (safeScope === 'products') {
        return [
            'tish_admin_products',
            'tish_tishara_shop_products',
            'tish_admin_nfts',
            'tish_admin_collections',
            'tish_admin_cases',
            'tish_review_counts'
        ].includes(safeKey);
    }

    if (safeScope === 'chats') {
        if (safeKey.startsWith('chat_')) return true;
        return [
            'tish_admin_notifications',
            'tish_admin_notifs',
            'tish_pinned_chats',
            'tish_archived_chats',
            'tish_admin_presence'
        ].includes(safeKey);
    }

    if (safeScope === 'clients') {
        if (safeKey.startsWith('tish_profile_')) return true;
        return ['tish_profile', 'tish_orders'].includes(safeKey);
    }

    return false;
}

function storeListBackupKeys(scope) {
    return storeListDataKeys().filter((key) => storeIsBackupKeyAllowed(scope, key));
}

function storeBuildBackup(scope) {
    const safeScope = String(scope || '').toLowerCase();
    const keys = storeListBackupKeys(safeScope);
    const data = {};

    keys.forEach((key) => {
        data[key] = storeReadData(key, null);
    });

    return {
        version: 1,
        scope: safeScope,
        createdAt: new Date().toISOString(),
        totalKeys: keys.length,
        data
    };
}

function storeImportBackup(scope, payload) {
    const safeScope = String(scope || '').toLowerCase();
    const source = (payload && typeof payload === 'object' && !Array.isArray(payload))
        ? (((payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) ? payload.data : payload))
        : null;

    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return { error: 'Invalid backup payload', total: 0, imported: 0, skipped: 0, failed: 0 };
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let profilesTouched = false;

    Object.entries(source).forEach(([key, value]) => {
        const safeKey = sanitizeStoreKey(key);
        if (!storeIsBackupKeyAllowed(safeScope, safeKey)) {
            skipped += 1;
            return;
        }

        const ok = storeWriteData(safeKey, value);
        if (ok) {
            imported += 1;
            if (safeKey === 'tish_profile' || safeKey.startsWith('tish_profile_')) {
                profilesTouched = true;
            }
        } else {
            failed += 1;
        }
    });

    if (profilesTouched) {
        try { storeUpdateReviewCounts(); } catch {}
    }

    return {
        total: Object.keys(source).length,
        imported,
        skipped,
        failed
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

app.use((req, res, next) => {
    if (req.path.startsWith('/api/store/') || req.path.startsWith('/tish-store/')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    next();
});

app.use('/api/store', (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const list = storeRateBuckets.get(ip) || [];
    const recent = list.filter(ts => now - ts < 60000);

    if (recent.length > 240) {
        return res.status(429).json({ success: false, error: 'Too many requests' });
    }

    recent.push(now);
    storeRateBuckets.set(ip, recent);
    next();
});

app.get('/', (req, res) => {
    res.redirect('/test_new/');
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
    const required = isMainAdminPasswordRequired();
    console.log(`🔐 check-auth: required=${required}`);
    res.json({ required });
});

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {};
    const required = isMainAdminPasswordRequired();

    if (!allowRootAdminLogin(req)) {
        return res.status(429).json({ success: false, error: 'Too many login attempts' });
    }

    if (!required) {
        const token = createRootAdminSession();
        console.log('✅ Login OK — no password required');
        return res.json({ success: true, token, expiresInMs: ROOT_ADMIN_SESSION_TTL_MS });
    }

    if (!password) {
        console.log('❌ No password provided');
        return res.status(401).json({ error: 'Password required' });
    }

    if (isMainAdminPasswordValid(password)) {
        const token = createRootAdminSession();
        console.log('✅ Login OK — password matched');
        return res.json({ success: true, token, expiresInMs: ROOT_ADMIN_SESSION_TTL_MS });
    }

    console.log('❌ Login FAILED — wrong password');
    return res.status(401).json({ error: 'Wrong password' });
});

// ═══════════════════════════════════════
// VALIDATE SESSION (НОВЫЙ — проверка актуальности пароля)
// ═══════════════════════════════════════
app.get('/api/admin/validate-session', (req, res) => {
    const required = isMainAdminPasswordRequired();
    const session = getRootAdminSession(req);

    // Если пароль не установлен — сессия всегда валидна
    if (!required) {
        return res.json({ valid: true, passwordRequired: false, authenticated: !!session });
    }

    return res.json({ valid: !!session, passwordRequired: true, authenticated: !!session });
});

app.post('/api/admin/logout', requireRootAdminAuth, (req, res) => {
    clearRootAdminSession(req);
    res.json({ success: true });
});

// Password management
app.post('/api/admin/password', requireRootAdminAuth, (req, res) => {
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
app.get('/api/admin/data', requireRootAdminAuth, (req, res) => {
    res.json(loadData());
});

// Save
app.post('/api/admin/data', requireRootAdminAuth, (req, res) => {
    const data = req.body;
    if (!data) return res.status(400).json({ error: 'No data' });
    if (saveData(data)) {
        res.json({ success: true, lastModified: data.settings?.lastModified });
    } else {
        res.status(500).json({ error: 'Save failed' });
    }
});

// Upload
app.post('/api/admin/upload', requireRootAdminAuth, (req, res) => {
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
app.get('/api/admin/activity', requireRootAdminAuth, (req, res) => {
    res.json(loadData().activity || []);
});

app.post('/api/admin/activity', requireRootAdminAuth, (req, res) => {
    const { text, type } = req.body;
    const data = loadData();
    if (!data.activity) data.activity = [];
    data.activity.unshift({ text: text || '', type: type || 'info', time: new Date().toISOString() });
    if (data.activity.length > 100) data.activity.length = 100;
    saveData(data);
    res.json({ success: true });
});

app.delete('/api/admin/activity', requireRootAdminAuth, (req, res) => {
    const data = loadData();
    data.activity = [];
    saveData(data);
    res.json({ success: true });
});

// Reset
app.post('/api/admin/reset', requireRootAdminAuth, (req, res) => {
    saveData(getDefaults()) ? res.json({ success: true }) : res.status(500).json({ error: 'Failed' });
});

// Import
app.post('/api/admin/import', requireRootAdminAuth, (req, res) => {
    const data = req.body;
    if (!data || !data.team || !data.works) return res.status(400).json({ error: 'Invalid' });
    const merged = deepMerge(getDefaults(), data);
    saveData(merged) ? res.json({ success: true }) : res.status(500).json({ error: 'Failed' });
});

// Stats
app.get('/api/admin/stats', requireRootAdminAuth, (req, res) => {
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

app.get('/api/analytics/stats', requireRootAdminAuth, (req, res) => {
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
app.delete('/api/analytics', requireRootAdminAuth, (req, res) => {
    saveAnalytics({ events: [] });
    res.json({ success: true });
});

// ═══════════════════════════════════════
// STORE AUTH (GOOGLE)
// ═══════════════════════════════════════
app.get('/api/store/auth/config', (req, res) => {
    res.json({
        success: true,
        enabled: !!STORE_GOOGLE_CLIENT_ID,
        clientId: STORE_GOOGLE_CLIENT_ID || '',
        allowedDomain: STORE_GOOGLE_ALLOWED_DOMAIN || ''
    });
});

app.get('/api/store/auth/session', (req, res) => {
    const session = storeGetSessionFromRequest(req);
    if (!session) {
        return res.json({ success: true, authenticated: false, admin: false, user: null });
    }

    res.json({
        success: true,
        authenticated: true,
        admin: session.role === 'admin',
        user: {
            email: normalizeEmail(session.email || ''),
            name: String(session.name || ''),
            googleId: String(session.googleId || ''),
            picture: ''
        },
        tokenExpiresAt: session.expiresAt
    });
});

app.post('/api/store/auth/google', async (req, res) => {
    const { credential } = req.body || {};

    if (!STORE_GOOGLE_CLIENT_ID) {
        return res.status(503).json({
            success: false,
            error: 'Google auth is not configured on server'
        });
    }

    if (!credential) {
        return res.status(400).json({ success: false, error: 'Missing credential' });
    }

    try {
        const googleUser = await storeVerifyGoogleCredential(credential);
        const session = storeCreateSession({
            role: 'user',
            googleId: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name
        });

        res.json({
            success: true,
            token: session.token,
            expiresAt: session.expiresAt,
            user: {
                email: googleUser.email,
                name: googleUser.name,
                googleId: googleUser.sub,
                picture: googleUser.picture || ''
            }
        });
    } catch (e) {
        res.status(401).json({ success: false, error: e.message || 'Invalid Google credential' });
    }
});

app.post('/api/store/auth/logout', (req, res) => {
    const token = storeReadAuthToken(req);
    if (token) storeSessions.delete(token);
    res.json({ success: true });
});

// ═══════════════════════════════════════
// STORE ADMIN AUTH (SERVER-SIDE)
// ═══════════════════════════════════════
app.get('/api/store/admin/check-auth', requireStoreAuth, (req, res) => {
    res.json({ required: isMainAdminPasswordRequired() });
});

app.get('/api/store/admin/validate-session', requireStoreAuth, (req, res) => {
    const required = isMainAdminPasswordRequired();
    const admin = req.authSession.role === 'admin';
    const valid = !required || admin;
    res.json({ success: true, valid, admin, passwordRequired: required });
});

app.post('/api/store/admin/login', requireStoreAuth, (req, res) => {
    const required = isMainAdminPasswordRequired();
    const { password } = req.body || {};

    if (!required) {
        patchStoreSession(req, { role: 'admin' });
        return res.json({ success: true, admin: true, role: 'admin' });
    }

    if (!password) {
        return res.status(401).json({ success: false, error: 'Password required' });
    }

    if (!isMainAdminPasswordValid(password)) {
        return res.status(401).json({ success: false, error: 'Wrong password' });
    }

    patchStoreSession(req, { role: 'admin' });
    res.json({ success: true, admin: true, role: 'admin' });
});

app.post('/api/store/admin/logout', requireStoreAuth, (req, res) => {
    patchStoreSession(req, { role: 'user' });
    res.json({ success: true, admin: false, role: 'user' });
});

// ═══════════════════════════════════════
// STORE API (UNIFIED BACKEND CONTOUR)
// ═══════════════════════════════════════
app.get('/api/store/health', (req, res) => {
    const session = storeGetSessionFromRequest(req);
    res.json({
        success: true,
        status: 'ok',
        time: new Date().toISOString(),
        dataKeys: storeListDataKeys().length,
        authenticated: !!session,
        role: session ? session.role : 'guest'
    });
});

function storeReadDataEndpoint(req, res) {
    const key = String(req.params.key || '');
    if (!storeCanAccessDataKey(req.authSession, key, 'read')) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const value = storeReadValueForSession(key, req.authSession);
    return res.json({ success: true, key: sanitizeStoreKey(key), value: value === undefined ? null : value });
}

function storeWriteDataEndpoint(req, res) {
    const key = String(req.params.key || '');
    const payload = req.body || {};
    const value = payload.value !== undefined ? payload.value : payload.data;

    if (value === undefined) {
        return res.status(400).json({ success: false, error: 'Missing value' });
    }

    if (!storeCanAccessDataKey(req.authSession, key, 'write')) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const ok = storeWriteValueForSession(key, value, req.authSession);
    return res.json({ success: !!ok, key: sanitizeStoreKey(key) });
}

function storeDeleteDataEndpoint(req, res) {
    const key = String(req.params.key || '');
    if (!storeCanAccessDataKey(req.authSession, key, 'delete')) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const ok = storeDeleteData(key);
    if (ok && (key === 'tish_profile' || key.startsWith('tish_profile_'))) {
        try { storeUpdateReviewCounts(); } catch {}
    }
    return res.json({ success: !!ok, key: sanitizeStoreKey(key) });
}

app.get('/api/store/data/:key', attachOptionalStoreAuth, storeReadDataEndpoint);
app.post('/api/store/data/:key', requireStoreAuth, storeWriteDataEndpoint);
app.delete('/api/store/data/:key', requireStoreAuth, storeDeleteDataEndpoint);

app.get('/api/store/data', attachOptionalStoreAuth, (req, res) => {
    const keys = storeListDataKeys().filter((key) => storeCanAccessDataKey(req.authSession, key, 'read'));
    res.json({ success: true, keys });
});

app.post('/api/store/sync', requireStoreAuth, (req, res) => {
    const { data } = req.body || {};
    if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, error: 'Missing data object' });
    }

    let saved = 0;
    let errors = 0;
    let denied = 0;

    Object.entries(data).forEach(([key, value]) => {
        if (!storeCanAccessDataKey(req.authSession, key, 'write')) {
            denied += 1;
            return;
        }
        if (storeWriteValueForSession(key, value, req.authSession)) saved += 1;
        else errors += 1;
    });

    res.json({ success: true, saved, errors, denied });
});

app.get('/api/store/sync', requireStoreAuth, (req, res) => {
    const data = {};
    const keys = storeListDataKeys().filter((key) => storeCanAccessDataKey(req.authSession, key, 'read'));
    keys.forEach((key) => {
        const value = storeReadValueForSession(key, req.authSession);
        if (value !== null) data[key] = value;
    });
    res.json({ success: true, data, keys });
});

app.get('/api/store/profile', requireStoreAuth, (req, res) => {
    const profile = storeReadValueForSession('tish_profile', req.authSession) || {};
    res.json({ success: true, profile });
});

app.post('/api/store/profile', requireStoreAuth, (req, res) => {
    const { profile } = req.body || {};
    if (!profile || typeof profile !== 'object') {
        return res.status(400).json({ success: false, error: 'Missing profile' });
    }
    const ok = storeWriteValueForSession('tish_profile', profile, req.authSession);
    res.json({ success: !!ok });
});

app.get('/api/store/reviews', requireStoreAuth, (req, res) => {
    const profile = storeReadValueForSession('tish_profile', req.authSession) || {};
    const allReviews = req.authSession.role === 'admin'
        ? storeCollectAllReviews()
        : (Array.isArray(profile.reviews) ? profile.reviews : []);
    const status = req.query.status;
    const filtered = status ? allReviews.filter(r => String(r?.status || '') === status) : allReviews;
    res.json({ success: true, reviews: filtered, total: allReviews.length });
});

app.post('/api/store/reviews/:id/status', requireStoreAdminToken, (req, res) => {
    const reviewId = String(req.params.id || '').trim();
    const { status, rejectReason, rejectComment, profileKey } = req.body || {};

    if (!['pending_moderation', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const record = storeFindReviewRecord(reviewId, profileKey);
    if (!record) {
        return res.status(404).json({ success: false, error: 'Review not found' });
    }

    record.review.status = status;
    if (status === 'rejected') {
        record.review.rejectReason = rejectReason || 'other';
        record.review.rejectComment = rejectComment || '';
    } else {
        delete record.review.rejectReason;
        delete record.review.rejectComment;
    }

    const saved = storePersistProfileRecord(record.profileKey, record.profile);
    if (!saved) {
        return res.status(500).json({ success: false, error: 'Failed to save review' });
    }

    storeUpdateReviewCounts();
    res.json({ success: true, review: { ...record.review, profileKey: record.profileKey } });
});

app.delete('/api/store/reviews/:id', requireStoreAdminToken, (req, res) => {
    const reviewId = String(req.params.id || '').trim();
    const profileKeyHint = String(req.query.profileKey || '').trim();

    const record = storeFindReviewRecord(reviewId, profileKeyHint);
    if (!record) {
        return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const before = record.reviews.length;
    record.profile.reviews = record.reviews.filter((r) => String(r?.id || '') !== reviewId);
    const after = Array.isArray(record.profile.reviews) ? record.profile.reviews.length : 0;

    const saved = storePersistProfileRecord(record.profileKey, record.profile);
    if (!saved) {
        return res.status(500).json({ success: false, error: 'Failed to delete review' });
    }

    storeUpdateReviewCounts();
    res.json({ success: true, deleted: before !== after });
});

app.get('/api/store/review-counts', requireStoreAuth, (req, res) => {
    const counts = storeReadData('tish_review_counts', {}) || {};
    res.json({ success: true, counts });
});

app.get('/api/store/orders', requireStoreAuth, (req, res) => {
    const orders = storeFilterOrdersForSession(storeReadData('tish_orders', []) || [], req.authSession);
    res.json({ success: true, orders });
});

app.post('/api/store/orders', requireStoreAuth, (req, res) => {
    const { orders } = req.body || {};
    if (!Array.isArray(orders)) {
        return res.status(400).json({ success: false, error: 'Missing orders' });
    }
    const ok = storeWriteValueForSession('tish_orders', orders, req.authSession);
    res.json({ success: !!ok });
});

app.post('/api/store/orders/:id/status', requireStoreAdminToken, (req, res) => {
    const orderId = String(req.params.id);
    const { status } = req.body || {};

    const orders = storeReadData('tish_orders', []) || [];
    const order = orders.find(o => String(o.id) === orderId);
    if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = status;
    if (status === 'completed') order.completedAt = new Date().toISOString();
    if (status === 'prepaid') {
        order.prepaidAt = new Date().toISOString();
        order.chatId = order.chatId || `chat_${order.id}`;
    }

    storeWriteData('tish_orders', orders);
    res.json({ success: true, order });
});

app.get('/api/store/chat/:chatId', requireStoreAuth, (req, res) => {
    if (!storeCanAccessChatId(req.params.chatId, req.authSession)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const chatId = sanitizeStoreKey(`chat_${req.params.chatId}`);
    const messages = storeReadData(chatId, []) || [];
    const selected = storeSelectChatMessages(messages, req.query.since, req.query.limit);
    res.json({ success: true, chatId: req.params.chatId, messages: selected.messages, incremental: selected.incremental, lastToken: selected.lastToken, total: selected.total });
});

app.post('/api/store/chat/:chatId', requireStoreAuth, (req, res) => {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
        return res.status(400).json({ success: false, error: 'Missing messages' });
    }

    if (!storeCanAccessChatId(req.params.chatId, req.authSession)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const chatId = sanitizeStoreKey(`chat_${req.params.chatId}`);
    storeWriteChatMerged(chatId, messages);
    res.json({ success: true, chatId: req.params.chatId });
});

app.post('/api/store/chat/:chatId/message', requireStoreAuth, (req, res) => {
    const message = req.body || null;
    if (!message || typeof message !== 'object') {
        return res.status(400).json({ success: false, error: 'Missing message' });
    }

    if (!storeCanAccessChatId(req.params.chatId, req.authSession)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const chatKey = sanitizeStoreKey(`chat_${req.params.chatId}`);
    const messageId = storeAppendChatMessage(chatKey, message);
    if (!messageId) {
        return res.status(500).json({ success: false, error: 'Failed to append message' });
    }

    res.json({ success: true, chatId: req.params.chatId, messageId });
});

app.get('/api/store/admin/log', requireStoreAdminToken, (req, res) => {
    const log = storeReadData('tish_admin_log', []) || [];
    res.json({ success: true, log });
});

app.post('/api/store/admin/log', requireStoreAdminToken, (req, res) => {
    const { action, details } = req.body || {};
    const log = storeReadData('tish_admin_log', []) || [];

    log.unshift({
        id: Date.now(),
        action: action || 'Unknown',
        details: details || '',
        date: new Date().toISOString()
    });

    if (log.length > 200) log.length = 200;
    storeWriteData('tish_admin_log', log);
    res.json({ success: true });
});

app.get('/api/store/nfts', requireStoreAuth, (req, res) => {
    const nfts = storeReadData('tish_admin_nfts', []) || [];
    res.json({ success: true, nfts });
});

app.post('/api/store/nfts', requireStoreAdminToken, (req, res) => {
    const { nfts } = req.body || {};
    storeWriteData('tish_admin_nfts', Array.isArray(nfts) ? nfts : []);
    res.json({ success: true });
});

app.post('/api/store/analytics/track', requireStoreAuth, (req, res) => {
    const { type, meta } = req.body || {};
    const event = storeAppendAnalyticsEvent(type, meta, req.authSession);
    if (!event) {
        return res.status(400).json({ success: false, error: 'Invalid analytics event' });
    }
    res.json({ success: true, event });
});

app.get('/api/store/admin/analytics/events', requireStoreAdminToken, (req, res) => {
    const limitRaw = Number(req.query.limit || 5000);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(20000, Math.floor(limitRaw))) : 5000;
    const all = storeGetAnalyticsEvents();
    res.json({ success: true, events: all.slice(0, limit), total: all.length });
});

app.delete('/api/store/admin/analytics/events', requireStoreAdminToken, (req, res) => {
    const ok = storeWriteAnalyticsEvents([]);
    res.json({ success: !!ok });
});

app.get('/api/store/admin/storage', requireStoreAdminToken, (req, res) => {
    const storage = storeGetUploadStorageSummary();
    const files = storeGetUploadDiskEntries();
    const meta = storeGetUploadMetaMap();
    const merged = files.map((f) => ({ ...f, ...(meta[f.filename] || {}) }));
    res.json({ success: true, storage, files: merged, history: [] });
});

app.get('/api/store/admin/backup/:scope', requireStoreAdminToken, (req, res) => {
    const scope = String(req.params.scope || '').toLowerCase();
    if (!storeIsBackupScopeValid(scope)) {
        return res.status(400).json({ success: false, error: 'Invalid backup scope' });
    }

    const backup = storeBuildBackup(scope);
    res.json({ success: true, scope, backup });
});

app.post('/api/store/admin/backup/:scope', requireStoreAdminToken, (req, res) => {
    const scope = String(req.params.scope || '').toLowerCase();
    if (!storeIsBackupScopeValid(scope)) {
        return res.status(400).json({ success: false, error: 'Invalid backup scope' });
    }

    const payload = (req.body && Object.prototype.hasOwnProperty.call(req.body, 'backup'))
        ? req.body.backup
        : ((req.body && Object.prototype.hasOwnProperty.call(req.body, 'data')) ? req.body.data : req.body);

    const result = storeImportBackup(scope, payload);
    if (result.error) {
        return res.status(400).json({ success: false, error: result.error, result });
    }

    res.json({ success: result.failed === 0, scope, result });
});

app.get('/api/store/admin/support-chats', requireStoreAdminToken, (req, res) => {
    const keys = storeListDataKeys();
    const chats = [];

    const messageToken = (msg, index = 0) => {
        if (!msg || typeof msg !== 'object') return index;
        const dateTs = Date.parse(msg.date || msg.createdAt || msg.transferAt || '');
        if (Number.isFinite(dateTs) && dateTs > 0) return dateTs;
        const idNum = Number(msg.id);
        if (Number.isFinite(idNum) && idNum > 0) return idNum;
        const time = String(msg.time || '').trim();
        const m = /^(\d{1,2}):(\d{2})$/.exec(time);
        if (m) {
            const d = new Date();
            d.setHours(Number(m[1]), Number(m[2]), 0, 0);
            return d.getTime();
        }
        return index;
    };

    keys.forEach((key) => {
        if (!key.startsWith('chat_support')) return;
        const msgs = storeReadData(key, []);
        if (!Array.isArray(msgs)) return;

        const chatId = key.replace('chat_', '');
        let googleId = '';
        let userName = 'Пользователь';
        let userAvatar = '';
        let profile = null;

        if (chatId.startsWith('support_')) {
            googleId = chatId.replace('support_', '');
            profile = storeReadData('tish_profile_' + googleId, null);
            if (!profile) {
                const activeProfile = storeReadData('tish_profile', null);
                if (activeProfile && String(activeProfile.googleId || '') === googleId) {
                    profile = activeProfile;
                }
            }
            const profileName = profile
                ? String(profile.username || profile.name || profile.email || '').trim()
                : '';
            if (profileName) userName = profileName;
            const profileAvatar = profile
                ? String(profile.avatar || profile.avatarUrl || '').trim()
                : '';
            if (profileAvatar) userAvatar = profileAvatar;
        }

        const visibleMsgs = msgs.filter((m) => m && !m.deleted);
        const last = visibleMsgs.length ? visibleMsgs[visibleMsgs.length - 1] : null;
        const lastAt = messageToken(last, visibleMsgs.length);
        const lastUserMsg = [...visibleMsgs].reverse().find((m) => m && m.from === 'user');

        if (userName === 'Пользователь') {
            const userFromMessage = String(lastUserMsg?.user || lastUserMsg?.userName || lastUserMsg?.username || '').trim();
            if (userFromMessage) userName = userFromMessage;
        }

        if (!userAvatar) {
            const avatarFromMessage = String(lastUserMsg?.avatar || lastUserMsg?.avatarUrl || lastUserMsg?.userAvatar || '').trim();
            if (avatarFromMessage) userAvatar = avatarFromMessage;
        }

        chats.push({
            chatId,
            googleId,
            userName,
            userAvatar,
            lastMessage: last ? String(last.text || '').slice(0, 60) : '',
            lastTime: last ? String(last.time || '') : '',
            lastAt,
            unread: visibleMsgs.filter((m) => m.from === 'user' && !m.read).length,
            messageCount: visibleMsgs.length
        });
    });

    chats.sort((a, b) => {
        const byLastAt = Number(b.lastAt || 0) - Number(a.lastAt || 0);
        if (byLastAt !== 0) return byLastAt;
        return Number(b.messageCount || 0) - Number(a.messageCount || 0);
    });

    res.json({ success: true, chats });
});

app.get('/api/store/admin/users', requireStoreAdminToken, (req, res) => {
    const usersMap = new Map();

    const upsertUser = (profile = {}, keyHint = '') => {
        const googleId = String(profile.googleId || (keyHint.startsWith('tish_profile_') ? keyHint.replace('tish_profile_', '') : '')).trim();
        if (!googleId) return;

        const prev = usersMap.get(googleId) || {};
        usersMap.set(googleId, {
            key: keyHint || prev.key || ('tish_profile_' + googleId),
            googleId,
            name: profile.name || profile.username || prev.name || 'Unknown',
            email: profile.email || prev.email || '',
            avatar: profile.avatar || prev.avatar || null,
            joinDate: profile.joinDate || prev.joinDate || null,
            level: Number(profile.level || prev.level || 1) || 1,
            balance: Number(profile.balance || prev.balance || 0) || 0,
            blocked: profile.blocked !== undefined ? !!profile.blocked : !!prev.blocked,
            muted: profile.muted !== undefined ? !!profile.muted : !!prev.muted,
            restricted: profile.restricted !== undefined ? !!profile.restricted : !!prev.restricted,
            blockReason: profile.blockReason || prev.blockReason || '',
            orders: Number(prev.orders || 0) || 0
        });
    };

    storeListAllUserProfiles().forEach(({ key, profile }) => upsertUser(profile, key));

    storeListDataKeys().forEach((key) => {
        if (!key.startsWith('chat_support_')) return;
        const googleId = key.replace('chat_support_', '');
        if (!googleId) return;
        if (!usersMap.has(googleId)) {
            upsertUser({ googleId, name: 'Пользователь' }, 'tish_profile_' + googleId);
        }
    });

    const users = Array.from(usersMap.values());
    const orders = storeReadData('tish_orders', []) || [];
    users.forEach((u) => {
        u.orders = orders.filter((o) => String(o.userId || '') === String(u.googleId || '') || normalizeEmail(o.userEmail || '') === normalizeEmail(u.email || '')).length;
    });

    res.json({ success: true, users });
});

app.post('/api/store/admin/users/:googleId/status', requireStoreAdminToken, (req, res) => {
    const googleId = String(req.params.googleId || '').trim();
    if (!googleId) return res.status(400).json({ success: false, error: 'Invalid user id' });

    const { blocked, muted, restricted, blockReason } = req.body || {};
    const key = 'tish_profile_' + googleId;
    const profile = storeReadData(key, {}) || {};

    profile.googleId = googleId;
    if (blocked !== undefined) profile.blocked = !!blocked;
    if (muted !== undefined) profile.muted = !!muted;
    if (restricted !== undefined) profile.restricted = !!restricted;
    if (blockReason !== undefined) profile.blockReason = String(blockReason || '');

    const ok = storePersistProfileRecord(key, profile);
    res.json({ success: !!ok });
});

function storeFinalizeUploadMeta(savedFiles, session) {
    const meta = storeGetUploadMetaMap();
    const nowIso = new Date().toISOString();

    savedFiles.forEach((item) => {
        if (!item || !item.filename) return;
        meta[item.filename] = {
            originalName: String(item.name || item.filename),
            mimeType: String(item.mimeType || storeInferMimeType(item.filename)),
            size: Number(item.size || 0) || 0,
            ownerRole: String(session.role || ''),
            ownerGoogleId: String(session.googleId || ''),
            ownerEmail: normalizeEmail(session.email || ''),
            createdAt: nowIso
        };
    });

    storeSetUploadMetaMap(meta);
}

app.post('/api/store/upload', requireStoreAdminToken, (req, res) => {
    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('multipart/form-data')) {
        const parseUpload = storeCreateUploadParser();
        return parseUpload(req, res, (err) => {
            if (err) {
                const msg = err.code === 'UNSUPPORTED_FILE_TYPE' ? 'Unsupported file type' : 'Upload failed';
                return res.status(400).json({ success: false, error: msg });
            }

            const uploaded = Array.isArray(req.files) ? req.files : [];
            if (!uploaded.length) {
                return res.status(400).json({ success: false, error: 'No files provided' });
            }

            const files = uploaded.map((file) => ({
                url: `/uploads/store/${file.filename}`,
                name: String(file.originalname || file.filename),
                type: String(file.mimetype || '').startsWith('video/') ? 'video' : 'image',
                size: Number(file.size || 0) || 0,
                filename: String(file.filename || ''),
                mimeType: String(file.mimetype || storeInferMimeType(file.filename))
            }));

            storeFinalizeUploadMeta(files, req.authSession);
            return res.json({ success: true, files });
        });
    }

    const payload = req.body || {};
    const files = Array.isArray(payload.files) ? payload.files : (payload.image ? [payload] : []);

    if (!files.length) {
        return res.status(400).json({ success: false, error: 'No files provided' });
    }

    const saved = [];
    files.forEach((file, idx) => {
        const image = file.image;
        if (typeof image !== 'string') return;

        const matches = image.match(/^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (!matches) return;

        const kind = matches[1] === 'video' ? 'video' : 'image';
        const extRaw = String(matches[2] || '').toLowerCase();
        const ext = extRaw === 'jpeg'
            ? 'jpg'
            : (extRaw === 'quicktime' ? 'mov' : extRaw.replace(/[^a-z0-9]/g, '') || 'bin');
        const dotExt = '.' + ext;
        if (!STORE_UPLOAD_ALLOWED_EXTS.has(dotExt)) return;

        const safeName = String(file.filename || `store_file_${Date.now()}_${idx}`)
            .replace(/[^a-zA-Z0-9_-]/g, '_');
        const finalName = `${safeName}_${Date.now()}_${idx}${dotExt}`;
        const filePath = path.join(STORE_UPLOADS_DIR, finalName);

        try {
            fs.writeFileSync(filePath, matches[3], 'base64');
            saved.push({
                url: `/uploads/store/${finalName}`,
                name: file.filename || finalName,
                type: kind,
                size: Number(file.size || 0) || 0,
                filename: finalName,
                mimeType: storeInferMimeType(finalName)
            });
        } catch (e) {
            console.error('[store] upload write error:', e.message);
        }
    });

    if (!saved.length) {
        return res.status(400).json({ success: false, error: 'Invalid upload payload' });
    }

    storeFinalizeUploadMeta(saved, req.authSession);

    res.json({ success: true, files: saved });
});

app.delete('/api/store/upload/:filename', requireStoreAuth, (req, res) => {
    const safeFilename = storeNormalizeUploadFilename(req.params.filename);
    if (!safeFilename) {
        return res.status(400).json({ success: false, error: 'Invalid filename' });
    }

    const metaMap = storeGetUploadMetaMap();
    const meta = metaMap[safeFilename] || null;
    if (!storeCanDeleteUpload(req.authSession, meta)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const filePath = path.join(STORE_UPLOADS_DIR, safeFilename);
    let deleted = false;
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deleted = true;
        }
    } catch (e) {
        return res.status(500).json({ success: false, error: 'Delete failed' });
    }

    if (metaMap[safeFilename]) {
        delete metaMap[safeFilename];
        storeSetUploadMetaMap(metaMap);
    }

    res.json({ success: true, deleted, filename: safeFilename });
});

// Force reset password (protected, explicit action)
app.post('/api/admin/force-reset-password', requireRootAdminAuth, (req, res) => {
    const data = loadData();
    data.settings.password = '098tish123';
    saveData(data);
    console.log('🔐 PASSWORD FORCE SET via URL');
    res.json({ success: true, message: 'Password set to 098tish123 for admin panel.' });
});

app.get('/store', (req, res) => {
    res.redirect('/tish-store/');
});

app.get('/tish-store', (req, res) => {
    res.redirect('/tish-store/');
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
function collectFilesRecursive(dirPath) {
    const files = [];
    if (!fs.existsSync(dirPath)) return files;
    const stack = [dirPath];

    while (stack.length) {
        const current = stack.pop();
        let entries = [];
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch {
            continue;
        }

        entries.forEach((entry) => {
            const absPath = path.join(current, entry.name);
            if (entry.isDirectory()) stack.push(absPath);
            else if (entry.isFile()) files.push(absPath);
        });
    }

    return files;
}

function copyFileIfMissing(srcPath, dstPath) {
    try {
        if (fs.existsSync(dstPath)) return false;
        fs.mkdirSync(path.dirname(dstPath), { recursive: true });
        fs.copyFileSync(srcPath, dstPath);
        return true;
    } catch (e) {
        console.warn(`⚠️  Legacy copy failed: ${srcPath} -> ${dstPath} (${e.message})`);
        return false;
    }
}

function migrateLegacyStoreData() {
    const legacyDataDir = path.join(STORE_DIR, 'data');
    const legacyUploadsDir = path.join(STORE_DIR, 'uploads');

    let migratedData = 0;
    let migratedUploads = 0;

    if (fs.existsSync(legacyDataDir)) {
        collectFilesRecursive(legacyDataDir)
            .filter((filePath) => filePath.toLowerCase().endsWith('.json'))
            .forEach((srcPath) => {
                const relPath = path.relative(legacyDataDir, srcPath);
                const dstPath = path.join(STORE_DATA_DIR, relPath);
                if (copyFileIfMissing(srcPath, dstPath)) migratedData += 1;
            });
    }

    if (fs.existsSync(legacyUploadsDir)) {
        collectFilesRecursive(legacyUploadsDir)
            .forEach((srcPath) => {
                const relPath = path.relative(legacyUploadsDir, srcPath);
                const dstPath = path.join(STORE_UPLOADS_DIR, relPath);
                if (copyFileIfMissing(srcPath, dstPath)) migratedUploads += 1;
            });
    }

    if (migratedData || migratedUploads) {
        console.log(`🔄 Legacy store migration: data files ${migratedData}, upload files ${migratedUploads}`);
    }
}

function startupMigration() {
    console.log('🔄 Running startup migration...');
    migrateLegacyStoreData();
    const data = loadData();
    const pw = (data.settings?.password || '').trim();

    if (pw === 'tish2024') {
        console.log('🔄 Found old default password — replacing with new default');
        data.settings.password = '098tish123';
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

// Очистка просроченных store-сессий и rate-limit bucket
setInterval(() => {
    const now = Date.now();

    storeSessions.forEach((session, sid) => {
        if (!session || session.expiresAt <= now) {
            storeSessions.delete(sid);
        }
    });

    storeRateBuckets.forEach((timestamps, ip) => {
        const recent = (timestamps || []).filter(ts => now - ts < 60000);
        if (!recent.length) storeRateBuckets.delete(ip);
        else storeRateBuckets.set(ip, recent);
    });
}, 60000);

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
    console.log(`🛍   Store dir: ${STORE_DIR}`);
    console.log(`🛍   Store data: ${STORE_DATA_DIR}`);
    console.log(`🛍   Store uploads: ${STORE_UPLOADS_DIR}`);
    console.log(`🔐  Store Google auth: ${STORE_GOOGLE_CLIENT_ID ? 'ENABLED' : 'DISABLED (set STORE_GOOGLE_CLIENT_ID)'}`);
    console.log('🟣 ═══════════════════════════════════');
    console.log('');
});