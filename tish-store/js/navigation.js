/* =====================================================
   TISH STORE — NAVIGATION & PAGE MANAGEMENT v3
   Fixes: blur on mobile, profile auto-update,
   notifications, new pages support
   ===================================================== */

const Navigation = (() => {
    let currentPage = 'catalog';
    let sidebarOpen = false;
    let notifOpen = false;

    // DOM refs (lazy, после DOMContentLoaded)
    let navbar, sidebar, sidebarOverlay, pages, navLinks, sidebarLinks;

    /* ─────────────────────────────────────────
       PAGE MANAGEMENT
    ───────────────────────────────────────── */
    function showPage(pageId) {
        if (currentPage === pageId) {
            closeSidebar();
            return;
        }

        if (pageId === 'news' && typeof News !== 'undefined') {
            News.render();
        }
        
        currentPage = pageId;

        // Скрыть все страницы
        if (pages) {
            pages.forEach(page => {
                page.classList.remove('active');
            });
        }

        // Показать нужную
        const target = document.getElementById('page-' + pageId);
        if (target) {
            target.classList.add('active');
            // Запустить анимацию появления
            target.style.animation = 'none';
            target.offsetHeight; // reflow
            target.style.animation = '';
        }

        // Обновить активные ссылки navbar
        if (navLinks) {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.page === pageId);
            });
        }

        // Обновить активные ссылки sidebar
        if (sidebarLinks) {
            sidebarLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.page === pageId);
            });
        }

        closeSidebar();
        closeNotifPanel();

        window.scrollTo({ top: 0, behavior: 'smooth' });

        document.dispatchEvent(new CustomEvent('pageChange', {
            detail: { page: pageId }
        }));

        initPage(pageId);

        document.dispatchEvent(new CustomEvent('pageShown', {
            detail: { page: pageId }
        }));
    }

    function initPage(pageId) {
        switch (pageId) {
            case 'catalog':
                if (typeof Catalog !== 'undefined') Catalog.init();
                break;
            case 'favorites':
                if (typeof Catalog !== 'undefined') Catalog.renderFavorites();
                break;
            case 'profile':
                // Профиль всегда перезагружается при переходе
                if (typeof Profile !== 'undefined') {
                    Profile.init();
                    // Обновляем navbar аватар сразу
                    setTimeout(() => syncNavbarAvatar(), 100);
                }
                break;
            case 'chat':
                if (typeof Chat !== 'undefined') Chat.init();
                break;
            case 'subscription':
                if (typeof Subscription !== 'undefined') Subscription.init();
                break;
            case 'referrals':
                if (typeof Referrals !== 'undefined') Referrals.init();
                break;
            case 'nft-shop':
                if (typeof NftShop !== 'undefined') NftShop.init();
                break;
            case 'admin':
                if (typeof Admin !== 'undefined') Admin.init();
                break;
            case 'partners':
                if (typeof Partners !== 'undefined') Partners.init();
                break;
            case 'news':
                if (typeof News !== 'undefined') News.init();
                break;
            // Stub-страницы ничего не инициализируют
            case 'app-stub':
                break;
        }
    }

    function getCurrentPage() {
        return currentPage;
    }

    /* ─────────────────────────────────────────
       SIDEBAR
    ───────────────────────────────────────── */
    function toggleSidebar() {
        sidebarOpen ? closeSidebar() : openSidebar();
    }

    function openSidebar() {
        sidebarOpen = true;
        if (sidebar) {
            sidebar.classList.add('is-open');
            sidebar.classList.add('mobile-open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('is-visible');
            sidebarOverlay.classList.add('active');
        }
        document.body.classList.add('sidebar-mobile-open');
        // НЕ блюрим body — только перекрываем оверлеем
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebarOpen = false;
        if (sidebar) {
            sidebar.classList.remove('is-open');
            sidebar.classList.remove('mobile-open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('is-visible');
            sidebarOverlay.classList.remove('active');
        }
        document.body.classList.remove('sidebar-mobile-open');
        document.body.style.overflow = '';
    }

    /* ─────────────────────────────────────────
       NOTIFICATIONS PANEL
    ───────────────────────────────────────── */
    function toggleNotifPanel() {
        notifOpen ? closeNotifPanel() : openNotifPanel();
    }

    function openNotifPanel() {
        notifOpen = true;
        let panel = document.getElementById('notifPanel');
        if (!panel) {
            panel = buildNotifPanel();
            document.body.appendChild(panel);
        }
        // Загрузить уведомления
        renderNotifications(panel);
        panel.classList.add('is-open');
        // Кликнуть вне — закрыть
        setTimeout(() => {
            document.addEventListener('click', notifOutsideClick, { once: false });
        }, 10);
    }

    function closeNotifPanel() {
        notifOpen = false;
        const panel = document.getElementById('notifPanel');
        if (panel) panel.classList.remove('is-open');
        document.removeEventListener('click', notifOutsideClick);
    }

    function notifOutsideClick(e) {
        const panel = document.getElementById('notifPanel');
        const btn = document.getElementById('notifBtn');
        if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
            closeNotifPanel();
        }
    }

    function buildNotifPanel() {
        const panel = document.createElement('div');
        panel.id = 'notifPanel';
        panel.className = 'notif-panel';
        panel.innerHTML = `
            <div class="notif-panel__header">
                <div class="notif-panel__title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Уведомления
                </div>
                <button class="notif-panel__clear" onclick="Navigation.clearNotifications()">
                    Очистить
                </button>
            </div>
            <div class="notif-panel__list" id="notifList">
                <div class="notif-panel__empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span>Нет уведомлений</span>
                </div>
            </div>
        `;
        return panel;
    }

    function renderNotifications(panel) {
        const list = panel.querySelector('#notifList');
        if (!list) return;

        // Читаем уведомления из storage
        let notifications = [];
        try {
            const raw = localStorage.getItem('tish_notifications');
            if (raw) notifications = JSON.parse(raw);
        } catch (e) { notifications = []; }

        // Марка "прочитано"
        notifications.forEach(n => n.read = true);
        try {
            localStorage.setItem('tish_notifications', JSON.stringify(notifications));
            if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_notifications', notifications);
        } catch (e) {}

        // Обновить бейдж
        updateNotifBadge(0);

        if (!notifications.length) {
            list.innerHTML = `
                <div class="notif-panel__empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span>Нет уведомлений</span>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications
            .slice()
            .reverse()
            .map(n => `
                <div class="notif-item ${n.read ? '' : 'notif-item--unread'}">
                    <div class="notif-item__icon notif-item__icon--${n.type || 'info'}">
                        ${getNotifIcon(n.type)}
                    </div>
                    <div class="notif-item__body">
                        <div class="notif-item__text">${n.message || n.text || ''}</div>
                        <div class="notif-item__time">${formatNotifTime(n.time || n.date)}</div>
                    </div>
                </div>
            `).join('');
    }

    function getNotifIcon(type) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            order:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
            info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        };
        return icons[type] || icons.info;
    }

    function formatNotifTime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'только что';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' мин. назад';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' ч. назад';
        return d.toLocaleDateString('ru-RU');
    }

    function clearNotifications() {
        try {
            localStorage.setItem('tish_notifications', JSON.stringify([]));
            if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_notifications', []);
        } catch (e) {}
        const panel = document.getElementById('notifPanel');
        if (panel) renderNotifications(panel);
        updateNotifBadge(0);
    }

    function addNotification(message, type = 'info') {
        let notifications = [];
        try {
            const raw = localStorage.getItem('tish_notifications');
            if (raw) notifications = JSON.parse(raw);
        } catch (e) {}

        notifications.push({
            id: Date.now(),
            message,
            type,
            time: Date.now(),
            read: false
        });

        // Максимум 50 уведомлений
        if (notifications.length > 50) notifications = notifications.slice(-50);

        try {
            localStorage.setItem('tish_notifications', JSON.stringify(notifications));
            if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_notifications', notifications);
        } catch (e) {}

        const unread = notifications.filter(n => !n.read).length;
        updateNotifBadge(unread);

        // Звонок колокольчика
        const bellBtn = document.getElementById('notifBtn');
        if (bellBtn) {
            bellBtn.classList.add('notif-bell--ringing');
            setTimeout(() => bellBtn.classList.remove('notif-bell--ringing'), 800);
        }
    }

    function updateNotifBadge(count) {
        const dot = document.querySelector('#notifBtn .navbar__notification-dot');
        if (!dot) return;
        if (count > 0) {
            dot.textContent = count > 9 ? '9+' : count;
            dot.classList.add('notif-dot--visible');
            dot.style.display = 'flex';
        } else {
            dot.classList.remove('notif-dot--visible');
            dot.style.display = 'none';
        }
    }

    function loadNotifBadge() {
        try {
            const raw = localStorage.getItem('tish_notifications');
            if (!raw) return;
            const notifications = JSON.parse(raw);
            const unread = notifications.filter(n => !n.read).length;
            updateNotifBadge(unread);
        } catch (e) {}
    }

    /* ─────────────────────────────────────────
       NAVBAR AVATAR SYNC
       Автоматически обновляет аватар в navbar
    ───────────────────────────────────────── */
    function syncNavbarAvatar() {
        const navAvatar = document.getElementById('navAvatar');
        if (!navAvatar) return;

        let profileData = null;
        try {
            // Пробуем несколько ключей
            const keys = ['tish_profile', 'profile'];
            for (const key of keys) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    profileData = JSON.parse(raw);
                    break;
                }
            }
        } catch (e) {}

        if (!profileData) return;

        const avatar = String(profileData.avatar || profileData.avatarUrl || '').trim();
        const name   = profileData.name   || profileData.username || '';

        // Обновить аватар
        if (avatar) {
            navAvatar.style.backgroundImage  = `url(${avatar})`;
            navAvatar.style.backgroundSize   = 'cover';
            navAvatar.style.backgroundPosition = 'center';
            const svg = navAvatar.querySelector('svg');
            if (svg) svg.style.opacity = '0';
        } else {
            navAvatar.style.backgroundImage = '';
            const svg = navAvatar.querySelector('svg');
            if (svg) svg.style.opacity = '1';
        }

        // Обновить сайдбар
        const sidebarName = document.getElementById('sidebarUserName');
        const sidebarRole = document.getElementById('sidebarUserRole');
        if (sidebarName && name) sidebarName.textContent = name;
        if (sidebarRole) {
            const level = profileData.level || 1;
            const ranks = ['','Новичок','Любитель','Профи','Эксперт','Мастер','Легенда'];
            sidebarRole.textContent = `Ур. ${level} — ${ranks[level] || 'Новичок'}`;
        }

        // Обновить аватар в sidebar__user-top
        const sidebarAvatar = document.querySelector('.sidebar__user-top .sidebar__user-avatar');
        if (sidebarAvatar) {
            if (avatar) {
                sidebarAvatar.style.backgroundImage  = `url(${avatar})`;
                sidebarAvatar.style.backgroundSize   = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
                const svg = sidebarAvatar.querySelector('svg');
                if (svg) svg.style.opacity = '0';
            } else {
                sidebarAvatar.style.backgroundImage = '';
                const svg = sidebarAvatar.querySelector('svg');
                if (svg) svg.style.opacity = '1';
            }
        }
    }

    /* ─────────────────────────────────────────
       SCROLL HANDLER
    ───────────────────────────────────────── */
    function handleScroll() {
        if (!navbar) return;
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    }

    /* ─────────────────────────────────────────
       PARALLAX (лёгкий эффект на bg-orbs)
    ───────────────────────────────────────── */
    function initParallax() {
        const orbs = document.querySelectorAll('.bg-orb');
        if (!orbs.length) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                orbs.forEach((orb, i) => {
                    const speed = 0.05 + i * 0.03;
                    const direction = i % 2 === 0 ? 1 : -1;
                    orb.style.transform = `translateY(${y * speed * direction}px)`;
                });
                ticking = false;
            });
        }, { passive: true });

        // Mouse parallax (desktop)
        if (window.matchMedia('(hover: hover)').matches) {
            document.addEventListener('mousemove', (e) => {
                const cx = window.innerWidth  / 2;
                const cy = window.innerHeight / 2;
                const dx = (e.clientX - cx) / cx;
                const dy = (e.clientY - cy) / cy;

                orbs.forEach((orb, i) => {
                    const strength = 8 + i * 4;
                    orb.style.transform +=
                        ` translate(${dx * strength}px, ${dy * strength}px)`;
                });
            });
        }
    }

    /* ─────────────────────────────────────────
       STARS (фоновые звёзды)
    ───────────────────────────────────────── */
    function initStars() {
        const container = document.getElementById('starsContainer');
        if (!container) return;
        container.innerHTML = '';
        const count = window.innerWidth < 768 ? 30 : 60;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2.5 + 1;
            star.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                --dur: ${Math.random() * 4 + 3}s;
                --opacity: ${Math.random() * 0.5 + 0.2};
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(star);
        }
    }

    /* ─────────────────────────────────────────
       ACTIVE LINK INDICATOR (подчёркивание)
    ───────────────────────────────────────── */
    function initNavIndicator() {
        const nav = document.querySelector('.navbar__nav');
        if (!nav) return;

        // Создаём скользящий индикатор
        const indicator = document.createElement('div');
        indicator.className = 'navbar__nav-indicator';
        nav.appendChild(indicator);

        function moveIndicator(el) {
            if (!el) {
                indicator.style.opacity = '0';
                return;
            }
            const navRect  = nav.getBoundingClientRect();
            const elRect   = el.getBoundingClientRect();
            indicator.style.opacity  = '1';
            indicator.style.width    = elRect.width  + 'px';
            indicator.style.left     = (elRect.left - navRect.left) + 'px';
        }

        const activeLink = nav.querySelector('.navbar__link.active');
        if (activeLink) moveIndicator(activeLink);

        document.addEventListener('pageChange', (e) => {
            const link = nav.querySelector(
                `.navbar__link[data-page="${e.detail.page}"]`
            );
            moveIndicator(link);
        });

        nav.querySelectorAll('.navbar__link').forEach(link => {
            link.addEventListener('mouseenter', () => moveIndicator(link));
            link.addEventListener('mouseleave', () => {
                const active = nav.querySelector('.navbar__link.active');
                moveIndicator(active);
            });
        });
    }

    /* ─────────────────────────────────────────
       CART BADGE SYNC
    ───────────────────────────────────────── */
    function syncCartBadge() {
        const countEls = document.querySelectorAll('[data-cart-count]');
        try {
            const raw = localStorage.getItem('tish_cart');
            const cart = raw ? JSON.parse(raw) : [];
            const count = Array.isArray(cart) ? cart.length : 0;
            countEls.forEach(el => {
                el.textContent = count;
                if (el.tagName === 'SPAN') {
                    el.style.display = count > 0 ? 'flex' : 'none';
                }
            });
        } catch (e) {
            countEls.forEach(el => {
                el.textContent = '0';
                el.style.display = 'none';
            });
        }
    }

    /* ─────────────────────────────────────────
       FAV BADGE SYNC
    ───────────────────────────────────────── */
    function syncFavBadge() {
        const countEls = document.querySelectorAll('[data-fav-count]');
        try {
            const raw = localStorage.getItem('tish_favorites');
            const favs = raw ? JSON.parse(raw) : [];
            const count = Array.isArray(favs) ? favs.length : 0;
            countEls.forEach(el => {
                el.textContent = count;
            });
        } catch (e) {
            countEls.forEach(el => { el.textContent = '0'; });
        }
    }

    /* ─────────────────────────────────────────
       SIDEBAR TOGGLE (кнопка слева)
    ───────────────────────────────────────── */
    function initSidebarToggle() {
        const toggleBtn = document.getElementById('sidebarToggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-hidden');
            localStorage.setItem(
                'sidebar-hidden',
                document.body.classList.contains('sidebar-hidden')
            );
        });

        // Восстановить состояние
        if (localStorage.getItem('sidebar-hidden') === 'true') {
            document.body.classList.add('sidebar-hidden');
        }
    }

    /* ─────────────────────────────────────────
       INIT
    ───────────────────────────────────────── */
    function init() {
        // Инициализировать DOM refs
        navbar          = document.getElementById('navbar');
        sidebar         = document.getElementById('sidebar');
        sidebarOverlay  = document.getElementById('sidebarOverlay');
        pages           = document.querySelectorAll('.page-section');
        navLinks        = document.querySelectorAll('.navbar__link');
        sidebarLinks    = document.querySelectorAll('.sidebar__link[data-page]');

        // Nav links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) showPage(page);
            });
        });

        // Sidebar links
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) showPage(page);
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 1024) closeSidebar();
            });
        });

        // Mobile menu button
        const mobileBtn = document.getElementById('mobileMenuBtn');
        if (mobileBtn) mobileBtn.addEventListener('click', toggleSidebar);

        // Overlay click → close sidebar
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeSidebar);
        }

        // Avatar → profile page
        const avatarBtn = document.getElementById('navAvatar');
        if (avatarBtn) {
            avatarBtn.addEventListener('click', () => showPage('profile'));
        }

        // Notification button — handled by Notifications module (index.html)

        // Scroll
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Reset mobile drawer state on viewport grow
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });

        // Keyboard Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSidebar();
                closeNotifPanel();
                document.dispatchEvent(new CustomEvent('closeModals'));
            }
        });

        // Синхронизация данных при загрузке
        syncNavbarAvatar();
        syncCartBadge();
        syncFavBadge();

        // Переинициализировать синхронизацию при изменении storage
        window.addEventListener('storage', (e) => {
            if (e.key === 'tish_profile' || e.key === 'profile') {
                syncNavbarAvatar();
            }
            if (e.key === 'tish_cart') syncCartBadge();
            if (e.key === 'tish_favorites') syncFavBadge();
            // tish_notifications badge handled by Notifications module
        });

        // Слушаем события от других модулей
        document.addEventListener('profileUpdated', () => {
            syncNavbarAvatar();
        });
        document.addEventListener('cartUpdated', () => {
            syncCartBadge();
        });
        document.addEventListener('favoritesUpdated', () => {
            syncFavBadge();
        });

        // Sidebar toggle button
        initSidebarToggle();

        // Parallax
        initParallax();

        // Stars
        initStars();

        // Nav indicator (desktop)
        if (window.innerWidth > 1024) {
            initNavIndicator();
        }

        // Первая страница
        initPage(currentPage);

        // Периодическая синхронизация аватара (раз в 2 сек)
        setInterval(() => {
            syncNavbarAvatar();
            syncCartBadge();
            syncFavBadge();
        }, 2000);
    }

    /* ─────────────────────────────────────────
       PUBLIC API
    ───────────────────────────────────────── */
    return {
        init,
        showPage,
        getCurrentPage,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        toggleNotifPanel,
        openNotifPanel,
        closeNotifPanel,
        addNotification,
        clearNotifications,
        updateNotifBadge,
        syncNavbarAvatar,
        syncCartBadge,
        syncFavBadge,
    };
})();