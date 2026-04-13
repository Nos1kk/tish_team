((Admin) => {
    function renderTab(c) {
        const s = Admin.getRefSettings();
        const p = Admin.getProfile();
        c.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div class="admin-card">
                    <h3 class="admin-card__title" style="margin-bottom:14px;">⚙️ Настройки</h3>
                    <div class="admin-form-group"><label class="admin-form-label">Бонус регистрации (✦)</label><input type="number" class="input" id="refRegBonus" value="${s.regBonus || 50}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">Бонус 1й покупки</label><input type="number" class="input" id="refFirstBonus" value="${s.firstPurchaseBonus || 100}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">% от покупок</label><input type="number" class="input" id="refPercent" value="${s.percentFromPurchases || 5}"></div>
                    <div class="admin-form-group"><label class="admin-form-label">Макс. рефералов</label><input type="number" class="input" id="refMax" value="${s.maxReferrals || 50}"></div>
                    <button class="btn btn-primary btn-sm" onclick="Admin.saveRefSettingsForm()">💾 Сохранить</button>
                </div>
                <div class="admin-card">
                    <h3 class="admin-card__title" style="margin-bottom:14px;">📊 Статистика</h3>
                    <div class="admin-user-grid">
                        <div class="admin-info-cell"><div class="admin-info-cell__label">Рефералов</div><div class="admin-info-cell__value">${p.referrals?.invited || 0}</div></div>
                        <div class="admin-info-cell"><div class="admin-info-cell__label">Бонусов</div><div class="admin-info-cell__value">${p.referrals?.earned || 0} ✦</div></div>
                    </div>
                </div>
            </div>`;
    }

    function saveSettings() {
        Admin.saveRefSettings({
            regBonus: parseInt(document.getElementById('refRegBonus')?.value) || 50,
            firstPurchaseBonus: parseInt(document.getElementById('refFirstBonus')?.value) || 100,
            percentFromPurchases: parseInt(document.getElementById('refPercent')?.value) || 5,
            maxReferrals: parseInt(document.getElementById('refMax')?.value) || 50
        });
        Admin.logAction('Рефералы'); App.showToast('Сохранено!', 'success');
    }

    Admin.registerTab('referrals', renderTab);
    Admin.saveRefSettingsForm = saveSettings;
})(Admin);