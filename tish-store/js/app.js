/* =====================================================
   TISH STORE — MAIN APPLICATION v3
   Fixes: notifications integration, profile auto-sync,
   favorites persistence, nav bridge
   ===================================================== */

const App = (() => {

    /* ─────────────────────────────────────────
       GLOBAL STATE
    ───────────────────────────────────────── */
    const state = {
        user: {
            id: 1,
            name: 'Пользователь',
            username: '',
            avatar: null,
            role: 'user',
            verified: false,
            level: 1,
            xp: 0,
            maxXp: 100,
            balance: 0,
            currency: 0,
            joinDate: new Date().toISOString().split('T')[0],
            bio: '',
            tags: [],
            stats: {
                purchases: 0,
                referrals: 0,
                earned: 0,
                rating: 5.0
            }
        },
        isAdmin: false,
        notifications: [],
        favorites: new Set()
    };

    const SCROLL_LOCK_CLASS = 'scroll-locked';
    let scrollLockState = null;

    function normalizeFavoriteId(productId) {
        return String(productId ?? '').trim();
    }

    /* ─────────────────────────────────────────
       FAVORITES — с persistence в localStorage
    ───────────────────────────────────────── */
    function loadFavorites() {
        try {
            const raw = localStorage.getItem('tish_favorites');
            if (raw) {
                const arr = JSON.parse(raw);
                state.favorites = new Set(
                    Array.isArray(arr)
                        ? arr.map(normalizeFavoriteId).filter(Boolean)
                        : []
                );
            }
        } catch (e) {
            state.favorites = new Set();
        }
    }

    function saveFavorites() {
        try {
            const data = [...state.favorites];
            localStorage.setItem('tish_favorites', JSON.stringify(data));
            if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_favorites', data);
        } catch (e) {}
    }

    function toggleFavorite(productId) {
        const id = normalizeFavoriteId(productId);
        if (!id) return;
        if (state.favorites.has(id)) {
            state.favorites.delete(id);
        } else {
            state.favorites.add(id);
        }
        saveFavorites();
        updateFavoritesCount();

        // Диспатчим событие для Navigation
        document.dispatchEvent(new CustomEvent('favoritesUpdated', {
            detail: { favorites: [...state.favorites] }
        }));
        document.dispatchEvent(new CustomEvent('favoritesChanged', {
            detail: { favorites: state.favorites }
        }));

        // Аналитика (безопасно)
        try {
            if (typeof Admin !== 'undefined' && Admin._analytics) {
                Admin._analytics.track('favorite', {
                    productId: Number.isFinite(Number(id)) ? Number(id) : id,
                    action: state.favorites.has(id) ? 'add' : 'remove'
                });
            }
        } catch (e) {}
    }

    function isFavorite(productId) {
        const id = normalizeFavoriteId(productId);
        if (!id) return false;
        return state.favorites.has(id);
    }

    function getFavorites() {
        return state.favorites;
    }

    function updateFavoritesCount() {
        const count = state.favorites.size;
        document.querySelectorAll('[data-fav-count]').forEach(el => {
            el.textContent = count;
            if (el.tagName === 'SPAN' && el.closest('.navbar__link')) {
                el.style.display = count > 0 ? '' : 'none';
            }
        });
    }

    /* ─────────────────────────────────────────
       TOASTS + NOTIFICATIONS
    ───────────────────────────────────────── */
    function showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const allowed = ['success', 'error', 'warning', 'info'];
        const toastType = allowed.includes(type) ? type : 'info';
        const safeDuration = Math.max(1600, Number(duration) || 4000);

        const labels = {
            success: 'Успешно',
            error: 'Ошибка',
            warning: 'Внимание',
            info: 'Обновление'
        };

        const accents = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const glows = {
            success: 'rgba(34, 197, 94, 0.45)',
            error: 'rgba(239, 68, 68, 0.45)',
            warning: 'rgba(245, 158, 11, 0.45)',
            info: 'rgba(59, 130, 246, 0.45)'
        };

        const icons = {
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>`,
            error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>`,
            info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>`
        };

        if (container.children.length >= 5) {
            const oldest = container.firstElementChild;
            if (oldest && !oldest.classList.contains('toast--closing')) {
                oldest.classList.remove('toast--visible');
                oldest.classList.add('toast--closing');
                setTimeout(() => oldest.remove(), 420);
            }
        }

        const toast = document.createElement('article');
        toast.className = `toast toast--${toastType}`;
        toast.setAttribute('role', toastType === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.style.setProperty('--toast-accent', accents[toastType]);
        toast.style.setProperty('--toast-glow', glows[toastType]);
        toast.style.setProperty('--toast-duration', `${safeDuration}ms`);
        toast.innerHTML = `
            <div class="toast__decor" aria-hidden="true"></div>
            <div class="toast__spark" aria-hidden="true"></div>
            <div class="toast__icon-wrap">
                <div class="toast__icon">${icons[toastType] || icons.info}</div>
            </div>
            <div class="toast__content">
                <div class="toast__title">${labels[toastType]}</div>
                <div class="toast__message"></div>
            </div>
            <button class="toast__close" type="button" aria-label="Закрыть уведомление">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div class="toast__progress" aria-hidden="true">
                <span class="toast__progress-bar"></span>
            </div>
        `;

        const messageEl = toast.querySelector('.toast__message');
        if (messageEl) {
            messageEl.textContent = String(message ?? '');
        }

        let timerId = null;
        let startedAt = 0;
        let remaining = safeDuration;
        let removed = false;

        const removeToast = () => {
            if (removed) return;
            removed = true;
            clearTimeout(timerId);
            toast.classList.remove('toast--visible');
            toast.classList.add('toast--closing');
            setTimeout(() => toast.remove(), 420);
        };

        const startTimer = () => {
            if (removed) return;
            clearTimeout(timerId);
            startedAt = Date.now();
            timerId = setTimeout(removeToast, remaining);
            toast.classList.remove('toast--paused');
        };

        const pauseTimer = () => {
            if (removed) return;
            const elapsed = Date.now() - startedAt;
            remaining = Math.max(0, remaining - elapsed);
            clearTimeout(timerId);
            toast.classList.add('toast--paused');
        };

        const resumeTimer = () => {
            if (removed) return;
            if (remaining <= 0) {
                removeToast();
                return;
            }
            startTimer();
        };

        const closeBtn = toast.querySelector('.toast__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                removeToast();
            });
        }

        toast.addEventListener('mouseenter', pauseTimer);
        toast.addEventListener('mouseleave', resumeTimer);
        toast.addEventListener('focusin', pauseTimer);
        toast.addEventListener('focusout', () => {
            if (toast.matches(':hover')) return;
            resumeTimer();
        });

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast--visible'));

        startTimer();

        // Не добавляем тосты в уведомления — Notifications module сам управляет
    }

    /* ─────────────────────────────────────────
       UTILITY FUNCTIONS
    ───────────────────────────────────────── */
    function formatPrice(price) {
        if (typeof price !== 'number') price = Number(price) || 0;
        return '$' + price.toFixed(0);
    }

    function formatNumber(num) {
        num = Number(num) || 0;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000)    return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => showToast('Скопировано в буфер обмена!', 'success'))
                .catch(() => _fallbackCopy(text));
        } else {
            _fallbackCopy(text);
        }
    }

    function _fallbackCopy(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Скопировано!', 'success');
        } catch (e) {
            showToast('Не удалось скопировать', 'error');
        }
    }

    /* ─────────────────────────────────────────
       USER STATE HELPERS
    ───────────────────────────────────────── */
    function getUser() {
        // Пытаемся взять актуальные данные из localStorage
        try {
            const raw = localStorage.getItem('tish_profile');
            if (raw) {
                const saved = JSON.parse(raw);
                // Мёрджим с state.user
                Object.assign(state.user, saved);
            }
        } catch (e) {}
        return state.user;
    }

    function isAdminMode() {
        return state.isAdmin;
    }

    function setAdminMode(isAdmin) {
        state.isAdmin = isAdmin;
        document.body.classList.toggle('admin-mode', isAdmin);
        document.dispatchEvent(new CustomEvent('adminModeChanged', {
            detail: { isAdmin }
        }));
    }

    /* ─────────────────────────────────────────
       MODAL HELPERS
    ───────────────────────────────────────── */
    function _isActuallyVisible(el) {
        if (!el || !document.documentElement.contains(el)) return false;

        const st = window.getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || st.pointerEvents === 'none') {
            return false;
        }

        const opacity = Number.parseFloat(st.opacity || '1');
        if (Number.isFinite(opacity) && opacity <= 0.02) {
            return false;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) {
            return false;
        }

        return true;
    }

    function _hasOpenBlockingLayer() {
        const modalCandidates = document.querySelectorAll(
            '.modal.is-open, .product-modal.is-open, .profile-modal.is-open, .admin-modal.is-open, #cartModal.is-open, .cm3.open'
        );
        return Array.from(modalCandidates).some(_isActuallyVisible);
    }

    function _setBodyScrollLocked(locked) {
        const html = document.documentElement;
        const body = document.body;
        if (!html || !body) return;

        const hadLockClass =
            html.classList.contains(SCROLL_LOCK_CLASS) ||
            body.classList.contains(SCROLL_LOCK_CLASS);

        if (locked) {
            if (!scrollLockState) {
                const y = window.scrollY || window.pageYOffset || 0;
                scrollLockState = {
                    y,
                    htmlOverflow: html.style.overflow,
                    htmlOverflowX: html.style.overflowX,
                    htmlOverflowY: html.style.overflowY,
                    bodyOverflow: body.style.overflow,
                    bodyOverflowX: body.style.overflowX,
                    bodyOverflowY: body.style.overflowY,
                    bodyPosition: body.style.position,
                    bodyTop: body.style.top,
                    bodyLeft: body.style.left,
                    bodyRight: body.style.right,
                    bodyWidth: body.style.width
                };
                body.dataset.scrollLockY = String(Math.round(y));
            }

            html.classList.add(SCROLL_LOCK_CLASS);
            body.classList.add(SCROLL_LOCK_CLASS);

            html.style.overflow = 'hidden';
            html.style.overflowX = 'hidden';
            html.style.overflowY = 'hidden';

            body.style.overflow = 'hidden';
            body.style.overflowX = 'hidden';
            body.style.overflowY = 'hidden';
            body.style.position = 'fixed';
            body.style.top = `-${body.dataset.scrollLockY || '0'}px`;
            body.style.left = '0';
            body.style.right = '0';
            body.style.width = '100%';
            return;
        }

        if (!scrollLockState) {
            if (!hadLockClass) {
                return;
            }

            html.classList.remove(SCROLL_LOCK_CLASS);
            body.classList.remove(SCROLL_LOCK_CLASS);

            html.style.overflow = '';
            html.style.overflowX = '';
            html.style.overflowY = '';

            body.style.overflow = '';
            body.style.overflowY = '';
            body.style.overflowX = '';
            body.style.position = '';
            body.style.top = '';
            body.style.left = '';
            body.style.right = '';
            body.style.width = '';

            delete body.dataset.scrollLockY;
            return;
        }

        const saved = scrollLockState;
        scrollLockState = null;

        const y = Number(body.dataset.scrollLockY || saved.y || 0);
        delete body.dataset.scrollLockY;

        html.classList.remove(SCROLL_LOCK_CLASS);
        body.classList.remove(SCROLL_LOCK_CLASS);

        html.style.overflow = saved.htmlOverflow === 'hidden' ? '' : saved.htmlOverflow;
        html.style.overflowX = saved.htmlOverflowX === 'hidden' ? '' : saved.htmlOverflowX;
        html.style.overflowY = saved.htmlOverflowY === 'hidden' ? '' : saved.htmlOverflowY;

        body.style.overflow = saved.bodyOverflow === 'hidden' ? '' : saved.bodyOverflow;
        body.style.overflowX = saved.bodyOverflowX === 'hidden' ? '' : saved.bodyOverflowX;
        body.style.overflowY = saved.bodyOverflowY === 'hidden' ? '' : saved.bodyOverflowY;
        body.style.position = saved.bodyPosition === 'fixed' ? '' : saved.bodyPosition;
        body.style.top = saved.bodyTop;
        body.style.left = saved.bodyLeft;
        body.style.right = saved.bodyRight;
        body.style.width = saved.bodyWidth;

        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    function _syncBodyScrollLock() {
        if (_hasOpenBlockingLayer()) {
            _setBodyScrollLocked(true);
            return;
        }

        _setBodyScrollLocked(false);
    }

    function _queueBodyScrollSync() {
        requestAnimationFrame(_syncBodyScrollLock);
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('is-open');
        _syncBodyScrollLock();
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('is-open');
        _syncBodyScrollLock();
    }

    /* ─────────────────────────────────────────
       PAGE NAVIGATION BRIDGE
    ───────────────────────────────────────── */
    function showPage(pageId) {
        // Аналитика
        try {
            if (typeof Admin !== 'undefined' && Admin._analytics) {
                Admin._analytics.track('page_view', { page: pageId });
            }
        } catch (e) {}

        if (typeof Navigation !== 'undefined') {
            Navigation.showPage(pageId);
        } else {
            // Фоллбэк если Navigation ещё не загружен
            const pages = document.querySelectorAll('.page-section');
            pages.forEach(p => p.classList.remove('active'));
            const target = document.getElementById('page-' + pageId);
            if (target) target.classList.add('active');
        }
    }

    /* ─────────────────────────────────────────
       COSMIC BACKGROUND
    ───────────────────────────────────────── */
    function generateStars() {
        const container = document.getElementById('starsContainer');
        if (!container || container.children.length > 0) return;

        const count = window.innerWidth < 768 ? 30 : 60;

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = (1 + Math.random() * 2.5) + 'px';
            star.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                width: ${size};
                height: ${size};
                --dur: ${(3 + Math.random() * 5).toFixed(2)}s;
                --opacity: ${(0.2 + Math.random() * 0.5).toFixed(2)};
                animation-delay: ${(Math.random() * 5).toFixed(2)}s;
            `;
            container.appendChild(star);
        }
    }

    /* ─────────────────────────────────────────
       STORAGE SYNC HELPERS
    ───────────────────────────────────────── */
    function _syncOnVisible() {
        if (document.visibilityState !== 'visible') return;
        try {
            if (typeof Storage !== 'undefined' && Storage.pullAll) {
                Storage.pullAll().then(() => {
                    if (typeof Profile !== 'undefined' && Profile.renderAll) {
                        Profile.renderAll();
                    }
                    if (typeof Chat !== 'undefined' && Chat.updateChatBadge) {
                        Chat.updateChatBadge();
                    }
                    if (typeof Navigation !== 'undefined') {
                        Navigation.syncNavbarAvatar();
                        Navigation.syncCartBadge();
                        Navigation.syncFavBadge();
                    }
                });
            }
        } catch (e) {}
    }

    function _syncOnUnload() {
        try {
            if (typeof Storage !== 'undefined' && Storage.syncAll) {
                Storage.syncAll();
            }
        } catch (e) {}
    }

    /* ─────────────────────────────────────────
       GLOBAL EVENT LISTENERS SETUP
    ───────────────────────────────────────── */
    function _setupEvents() {
        // Закрытие всех модалок по Escape (через Navigation)
        document.addEventListener('closeModals', () => {
            document.querySelectorAll(
                '.modal.is-open, .product-modal.is-open, .profile-modal.is-open'
            ).forEach(modal => modal.classList.remove('is-open'));

            // Закрываем модалки корзины
            const cartModal = document.getElementById('cartModal');
            if (cartModal) cartModal.classList.remove('is-open');

            _queueBodyScrollSync();
        });

        // Видимость вкладки
        document.addEventListener('visibilitychange', _syncOnVisible);

        // Перед закрытием
        window.addEventListener('beforeunload', _syncOnUnload);

        // Обновление аватара при изменении профиля
        document.addEventListener('profileUpdated', () => {
            if (typeof Navigation !== 'undefined') {
                Navigation.syncNavbarAvatar();
            }
        });

        // Обновление корзины
        document.addEventListener('cartUpdated', () => {
            if (typeof Navigation !== 'undefined') {
                Navigation.syncCartBadge();
            }
        });

        // Обновление избранного
        document.addEventListener('favoritesUpdated', () => {
            loadFavorites();
            updateFavoritesCount();
        });

        // Клик по фону profile-modal — закрыть
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('profile-modal')) {
                e.target.classList.remove('is-open');
                _queueBodyScrollSync();
            }
        });

        // Re-init scroll reveal on page change
        document.addEventListener('pageChange', () => {
            setTimeout(_initScrollReveal, 100);
            _queueBodyScrollSync();
        });

        document.addEventListener('pageShown', _queueBodyScrollSync);
        window.addEventListener('resize', _queueBodyScrollSync, { passive: true });
        document.addEventListener('click', _queueBodyScrollSync, true);
        window.addEventListener('pageshow', _queueBodyScrollSync);
        document.addEventListener('fullscreenchange', _queueBodyScrollSync);

        // Keep scroll lock state aligned when modals are added/removed or toggled by other modules.
        const modalObserver = new MutationObserver(_queueBodyScrollSync);
        modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        // Fail-safe against stale body overflow after cross-module modal actions.
        window.setInterval(_syncBodyScrollLock, 1000);
    }

    /* ─────────────────────────────────────────
       SCROLL REVEAL (IntersectionObserver)
    ───────────────────────────────────────── */
    function _initScrollReveal() {
        const els = document.querySelectorAll(
            '.product-card, .profile-card, .card, .catalog-header, ' +
            '.sub-hero, .nft-hero, .partners-hero, .referral-hero, ' +
            '.partner-tier-card, .nft-case-card, .sub-level-card'
        );
        if (!els.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        els.forEach((el, i) => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
                // Stagger delay for grid children
                const delay = Math.min(i % 6, 5);
                if (delay > 0) el.classList.add('reveal-delay-' + delay);
            }
            if (!el.classList.contains('is-visible')) {
                observer.observe(el);
            }
        });
    }

    /* ─────────────────────────────────────────
       CURSOR LIGHT (desktop only)
    ───────────────────────────────────────── */
    function _initCursorLight() {
        if (!window.matchMedia('(hover: hover)').matches) return;
        const light = document.getElementById('cursorLight');
        if (!light) return;

        let ticking = false;
        document.addEventListener('mousemove', (e) => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                light.style.left = e.clientX + 'px';
                light.style.top = e.clientY + 'px';
                ticking = false;
            });
        }, { passive: true });
    }

    /* ─────────────────────────────────────────
       INIT
    ───────────────────────────────────────── */
    function init() {
        console.log('%c🚀 TISH STORE v3 initializing...', 'color:#8b5cf6;font-weight:700');

        // 0. Auth check
        if (typeof Auth !== 'undefined' && Auth.init) {
            Auth.init();
        }

        // 1. Загрузить избранное из storage
        loadFavorites();
        updateFavoritesCount();

        // 2. Инициализировать серверный storage
        try {
            if (typeof Storage !== 'undefined' && Storage.init) {
                Storage.init().then(() => {
                    console.log('%c✅ Storage synced', 'color:#22c55e;font-weight:600');
                    // После синхронизации обновить аватар
                    if (typeof Navigation !== 'undefined') {
                        Navigation.syncNavbarAvatar();
                    }

                    // Обновляем каталог после загрузки данных с сервера,
                    // чтобы товары появились сразу при первом открытии страницы.
                    if (typeof Catalog !== 'undefined' && typeof Catalog.renderCatalog === 'function') {
                        const current = (typeof Navigation !== 'undefined' && typeof Navigation.getCurrentPage === 'function')
                            ? Navigation.getCurrentPage()
                            : '';
                        if (!current || current === 'catalog') {
                            Catalog.renderCatalog();
                        }
                    }
                }).catch(e => {
                    console.warn('Storage sync failed (offline mode):', e);
                });
            }
        } catch (e) {}

        // 3. Генерация фона
        generateStars();

        // 3b. Scroll reveal system
        _initScrollReveal();

        // 3c. Cursor light effect (desktop)
        _initCursorLight();

        // 4. Инициализация навигации
        if (typeof Navigation !== 'undefined') {
            Navigation.init();
        }

        // 5. Глобальные события
        _setupEvents();

        // На старте сразу нормализуем состояние скролла body.
        _queueBodyScrollSync();

        // 6. Аналитика
        try {
            if (typeof Admin !== 'undefined' && Admin._analytics) {
                Admin._analytics.track('visit');
            }
        } catch (e) {}

        console.log('%c✅ TISH STORE ready!', 'color:#22c55e;font-weight:700');
    }

    /* ─────────────────────────────────────────
       AUTO-INIT
    ───────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM уже готов
        init();
    }

    /* ─────────────────────────────────────────
       PUBLIC API
    ───────────────────────────────────────── */
    return {
        // Core
        init,
        state,
        getUser,
        isAdminMode,
        setAdminMode,

        // Navigation
        showPage,

        // Favorites
        toggleFavorite,
        isFavorite,
        getFavorites,
        updateFavoritesCount,
        

        // UI
        showToast,
        copyToClipboard,
        openModal,
        closeModal,
        syncScrollLock: _syncBodyScrollLock,

        // Formatters
        formatPrice,
        formatNumber,
    };
})();

/* ─────────────────────────────────────────
   GLOBAL SHORTCUTS
   (для вызова из onclick атрибутов в HTML)
───────────────────────────────────────── */
const showPage = (page) => App.showPage(page);

/* ─────────────────────────────────────────
   GLOBAL SIDEBAR TOGGLE
   (вызывается из кнопки в HTML)
───────────────────────────────────────── */
function toggleSidebarGlobal() {
    document.body.classList.toggle('sidebar-hidden');
    localStorage.setItem(
        'sidebar-hidden',
        document.body.classList.contains('sidebar-hidden')
    );
}