/* =====================================================
   TISHARA CLUB — Subscription System
   ===================================================== */

const Subscription = (() => {

    // ===== CATEGORIES & LEVELS DATA =====
    const CATEGORIES = [
        {
            id: 'web',
            name: 'Веб, IT-разработка',
            shortName: 'Веб / IT',
            icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
            levels: [
                { id: 'start', name: 'Старт', minSpent: 0, cashback: 1, perks: ['Стандартные условия'] },
                { id: 'pro', name: 'PRO', minSpent: 30000, cashback: 2, perks: ['Месяц бесплатной техподдержки проекта'] },
                { id: 'vip', name: 'VIP', minSpent: 100000, cashback: 4, perks: ['Раз в полгода промокод на 30%'] },
                { id: 'ambassador', name: 'Амбассадор', minSpent: 250000, cashback: 6, perks: ['Разработка вне очереди', 'Скидка 50% на заказ раз в полгода'] }
            ]
        },
        {
            id: 'design',
            name: 'Дизайн и графика',
            shortName: 'Дизайн',
            icon: '<circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c.55 0 1-.45 1-1 0-.28-.11-.5-.28-.67-.18-.2-.28-.43-.28-.73 0-.55.45-1 1-1h1.73c3.14 0 5.69-2.55 5.69-5.69C22.14 5.96 17.63 2 12 2z"/>',
            levels: [
                { id: 'start', name: 'Старт', minSpent: 0, cashback: 1, perks: ['Стандартные условия'] },
                { id: 'pro', name: 'PRO', minSpent: 5000, cashback: 3, perks: ['Приоритетная поддержка'] },
                { id: 'vip', name: 'VIP', minSpent: 15000, cashback: 5, perks: ['Эксклюзивные шаблоны'] },
                { id: 'ambassador', name: 'Амбассадор', minSpent: 40000, cashback: 8, perks: ['Персональный дизайнер', 'Ранний доступ к новинкам'] }
            ]
        },
        {
            id: 'video',
            name: 'Видеопродакшн и моушн',
            shortName: 'Видео',
            icon: '<polygon points="5 3 19 12 5 21 5 3"/>',
            levels: [
                { id: 'start', name: 'Старт', minSpent: 0, cashback: 1, perks: ['Стандартные условия'] },
                { id: 'pro', name: 'PRO', minSpent: 10000, cashback: 3, perks: ['Бесплатная консультация'] },
                { id: 'vip', name: 'VIP', minSpent: 30000, cashback: 5, perks: ['Приоритет в очереди'] },
                { id: 'ambassador', name: 'Амбассадор', minSpent: 80000, cashback: 8, perks: ['Персональный продюсер', 'Скидка 40% раз в квартал'] }
            ]
        },
        {
            id: 'marketing',
            name: 'Продюсирование и маркетинг',
            shortName: 'Маркетинг',
            icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
            levels: [
                { id: 'start', name: 'Старт', minSpent: 0, cashback: 1, perks: ['Стандартные условия'] },
                { id: 'pro', name: 'PRO', minSpent: 50000, cashback: 2, perks: ['Аналитический отчёт бесплатно'] },
                { id: 'vip', name: 'VIP', minSpent: 150000, cashback: 4, perks: ['Стратегическая сессия в подарок'] },
                { id: 'ambassador', name: 'Амбассадор', minSpent: 300000, cashback: 7, perks: ['Персональный менеджер', 'VIP поддержка 24/7'] }
            ]
        }
    ];

    const LEVEL_ICONS = {
        start: '🚀',
        pro: '⚡',
        vip: '💎',
        ambassador: '👑'
    };

    const LEVEL_COLORS = {
        start: { bg: '#64748b', text: '#94a3b8' },
        pro: { bg: '#3b82f6', text: '#60a5fa' },
        vip: { bg: '#8b5cf6', text: '#a855f7' },
        ambassador: { bg: '#f59e0b', text: '#fbbf24' }
    };

    let activeCategory = 'web';

    // ===== STORAGE =====
    function getSubData() {
        try {
            const raw = localStorage.getItem('tish_subscription');
            return raw ? JSON.parse(raw) : getDefaultSubData();
        } catch(e) {
            return getDefaultSubData();
        }
    }

    function saveSubData(data) {
        try { localStorage.setItem('tish_subscription', JSON.stringify(data)); } catch(e) {}
        if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_subscription', data);
    }

    function getDefaultSubData() {
        return {
            categories: {
                web: { spent: 0, history: [] },
                design: { spent: 35000, history: [
                    { name: 'Nebula UI Kit', amount: 15000, date: '2024-12-12', cashback: 450 },
                    { name: 'Stellar Icons', amount: 8000, date: '2024-12-08', cashback: 240 },
                    { name: 'Cosmic Pack', amount: 12000, date: '2024-11-20', cashback: 360 }
                ]},
                video: { spent: 0, history: [] },
                marketing: { spent: 0, history: [] }
            },
            totalCashbackEarned: 1050
        };
    }

    // ===== HELPERS =====
    function ic(svgContent) {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svgContent}</svg>`;
    }

    function getUserLevel(categoryId) {
        const data = getSubData();
        const catData = data.categories[categoryId];
        const cat = CATEGORIES.find(c => c.id === categoryId);
        if (!cat || !catData) return cat ? cat.levels[0] : null;

        let current = cat.levels[0];
        for (const level of cat.levels) {
            if (catData.spent >= level.minSpent) {
                current = level;
            }
        }
        return current;
    }

    function getNextLevel(categoryId) {
        const data = getSubData();
        const catData = data.categories[categoryId];
        const cat = CATEGORIES.find(c => c.id === categoryId);
        if (!cat || !catData) return null;

        for (const level of cat.levels) {
            if (catData.spent < level.minSpent) return level;
        }
        return null;
    }

    function formatMoney(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + ' млн ₽';
        if (n >= 1000) return (n / 1000).toFixed(0) + ' 000 ₽';
        return n + ' ₽';
    }

    // ===== RENDER =====
    function init() { render(); }
    function render() {
        const container = document.getElementById('subscriptionContent');
        if (!container) return;

        const data = getSubData();
        const cat = CATEGORIES.find(c => c.id === activeCategory);
        if (!cat) return;

        const catData = data.categories[activeCategory] || { spent: 0, history: [] };
        const currentLevel = getUserLevel(activeCategory);
        const nextLevel = getNextLevel(activeCategory);

        const progress = nextLevel
            ? Math.min(100, ((catData.spent - currentLevel.minSpent) / (nextLevel.minSpent - currentLevel.minSpent)) * 100)
            : 100;

        container.innerHTML = `
            <div class="subscription-page">
                <!-- HERO -->
                <div class="sub-hero">
                    <div class="sub-hero__badge">✦ ПРОГРАММА ЛОЯЛЬНОСТИ</div>
                    <h2 class="sub-hero__title">Tishara <span>Club</span></h2>
                    <p class="sub-hero__desc">
                        Покупайте в любимых категориях, повышайте уровень и получайте
                        кэшбек и эксклюзивные привилегии
                    </p>
                    <div class="sub-hero__stats">
                        <div class="sub-hero__stat">
                            <div class="sub-hero__stat-value">4</div>
                            <div class="sub-hero__stat-label">Категории</div>
                        </div>
                        <div class="sub-hero__stat">
                            <div class="sub-hero__stat-value">до 8%</div>
                            <div class="sub-hero__stat-label">Кэшбек</div>
                        </div>
                        <div class="sub-hero__stat">
                            <div class="sub-hero__stat-value">${formatMoney(data.totalCashbackEarned)}</div>
                            <div class="sub-hero__stat-label">Ваш кэшбек</div>
                        </div>
                    </div>
                </div>

                <!-- CATEGORY TABS -->
                <div class="sub-categories">
                    ${CATEGORIES.map(c => `
                        <button class="sub-category-tab ${c.id === activeCategory ? 'active' : ''}"
                                onclick="Subscription.setCategory('${c.id}')">
                            <span class="sub-category-tab__icon">${ic(c.icon)}</span>
                            ${c.shortName}
                        </button>
                    `).join('')}
                </div>

                <!-- USER STATUS -->
                <div class="sub-user-status">
                    <div class="sub-user-status__level">
                        <div class="sub-user-status__level-icon"
                             style="background:linear-gradient(135deg,${LEVEL_COLORS[currentLevel.id].bg},${LEVEL_COLORS[currentLevel.id].text})">
                            ${LEVEL_ICONS[currentLevel.id]}
                        </div>
                        <div class="sub-user-status__level-info">
                            <h4>${currentLevel.name}</h4>
                            <span>${cat.shortName} • Потрачено: ${formatMoney(catData.spent)}</span>
                        </div>
                    </div>

                    <div class="sub-user-status__progress">
                        <div class="sub-user-status__progress-label">
                            <span>${nextLevel ? `До ${nextLevel.name}: ${formatMoney(nextLevel.minSpent - catData.spent)}` : 'Максимальный уровень!'}</span>
                            <span>${Math.round(progress)}%</span>
                        </div>
                        <div class="sub-user-status__progress-bar">
                            <div class="sub-user-status__progress-fill" style="width:${progress}%"></div>
                        </div>
                    </div>

                    <div class="sub-user-status__cashback">
                        <div class="sub-user-status__cashback-value">${currentLevel.cashback}%</div>
                        <div class="sub-user-status__cashback-label">Ваш кэшбек</div>
                    </div>
                </div>

                <!-- LEVELS GRID -->
                <div class="sub-levels-grid">
                    ${cat.levels.map(level => {
                        const isCurrent = level.id === currentLevel.id;
                        const isLocked = catData.spent < level.minSpent;
                        const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

                        return `
                            <div class="sub-level-card ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}"
                                 data-level="${level.id}">
                                <div class="sub-level-card__header">
                                    <div class="sub-level-card__icon">${LEVEL_ICONS[level.id]}</div>
                                    <div class="sub-level-card__name">${level.name}</div>
                                    <div class="sub-level-card__condition">
                                        ${level.minSpent === 0 ? 'Бесплатно' : `от ${formatMoney(level.minSpent)}`}
                                    </div>
                                </div>
                                <div class="sub-level-card__body">
                                    <div class="sub-level-card__cashback">
                                        <div class="sub-level-card__cashback-value">${level.cashback}%</div>
                                        <div class="sub-level-card__cashback-label">Кэшбек</div>
                                    </div>
                                    <ul class="sub-level-card__perks">
                                        ${level.perks.map(perk => `
                                            <li class="sub-level-card__perk">
                                                <span class="sub-level-card__perk-icon">${checkIcon}</span>
                                                ${perk}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- PURCHASE HISTORY -->
                <div class="sub-history">
                    <div class="sub-history__header">
                        <div class="sub-history__title">
                            ${ic('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>')}
                            История покупок — ${cat.shortName}
                        </div>
                    </div>
                    <div class="sub-history__body">
                        ${catData.history.length === 0 ? `
                            <div class="sub-empty">
                                <div class="sub-empty__icon">📦</div>
                                <div class="sub-empty__title">Нет покупок</div>
                                <div class="sub-empty__desc">
                                    Совершайте покупки в категории "${cat.shortName}" чтобы повысить уровень и получать кэшбек
                                </div>
                            </div>
                        ` : catData.history.map(item => `
                            <div class="sub-history-item">
                                <div class="sub-history-item__icon"
                                     style="background:linear-gradient(135deg,${LEVEL_COLORS[currentLevel.id].bg}22,${LEVEL_COLORS[currentLevel.id].text}22)">
                                    🛒
                                </div>
                                <div class="sub-history-item__info">
                                    <div class="sub-history-item__name">${item.name}</div>
                                    <div class="sub-history-item__date">${formatDate(item.date)}</div>
                                </div>
                                <div style="text-align:right">
                                    <div class="sub-history-item__amount">${formatMoney(item.amount)}</div>
                                    <div class="sub-history-item__cashback">+${formatMoney(item.cashback)} кэшбек</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function formatDate(d) {
        if (!d) return '';
        const dt = new Date(d);
        const months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
        return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
    }

    function setCategory(catId) {
        activeCategory = catId;
        render();
    }

    // Called when order is completed — updates subscription data
    function recordPurchase(categoryId, productName, amount) {
        const data = getSubData();
        if (!data.categories[categoryId]) {
            data.categories[categoryId] = { spent: 0, history: [] };
        }

        const level = getUserLevel(categoryId);
        const cashback = Math.round(amount * (level.cashback / 100));

        data.categories[categoryId].spent += amount;
        data.categories[categoryId].history.unshift({
            name: productName,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            cashback: cashback
        });

        data.totalCashbackEarned = (data.totalCashbackEarned || 0) + cashback;

        // Keep max 50 history items per category
        if (data.categories[categoryId].history.length > 50) {
            data.categories[categoryId].history = data.categories[categoryId].history.slice(0, 50);
        }

        saveSubData(data);

        // Check for level up
        const newLevel = getUserLevel(categoryId);
        if (newLevel.id !== level.id) {
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(`🎉 Новый уровень: ${newLevel.name} в категории ${CATEGORIES.find(c=>c.id===categoryId)?.shortName}!`, 'success', 5000);
            }
        }

        // Add cashback as TISHARA
        if (cashback > 0 && typeof Profile !== 'undefined') {
            // Convert cashback rubles to TISHARA points (1 ruble = 0.1 TISHARA for demo)
            const tisharaPoints = Math.max(1, Math.round(cashback / 100));
            if (Profile.addTishara) {
                // Note: addTishara is private, so we handle it through the profile
            }
        }

        return { cashback, newLevel: newLevel };
    }

    // ===== PUBLIC API =====
    return {
        init,
        render,
        setCategory,
        recordPurchase,
        getUserLevel,
        getSubData
    };

})();