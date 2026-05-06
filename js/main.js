/* =====================================================
   TISH TEAM - MAIN JAVASCRIPT
   ИСПРАВЛЕННАЯ ВЕРСИЯ
   ===================================================== */

// =====================================================
// TRANSLATIONS
// =====================================================
const translations = {
    en: {
        modalWorks: 'Works',
        catPresentationsDesc: 'Pitch decks & slides',
        catMarketplaceDesc: 'Product cards for marketplaces',
        catWebsitesDesc: 'Landing pages & web apps',
        catOtherDesc: 'Various design projects',
        navHome: 'Home',
        navTeam: 'Team',
        navWorks: 'Works',
        navContact: 'Contact',
        navOrder: 'Services',
        heroLabel: 'Design Team',
        heroSubtitle: 'A design team that combines minimalism and creative chaos. We create presentations, banners, business cards and interfaces that are memorable.',
        heroBtn1: 'Services',
        heroBtn2: 'Meet Us',
        statProjects: 'Projects',
        statClients: 'Clients',
        statYears: 'Years exp.',
        marquee1: 'Presentations',
        marquee2: 'Banners',
        marquee3: 'WB Cards',
        marquee4: 'UI/UX',
        marquee5: 'Branding',
        marquee6: 'Websites',
        teamLabel: 'Our Team',
        teamTitle: 'Meet',
        teamTitleAccent: 'us',
        teamSubtitle: 'Click on a card to see the portfolio and learn more',
        viewPortfolio: 'View Portfolio',
        sanyaName: 'Sanya',
        sanyaRole: 'Lead Designer',
        yarikName: 'Yarik',
        yarikRole: 'Design & Branding',
        kiryaName: 'Kirya',
        kiryaRole: 'Development',
        worksLabel: 'Portfolio',
        worksTitle: 'Our',
        worksTitleAccent: 'works',
        worksSubtitle: 'Click on a category to explore our projects',
        catBranding: 'Branding',
        catBrandingDesc: 'Logos, brandbooks & identity',
        catPresentations: 'Presentations',
        catPresentationsDesc: 'Pitch decks & slides',
        catMarketplace: 'WB Cards',
        catMarketplaceDesc: 'Product cards for marketplaces',
        catAdvertising: 'Advertising',
        catAdvertisingDesc: 'Banners & promo materials',
        catWebsites: 'Websites',
        catWebsitesDesc: 'Landing pages & web apps',
        catOther: 'Other',
        catOtherDesc: 'Various design projects',
        worksCount: 'works',
        contactLabel: 'TISH STORE',
        contactTitle1: 'Order',
        contactTitle2: 'service',
        contactTitleAccent: 'now',
        contactText: 'Open TISH STORE and place your service order in just a few clicks.',
        contactTextExtra: 'Choose the right format, submit a request and order the service without extra steps.',
        contactBtnBot: 'Order service',
        contactBtnChat: 'Go to TISH STORE',
        contactBotLabel: 'Store',
        contactChatLabel: 'Order',
        footerCopy: '© 2026 TISH TEAM. All rights reserved.',
        footerUp: 'Back to top',
        wantSame: 'Order service',
        modalAbout: 'About',
        modalPortfolio: 'Portfolio',
        modalConditions: 'Working conditions',
        modalContact: 'Order service',
        loaderTagline: 'Design Team'
    },
    ru: {
        modalWorks: 'Работы',
        catPresentationsDesc: 'Pitch-деки и слайды',
        catMarketplaceDesc: 'Карточки товаров для маркетплейсов',
        catWebsitesDesc: 'Лендинги и веб-приложения',
        catOtherDesc: 'Разные дизайн-проекты',
        navHome: 'Главная',
        navTeam: 'Команда',
        navWorks: 'Работы',
        navContact: 'Контакты',
        navOrder: 'Услуги',
        heroLabel: 'Design Team',
        heroSubtitle: 'Дизайн-команда, которая соединяет минимализм и творческий хаос. Создаём презентации, баннеры, визитки и интерфейсы, которые запоминаются.',
        heroBtn1: 'Услуги',
        heroBtn2: 'Познакомиться',
        statProjects: 'Проектов',
        statClients: 'Клиентов',
        statYears: 'Года опыта',
        marquee1: 'Презентации',
        marquee2: 'Баннеры',
        marquee3: 'Карточки WB',
        marquee4: 'UI/UX',
        marquee5: 'Брендинг',
        marquee6: 'Сайты',
        teamLabel: 'Наша команда',
        teamTitle: 'Познакомьтесь с',
        teamTitleAccent: 'нами',
        teamSubtitle: 'Нажмите на карточку, чтобы увидеть портфолио и узнать подробнее',
        viewPortfolio: 'Смотреть портфолио',
        sanyaName: 'Саня',
        sanyaRole: 'Lead дизайнер',
        yarikName: 'Ярик',
        yarikRole: 'Дизайн & Брендинг',
        kiryaName: 'Киря',
        kiryaRole: 'Разработка',
        worksLabel: 'Портфолио',
        worksTitle: 'Наши',
        worksTitleAccent: 'работы',
        worksSubtitle: 'Нажмите на категорию, чтобы увидеть проекты',
        catBranding: 'Брендинг',
        catBrandingDesc: 'Логотипы, брендбуки и айдентика',
        catPresentations: 'Презентации',
        catPresentationsDesc: 'Pitch-деки и слайды',
        catMarketplace: 'Карточки WB',
        catMarketplaceDesc: 'Карточки товаров для маркетплейсов',
        catAdvertising: 'Реклама',
        catAdvertisingDesc: 'Баннеры и промо-материалы',
        catWebsites: 'Сайты',
        catWebsitesDesc: 'Лендинги и веб-приложения',
        catOther: 'Прочее',
        catOtherDesc: 'Разные дизайн-проекты',
        worksCount: 'работ',
        contactLabel: 'TISH STORE',
        contactTitle1: 'Закажите',
        contactTitle2: 'услугу',
        contactTitleAccent: 'сейчас',
        contactText: 'Перейдите в TISH STORE и оформите заказ на нужную услугу в пару кликов.',
        contactTextExtra: 'Выберите формат работы, отправьте заявку и закажите услугу без лишних шагов.',
        contactBtnBot: 'Заказать услугу',
        contactBtnChat: 'Перейти в TISH STORE',
        contactBotLabel: 'Store',
        contactChatLabel: 'Заказ',
        footerCopy: '© 2026 TISH TEAM. Все права защищены.',
        footerUp: 'Наверх',
        wantSame: 'Заказать услугу',
        modalAbout: 'О себе',
        modalPortfolio: 'Портфолио',
        modalConditions: 'Условия работы',
        modalContact: 'Заказать услугу',
        loaderTagline: 'Design Team'
    }
};

let currentLang = 'en';

// =====================================================
// LOADER
// =====================================================
class Loader {
    constructor() {
        this.loader = document.getElementById('loader');
        this.progressBar = document.getElementById('loader-bar');
        this.percentText = document.getElementById('loader-percent');
        this.progress = 0;
        this._animationId = null;

        if (this.loader) {
            document.body.style.overflow = 'hidden';
            this.animateLoader();
        }
    }

    animateLoader() {
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentProgress = Math.floor(easeOut * 100);

            this.setProgress(currentProgress);

            if (progress < 1) {
                this._animationId = requestAnimationFrame(animate);
            } else {
                this.complete();
            }
        };

        this._animationId = requestAnimationFrame(animate);
    }

    setProgress(value) {
        this.progress = value;
        if (this.progressBar) {
            this.progressBar.style.width = `${value}%`;
        }
        if (this.percentText) {
            this.percentText.textContent = `${value}%`;
        }
    }

    complete() {
        // ИСПРАВЛЕНИЕ: Отменяем анимацию при завершении
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        
        setTimeout(() => {
            if (this.loader) {
                this.loader.classList.add('is-hidden');
                document.body.style.overflow = '';
                setTimeout(() => {
                    if (this.loader && this.loader.parentNode) {
                        this.loader.remove();
                    }
                }, 600);
            }
        }, 200);
    }
}

// =====================================================
// LANGUAGE SWITCHER
// =====================================================
class LanguageSwitcher {
    constructor() {
        const saved = localStorage.getItem('tish-lang');
        if (saved && (saved === 'en' || saved === 'ru')) {
            currentLang = saved;
        }

        this.updateButtons();
        this.applyTranslations();
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentLang = btn.dataset.lang;
                localStorage.setItem('tish-lang', currentLang);
                this.updateButtons();
                this.applyTranslations();
                
                // Dispatch event for other components
                window.dispatchEvent(new CustomEvent('languageChange', {
                    detail: { lang: currentLang }
                }));
            });
        });
    }

    updateButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }

    applyTranslations() {
        const t = translations[currentLang];
        if (!t) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                el.textContent = t[key];
            }
        });
    }
}

// =====================================================
// PARTICLES — ИСПРАВЛЕННЫЙ (Memory leak fix #25)
// =====================================================
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.theme = document.documentElement.getAttribute('data-theme') || 'light';
        this._animationId = null;
        this._isRunning = false;
        this._resizeHandler = null;
        this._mouseMoveHandler = null;

        this.init();

        // Theme change listener
        window.addEventListener('themeChange', (e) => {
            this.updateTheme(e.detail.theme);
        });
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.start();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const count = window.innerWidth < 768 ? 30 : 60;
        this.particles = [];

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    bindEvents() {
        // ИСПРАВЛЕНИЕ #25: Сохраняем ссылки на handlers для последующего удаления
        this._resizeHandler = () => {
            this.resize();
            this.createParticles();
        };
        
        this._mouseMoveHandler = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };

        window.addEventListener('resize', this._resizeHandler);
        window.addEventListener('mousemove', this._mouseMoveHandler);
        
        // Останавливаем анимацию когда вкладка неактивна
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        });
    }

    updateTheme(theme) {
        this.theme = theme;
    }

    getColors() {
        if (this.theme === 'dark') {
            return {
                particle: (opacity) => `rgba(168, 85, 247, ${opacity})`,
                line: (opacity) => `rgba(168, 85, 247, ${opacity})`
            };
        }
        return {
            particle: (opacity) => `rgba(139, 92, 246, ${opacity})`,
            line: (opacity) => `rgba(139, 92, 246, ${opacity})`
        };
    }

    animate() {
        if (!this._isRunning || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const colors = this.getColors();

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            if (this.theme === 'dark' && this.mouse.x !== null) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    p.x -= dx * force * 0.02;
                    p.y -= dy * force * 0.02;
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = colors.particle(p.opacity);
            this.ctx.fill();

            if (this.theme === 'dark') {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                this.ctx.fillStyle = colors.particle(p.opacity * 0.1);
                this.ctx.fill();
            }
        });

        const maxDist = this.theme === 'dark' ? 140 : 120;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDist) {
                    const opacity = (1 - distance / maxDist) * (this.theme === 'dark' ? 0.2 : 0.15);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = colors.line(opacity);
                    this.ctx.stroke();
                }
            }
        }

        this._animationId = requestAnimationFrame(() => this.animate());
    }
    
    // ИСПРАВЛЕНИЕ #25: Методы start/stop для управления
    start() {
        if (this._isRunning) return;
        this._isRunning = true;
        this.animate();
    }
    
    stop() {
        this._isRunning = false;
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
    }

    // ИСПРАВЛЕНИЕ #25: Полная очистка ресурсов
    destroy() {
        this.stop();
        
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
        if (this._mouseMoveHandler) {
            window.removeEventListener('mousemove', this._mouseMoveHandler);
        }
        
        this.particles = [];
        this.ctx = null;
        this.canvas = null;
    }
}

// =====================================================
// CUSTOM CURSOR
// =====================================================
class CustomCursor {
    constructor() {
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches ||
            window.matchMedia('(any-pointer: fine)').matches;
        const canHover = window.matchMedia('(hover: hover)').matches ||
            window.matchMedia('(any-hover: hover)').matches;
        const touchOnly = (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) &&
            !hasFinePointer &&
            !canHover;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (touchOnly || reducedMotion) return;

        this.magnetSelector = 'a, button, .btn, .nav__link, .team-card, .work-card, .contact-social';
        this.magnetThreshold = 140;
        this.defaultOutline = { width: 44, height: 44, radius: 999 };

        this.spotlight = document.createElement('div');
        this.spotlight.className = 'cursor-spotlight';

        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        this.cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-outline"></div><div class="cursor-tooltip"></div>';

        document.body.classList.add('has-custom-cursor');
        document.body.appendChild(this.spotlight);
        document.body.appendChild(this.cursor);

        this.dot = this.cursor.querySelector('.cursor-dot');
        this.outline = this.cursor.querySelector('.cursor-outline');
        this.tooltip = this.cursor.querySelector('.cursor-tooltip');

        this.trailNodes = [];
        this.trailHistory = [];
        for (let i = 0; i < 8; i += 1) {
            const node = document.createElement('span');
            node.className = 'cursor-trail-node';
            node.style.animationDelay = `${(i * 0.06).toFixed(2)}s`;
            this.cursor.appendChild(node);
            this.trailNodes.push(node);
        }

        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.dotPos = { ...this.mouse };
        this.outlinePos = { ...this.mouse };
        this.outlineSize = { ...this.defaultOutline };

        this.targetDot = { ...this.mouse };
        this.targetOutline = { ...this.mouse };
        this.targetOutlineSize = { ...this.defaultOutline };

        this.activeTarget = null;
        this.activeStrength = 0;
        this.targets = [];
        this._targetsRefreshAt = 0;
        this._engaged = false;
        this.prevDot = { ...this.dotPos };

        this._animationId = null;
        this._mousemoveHandler = null;
        this._mousedownHandler = null;
        this._mouseupHandler = null;
        this._mouseleaveHandler = null;
        this._mouseenterHandler = null;
        this._resizeHandler = null;
        this._langChangeHandler = null;

        this.bindEvents();
        this.refreshTargets(true);
        this.updateTooltip(null);
        this.animate();
    }

    bindEvents() {
        this._mousemoveHandler = (e) => {
            if (!this._engaged) {
                this._engaged = true;
                document.body.classList.add('custom-cursor-engaged');
                this.cursor.classList.remove('is-hidden');
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };

        this._mousedownHandler = () => {
            this.cursor.classList.add('is-clicking');
        };

        this._mouseupHandler = () => {
            this.cursor.classList.remove('is-clicking');
        };

        this._mouseleaveHandler = () => {
            this.cursor.classList.add('is-hidden');
            this.activeTarget = null;
            this.trailHistory = [];
            this.trailNodes.forEach((node) => {
                node.style.opacity = '0';
            });
            this.updateTooltip(null);
        };

        this._mouseenterHandler = () => {
            this.cursor.classList.remove('is-hidden');
        };

        this._resizeHandler = () => {
            this.refreshTargets(true);
        };

        this._langChangeHandler = () => {
            this.updateTooltip(this.activeTarget);
        };

        document.addEventListener('mousemove', this._mousemoveHandler);
        document.addEventListener('mousedown', this._mousedownHandler);
        document.addEventListener('mouseup', this._mouseupHandler);
        document.addEventListener('mouseleave', this._mouseleaveHandler);
        document.addEventListener('mouseenter', this._mouseenterHandler);
        window.addEventListener('resize', this._resizeHandler, { passive: true });
        window.addEventListener('languageChange', this._langChangeHandler);
    }

    refreshTargets(force = false) {
        const now = performance.now();
        if (!force && (now - this._targetsRefreshAt < 700)) return;

        this.targets = Array.from(document.querySelectorAll(this.magnetSelector));
        this._targetsRefreshAt = now;
    }

    resolveMagnetTarget() {
        const hoveredNode = document.elementFromPoint(this.mouse.x, this.mouse.y);
        const hoveredInteractive = hoveredNode
            ? hoveredNode.closest('a, button, .btn, .nav__link, .team-card, .work-card, .contact-social')
            : null;

        this.activeTarget = hoveredInteractive || null;
        this.activeStrength = 0;

        this.targetDot.x = this.mouse.x;
        this.targetDot.y = this.mouse.y;
        this.targetOutline.x = this.mouse.x;
        this.targetOutline.y = this.mouse.y;
        this.targetOutlineSize = { ...this.defaultOutline };

        this.cursor.classList.toggle('is-hovering', Boolean(hoveredInteractive));
        this.cursor.classList.remove('is-magnetic', 'is-targeting');
        this.updateTooltip(hoveredInteractive);
    }

    updateTooltip(target) {
        if (!this.tooltip) return;

        let text = '';
        if (target && target.closest('.work-card')) {
            const workCard = target.closest('.work-card');
            const explicit = workCard?.dataset.cursorText;

            if (explicit) {
                const isRu = currentLang === 'ru';
                if (isRu) {
                    text = explicit;
                } else {
                    text = explicit === 'Детали' ? 'Details' : 'View';
                }
            } else {
                const isRu = currentLang === 'ru';
                text = isRu ? 'Смотреть' : 'View';
            }
        }

        this.tooltip.textContent = text;
        this.cursor.classList.toggle('has-tooltip', Boolean(text));
    }

    animate() {
        this.resolveMagnetTarget();

        this.dotPos.x += (this.targetDot.x - this.dotPos.x) * 0.2;
        this.dotPos.y += (this.targetDot.y - this.dotPos.y) * 0.2;

        this.outlinePos.x += (this.targetOutline.x - this.outlinePos.x) * 0.14;
        this.outlinePos.y += (this.targetOutline.y - this.outlinePos.y) * 0.14;

        this.outlineSize.width += (this.targetOutlineSize.width - this.outlineSize.width) * 0.16;
        this.outlineSize.height += (this.targetOutlineSize.height - this.outlineSize.height) * 0.16;
        this.outlineSize.radius += (this.targetOutlineSize.radius - this.outlineSize.radius) * 0.16;

        const vx = this.dotPos.x - this.prevDot.x;
        const vy = this.dotPos.y - this.prevDot.y;
        const speed = Math.sqrt(vx * vx + vy * vy);
        this.prevDot.x = this.dotPos.x;
        this.prevDot.y = this.dotPos.y;

        if (this.dot) {
            this.dot.style.left = `${this.dotPos.x}px`;
            this.dot.style.top = `${this.dotPos.y}px`;
        }

        this.trailHistory.unshift({ x: this.dotPos.x, y: this.dotPos.y });
        if (this.trailHistory.length > 70) {
            this.trailHistory.length = 70;
        }

        const speedFactor = Math.max(0, Math.min(1, speed / 1.8));

        this.trailNodes.forEach((node, index) => {
            const historyIndex = Math.min(this.trailHistory.length - 1, index * 4 + 2);
            const point = this.trailHistory[historyIndex];
            if (!point) {
                node.style.opacity = '0';
                return;
            }

            const fade = 1 - (index / this.trailNodes.length);
            node.style.left = `${point.x}px`;
            node.style.top = `${point.y}px`;
            node.style.opacity = `${(fade * 0.36 * speedFactor).toFixed(3)}`;
            node.style.transform = `translate(-50%, -50%) scale(${(0.24 + fade * 0.74).toFixed(3)})`;
        });

        if (this.outline) {
            this.outline.style.left = `${this.outlinePos.x}px`;
            this.outline.style.top = `${this.outlinePos.y}px`;
            this.outline.style.width = `${this.outlineSize.width}px`;
            this.outline.style.height = `${this.outlineSize.height}px`;
            this.outline.style.borderRadius = `${this.outlineSize.radius}px`;
        }

        if (this.tooltip) {
            this.tooltip.style.left = `${this.dotPos.x + 20}px`;
            this.tooltip.style.top = `${this.dotPos.y - 18}px`;
        }

        if (this.spotlight) {
            this.spotlight.style.setProperty('--spot-x', `${this.dotPos.x}px`);
            this.spotlight.style.setProperty('--spot-y', `${this.dotPos.y}px`);
            this.spotlight.style.setProperty('--spot-intensity', `${(0.28 + this.activeStrength * 0.34).toFixed(3)}`);
        }

        this._animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }

        if (this._mousemoveHandler) {
            document.removeEventListener('mousemove', this._mousemoveHandler);
        }
        if (this._mousedownHandler) {
            document.removeEventListener('mousedown', this._mousedownHandler);
        }
        if (this._mouseupHandler) {
            document.removeEventListener('mouseup', this._mouseupHandler);
        }
        if (this._mouseleaveHandler) {
            document.removeEventListener('mouseleave', this._mouseleaveHandler);
        }
        if (this._mouseenterHandler) {
            document.removeEventListener('mouseenter', this._mouseenterHandler);
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
        if (this._langChangeHandler) {
            window.removeEventListener('languageChange', this._langChangeHandler);
        }

        document.body.classList.remove('has-custom-cursor');
        document.body.classList.remove('custom-cursor-engaged');

        if (this.spotlight && this.spotlight.parentNode) {
            this.spotlight.remove();
        }
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.remove();
        }
    }
}

// =====================================================
// ANIMATIONS
// =====================================================
class AnimationController {
    constructor() {
        this._scrollHandler = null;
        this.setupHeader();
        this.setupSmoothScroll();
        this.setupCountUp();
    }

    setupHeader() {
        const header = document.querySelector('.nav');
        if (!header) return;

        let lastScroll = 0;

        this._scrollHandler = () => {
            const currentScroll = window.scrollY;
            const keepVisibleOnWideScreen = window.matchMedia('(min-width: 1240px)').matches;

            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            if (keepVisibleOnWideScreen) {
                header.style.transform = 'translateY(0)';
            } else if (currentScroll > lastScroll && currentScroll > 220) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        };

        window.addEventListener('scroll', this._scrollHandler, { passive: true });
    }

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (!target) return;

                e.preventDefault();
                const headerHeight = document.querySelector('.nav')?.offsetHeight || 0;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            });
        });
    }

    setupCountUp() {
        const counters = document.querySelectorAll('.hero__stat-number');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.count);
                    if (isNaN(target)) return;
                    
                    const duration = 2000;
                    const startTime = performance.now();

                    const updateCount = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(easeOut * target);

                        entry.target.textContent = current;

                        if (progress < 1) {
                            requestAnimationFrame(updateCount);
                        }
                    };

                    requestAnimationFrame(updateCount);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(el => observer.observe(el));
    }
    
    destroy() {
        if (this._scrollHandler) {
            window.removeEventListener('scroll', this._scrollHandler);
        }
    }
}

// =====================================================
// TEAM MODAL
// =====================================================
class TeamModal {
    constructor() {
        this.modal = document.getElementById('team-modal');
        if (!this.modal) return;
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', () => this.openModal(card));
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal || 
                e.target.closest('.modal__backdrop') || 
                e.target.closest('.modal__close')) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
                this.closeModal();
            }
        });
    }
    
    // ИСПРАВЛЕНИЕ: XSS protection
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    openModal(card) {
        const data = card.dataset;
        const store = window.siteSync?.getStore();
        const lang = currentLang || 'en';

        // Basic info
        const nameEl = document.getElementById('modal-name');
        const roleEl = document.getElementById('modal-role');
        const levelEl = document.getElementById('modal-level');
        const descEl = document.getElementById('modal-description');
        const condEl = document.getElementById('modal-conditions');
        
        if (nameEl) nameEl.textContent = data.name || '';
        if (roleEl) roleEl.textContent = data.role || '';
        if (levelEl) levelEl.textContent = data.level || '';
        if (descEl) descEl.textContent = data.description || '';
        if (condEl) condEl.textContent = data.conditions || '';

        // Find member in store
        let member = null;
        if (store?.data) {
            member = store.data.team.find(m =>
                m.name.en === data.name || m.name.ru === data.name || m.id === data.member
            );
        }

        // Photo in modal
        const modalPhoto = this.modal.querySelector('.modal__photo');
        if (modalPhoto) {
            if (member?.photo) {
                modalPhoto.innerHTML = `<img src="${this.escapeHtml(member.photo)}" alt="${this.escapeHtml(data.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else {
                modalPhoto.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            }
        }

        // Portfolio items
        const portfolioContainer = document.getElementById('modal-portfolio');
        if (portfolioContainer) {
            if (member?.portfolioItems && member.portfolioItems.length > 0) {
                portfolioContainer.innerHTML = member.portfolioItems.map(item => {
                    if (item.media) {
                        const mediaUrl = this.escapeHtml(item.media);
                        const titleSafe = this.escapeHtml(item.title || '');

                        if (item.type === 'video') {
                            return `<div class="modal__portfolio-item modal__portfolio-item--media" onclick="window.worksGalleryInstance?.openPortfolioMedia('${mediaUrl}', '${titleSafe}')">
                                <video src="${mediaUrl}" muted loop playsinline style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"></video>
                                <div class="modal__portfolio-item-label">${titleSafe}</div>
                            </div>`;
                        } else {
                            return `<div class="modal__portfolio-item modal__portfolio-item--media" onclick="window.worksGalleryInstance?.openPortfolioMedia('${mediaUrl}', '${titleSafe}')">
                                <img src="${mediaUrl}" alt="${titleSafe}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">
                                <div class="modal__portfolio-item-label">${titleSafe}</div>
                            </div>`;
                        }
                    } else {
                        return `<div class="modal__portfolio-item">${this.escapeHtml(item.title || 'Проект')}</div>`;
                    }
                }).join('');
            } else if (data.portfolio) {
                const items = data.portfolio.split(',');
                portfolioContainer.innerHTML = items.map(item =>
                    `<div class="modal__portfolio-item">${this.escapeHtml(item.trim())}</div>`
                ).join('');
            } else {
                portfolioContainer.innerHTML = '<p style="color:#9ca3af;font-size:0.85rem;">Нет элементов портфолио</p>';
            }
        }

        // Member works
        const worksContainer = document.getElementById('modal-member-works');
        if (worksContainer) {
            if (member && store?.data) {
                let worksHtml = '';
                store.data.works.forEach(category => {
                    const memberPhotos = (category.photos || []).filter(p => p.author === member.id);
                    memberPhotos.forEach(photo => {
                        const catName = category.title[lang] || category.title.en;
                        const photoUrl = this.escapeHtml(photo.url || '');
                        const photoName = this.escapeHtml(photo.name || '');
                        worksHtml += `
                            <div class="modal__work-item" onclick="window.worksGalleryInstance?.openMemberWork('${category.id}', '${photoUrl}')">
                                <img src="${photoUrl}" alt="${photoName}" loading="lazy">
                                <div class="modal__work-item-info">
                                    <span class="modal__work-item-name">${photoName}</span>
                                    <span class="modal__work-item-cat">${this.escapeHtml(catName)}</span>
                                </div>
                            </div>
                        `;
                    });
                });

                if (worksHtml) {
                    worksContainer.innerHTML = worksHtml;
                    worksContainer.parentElement.style.display = '';
                } else {
                    worksContainer.innerHTML = '<p style="color:#9ca3af;font-size:0.85rem;">Пока нет привязанных работ</p>';
                }
            } else {
                worksContainer.innerHTML = '<p style="color:#9ca3af;font-size:0.85rem;">Пока нет привязанных работ</p>';
            }
        }

        this.modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }
}

// =====================================================
// WORKS GALLERY
// =====================================================
class WorksGallery {
    constructor() {
        this.gallery = document.getElementById('works-gallery');
        if (!this.gallery) return;
        this.currentPhotos = [];
        this.currentIndex = 0;
        this.currentCategoryName = '';
        this.bindEvents();
    }
    
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    bindEvents() {
        document.querySelectorAll('.work-card').forEach(card => {
            card.addEventListener('click', () => this.openGallery(card));
        });

        this.gallery.addEventListener('click', e => {
            if (e.target === this.gallery || 
                e.target.closest('.works-gallery__backdrop') || 
                e.target.closest('.works-gallery__close')) {
                this.closeGallery();
            }
        });

        document.addEventListener('keydown', e => {
            const lb = document.getElementById('photo-lightbox');
            if (lb?.classList.contains('is-open')) {
                if (e.key === 'Escape') this.closeLightbox();
                if (e.key === 'ArrowRight') this.nextPhoto();
                if (e.key === 'ArrowLeft') this.prevPhoto();
            } else if (this.gallery.classList.contains('is-open')) {
                if (e.key === 'Escape') this.closeGallery();
            }
        });
    }

    openGallery(card) {
        const category = card.dataset.category || '';
        const store = window.siteSync?.getStore();
        if (!store?.data) return;

        const lang = currentLang || 'en';
        const work = store.data.works.find(w => w.id === category);
        const title = work?.title[lang] || work?.title.en || category;

        const titleEl = document.getElementById('gallery-title');
        if (titleEl) titleEl.textContent = title;
        this.currentCategoryName = title;

        const grid = document.getElementById('gallery-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        if (!work || !work.photos || work.photos.length === 0) {
            grid.innerHTML = `<div class="works-gallery__empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Пока нет работ в этой категории</p>
            </div>`;
            this.currentPhotos = [];
        } else {
            this.currentPhotos = work.photos;
            work.photos.forEach((photo, index) => {
                const authorName = photo.author ? store.getAuthorName(photo.author, lang) : '';
                const item = document.createElement('div');
                item.className = `works-gallery__item works-gallery__item--${photo.format || 'auto'}`;
                item.innerHTML = `
                    <img src="${this.escapeHtml(photo.url)}" alt="${this.escapeHtml(photo.name || '')}" loading="lazy">
                    <div class="works-gallery__item-info">
                        <span class="works-gallery__item-name">${this.escapeHtml(photo.name || '')}</span>
                        ${authorName ? `<span class="works-gallery__item-author">by ${this.escapeHtml(authorName)}</span>` : ''}
                    </div>
                `;
                item.addEventListener('click', () => this.openLightbox(index));
                grid.appendChild(item);
            });
        }

        this.gallery.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    openPortfolioMedia(mediaUrl, title) {
        this.currentPhotos = [{
            url: mediaUrl,
            name: title || 'Портфолио',
            description: '',
            author: '',
            date: ''
        }];
        this.currentCategoryName = 'Портфолио';
        this.currentIndex = 0;
        this.renderLightbox();
    }

    openMemberWork(categoryId, photoUrl) {
        const store = window.siteSync?.getStore();
        if (!store?.data) return;

        const lang = currentLang || 'en';
        const work = store.data.works.find(w => w.id === categoryId);
        if (!work || !work.photos) return;

        this.currentPhotos = work.photos;
        this.currentCategoryName = work.title[lang] || work.title.en;

        const index = work.photos.findIndex(p => p.url === photoUrl);
        this.openLightbox(index >= 0 ? index : 0);
    }

    closeGallery() {
        this.gallery.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    openLightbox(index) {
        this.currentIndex = index;
        this.renderLightbox();
    }

    // ИСПРАВЛЕНИЕ #26: Безопасное форматирование даты
    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
        } catch {
            return '';
        }
    }

    renderLightbox() {
        const old = document.getElementById('photo-lightbox');
        if (old) old.remove();

        const photo = this.currentPhotos[this.currentIndex];
        if (!photo) return;

        const store = window.siteSync?.getStore();
        const lang = currentLang || 'en';
        const authorName = photo.author && store ? store.getAuthorName(photo.author, lang) : '';
        const total = this.currentPhotos.length;
        const current = this.currentIndex + 1;
        const formattedDate = this.formatDate(photo.date);

        const lb = document.createElement('div');
        lb.id = 'photo-lightbox';
        lb.className = 'photo-lightbox is-open';

        lb.innerHTML = `
            <div class="photo-lightbox__backdrop"></div>
            <div class="photo-lightbox__container">
                <button class="photo-lightbox__close" aria-label="Закрыть">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>

                ${this.currentIndex > 0 ? `<button class="photo-lightbox__arrow photo-lightbox__arrow--prev" id="lb-prev" aria-label="Предыдущее">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>` : ''}

                ${this.currentIndex < total - 1 ? `<button class="photo-lightbox__arrow photo-lightbox__arrow--next" id="lb-next" aria-label="Следующее">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>` : ''}

                <div class="photo-lightbox__image-wrap">
                    <img src="${this.escapeHtml(photo.url)}" alt="${this.escapeHtml(photo.name || '')}" class="photo-lightbox__image">
                </div>

                <div class="photo-lightbox__details">
                    <div class="photo-lightbox__header">
                        <div>
                            <h3 class="photo-lightbox__title">${this.escapeHtml(photo.name || 'Без названия')}</h3>
                            ${total > 1 ? `<span class="photo-lightbox__counter">${current} / ${total}</span>` : ''}
                        </div>
                        <span class="photo-lightbox__category">${this.escapeHtml(this.currentCategoryName)}</span>
                    </div>
                    ${photo.description ? `<p class="photo-lightbox__description">${this.escapeHtml(photo.description)}</p>` : ''}
                    <div class="photo-lightbox__meta">
                        ${authorName ? `<div class="photo-lightbox__meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <span>${this.escapeHtml(authorName)}</span>
                        </div>` : ''}
                        ${formattedDate ? `<div class="photo-lightbox__meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>${formattedDate}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(lb);

        // Events
        lb.querySelector('.photo-lightbox__backdrop').addEventListener('click', () => this.closeLightbox());
        lb.querySelector('.photo-lightbox__close').addEventListener('click', () => this.closeLightbox());
        document.getElementById('lb-prev')?.addEventListener('click', () => this.prevPhoto());
        document.getElementById('lb-next')?.addEventListener('click', () => this.nextPhoto());

        // Touch swipe
        let startX = 0;
        const cont = lb.querySelector('.photo-lightbox__container');
        cont.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        cont.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.nextPhoto();
                else this.prevPhoto();
            }
        }, { passive: true });
    }

    nextPhoto() {
        if (this.currentIndex < this.currentPhotos.length - 1) {
            this.currentIndex++;
            this.renderLightbox();
        }
    }

    prevPhoto() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderLightbox();
        }
    }

    closeLightbox() {
        const lb = document.getElementById('photo-lightbox');
        if (lb) {
            lb.classList.remove('is-open');
            setTimeout(() => lb.remove(), 300);
        }
    }
}

// =====================================================
// MOBILE MENU — ИСПРАВЛЕНИЕ #13
// =====================================================
class MobileMenu {
    constructor() {
        this.toggle = document.getElementById('nav-toggle');
        this.menu = document.getElementById('mobile-menu');

        if (!this.toggle || !this.menu) return;

        this.toggle.setAttribute('aria-controls', 'mobile-menu');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.menu.setAttribute('aria-hidden', 'true');

        this.toggle.addEventListener('click', () => {
            if (this.menu.classList.contains('is-open')) {
                this.close();
                return;
            }
            this.open();
        });

        this.menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.close();
            });
        });

        // Закрытие по клику в подложку
        this.menu.addEventListener('click', (event) => {
            if (event.target === this.menu) {
                this.close();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.classList.contains('is-open')) {
                this.close();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024 && this.menu.classList.contains('is-open')) {
                this.close();
            }
        });
    }

    open() {
        this.menu.classList.add('is-open');
        this.toggle.classList.add('is-open');
        document.body.classList.add('mobile-menu-open');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.menu.setAttribute('aria-hidden', 'false');
    }
    
    close() {
        this.menu.classList.remove('is-open');
        this.toggle.classList.remove('is-open');
        document.body.classList.remove('mobile-menu-open');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.menu.setAttribute('aria-hidden', 'true');
    }
}

// =====================================================
// ADVANCED SCROLL EFFECTS
// =====================================================
class ScrollFXController {
    constructor() {
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.bgLayers = Array.from(document.querySelectorAll('[data-parallax-layer]'));
        this.contentLayers = Array.from(document.querySelectorAll('[data-parallax-content]'));
        this.workCards = Array.from(document.querySelectorAll('.works__grid-bento .work-card'));

        this.constellationPaths = [];
        this.constellationNodes = [];
        this.typewriterTimers = new Map();

        this._animationFrameId = null;
        this._scrollHandler = null;
        this._resizeHandler = null;
        this._languageHandler = null;
        this._textObserver = null;
        this._worksObserver = null;

        this.prepareConstellation();
        this.prepareKineticText();
        this.prepareWorksAssembly();

        this._languageHandler = () => {
            requestAnimationFrame(() => {
                this.prepareKineticText();
                if (this.reducedMotion) {
                    this.applyReducedMotionState();
                }
            });
        };
        window.addEventListener('languageChange', this._languageHandler);

        if (this.reducedMotion) {
            this.applyReducedMotionState();
            return;
        }

        this.bindEvents();
        this.updateEffects();
    }

    bindEvents() {
        this._scrollHandler = () => this.requestTick();
        this._resizeHandler = () => this.requestTick();

        window.addEventListener('scroll', this._scrollHandler, { passive: true });
        window.addEventListener('resize', this._resizeHandler, { passive: true });
    }

    requestTick() {
        if (this._animationFrameId) return;
        this._animationFrameId = requestAnimationFrame(() => {
            this._animationFrameId = null;
            this.updateEffects();
        });
    }

    updateEffects() {
        const scrollY = window.scrollY || 0;
        const viewportHeight = window.innerHeight || 1;
        const isCompactViewport = window.innerWidth <= 768;
        const maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
        const ratio = Math.max(0, Math.min(scrollY / maxScroll, 1));

        this.bgLayers.forEach(layer => {
            if (isCompactViewport) {
                layer.style.transform = 'translate3d(0, 0, 0)';
                return;
            }

            const depth = parseFloat(layer.dataset.depth || '0');
            const limit = parseFloat(layer.dataset.parallaxLimit || '140');
            const shift = Math.max(Math.min(scrollY * depth, limit), -limit);
            layer.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
        });

        this.contentLayers.forEach(layer => {
            if (isCompactViewport) {
                layer.style.setProperty('--parallax-shift', '0px');
                return;
            }

            const depth = parseFloat(layer.dataset.depth || '0.05');
            const limit = parseFloat(layer.dataset.parallaxLimit || '80');
            const rect = layer.getBoundingClientRect();
            const centerOffset = rect.top + (rect.height * 0.5) - (viewportHeight * 0.5);
            const shift = Math.max(Math.min(-centerOffset * depth, limit), -limit);
            layer.style.setProperty('--parallax-shift', `${shift.toFixed(2)}px`);
        });

        this.updateConstellation(ratio);
    }

    prepareConstellation() {
        this.constellationPaths = Array.from(document.querySelectorAll('.constellation-path')).map(path => {
            let length = 0;
            try {
                length = path.getTotalLength();
            } catch {
                length = 0;
            }

            if (length > 0) {
                path.style.strokeDasharray = `${length}`;
                path.style.strokeDashoffset = `${length}`;
            }
            path.style.opacity = '0.12';

            return {
                path,
                length,
                start: parseFloat(path.dataset.drawStart || '0'),
                span: parseFloat(path.dataset.drawSpan || '0.16')
            };
        });

        this.constellationNodes = Array.from(document.querySelectorAll('.constellation-node')).map(node => ({
            node,
            start: parseFloat(node.dataset.nodeStart || '0'),
            span: parseFloat(node.dataset.nodeSpan || '0.12')
        }));
    }

    updateConstellation(ratio) {
        const progressFor = (value, start, span) => {
            const safeSpan = span > 0 ? span : 0.16;
            return Math.max(0, Math.min((value - start) / safeSpan, 1));
        };

        this.constellationPaths.forEach(item => {
            const progress = progressFor(ratio, item.start, item.span);
            if (item.length > 0) {
                item.path.style.strokeDashoffset = `${(1 - progress) * item.length}`;
            }
            item.path.style.opacity = (0.12 + (progress * 0.88)).toFixed(3);
        });

        this.constellationNodes.forEach(item => {
            const progress = progressFor(ratio, item.start, item.span);
            item.node.style.opacity = (0.15 + (progress * 0.85)).toFixed(3);
            item.node.style.transform = `scale(${(0.55 + (progress * 0.45)).toFixed(3)})`;
        });
    }

    prepareKineticText() {
        this.clearTypewriterTimers();

        if (this._textObserver) {
            this._textObserver.disconnect();
            this._textObserver = null;
        }

        const kineticElements = Array.from(document.querySelectorAll('[data-kinetic]'));

        kineticElements.forEach(el => {
            const type = el.dataset.kinetic;
            if (type === 'letters') {
                this.prepareLetterElement(el);
            } else if (type === 'typewriter') {
                this.prepareTypewriterElement(el);
            }
        });

        this._textObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el = entry.target;
                if (el.dataset.kinetic === 'letters') {
                    el.classList.add('is-kinetic-visible');
                } else if (el.dataset.kinetic === 'typewriter') {
                    this.startTypewriter(el);
                }

                if (el.dataset.kineticOnce !== 'false' && this._textObserver) {
                    this._textObserver.unobserve(el);
                }
            });
        }, { threshold: 0.28, rootMargin: '0px 0px -6% 0px' });

        kineticElements.forEach(el => {
            this._textObserver.observe(el);
        });
    }

    prepareLetterElement(el) {
        const text = (el.textContent || '').trim();
        if (!text) return;

        el.dataset.kineticOriginal = text;
        el.textContent = '';
        el.classList.add('kinetic-letters');
        if (el.classList.contains('text-gradient') || el.classList.contains('text-gradient-animated')) {
            el.classList.add('kinetic-letters--gradient');
        } else {
            el.classList.remove('kinetic-letters--gradient');
        }
        el.classList.remove('is-kinetic-visible');

        const fragment = document.createDocumentFragment();
        Array.from(text).forEach((char, index) => {
            const span = document.createElement('span');
            span.className = char === ' ' ? 'kinetic-char kinetic-char--space' : 'kinetic-char';
            span.style.setProperty('--char-index', index);
            span.textContent = char === ' ' ? '\u00A0' : char;
            fragment.appendChild(span);
        });

        el.appendChild(fragment);
    }

    prepareTypewriterElement(el) {
        const text = (el.textContent || '').trim();
        if (!text) return;

        el.dataset.kineticOriginal = text;
        el.dataset.typewriterState = 'idle';
        el.classList.add('kinetic-typewriter');
        el.classList.remove('is-typed');
        el.textContent = '';
    }

    startTypewriter(el) {
        const text = el.dataset.kineticOriginal || '';
        if (!text) return;
        if (el.dataset.typewriterState === 'running' || el.dataset.typewriterState === 'done') return;

        el.dataset.typewriterState = 'running';
        el.classList.remove('is-typed');
        el.textContent = '';

        let index = 0;
        const step = Math.max(16, Math.min(46, Math.floor(1200 / Math.max(text.length, 1))));

        const timer = window.setInterval(() => {
            index += 1;
            el.textContent = text.slice(0, index);

            if (index >= text.length) {
                window.clearInterval(timer);
                this.typewriterTimers.delete(el);
                el.dataset.typewriterState = 'done';
                el.classList.add('is-typed');
            }
        }, step);

        this.typewriterTimers.set(el, timer);
    }

    clearTypewriterTimers() {
        this.typewriterTimers.forEach(timer => window.clearInterval(timer));
        this.typewriterTimers.clear();
    }

    prepareWorksAssembly() {
        this.workCards.forEach((card, index) => {
            card.dataset.assembleDelay = String(index * 90);

            if (card.querySelector('.work-card__assemble-piece')) return;

            const fragment = document.createDocumentFragment();
            for (let i = 1; i <= 4; i += 1) {
                const piece = document.createElement('span');
                piece.className = `work-card__assemble-piece work-card__assemble-piece--${i}`;
                fragment.appendChild(piece);
            }
            card.appendChild(fragment);
        });

        if (this.reducedMotion) {
            this.workCards.forEach(card => card.classList.add('is-assembled'));
            return;
        }

        if (this._worksObserver) {
            this._worksObserver.disconnect();
        }

        this._worksObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const card = entry.target;
                const delay = parseInt(card.dataset.assembleDelay || '0', 10);

                window.setTimeout(() => {
                    card.classList.add('is-assembled');
                }, delay);

                if (this._worksObserver) {
                    this._worksObserver.unobserve(card);
                }
            });
        }, { threshold: 0.22, rootMargin: '0px 0px -10% 0px' });

        this.workCards.forEach(card => this._worksObserver.observe(card));
    }

    applyReducedMotionState() {
        this.bgLayers.forEach(layer => {
            layer.style.transform = 'translate3d(0, 0, 0)';
        });
        this.contentLayers.forEach(layer => {
            layer.style.setProperty('--parallax-shift', '0px');
        });

        this.updateConstellation(1);

        this.workCards.forEach(card => card.classList.add('is-assembled'));

        document.querySelectorAll('[data-kinetic="letters"]').forEach(el => {
            el.classList.add('is-kinetic-visible');
        });

        document.querySelectorAll('[data-kinetic="typewriter"]').forEach(el => {
            const text = el.dataset.kineticOriginal || el.textContent || '';
            el.textContent = text;
            el.dataset.typewriterState = 'done';
            el.classList.add('is-typed');
        });
    }

    destroy() {
        this.clearTypewriterTimers();

        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }

        if (this._scrollHandler) {
            window.removeEventListener('scroll', this._scrollHandler);
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
        if (this._languageHandler) {
            window.removeEventListener('languageChange', this._languageHandler);
        }
        if (this._textObserver) {
            this._textObserver.disconnect();
        }
        if (this._worksObserver) {
            this._worksObserver.disconnect();
        }
    }
}

// =====================================================
// INITIALIZE
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    new Loader();
    new LanguageSwitcher();

    // ИСПРАВЛЕНИЕ #15: Привязка к window для theme-switcher.js
    window.particleSystemInstance = new ParticleSystem();

    new CustomCursor();
    new AnimationController();
    window.teamModalInstance = new TeamModal();
    window.worksGalleryInstance = new WorksGallery();
    new MobileMenu();
    window.scrollFxInstance = new ScrollFXController();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.particleSystemInstance) {
        window.particleSystemInstance.destroy();
    }
    if (window.scrollFxInstance) {
        window.scrollFxInstance.destroy();
    }
});
// Scroll Reveal
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, { threshold: 0.1 });
// =====================================================
// ANALYTICS TRACKER — трекинг кликов пользователей
// =====================================================
class SiteAnalytics {
    constructor() {
        this._sessionId = this._getSessionId();
        this._tracked = false;

        // Трекаем page_view при загрузке
        this.track('page_view', { path: window.location.pathname });

        this.bindEvents();
    }

    _getSessionId() {
        let id = sessionStorage.getItem('tish_visitor_id');
        if (!id) {
            id = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
            sessionStorage.setItem('tish_visitor_id', id);
        }
        return id;
    }

    track(event, data = {}) {
        try {
            fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event,
                    data,
                    sessionId: this._sessionId,
                    timestamp: new Date().toISOString()
                })
            }).catch(() => {});
        } catch {}
    }

    bindEvents() {
        // Клики по категориям работ
        document.querySelectorAll('.work-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category || '';
                const title = card.querySelector('.work-card__title')?.textContent || category;
                this.track('category_click', { category: title, categoryId: category });
                this.track('portfolio_click', { source: 'category', category: title });
            });
        });

        // Клики по участникам команды
        document.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', () => {
                const name = card.dataset.name || '';
                const member = card.dataset.member || '';
                this.track('team_click', { member: name, memberId: member });
            });
        });

        // Клики по ссылкам заказа через TISH STORE
        document.querySelectorAll('a[href*="/tish-store/"]').forEach(link => {
            link.addEventListener('click', () => {
                this.track('order_click', { source: 'tish-store-link' });
            });
        });
    }
}

// Инициализация аналитики
document.addEventListener('DOMContentLoaded', () => {
    // Задержка чтобы не замедлять загрузку
    setTimeout(() => {
        window.siteAnalytics = new SiteAnalytics();
    }, 1000);
});
document.querySelectorAll('.section__header, .team-card, .work-card, .contact-cta__content').forEach(el => {
    el.classList.add('reveal-up');
    revealObserver.observe(el);
});