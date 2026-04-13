((Admin) => {
    const STORAGE_REFRESH_MS = 5000;
    let storagePollTimer = null;
    let storageRequestId = 0;
    let storageState = {
        loading: true,
        error: '',
        storage: null,
        files: [],
        history: []
    };

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function fmtBytes(value) {
        const bytes = Number(value || 0);
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let num = bytes;
        let idx = 0;
        while (num >= 1024 && idx < units.length - 1) {
            num /= 1024;
            idx++;
        }
        const fixed = num >= 100 || idx === 0 ? 0 : 1;
        return num.toFixed(fixed) + ' ' + units[idx];
    }

    function fmtPercent(value) {
        const n = Number(value || 0);
        if (!Number.isFinite(n)) return '0%';
        return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '') + '%';
    }

    function fmtHistoryDate(value) {
        if (!value) return '—';
        try {
            if (typeof Admin.fmtDateTime === 'function') {
                return Admin.fmtDateTime(value);
            }
        } catch {}
        try {
            return new Date(value).toLocaleString('ru-RU');
        } catch {
            return String(value);
        }
    }

    function stopStoragePolling() {
        if (storagePollTimer) {
            clearInterval(storagePollTimer);
            storagePollTimer = null;
        }
    }

    function isStorageSectionMounted() {
        return !!document.getElementById('adminStorageSection');
    }

    function renderStorageSection() {
        const el = document.getElementById('adminStorageSection');
        if (!el) return;

        if (storageState.loading) {
            el.innerHTML = '<div class="admin-empty"><p>Загрузка статистики хранилища...</p></div>';
            return;
        }

        if (storageState.error) {
            el.innerHTML = `
                <div class="admin-empty" style="text-align:left;">
                    <p style="margin:0 0 8px;color:#ef4444;">${escapeHtml(storageState.error)}</p>
                    <button class="btn btn-primary btn-sm" onclick="Admin.refreshStorageStats()">Повторить</button>
                </div>`;
            return;
        }

        const storage = storageState.storage || {};
        const files = Array.isArray(storageState.files) ? storageState.files : [];
        const history = Array.isArray(storageState.history) ? storageState.history : [];
        const usedBytes = Number(storage.usedBytes || 0);
        const maxBytes = Number(storage.maxBytes || 0);
        const remainingBytes = Number(storage.remainingBytes || 0);
        const fileCount = Number(storage.fileCount || 0);
        const usagePercent = Number(storage.usagePercent || 0);
        const avgFileSize = fileCount > 0 ? usedBytes / fileCount : 0;

        const storageHint = storage.dynamicLimit
            ? 'Максимум считается автоматически от свободного места диска и меняется динамически.'
            : 'Автоопределение лимита недоступно в этой среде.';

        const filesHtml = files.length === 0
            ? '<div class="admin-empty"><p>Пока нет загруженных файлов</p></div>'
            : files.slice(0, 20).map((item) => {
                const mime = escapeHtml(item.mimeType || (item.type === 'video' ? 'video/*' : 'image/*'));
                const uploadedAt = fmtHistoryDate(item.uploadedAt);
                return `
                    <div class="admin-list__item" style="padding:10px 0;align-items:flex-start;">
                        <div style="width:34px;height:34px;border-radius:8px;background:rgba(139,92,246,0.12);display:flex;align-items:center;justify-content:center;font-size:14px;">
                            ${item.type === 'video' ? '🎬' : '🖼️'}
                        </div>
                        <div style="flex:1;margin-left:10px;min-width:0;">
                            <div style="font-size:0.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.originalName || item.filename)}</div>
                            <div style="font-size:0.68rem;color:var(--color-muted);margin-top:2px;">${mime} • ${fmtBytes(item.size)} • ${uploadedAt}</div>
                        </div>
                    </div>`;
            }).join('');

        const historyHtml = history.length === 0
            ? '<div class="admin-empty"><p>История загрузок пока пустая</p></div>'
            : history.slice(0, 40).map((item) => {
                const isDelete = String(item.action || '').toLowerCase() === 'delete';
                const badgeBg = isDelete ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)';
                const badgeColor = isDelete ? '#ef4444' : '#16a34a';
                const badgeText = isDelete ? 'Удаление' : 'Загрузка';
                return `
                    <div class="admin-list__item" style="padding:8px 0;align-items:flex-start;">
                        <span style="padding:4px 8px;border-radius:999px;font-size:0.64rem;font-weight:700;background:${badgeBg};color:${badgeColor};">${badgeText}</span>
                        <div style="flex:1;margin-left:8px;min-width:0;">
                            <div style="font-size:0.78rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.originalName || item.filename || 'Файл')}</div>
                            <div style="font-size:0.68rem;color:var(--color-muted);margin-top:2px;">${fmtBytes(item.size)} • ${escapeHtml(item.mimeType || 'unknown')} • ${fmtHistoryDate(item.createdAt)}</div>
                        </div>
                    </div>`;
            }).join('');

        el.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px;">
                <div style="padding:10px;border:1px solid var(--color-border-soft);border-radius:12px;background:rgba(139,92,246,0.04);">
                    <div style="font-size:0.68rem;color:var(--color-muted);">Использовано</div>
                    <div style="font-size:0.95rem;font-weight:800;margin-top:4px;">${fmtBytes(usedBytes)}</div>
                </div>
                <div style="padding:10px;border:1px solid var(--color-border-soft);border-radius:12px;background:rgba(34,197,94,0.04);">
                    <div style="font-size:0.68rem;color:var(--color-muted);">Макс. доступно</div>
                    <div style="font-size:0.95rem;font-weight:800;margin-top:4px;">${fmtBytes(maxBytes)}</div>
                </div>
                <div style="padding:10px;border:1px solid var(--color-border-soft);border-radius:12px;background:rgba(59,130,246,0.04);">
                    <div style="font-size:0.68rem;color:var(--color-muted);">Свободно</div>
                    <div style="font-size:0.95rem;font-weight:800;margin-top:4px;">${fmtBytes(remainingBytes)}</div>
                </div>
                <div style="padding:10px;border:1px solid var(--color-border-soft);border-radius:12px;background:rgba(245,158,11,0.04);">
                    <div style="font-size:0.68rem;color:var(--color-muted);">Файлов</div>
                    <div style="font-size:0.95rem;font-weight:800;margin-top:4px;">${fileCount} • ср. ${fmtBytes(avgFileSize)}</div>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="height:12px;border-radius:999px;background:rgba(148,163,184,0.18);overflow:hidden;">
                    <div style="height:100%;width:${Math.min(100, Math.max(0, usagePercent))}%;background:linear-gradient(90deg,#22c55e,#3b82f6,#8b5cf6);transition:width .35s ease;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;gap:8px;margin-top:6px;font-size:0.72rem;color:var(--color-muted);">
                    <span>Заполнено: ${fmtPercent(usagePercent)}</span>
                    <span>${storageHint}</span>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div style="border:1px solid var(--color-border-soft);border-radius:12px;padding:10px;max-height:320px;overflow:auto;">
                    <h4 style="font-size:0.82rem;font-weight:800;margin-bottom:8px;">Текущие файлы (${files.length})</h4>
                    ${filesHtml}
                </div>
                <div style="border:1px solid var(--color-border-soft);border-radius:12px;padding:10px;max-height:320px;overflow:auto;">
                    <h4 style="font-size:0.82rem;font-weight:800;margin-bottom:8px;">История загрузок (${history.length})</h4>
                    ${historyHtml}
                </div>
            </div>`;
    }

    async function fetchStorageInfo(silent = false) {
        const reqId = ++storageRequestId;
        if (!silent) {
            storageState.loading = true;
            storageState.error = '';
            renderStorageSection();
        }

        try {
            const res = await fetch('/api/store/admin/storage');
            const json = await res.json();
            if (reqId !== storageRequestId) return;

            if (!res.ok || !json?.success) {
                throw new Error(json?.error || 'Не удалось получить данные хранилища');
            }

            storageState = {
                loading: false,
                error: '',
                storage: json.storage || null,
                files: Array.isArray(json.files) ? json.files : [],
                history: Array.isArray(json.history) ? json.history : []
            };
            renderStorageSection();
        } catch (e) {
            if (reqId !== storageRequestId) return;
            storageState.loading = false;
            storageState.error = e?.message || 'Ошибка загрузки данных';
            renderStorageSection();
        }
    }

    function startStoragePolling() {
        stopStoragePolling();
        fetchStorageInfo(false);

        storagePollTimer = setInterval(() => {
            if (!isStorageSectionMounted()) {
                stopStoragePolling();
                return;
            }
            fetchStorageInfo(true);
        }, STORAGE_REFRESH_MS);
    }

    function refreshStorageStats() {
        fetchStorageInfo(false);
    }

    function renderTab(c) {
        stopStoragePolling();

        const s = Admin.getSiteSettings();
        const p = Admin.getProfile();
        const discounts = p.discounts || [];
        c.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="admin-card">
                    <h3 class="admin-card__title" style="margin-bottom:14px;">🎨 Общие</h3>
                    <div class="admin-form-group"><label class="admin-form-label">Название</label><input type="text" class="input" id="sName" value="${s.siteName || 'TISH STORE'}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">SEO Title</label><input type="text" class="input" id="sSeoTitle" value="${s.seoTitle || ''}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">SEO Description</label><textarea class="textarea" id="sSeoDesc" rows="2">${s.seoDescription || ''}</textarea></div>
                    <button class="btn btn-primary btn-sm" onclick="Admin.saveSiteSettingsForm()">💾 Сохранить</button>
                </div>
                <div class="admin-card">
                    <h3 class="admin-card__title" style="margin-bottom:14px;">🎫 Промокоды</h3>
                    <div style="display:flex;gap:8px;margin-bottom:12px;">
                        <input type="text" class="input" id="promoName" placeholder="Название" style="flex:1;">
                        <input type="number" class="input" id="promoPercent" placeholder="%" style="width:60px;">
                        <button class="btn btn-primary btn-sm" onclick="Admin.createPromo()">+</button>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
                        ${[5, 10, 15, 20, 25, 50].map(v => `<button class="btn btn-ghost btn-sm" onclick="Admin.quickGift(${v})" style="font-size:0.72rem;">+${v}%</button>`).join('')}
                    </div>
                    <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:8px;">Активные (${discounts.filter(d => d.active).length})</h4>
                    ${discounts.length === 0 ? '<p class="admin-empty-text">Нет</p>' : discounts.map(d => `
                        <div class="admin-list__item" style="padding:8px 0;">
                            <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--purple-500),var(--magenta-500));color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.75rem;">${d.percent}%</div>
                            <div style="flex:1;margin-left:8px;"><div style="font-weight:700;font-size:0.82rem;">${d.name}</div><div style="font-size:0.68rem;color:var(--color-muted);">${d.code || '—'} • ${d.active ? '✅' : '❌'}</div></div>
                            <button class="admin-table-btn admin-table-btn--danger" onclick="Admin.removeGift(${d.id})">${Admin.ic('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>')}</button>
                        </div>`).join('')}
                </div>
            </div>

            <div class="admin-card" style="margin-top:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
                    <h3 class="admin-card__title" style="margin:0;">💾 Хранилище загрузок</h3>
                    <button class="btn btn-ghost btn-sm" onclick="Admin.refreshStorageStats()">Обновить</button>
                </div>
                <p style="font-size:0.75rem;color:var(--color-muted);margin-bottom:12px;">Память обновляется динамически от количества и размера загруженных файлов.</p>
                <div id="adminStorageSection"></div>
            </div>`;

        renderStorageSection();
        startStoragePolling();
    }

    function saveSite() {
        Admin.saveSiteSettings({ siteName: document.getElementById('sName')?.value, seoTitle: document.getElementById('sSeoTitle')?.value, seoDescription: document.getElementById('sSeoDesc')?.value });
        Admin.logAction('Настройки'); App.showToast('Сохранено!', 'success');
    }

    function createPromo() {
        const name = document.getElementById('promoName')?.value?.trim();
        const percent = parseInt(document.getElementById('promoPercent')?.value);
        if (!name || !percent) { App.showToast('Заполните', 'warning'); return; }
        addGift(name, percent);
        document.getElementById('promoName').value = '';
        document.getElementById('promoPercent').value = '';
    }

    function quickGift(percent) {
        addGift(`Скидка ${percent}%`, percent, 'ADMIN-' + percent + '-' + Math.random().toString(36).substr(2, 4).toUpperCase());
    }

    function addGift(name, percent, code) {
        code = code || 'GIFT-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        const p = Admin.getProfile(); if (!p.discounts) p.discounts = [];
        p.discounts.push({ id: Date.now(), name, percent, source: 'Администратор', active: true, code });
        Admin.saveProfile(p); Admin.logAction('Подарок', `${name} (${percent}%)`);
        App.showToast(`"${name}" — ${code}`, 'success');
        Admin.render(); Admin.syncProfile();
    }

    function removeGift(id) {
        const p = Admin.getProfile(); if (p.discounts) p.discounts = p.discounts.filter(d => d.id !== id);
        Admin.saveProfile(p); App.showToast('Удалено', 'info');
        Admin.render(); Admin.syncProfile();
    }

    Admin.registerTab('settings', renderTab);
    Admin.saveSiteSettingsForm = saveSite;
    Admin.createPromo = createPromo;
    Admin.quickGift = quickGift;
    Admin.removeGift = removeGift;
    Admin.refreshStorageStats = refreshStorageStats;
})(Admin);