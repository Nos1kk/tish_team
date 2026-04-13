/* =====================================================
   ADMIN — NFT Module (Collections, Cases, Items)
   ===================================================== */

((Admin) => {
    let nftSubTab = 'collections';

    function renderNftTab(c) {
        const collections = Admin.getAdminCollections();
        const cases = Admin.getAdminCases();
        const nfts = Admin.getAdminNfts();
        c.innerHTML = `
            <div class="admin-subtabs">
                <button class="admin-subtab ${nftSubTab === 'collections' ? 'active' : ''}" onclick="Admin.showNftSub('collections')">Коллекции (${collections.length})</button>
                <button class="admin-subtab ${nftSubTab === 'cases' ? 'active' : ''}" onclick="Admin.showNftSub('cases')">Кейсы (${cases.length})</button>
                <button class="admin-subtab ${nftSubTab === 'nfts' ? 'active' : ''}" onclick="Admin.showNftSub('nfts')">NFT (${nfts.length})</button>
            </div>
            <div id="nftSubContent"></div>`;
        renderNftSub();
    }

    function showNftSub(sub) {
        nftSubTab = sub;
        document.querySelectorAll('.admin-subtab').forEach((b, i) => b.classList.toggle('active', ['collections', 'cases', 'nfts'][i] === sub));
        renderNftSub();
    }

    function renderNftSub() {
        const c = document.getElementById('nftSubContent');
        if (!c) return;
        if (nftSubTab === 'collections') renderCollections(c);
        else if (nftSubTab === 'cases') renderCases(c);
        else renderItems(c);
    }

    function renderCollections(c) {
        const cols = Admin.getAdminCollections();
        c.innerHTML = `<div class="admin-card" style="margin-top:16px;">
            <div class="admin-card__header"><h3 class="admin-card__title">Коллекции</h3>
            <button class="btn btn-primary btn-sm" onclick="Admin.addNftCollection()">+ Коллекция</button></div>
            ${cols.length === 0 ? '<p class="admin-empty-text">Нет коллекций</p>' : cols.map(col => `
                <div class="admin-list__item" style="padding:14px 0;">
                    <div style="flex:1;"><div style="font-weight:700;">${col.name}</div>
                    <div style="font-size:0.78rem;color:var(--color-muted);">${col.description || '—'} • ${col.active ? '✅' : '❌'}</div></div>
                    <button class="admin-table-btn admin-table-btn--danger" onclick="Admin.removeNftCollection(${col.id})">${Admin.ic('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>')}</button>
                </div>`).join('')}
        </div>`;
    }

    function renderCases(c) {
        const cases = Admin.getAdminCases();
        c.innerHTML = `<div class="admin-card" style="margin-top:16px;">
            <div class="admin-card__header"><h3 class="admin-card__title">Кейсы</h3>
            <button class="btn btn-primary btn-sm" onclick="Admin.addNftCase()">+ Кейс</button></div>
            ${cases.length === 0 ? '<p class="admin-empty-text">Нет кейсов</p>' : cases.map(cs => `
                <div class="admin-list__item" style="padding:14px 0;">
                    <div style="flex:1;"><div style="font-weight:700;">${cs.name} — <span style="color:var(--purple-600);">$${cs.price}</span></div></div>
                    <button class="admin-table-btn admin-table-btn--danger" onclick="Admin.removeNftCase(${cs.id})">${Admin.ic('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>')}</button>
                </div>`).join('')}
        </div>`;
    }

    function renderItems(c) {
        const nfts = Admin.getAdminNfts();
        const rc = { Common: '#9ca3af', Rare: '#3b82f6', Epic: '#8b5cf6', Legendary: '#f97316', Mythic: '#ef4444' };
        c.innerHTML = `<div class="admin-card" style="margin-top:16px;">
            <div class="admin-card__header"><h3 class="admin-card__title">NFT</h3>
            <button class="btn btn-primary btn-sm" onclick="Admin.addNft()">+ NFT</button></div>
            ${nfts.length === 0 ? '<p class="admin-empty-text">Нет NFT</p>' : `
            <div class="admin-table-wrapper"><table class="admin-table">
                <thead><tr><th>🎨</th><th>Название</th><th>Редкость</th><th>Цена</th><th></th></tr></thead>
                <tbody>${nfts.map(n => `
                    <tr>
                        <td style="font-size:1.5rem;">${n.sticker || '✨'}</td>
                        <td style="font-weight:700;">${n.name}</td>
                        <td><span style="padding:4px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${(rc[n.rarity] || '#6b7280')}20;color:${rc[n.rarity] || '#6b7280'};">${n.rarity}</span></td>
                        <td>$${n.price || 0}</td>
                        <td><div class="admin-table-actions">
                            <button class="admin-table-btn" onclick="Admin.giveNftToUserById(${n.id})" title="Выдать">${Admin.ic('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')}</button>
                            <button class="admin-table-btn admin-table-btn--danger" onclick="Admin.removeNft(${n.id})">${Admin.ic('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>')}</button>
                        </div></td>
                    </tr>`).join('')}</tbody></table></div>`}
        </div>`;
    }

    // ===== ACTIONS =====
    function addCollection() {
        Admin.showAdminModal({
            title: '🎨 Новая коллекция',
            body: `<div class="admin-form-group"><label class="admin-form-label">Название *</label><input type="text" class="input" id="nftColName" placeholder="Cosmic Collection"></div>
                   <div class="admin-form-group"><label class="admin-form-label">Описание</label><textarea class="textarea" id="nftColDesc" rows="2" placeholder="..."></textarea></div>`,
            confirmText: 'Создать',
            onConfirm: () => {
                const name = document.getElementById('nftColName')?.value?.trim();
                if (!name) { App.showToast('Введите название', 'warning'); return; }
                const cols = Admin.getAdminCollections();
                cols.push({ id: Date.now(), name, description: document.getElementById('nftColDesc')?.value?.trim() || '', active: true, createdAt: new Date().toISOString() });
                Admin.saveAdminCollections(cols);
                Admin.logAction('NFT коллекция', name);
                Admin.closeAdminModal();
                App.showToast(`"${name}" создана!`, 'success');
                Admin.render();
            }
        });
    }

    function removeCollection(id) {
        Admin.saveAdminCollections(Admin.getAdminCollections().filter(c => c.id !== id));
        Admin.render();
    }

    function addCase() {
        Admin.showAdminModal({
            title: '📦 Новый кейс',
            body: `<div class="admin-form-group"><label class="admin-form-label">Название</label><input type="text" class="input" id="nftCaseName" placeholder="Fire Case"></div>
                   <div class="admin-form-group"><label class="admin-form-label">Цена (✦)</label><input type="number" class="input" id="nftCasePrice" placeholder="100" min="1"></div>`,
            confirmText: 'Создать',
            onConfirm: () => {
                const name = document.getElementById('nftCaseName')?.value?.trim();
                if (!name) { App.showToast('Введите название', 'warning'); return; }
                const cases = Admin.getAdminCases();
                cases.push({ id: Date.now(), name, price: parseInt(document.getElementById('nftCasePrice')?.value) || 0, active: true });
                Admin.saveAdminCases(cases);
                Admin.logAction('NFT кейс', name);
                Admin.closeAdminModal();
                App.showToast(`"${name}" создан!`, 'success');
                Admin.render();
            }
        });
    }

    function removeCase(id) {
        Admin.saveAdminCases(Admin.getAdminCases().filter(c => c.id !== id));
        Admin.render();
    }

    function addNft() {
        Admin.showAdminModal({
            title: '💎 Новый NFT', width: '600px',
            body: `
                <div class="admin-form-row">
                    <div class="admin-form-group"><label class="admin-form-label">Название *</label><input type="text" class="input" id="nftName" placeholder="Cosmic Dragon"></div>
                    <div class="admin-form-group"><label class="admin-form-label">Стикер</label><input type="text" class="input" id="nftSticker" placeholder="🐉" maxlength="2"></div>
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group"><label class="admin-form-label">Редкость</label>
                    <select class="input" id="nftRarity"><option value="Common">Common</option><option value="Rare">Rare</option><option value="Epic">Epic</option><option value="Legendary">Legendary</option><option value="Mythic">Mythic</option></select></div>
                    <div class="admin-form-group"><label class="admin-form-label">Цена ($)</label><input type="number" class="input" id="nftPrice" placeholder="100"></div>
                </div>
                <div class="admin-form-row">
                    <div class="admin-form-group"><label class="admin-form-label">Цвет</label><input type="color" id="nftColor" value="#8b5cf6" style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer;"></div>
                    <div class="admin-form-group"><label class="admin-form-label">Тираж (0=∞)</label><input type="number" class="input" id="nftSupply" placeholder="0"></div>
                </div>`,
            confirmText: 'Создать',
            onConfirm: () => {
                const name = document.getElementById('nftName')?.value?.trim();
                if (!name) { App.showToast('Введите название', 'warning'); return; }
                const nfts = Admin.getAdminNfts();
                nfts.push({
                    id: Date.now(), name,
                    sticker: document.getElementById('nftSticker')?.value || '✨',
                    rarity: document.getElementById('nftRarity')?.value || 'Common',
                    price: parseInt(document.getElementById('nftPrice')?.value) || 0,
                    color: document.getElementById('nftColor')?.value || '#8b5cf6',
                    maxSupply: parseInt(document.getElementById('nftSupply')?.value) || null,
                    createdAt: new Date().toISOString()
                });
                Admin.saveAdminNfts(nfts);
                Admin.logAction('NFT создан', `${name}`);
                Admin.closeAdminModal();
                App.showToast(`"${name}" создан!`, 'success');
                Admin.render();
            }
        });
    }

    function removeNft(id) {
        Admin.saveAdminNfts(Admin.getAdminNfts().filter(n => n.id !== id));
        Admin.render();
    }

    function giveNftToUserById(nftId) {
        const nft = Admin.getAdminNfts().find(n => n.id === nftId);
        if (!nft) return;
        if (typeof Profile !== 'undefined' && Profile.addNft) {
            Profile.addNft({
                id: 'nft_admin_' + Date.now(), name: nft.name,
                rarity: nft.rarity.toLowerCase(), price: nft.price,
                color: nft.color, sticker: nft.sticker,
                animation: 'admin-nft', animationType: 'css', caseSource: 'Администратор'
            });
            Admin.logAction('NFT выдан', nft.name);
            App.showToast(`"${nft.name}" выдан! 🎁`, 'success');
        }
    }

    // Register tab
    Admin.registerTab('nft', renderNftTab);

    // Expose actions globally through Admin
    Admin.showNftSub = showNftSub;
    Admin.addNftCollection = addCollection;
    Admin.removeNftCollection = removeCollection;
    Admin.addNftCase = addCase;
    Admin.removeNftCase = removeCase;
    Admin.addNft = addNft;
    Admin.removeNft = removeNft;
    Admin.giveNftToUserById = giveNftToUserById;
})(Admin);