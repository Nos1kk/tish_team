/* =====================================================
   TISH STORE — REFERRALS MODULE
   by Tish Team
   ===================================================== */

const Referrals = (() => {
    const referralUsers = [
        { name: 'Мария К.', date: '12 Дек', purchases: 8, earned: '$45.60', status: 'active' },
        { name: 'Дмитрий В.', date: '08 Дек', purchases: 5, earned: '$32.10', status: 'active' },
        { name: 'Анна С.', date: '01 Дек', purchases: 3, earned: '$18.50', status: 'active' },
        { name: 'Игорь Л.', date: '25 Ноя', purchases: 0, earned: '$0.00', status: 'pending' },
        { name: 'Елена П.', date: '20 Ноя', purchases: 6, earned: '$38.40', status: 'active' },
        { name: 'Сергей М.', date: '15 Ноя', purchases: 2, earned: '$12.80', status: 'active' },
        { name: 'Ольга Д.', date: '10 Ноя', purchases: 1, earned: '$5.90', status: 'active' },
        { name: 'Артём К.', date: '05 Ноя', purchases: 0, earned: '$0.00', status: 'pending' },
        { name: 'Наталья Б.', date: '01 Ноя', purchases: 4, earned: '$24.00', status: 'active' },
        { name: 'Павел Р.', date: '28 Окт', purchases: 7, earned: '$41.30', status: 'active' },
        { name: 'Ирина Г.', date: '20 Окт', purchases: 2, earned: '$11.60', status: 'active' },
        { name: 'Максим Н.', date: '15 Окт', purchases: 0, earned: '$0.00', status: 'pending' },
    ];

    const milestones = [
        { count: 5, label: 'рефералов', reward: '+50 DV', completed: true },
        { count: 10, label: 'рефералов', reward: '+150 DV', completed: true },
        { count: 15, label: 'рефералов', reward: '+300 DV', current: true },
        { count: 25, label: 'рефералов', reward: '+500 DV', locked: true },
        { count: 50, label: 'рефералов', reward: '+1000 DV', locked: true },
        { count: 100, label: 'рефералов', reward: 'VIP статус', locked: true },
    ];

    function render() {
        const page = document.querySelector('#page-referrals .container');
        if (!page) return;

        page.innerHTML = `
            <div class="referrals-page">
                <!-- Hero -->
                <div class="referral-hero reveal">
                    <div class="referral-hero__particles">
                        ${Array.from({length: 8}, (_, i) => `<div class="referral-hero__particle" style="left:${10+Math.random()*80}%;top:${10+Math.random()*80}%;--dur:${8+Math.random()*12}s;animation-delay:${Math.random()*5}s;width:${2+Math.random()*3}px;height:${2+Math.random()*3}px;"></div>`).join('')}
                    </div>
                    <div class="referral-hero__content">
                        <div class="referral-hero__text">
                            <h1>Приглашай друзей,<br>зарабатывай вместе</h1>
                            <p>Делитесь своей реферальной ссылкой и получайте 15% с каждой покупки приглашённого. Без лимитов, без ограничений.</p>
                            <button class="btn btn-lg" style="background:white;color:var(--purple-600);box-shadow:0 8px 30px rgba(0,0,0,0.15);" onclick="App.copyToClipboard('tish.store/ref/alex')">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                Скопировать ссылку
                            </button>
                        </div>
                        <div class="referral-hero__link-box">
                            <div class="referral-hero__link-label">Ваша реферальная ссылка</div>
                            <div class="referral-hero__link-row">
                                <input type="text" class="referral-hero__link-input" value="tish.store/ref/alex" readonly>
                                <button class="referral-hero__copy-btn" onclick="App.copyToClipboard('tish.store/ref/alex')">Копировать</button>
                            </div>
                            <div class="referral-hero__link-label" style="margin-top:16px;">Поделиться</div>
                            <div class="referral-hero__share-row">
                                <button class="referral-share-btn"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Telegram</button>
                                <button class="referral-share-btn"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>Соцсети</button>
                                <button class="referral-share-btn"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>Stories</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="referral-stats-grid">
                    <div class="referral-stat-card reveal reveal-delay-1">
                        <div class="referral-stat-card__value">12</div>
                        <div class="referral-stat-card__label">Приглашённых</div>
                        <div class="referral-stat-card__trend"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>+3 за месяц</div>
                    </div>
                    <div class="referral-stat-card reveal reveal-delay-2">
                        <div class="referral-stat-card__value">$380</div>
                        <div class="referral-stat-card__label">Заработано всего</div>
                        <div class="referral-stat-card__trend"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>+$85 за месяц</div>
                    </div>
                    <div class="referral-stat-card reveal reveal-delay-3">
                        <div class="referral-stat-card__value">9</div>
                        <div class="referral-stat-card__label">Активных рефералов</div>
                        <div class="referral-stat-card__trend"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>75% активности</div>
                    </div>
                </div>

                <!-- Milestones -->
                <div class="referral-milestones reveal">
                    <div class="referral-milestones__title">
                        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Достижения и бонусы
                    </div>
                    <div class="milestone-track">
                        ${milestones.map(m => {
                            const state = m.completed ? 'completed' : m.current ? 'current' : 'locked';
                            const iconSvg = m.completed
                                ? '<polyline points="20 6 9 17 4 12"/>'
                                : m.current
                                    ? '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'
                                    : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
                            return `
                                <div class="milestone milestone--${state}">
                                    <div class="milestone__icon"><svg viewBox="0 0 24 24">${iconSvg}</svg></div>
                                    <div class="milestone__count">${m.count}</div>
                                    <div class="milestone__label">${m.label}</div>
                                    <div class="milestone__reward">${m.reward}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Network -->
                <div class="referral-network reveal">
                    <div class="referral-network__header">
                        <div class="referral-network__title">
                            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Ваши рефералы
                        </div>
                        <span style="font-size:0.85rem;color:var(--color-muted);">${referralUsers.length} человек</span>
                    </div>
                    <div class="referral-users">
                        ${referralUsers.map((u, i) => `
                            <div class="referral-user-card reveal reveal-delay-${Math.min(i+1, 10)}">
                                <div class="referral-user-card__avatar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    <span class="referral-user-card__status referral-user-card__status--${u.status}"></span>
                                </div>
                                <div class="referral-user-card__info">
                                    <div class="referral-user-card__name">${u.name}</div>
                                    <div class="referral-user-card__meta">${u.date} · ${u.purchases} покупок</div>
                                </div>
                                <div class="referral-user-card__earned">${u.earned}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        initReveal();
    }

    function initReveal() {
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('#page-referrals .reveal').forEach(el => observer.observe(el));
        }, 100);
    }

    function init() { render(); }
    return { init };
})();