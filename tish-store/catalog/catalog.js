/* =====================================================
   TISH STORE — CATALOG v3.1
   Clean minimal design, admin products only
   FIX: badges overlap, price display, region-based currency
   ===================================================== */

const Catalog = (() => {

    const PRODUCTS_KEY = 'tish_admin_products';
    const CATEGORIES = [
        { slug: 'all',       name: 'Все'        },
        { slug: 'web',       name: 'Веб / IT'   },
        { slug: 'design',    name: 'Дизайн'     },
        { slug: 'video',     name: 'Видео'      },
        { slug: 'marketing', name: 'Маркетинг'  }
    ];

    let currentFilter  = 'all';
    let searchQuery     = '';
    let currentProduct  = null;
    let stylesReady     = false;
    let _placeholderTimer = null;
    let _placeholderInputEl = null;
    let _placeholderHandlers = null;

    function asArray(raw) {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object') {
            const keys = ['value', 'data', 'items', 'products', 'rows'];
            for (const key of keys) {
                if (Array.isArray(raw[key])) return raw[key];
            }
        }
        return [];
    }

    function normalizeMedia(list) {
        return asArray(list).map((item, idx) => {
            if (typeof item === 'string') {
                return { url: item, type: 'image', name: `media-${idx}` };
            }
            if (!item || typeof item !== 'object') return null;
            const url = String(item.url || item.path || '').trim();
            if (!url) return null;
            const marker = String(item.type || item.mime || '').toLowerCase();
            const isVideo = marker.includes('video') || /\.(mp4|webm|mov)$/i.test(url);
            return {
                ...item,
                url,
                type: isVideo ? 'video' : 'image'
            };
        }).filter(Boolean);
    }

    function normalizeProducts(raw) {
        return asArray(raw).map((item, idx) => {
            const safe = item && typeof item === 'object' ? item : {};
            return {
                ...safe,
                id: safe.id ?? `prod_${idx}`,
                title: String(safe.title || '').trim(),
                media: normalizeMedia(safe.media),
                active: safe.active !== false
            };
        }).filter((p) => p.title);
    }

    /* ─────────────────────────────────────────
       DATA
       ───────────────────────────────────────── */

    function loadAll() {
        try {
            let raw = null;
            if (typeof Storage !== 'undefined' && typeof Storage.get === 'function') {
                raw = Storage.get(PRODUCTS_KEY, null);
            }
            if (raw === null || raw === undefined) {
                raw = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
            }
            return normalizeProducts(raw);
        } catch {
            return [];
        }
    }

    function loadActive() {
        return loadAll().filter(p => p.active !== false);
    }

    function reviewStats(id, title) {
        try {
            const countsRaw = localStorage.getItem('tish_review_counts');
            const counts = countsRaw ? JSON.parse(countsRaw) : {};
            const data = counts[String(id)] || counts[String(title)] || null;
            if (data && Number(data.count) > 0) {
                return {
                    rating: Number(data.avgRating) || 5.0,
                    count: Number(data.count) || 0
                };
            }
        } catch {}

        return { rating: 5.0, count: 0 };
    }

    /* ── Определение региона пользователя ── */
    function getUserRegion() {
        try {
            const prof = JSON.parse(localStorage.getItem('tish_profile') || '{}');
            return prof.region || null; // 'RU' or 'OTHER' or null
        } catch { return null; }
    }

    function getUserCurrency() {
        const region = getUserRegion();
        if (region === 'RU') return 'RUB';
        if (region === 'OTHER') return 'USD';
        // Если регион не выбран — определяем по языку браузера как fallback для отображения
        return (navigator.language && navigator.language.startsWith('ru')) ? 'RUB' : 'USD';
    }

    /* Формат цены — на основе региона пользователя */
    function rub(v, productCurrency) {
        const n = Number(v || 0);
        const userCur = getUserCurrency();
        
        // Если у товара есть обе цены, показываем нужную
        if (userCur === 'USD') return '$\u202f' + n.toLocaleString('en-US');
        return n.toLocaleString('ru-RU') + '\u00a0₽';
    }

    /* Получить правильную цену товара в зависимости от региона */
    function getProductPrice(product, field) {
        const userCur = getUserCurrency();
        if (userCur === 'RUB') {
            // Для русских — цена в рублях
            if (field === 'price') return product.priceRub || product.price || 0;
            if (field === 'oldPrice') return product.oldPriceRub || product.oldPrice || null;
            if (field === 'prepayPrice') return product.prepayPriceRub || product.prepayPrice || 0;
        } else {
            // Для остальных — цена в долларах
            if (field === 'price') return product.priceUsd || product.price || 0;
            if (field === 'oldPrice') return product.oldPriceUsd || product.oldPrice || null;
            if (field === 'prepayPrice') return product.prepayPriceUsd || product.prepayPrice || 0;
        }
        return 0;
    }

    /* Форматирование цены с учётом региона */
    function formatPrice(product, field) {
        const value = getProductPrice(product, field);
        if (value === null || value === 0) return null;
        const userCur = getUserCurrency();
        if (userCur === 'USD') return '$\u202f' + Number(value).toLocaleString('en-US');
        return Number(value).toLocaleString('ru-RU') + '\u00a0₽';
    }

    function discount(product) {
        const price = getProductPrice(product, 'price');
        const old = getProductPrice(product, 'oldPrice');
        if (!old || old <= price) return 0;
        return Math.round((1 - price / old) * 100);
    }

    /* ─────────────────────────────────────────
       SVG ICONS
       ───────────────────────────────────────── */

    const IC = {
        heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        star:  `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        play:  `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
        img:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        user:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
    };

    /* ─────────────────────────────────────────
       STYLES
       ───────────────────────────────────────── */

    function injectStyles() {
        if (stylesReady) return;
        stylesReady = true;
        const el = document.createElement('style');
        el.id = 'cat3css';
        el.textContent = `
/* ── Card media 16:9 ── */
.c3-media{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#f3f4f6;flex-shrink:0}
.c3-media img,.c3-media video{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.product-card:hover .c3-media img,.product-card:hover .c3-media video{transform:scale(1.04)}
.c3-gradient{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.c3-gradient svg{width:40px;height:40px;stroke:rgba(255,255,255,.4);fill:none}
.c3-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.c3-play span{width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
.c3-play svg{width:14px;height:14px;fill:#fff;margin-left:2px}
.c3-count{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.55);color:#fff;font-size:.65rem;font-weight:700;padding:2px 7px;border-radius:6px;backdrop-filter:blur(4px)}

/* ── Badges over media — FIXED: no overlap ── */
.c3-badges-row{position:absolute;top:10px;left:10px;right:50px;z-index:6;display:flex;gap:6px;flex-wrap:nowrap;pointer-events:none}
.c3-disc{background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;font-size:.68rem;font-weight:800;padding:4px 10px;border-radius:20px;pointer-events:none;white-space:nowrap;flex-shrink:0}
.c3-label-badge{padding:5px 12px;font-size:.68rem;font-weight:700;color:white;border-radius:9999px;backdrop-filter:blur(10px);text-transform:uppercase;letter-spacing:.05em;pointer-events:none;white-space:nowrap;flex-shrink:0}
.c3-label-badge--new{background:linear-gradient(135deg,#8b5cf6,#ec4899)}
.c3-label-badge--hot{background:linear-gradient(135deg,#f97316,#ef4444)}
.c3-label-badge--sale{background:linear-gradient(135deg,#22c55e,#10b981)}

/* ── Card body extras ── */
.c3-exec{display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--color-muted);margin-bottom:5px}
.c3-exec-av{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#f472b6);flex-shrink:0;display:flex;align-items:center;justify-content:center}
.c3-exec-av svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2}
.c3-prices{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}
.c3-price{font-size:1.1rem;font-weight:800;font-family:var(--font-mono,monospace);color:var(--color-text)}
.c3-old{font-size:.8rem;color:var(--color-muted);text-decoration:line-through}
.c3-prepay{font-size:.68rem;color:var(--purple-500,#8b5cf6);font-weight:600;margin-top:2px}
.c3-rat{display:flex;align-items:center;gap:3px;font-size:.75rem;font-weight:600;color:#f59e0b}
.c3-rat svg{width:12px;height:12px;color:#f59e0b}
.c3-rat-n{color:var(--color-muted);font-weight:400;font-size:.68rem}

/* ── Modal ── */
.cm3{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}
.cm3.open{opacity:1;visibility:visible}
.cm3__bg{position:absolute;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(14px);cursor:pointer}
.cm3__box{position:relative;max-width:860px;width:100%;max-height:90vh;overflow-y:auto;background:var(--color-bg-elevated,#fff);border-radius:20px;box-shadow:0 32px 80px rgba(0,0,0,.22);transform:translateY(28px) scale(.97);transition:transform .38s cubic-bezier(.16,1,.3,1)}
.cm3.open .cm3__box{transform:none}
.cm3__x{position:absolute;top:14px;right:14px;z-index:6;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.28);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.25s}
.cm3__x:hover{background:rgba(0,0,0,.5);transform:rotate(90deg)}
.cm3__x svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2}
.cm3__gal{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:20px 20px 0 0;background:#f3f4f6}
.cm3__gal img,.cm3__gal video{width:100%;height:100%;object-fit:cover}
.cm3__gal-grad{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.cm3__gal-grad svg{width:64px;height:64px;stroke:rgba(255,255,255,.35);fill:none}
.cm3__thumbs{display:flex;gap:7px;padding:10px 20px;overflow-x:auto}
.cm3__th{width:68px;height:38px;border-radius:7px;overflow:hidden;cursor:pointer;flex-shrink:0;border:2px solid transparent;opacity:.55;transition:.2s}
.cm3__th.on{border-color:var(--purple-500,#8b5cf6);opacity:1}
.cm3__th img,.cm3__th video{width:100%;height:100%;object-fit:cover}
.cm3__body{padding:22px 26px 28px}
.cm3__top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px}
.cm3__cat{font-size:.72rem;font-weight:700;color:var(--purple-500,#8b5cf6);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
.cm3__ttl{font-size:1.35rem;font-weight:800;margin-bottom:6px;line-height:1.2}
.cm3__rat{display:flex;align-items:center;gap:5px;font-size:.82rem;font-weight:600;color:#f59e0b}
.cm3__rat svg{width:15px;height:15px}
.cm3__pb{text-align:right;min-width:150px;flex-shrink:0}
.cm3__price{font-size:1.75rem;font-weight:800;font-family:var(--font-mono,monospace)}
.cm3__old{font-size:.92rem;color:var(--color-muted);text-decoration:line-through;margin-top:1px}
.cm3__dtag{display:inline-block;margin-top:5px;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;font-size:.72rem;font-weight:800;padding:3px 10px;border-radius:7px}
.cm3__prep{font-size:.78rem;color:var(--purple-500,#8b5cf6);font-weight:600;margin-top:5px}
.cm3__exec{display:flex;align-items:center;gap:11px;padding:12px 14px;background:var(--color-bg-muted,#f8f9fa);border-radius:11px;margin-bottom:14px}
.cm3__eav{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#f472b6);flex-shrink:0;display:flex;align-items:center;justify-content:center}
.cm3__eav svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2}
.cm3__ename{font-weight:700;font-size:.88rem}
.cm3__erole{font-size:.72rem;color:var(--color-muted)}
.cm3__desc{font-size:.88rem;line-height:1.65;color:var(--color-text);margin-bottom:18px}
.cm3__feats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
.cm3__feat{display:flex;align-items:center;gap:7px;font-size:.8rem}
.cm3__fic{width:20px;height:20px;border-radius:5px;flex-shrink:0;background:rgba(34,197,94,.1);display:flex;align-items:center;justify-content:center}
.cm3__fic svg{width:11px;height:11px;stroke:#22c55e;fill:none;stroke-width:3}
.cm3__acts{display:flex;gap:10px}
.cm3__cbuy{flex:1;padding:13px;border:none;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;transition:.25s}
.cm3__cbuy:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(139,92,246,.32)}
.cm3__cfav{width:50px;height:50px;border:2px solid var(--color-border,#e5e7eb);border-radius:13px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.25s}
.cm3__cfav svg{width:20px;height:20px;stroke:var(--color-muted);fill:none;stroke-width:2;transition:.25s}
.cm3__cfav.on{background:linear-gradient(135deg,#ef4444,#f97316);border-color:transparent}
.cm3__cfav.on svg{stroke:#fff;fill:#fff}
.c3-empty{grid-column:1/-1;text-align:center;padding:60px 20px}
.c3-empty svg{width:48px;height:48px;stroke:var(--color-muted);fill:none;margin:0 auto 14px;display:block}
.c3-empty h3{font-size:1rem;font-weight:700;margin-bottom:6px}
.c3-empty p{color:var(--color-muted);font-size:.85rem;margin-bottom:16px}

/* ── Region warning ── */
.c3-region-warn{background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:.82rem;color:#f97316;text-align:center}
.c3-region-warn a{color:#7c3aed;font-weight:700;cursor:pointer;text-decoration:underline}

@media(max-width:640px){.cm3__feats{grid-template-columns:1fr}.cm3__top{flex-direction:column}.cm3__pb{text-align:left}.cm3__body{padding:14px}}`;
        document.head.appendChild(el);
    }

    /* ─────────────────────────────────────────
       CARD — FIXED badges positioning
       ───────────────────────────────────────── */

    function makeCard(product, index) {
        const isFav = typeof App !== 'undefined' && App.isFavorite(product.id);
        const rv = reviewStats(product.id, product.title);
        const disc = discount(product);

        const catColors = { web:'#8b5cf6', design:'#ec4899', video:'#ef4444', marketing:'#22c55e' };
        const catColor = catColors[product.categorySlug] || '#6b7280';

        const media = product.media || [];
        const first = media[0] || null;

        /* FIX: Бейджи в единый контейнер-ряд — больше не налипают */
        let badgesHTML = '';
        const hasBadges = disc > 0 || product.badge;
        if (hasBadges) {
            let inner = '';
            if (disc > 0) {
                inner += `<span class="c3-disc">-${disc}%</span>`;
            }
            if (product.badge) {
                inner += `<span class="c3-label-badge c3-label-badge--${product.badge}">${product.badge.toUpperCase()}</span>`;
            }
            badgesHTML = `<div class="c3-badges-row">${inner}</div>`;
        }

        /* Медиа блок */
        let mediaHTML = '';
        if (first && first.type === 'video') {
            mediaHTML = `
            <div class="c3-media">
                <video src="${first.url}" muted loop preload="metadata"></video>
                <div class="c3-play"><span>${IC.play}</span></div>
                ${badgesHTML}
                ${media.length > 1 ? `<div class="c3-count">+${media.length - 1}</div>` : ''}
            </div>`;
        } else if (first && first.type === 'image') {
            mediaHTML = `
            <div class="c3-media">
                <img src="${first.url}" alt="${product.title}" loading="lazy">
                ${badgesHTML}
                ${media.length > 1 ? `<div class="c3-count">+${media.length - 1}</div>` : ''}
            </div>`;
        } else {
            mediaHTML = `
            <div class="c3-media">
                <div class="c3-gradient" style="background:${product.gradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)'}">
                    ${IC.img}
                </div>
                ${badgesHTML}
            </div>`;
        }

        /* FIX: Цена — берём правильную на основе региона */
        const priceDisplay = formatPrice(product, 'price');
        const oldPriceDisplay = formatPrice(product, 'oldPrice');
        const prepayDisplay = formatPrice(product, 'prepayPrice');

        const priceHTML = `
            <div class="c3-prices">
                <span class="c3-price">${priceDisplay || '—'}</span>
                ${oldPriceDisplay ? `<span class="c3-old">${oldPriceDisplay}</span>` : ''}
            </div>
            ${prepayDisplay ? `<div class="c3-prepay">Предоплата: ${prepayDisplay}</div>` : ''}
        `;

        const card = document.createElement('div');
        card.className = `product-card reveal reveal-delay-${Math.min(index + 1, 10)}`;
        card.dataset.productId = product.id;

        card.innerHTML = `
            <div class="product-card__shine"></div>
            <div class="product-card__preview" style="padding:0;position:relative;overflow:hidden;">
                ${mediaHTML}
                <button class="product-card__favorite ${isFav ? 'is-active' : ''}"
                        type="button"
                        data-product-id="${product.id}"
                        onclick="event.stopPropagation();Catalog.toggleFavorite('${String(product.id).replace(/'/g, "\\'")}')">
                    ${IC.heart}
                </button>
                <div class="product-card__overlay" onclick="Catalog.openModal('${String(product.id).replace(/'/g, "\\'")}')">
                    <button class="product-card__quick-view">Подробнее</button>
                </div>
            </div>
            <div class="product-card__body">
                <div class="product-card__category" style="color:${catColor}">${product.category}</div>
                <h3 class="product-card__title">${product.title}</h3>
                ${product.executor ? `
                <div class="c3-exec">
                    <div class="c3-exec-av">${IC.user}</div>
                    <span>${product.executor}</span>
                </div>` : ''}
                <div class="product-card__meta">
                    <div class="c3-rat">
                        ${IC.star}
                        <span>${rv.rating}</span>
                        <span class="c3-rat-n">(${rv.count})</span>
                    </div>
                </div>
                <div class="product-card__footer">
                    <div>${priceHTML}</div>
                    <button class="product-card__buy" type="button"
                            onclick="event.stopPropagation();Catalog.openModal('${String(product.id).replace(/'/g, "\\'")}')">
                        Подробнее
                    </button>
                </div>
            </div>`;

        let touchStartedAt = 0;

        card.addEventListener('click', e => {
            if (e.target.closest('button') || e.target.closest('.product-card__favorite') || e.target.closest('.product-card__buy')) return;
            Catalog.openModal(product.id);
        });

        card.addEventListener('touchstart', () => {
            touchStartedAt = Date.now();
        }, { passive: true });

        card.addEventListener('touchend', e => {
            if (e.target.closest('button') || e.target.closest('.product-card__favorite') || e.target.closest('.product-card__buy')) return;
            const dt = Date.now() - touchStartedAt;
            if (dt < 450) {
                e.preventDefault();
                Catalog.openModal(product.id);
            }
        }, { passive: false });

        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', ((e.clientX - r.left) / r.width * 100) + '%');
            card.style.setProperty('--mouse-y', ((e.clientY - r.top) / r.height * 100) + '%');
        });

        return card;
    }

    /* ─────────────────────────────────────────
       GRID
       ───────────────────────────────────────── */

    function renderGrid(id, list) {
        const grid = document.getElementById(id);
        if (!grid) return;
        grid.innerHTML = '';

        if (!list.length) {
            grid.innerHTML = `
                <div class="c3-empty">
                    ${IC.search}
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте другую категорию или запрос</p>
                    <button class="btn btn-primary" onclick="Catalog.resetFilters()">Сбросить</button>
                </div>`;
            return;
        }

        list.forEach((p, i) => grid.appendChild(makeCard(p, i)));
        requestAnimationFrame(() => reveal(grid));
    }

    /* ─────────────────────────────────────────
       FILTER / SEARCH
       ───────────────────────────────────────── */

    function filtered() {
        let list = loadActive();
        if (currentFilter !== 'all')
            list = list.filter(p => p.categorySlug === currentFilter);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p =>
                (p.title       || '').toLowerCase().includes(q) ||
                (p.category    || '').toLowerCase().includes(q) ||
                (p.executor    || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        }
        return list;
    }

    function renderCatalog() {
        injectStyles();
        const list = filtered();
        renderGrid('productGrid', list);
        const el = document.querySelector('.catalog-header__count span');
        if (el) {
            const n = list.length;
            el.textContent = n + ' товар' + (n === 0 || n > 4 ? 'ов' : n > 1 ? 'а' : '');
        }
    }

    function renderFavorites() {
        injectStyles();
        const list = loadActive().filter(p =>
            typeof App !== 'undefined' && App.isFavorite(p.id)
        );
        const grid = document.getElementById('favoritesGrid');
        if (!grid) return;
        if (!list.length) {
            grid.innerHTML = `
                <div class="c3-empty">
                    ${IC.heart}
                    <h3>Пока пусто</h3>
                    <p>Добавляйте товары в избранное</p>
                    <button class="btn btn-primary" onclick="App.showPage('catalog')">В каталог</button>
                </div>`;
            return;
        }
        renderGrid('favoritesGrid', list);
    }

    /* ─────────────────────────────────────────
       FAVORITES
       ───────────────────────────────────────── */

    function toggleFavorite(id) {
        if (typeof App === 'undefined') return;
        App.toggleFavorite(id);
        const key = String(id);
        const on = App.isFavorite(key);
        document.querySelectorAll('.product-card__favorite[data-product-id]').forEach(btn => {
            if (String(btn.dataset.productId || '') !== key) return;
            btn.classList.toggle('is-active', on);
            btn.classList.remove('is-animating');
            void btn.offsetWidth;
            btn.classList.add('is-animating');
            setTimeout(() => btn.classList.remove('is-animating'), 600);
        });
        App.showToast(on ? 'Добавлено в избранное' : 'Удалено', on ? 'success' : 'info');
    }

    /* ─────────────────────────────────────────
       MODAL — FIXED price display
       ───────────────────────────────────────── */

    function openModal(id) {
        const numId = Number(id);
        const allP = loadAll();
        const product = allP.find(p => p.id === numId || p.id === id);

        if (!product) {
            console.warn('Catalog.openModal: товар не найден', id);
            return;
        }
        currentProduct = product;

        if (typeof Admin !== 'undefined' && Admin._analytics)
            Admin._analytics.track('product_view', {
                name: product.title, id: product.id,
                price: getProductPrice(product, 'price'), category: product.category
            });

        const rv = reviewStats(product.id, product.title);
        const disc = discount(product);
        const fav = typeof App !== 'undefined' && App.isFavorite(product.id);
        const media = product.media || [];
        const first = media[0] || null;

        /* FIX: Правильные цены в модалке */
        const priceDisplay = formatPrice(product, 'price');
        const oldPriceDisplay = formatPrice(product, 'oldPrice');
        const prepayDisplay = formatPrice(product, 'prepayPrice');
        const regionSelected = getUserRegion() !== null;

        /* gallery */
        let galHTML = '';
        if (first && first.type === 'video')
            galHTML = `<video src="${first.url}" controls style="width:100%;height:100%;object-fit:cover;"></video>`;
        else if (first && first.type === 'image')
            galHTML = `<img src="${first.url}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;">`;
        else
            galHTML = `<div class="cm3__gal-grad" style="background:${product.gradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)'}">
                ${IC.img}
            </div>`;

        /* thumbs */
        let thumbsHTML = '';
        if (media.length > 1)
            thumbsHTML = `<div class="cm3__thumbs">
                ${media.map((m, i) => `
                <div class="cm3__th ${i === 0 ? 'on' : ''}" onclick="Catalog._sw(${i})">
                    ${m.type === 'video'
                        ? `<video src="${m.url}" muted preload="metadata"></video>`
                        : `<img src="${m.url}">`}
                </div>`).join('')}
            </div>`;

        document.getElementById('cm3Modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'cm3Modal';
        modal.className = 'cm3';
        modal.innerHTML = `
            <div class="cm3__bg" onclick="Catalog.closeModal()"></div>
            <div class="cm3__box">
                <button class="cm3__x" onclick="Catalog.closeModal()">${IC.close}</button>

                <div class="cm3__gal" id="cm3Gal">${galHTML}</div>
                ${thumbsHTML}

                <div class="cm3__body">
                    <div class="cm3__top">
                        <div>
                            <div class="cm3__cat">${product.category}</div>
                            <h2 class="cm3__ttl">${product.title}</h2>
                            <div class="cm3__rat">
                                ${IC.star}
                                <span>${rv.rating}</span>
                                <span style="color:var(--color-muted);font-weight:400;font-size:.78rem;">
                                    (${rv.count})
                                </span>
                            </div>
                        </div>
                        <div class="cm3__pb">
                            <div class="cm3__price">${priceDisplay || '—'}</div>
                            ${oldPriceDisplay ? `<div class="cm3__old">${oldPriceDisplay}</div>` : ''}
                            ${disc > 0 ? `<div class="cm3__dtag">-${disc}%</div>` : ''}
                            ${prepayDisplay ? `<div class="cm3__prep">Предоплата: ${prepayDisplay}</div>` : ''}
                        </div>
                    </div>

                    ${product.executor ? `
                    <div class="cm3__exec">
                        <div class="cm3__eav">${IC.user}</div>
                        <div>
                            <div class="cm3__ename">${product.executor}</div>
                            <div class="cm3__erole">${product.executorRole || ''}</div>
                        </div>
                    </div>` : ''}

                    ${product.description ? `<div class="cm3__desc">${product.description}</div>` : ''}

                    ${product.features && product.features.length ? `
                    <div class="cm3__feats">
                        ${product.features.map(f => `
                        <div class="cm3__feat">
                            <div class="cm3__fic">${IC.check}</div>
                            <span>${f}</span>
                        </div>`).join('')}
                    </div>` : ''}

                    ${!regionSelected ? `
                    <div class="c3-region-warn">
                        ⚠️ Выберите регион в <a onclick="Catalog.closeModal();App.showPage('profile')">профиле</a>, чтобы оформить заказ
                    </div>` : ''}

                    <div class="cm3__acts">
                        <button class="cm3__cbuy" id="cm3Buy" onclick="Catalog._buy()" ${!regionSelected ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
                            ${regionSelected ? `В корзину — ${priceDisplay}` : 'Сначала выберите регион'}
                        </button>
                        <button class="cm3__cfav ${fav ? 'on' : ''}" id="cm3Fav"
                                onclick="Catalog.toggleModalFav()">
                            ${IC.heart}
                        </button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => modal.classList.add('open'));

        if (typeof Cart !== 'undefined' && Cart.isInCart && Cart.isInCart(product.id)) {
            const b = document.getElementById('cm3Buy');
            if (b) { b.textContent = '✓ В корзине'; b.style.opacity = '.7'; }
        }
    }

    function _sw(i) {
        if (!currentProduct || !currentProduct.media) return;
        const m = currentProduct.media[i];
        if (!m) return;
        const gal = document.getElementById('cm3Gal');
        if (!gal) return;
        gal.innerHTML = m.type === 'video'
            ? `<video src="${m.url}" controls autoplay style="width:100%;height:100%;object-fit:cover;"></video>`
            : `<img src="${m.url}" style="width:100%;height:100%;object-fit:cover;">`;
        document.querySelectorAll('.cm3__th').forEach((t, j) => t.classList.toggle('on', j === i));
    }

    function _buy() {
        if (!currentProduct) return;
        // Проверка региона
        if (!getUserRegion()) {
            App.showToast('Сначала выберите регион в профиле', 'warning');
            return;
        }
        if (typeof Cart !== 'undefined' && typeof Cart.addItem === 'function') {
            Cart.addItem(currentProduct.id);
        }
        const b = document.getElementById('cm3Buy');
        if (b) { b.textContent = '✓ В корзине'; b.style.opacity = '.7'; }
    }

    function closeModal() {
        const m = document.getElementById('cm3Modal');
        if (!m) return;
        m.classList.remove('open');
        setTimeout(() => m.remove(), 320);
        document.body.style.overflow = '';
        currentProduct = null;
    }

    function toggleModalFav() {
        if (!currentProduct) return;
        toggleFavorite(currentProduct.id);
        const on = typeof App !== 'undefined' && App.isFavorite(currentProduct.id);
        document.getElementById('cm3Fav')?.classList.toggle('on', on);
    }

    /* ─────────────────────────────────────────
       SEARCH / FILTER
       ───────────────────────────────────────── */

    function handleSearch(q) {
        searchQuery = q;
        if (q.length >= 2 && typeof Admin !== 'undefined' && Admin._analytics)
            Admin._analytics.track('search', { query: q });
        renderCatalog();
    }

    function setFilter(f) {
        currentFilter = f;
        document.querySelectorAll('.catalog-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.filter === f));
        renderCatalog();
    }

    function resetFilters() {
        currentFilter = 'all';
        searchQuery   = '';
        const si = document.querySelector('.catalog-search__input');
        if (si) si.value = '';
        document.querySelectorAll('.catalog-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.filter === 'all'));
        renderCatalog();
    }

    /* ─────────────────────────────────────────
       SCROLL REVEAL
       ───────────────────────────────────────── */

    function reveal(container) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        (container || document).querySelectorAll('.reveal').forEach(el => obs.observe(el));
    }

    /* ─────────────────────────────────────────
       ANIMATED PLACEHOLDER
       ───────────────────────────────────────── */

    function initPlaceholder() {
        const inp  = document.querySelector('.catalog-search__input');
        const span = document.querySelector('.catalog-search__placeholder-text');
        if (!inp || !span) return;

        if (_placeholderTimer) {
            clearTimeout(_placeholderTimer);
            _placeholderTimer = null;
        }

        if (_placeholderInputEl && _placeholderHandlers) {
            _placeholderInputEl.removeEventListener('focus', _placeholderHandlers.onFocus);
            _placeholderInputEl.removeEventListener('blur', _placeholderHandlers.onBlur);
            _placeholderInputEl.removeEventListener('input', _placeholderHandlers.onInput);
        }

        _placeholderInputEl = inp;

        const texts = ['Поиск услуг и товаров...', 'Веб-разработка, дизайн...', 'Видеомонтаж, маркетинг...'];
        let ci = 0, chi = 0, del = false;

        function syncVisibility() {
            const hide = document.activeElement === inp || !!inp.value;
            span.classList.toggle('is-hidden', hide);
        }

        function tick() {
            syncVisibility();
            if (span.classList.contains('is-hidden')) {
                _placeholderTimer = setTimeout(tick, 450);
                return;
            }

            const t = texts[ci];
            if (!del) {
                span.textContent = t.slice(0, ++chi);
                if (chi >= t.length) {
                    _placeholderTimer = setTimeout(() => { del = true; tick(); }, 2400);
                    return;
                }
                _placeholderTimer = setTimeout(tick, 70);
            } else {
                span.textContent = t.slice(0, --chi);
                if (chi <= 0) {
                    del = false;
                    ci = (ci + 1) % texts.length;
                    _placeholderTimer = setTimeout(tick, 400);
                    return;
                }
                _placeholderTimer = setTimeout(tick, 34);
            }
        }

        const onFocus = () => syncVisibility();
        const onInput = () => syncVisibility();
        const onBlur = () => {
            if (!inp.value) {
                chi = 0;
                del = false;
                if (_placeholderTimer) clearTimeout(_placeholderTimer);
                _placeholderTimer = setTimeout(tick, 450);
            }
            syncVisibility();
        };

        _placeholderHandlers = { onFocus, onBlur, onInput };
        inp.addEventListener('focus', onFocus);
        inp.addEventListener('input', onInput);
        inp.addEventListener('blur', onBlur);

        syncVisibility();
        _placeholderTimer = setTimeout(tick, 1200);
    }

    /* ─────────────────────────────────────────
       INIT
       ───────────────────────────────────────── */

    function init() {
        injectStyles();

        /* tabs */
        const tabsWrap = document.querySelector('.catalog-tabs');
        if (tabsWrap) {
            tabsWrap.innerHTML = CATEGORIES.map(c =>
                `<button class="catalog-tab ${c.slug === currentFilter ? 'active' : ''}"
                         data-filter="${c.slug}">${c.name}</button>`
            ).join('');
            tabsWrap.querySelectorAll('.catalog-tab').forEach(t =>
                t.addEventListener('click', () => setFilter(t.dataset.filter)));
        }

        renderCatalog();

        // Подтягиваем свежие счётчики отзывов с сервера, чтобы в каталоге не оставался (0)
        if (typeof ReviewCounts !== 'undefined' && typeof ReviewCounts.fetchCounts === 'function') {
            ReviewCounts.fetchCounts().then(() => {
                try {
                    const counts = JSON.parse(localStorage.getItem('tish_review_counts') || '{}');
                    if (typeof ReviewCounts.applyCounts === 'function') {
                        ReviewCounts.applyCounts(counts);
                    }
                } catch {}
            }).catch(() => {});
        }

        const si = document.querySelector('.catalog-search__input');
        if (si) {
            if (si._catalogSearchDebounceHandler) {
                si.removeEventListener('input', si._catalogSearchDebounceHandler);
            }
            let deb;
            const onSearchInput = (e) => {
                clearTimeout(deb);
                deb = setTimeout(() => handleSearch(e.target.value), 280);
            };
            si._catalogSearchDebounceHandler = onSearchInput;
            si.addEventListener('input', onSearchInput);
        }

        document.addEventListener('closeModals', closeModal);
        initPlaceholder();
        reveal();
    }

    document.addEventListener('favoritesChanged', () => {
        if (typeof Navigation !== 'undefined' && Navigation.getCurrentPage &&
            Navigation.getCurrentPage() === 'favorites')
            renderFavorites();
    });

    /* ─────────────────────────────────────────
       PUBLIC API
       ───────────────────────────────────────── */
    return {
        init,
        renderCatalog,
        renderFavorites,
        toggleFavorite,
        openModal,
        closeModal,
        toggleModalFav,
        toggleModalFavorite: toggleModalFav,
        setFilter,
        resetFilters,
        getProducts: loadAll,
        getUserRegion,
        getUserCurrency,
        getProductPrice,
        formatPrice,
        _sw,
        _buy,
        _switchMedia: _sw,
        _buyFromModal: _buy
    };

})();