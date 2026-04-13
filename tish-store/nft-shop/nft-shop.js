/* =====================================================
   NFT SHOP — Cases & Opening System
   ===================================================== */

const NftShop = (() => {

    // ===== NFT RARITIES =====
    const RARITIES = {
        common:    { name: 'Обычный',    color: '#9ca3af', gradient: 'linear-gradient(135deg,#6b7280,#9ca3af)', chance: 45 },
        rare:      { name: 'Редкий',     color: '#3b82f6', gradient: 'linear-gradient(135deg,#2563eb,#60a5fa)', chance: 30 },
        epic:      { name: 'Эпический',  color: '#a855f7', gradient: 'linear-gradient(135deg,#9333ea,#c084fc)', chance: 15 },
        legendary: { name: 'Легендарный', color: '#f97316', gradient: 'linear-gradient(135deg,#ea580c,#fb923c)', chance: 8 },
        mythic:    { name: 'Мифический',  color: '#ef4444', gradient: 'linear-gradient(135deg,#dc2626,#f87171)', chance: 2 }
    };

    // ===== CASES DATA =====
    const CASES = [
        {
            id: 'basic_case',
            name: 'Basic Case',
            description: 'Начни свою коллекцию! Обычные и редкие NFT.',
            price: 50,
            icon: '📦',
            gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
            glow: 'rgba(100,116,139,0.3)',
            items: [
                { id: 'nft_b1', name: 'Pixel Cat', rarity: 'common', price: 15, color: '#9ca3af', sticker: '🐱', chance: 30 },
                { id: 'nft_b2', name: 'Retro Dog', rarity: 'common', price: 20, color: '#64748b', sticker: '🐶', chance: 30 },
                { id: 'nft_b3', name: 'Blue Bird', rarity: 'rare', price: 55, color: '#3b82f6', sticker: '🐦', chance: 25 },
                { id: 'nft_b4', name: 'Crystal Fox', rarity: 'rare', price: 70, color: '#06b6d4', sticker: '🦊', chance: 12 },
                { id: 'nft_b5', name: 'Shadow Panther', rarity: 'epic', price: 150, color: '#8b5cf6', sticker: '🐆', chance: 3 }
            ]
        },
        {
            id: 'fire_case',
            name: 'Fire Case',
            description: 'Горячие NFT! Повышенный шанс эпических.',
            price: 120,
            icon: '🔥',
            gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
            glow: 'rgba(239,68,68,0.3)',
            items: [
                { id: 'nft_f1', name: 'Flame Serpent', rarity: 'common', price: 30, color: '#f97316', sticker: '🐍', chance: 25 },
                { id: 'nft_f2', name: 'Magma Golem', rarity: 'rare', price: 80, color: '#ef4444', sticker: '🗿', chance: 30 },
                { id: 'nft_f3', name: 'Neon Phoenix', rarity: 'epic', price: 180, color: '#ec4899', sticker: '🔥', chance: 25 },
                { id: 'nft_f4', name: 'Inferno Dragon', rarity: 'legendary', price: 350, color: '#f59e0b', sticker: '🐉', chance: 15 },
                { id: 'nft_f5', name: 'Solar Titan', rarity: 'mythic', price: 800, color: '#fbbf24', sticker: '☀️', chance: 5 }
            ]
        },
        {
            id: 'cosmic_case',
            name: 'Cosmic Case',
            description: 'Тайны космоса! Легендарные NFT ждут.',
            price: 200,
            icon: '🌌',
            gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
            glow: 'rgba(139,92,246,0.3)',
            items: [
                { id: 'nft_c1', name: 'Star Dust', rarity: 'rare', price: 90, color: '#a855f7', sticker: '⭐', chance: 30 },
                { id: 'nft_c2', name: 'Nebula Wolf', rarity: 'epic', price: 200, color: '#7c3aed', sticker: '🐺', chance: 30 },
                { id: 'nft_c3', name: 'Cosmic Dragon', rarity: 'legendary', price: 400, color: '#d946ef', sticker: '🐉', chance: 20 },
                { id: 'nft_c4', name: 'Galaxy Phoenix', rarity: 'legendary', price: 500, color: '#ec4899', sticker: '🦅', chance: 13 },
                { id: 'nft_c5', name: 'Universe Creator', rarity: 'mythic', price: 1200, color: '#f43f5e', sticker: '🌀', chance: 7 }
            ]
        },
        {
            id: 'ice_case',
            name: 'Ice Case',
            description: 'Ледяная коллекция кристальных NFT.',
            price: 90,
            icon: '❄️',
            gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            glow: 'rgba(6,182,212,0.3)',
            items: [
                { id: 'nft_i1', name: 'Frost Bunny', rarity: 'common', price: 20, color: '#67e8f9', sticker: '🐰', chance: 30 },
                { id: 'nft_i2', name: 'Ice Bear', rarity: 'common', price: 25, color: '#22d3ee', sticker: '🐻‍❄️', chance: 25 },
                { id: 'nft_i3', name: 'Crystal Wolf', rarity: 'rare', price: 75, color: '#3b82f6', sticker: '🐺', chance: 25 },
                { id: 'nft_i4', name: 'Glacier Eagle', rarity: 'epic', price: 160, color: '#2563eb', sticker: '🦅', chance: 15 },
                { id: 'nft_i5', name: 'Blizzard King', rarity: 'legendary', price: 380, color: '#1d4ed8', sticker: '👑', chance: 5 }
            ]
        }
    ];

    let isOpening = false;

    // ===== HELPERS =====
    function ic(svgContent) {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svgContent}</svg>`;
    }

    function getUserBalance() {
        try {
            const p = localStorage.getItem('tish_profile');
            if (p) return JSON.parse(p).tishara || 0;
        } catch(e) {}
        return 0;
    }

    function getNftCount() {
        try {
            const p = localStorage.getItem('tish_profile');
            if (p) return (JSON.parse(p).nftCollection || []).length;
        } catch(e) {}
        return 0;
    }

    // ===== WEIGHTED RANDOM =====
    function rollNft(caseData) {
        const items = caseData.items;
        const totalChance = items.reduce((s, it) => s + it.chance, 0);
        let roll = Math.random() * totalChance;

        for (const item of items) {
            roll -= item.chance;
            if (roll <= 0) return item;
        }
        return items[items.length - 1];
    }

    // ===== RENDER MAIN PAGE =====
    function init() { render(); }

    function render() {
        const container = document.getElementById('nftShopContent');
        if (!container) return;

        const balance = getUserBalance();
        const nftCount = getNftCount();

        container.innerHTML = `
            <div class="nft-shop-page">
                <div class="nft-hero">
                    <div class="nft-hero__badge">🎮 NFT МАГАЗИН</div>
                    <h2 class="nft-hero__title">Открывай <span>кейсы</span></h2>
                    <p class="nft-hero__desc">
                        Каждый кейс содержит уникальные NFT разной редкости.
                        Собирай коллекцию и кастомизируй профиль!
                    </p>
                </div>

                <div class="nft-balance-bar">
                    <div class="nft-balance-item">
                        <div class="nft-balance-item__value">${balance} ✦</div>
                        <div class="nft-balance-item__label">TISHARA</div>
                    </div>
                    <div class="nft-balance-item">
                        <div class="nft-balance-item__value">${nftCount}</div>
                        <div class="nft-balance-item__label">Моих NFT</div>
                    </div>
                    <div class="nft-balance-item">
                        <div class="nft-balance-item__value">${CASES.length}</div>
                        <div class="nft-balance-item__label">Кейсов</div>
                    </div>
                </div>

                <div class="nft-cases-section__title">
                    ${ic('<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>')}
                    Доступные кейсы
                </div>

                <div class="nft-cases-grid">
                    ${CASES.map(c => renderCaseCard(c)).join('')}
                </div>
            </div>
        `;
    }

    function renderCaseCard(c) {
        const particles = Array.from({length: 5}, () => '<div class="nft-case-card__particle"></div>').join('');
        return `
            <div class="nft-case-card" style="--case-glow:${c.glow}" onclick="NftShop.openCaseDetail('${c.id}')">
                <div class="nft-case-card__preview">
                    <div class="nft-case-card__bg" style="background:${c.gradient}"></div>
                    <div class="nft-case-card__particles">${particles}</div>
                    <div class="nft-case-card__icon">${c.icon}</div>
                </div>
                <div class="nft-case-card__body">
                    <div class="nft-case-card__name">${c.name}</div>
                    <div class="nft-case-card__desc">${c.description}</div>
                    <div class="nft-case-card__footer">
                        <div class="nft-case-card__price">${c.price} ✦</div>
                        <div class="nft-case-card__items-count">${c.items.length} NFT</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== CASE DETAIL =====
    function openCaseDetail(caseId) {
        const c = CASES.find(x => x.id === caseId);
        if (!c) return;

        const modal = document.getElementById('nftCaseDetailModal');
        const content = document.getElementById('nftCaseDetailContent');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="case-detail">
                <div class="case-detail__preview">
                    <div class="case-detail__preview-bg" style="background:${c.gradient}"></div>
                    <div class="case-detail__preview-icon">${c.icon}</div>
                </div>
                <div class="case-detail__name">${c.name}</div>
                <div class="case-detail__desc">${c.description}</div>

                <div class="case-detail__price-row">
                    <div class="case-detail__price">${c.price} ✦</div>
                    <button class="btn btn-primary case-detail__open-btn" onclick="NftShop.openCase('${c.id}')">
                        🎰 Открыть кейс
                    </button>
                </div>

                <div class="case-drop-table">
                    <div class="case-drop-table__title">Содержимое кейса:</div>
                    ${c.items.map(item => {
                        const r = RARITIES[item.rarity];
                        return `
                            <div class="case-drop-item">
                                <div class="case-drop-item__sticker" style="background:${r.gradient}22">${item.sticker}</div>
                                <div class="case-drop-item__info">
                                    <div class="case-drop-item__name">${item.name}</div>
                                    <div class="case-drop-item__rarity" style="color:${r.color}">${r.name}</div>
                                </div>
                                <div class="case-drop-item__chance">${item.chance}%</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeCaseDetail() {
        const modal = document.getElementById('nftCaseDetailModal');
        if (modal) modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    // ===== OPEN CASE (MAIN LOGIC) =====
    function openCase(caseId) {
        if (isOpening) return;

        const c = CASES.find(x => x.id === caseId);
        if (!c) return;

        const balance = getUserBalance();
        if (balance < c.price) {
            if (typeof App !== 'undefined') App.showToast('Недостаточно TISHARA! ✦', 'error');
            return;
        }

        isOpening = true;
        closeCaseDetail();

        // Deduct balance
        try {
            const profileData = JSON.parse(localStorage.getItem('tish_profile'));
            profileData.tishara -= c.price;
            profileData.tisharaHistory.unshift({
                type: 'spend', label: `Кейс: ${c.name}`, value: -c.price,
                date: new Date().toISOString().split('T')[0]
            });
            localStorage.setItem('tish_profile', JSON.stringify(profileData));
            if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_profile', profileData);
        } catch(e) {}

        // Roll the NFT
        const wonItem = rollNft(c);
        const wonRarity = RARITIES[wonItem.rarity];

        // Show opening animation
        showOpeningAnimation(c, wonItem, wonRarity);
    }

    function showOpeningAnimation(caseData, wonItem, wonRarity) {
        let overlay = document.getElementById('caseOpeningOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'caseOpeningOverlay';
            overlay.className = 'case-opening-overlay';
            document.body.appendChild(overlay);
        }

        // Build reel items (randomized with won item at specific position)
        const reelItems = [];
        const winPos = 15 + Math.floor(Math.random() * 5); // win at position 15-19
        const allItems = caseData.items;

        for (let i = 0; i < 25; i++) {
            if (i === winPos) {
                reelItems.push(wonItem);
            } else {
                reelItems.push(allItems[Math.floor(Math.random() * allItems.length)]);
            }
        }

        overlay.innerHTML = `
            <div class="case-opening">
                <div class="case-opening__reel" id="caseReel">
                    <div class="case-opening__reel-inner" id="caseReelInner">
                        ${reelItems.map(item => {
                            const r = RARITIES[item.rarity];
                            return `
                                <div class="case-opening__reel-item">
                                    <div class="nft-animation nft-animation--medium nft-rarity--${item.rarity}"
                                         style="width:120px;height:140px;--nft-color:${item.color};--nft-glow:${r.color}33">
                                        <div class="nft-animation__bg" style="background:${r.gradient}"></div>
                                        <div class="nft-animation__sticker" style="font-size:40px">${item.sticker}</div>
                                        <div class="nft-animation__ring"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="case-opening__reel-pointer"></div>
                </div>

                <div class="case-opening__result" id="caseResult">
                    <div class="nft-animation nft-animation--large nft-rarity--${wonItem.rarity}"
                         style="width:180px;height:220px;margin:0 auto;--nft-color:${wonItem.color};--nft-glow:${wonRarity.color}44">
                        <div class="nft-animation__bg" style="background:${wonRarity.gradient}"></div>
                        <div class="nft-animation__particles">
                            ${Array.from({length:10}, ()=>'<div class="nft-particle"></div>').join('')}
                        </div>
                        <div class="nft-animation__sticker" style="font-size:60px">${wonItem.sticker}</div>
                        <div class="nft-animation__ring"></div>
                        ${wonItem.rarity==='legendary'||wonItem.rarity==='mythic'?'<div class="nft-animation__shine"></div>':''}
                    </div>
                    <div class="case-opening__result-name">${wonItem.name}</div>
                    <div class="case-opening__result-rarity" style="background:${wonRarity.gradient}">${wonRarity.name}</div>
                    <div class="case-opening__result-price">$${wonItem.price}</div>
                    <div class="case-opening__result-actions">
                        <button class="btn btn-primary btn-sm" onclick="NftShop.collectNft()">🎉 Забрать!</button>
                        <button class="btn btn-secondary btn-sm" onclick="NftShop.closeOpening()">Закрыть</button>
                    </div>
                </div>
            </div>
        `;

        // Store won item for collection
        overlay._wonItem = wonItem;
        overlay._caseData = caseData;

        // Activate overlay
        requestAnimationFrame(() => {
            overlay.classList.add('active');

            // Start reel animation
            setTimeout(() => {
                const reelInner = document.getElementById('caseReelInner');
                if (reelInner) {
                    const offset = -(winPos * 200) + 100; // center the won item
                    reelInner.style.transform = `translateY(${offset}px)`;
                }

                // Show result after reel stops
                setTimeout(() => {
                    const result = document.getElementById('caseResult');
                    const reel = document.getElementById('caseReel');
                    if (result && reel) {
                        reel.style.display = 'none';
                        result.classList.add('visible');
                    }
                    isOpening = false;
                }, 3200);
            }, 300);
        });
    }

    function collectNft() {
        const overlay = document.getElementById('caseOpeningOverlay');
        if (!overlay || !overlay._wonItem) return;

        const wonItem = overlay._wonItem;
        const caseData = overlay._caseData;

        // Add NFT to profile
        if (typeof Profile !== 'undefined' && Profile.addNft) {
            Profile.addNft({
                id: wonItem.id + '_' + Date.now(),
                name: wonItem.name,
                rarity: wonItem.rarity,
                price: wonItem.price,
                color: wonItem.color,
                sticker: wonItem.sticker,
                animation: wonItem.id,
                animationType: 'css',
                dropDate: new Date().toISOString().split('T')[0],
                caseSource: caseData.name
            });
        }

        closeOpening();

        if (typeof App !== 'undefined') {
            App.showToast(`🎉 ${wonItem.name} добавлен в коллекцию!`, 'success', 4000);
        }

        // Refresh shop page
        setTimeout(() => render(), 300);
    }

    function closeOpening() {
        const overlay = document.getElementById('caseOpeningOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 400);
        }
        isOpening = false;
    }

    // ===== PUBLIC API =====
    return {
        init,
        render,
        openCaseDetail,
        closeCaseDetail,
        openCase,
        collectNft,
        closeOpening
    };

})();