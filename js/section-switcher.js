(() => {
    const blockDefinitions = [
        {
            id: 'hero',
            label: 'Who We Are',
            selectors: ['#hero', '.marquee']
        },
        {
            id: 'team',
            label: 'Portfolio',
            selectors: ['#team']
        },
        {
            id: 'works',
            label: 'Our Works',
            selectors: ['#works']
        },
        {
            id: 'contact',
            label: 'Contact',
            selectors: ['#contact', '.footer']
        }
    ];

    function normalizeBlockId(value) {
        return String(value || '').replace(/^#/, '').trim().toLowerCase();
    }

    function closeMobileMenuIfOpen() {
        const menu = document.getElementById('mobile-menu');
        const toggle = document.getElementById('nav-toggle');

        if (!menu || !toggle || !menu.classList.contains('is-open')) {
            return;
        }

        menu.classList.remove('is-open');
        toggle.classList.remove('is-open');
        document.body.classList.remove('mobile-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
    }

    function buildTransitionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'block-wave-transition';

        overlay.innerHTML = [
            '<div class="block-wave-transition__layer block-wave-transition__layer--a"></div>',
            '<div class="block-wave-transition__layer block-wave-transition__layer--b"></div>',
            '<div class="block-wave-transition__layer block-wave-transition__layer--c"></div>'
        ].join('');

        document.body.appendChild(overlay);
        return overlay;
    }

    function buildFlowNav(blocks) {
        const nav = document.createElement('div');
        nav.className = 'section-flow-nav';

        const prevButton = document.createElement('button');
        prevButton.className = 'section-flow-nav__arrow';
        prevButton.type = 'button';
        prevButton.setAttribute('aria-label', 'Previous section');
        prevButton.textContent = '‹';

        const nextButton = document.createElement('button');
        nextButton.className = 'section-flow-nav__arrow';
        nextButton.type = 'button';
        nextButton.setAttribute('aria-label', 'Next section');
        nextButton.textContent = '›';

        const list = document.createElement('div');
        list.className = 'section-flow-nav__list';

        blocks.forEach((block) => {
            const button = document.createElement('button');
            button.className = 'section-flow-nav__btn';
            button.type = 'button';
            button.dataset.section = block.id;
            button.innerHTML = `<span class="section-flow-nav__btn-label">${block.label}</span>`;
            list.appendChild(button);
        });

        nav.appendChild(prevButton);
        nav.appendChild(list);
        nav.appendChild(nextButton);

        document.body.appendChild(nav);

        return {
            root: nav,
            prevButton,
            nextButton,
            buttons: Array.from(list.querySelectorAll('.section-flow-nav__btn'))
        };
    }

    function buildPlanetReturnCta() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'planet-return is-visible';
        button.setAttribute('aria-label', 'Back to planets');
        button.innerHTML = [
            '<span class="planet-return__fx" aria-hidden="true"></span>',
            '<span class="planet-return__avatar">',
            '<img src="photo_2026-05-05_09-51-29.jpg" alt="TISH Team logo">',
            '</span>',
            '<span class="planet-return__text">',
            '<span class="planet-return__caption">Back to</span>',
            '<span class="planet-return__title">Planets</span>',
            '</span>',
            '<span class="planet-return__arrow" aria-hidden="true">↗</span>'
        ].join('');

        button.addEventListener('click', () => {
            closeMobileMenuIfOpen();
            window.location.assign('/test_new/');
        });

        document.body.appendChild(button);
        return { root: button };
    }

    function initSectionFlowMode() {
        const blocks = blockDefinitions
            .map((definition) => {
                const elements = definition.selectors
                    .map((selector) => document.querySelector(selector))
                    .filter(Boolean);

                return {
                    ...definition,
                    elements
                };
            })
            .filter((definition) => definition.elements.length > 0);

        if (blocks.length !== blockDefinitions.length) {
            return;
        }

        const blockById = blocks.reduce((acc, block, index) => {
            acc[block.id] = { ...block, index };
            return acc;
        }, {});

        const overlay = buildTransitionOverlay();
        const nav = buildFlowNav(blocks);
        const returnPortal = buildPlanetReturnCta();

        let activeBlockId = null;
        let transitionInProgress = false;
        let queuedTransition = null;
        let switchTimer = null;
        let cleanupTimer = null;

        function clearTransitionTimers() {
            if (switchTimer) {
                window.clearTimeout(switchTimer);
                switchTimer = null;
            }
            if (cleanupTimer) {
                window.clearTimeout(cleanupTimer);
                cleanupTimer = null;
            }
        }

        function updateNavState() {
            const currentIndex = blockById[activeBlockId]?.index ?? 0;

            nav.buttons.forEach((button) => {
                button.classList.toggle('is-active', button.dataset.section === activeBlockId);
            });

            nav.prevButton.disabled = currentIndex <= 0;
            nav.nextButton.disabled = currentIndex >= blocks.length - 1;
        }

        function updateReturnPortalState(animate = false) {
            returnPortal.root.dataset.block = activeBlockId || 'hero';

            if (!animate) {
                return;
            }

            returnPortal.root.classList.remove('is-reveal');
            void returnPortal.root.offsetHeight;
            returnPortal.root.classList.add('is-reveal');
        }

        function updateTopNavigationState() {
            document.querySelectorAll('.nav__link[href^="#"], .mobile-menu__link[href^="#"]').forEach((link) => {
                const linkBlockId = normalizeBlockId(link.getAttribute('href')) || 'hero';
                const isActive = linkBlockId === activeBlockId;

                link.classList.toggle('is-active', isActive);

                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            });

            const logo = document.querySelector('.nav__logo');
            if (!logo) {
                return;
            }

            const isHero = activeBlockId === 'hero';
            logo.classList.toggle('is-active', isHero);

            if (isHero) {
                logo.setAttribute('aria-current', 'page');
            } else {
                logo.removeAttribute('aria-current');
            }
        }

        function isOverlayUiOpen() {
            return Boolean(
                document.querySelector('.modal.is-open')
                || document.querySelector('.works-gallery.is-open')
                || document.querySelector('.photo-lightbox.is-open')
                || document.querySelector('.mobile-menu.is-open')
            );
        }

        function updateNavVisibility() {
            const hideFlowTabsOnDesktop = window.matchMedia('(min-width: 1025px)').matches;
            const hidden = isOverlayUiOpen() || transitionInProgress || hideFlowTabsOnDesktop;
            nav.root.classList.toggle('is-hidden', hidden);
            returnPortal.root.classList.toggle('is-hidden', hidden);
        }

        function syncUrlHash(blockId, mode = 'push') {
            const nextHash = `#${blockId}`;
            if (window.location.hash === nextHash) {
                return;
            }

            if (mode === 'replace') {
                window.history.replaceState({ section: blockId }, '', nextHash);
            } else if (mode === 'push') {
                window.history.pushState({ section: blockId }, '', nextHash);
            }
        }

        function activateBlock(blockId, options = {}) {
            const { historyMode = 'push', animateReturnPortal = true } = options;
            const next = blockById[blockId];
            if (!next) {
                return;
            }

            activeBlockId = blockId;

            blocks.forEach((block) => {
                const isActive = block.id === blockId;
                block.elements.forEach((element) => {
                    element.classList.toggle('site-block-hidden', !isActive);
                    element.classList.toggle('site-block-active', isActive);
                });
            });

            updateNavState();
            updateReturnPortalState(animateReturnPortal);
            updateTopNavigationState();

            if (historyMode !== 'none') {
                syncUrlHash(blockId, historyMode);
            }

            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            updateNavVisibility();
        }

        function runTransition(targetBlockId, options = {}) {
            const { historyMode = 'push' } = options;
            const target = blockById[targetBlockId];
            if (!target) {
                return;
            }

            if (targetBlockId === activeBlockId && !transitionInProgress) {
                return;
            }

            if (transitionInProgress) {
                queuedTransition = { targetBlockId, historyMode };
                return;
            }

            transitionInProgress = true;
            clearTransitionTimers();
            updateNavVisibility();

            overlay.classList.remove('is-exit');
            overlay.classList.add('is-active');
            void overlay.offsetHeight;
            overlay.classList.add('is-enter');

            const fillDurationMs = 460;
            const releaseDurationMs = 560;

            switchTimer = window.setTimeout(() => {
                activateBlock(targetBlockId, { historyMode });
                overlay.classList.remove('is-enter');
                void overlay.offsetHeight;
                overlay.classList.add('is-exit');
            }, fillDurationMs);

            cleanupTimer = window.setTimeout(() => {
                overlay.classList.remove('is-active', 'is-exit');
                transitionInProgress = false;
                updateNavVisibility();

                if (queuedTransition && queuedTransition.targetBlockId !== activeBlockId) {
                    const queued = queuedTransition;
                    queuedTransition = null;
                    runTransition(queued.targetBlockId, { historyMode: queued.historyMode });
                    return;
                }

                queuedTransition = null;
            }, fillDurationMs + releaseDurationMs);
        }

        function getInitialBlockId() {
            const hashBlockId = normalizeBlockId(window.location.hash);
            if (blockById[hashBlockId]) {
                return hashBlockId;
            }

            const querySectionId = normalizeBlockId(new URLSearchParams(window.location.search).get('section'));
            if (blockById[querySectionId]) {
                return querySectionId;
            }

            return 'hero';
        }

        function goRelative(step) {
            const currentIndex = blockById[activeBlockId]?.index ?? 0;
            const targetIndex = Math.max(0, Math.min(blocks.length - 1, currentIndex + step));
            const targetBlock = blocks[targetIndex];
            if (!targetBlock || targetBlock.id === activeBlockId) {
                return;
            }

            runTransition(targetBlock.id, { historyMode: 'push' });
        }

        nav.buttons.forEach((button) => {
            button.addEventListener('click', () => {
                closeMobileMenuIfOpen();
                runTransition(button.dataset.section, { historyMode: 'push' });
            });
        });

        nav.prevButton.addEventListener('click', () => {
            closeMobileMenuIfOpen();
            goRelative(-1);
        });

        nav.nextButton.addEventListener('click', () => {
            closeMobileMenuIfOpen();
            goRelative(1);
        });

        document.addEventListener('click', (event) => {
            const anchor = event.target.closest('a[href]');
            if (!anchor) {
                return;
            }

            const href = anchor.getAttribute('href') || '';
            if (!href.startsWith('#')) {
                return;
            }

            const targetBlockId = normalizeBlockId(href) || 'hero';
            if (!blockById[targetBlockId]) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            closeMobileMenuIfOpen();
            runTransition(targetBlockId, { historyMode: 'push' });
        }, true);

        window.addEventListener('popstate', () => {
            const targetBlockId = normalizeBlockId(window.location.hash) || 'hero';
            if (!blockById[targetBlockId] || targetBlockId === activeBlockId) {
                return;
            }

            activateBlock(targetBlockId, { historyMode: 'none', animateReturnPortal: true });
        });

        const navVisibilityObserver = new MutationObserver(() => {
            updateNavVisibility();
        });
        navVisibilityObserver.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class']
        });

        document.addEventListener('keydown', () => {
            updateNavVisibility();
        });

        document.addEventListener('click', () => {
            updateNavVisibility();
        });

        window.addEventListener('resize', () => {
            updateNavVisibility();
        });

        document.body.classList.add('section-flow-mode');

        const initialBlockId = getInitialBlockId();
        activateBlock(initialBlockId, { historyMode: 'replace', animateReturnPortal: false });
        updateNavVisibility();

        window.tishFlowNavigation = {
            goTo(blockId) {
                const targetBlockId = normalizeBlockId(blockId);
                if (!blockById[targetBlockId]) {
                    return;
                }
                runTransition(targetBlockId, { historyMode: 'push' });
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSectionFlowMode);
    } else {
        initSectionFlowMode();
    }
})();
