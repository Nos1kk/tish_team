((Admin) => {
    function renderTab(c) {
        const achs = Admin.getAchievements();
        c.innerHTML = `
            <div class="admin-card__header" style="margin-bottom:20px;">
                <h3 class="admin-card__title">🏆 Достижения (${achs.length})</h3>
                <button class="btn btn-primary btn-sm" onclick="Admin.addAchievement()">+ Достижение</button>
            </div>
            ${achs.length === 0 ? '<div class="admin-empty"><p>Создайте первое</p></div>' : `
            <div class="admin-achievements-grid">${achs.map(a => `
                <div class="admin-achievement-card">
                    <div class="admin-achievement-card__icon">${a.icon || '🏆'}</div>
                    <div class="admin-achievement-card__name">${a.name}</div>
                    <div class="admin-achievement-card__desc">${a.description || ''}</div>
                    <div class="admin-achievement-card__rewards">${a.xpReward ? `<span>+${a.xpReward} XP</span>` : ''}${a.tisharaReward ? `<span>+${a.tisharaReward} ✦</span>` : ''}</div>
                    <div style="display:flex;gap:6px;justify-content:center;margin-top:8px;">
                        <button class="btn btn-ghost btn-sm" style="font-size:0.7rem;" onclick="Admin.giveAchievementById(${a.id})">Выдать</button>
                        <button class="admin-table-btn admin-table-btn--danger" onclick="Admin.removeAchievement(${a.id})">${Admin.ic('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>')}</button>
                    </div>
                </div>`).join('')}</div>`}`;
    }

    function add() {
        Admin.showAdminModal({
            title: '🏆 Новое достижение', width: '560px',
            body: `
                <div class="admin-form-row"><div class="admin-form-group"><label class="admin-form-label">Название *</label><input type="text" class="input" id="achName" placeholder="Первая покупка"></div>
                <div class="admin-form-group"><label class="admin-form-label">Иконка</label><input type="text" class="input" id="achIcon" placeholder="🏆" maxlength="2"></div></div>
                <div class="admin-form-group"><label class="admin-form-label">Описание</label><input type="text" class="input" id="achDesc" placeholder="Описание"></div>
                <div class="admin-form-row"><div class="admin-form-group"><label class="admin-form-label">XP</label><input type="number" class="input" id="achXP" placeholder="20"></div>
                <div class="admin-form-group"><label class="admin-form-label">TISHARA</label><input type="number" class="input" id="achTishara" placeholder="10"></div></div>`,
            confirmText: 'Создать',
            onConfirm: () => {
                const name = document.getElementById('achName')?.value?.trim();
                if (!name) { App.showToast('Название', 'warning'); return; }
                const achs = Admin.getAchievements();
                achs.push({ id: Date.now(), name, icon: document.getElementById('achIcon')?.value || '🏆', description: document.getElementById('achDesc')?.value || '', xpReward: parseInt(document.getElementById('achXP')?.value) || 0, tisharaReward: parseInt(document.getElementById('achTishara')?.value) || 0, active: true });
                Admin.saveAchievements(achs); Admin.logAction('Достижение', name);
                Admin.closeAdminModal(); App.showToast(`"${name}" создано!`, 'success'); Admin.render();
            }
        });
    }

    function remove(id) { Admin.saveAchievements(Admin.getAchievements().filter(a => a.id !== id)); Admin.render(); }

    function giveById(achId) {
        const ach = Admin.getAchievements().find(a => a.id === achId); if (!ach) return;
        const p = Admin.getProfile(); if (!p.achievements) p.achievements = [];
        const cid = 'admin_ach_' + achId;
        if (p.achievements.includes(cid)) { App.showToast('Уже выдано', 'warning'); return; }
        p.achievements.push(cid);
        if (ach.xpReward) p.xp = (p.xp || 0) + ach.xpReward;
        if (ach.tisharaReward) { p.tishara = (p.tishara || 0) + ach.tisharaReward; if (!p.tisharaHistory) p.tisharaHistory = []; p.tisharaHistory.unshift({ type: ach.name, label: ach.name, value: ach.tisharaReward, date: new Date().toISOString().split('T')[0] }); }
        Admin.saveProfile(p); Admin.logAction('Достижение выдано', ach.name);
        App.showToast(`🏆 "${ach.name}"!`, 'success'); Admin.syncProfile();
    }

    Admin.registerTab('achievements', renderTab);
    Admin.addAchievement = add;
    Admin.removeAchievement = remove;
    Admin.giveAchievementById = giveById;
})(Admin);