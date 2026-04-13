/* =====================================================
   TISH STORE — PARTNERS MODULE
   by Tish Team
   ===================================================== */

const Partners = (() => {
    const earnings = [
        { date: '15 Дек 2024', source: 'Реферал: Мария К.', product: 'Nebula UI Kit', amount: '+$7.35', status: 'paid' },
        { date: '12 Дек 2024', source: 'Промо-ссылка', product: 'Stellar Icons', amount: '+$2.85', status: 'paid' },
        { date: '10 Дек 2024', source: 'Реферал: Дмитрий В.', product: 'Void Brand Kit', amount: '+$8.85', status: 'pending' },
        { date: '08 Дек 2024', source: 'Баннер на сайте', product: 'Quantum Mobile Kit', amount: '+$8.25', status: 'paid' },
        { date: '05 Дек 2024', source: 'Реферал: Анна С.', product: 'Cosmic Illustrations', amount: '+$5.85', status: 'paid' },
    ];

    function render() {
        const page = document.querySelector('#page-partners .container');
        if (!page) return;

        page.innerHTML = `
            <div class="partners-page">
                <!-- Hero -->
                <div class="partners-hero reveal">
                    <div class="partners-hero__icon">
                        <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </div>
                    <h1 class="partners-hero__title">Партнёрская <span class="text-gradient">программа</span></h1>
                    <p class="partners-hero__desc">Зарабатывайте вместе с Tish Store. Продвигайте наши продукты и получайте до 25% с каждой продажи по вашей ссылке.</p>
                    <div class="partners-hero__actions">
                        <button class="btn btn-primary btn-lg btn--icon-slide"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Стать партнёром</button>
                        <button class="btn btn-secondary btn-lg"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Как это работает</button>
                    </div>
                </div>

                <!-- Tiers -->
                <div class="partners-section">
                    <h2 class="partners-section__title">Уровни <span class="text-gradient">партнёрства</span></h2>
                    <div class="partner-tiers">
                        ${renderTier('Бронза', '10%', 'bronze', false, [
                            { text: 'Промо-ссылки', active: true },
                            { text: 'Статистика кликов', active: true },
                            { text: 'Базовые баннеры', active: true },
                            { text: 'Выплаты раз в месяц', active: true },
                            { text: 'Персональный менеджер', active: false },
                            { text: 'Кастомные промо', active: false }
                        ])}
                        ${renderTier('Серебро', '15%', 'silver', true, [
                            { text: 'Всё из Бронзы', active: true },
                            { text: 'Расширенная статистика', active: true },
                            { text: 'Все промо-баннеры', active: true },
                            { text: 'Выплаты раз в неделю', active: true },
                            { text: 'Приоритетная поддержка', active: true },
                            { text: 'Кастомные промо', active: false }
                        ])}
                        ${renderTier('Золото', '25%', 'gold', false, [
                            { text: 'Всё из Серебра', active: true },
                            { text: 'API доступ', active: true },
                            { text: 'Кастомные промо-материалы', active: true },
                            { text: 'Мгновенные выплаты', active: true },
                            { text: 'Персональный менеджер', active: true },
                            { text: 'Эксклюзивные предложения', active: true }
                        ])}
                    </div>
                </div>

                <!-- How it works -->
                <div class="partners-section">
                    <h2 class="partners-section__title">Как это <span class="text-gradient">работает</span></h2>
                    <div class="partner-steps">
                        <div class="partner-step reveal reveal-delay-1"><div class="partner-step__number">1</div><h3 class="partner-step__title">Регистрация</h3><p class="partner-step__desc">Подайте заявку на участие в партнёрской программе</p></div>
                        <div class="partner-step reveal reveal-delay-2"><div class="partner-step__number">2</div><h3 class="partner-step__title">Промо-материалы</h3><p class="partner-step__desc">Получите уникальные ссылки и баннеры для продвижения</p></div>
                        <div class="partner-step reveal reveal-delay-3"><div class="partner-step__number">3</div><h3 class="partner-step__title">Продвигайте</h3><p class="partner-step__desc">Размещайте ссылки на своих ресурсах и в соцсетях</p></div>
                        <div class="partner-step reveal reveal-delay-4"><div class="partner-step__number">4</div><h3 class="partner-step__title">Получайте доход</h3><p class="partner-step__desc">До 25% с каждой продажи по вашей партнёрской ссылке</p></div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="partner-stats">
                    <div class="partner-stat reveal reveal-delay-1">
                        <div class="partner-stat__icon"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
                        <div class="partner-stat__value">$2,340</div>
                        <div class="partner-stat__label">Общий доход партнёров</div>
                    </div>
                    <div class="partner-stat reveal reveal-delay-2">
                        <div class="partner-stat__icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
                        <div class="partner-stat__value">89</div>
                        <div class="partner-stat__label">Активных партнёров</div>
                    </div>
                    <div class="partner-stat reveal reveal-delay-3">
                        <div class="partner-stat__icon"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
                        <div class="partner-stat__value">$185</div>
                        <div class="partner-stat__label">Средний доход / мес</div>
                    </div>
                    <div class="partner-stat reveal reveal-delay-4">
                        <div class="partner-stat__icon"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                        <div class="partner-stat__value">98%</div>
                        <div class="partner-stat__label">Выплат вовремя</div>
                    </div>
                </div>

                <!-- Earnings -->
                <div class="partner-earnings reveal">
                    <div class="partner-earnings__header">
                        <div class="partner-earnings__title"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Ваши начисления</div>
                        <button class="btn btn-ghost btn-sm">Все выплаты</button>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="partner-earnings-table">
                            <thead><tr><th>Дата</th><th>Источник</th><th>Товар</th><th>Сумма</th><th>Статус</th></tr></thead>
                            <tbody>
                                ${earnings.map(e => `
                                    <tr>
                                        <td>${e.date}</td>
                                        <td>${e.source}</td>
                                        <td>${e.product}</td>
                                        <td><span class="partner-earning-amount">${e.amount}</span></td>
                                        <td><span class="partner-earning-status partner-earning-status--${e.status}">${e.status === 'paid' ? 'Выплачено' : 'Ожидание'}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Promo materials -->
                <div class="partners-section" style="margin-top:48px;">
                    <h2 class="partners-section__title">Промо <span class="text-gradient">материалы</span></h2>
                    <div class="partner-materials">
                        <div class="partner-material reveal reveal-delay-1">
                            <div class="partner-material__icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                            <h3 class="partner-material__title">Баннеры</h3>
                            <p class="partner-material__desc">Готовые баннеры для сайтов, блогов и соцсетей в разных размерах</p>
                        </div>
                        <div class="partner-material reveal reveal-delay-2">
                            <div class="partner-material__icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
                            <h3 class="partner-material__title">Ссылки</h3>
                            <p class="partner-material__desc">Уникальные отслеживаемые ссылки для каждого товара</p>
                        </div>
                        <div class="partner-material reveal reveal-delay-3">
                            <div class="partner-material__icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                            <h3 class="partner-material__title">Тексты</h3>
                            <p class="partner-material__desc">Готовые описания и шаблоны постов для социальных сетей</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initReveal();
    }

    function renderTier(name, percent, level, featured, features) {
        return `
            <div class="partner-tier ${featured ? 'partner-tier--featured' : ''} reveal">
                ${featured ? '<div class="partner-tier__badge">Популярный</div>' : ''}
                <div class="partner-tier__icon partner-tier__icon--${level}">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <h3 class="partner-tier__name">${name}</h3>
                <div class="partner-tier__percent">${percent}</div>
                <div class="partner-tier__percent-label">с каждой продажи</div>
                <div class="partner-tier__features">
                    ${features.map(f => `
                        <div class="partner-tier__feature ${f.active ? '' : 'partner-tier__feature--disabled'}">
                            <div class="partner-tier__feature-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
                            <span>${f.text}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="partner-tier__cta">
                    <button class="btn ${featured ? 'btn-primary' : 'btn-secondary'} btn-block">${featured ? 'Выбрать план' : 'Подробнее'}</button>
                </div>
            </div>
        `;
    }

    function initReveal() {
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('#page-partners .reveal').forEach(el => observer.observe(el));
        }, 100);
    }

    function init() { render(); }

    return { init };
})();