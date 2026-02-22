/* =====================================================
   SITE SYNC — Loads data from server, applies to site
   ИСПРАВЛЕННАЯ ВЕРСИЯ
   ===================================================== */

class SiteSync {
    constructor() {
        this.store = new AdminStore();
        this._ready = false;
        this._pollInterval = null;
        this._listenerIds = [];
        this.init();
    }

    async init() {
        // Load from server
        await this.store.ensureLoaded(false);
        this._ready = true;
        this.applyAll();

        // Re-apply when language changes
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(() => this.applyAll(), 100);
            });
        });
        
        // Listen for language change event
        window.addEventListener('languageChange', () => {
            this.applyAll();
        });

        // ИСПРАВЛЕНИЕ #22: Увеличен интервал polling до 60 секунд
        // и добавлена проверка на видимость вкладки
        this._pollInterval = setInterval(() => {
            if (!document.hidden) {
                this.refresh();
            }
        }, 60000); // 60 секунд вместо 30
        
        // Обновляем при возврате на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this._ready) {
                this.refresh();
            }
        });
    }

    async refresh() {
        try {
            const res = await fetch('/api/data');
            if (!res.ok) return;
            const newData = await res.json();
            
            // Restore password from current (it's stripped in /api/data)
            newData.settings.password =
                this.store.data?.settings?.password || '';
            this.store.data = newData;
            this.applyAll();
        } catch {
            // Offline, skip
        }
    }

    applyAll() {
        if (!this._ready || !this.store.data) return;
        this.applyTeam();
        this.applyWorks();
        this.applyHeroStats();
    }

    applyTeam() {
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
        const team = this.store.data.team;
        
        document.querySelectorAll('.team-card').forEach((card, i) => {
            const member = team[i];
            if (!member) return;
            
            const nameEl = card.querySelector('.team-card__name');
            if (nameEl) {
                nameEl.textContent = member.name[lang] || member.name.en;
            }
            
            const roleEl = card.querySelector('.team-card__role');
            if (roleEl) {
                roleEl.textContent = member.role[lang] || member.role.en;
            }
            
            const photoContainer = card.querySelector('.team-card__photo');
            if (photoContainer && member.photo) {
                let img = photoContainer.querySelector('.team-card__photo-img');
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'team-card__photo-img';
                    photoContainer.appendChild(img);
                }
                img.src = member.photo;
                img.alt = member.name[lang] || member.name.en;
                
                const placeholder = photoContainer.querySelector('.team-card__photo-placeholder');
                if (placeholder) placeholder.style.display = 'none';
            }
            
            const statusEl = card.querySelector('.team-card__status');
            if (statusEl && member.status) {
                const map = {
                    online: { text: 'Online', bg: '#22c55e' },
                    busy: { text: 'Busy', bg: '#eab308' },
                    offline: { text: 'Offline', bg: '#ef4444' }
                };
                const s = map[member.status] || map.online;
                statusEl.textContent = s.text;
                statusEl.style.background = s.bg;
            }
            
            const tagsContainer = card.querySelector('.team-card__tags');
            if (tagsContainer && member.tags) {
                tagsContainer.innerHTML = member.tags
                    .map(t => `<span class="team-card__tag">${this.escapeHtml(t)}</span>`)
                    .join('');
            }
            
            // Update data attributes for modal
            card.dataset.name = member.name[lang] || member.name.en;
            card.dataset.role = member.role[lang] || member.role.en;
            card.dataset.level = member.level || '';
            card.dataset.description = member.description[lang] || member.description.en || '';
            card.dataset.conditions = member.conditions[lang] || member.conditions.en || '';
            card.dataset.member = member.id;
        });
    }
    
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    applyWorks() {
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
        const works = this.store.data.works;
        
        document.querySelectorAll('.work-card').forEach((card, i) => {
            const work = works[i];
            if (!work) return;
            
            const titleEl = card.querySelector('.work-card__title');
            if (titleEl) {
                titleEl.textContent = work.title[lang] || work.title.en;
            }
            
            const descEl = card.querySelector('.work-card__desc');
            if (descEl) {
                descEl.textContent = work.description[lang] || work.description.en;
            }
            
            card.dataset.count = (work.photos || []).length || 0;
            card.dataset.category = work.id;
        });
    }

    applyHeroStats() {
        const stats = this.store.data.hero?.stats;
        if (!stats) return;
        
        const statEls = document.querySelectorAll('.hero__stat-number');
        const values = [stats.projects, stats.clients, stats.years];
        
        statEls.forEach((el, i) => {
            if (values[i] !== undefined) {
                el.dataset.count = values[i];
            }
        });
    }

    getStore() {
        return this.store;
    }
    
    // Cleanup
    destroy() {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
        }
        this.store.clearListeners();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.siteSync = new SiteSync();
});