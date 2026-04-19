class SiteSync {
    constructor() {
        this.store = new AdminStore();
        this._ready = false;
        this._eventSource = null;
        this.init();
    }

    async init() {
        await this.store.ensureLoaded(false);
        this._ready = true;
        this.applyAll();

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setTimeout(() => this.applyAll(), 100));
        });
        window.addEventListener('languageChange', () => this.applyAll());

        // SSE — мгновенная синхронизация
        this.connectSSE();

        // Fallback polling + обновление при возврате на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this._ready) this.refresh();
        });
    }

    connectSSE() {
        try {
            // Генерируем уникальный sessionId для этого посетителя
            let sessionId = sessionStorage.getItem('tish_visitor_id');
            if (!sessionId) {
                sessionId = 'site_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
                sessionStorage.setItem('tish_visitor_id', sessionId);
            }

            this._eventSource = new EventSource(`/api/sse?sessionId=${encodeURIComponent(sessionId)}`);
            this._eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'update') {
                        this.refresh();
                    }
                } catch {}
            };
            this._eventSource.onerror = () => {
                setTimeout(() => {
                    if (this._eventSource) {
                        this._eventSource.close();
                        this.connectSSE();
                    }
                }, 5000);
            };
        } catch {
            setInterval(() => {
                if (!document.hidden) this.refresh();
            }, 30000);
        }
    }

    async refresh() {
        try {
            const res = await fetch('/api/data');
            if (!res.ok) return;
            const newData = await res.json();
            newData.settings = newData.settings || {};
            newData.settings.password = this.store.data?.settings?.password || '';
            this.store.data = newData;
            this.applyAll();
        } catch {}
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

        const grid = document.querySelector('.team__grid');
        if (!grid) return;

        // Если количество карточек не совпадает — пересоздаём
        const cards = grid.querySelectorAll('.team-card');
        if (cards.length !== team.length) {
            grid.innerHTML = team.map(m => this._createTeamCardHTML(m, lang)).join('');
            // Перебиндим клики для модалки
            if (window.teamModalInstance) {
                grid.querySelectorAll('.team-card').forEach(card => {
                    card.addEventListener('click', () => window.teamModalInstance.openModal(card));
                });
            }
            return;
        }

        cards.forEach((card, i) => {
            const member = team[i];
            if (!member) return;
            this._updateTeamCard(card, member, lang);
        });
    }

    _createTeamCardHTML(member, lang) {
        const name = member.name[lang] || member.name.en;
        const role = member.role[lang] || member.role.en;
        const desc = member.description?.[lang] || member.description?.en || '';
        const cond = member.conditions?.[lang] || member.conditions?.en || '';
        const tags = (member.tags || []).map(t => `<span class="team-card__tag">${this._esc(t)}</span>`).join('');
        const statusMap = { online: ['Online', '#22c55e'], busy: ['Busy', '#eab308'], offline: ['Offline', '#ef4444'] };
        const [statusText, statusColor] = statusMap[member.status] || statusMap.online;
        const photoHTML = member.photo
            ? `<img class="team-card__photo-img" src="${this._esc(member.photo)}" alt="${this._esc(name)}">`
            : `<div class="team-card__photo-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

        return `<article class="team-card reveal-up" data-member="${this._esc(member.id)}" data-name="${this._esc(name)}" data-role="${this._esc(role)}" data-level="${this._esc(member.level || '')}" data-description="${this._esc(desc)}" data-conditions="${this._esc(cond)}">
            <div class="team-card__inner"><div class="team-card__glow"></div>
            <div class="team-card__photo"><div class="team-card__photo-bg"></div>${photoHTML}
            <div class="team-card__status" style="background:${statusColor}">${statusText}</div></div>
            <div class="team-card__info"><h3 class="team-card__name">${this._esc(name)}</h3>
            <p class="team-card__role">${this._esc(role)}</p>
            <div class="team-card__tags">${tags}</div></div>
                <div class="team-card__overlay"><button type="button" class="team-card__cta">${lang === 'ru' ? 'Смотреть портфолио' : 'View Portfolio'}</button></div>
            </div></article>`;
    }

    _updateTeamCard(card, member, lang) {
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
            const placeholder = photoContainer.querySelector('.team-card__photo-placeholder');
            if (placeholder) placeholder.style.display = 'none';
        }

        const statusEl = card.querySelector('.team-card__status');
        if (statusEl && member.status) {
            const map = { online: ['Online', '#22c55e'], busy: ['Busy', '#eab308'], offline: ['Offline', '#ef4444'] };
            const [text, bg] = map[member.status] || map.online;
            statusEl.textContent = text;
            statusEl.style.background = bg;
        }

        const tagsContainer = card.querySelector('.team-card__tags');
        if (tagsContainer && member.tags) {
            tagsContainer.innerHTML = member.tags.map(t => `<span class="team-card__tag">${this._esc(t)}</span>`).join('');
        }

        card.dataset.name = member.name[lang] || member.name.en;
        card.dataset.role = member.role[lang] || member.role.en;
        card.dataset.level = member.level || '';
        card.dataset.description = member.description?.[lang] || member.description?.en || '';
        card.dataset.conditions = member.conditions?.[lang] || member.conditions?.en || '';
        card.dataset.member = member.id;
    }

    _esc(str) {
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
            if (titleEl) titleEl.textContent = work.title[lang] || work.title.en;
            const descEl = card.querySelector('.work-card__desc');
            if (descEl) descEl.textContent = work.description[lang] || work.description.en;
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
            if (values[i] !== undefined) el.dataset.count = values[i];
        });
    }

    getStore() { return this.store; }

    destroy() {
        if (this._eventSource) { this._eventSource.close(); this._eventSource = null; }
        this.store.clearListeners();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.siteSync = new SiteSync();
});