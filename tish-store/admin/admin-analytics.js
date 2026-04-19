/* =====================================================
   TISH STORE — ADMIN ANALYTICS (admin-analytics.js)
   100% REAL DATA — only tracks actual user actions
   ===================================================== */

((Admin) => {

    const ANALYTICS_KEY = 'tish_analytics_events';
    const REFRESH_INTERVAL = 5000;
    let currentPeriod = 7;
    let refreshTimer = null;
    let stylesInjected = false;

    // ──── SVG ICONS (no emoji) ────
    const IC = {
        revenue:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        orders:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
        users:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        target:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        trending:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
        chart:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        funnel:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
        download:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        refresh:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
        eye:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        cart:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
        star:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        activity:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        clock:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        pie:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
        arrowUp:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
        arrowDown:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
        pkg:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        shield:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        empty:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>',
        check:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        heart:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        search:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    };

    // ════════════════════════════════════════
    //  REAL EVENT STORAGE — NO FAKES
    // ════════════════════════════════════════

    function getEvents() {
        return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    }

    function saveEvents(events) {
        // Лимит 5000 событий
        if (events.length > 5000) events.length = 5000;
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
    }

    /**
     * Записать РЕАЛЬНОЕ событие.
     * Вызывать из app.js, catalog.js, cart.js когда пользователь
     * РЕАЛЬНО совершает действие.
     *
     * Типы: 'visit', 'page_view', 'product_view', 'search',
     *       'cart_add', 'cart_remove', 'purchase', 'favorite',
     *       'review', 'referral'
     */
    function track(type, meta = {}) {
        const events = getEvents();
        const event = {
            type,
            meta,
            ts: new Date().toISOString()
        };
        events.unshift(event);
        saveEvents(events);

        // Пишем в общий серверный поток, чтобы все админ-аккаунты видели одну аналитику.
        const hasApiToken = !!localStorage.getItem('tish_api_token');
        if (hasApiToken) {
            fetch('/api/store/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, meta })
            }).catch(() => {});
        }
    }

    // ──── Агрегация по дням ────

    function getToday() {
        return new Date().toISOString().split('T')[0];
    }

    function getDayKey(date) {
        return new Date(date).toISOString().split('T')[0];
    }

    /**
     * Получить статистику за N дней.
     * Возвращает массив объектов { date, label, dayName, visits, views, carts, purchases, revenue, favorites, searches }
     * Всё считается из РЕАЛЬНЫХ событий.
     */
    function aggregateDays(numDays) {
        const events = getEvents();
        const now = new Date();
        const days = [];

        // Создаём пустые дни
        for (let i = numDays - 1; i >= 0; i--) {
            const dt = new Date(now);
            dt.setDate(dt.getDate() - i);
            const key = dt.toISOString().split('T')[0];
            days.push({
                date: key,
                label: `${dt.getDate()}.${String(dt.getMonth() + 1).padStart(2, '0')}`,
                dayName: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dt.getDay()],
                visits: 0,
                views: 0,
                carts: 0,
                purchases: 0,
                revenue: 0,
                favorites: 0,
                searches: 0
            });
        }

        // Дата начала периода
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - numDays + 1);
        startDate.setHours(0, 0, 0, 0);

        // Считаем реальные события
        events.forEach(ev => {
            const evDate = new Date(ev.ts);
            if (evDate < startDate) return;

            const key = getDayKey(ev.ts);
            const day = days.find(d => d.date === key);
            if (!day) return;

            switch (ev.type) {
                case 'visit':        day.visits++; break;
                case 'page_view':    day.views++; break;
                case 'product_view': day.views++; break;
                case 'cart_add':     day.carts++; break;
                case 'purchase':     day.purchases++; day.revenue += (ev.meta.amount || 0); break;
                case 'favorite':     day.favorites++; break;
                case 'search':       day.searches++; break;
            }
        });

        return days;
    }

    /**
     * Получить общие итоги за период
     */
    function getTotals(days) {
        return {
            visits:    days.reduce((s, d) => s + d.visits, 0),
            views:     days.reduce((s, d) => s + d.views, 0),
            carts:     days.reduce((s, d) => s + d.carts, 0),
            purchases: days.reduce((s, d) => s + d.purchases, 0),
            revenue:   days.reduce((s, d) => s + d.revenue, 0),
            favorites: days.reduce((s, d) => s + d.favorites, 0),
            searches:  days.reduce((s, d) => s + d.searches, 0)
        };
    }

    /**
     * Получить последние N реальных событий для ленты
     */
    function getRecentEvents(limit = 30) {
        return getEvents().slice(0, limit);
    }

    /**
     * Описание события для ленты
     */
    function eventLabel(ev) {
        const m = ev.meta || {};
        switch (ev.type) {
            case 'visit':        return 'Посещение сайта';
            case 'page_view':    return `Просмотр: ${m.page || 'страница'}`;
            case 'product_view': return `Просмотр товара: ${m.name || 'товар'}`;
            case 'search':       return `Поиск: "${m.query || '...'}"`;
            case 'cart_add':     return `В корзину: ${m.name || 'товар'}`;
            case 'cart_remove':  return `Убрано из корзины: ${m.name || 'товар'}`;
            case 'purchase':     return `Покупка: ${m.name || 'товар'} — $${m.amount || 0}`;
            case 'favorite':     return `${m.action === 'remove' ? 'Убрано из' : 'Добавлено в'} избранное: ${m.name || 'товар'}`;
            case 'review':       return `Отзыв: ${m.name || 'товар'} (${m.rating || 5}★)`;
            case 'referral':     return `Реферал: ${m.action || 'событие'}`;
            default:             return ev.type;
        }
    }

    function eventDotClass(type) {
        const map = {
            'visit': 'visit', 'page_view': 'view', 'product_view': 'view',
            'cart_add': 'cart', 'purchase': 'purchase', 'favorite': 'favorite',
            'review': 'review', 'search': 'search'
        };
        return map[type] || 'default';
    }

    function timeAgo(ts) {
        const diff = Date.now() - new Date(ts).getTime();
        const sec = Math.floor(diff / 1000);
        if (sec < 10) return 'только что';
        if (sec < 60) return `${sec} сек назад`;
        const m = Math.floor(sec / 60);
        if (m < 60) return `${m} мин назад`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h} ч назад`;
        const d = Math.floor(h / 24);
        return `${d} д назад`;
    }

    // ──── Стили ────

    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;
        const style = document.createElement('style');
        style.id = 'adminAnalyticsCSS';
        style.textContent = `
.aa{font-family:var(--font-mono),system-ui,sans-serif}
.aa__head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:28px}
.aa__head-left{display:flex;align-items:center;gap:14px}
.aa__head-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#8b5cf6,#a78bfa);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(139,92,246,.25)}
.aa__head-icon svg{width:24px;height:24px;stroke:#fff}
.aa__title{font-size:1.35rem;font-weight:800;letter-spacing:-.02em}
.aa__subtitle{font-size:.78rem;color:var(--color-muted,#94a3b8);margin-top:2px}
.aa__head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.aa__period{display:flex;background:rgba(139,92,246,.06);border-radius:10px;overflow:hidden;border:1px solid rgba(139,92,246,.1)}
.aa__period-btn{padding:7px 16px;font-size:.78rem;font-weight:600;background:none;border:none;cursor:pointer;color:var(--color-muted,#94a3b8);transition:.25s}
.aa__period-btn.active{background:linear-gradient(135deg,#8b5cf6,#a78bfa);color:#fff;box-shadow:0 2px 10px rgba(139,92,246,.3)}
.aa__period-btn:hover:not(.active){color:#8b5cf6}
.aa__live{display:flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:#22c55e;text-transform:uppercase;letter-spacing:.06em}
.aa__live-dot{position:relative;width:8px;height:8px;background:#22c55e;border-radius:50%}
.aa__live-dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;background:#22c55e;opacity:.4;animation:aaPulse 1.5s ease-in-out infinite}
@keyframes aaPulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.8);opacity:0}}

/* KPI */
.aa__kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
@media(max-width:1100px){.aa__kpi{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.aa__kpi{grid-template-columns:1fr}}
.aa__kpi-card{background:var(--color-bg-elevated,#fff);border:1px solid var(--color-border-soft,#e5e7eb);border-radius:16px;padding:20px 22px;position:relative;overflow:hidden;transition:.35s}
.aa__kpi-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.08)}
.aa__kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}
.aa__kpi-card--purple::before{background:linear-gradient(90deg,#8b5cf6,#a78bfa)}
.aa__kpi-card--pink::before{background:linear-gradient(90deg,#ec4899,#f472b6)}
.aa__kpi-card--cyan::before{background:linear-gradient(90deg,#06b6d4,#22d3ee)}
.aa__kpi-card--amber::before{background:linear-gradient(90deg,#f59e0b,#fbbf24)}
.aa__kpi-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
.aa__kpi-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.aa__kpi-icon svg{width:20px;height:20px}
.aa__kpi-icon--purple{background:rgba(139,92,246,.1)}.aa__kpi-icon--purple svg{stroke:#8b5cf6}
.aa__kpi-icon--pink{background:rgba(236,72,153,.1)}.aa__kpi-icon--pink svg{stroke:#ec4899}
.aa__kpi-icon--cyan{background:rgba(6,182,212,.1)}.aa__kpi-icon--cyan svg{stroke:#06b6d4}
.aa__kpi-icon--amber{background:rgba(245,158,11,.1)}.aa__kpi-icon--amber svg{stroke:#f59e0b}
.aa__kpi-change{font-size:.72rem;font-weight:700;padding:3px 8px;border-radius:8px;display:inline-flex;align-items:center;gap:3px}
.aa__kpi-change svg{width:14px;height:14px}
.aa__kpi-change--up{color:#22c55e;background:rgba(34,197,94,.1)}
.aa__kpi-change--down{color:#ef4444;background:rgba(239,68,68,.1)}
.aa__kpi-change--zero{color:#94a3b8;background:rgba(148,163,184,.08)}
.aa__kpi-value{font-size:1.65rem;font-weight:800;letter-spacing:-.03em;margin-bottom:2px}
.aa__kpi-label{font-size:.78rem;color:var(--color-muted,#94a3b8)}
.aa__kpi-sub{font-size:.72rem;color:var(--color-muted,#94a3b8);margin-top:4px;opacity:.7}
.aa__kpi-spark{display:flex;align-items:flex-end;gap:2px;height:28px;margin-top:8px}
.aa__kpi-spark-bar{flex:1;min-width:3px;border-radius:2px 2px 0 0;transition:height .5s ease;opacity:.2}
.aa__kpi-spark-bar:last-child{opacity:.6}

/* Grid & Cards */
.aa__grid{display:grid;gap:20px;margin-bottom:24px}
.aa__grid--2{grid-template-columns:1.6fr 1fr}
.aa__grid--2eq{grid-template-columns:1fr 1fr}
@media(max-width:900px){.aa__grid--2,.aa__grid--2eq{grid-template-columns:1fr}}
.aa__card{background:var(--color-bg-elevated,#fff);border:1px solid var(--color-border-soft,#e5e7eb);border-radius:16px;padding:22px 24px;transition:.35s;position:relative;overflow:hidden}
.aa__card:hover{box-shadow:0 8px 32px rgba(0,0,0,.06)}
.aa__card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.aa__card-title{display:flex;align-items:center;gap:10px;font-size:.92rem;font-weight:700}
.aa__card-title svg{width:18px;height:18px;stroke:var(--purple-500,#8b5cf6);flex-shrink:0}
.aa__card-badge{font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:8px;background:rgba(139,92,246,.08);color:#8b5cf6}

/* Bars */
.aa__bars{display:flex;align-items:flex-end;gap:6px;height:180px;padding-top:10px;position:relative}
.aa__bars--sm{height:140px}
.aa__bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;position:relative;cursor:pointer}
.aa__bar-col:hover .aa__bar-tip{opacity:1;transform:translateX(-50%) translateY(-4px)}
.aa__bar{width:100%;max-width:36px;border-radius:6px 6px 2px 2px;position:relative;transition:height .6s cubic-bezier(.4,0,.2,1);min-height:2px}
.aa__bar-inner{width:100%;height:100%;border-radius:inherit;overflow:hidden;position:relative}
.aa__bar-inner::after{content:'';position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,.18),transparent)}
.aa__bar-lbl{font-size:.68rem;color:var(--color-muted,#94a3b8);white-space:nowrap}
.aa__bar-day{font-size:.62rem;color:var(--color-muted,#94a3b8);opacity:.6}
.aa__bar-tip{position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#1e1b4b;color:#fff;font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:8px;white-space:nowrap;opacity:0;transition:.25s;pointer-events:none;z-index:5}
.aa__bar-tip::after{content:'';position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid #1e1b4b}

/* Funnel */
.aa__funnel{display:flex;flex-direction:column;gap:8px}
.aa__funnel-step{display:flex;align-items:center;gap:12px}
.aa__funnel-ic{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.aa__funnel-ic svg{width:16px;height:16px}
.aa__funnel-body{flex:1;min-width:0}
.aa__funnel-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.aa__funnel-name{font-size:.82rem;font-weight:600}
.aa__funnel-val{font-size:.82rem;font-weight:700}
.aa__funnel-track{height:8px;background:rgba(139,92,246,.06);border-radius:6px;overflow:hidden}
.aa__funnel-fill{height:100%;border-radius:6px;transition:width .8s cubic-bezier(.4,0,.2,1)}
.aa__funnel-drop{text-align:center;font-size:.68rem;color:var(--color-muted,#94a3b8);opacity:.5;padding:2px 0}
.aa__funnel-sum{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(139,92,246,.04);border-radius:12px;margin-top:14px;font-size:.82rem}
.aa__funnel-sum strong{color:#8b5cf6;font-size:1rem}

/* Feed */
.aa__feed{max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:1px}
.aa__feed::-webkit-scrollbar{width:4px}
.aa__feed::-webkit-scrollbar-thumb{background:rgba(139,92,246,.15);border-radius:4px}
.aa__feed-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;transition:.2s;font-size:.82rem}
.aa__feed-item:hover{background:rgba(139,92,246,.03)}
.aa__feed-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}
.aa__feed-dot--purchase{background:#22c55e}
.aa__feed-dot--view{background:#8b5cf6}
.aa__feed-dot--cart{background:#f59e0b}
.aa__feed-dot--visit{background:#06b6d4}
.aa__feed-dot--favorite{background:#ec4899}
.aa__feed-dot--review{background:#fbbf24}
.aa__feed-dot--search{background:#6366f1}
.aa__feed-dot--default{background:#94a3b8}
.aa__feed-text{flex:1;min-width:0;line-height:1.4}
.aa__feed-time{font-size:.72rem;color:var(--color-muted,#94a3b8);flex-shrink:0;white-space:nowrap}

/* Categories */
.aa__cats{display:flex;flex-direction:column;gap:12px}
.aa__cat-row{display:flex;align-items:center;gap:12px}
.aa__cat-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.aa__cat-name{font-size:.82rem;font-weight:500;min-width:80px}
.aa__cat-track{flex:1;height:10px;background:rgba(139,92,246,.06);border-radius:6px;overflow:hidden}
.aa__cat-fill{height:100%;border-radius:6px;transition:width .7s cubic-bezier(.4,0,.2,1)}
.aa__cat-stats{display:flex;align-items:center;gap:10px;font-size:.78rem;white-space:nowrap}
.aa__cat-pct{font-weight:700;min-width:38px;text-align:right}
.aa__cat-val{color:var(--color-muted,#94a3b8)}

/* Top products */
.aa__tbl-head{display:grid;grid-template-columns:2.5fr 1fr 1fr;gap:8px;padding:8px 14px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-muted,#94a3b8);border-bottom:1px solid var(--color-border-soft,#e5e7eb)}
.aa__tbl-row{display:grid;grid-template-columns:2.5fr 1fr 1fr;gap:8px;padding:12px 14px;font-size:.85rem;border-bottom:1px solid rgba(0,0,0,.03);transition:.2s}
.aa__tbl-row:hover{background:rgba(139,92,246,.03)}
.aa__tbl-product{display:flex;align-items:center;gap:10px;font-weight:600;min-width:0}
.aa__tbl-rank{width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;flex-shrink:0}
.aa__tbl-rank--1{background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#fff}
.aa__tbl-rank--2{background:linear-gradient(135deg,#94a3b8,#cbd5e1);color:#fff}
.aa__tbl-rank--3{background:linear-gradient(135deg,#cd7f32,#daa520);color:#fff}
.aa__tbl-rank--def{background:rgba(139,92,246,.08);color:#8b5cf6}
.aa__tbl-thumb{width:34px;height:34px;border-radius:10px;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,#8b5cf6,#d946ef)}
.aa__tbl-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.aa__tbl-thumb svg{width:16px;height:16px;stroke:rgba(255,255,255,.84);fill:none}
.aa__tbl-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Empty */
.aa__empty{text-align:center;padding:40px 20px;color:var(--color-muted,#94a3b8)}
.aa__empty-icon{width:64px;height:64px;margin:0 auto 16px;border-radius:50%;background:rgba(139,92,246,.06);display:flex;align-items:center;justify-content:center}
.aa__empty-icon svg{width:28px;height:28px;stroke:#a78bfa}
.aa__empty-title{font-weight:700;font-size:.95rem;margin-bottom:6px}
.aa__empty-desc{font-size:.82rem;opacity:.7}

/* Reset btn */
.aa__reset-btn{margin-top:20px;padding:10px 20px;background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.15);border-radius:10px;font-size:.78rem;font-weight:600;cursor:pointer;transition:.2s}
.aa__reset-btn:hover{background:rgba(239,68,68,.15)}
        `;
        document.head.appendChild(style);
    }

    // ──── Helpers ────

    function pctChange(cur, prev) {
        if (prev === 0 && cur === 0) return null;
        if (prev === 0) return cur > 0 ? 100 : null;
        return +((cur - prev) / prev * 100).toFixed(1);
    }

    function renderChange(change) {
        if (change === null) return `<span class="aa__kpi-change aa__kpi-change--zero">—</span>`;
        const cls = change >= 0 ? 'up' : 'down';
        const icon = change >= 0 ? IC.arrowUp : IC.arrowDown;
        return `<span class="aa__kpi-change aa__kpi-change--${cls}">${icon}${change >= 0 ? '+' : ''}${change}%</span>`;
    }

    function renderSparkline(values, color) {
        const max = Math.max(...values, 1);
        return `<div class="aa__kpi-spark">${values.map(v =>
            `<div class="aa__kpi-spark-bar" style="height:${Math.max((v / max) * 100, 5)}%;background:${color}"></div>`
        ).join('')}</div>`;
    }

    function emptyBlock(title, desc) {
        return `
        <div class="aa__empty">
            <div class="aa__empty-icon">${IC.empty}</div>
            <div class="aa__empty-title">${title}</div>
            <div class="aa__empty-desc">${desc}</div>
        </div>`;
    }

    function funnelStep(name, value, pct, color, icon) {
        return `
        <div class="aa__funnel-step">
            <div class="aa__funnel-ic" style="background:${color}15"><div style="color:${color}">${icon}</div></div>
            <div class="aa__funnel-body">
                <div class="aa__funnel-row">
                    <span class="aa__funnel-name">${name}</span>
                    <span class="aa__funnel-val">${value}</span>
                </div>
                <div class="aa__funnel-track">
                    <div class="aa__funnel-fill" style="width:${Math.max(pct, 0)}%;background:${color}"></div>
                </div>
            </div>
        </div>`;
    }

    function dropLabel(from, to) {
        if (from <= 0 || to <= 0) return '';
        const drop = ((1 - to / from) * 100).toFixed(0);
        return `<div class="aa__funnel-drop">↓ –${drop}%</div>`;
    }

    function escHtml(v) {
        return String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function resolveOrderImage(order, productsById) {
        if (!order) return null;
        if (order.productImage) return String(order.productImage);
        const product = productsById.get(String(order.productId ?? ''));
        if (!product || !Array.isArray(product.media)) return null;
        const firstImage = product.media.find((m) => m && m.type === 'image' && m.url);
        return firstImage ? String(firstImage.url) : null;
    }

    // ════════════════════════════════════════
    //  MAIN RENDER
    // ════════════════════════════════════════

    function renderTab(c) {
        injectStyles();

        const allEvents = getEvents();
        const orders    = Admin.getOrders();
        const products  = Admin.getProducts();
        const productsById = new Map((Array.isArray(products) ? products : []).map((p) => [String(p.id), p]));
        const profile   = Admin.getProfile();
        const log       = Admin.getAdminLog();

        // Текущий и предыдущий период
        const days     = aggregateDays(currentPeriod);
        const prevDays = aggregateDays(currentPeriod * 2).slice(0, currentPeriod);

        const cur  = getTotals(days);
        const prev = getTotals(prevDays);

        const convRate = cur.visits > 0 ? ((cur.purchases / cur.visits) * 100).toFixed(1) : '0.0';
        const prevConv = prev.visits > 0 ? ((prev.purchases / prev.visits) * 100).toFixed(1) : '0.0';
        const avgCheck = cur.purchases > 0 ? Math.round(cur.revenue / cur.purchases) : 0;

        // Для спарклайнов — последние 7 дней
        const spark7 = aggregateDays(7);

        // Реальные данные по товарам из заказов
        const prodStats = new Map();
        orders.forEach((o) => {
            const key = (o.productId !== undefined && o.productId !== null)
                ? `id:${o.productId}`
                : `name:${o.productName || o.id || 'товар'}`;
            if (!prodStats.has(key)) {
                prodStats.set(key, {
                    name: o.productName || 'Товар',
                    count: 0,
                    rev: 0,
                    image: resolveOrderImage(o, productsById),
                    gradient: o.productGradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)'
                });
            }
            const entry = prodStats.get(key);
            entry.count++;
            entry.rev += (o.price || 0);
            if (!entry.image) {
                entry.image = resolveOrderImage(o, productsById);
            }
        });
        const topProds = Array.from(prodStats.values())
            .sort((a, b) => b.rev - a.rev)
            .slice(0, 6);

        // Категории из заказов
        const catStats = {};
        orders.forEach(o => {
            const cat = o.category || 'Без категории';
            if (!catStats[cat]) catStats[cat] = { count: 0, rev: 0 };
            catStats[cat].count++;
            catStats[cat].rev += (o.price || 0);
        });
        const catEntries = Object.entries(catStats).sort((a, b) => b[1].rev - a[1].rev);
        const totalCatRev = catEntries.reduce((s, [, d]) => s + d.rev, 0) || 1;
        const catColors = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#6366f1'];

        // Последние события
        const recentEvents = getRecentEvents(30);

        // Есть ли вообще данные?
        const hasAnyData = allEvents.length > 0 || orders.length > 0;

        // Max для графиков
        const maxRev = Math.max(...days.map(d => d.revenue), 1);
        const maxVis = Math.max(...days.map(d => d.visits), 1);
        const maxOrd = Math.max(...days.map(d => d.purchases), 1);

        c.innerHTML = `
        <div class="aa" id="aaRoot">

            <!-- HEAD -->
            <div class="aa__head">
                <div class="aa__head-left">
                    <div class="aa__head-icon">${IC.chart}</div>
                    <div>
                        <h2 class="aa__title">Аналитика</h2>
                        <p class="aa__subtitle">Реальные данные. Обновлено: <span id="aaTime">${new Date().toLocaleTimeString('ru-RU')}</span></p>
                    </div>
                </div>
                <div class="aa__head-actions">
                    <div class="aa__live"><span class="aa__live-dot"></span>LIVE</div>
                    <div class="aa__period">
                        ${[7, 14, 30].map(n => `
                            <button class="aa__period-btn ${currentPeriod === n ? 'active' : ''}"
                                onclick="Admin._analytics.setPeriod(${n})">${n} дн</button>
                        `).join('')}
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="Admin._analytics.refresh()" style="gap:6px">${IC.refresh} Обновить</button>
                    <button class="btn btn-ghost btn-sm" onclick="Admin.exportData()" style="gap:6px">${IC.download} CSV</button>
                </div>
            </div>

            ${!hasAnyData ? `
                ${emptyBlock(
                    'Пока нет данных',
                    'Аналитика начнёт наполняться когда пользователи будут заходить на сайт, просматривать товары и совершать покупки. Все данные — реальные.'
                )}
            ` : `

            <!-- KPI -->
            <div class="aa__kpi">
                <div class="aa__kpi-card aa__kpi-card--purple">
                    <div class="aa__kpi-top">
                        <div class="aa__kpi-icon aa__kpi-icon--purple">${IC.revenue}</div>
                        ${renderChange(pctChange(cur.revenue, prev.revenue))}
                    </div>
                    <div class="aa__kpi-value">$${cur.revenue.toLocaleString()}</div>
                    <div class="aa__kpi-label">Выручка за ${currentPeriod} дн.</div>
                    <div class="aa__kpi-sub">${avgCheck > 0 ? `Ср. чек $${avgCheck}` : 'Нет покупок'}</div>
                    ${renderSparkline(spark7.map(d => d.revenue), '#8b5cf6')}
                </div>

                <div class="aa__kpi-card aa__kpi-card--pink">
                    <div class="aa__kpi-top">
                        <div class="aa__kpi-icon aa__kpi-icon--pink">${IC.orders}</div>
                        ${renderChange(pctChange(cur.purchases, prev.purchases))}
                    </div>
                    <div class="aa__kpi-value">${cur.purchases}</div>
                    <div class="aa__kpi-label">Покупки</div>
                    <div class="aa__kpi-sub">${cur.purchases > 0 ? `${(cur.purchases / currentPeriod).toFixed(1)} / день` : 'Пока 0'}</div>
                    ${renderSparkline(spark7.map(d => d.purchases), '#ec4899')}
                </div>

                <div class="aa__kpi-card aa__kpi-card--cyan">
                    <div class="aa__kpi-top">
                        <div class="aa__kpi-icon aa__kpi-icon--cyan">${IC.users}</div>
                        ${renderChange(pctChange(cur.visits, prev.visits))}
                    </div>
                    <div class="aa__kpi-value">${cur.visits}</div>
                    <div class="aa__kpi-label">Посещения</div>
                    <div class="aa__kpi-sub">${cur.views} просмотров</div>
                    ${renderSparkline(spark7.map(d => d.visits), '#06b6d4')}
                </div>

                <div class="aa__kpi-card aa__kpi-card--amber">
                    <div class="aa__kpi-top">
                        <div class="aa__kpi-icon aa__kpi-icon--amber">${IC.target}</div>
                        ${renderChange(pctChange(+convRate, +prevConv))}
                    </div>
                    <div class="aa__kpi-value">${convRate}%</div>
                    <div class="aa__kpi-label">Конверсия</div>
                    <div class="aa__kpi-sub">${cur.carts} добавлений в корзину</div>
                    ${renderSparkline(spark7.map(d => d.visits > 0 ? (d.purchases / d.visits * 100) : 0), '#f59e0b')}
                </div>
            </div>

            <!-- CHARTS: Revenue + Visitors -->
            <div class="aa__grid aa__grid--2">
                <div class="aa__card">
                    <div class="aa__card-head">
                        <h3 class="aa__card-title">${IC.trending} Выручка по дням</h3>
                        <div class="aa__card-badge">$${cur.revenue.toLocaleString()}</div>
                    </div>
                    ${cur.revenue > 0 ? `
                    <div class="aa__bars">
                        ${days.map(d => `
                        <div class="aa__bar-col">
                            <div class="aa__bar-tip">$${d.revenue}</div>
                            <div class="aa__bar" style="height:${Math.max((d.revenue / maxRev) * 100, 2)}%">
                                <div class="aa__bar-inner" style="background:linear-gradient(180deg,#8b5cf6,#c084fc)"></div>
                            </div>
                            <span class="aa__bar-lbl">${d.label}</span>
                            <span class="aa__bar-day">${d.dayName}</span>
                        </div>`).join('')}
                    </div>` : emptyBlock('Нет выручки', 'Появится после первой покупки')}
                </div>

                <div class="aa__card">
                    <div class="aa__card-head">
                        <h3 class="aa__card-title">${IC.eye} Посещения</h3>
                        <div class="aa__card-badge">${cur.visits}</div>
                    </div>
                    ${cur.visits > 0 ? `
                    <div class="aa__bars aa__bars--sm">
                        ${days.map(d => `
                        <div class="aa__bar-col">
                            <div class="aa__bar-tip">${d.visits} визитов</div>
                            <div class="aa__bar" style="height:${Math.max((d.visits / maxVis) * 100, 2)}%">
                                <div class="aa__bar-inner" style="background:linear-gradient(180deg,#06b6d4,#67e8f9)"></div>
                            </div>
                            <span class="aa__bar-lbl">${d.label}</span>
                        </div>`).join('')}
                    </div>` : emptyBlock('Нет посещений', 'Каждый заход на сайт записывается')}
                </div>
            </div>

            <!-- FUNNEL + CATEGORIES -->
            <div class="aa__grid aa__grid--2eq">
                <div class="aa__card">
                    <div class="aa__card-head">
                        <h3 class="aa__card-title">${IC.funnel} Воронка</h3>
                    </div>
                    <div class="aa__funnel">
                        ${funnelStep('Посещения', cur.visits, 100, '#8b5cf6', IC.users)}
                        ${dropLabel(cur.visits, cur.views)}
                        ${funnelStep('Просмотры', cur.views, cur.visits > 0 ? (cur.views / cur.visits * 100) : 0, '#a78bfa', IC.eye)}
                        ${dropLabel(cur.views, cur.carts)}
                        ${funnelStep('Корзина', cur.carts, cur.visits > 0 ? (cur.carts / cur.visits * 100) : 0, '#c084fc', IC.cart)}
                        ${dropLabel(cur.carts, cur.purchases)}
                        ${funnelStep('Покупки', cur.purchases, cur.visits > 0 ? (cur.purchases / cur.visits * 100) : 0, '#ec4899', IC.orders)}
                    </div>
                    <div class="aa__funnel-sum">
                        <span>Итоговая конверсия</span>
                        <strong>${convRate}%</strong>
                    </div>
                </div>

                <div class="aa__card">
                    <div class="aa__card-head">
                        <h3 class="aa__card-title">${IC.pie} Категории</h3>
                    </div>
                    ${catEntries.length > 0 ? `
                    <div class="aa__cats">
                        ${catEntries.map(([cat, d], i) => {
                            const pct = (d.rev / totalCatRev * 100).toFixed(1);
                            const clr = catColors[i % catColors.length];
                            return `
                            <div class="aa__cat-row">
                                <div class="aa__cat-dot" style="background:${clr}"></div>
                                <span class="aa__cat-name">${cat}</span>
                                <div class="aa__cat-track">
                                    <div class="aa__cat-fill" style="width:${pct}%;background:${clr}"></div>
                                </div>
                                <div class="aa__cat-stats">
                                    <span class="aa__cat-pct">${pct}%</span>
                                    <span class="aa__cat-val">${d.count} шт · $${d.rev}</span>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>` : emptyBlock('Нет данных', 'Категории появятся после покупок')}
                </div>
            </div>

            <!-- TOP PRODUCTS + ACTIVITY FEED -->
            <div class="aa__grid aa__grid--2">
                <div class="aa__card">
                    <div class="aa__card-head">
                        <h3 class="aa__card-title">${IC.pkg} Топ товаров</h3>
                    </div>
                    ${topProds.length > 0 ? `
                    <div>
                        <div class="aa__tbl-head"><span>Товар</span><span>Продажи</span><span>Выручка</span></div>
                        ${topProds.map((p, i) => {
                            const rankCls = i < 3 ? `aa__tbl-rank--${i + 1}` : 'aa__tbl-rank--def';
                            const thumb = p.image
                                ? `<span class="aa__tbl-thumb"><img src="${escHtml(p.image)}" alt="${escHtml(p.name || 'Товар')}" loading="lazy"></span>`
                                : `<span class="aa__tbl-thumb" style="background:${escHtml(p.gradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)')}">${IC.pkg}</span>`;
                            return `
                            <div class="aa__tbl-row">
                                <div class="aa__tbl-product">
                                    <div class="aa__tbl-rank ${rankCls}">${i + 1}</div>
                                    ${thumb}
                                    <span class="aa__tbl-name">${escHtml(p.name)}</span>
                                </div>
                                <span>${p.count}</span>
                                <span style="font-weight:700;color:#8b5cf6">$${p.rev}</span>
                            </div>`;
                        }).join('')}
                    </div>` : emptyBlock('Нет продаж', 'Топ заполнится из реальных покупок')}
                </div>

                <div class="aa__card">
                    <div class="aa__card-head">
                        <h3 class="aa__card-title">${IC.activity} Активность</h3>
                        <div class="aa__live"><span class="aa__live-dot"></span>LIVE</div>
                    </div>
                    <div class="aa__feed" id="aaFeed">
                        ${recentEvents.length > 0 ? recentEvents.map(ev => `
                        <div class="aa__feed-item">
                            <div class="aa__feed-dot aa__feed-dot--${eventDotClass(ev.type)}"></div>
                            <div class="aa__feed-text">${eventLabel(ev)}</div>
                            <div class="aa__feed-time">${timeAgo(ev.ts)}</div>
                        </div>`).join('') : emptyBlock('Нет событий', 'Активность появится при использовании сайта')}
                    </div>
                </div>
            </div>

            <!-- ORDERS CHART -->
            ${cur.purchases > 0 ? `
            <div class="aa__card" style="margin-bottom:24px">
                <div class="aa__card-head">
                    <h3 class="aa__card-title">${IC.orders} Заказы по дням</h3>
                    <div class="aa__card-badge">${cur.purchases} за ${currentPeriod} дн.</div>
                </div>
                <div class="aa__bars aa__bars--sm">
                    ${days.map(d => `
                    <div class="aa__bar-col">
                        <div class="aa__bar-tip">${d.purchases} заказов</div>
                        <div class="aa__bar" style="height:${Math.max((d.purchases / maxOrd) * 100, 2)}%">
                            <div class="aa__bar-inner" style="background:linear-gradient(180deg,#ec4899,#f9a8d4)"></div>
                        </div>
                        <span class="aa__bar-lbl">${d.label}</span>
                    </div>`).join('')}
                </div>
            </div>` : ''}

            <!-- ADMIN LOG -->
            <div class="aa__card" style="margin-bottom:24px">
                <div class="aa__card-head">
                    <h3 class="aa__card-title">${IC.shield} Журнал</h3>
                    <div class="aa__card-badge">${log.length} записей</div>
                </div>
                <div class="aa__feed" style="max-height:220px">
                    ${log.length > 0 ? log.slice(0, 15).map(entry => `
                    <div class="aa__feed-item">
                        <div class="aa__feed-dot aa__feed-dot--default"></div>
                        <div class="aa__feed-text">${entry.action}${entry.details ? ` — <span style="opacity:.6">${entry.details}</span>` : ''}</div>
                        <div class="aa__feed-time">${Admin.fmtDateTime(entry.date)}</div>
                    </div>`).join('') : '<div class="aa__empty"><div class="aa__empty-desc">Нет записей</div></div>'}
                </div>
            </div>

            <!-- Summary -->
            <div class="aa__card">
                <div class="aa__card-head">
                    <h3 class="aa__card-title">${IC.check} Сводка</h3>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px">
                    <div style="text-align:center;padding:12px">
                        <div style="font-size:1.3rem;font-weight:800;color:#8b5cf6">${allEvents.length}</div>
                        <div style="font-size:.78rem;color:var(--color-muted)">Всего событий</div>
                    </div>
                    <div style="text-align:center;padding:12px">
                        <div style="font-size:1.3rem;font-weight:800;color:#ec4899">${orders.length}</div>
                        <div style="font-size:.78rem;color:var(--color-muted)">Заказов</div>
                    </div>
                    <div style="text-align:center;padding:12px">
                        <div style="font-size:1.3rem;font-weight:800;color:#06b6d4">${products.length}</div>
                        <div style="font-size:.78rem;color:var(--color-muted)">Товаров</div>
                    </div>
                    <div style="text-align:center;padding:12px">
                        <div style="font-size:1.3rem;font-weight:800;color:#22c55e">${(profile.reviews || []).length}</div>
                        <div style="font-size:.78rem;color:var(--color-muted)">Отзывов</div>
                    </div>
                </div>
            </div>

            `}

            <!-- CLEAR DATA -->
            <div style="text-align:center;margin-top:24px">
                <button class="aa__reset-btn" onclick="Admin._analytics.clearAll()">Очистить всю аналитику</button>
            </div>
        </div>`;

        startAutoRefresh();
    }

    // ──── Auto-refresh (updates time + feed, NO fake events) ────

    function startAutoRefresh() {
        stopAutoRefresh();
        refreshTimer = setInterval(() => {
            const el = document.getElementById('aaTime');
            if (el) el.textContent = new Date().toLocaleTimeString('ru-RU');
            updateFeed();
        }, REFRESH_INTERVAL);
    }

    function stopAutoRefresh() {
        if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    }

    function updateFeed() {
        const feed = document.getElementById('aaFeed');
        if (!feed) return;
        const events = getRecentEvents(30);
        if (events.length === 0) return;
        feed.innerHTML = events.map(ev => `
        <div class="aa__feed-item">
            <div class="aa__feed-dot aa__feed-dot--${eventDotClass(ev.type)}"></div>
            <div class="aa__feed-text">${eventLabel(ev)}</div>
            <div class="aa__feed-time">${timeAgo(ev.ts)}</div>
        </div>`).join('');
    }

    // ──── Public API ────

    function setPeriod(n) {
        currentPeriod = n;
        const c = document.getElementById('adminTabContent');
        if (c) renderTab(c);
    }

    function refresh() {
        const c = document.getElementById('adminTabContent');
        if (c) { renderTab(c); App.showToast('Аналитика обновлена', 'success'); }
    }

    function clearAll() {
        if (!confirm('Удалить ВСЮ аналитику? Это необратимо.')) return;
        fetch('/api/store/admin/analytics/events', { method: 'DELETE' })
            .then(async (res) => {
                if (!res.ok) throw new Error('clear_failed');
                localStorage.removeItem(ANALYTICS_KEY);
                App.showToast('Аналитика очищена', 'info');
                refresh();
            })
            .catch(() => {
                localStorage.removeItem(ANALYTICS_KEY);
                App.showToast('Очищено локально (сервер недоступен)', 'warning');
                refresh();
            });
    }

    function exportData() {
        const orders = Admin.getOrders();
        const events = getEvents();

        let csv = 'Тип,Описание,Сумма,Дата\n';
        events.forEach(ev => {
            csv += `"${ev.type}","${(ev.meta?.label || ev.meta?.name || '').replace(/"/g, '""')}",${ev.meta?.amount || ''},${ev.ts}\n`;
        });
        csv += '\n\nID,Товар,Категория,Цена,Статус,Дата\n';
        orders.forEach(o => {
            csv += `${o.id},"${(o.productName || '').replace(/"/g, '""')}","${o.category || ''}",${o.price || 0},${o.status || ''},${o.createdAt || ''}\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `tish_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        App.showToast('Экспортировано', 'success');
    }

    // Cleanup on tab switch
    const origSwitch = Admin.switchTab;
    Admin.switchTab = function (tab) {
        const nextTab = tab === 'analytics' ? 'dashboard' : tab;
        if (nextTab !== 'dashboard') stopAutoRefresh();
        origSwitch(tab);
    };

    // ──── Register ────
    Admin.registerTab('dashboard', renderTab);
    Admin.exportData = exportData;
    Admin._analytics = { track, setPeriod, refresh, clearAll };

})(Admin);