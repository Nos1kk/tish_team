/* =====================================================
   TISH STORE — NAVIGATION & PAGE MANAGEMENT v3
   Fixes: blur on mobile, profile auto-update,
   notifications, new pages support
   ===================================================== */

const Navigation = (() => {
    let currentPage = 'catalog';
    let sidebarOpen = false;
    let notifOpen = false;
    let helpMenuOpen = false;
    let helpCloseTimer = null;
    let leftSidebarHoverOpen = false;
    let leftSidebarHoverEnabled = false;
    let leftSidebarHoverCloseTimer = null;

    // DOM refs (lazy, после DOMContentLoaded)
    let navbar, sidebar, sidebarOverlay, pages, navLinks, sidebarLinks;
    let helpRoot, helpTrigger, helpPanel;
    let leftSidebarHoverTrigger;

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
        closeHelpMenu(0);

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
        if (leftSidebarHoverEnabled && window.innerWidth > 1024) {
            leftSidebarHoverOpen ? closeLeftSidebarHover(0) : openLeftSidebarHover();
            return;
        }
        sidebarOpen ? closeSidebar() : openSidebar();
    }

    function openSidebar() {
        const isDrawerViewport = window.innerWidth <= 1024;

        if (!isDrawerViewport && leftSidebarHoverEnabled) {
            openLeftSidebarHover();
            return;
        }

        sidebarOpen = true;
        if (sidebar) {
            sidebar.classList.add('is-open');
            sidebar.classList.add('mobile-open');
        }
        if (sidebarOverlay) {
            if (isDrawerViewport) {
                sidebarOverlay.classList.remove('is-visible');
                sidebarOverlay.classList.remove('active');
            } else {
                sidebarOverlay.classList.add('is-visible');
                sidebarOverlay.classList.add('active');
            }
        }
        document.body.classList.add('sidebar-mobile-open');
        // На mobile/tablet не блокируем скролл body, чтобы избежать resize-loop и зависшего оверлея
        document.body.style.overflow = isDrawerViewport ? '' : 'hidden';
    }

    function closeSidebar() {
        if (leftSidebarHoverEnabled && window.innerWidth > 1024) {
            closeLeftSidebarHover(0);
        }

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

    /* ─────────────────────────────────────────
       HELP MENU (hover + graceful hide)
    ───────────────────────────────────────── */
    function setHelpMenuState(open) {
        helpMenuOpen = !!open;
        if (!helpRoot || !helpTrigger || !helpPanel) return;

        helpRoot.classList.toggle('is-open', helpMenuOpen);
        helpTrigger.setAttribute('aria-expanded', helpMenuOpen ? 'true' : 'false');
        helpPanel.setAttribute('aria-hidden', helpMenuOpen ? 'false' : 'true');

        if (helpMenuOpen) {
            helpPanel.style.opacity = '1';
            helpPanel.style.visibility = 'visible';
            helpPanel.style.pointerEvents = 'auto';
            helpPanel.style.transform = 'translateX(0) scale(1)';
        } else {
            helpPanel.style.opacity = '0';
            helpPanel.style.visibility = 'hidden';
            helpPanel.style.pointerEvents = 'none';
            helpPanel.style.transform = 'translateX(10px) scale(0.98)';
        }
    }

    function openHelpMenu() {
        if (helpCloseTimer) {
            clearTimeout(helpCloseTimer);
            helpCloseTimer = null;
        }
        setHelpMenuState(true);
    }

    function closeHelpMenu(delayMs = 90) {
        if (helpCloseTimer) {
            clearTimeout(helpCloseTimer);
            helpCloseTimer = null;
        }

        const delay = Number(delayMs) || 0;
        if (delay <= 0) {
            setHelpMenuState(false);
            return;
        }

        helpCloseTimer = setTimeout(() => {
            setHelpMenuState(false);
            helpCloseTimer = null;
        }, delay);
    }

    function initHelpMenu() {
        helpRoot = document.getElementById('navbarHelp');
        helpTrigger = document.getElementById('navbarHelpTrigger');
        helpPanel = document.getElementById('navbarHelpMenu');
        const actionsRoot = helpRoot?.closest('.navbar__actions');

        if (!helpRoot || !helpTrigger || !helpPanel) {
            return;
        }

        const hasHover = window.matchMedia
            ? window.matchMedia('(hover: hover)').matches && window.matchMedia('(pointer: fine)').matches
            : true;

        if (hasHover) {
            helpRoot.addEventListener('mouseenter', () => openHelpMenu());
            helpRoot.addEventListener('mouseleave', () => closeHelpMenu(90));

            if (actionsRoot) {
                actionsRoot.addEventListener('mouseenter', () => openHelpMenu());
                actionsRoot.addEventListener('mouseleave', () => closeHelpMenu(90));
            }
        }

        helpRoot.addEventListener('focusin', () => openHelpMenu());
        helpRoot.addEventListener('focusout', (event) => {
            if (!helpRoot.contains(event.relatedTarget)) {
                closeHelpMenu(70);
            }
        });

        helpTrigger.addEventListener('click', (event) => {
            if (hasHover) {
                event.preventDefault();
                openHelpMenu();
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            setHelpMenuState(!helpMenuOpen);
        });

        helpRoot.querySelectorAll('[data-help-page]').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const pageId = item.dataset.helpPage;
                closeHelpMenu(0);
                if (pageId) showPage(pageId);
            });
        });

        helpRoot.querySelectorAll('[data-help-close]').forEach((item) => {
            item.addEventListener('click', () => {
                closeHelpMenu(0);
            });
        });

        document.addEventListener('click', (event) => {
            if (helpMenuOpen && helpRoot && !helpRoot.contains(event.target)) {
                closeHelpMenu(0);
            }
        });
    }

    /* ─────────────────────────────────────────
       LEFT SIDEBAR HOVER (desktop)
    ───────────────────────────────────────── */
    function isDesktopHoverSidebarViewport() {
        const hasHover = window.matchMedia
            ? window.matchMedia('(hover: hover)').matches && window.matchMedia('(pointer: fine)').matches
            : true;
        return hasHover && window.innerWidth > 1024;
    }

    function getNavbarHeight() {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height');
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : 72;
    }

    function setLeftSidebarHoverState(open) {
        leftSidebarHoverOpen = !!open;
        const canShow = leftSidebarHoverOpen && leftSidebarHoverEnabled && !document.body.classList.contains('sidebar-hidden');
        document.body.classList.toggle('sidebar-hover-open', canShow);
    }

    function openLeftSidebarHover() {
        if (!leftSidebarHoverEnabled || document.body.classList.contains('sidebar-hidden')) return;

        if (leftSidebarHoverCloseTimer) {
            clearTimeout(leftSidebarHoverCloseTimer);
            leftSidebarHoverCloseTimer = null;
        }

        setLeftSidebarHoverState(true);
    }

    function closeLeftSidebarHover(delayMs = 180) {
        if (leftSidebarHoverCloseTimer) {
            clearTimeout(leftSidebarHoverCloseTimer);
            leftSidebarHoverCloseTimer = null;
        }

        const delay = Number(delayMs) || 0;
        if (delay <= 0) {
            setLeftSidebarHoverState(false);
            return;
        }

        leftSidebarHoverCloseTimer = setTimeout(() => {
            setLeftSidebarHoverState(false);
            leftSidebarHoverCloseTimer = null;
        }, delay);
    }

    function refreshLeftSidebarHoverMode() {
        leftSidebarHoverEnabled = isDesktopHoverSidebarViewport();
        document.body.classList.toggle('sidebar-hover-enabled', leftSidebarHoverEnabled);

        if (!leftSidebarHoverEnabled || document.body.classList.contains('sidebar-hidden')) {
            closeLeftSidebarHover(0);
        }
    }

    function handleLeftSidebarProximity(event) {
        if (!leftSidebarHoverEnabled || !sidebar || document.body.classList.contains('sidebar-hidden')) return;

        if (event.clientY <= getNavbarHeight() + 4) {
            if (leftSidebarHoverOpen) closeLeftSidebarHover(120);
            return;
        }

        const edgeThreshold = Math.max(10, Math.min(24, Math.round(window.innerWidth * 0.018)));
        if (event.clientX <= edgeThreshold) {
            openLeftSidebarHover();
            return;
        }

        if (!leftSidebarHoverOpen) return;

        const rect = sidebar.getBoundingClientRect();
        const pad = 24;
        const isNearSidebar =
            event.clientX >= rect.left - 8 &&
            event.clientX <= rect.right + pad &&
            event.clientY >= rect.top - pad &&
            event.clientY <= rect.bottom + pad;

        if (!isNearSidebar) {
            closeLeftSidebarHover(190);
        }
    }

    function initLeftSidebarHover() {
        leftSidebarHoverTrigger = document.getElementById('leftSidebarHoverTrigger');

        refreshLeftSidebarHoverMode();

        document.addEventListener('mousemove', handleLeftSidebarProximity, { passive: true });

        if (sidebar) {
            sidebar.addEventListener('mouseenter', () => openLeftSidebarHover());
            sidebar.addEventListener('mouseleave', () => closeLeftSidebarHover(210));
            sidebar.addEventListener('focusin', () => openLeftSidebarHover());
            sidebar.addEventListener('focusout', (event) => {
                if (!sidebar.contains(event.relatedTarget)) {
                    closeLeftSidebarHover(140);
                }
            });
        }

        if (leftSidebarHoverTrigger) {
            leftSidebarHoverTrigger.addEventListener('mouseenter', () => openLeftSidebarHover());
            leftSidebarHoverTrigger.addEventListener('mouseleave', () => closeLeftSidebarHover(180));
            leftSidebarHoverTrigger.addEventListener('focusin', () => openLeftSidebarHover());
            leftSidebarHoverTrigger.addEventListener('focusout', () => closeLeftSidebarHover(120));
        }

        document.addEventListener('click', (event) => {
            if (!leftSidebarHoverOpen || !leftSidebarHoverEnabled || !sidebar) return;
            if (sidebar.contains(event.target)) return;
            if (leftSidebarHoverTrigger && leftSidebarHoverTrigger.contains(event.target)) return;
            closeLeftSidebarHover(0);
        });

        window.addEventListener('resize', refreshLeftSidebarHoverMode, { passive: true });
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
    function _readJsonSafe(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function _applyAvatarToContainer(container, avatarUrl) {
        if (!container) return;

        const avatar = String(avatarUrl || '').trim();
        const hasAvatar = !!avatar && avatar !== 'null' && avatar !== 'undefined';
        const icon = container.querySelector('svg');
        let img = container.querySelector('img.global-avatar');

        container.style.backgroundImage = '';

        if (!hasAvatar) {
            if (img) img.remove();
            if (icon) icon.style.opacity = '1';
            return;
        }

        if (!img) {
            img = document.createElement('img');
            img.className = 'global-avatar';
            img.alt = 'avatar';
            img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;z-index:2;';
            container.style.position = 'relative';
            container.appendChild(img);
        }

        img.onerror = () => {
            if (img) img.remove();
            if (icon) icon.style.opacity = '1';
        };
        img.src = avatar;
        if (icon) icon.style.opacity = '0';
    }

    function syncNavbarAvatar() {
        const navAvatar = document.getElementById('navAvatar');
        if (!navAvatar) return;

        const authData = _readJsonSafe('tish_auth') || (typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null);
        const authGoogleId = String(authData?.googleId || '').trim();

        let profileData = _readJsonSafe('tish_profile') || _readJsonSafe('profile');
        if ((!profileData || typeof profileData !== 'object') && authGoogleId) {
            profileData = _readJsonSafe('tish_profile_' + authGoogleId);
        }
        if ((!profileData || typeof profileData !== 'object') && authData && typeof authData === 'object') {
            profileData = { ...authData };
        }

        const avatar = String(profileData?.avatar || profileData?.avatarUrl || authData?.avatar || '').trim();
        const name = profileData?.name || profileData?.username || authData?.name || '';

        _applyAvatarToContainer(navAvatar, avatar);

        // Обновить сайдбар
        const sidebarName = document.getElementById('sidebarUserName');
        const sidebarRole = document.getElementById('sidebarUserRole');
        if (sidebarName && name) sidebarName.textContent = name;
        if (sidebarRole) {
            const level = Number(profileData?.level || 1);
            const ranks = ['','Новичок','Любитель','Профи','Эксперт','Мастер','Легенда'];
            sidebarRole.textContent = `Ур. ${level} — ${ranks[level] || 'Новичок'}`;
        }

        // Обновить аватар в sidebar__user-top
        const sidebarAvatar = document.querySelector('.sidebar__user-top .sidebar__user-avatar');
        _applyAvatarToContainer(sidebarAvatar, avatar);
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
            refreshLeftSidebarHoverMode();
        });

        // Восстановить состояние
        if (localStorage.getItem('sidebar-hidden') === 'true') {
            document.body.classList.add('sidebar-hidden');
        }

        refreshLeftSidebarHoverMode();
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

        // Help dropdown in navbar
        initHelpMenu();

        // Left sidebar hover mode (desktop)
        initLeftSidebarHover();

        // Scroll
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Reset mobile drawer state on viewport grow
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                closeSidebar();
            }
        });

        // Keyboard Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSidebar();
                closeNotifPanel();
                closeHelpMenu(0);
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