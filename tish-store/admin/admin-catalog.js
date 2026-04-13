/* =====================================================
   ADMIN — Catalog/Products FULL v3.1
   UPDATED: Dual pricing (RUB + USD)
   ===================================================== */

((Admin) => {

    const PRODUCTS_KEY = 'tish_admin_products';

    const CATEGORIES = [
        { slug: 'web',       name: 'Веб / IT'   },
        { slug: 'design',    name: 'Дизайн'     },
        { slug: 'video',     name: 'Видео'      },
        { slug: 'marketing', name: 'Маркетинг'  }
    ];
    const FX_RUB_PER_USD = 90;

    function escInlineId(value) {
        return String(value ?? '')
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
    }

    function toMoney(value) {
        const num = Number(value);
        if (!Number.isFinite(num) || num <= 0) return 0;
        return Math.round(num);
    }

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

    function load() {
        try {
            let raw = null;
            if (typeof Admin !== 'undefined' && typeof Admin.getProducts === 'function') {
                raw = Admin.getProducts();
            } else if (typeof Storage !== 'undefined' && typeof Storage.get === 'function') {
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

    function save(arr) {
        const normalized = normalizeProducts(arr);
        if (typeof Admin !== 'undefined' && typeof Admin.saveProducts === 'function') {
            Admin.saveProducts(normalized);
            return;
        }

        if (typeof Storage !== 'undefined' && typeof Storage.setNow === 'function') {
            Storage.setNow(PRODUCTS_KEY, normalized).catch(() => {
                if (typeof Storage.set === 'function') Storage.set(PRODUCTS_KEY, normalized);
            });
            return;
        }

        if (typeof Storage !== 'undefined' && typeof Storage.set === 'function') {
            Storage.set(PRODUCTS_KEY, normalized);
            return;
        }

        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(normalized));
    }

    function rerenderProductsTab() {
        const content = document.getElementById('adminTabContent');
        if (content) {
            renderProductsTab(content);
            return;
        }
        if (typeof Admin !== 'undefined' && typeof Admin.render === 'function') {
            Admin.render();
        }
    }

    function fmtPrice(v, currency) {
        const n = Number(v || 0);
        if (currency === 'USD') return '$' + n.toLocaleString('en-US');
        return n.toLocaleString('ru-RU') + ' ₽';
    }

    function getReviewStats(pid, title) {
        try {
            const countsRaw = localStorage.getItem('tish_review_counts');
            const counts = countsRaw ? JSON.parse(countsRaw) : {};
            const data = counts[String(pid)] || counts[String(title)] || null;
            if (data && Number(data.count) > 0) {
                return {
                    rating: Number(data.avgRating) || 5.0,
                    count: Number(data.count) || 0
                };
            }
        } catch { return { rating: 5.0, count: 0 }; }
        return { rating: 5.0, count: 0 };
    }

    let pendingMedia = [];

    async function uploadFiles(fileList) {
        const files = Array.from(fileList);
        if (!files.length) return [];
        try {
            const fd = new FormData();
            files.forEach(f => fd.append('files', f));
            const res = await fetch('/api/store/upload', { method: 'POST', body: fd });
            if (!res.ok) throw new Error('err');
            const data = await res.json();
            return data.files || [];
        } catch (e) {
            console.warn('Сервер недоступен, base64 fallback');
            const results = [];
            for (const file of files) {
                if (file.type.startsWith('video')) {
                    App.showToast('Для видео запустите: node server.js', 'warning');
                    continue;
                }
                const url = await new Promise(resolve => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result);
                    r.readAsDataURL(file);
                });
                results.push({ url, name: file.name, type: 'image', size: file.size, filename: 'base64' });
            }
            return results;
        }
    }

    // ─── Таблица товаров ───
    function renderProductsTab(c) {
        const products = load();
        c.innerHTML = `
            <div class="admin-card__header" style="margin-bottom:20px;">
                <h3 class="admin-card__title">🛍️ Товары (${products.length})</h3>
                <button class="btn btn-primary btn-sm" onclick="Admin.openProductEditor()">+ Добавить товар</button>
            </div>
            ${products.length === 0
                ? '<div class="admin-empty"><p>Нет товаров. Нажмите "+ Добавить товар"</p></div>'
                : `<div class="admin-table-wrapper"><table class="admin-table">
                    <thead><tr>
                        <th></th><th>Товар</th><th>Категория</th>
                        <th>Цена ₽</th><th>Цена $</th><th>★</th><th></th>
                    </tr></thead>
                    <tbody>${products.map(p => {
                        const rv = getReviewStats(p.id, p.title);
                        const safeId = escInlineId(p.id);
                        const hasImg = p.media && p.media.length > 0 && p.media[0].type === 'image';
                        const thumb = hasImg
                            ? `<img src="${p.media[0].url}" style="width:56px;height:32px;object-fit:cover;border-radius:6px;display:block;">`
                            : `<div style="width:56px;height:32px;border-radius:6px;background:${p.gradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)'};"></div>`;
                        return `<tr>
                            <td style="width:70px;">${thumb}</td>
                            <td>
                                <div style="font-weight:700;">${p.title}</div>
                                <div style="font-size:0.72rem;color:var(--color-muted);">${p.executor || '—'}</div>
                            </td>
                            <td style="font-size:0.82rem;">${p.category || '—'}</td>
                            <td>
                                <strong>${fmtPrice(p.priceRub || p.price, 'RUB')}</strong>
                                ${p.oldPriceRub ? `<br><s style="color:var(--color-muted);font-size:0.72rem;">${fmtPrice(p.oldPriceRub, 'RUB')}</s>` : ''}
                            </td>
                            <td>
                                <strong>${fmtPrice(p.priceUsd, 'USD')}</strong>
                                ${p.oldPriceUsd ? `<br><s style="color:var(--color-muted);font-size:0.72rem;">${fmtPrice(p.oldPriceUsd, 'USD')}</s>` : ''}
                            </td>
                            <td style="color:#f59e0b;">★ ${rv.rating} <span style="font-size:0.65rem;color:var(--color-muted);">(${rv.count})</span></td>
                            <td>
                                <div style="display:flex;gap:4px;">
                                    <button class="admin-table-btn" onclick="Admin.openProductEditor('${safeId}')" title="Изменить">
                                        ${Admin.ic('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>')}
                                    </button>
                                    <button class="admin-table-btn admin-table-btn--danger" onclick="Admin.deleteProduct('${safeId}')">
                                        ${Admin.ic('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>')}
                                    </button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}</tbody>
                </table></div>`
            }`;
    }

    function renderThumbs(arr) {
        if (!arr || !arr.length) return '<div style="font-size:0.78rem;color:var(--color-muted);">Нет медиа</div>';
        return arr.map((m, i) => `
            <div style="position:relative;width:110px;height:62px;border-radius:8px;overflow:hidden;border:1px solid var(--color-border-soft);flex-shrink:0;">
                ${m.type === 'video'
                    ? `<video src="${m.url}" style="width:100%;height:100%;object-fit:cover;" muted></video>
                       <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:22px;height:22px;background:rgba(0,0,0,0.5);border-radius:50%;display:flex;align-items:center;justify-content:center;">
                           <span style="color:white;font-size:8px;margin-left:2px;">▶</span>
                       </div>`
                    : `<img src="${m.url}" style="width:100%;height:100%;object-fit:cover;">`
                }
                <button onclick="Admin._peRemoveMedia(${i})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:#ef4444;border:none;color:white;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>
            </div>
        `).join('');
    }

    function extractColor(gradient, index) {
        if (!gradient) return null;
        const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
        return matches ? matches[index] || null : null;
    }

    // ─── Редактор товара — UPDATED with dual pricing ───
    function openProductEditor(id) {
        const all = load();
        const isEdit = id !== null && id !== undefined;
        const p = isEdit ? (all.find(x => String(x.id) === String(id)) || {}) : {};
        pendingMedia = p.media ? [...p.media] : [];

        Admin.showAdminModal({
            title: isEdit ? '✏️ Редактировать товар' : '➕ Новый товар',
            width: '720px',
            body: `
            <div id="peForm">

                <h4 style="font-size:0.82rem;font-weight:700;margin-bottom:10px;color:var(--purple-600);">📋 Основное</h4>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">Название *</label>
                        <input class="input" id="pe_title" value="${p.title || ''}" placeholder="Лендинг под ключ">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Категория *</label>
                        <select class="input" id="pe_cat">
                            ${CATEGORIES.map(c => `<option value="${c.slug}" ${p.categorySlug === c.slug ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="admin-form-group">
                    <label class="admin-form-label">Описание</label>
                    <textarea class="textarea" id="pe_desc" rows="3" placeholder="Подробное описание...">${p.description || ''}</textarea>
                </div>

                <h4 style="font-size:0.82rem;font-weight:700;margin:14px 0 10px;color:var(--purple-600);">👤 Исполнитель</h4>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">Имя</label>
                        <input class="input" id="pe_exec" value="${p.executor || ''}" placeholder="Иван Иванов">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Должность</label>
                        <input class="input" id="pe_execRole" value="${p.executorRole || ''}" placeholder="Senior Developer">
                    </div>
                </div>

                <h4 style="font-size:0.82rem;font-weight:700;margin:14px 0 10px;color:var(--purple-600);">💰 Цены (обе обязательны!)</h4>
                <p style="font-size:0.75rem;color:var(--color-muted);margin-bottom:10px;">Рубли показываются пользователям из РФ, доллары — всем остальным</p>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:14px;background:rgba(139,92,246,0.04);border-radius:12px;border:1px solid rgba(139,92,246,0.1);margin-bottom:14px;">
                    <div>
                        <h5 style="font-size:0.78rem;font-weight:700;color:#ef4444;margin-bottom:8px;">🇷🇺 Цена в рублях (₽)</h5>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Цена (₽) *</label>
                            <input type="number" class="input" id="pe_priceRub" value="${p.priceRub || p.price || ''}" placeholder="15000" min="0">
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Старая цена (₽)</label>
                            <input type="number" class="input" id="pe_oldPriceRub" value="${p.oldPriceRub || p.oldPrice || ''}" placeholder="25000" min="0">
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Предоплата (₽)</label>
                            <input type="number" class="input" id="pe_prepayRub" value="${p.prepayPriceRub || p.prepayPrice || ''}" placeholder="5000" min="0">
                        </div>
                    </div>
                    <div>
                        <h5 style="font-size:0.78rem;font-weight:700;color:#3b82f6;margin-bottom:8px;">🌍 Цена в долларах ($)</h5>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Цена ($) *</label>
                            <input type="number" class="input" id="pe_priceUsd" value="${p.priceUsd || ''}" placeholder="150" min="0">
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Старая цена ($)</label>
                            <input type="number" class="input" id="pe_oldPriceUsd" value="${p.oldPriceUsd || ''}" placeholder="250" min="0">
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Предоплата ($)</label>
                            <input type="number" class="input" id="pe_prepayUsd" value="${p.prepayPriceUsd || ''}" placeholder="50" min="0">
                        </div>
                    </div>
                </div>

                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">Бейдж</label>
                        <select class="input" id="pe_badge">
                            <option value="" ${!p.badge?'selected':''}>— Нет —</option>
                            <option value="new" ${p.badge==='new'?'selected':''}>NEW</option>
                            <option value="hot" ${p.badge==='hot'?'selected':''}>HOT</option>
                            <option value="sale" ${p.badge==='sale'?'selected':''}>SALE</option>
                        </select>
                    </div>
                </div>

                <h4 style="font-size:0.82rem;font-weight:700;margin:14px 0 10px;color:var(--purple-600);">✨ Фичи (через запятую)</h4>
                <div class="admin-form-group">
                    <input class="input" id="pe_features" value="${(p.features || []).join(', ')}" placeholder="Адаптив, Тёмная тема, Поддержка 24/7">
                </div>

                <h4 style="font-size:0.82rem;font-weight:700;margin:14px 0 10px;color:var(--purple-600);">🎨 Цвет карточки (если нет фото)</h4>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">Цвет 1</label>
                        <input type="color" id="pe_c1" value="${extractColor(p.gradient, 0) || '#8b5cf6'}" style="width:100%;height:38px;border:none;border-radius:8px;cursor:pointer;">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Цвет 2</label>
                        <input type="color" id="pe_c2" value="${extractColor(p.gradient, 1) || '#d946ef'}" style="width:100%;height:38px;border:none;border-radius:8px;cursor:pointer;">
                    </div>
                </div>

                <h4 style="font-size:0.82rem;font-weight:700;margin:14px 0 10px;color:var(--purple-600);">📸 Фото / Видео</h4>
                <div id="pe_dropZone"
                     style="border:2px dashed var(--color-border);border-radius:12px;padding:20px;text-align:center;cursor:pointer;position:relative;transition:0.3s;"
                     ondragover="event.preventDefault();this.style.borderColor='var(--purple-500)';this.style.background='rgba(139,92,246,0.04)'"
                     ondragleave="this.style.borderColor='var(--color-border)';this.style.background=''"
                     ondrop="event.preventDefault();this.style.borderColor='var(--color-border)';this.style.background='';Admin._peUpload(event.dataTransfer.files)">
                    <div style="font-size:1.8rem;margin-bottom:6px;">📁</div>
                    <div style="font-weight:600;">Перетащите или нажмите</div>
                    <div style="font-size:0.72rem;color:var(--color-muted);margin-top:4px;">JPG, PNG, WEBP, MP4, WEBM · до 100MB</div>
                    <input type="file" multiple accept="image/*,video/*"
                           style="position:absolute;inset:0;opacity:0;cursor:pointer;"
                           onchange="Admin._peUpload(this.files)">
                </div>
                <div id="pe_mediaPreviews" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                    ${renderThumbs(pendingMedia)}
                </div>

                <div class="admin-form-group" style="margin-top:14px;">
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" id="pe_active" ${p.active !== false ? 'checked' : ''}>
                        <span style="font-size:0.85rem;font-weight:600;">Показывать в каталоге</span>
                    </label>
                </div>

            </div>
            `,
            confirmText: isEdit ? 'Сохранить' : 'Создать',
            onConfirm: () => saveFromForm(isEdit ? id : null)
        });
    }

    async function peUpload(files) {
        if (!files || !files.length) return;
        const zone = document.getElementById('pe_dropZone');
        if (zone) zone.style.opacity = '0.5';
        App.showToast('Загрузка...', 'info');
        const uploaded = await uploadFiles(files);
        pendingMedia.push(...uploaded);
        const grid = document.getElementById('pe_mediaPreviews');
        if (grid) grid.innerHTML = renderThumbs(pendingMedia);
        if (zone) zone.style.opacity = '1';
        if (uploaded.length) App.showToast(`✅ ${uploaded.length} файл(ов) загружено`, 'success');
    }

    function peRemoveMedia(i) {
        const removed = pendingMedia.splice(i, 1)[0];
        if (removed && removed.filename && removed.filename !== 'base64') {
            fetch(`/api/store/upload/${removed.filename}`, { method: 'DELETE' }).catch(() => {});
        }
        const grid = document.getElementById('pe_mediaPreviews');
        if (grid) grid.innerHTML = renderThumbs(pendingMedia);
    }

    function saveFromForm(editId) {
        const title = document.getElementById('pe_title')?.value?.trim();
        if (!title) { App.showToast('Введите название', 'warning'); return; }

        const inputPriceRub = toMoney(document.getElementById('pe_priceRub')?.value);
        const inputPriceUsd = toMoney(document.getElementById('pe_priceUsd')?.value);

        if (!inputPriceRub && !inputPriceUsd) {
            App.showToast('Укажите цену хотя бы в одной валюте', 'warning');
            return;
        }

        const priceRub = inputPriceRub || Math.max(1, Math.round(inputPriceUsd * FX_RUB_PER_USD));
        const priceUsd = inputPriceUsd || Math.max(1, Math.round(priceRub / FX_RUB_PER_USD));

        const catSlug   = document.getElementById('pe_cat')?.value || 'web';
        const catObj    = CATEGORIES.find(c => c.slug === catSlug);

        const oldPriceRubInput = toMoney(document.getElementById('pe_oldPriceRub')?.value);
        const oldPriceUsdInput = toMoney(document.getElementById('pe_oldPriceUsd')?.value);
        const prepayPriceRubInput = toMoney(document.getElementById('pe_prepayRub')?.value);
        const prepayPriceUsdInput = toMoney(document.getElementById('pe_prepayUsd')?.value);

        const oldPriceRub = oldPriceRubInput > priceRub ? oldPriceRubInput : null;
        const oldPriceUsd = oldPriceUsdInput > priceUsd ? oldPriceUsdInput : null;
        const prepayPriceRub = prepayPriceRubInput || Math.ceil(priceRub * 0.3);
        const prepayPriceUsd = prepayPriceUsdInput || Math.ceil(priceUsd * 0.3);
        
        const c1      = document.getElementById('pe_c1')?.value || '#8b5cf6';
        const c2      = document.getElementById('pe_c2')?.value || '#d946ef';
        const featStr = document.getElementById('pe_features')?.value?.trim() || '';

        const product = {
            id:            editId || ('prod_' + Date.now().toString(36).toUpperCase()),
            title,
            category:      catObj ? catObj.name : 'Веб / IT',
            categorySlug:  catSlug,
            // Dual pricing
            price:         priceRub,           // backward compat
            priceRub:      priceRub,
            priceUsd:      priceUsd,
            oldPrice:      oldPriceRub,
            oldPriceRub:   oldPriceRub,
            oldPriceUsd:   oldPriceUsd,
            prepayPrice:   prepayPriceRub,
            prepayPriceRub: prepayPriceRub,
            prepayPriceUsd: prepayPriceUsd,
            executor:      document.getElementById('pe_exec')?.value?.trim() || '',
            executorRole:  document.getElementById('pe_execRole')?.value?.trim() || '',
            description:   document.getElementById('pe_desc')?.value?.trim() || '',
            badge:         document.getElementById('pe_badge')?.value || null,
            features:      featStr ? featStr.split(',').map(s => s.trim()).filter(Boolean) : [],
            gradient:      `linear-gradient(135deg, ${c1}, ${c2})`,
            media:         [...pendingMedia],
            active:        document.getElementById('pe_active')?.checked !== false,
            rating:        5,
            sales:         0,
            createdAt:     new Date().toISOString()
        };

        const products = load();

        if (editId) {
            const idx = products.findIndex(x => String(x.id) === String(editId));
            if (idx !== -1) {
                product.sales     = products[idx].sales || 0;
                product.createdAt = products[idx].createdAt;
                products[idx]     = product;
            }
        } else {
            products.unshift(product);
        }

        save(products);
        Admin.logAction(editId ? 'Товар изменён' : 'Товар создан', title);
        Admin.closeAdminModal();
        App.showToast(`"${title}" ${editId ? 'обновлён' : 'создан'}!`, 'success');
        rerenderProductsTab();

        if (typeof Catalog !== 'undefined' && Catalog.renderCatalog) Catalog.renderCatalog();
    }

    function deleteProduct(id) {
        if (!confirm('Удалить товар?')) return;
        const products = load();
        const p = products.find(x => String(x.id) === String(id));
        if (p && p.media) {
            p.media.forEach(m => {
                if (m.filename && m.filename !== 'base64') {
                    fetch(`/api/store/upload/${m.filename}`, { method: 'DELETE' }).catch(() => {});
                }
            });
        }
        save(products.filter(x => String(x.id) !== String(id)));
        Admin.logAction('Товар удалён', p?.title);
        App.showToast('Удалён', 'info');
        rerenderProductsTab();
        if (typeof Catalog !== 'undefined' && Catalog.renderCatalog) Catalog.renderCatalog();
    }

    // ─── Регистрация ───
    Admin.registerTab('products', renderProductsTab);
    Admin.openProductEditor  = openProductEditor;
    Admin.deleteProduct      = deleteProduct;
    Admin._peUpload          = peUpload;
    Admin._peRemoveMedia     = peRemoveMedia;
    Admin.openAddProduct     = openProductEditor;
    Admin.closeProductModal  = () => {};
    Admin.saveProduct        = () => {};

})(Admin);