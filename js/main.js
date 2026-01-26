/* =====================================================
   TISH TEAM - MAIN JAVASCRIPT
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
        contactLabel: 'Ready to start?',
        contactTitle1: "Let's create",
        contactTitle2: 'something',
        contactTitleAccent: 'incredible',
        contactText: 'Message us on Telegram — the bot will ask a few questions, advise on timing and connect you with the right team member.',
        contactBtnBot: 'Order via Bot',
        contactBtnChat: 'Write to Chat',
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
        contactLabel: 'Готовы начать?',
        contactTitle1: 'Давайте создадим',
        contactTitle2: 'что-то',
        contactTitleAccent: 'невероятное',
        contactText: 'Напишите нам в Telegram — бот задаст пару вопросов, подскажет по срокам и свяжет с нужным человеком из команды.',
        contactBtnBot: 'Заказать через бота',
        contactBtnChat: 'Написать в чат',
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
// LOADER
// =====================================================
class Loader {
    constructor() {
        this.loader = document.getElementById('loader');
        this.progressBar = document.getElementById('loader-bar');
        this.percentText = document.getElementById('loader-percent');
        this.progress = 0;
        
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
                requestAnimationFrame(animate);
            } else {
                this.complete();
            }
        };
        
        requestAnimationFrame(animate);
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
    }
}

// =====================================================
// PARTICLES
// =====================================================
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        
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
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
            this.ctx.fill();
        });
        
        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    const opacity = (1 - distance / 120) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                    this.ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// =====================================================
// CUSTOM CURSOR
// =====================================================
class CustomCursor {
    constructor() {
        if ('ontouchstart' in window || window.innerWidth < 1024) return;
        
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        this.cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-outline"></div>';
        document.body.appendChild(this.cursor);
        
        this.dot = this.cursor.querySelector('.cursor-dot');
        this.outline = this.cursor.querySelector('.cursor-outline');
        
        this.pos = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        
        this.bindEvents();
        this.animate();
    }
    
    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, .team-card, .work-card')) {
                this.cursor.classList.add('is-hovering');
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, .team-card, .work-card')) {
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
// ANIMATIONS
// =====================================================
class AnimationController {
    constructor() {
        this.setupHeader();
        this.setupSmoothScroll();
        this.setupCountUp();
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
            });
        });
    }
    
    setupCountUp() {
        // ИСПРАВЛЕНИЕ: выбираем только цифры в статистике (hero section), а не все элементы с data-count
        const counters = document.querySelectorAll('.hero__stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.count);
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
        
        document.getElementById('modal-name').textContent = data.name || '';
        document.getElementById('modal-role').textContent = data.role || '';
        document.getElementById('modal-level').textContent = data.level || '';
        document.getElementById('modal-description').textContent = data.description || '';
        document.getElementById('modal-conditions').textContent = data.conditions || '';
        
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
            if (e.target === this.gallery || e.target.closest('.works-gallery__backdrop') || e.target.closest('.works-gallery__close')) {
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
        const category = card.dataset.category || 'works';
        const count = parseInt(card.dataset.count) || 6;
        
        const title = card.querySelector('.work-card__title')?.textContent || category;
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
        
        this.toggle.addEventListener('click', () => {
            this.menu.classList.toggle('is-open');
        });
        
        this.menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.menu.classList.remove('is-open');
            });
        });
    }
}

// =====================================================
// INITIALIZE
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    new Loader();
    new LanguageSwitcher();
    new ParticleSystem();
    new CustomCursor();
    new AnimationController();
    new TeamModal();
    new WorksGallery();
    new MobileMenu();
});