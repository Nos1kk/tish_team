/* =====================================================
   ADMIN - TISHARA SHOP MODULE
   ===================================================== */

((Admin) => {
    const DEFAULT_PRODUCTS = [
        { id: 'd3', name: 'Скидка 3%', percent: 3, cost: 100, icon: 'tag', description: 'Персональный промокод', active: true },
        { id: 'd5', name: 'Скидка 5%', percent: 5, cost: 150, icon: 'tag', description: 'Персональный промокод', active: true },
        { id: 'd7', name: 'Скидка 7%', percent: 7, cost: 200, icon: 'zap', description: 'Персональный промокод', active: true },
    ];

    const ICONS = {
        tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
        zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
        percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'
    };

    function esc(v) {
        return String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toInt(v, fallback = 0) {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : fallback;
    }

    function normalizeItem(raw, index) {
        const percent = toInt(raw?.percent, 0);
        const cost = toInt(raw?.cost, 0);
        if (percent <= 0 || cost <= 0) return null;
        return {
            id: String(raw?.id || ('shop_' + (index + 1))),
            name: String(raw?.name || ('Скидка ' + percent + '%')).trim() || ('Скидка ' + percent + '%'),
            percent,
            cost,
            icon: String(raw?.icon || 'tag'),
            description: String(raw?.description || 'Персональный промокод').trim() || 'Персональный промокод',
            active: raw?.active !== false
        };
    }

    function getItems() {
        const src = Admin.getTisharaShopProducts();
        const normalized = (Array.isArray(src) ? src : []).map(normalizeItem).filter(Boolean);
        return normalized;
    }

    function saveItems(items) {
        const normalized = (Array.isArray(items) ? items : []).map(normalizeItem).filter(Boolean);
        Admin.saveTisharaShopProducts(normalized);
    }

    function renderTab(c) {
        const items = getItems();
        const activeCount = items.filter((i) => i.active).length;

        c.innerHTML = `
            <div class="admin-card">
                <div class="admin-card__header" style="margin-bottom:18px;">
                    <h3 class="admin-card__title">✦ Магазин TISHARA (${items.length})</h3>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-ghost btn-sm" onclick="Admin.resetTisharaShopDefaults()">Сбросить по умолчанию</button>
                        <button class="btn btn-primary btn-sm" onclick="Admin.openTisharaShopEditor()">+ Добавить товар</button>
                    </div>
                </div>

                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
                    <span class="admin-header__badge">Активно: ${activeCount}</span>
                    <span class="admin-header__badge">Лимит: 1 покупка в месяц</span>
                    <span class="admin-header__badge">Коды: персональные</span>
                </div>

                ${items.length === 0 ? `
                    <div class="admin-empty"><p>Товары отсутствуют. Добавьте первый товар в магазин TISHARA.</p></div>
                ` : `
                    <div class="admin-table-wrapper">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Товар</th>
                                    <th>Скидка</th>
                                    <th>Цена (✦)</th>
                                    <th>Статус</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((item) => `
                                    <tr>
                                        <td>
                                            <div class="admin-product-cell">
                                                <div class="admin-product-cell__preview" style="background:linear-gradient(135deg,#8b5cf6,#d946ef)">
                                                    ${Admin.ic(ICONS[item.icon] || ICONS.tag)}
                                                </div>
                                                <div>
                                                    <div class="admin-product-cell__name">${esc(item.name)}</div>
                                                    <div style="font-size:0.72rem;color:var(--color-muted);">${esc(item.description)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><strong>${item.percent}%</strong></td>
                                        <td>${item.cost}</td>
                                        <td>
                                            <span style="padding:4px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${item.active ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)'};color:${item.active ? '#22c55e' : '#6b7280'};">
                                                ${item.active ? '✅ Активен' : '⏸ Выключен'}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="admin-table-actions">
                                                <button class="admin-table-btn" title="Редактировать" onclick="Admin.openTisharaShopEditor('${esc(item.id)}')">${Admin.ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>')}</button>
                                                <button class="admin-table-btn" title="Вкл/выкл" onclick="Admin.toggleTisharaShopItem('${esc(item.id)}')">${Admin.ic('<path d="M12 2v20"/><path d="M5 7.5a7 7 0 1 0 14 0"/>')}</button>
                                                <button class="admin-table-btn admin-table-btn--danger" title="Удалить" onclick="Admin.removeTisharaShopItem('${esc(item.id)}')">${Admin.ic('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>')}</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>`;
    }

    function openEditor(id) {
        const items = getItems();
        const current = id ? items.find((x) => String(x.id) === String(id)) : null;

        const iconOptions = Object.keys(ICONS).map((key) =>
            `<option value="${key}" ${String(current?.icon || 'tag') === key ? 'selected' : ''}>${key}</option>`
        ).join('');

        Admin.showAdminModal({
            title: current ? '✦ Редактировать товар TISHARA' : '✦ Новый товар TISHARA',
            width: '620px',
            body: `
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">Название *</label>
                        <input type="text" class="input" id="tsName" placeholder="Скидка 5%" value="${esc(current?.name || '')}">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Иконка</label>
                        <select class="input" id="tsIcon">${iconOptions}</select>
                    </div>
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group">
                        <label class="admin-form-label">Скидка % *</label>
                        <input type="number" class="input" id="tsPercent" min="1" max="99" value="${toInt(current?.percent, 0) || ''}" placeholder="5">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Цена в TISHARA *</label>
                        <input type="number" class="input" id="tsCost" min="1" value="${toInt(current?.cost, 0) || ''}" placeholder="150">
                    </div>
                </div>
                <div class="admin-form-group">
                    <label class="admin-form-label">Описание</label>
                    <input type="text" class="input" id="tsDescription" value="${esc(current?.description || 'Персональный промокод')}" placeholder="Персональный промокод">
                </div>
                <div style="font-size:0.75rem;color:var(--color-muted);padding:10px;border-radius:10px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);line-height:1.5;">
                    В магазине действует глобальный лимит: 1 покупка в месяц на пользователя. Код для скидки генерируется индивидуально.
                </div>
            `,
            confirmText: current ? 'Сохранить' : 'Добавить',
            onConfirm: () => {
                const name = String(document.getElementById('tsName')?.value || '').trim();
                const percent = toInt(document.getElementById('tsPercent')?.value, 0);
                const cost = toInt(document.getElementById('tsCost')?.value, 0);
                const icon = String(document.getElementById('tsIcon')?.value || 'tag');
                const description = String(document.getElementById('tsDescription')?.value || '').trim() || 'Персональный промокод';

                if (!name) { App.showToast('Введите название товара', 'warning'); return; }
                if (percent < 1 || percent > 99) { App.showToast('Скидка должна быть от 1 до 99%', 'warning'); return; }
                if (cost <= 0) { App.showToast('Цена должна быть больше 0', 'warning'); return; }

                const updated = getItems();
                if (current) {
                    const idx = updated.findIndex((x) => String(x.id) === String(current.id));
                    if (idx >= 0) {
                        updated[idx] = {
                            ...updated[idx],
                            name,
                            percent,
                            cost,
                            icon,
                            description
                        };
                    }
                } else {
                    updated.push({
                        id: 'shop_' + Date.now().toString(36).toUpperCase(),
                        name,
                        percent,
                        cost,
                        icon,
                        description,
                        active: true
                    });
                }

                saveItems(updated);
                Admin.logAction('TISHARA shop', `${current ? 'Обновлен' : 'Добавлен'}: ${name}`);
                Admin.closeAdminModal();
                App.showToast(`Товар "${name}" сохранен`, 'success');
                Admin.render();
                Admin.syncProfile();
            }
        });
    }

    function toggleItem(id) {
        const items = getItems();
        const idx = items.findIndex((x) => String(x.id) === String(id));
        if (idx < 0) return;
        items[idx].active = !items[idx].active;
        saveItems(items);
        Admin.logAction('TISHARA shop', `${items[idx].active ? 'Включен' : 'Выключен'}: ${items[idx].name}`);
        App.showToast(items[idx].active ? 'Товар включен' : 'Товар выключен', 'info');
        Admin.render();
        Admin.syncProfile();
    }

    function removeItem(id) {
        const items = getItems();
        const current = items.find((x) => String(x.id) === String(id));
        if (!current) return;

        Admin.showAdminModal({
            title: 'Удалить товар?',
            body: `<p style="margin:0;color:var(--color-muted);">Удалить товар <strong>${esc(current.name)}</strong> из магазина TISHARA?</p>`,
            confirmText: 'Удалить',
            onConfirm: () => {
                const next = items.filter((x) => String(x.id) !== String(id));
                saveItems(next);
                Admin.logAction('TISHARA shop', `Удален: ${current.name}`);
                Admin.closeAdminModal();
                App.showToast('Товар удален', 'info');
                Admin.render();
                Admin.syncProfile();
            }
        });
    }

    function resetDefaults() {
        saveItems(DEFAULT_PRODUCTS.map((item) => ({ ...item })));
        Admin.logAction('TISHARA shop', 'Ассортимент сброшен к значениям по умолчанию');
        App.showToast('Список товаров сброшен', 'success');
        Admin.render();
        Admin.syncProfile();
    }

    Admin.registerTab('tishara_shop', renderTab);
    Admin.openTisharaShopEditor = openEditor;
    Admin.toggleTisharaShopItem = toggleItem;
    Admin.removeTisharaShopItem = removeItem;
    Admin.resetTisharaShopDefaults = resetDefaults;
})(Admin);
