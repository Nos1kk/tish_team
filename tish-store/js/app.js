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

    /* ─────────────────────────────────────────
       FAVORITES — с persistence в localStorage
    ───────────────────────────────────────── */
    function loadFavorites() {
        try {
            const raw = localStorage.getItem('tish_favorites');
            if (raw) {
                const arr = JSON.parse(raw);
                state.favorites = new Set(Array.isArray(arr) ? arr : []);
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
        const id = Number(productId);
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
                    productId: id,
                    action: state.favorites.has(id) ? 'add' : 'remove'
                });
            }
        } catch (e) {}
    }

    function isFavorite(productId) {
        return state.favorites.has(Number(productId));
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

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div class="toast__icon">${icons[type] || icons.info}</div>
            <div class="toast__message">${message}</div>
            <button class="toast__close" onclick="this.parentElement.remove()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast--visible'));

        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 400);
        }, duration);

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
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('is-open');
        // Восстанавливаем скролл только если нет других открытых модалок
        const hasOpen = document.querySelector(
            '.profile-modal.is-open, .modal.is-open'
        );
        if (!hasOpen) document.body.style.overflow = '';
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

            document.body.style.overflow = '';
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
                const hasOpen = document.querySelector('.profile-modal.is-open');
                if (!hasOpen) document.body.style.overflow = '';
            }
        });

        // Re-init scroll reveal on page change
        document.addEventListener('pageChange', () => {
            setTimeout(_initScrollReveal, 100);
        });
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