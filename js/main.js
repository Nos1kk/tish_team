/* =====================================================
   TISH TEAM - MAIN JAVASCRIPT (FIXED)
   ===================================================== */

// =====================================================
// TRANSLATIONS
// =====================================================
const translations = {
    en: {
        navTeam: 'Team',
        navWorks: 'Works',
        navContact: 'Contact',
        navOrder: 'Order',
        heroLabel: 'Design Team',
        heroSubtitle: 'A design team that combines minimalism and creative chaos. We create presentations, banners, business cards and interfaces that are memorable.',
        heroBtn1: 'Order Design',
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
        sanyaLevel: 'Figma • Presentations • WB Cards • Logos • Brandbooks',
        sanyaDesc: 'Creates presentations, marketplace product cards, logos and complete brand identity. Loves when every detail is polished to perfection.',
        sanyaConditions: 'Projects from 2-3 days, 50% prepayment. Rush orders +30% extra.',
        yarikName: 'Yarik',
        yarikRole: 'Design & Branding',
        yarikLevel: 'Presentations • Brandbooks • Logos • Print Design',
        yarikDesc: 'Creates presentations, brandbooks and logos that you want to look at again. Brings dynamics to your brands and corporate identity.',
        yarikConditions: 'Full branding packages or individual elements available.',
        kiryaName: 'Kirya',
        kiryaRole: 'Development',
        kiryaLevel: 'Websites • Telegram Bots • Apps • Plugins • Code',
        kiryaDesc: 'Turns design into working products. Websites, bots, applications, plugins - everything related to code and development.',
        kiryaConditions: 'Websites and apps turnkey. Support after delivery.',
        worksLabel: 'Portfolio',
        worksTitle: 'Our',
        worksTitleAccent: 'works',
        worksSubtitle: 'Click on a category to view our projects',
        filterPresentations: 'Presentations',
        filterWBCards: 'WB Cards',
        filterBrandbooks: 'Brandbooks',
        filterAds: 'Advertising',
        filterWebsites: 'Websites',
        filterBots: 'TG Bots',
        filterApps: 'Apps',
        filterOther: 'Other',
        viewMore: 'View',
        worksCount: 'works',
        contactLabel: 'Ready to start?',
        contactTitle1: "Let's create",
        contactTitle2: 'something',
        contactTitleAccent: 'incredible',
        contactText: 'Message us on Telegram — the bot will ask a few questions, advise on timing and connect you with the right team member.',
        contactBtnBot: 'Order via Bot',
        contactBtnChat: 'Write to Chat',
        contactOr: 'or',
        contactBotLabel: 'Bot',
        contactChatLabel: 'Chat',
        footerCopy: '© 2024 TISH TEAM. All rights reserved.',
        footerUp: 'Back to top',
        modalAbout: 'About',
        modalPortfolio: 'Portfolio',
        modalConditions: 'Working conditions',
        modalContact: 'Order via Bot',
        loaderTagline: 'Design Team'
    },
    ru: {
        navTeam: 'Команда',
        navWorks: 'Работы',
        navContact: 'Контакты',
        navOrder: 'Заказать',
        heroLabel: 'Design Team',
        heroSubtitle: 'Дизайн-команда, которая соединяет минимализм и творческий хаос. Создаём презентации, баннеры, визитки и интерфейсы, которые запоминаются.',
        heroBtn1: 'Заказать дизайн',
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
        sanyaLevel: 'Figma • Презентации • Карточки WB • Логотипы • Брендбуки',
        sanyaDesc: 'Создаёт презентации, карточки товаров для маркетплейсов, логотипы и полную айдентику брендов. Любит, когда каждая деталь вылизана до идеала.',
        sanyaConditions: 'Проекты от 2–3 дней, предоплата 50%. Срочные заказы +30% к стоимости.',
        yarikName: 'Ярик',
        yarikRole: 'Дизайн & Брендинг',
        yarikLevel: 'Презентации • Брендбуки • Логотипы • Полиграфия',
        yarikDesc: 'Делает презентации, брендбуки и логотипы, которые хочется пересматривать. Вливает динамику в ваши бренды и корпоративный стиль.',
        yarikConditions: 'Полные пакеты брендинга или отдельные элементы.',
        kiryaName: 'Киря',
        kiryaRole: 'Разработка',
        kiryaLevel: 'Сайты • Telegram боты • Приложения • Плагины • Код',
        kiryaDesc: 'Переносит дизайн в рабочие продукты. Сайты, боты, приложения, плагины — всё, что связано с кодом и разработкой.',
        kiryaConditions: 'Сайты и приложения под ключ. Поддержка после сдачи.',
        worksLabel: 'Портфолио',
        worksTitle: 'Наши',
        worksTitleAccent: 'работы',
        worksSubtitle: 'Нажмите на категорию, чтобы увидеть проекты',
        filterPresentations: 'Презентации',
        filterWBCards: 'Карточки WB',
        filterBrandbooks: 'Брендбуки',
        filterAds: 'Реклама',
        filterWebsites: 'Сайты',
        filterBots: 'TG Боты',
        filterApps: 'Приложения',
        filterOther: 'Прочее',
        viewMore: 'Смотреть',
        worksCount: 'работ',
        contactLabel: 'Готовы начать?',
        contactTitle1: 'Давайте создадим',
        contactTitle2: 'что-то',
        contactTitleAccent: 'невероятное',
        contactText: 'Напишите нам в Telegram — бот задаст пару вопросов, подскажет по срокам и свяжет с нужным человеком из команды.',
        contactBtnBot: 'Заказать через бота',
        contactBtnChat: 'Написать в чат',
        contactOr: 'или',
        contactBotLabel: 'Бот',
        contactChatLabel: 'Чат',
        footerCopy: '© 2024 TISH TEAM. Все права защищены.',
        footerUp: 'Наверх',
        modalAbout: 'О себе',
        modalPortfolio: 'Портфолио',
        modalConditions: 'Условия работы',
        modalContact: 'Заказать через бота',
        loaderTagline: 'Design Team'
    }
};

let currentLang = 'en';

// =====================================================
// LOADER - Fixed to actually complete
// =====================================================
class Loader {
    constructor() {
        this.loader = document.getElementById('loader');
        this.progressBar = document.getElementById('loader-bar');
        this.percentText = document.getElementById('loader-percent');
        this.progress = 0;
        
        if (this.loader) {
            document.body.style.overflow = 'hidden';
            this.simulateLoading();
        }
    }
    
    simulateLoading() {
        const steps = [
            { progress: 20, delay: 150 },
            { progress: 45, delay: 200 },
            { progress: 65, delay: 150 },
            { progress: 85, delay: 200 },
            { progress: 100, delay: 100 }
        ];
        
        let currentStep = 0;
        
        const nextStep = () => {
            if (currentStep >= steps.length) {
                this.complete();
                return;
            }
            
            const step = steps[currentStep];
            this.setProgress(step.progress);
            currentStep++;
            setTimeout(nextStep, step.delay);
        };
        
        setTimeout(nextStep, 300);
    }
    
    setProgress(value) {
        this.progress = value;
        if (this.progressBar) {
            this.progressBar.style.width = `${value}%`;
        }
        if (this.percentText) {
            this.percentText.textContent = `${Math.round(value)}%`;
        }
    }
    
    complete() {
        setTimeout(() => {
            if (this.loader) {
                this.loader.classList.add('is-hidden');
                document.body.style.overflow = '';
                setTimeout(() => {
                    if (this.loader && this.loader.parentNode) {
                        this.loader.remove();
                    }
                }, 800);
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
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                el.textContent = t[key];
            }
        });
        
        this.updateTeamData();
    }
    
    updateTeamData() {
        const t = translations[currentLang];
        
        const members = [
            { selector: '[data-member="sanya"]', prefix: 'sanya' },
            { selector: '[data-member="yarik"]', prefix: 'yarik' },
            { selector: '[data-member="kirya"]', prefix: 'kirya' }
        ];
        
        members.forEach(({ selector, prefix }) => {
            const card = document.querySelector(selector);
            if (card) {
                card.dataset.name = t[`${prefix}Name`];
                card.dataset.role = t[`${prefix}Role`];
                card.dataset.level = t[`${prefix}Level`];
                card.dataset.description = t[`${prefix}Desc`];
                card.dataset.conditions = t[`${prefix}Conditions`];
            }
        });
    }
}

// =====================================================
// PARTICLE SYSTEM
// =====================================================
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.config = {
            particleCount: window.innerWidth < 768 ? 40 : 80,
            particleSize: { min: 1, max: 3 },
            speed: 0.3,
            connectionDistance: 120,
            mouseRadius: 150,
            colors: ['#a855f7', '#d946ef', '#06b6d4', '#8b5cf6', '#ec4899']
        };
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.speed,
                vy: (Math.random() - 0.5) * this.config.speed,
                size: Math.random() * (this.config.particleSize.max - this.config.particleSize.min) + this.config.particleSize.min,
                color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
                opacity: Math.random() * 0.5 + 0.2,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.config.particleCount = window.innerWidth < 768 ? 40 : 80;
            this.createParticles();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
    
    drawParticle(p) {
        p.pulse += 0.02;
        const pulseSize = p.size + Math.sin(p.pulse) * 0.5;
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.config.connectionDistance) {
                    const opacity = (1 - distance / this.config.connectionDistance) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    updateParticle(p) {
        if (this.mouse.x !== null && this.mouse.y !== null) {
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.config.mouseRadius) {
                const force = (this.config.mouseRadius - distance) / this.config.mouseRadius;
                p.vx -= (dx / distance) * force * 0.02;
                p.vy -= (dy / distance) * force * 0.02;
            }
        }
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;
        
        if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        
        p.x = Math.max(0, Math.min(this.canvas.width, p.x));
        p.y = Math.max(0, Math.min(this.canvas.height, p.y));
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            this.updateParticle(p);
            this.drawParticle(p);
        });
        
        this.drawConnections();
        requestAnimationFrame(() => this.animate());
    }
}

// =====================================================
// CUSTOM CURSOR - Fixed visibility
// =====================================================
class CustomCursor {
    constructor() {
        if ('ontouchstart' in window || window.innerWidth < 1024) return;
        
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        
        this.dot = document.createElement('div');
        this.dot.className = 'cursor-dot';
        
        this.outline = document.createElement('div');
        this.outline.className = 'cursor-outline';
        
        this.cursor.appendChild(this.dot);
        this.cursor.appendChild(this.outline);
        document.body.appendChild(this.cursor);
        
        this.pos = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        
        this.bindEvents();
        this.animate();
    }
    
    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.cursor.style.opacity = '1';
        });
        
        document.addEventListener('mouseleave', () => {
            this.cursor.style.opacity = '0';
        });
        
        document.addEventListener('mouseenter', () => {
            this.cursor.style.opacity = '1';
        });
        
        document.addEventListener('mousedown', () => {
            this.cursor.classList.add('is-clicking');
        });
        
        document.addEventListener('mouseup', () => {
            this.cursor.classList.remove('is-clicking');
        });
        
        // Use event delegation for hover
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, .team-card, .work-card, [data-hover]')) {
                this.cursor.classList.add('is-hovering');
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, .team-card, .work-card, [data-hover]')) {
                this.cursor.classList.remove('is-hovering');
            }
        });
    }
    
    animate() {
        this.pos.x += (this.mouse.x - this.pos.x) * 0.15;
        this.pos.y += (this.mouse.y - this.pos.y) * 0.15;
        
        this.dot.style.left = `${this.mouse.x}px`;
        this.dot.style.top = `${this.mouse.y}px`;
        
        this.outline.style.left = `${this.pos.x}px`;
        this.outline.style.top = `${this.pos.y}px`;
        
        requestAnimationFrame(() => this.animate());
    }
}

// =====================================================
// ANIMATION CONTROLLER
// =====================================================
class AnimationController {
    constructor() {
        this.setupScrollReveal();
        this.setupParallax();
        this.setupHeader();
        this.setupSmoothScroll();
        this.setupCountUp();
        this.setupTiltCards();
    }
    
    setupScrollReveal() {
        const elements = document.querySelectorAll('[data-reveal]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.revealDelay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, parseInt(delay));
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        elements.forEach(el => observer.observe(el));
    }
    
    setupParallax() {
        const mouseParallaxElements = document.querySelectorAll('[data-mouse-parallax]');
        
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            
            mouseParallaxElements.forEach(el => {
                const speed = parseFloat(el.dataset.mouseParallax) || 20;
                el.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });
        });
    }
    
    setupHeader() {
        const header = document.querySelector('.nav');
        if (!header) return;
        
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            if (currentScroll > lastScroll && currentScroll > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });
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
                
                // Close mobile menu
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu?.classList.contains('is-open')) {
                    mobileMenu.classList.remove('is-open');
                    document.body.classList.remove('menu-open');
                }
            });
        });
    }
    
    setupCountUp() {
        const counters = document.querySelectorAll('[data-count]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.count);
                    const duration = 2000;
                    const startTime = performance.now();
                    
                    const updateCount = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeOut = 1 - Math.pow(1 - progress, 4);
                        const current = Math.floor(easeOut * target);
                        
                        entry.target.textContent = current + (entry.target.dataset.suffix || '');
                        
                        if (progress < 1) requestAnimationFrame(updateCount);
                    };
                    
                    requestAnimationFrame(updateCount);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(el => observer.observe(el));
    }
    
    setupTiltCards() {
        if (window.innerWidth < 1024) return;
        
        const cards = document.querySelectorAll('[data-tilt]');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                
                card.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg) translateZ(10px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
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
            if (e.target === this.modal || e.target.closest('.modal__backdrop') || e.target.closest('.modal__close')) {
                this.closeModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
                this.closeModal();
            }
        });
    }
    
    openModal(card) {
        const data = card.dataset;
        const t = translations[currentLang];
        
        document.getElementById('modal-name').textContent = data.name || '';
        document.getElementById('modal-role').textContent = data.role || '';
        document.getElementById('modal-level').textContent = data.level || '';
        document.getElementById('modal-description').textContent = data.description || '';
        document.getElementById('modal-conditions').textContent = data.conditions || '';
        
        // Update titles
        const sections = this.modal.querySelectorAll('.modal__section h4');
        if (sections[0]) sections[0].textContent = t.modalAbout;
        if (sections[1]) sections[1].textContent = t.modalPortfolio;
        if (sections[2]) sections[2].textContent = t.modalConditions;
        
        const contactSpan = this.modal.querySelector('#modal-contact span');
        if (contactSpan) contactSpan.textContent = t.modalContact;
        
        const portfolioContainer = document.getElementById('modal-portfolio');
        if (portfolioContainer && data.portfolio) {
            const items = data.portfolio.split(',');
            portfolioContainer.innerHTML = items.map(item => 
                `<div class="modal__portfolio-item">${item.trim()}</div>`
            ).join('');
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
        
        this.bindEvents();
    }
    
    bindEvents() {
        document.querySelectorAll('.work-card').forEach(card => {
            card.addEventListener('click', () => this.openGallery(card));
        });
        
        this.gallery.addEventListener('click', (e) => {
            if (e.target === this.gallery || 
                e.target.closest('.works-gallery__backdrop') || 
                e.target.closest('.works-gallery__close')) {
                this.closeGallery();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gallery.classList.contains('is-open')) {
                this.closeGallery();
            }
        });
    }
    
    openGallery(card) {
        const title = card.querySelector('.work-card__title')?.textContent || 'Gallery';
        const count = parseInt(card.dataset.count) || 6;
        
        document.getElementById('gallery-title').textContent = title;
        
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            const item = document.createElement('div');
            item.className = 'works-gallery__item';
            item.innerHTML = `<span>${title} #${i}</span>`;
            grid.appendChild(item);
        }
        
        this.gallery.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }
    
    closeGallery() {
        this.gallery.classList.remove('is-open');
        document.body.style.overflow = '';
    }
}

// =====================================================
// MOBILE MENU
// =====================================================
class MobileMenu {
    constructor() {
        this.toggle = document.getElementById('nav-toggle');
        this.menu = document.getElementById('mobile-menu');
        
        if (!this.toggle || !this.menu) return;
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.toggle.addEventListener('click', () => {
            this.menu.classList.toggle('is-open');
            document.body.classList.toggle('menu-open');
        });
        
        this.menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.menu.classList.remove('is-open');
                document.body.classList.remove('menu-open');
            });
        });
    }
}

// =====================================================
// INITIALIZE
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize in order
    new Loader();
    new LanguageSwitcher();
    
    // Wait a bit for loader to show, then init rest
    setTimeout(() => {
        new ParticleSystem();
        new CustomCursor();
        new AnimationController();
        new TeamModal();
        new WorksGallery();
        new MobileMenu();
    }, 100);
});
