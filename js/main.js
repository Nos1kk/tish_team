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
        const store = window.siteSync?.getStore();
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';

        // Basic info
        document.getElementById('modal-name').textContent = data.name || '';
        document.getElementById('modal-role').textContent = data.role || '';
        document.getElementById('modal-level').textContent = data.level || '';
        document.getElementById('modal-description').textContent = data.description || '';
        document.getElementById('modal-conditions').textContent = data.conditions || '';

        // Photo in modal
        const modalPhoto = this.modal.querySelector('.modal__photo');
        if (modalPhoto && store) {
            const member = store.data.team.find(m =>
                m.name.en === data.name || m.name.ru === data.name
            );
            if (member?.photo) {
                modalPhoto.innerHTML = `<img src="${member.photo}" alt="${data.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else {
                modalPhoto.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            }
        }

        // Portfolio items
        const portfolioContainer = document.getElementById('modal-portfolio');
        if (portfolioContainer && data.portfolio) {
            const items = data.portfolio.split(',');
            portfolioContainer.innerHTML = items.map(item =>
                `<div class="modal__portfolio-item">${item.trim()}</div>`
            ).join('');
        }

        // Member works — real photos
        const worksContainer = document.getElementById('modal-member-works');
        if (worksContainer && store) {
            const member = store.data.team.find(m =>
                m.name.en === data.name || m.name.ru === data.name
            );

            if (member) {
                let worksHtml = '';
                store.data.works.forEach(category => {
                    const memberPhotos = (category.photos || []).filter(p => p.author === member.id);
                    memberPhotos.forEach(photo => {
                        const catName = category.title[lang] || category.title.en;
                        worksHtml += `
                            <div class="modal__work-item" onclick="worksGalleryInstance?.openMemberWork('${category.id}', '${photo.url}')">
                                <img src="${photo.url}" alt="${photo.name || ''}">
                                <div class="modal__work-item-info">
                                    <span class="modal__work-item-name">${photo.name || ''}</span>
                                    <span class="modal__work-item-cat">${catName}</span>
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
                    worksContainer.parentElement.style.display = '';
                }
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

    bindEvents() {
        document.querySelectorAll('.work-card').forEach(card => {
            card.addEventListener('click', () => this.openGallery(card));
        });

        this.gallery.addEventListener('click', e => {
            if (e.target === this.gallery || e.target.closest('.works-gallery__backdrop') || e.target.closest('.works-gallery__close')) {
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
        if (!store) return;

        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
        const work = store.data.works.find(w => w.id === category);
        const title = work?.title[lang] || work?.title.en || category;

        document.getElementById('gallery-title').textContent = title;
        this.currentCategoryName = title;

        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';

        if (!work || !work.photos || work.photos.length === 0) {
            grid.innerHTML = `<div class="works-gallery__empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Пока нет работ</p>
            </div>`;
            this.currentPhotos = [];
        } else {
            this.currentPhotos = work.photos;
            work.photos.forEach((photo, index) => {
                const authorName = photo.author ? store.getAuthorName(photo.author, lang) : '';
                const item = document.createElement('div');
                item.className = `works-gallery__item works-gallery__item--${photo.format || 'auto'}`;
                item.innerHTML = `
                    <img src="${photo.url}" alt="${photo.name || ''}" loading="lazy">
                    <div class="works-gallery__item-info">
                        <span class="works-gallery__item-name">${photo.name || ''}</span>
                        ${authorName ? `<span class="works-gallery__item-author">by ${authorName}</span>` : ''}
                    </div>
                `;
                item.addEventListener('click', () => this.openLightbox(index));
                grid.appendChild(item);
            });
        }

        this.gallery.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    // Open from member modal
    openMemberWork(categoryId, photoUrl) {
        const store = window.siteSync?.getStore();
        if (!store) return;

        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
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

    renderLightbox() {
        const old = document.getElementById('photo-lightbox');
        if (old) old.remove();

        const photo = this.currentPhotos[this.currentIndex];
        if (!photo) return;

        const store = window.siteSync?.getStore();
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
        const authorName = photo.author && store ? store.getAuthorName(photo.author, lang) : '';
        const total = this.currentPhotos.length;
        const current = this.currentIndex + 1;

        const lb = document.createElement('div');
        lb.id = 'photo-lightbox';
        lb.className = 'photo-lightbox is-open';

        lb.innerHTML = `
            <div class="photo-lightbox__backdrop"></div>
            <div class="photo-lightbox__container">
                <button class="photo-lightbox__close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>

                ${this.currentIndex > 0 ? `<button class="photo-lightbox__arrow photo-lightbox__arrow--prev" id="lb-prev">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>` : ''}

                ${this.currentIndex < total - 1 ? `<button class="photo-lightbox__arrow photo-lightbox__arrow--next" id="lb-next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>` : ''}

                <div class="photo-lightbox__image-wrap">
                    <img src="${photo.url}" alt="${photo.name || ''}" class="photo-lightbox__image">
                </div>

                <div class="photo-lightbox__details">
                    <div class="photo-lightbox__header">
                        <div>
                            <h3 class="photo-lightbox__title">${photo.name || 'Без названия'}</h3>
                            <span class="photo-lightbox__counter">${current} / ${total}</span>
                        </div>
                        <span class="photo-lightbox__category">${this.currentCategoryName}</span>
                    </div>
                    ${photo.description ? `<p class="photo-lightbox__description">${photo.description}</p>` : ''}
                    <div class="photo-lightbox__meta">
                        ${authorName ? `<div class="photo-lightbox__meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <span>${authorName}</span>
                        </div>` : ''}
                        ${photo.date ? `<div class="photo-lightbox__meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>${new Date(photo.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(lb);

        lb.querySelector('.photo-lightbox__backdrop').addEventListener('click', () => this.closeLightbox());
        lb.querySelector('.photo-lightbox__close').addEventListener('click', () => this.closeLightbox());
        document.getElementById('lb-prev')?.addEventListener('click', () => this.prevPhoto());
        document.getElementById('lb-next')?.addEventListener('click', () => this.nextPhoto());

        // Swipe
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
    window.worksGalleryInstance = new WorksGallery();
    new MobileMenu();
});