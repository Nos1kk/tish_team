/* =====================================================
   SITE SYNC — Applies admin data to the live site
   ===================================================== */

class SiteSync {
    constructor() {
        this.store = new AdminStore();
        this.store.listenCrossTabs();
        this.store.onChange(() => this.applyAll());
        this.applyAll();
    }

    applyAll() {
        this.applyTeam();
        this.applyWorks();
        this.applyHeroStats();
    }

    // === Команда ===
    applyTeam() {
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
        const team = this.store.data.team;

        document.querySelectorAll('.team-card').forEach((card, i) => {
            const member = team[i];
            if (!member) return;

            const nameEl = card.querySelector('.team-card__name');
            if (nameEl) nameEl.textContent = member.name[lang] || member.name.en;

            const roleEl = card.querySelector('.team-card__role');
            if (roleEl) roleEl.textContent = member.role[lang] || member.role.en;

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
                const statusMap = {
                    online: { text: 'Online', bg: '#22c55e' },
                    busy: { text: 'Busy', bg: '#eab308' },
                    offline: { text: 'Offline', bg: '#ef4444' }
                };
                const s = statusMap[member.status] || statusMap.online;
                statusEl.textContent = s.text;
                statusEl.style.background = s.bg;
            }

            const tagsContainer = card.querySelector('.team-card__tags');
            if (tagsContainer && member.tags) {
                tagsContainer.innerHTML = member.tags
                    .map(t => `<span class="team-card__tag">${t}</span>`)
                    .join('');
            }

            card.dataset.name = member.name[lang] || member.name.en;
            card.dataset.role = member.role[lang] || member.role.en;
            card.dataset.level = member.level || '';
            card.dataset.description = member.description[lang] || member.description.en || '';
            card.dataset.conditions = member.conditions[lang] || member.conditions.en || '';
            card.dataset.portfolio = (member.portfolio || []).join(',');
        });
    }

    // === Работы ===
    applyWorks() {
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
        const works = this.store.data.works;

        document.querySelectorAll('.work-card').forEach((card, i) => {
            const work = works[i];
            if (!work) return;

            const titleEl = card.querySelector('.work-card__title');
            if (titleEl) titleEl.textContent = work.title[lang] || work.title.en;

            const descEl = card.querySelector('.work-card__desc');
            if (descEl) descEl.textContent = work.description[lang] || work.description.en;

            card.dataset.count = (work.photos || []).length || 0;
            card.dataset.category = work.id;
        });
    }

    // === Статистика ===
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

    // Доступ к store для gallery
    getStore() {
        return this.store;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.siteSync = new SiteSync();
});