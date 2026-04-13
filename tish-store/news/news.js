/* =====================================================
   TISH STORE — NEWS PAGE MODULE v2
   ===================================================== */

const News = (() => {

  /* ── SVG-иконки вместо эмодзи ── */
  const ICONS = {
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    loader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    seed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12M12 12C12 7 7 4 2 4c0 5 3 10 10 8M12 12c0-5 5-8 10-8-0 5-3 10-10 8"/></svg>`,
    diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/></svg>`,
    gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    telegram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.04 9.613c-.153.678-.555.843-1.125.524l-3.093-2.28-1.492 1.435c-.165.165-.304.304-.623.304l.223-3.163 5.75-5.19c.25-.223-.054-.346-.387-.123l-7.106 4.473-3.06-.957c-.665-.207-.679-.665.138-.984l11.955-4.61c.554-.2 1.038.137.86.958z"/></svg>`,
    broadcast: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8.94a10 10 0 0 1 0 6.12M6 8.94a10 10 0 0 0 0 6.12M14.12 10a3 3 0 0 1 0 4M9.88 10a3 3 0 0 0 0 4"/><circle cx="12" cy="12" r="1"/></svg>`,
  };

  const MILESTONES = [
    { icon: 'check', label: 'Каталог товаров',      status: 'done' },
    { icon: 'check', label: 'Профиль пользователя', status: 'done' },
    { icon: 'check', label: 'Корзина и заказы',     status: 'done' },
    { icon: 'check', label: 'Чат с поддержкой',     status: 'done' },
    { icon: 'loader', label: 'NFT-магазин',         status: 'progress' },
    { icon: 'loader', label: 'Программы лояльности',status: 'progress' },
    { icon: 'clock',  label: 'Мобильное приложение',status: 'pending' },
    { icon: 'clock',  label: 'Реф. система v2',     status: 'pending' },
  ];

  const FEATURES = [
    { icon: 'diamond', name: 'NFT-магазин',          desc: 'Уникальные NFT, дающие привилегии и кастомизацию профиля.', status: 'wip',  statusLabel: 'В разработке' },
    { icon: 'gift',    name: 'Программы лояльности', desc: 'Кэшбек, подписки, бонусы и спецпредложения для участников.',status: 'wip',  statusLabel: 'В разработке' },
    { icon: 'users',   name: 'Партнёрская программа',desc: 'Зарабатывай, привлекая новых пользователей и партнёров.',  status: 'soon', statusLabel: 'Скоро' },
    { icon: 'phone',   name: 'Мобильное приложение', desc: 'iOS и Android с push-уведомлениями и полным функционалом.',  status: 'soon', statusLabel: 'Скоро' },
    { icon: 'star',    name: 'Расширенный профиль',  desc: 'Больше статистики, достижений, уровней и кастомизации.',    status: 'soon', statusLabel: 'Скоро' },
    { icon: 'globe',   name: 'Мультиязычность',      desc: 'Поддержка английского и других языков для пользователей.',  status: 'soon', statusLabel: 'Скоро' },
  ];

  function render() {
    const container = document.getElementById('page-news');
    if (!container) return;

    container.innerHTML = `
      <div class="news-page">

        <!-- HERO -->
        <div class="news-hero">
          <div class="news-hero__orb news-hero__orb--1"></div>
          <div class="news-hero__orb news-hero__orb--2"></div>
          <div class="news-hero__badge">
            <span class="news-hero__badge-dot"></span>
            Статус платформы
          </div>
          <h1 class="news-hero__title">
            Мы строим что-то<br>
            <span class="text-gradient">особенное</span>
          </h1>
          <p class="news-hero__subtitle">
            Команда TISH TEAM активно переносит функционал с Telegram-бота на сайт.
            Следите за обновлениями и помогайте нам становиться лучше!
          </p>
          <div class="news-hero__version">v2.0 · 2025</div>
        </div>

        <!-- PROGRESS -->
        <div class="news-progress-block">
          <div class="news-progress-block__glow"></div>
          <div class="news-progress-header">
            <div class="news-progress-title">
              ${ICONS.zap}
              Готовность платформы
            </div>
            <div class="news-progress-percent">50%</div>
          </div>
          <div class="news-progress-bar-wrap">
            <div class="news-progress-bar-fill"></div>
          </div>
          <div class="news-progress-labels">
            <span class="news-progress-label-item">
              ${ICONS.seed}
              Запуск
            </span>
            <span class="news-progress-label-center">Половина пути</span>
            <span class="news-progress-label-item">
              ${ICONS.target}
              Полный релиз
            </span>
          </div>
          <div class="news-milestones">
            ${MILESTONES.map((m, i) => `
              <div class="news-milestone news-milestone--${m.status}" style="animation-delay:${i * 0.07}s">
                <span class="news-milestone__icon news-milestone__icon--${m.status}">
                  ${ICONS[m.icon]}
                </span>
                <span>${m.label}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- COMING SOON -->
        <div class="news-coming-header">
          <div class="news-coming-title">
            ${ICONS.clock}
            Что появится дальше
          </div>
          <div class="news-coming-line"></div>
        </div>

        <div class="news-features-grid">
          ${FEATURES.map((f, i) => `
            <div class="news-feature-card" style="animation-delay:${0.1 + i * 0.07}s">
              <div class="news-feature-card__glow"></div>
              <div class="news-feature-icon">
                ${ICONS[f.icon]}
              </div>
              <div class="news-feature-name">${f.name}</div>
              <div class="news-feature-desc">${f.desc}</div>
              <div class="news-feature-status news-feature-status--${f.status}">
                <span class="news-feature-status__dot"></span>
                ${f.statusLabel}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- TG CTA -->
        <div class="news-tg-cta">
          <div class="news-tg-cta__bg"></div>
          <div class="news-tg-cta__icon">
            ${ICONS.broadcast}
          </div>
          <div class="news-tg-cta__title">Следи за нами в Telegram</div>
          <p class="news-tg-cta__desc">
            Все обновления, анонсы и эксклюзивные бонусы — в официальном канале TISH TEAM.
            Нашли баг? Сообщи нам и получи бонусы!
          </p>
          <a href="https://t.me/tishteamspace" target="_blank" rel="noopener" class="news-tg-btn">
            <span class="news-tg-btn__icon">${ICONS.telegram}</span>
            Подписаться на TISH TEAM
          </a>
        </div>

      </div>
    `;
  }

  function init() { render(); }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('page-news')?.classList.contains('active')) {
      News.init();
    }
  });

  return { init, render };
})();