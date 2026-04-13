/* =====================================================
   ADMIN — Dashboard Module
   ===================================================== */

((Admin) => {
    function renderDashboard(c) {
        const orders = Admin.getOrders();
        const products = Admin.getProducts();
        const log = Admin.getAdminLog();
        let usersCount = 0;
        try {
            const users = JSON.parse(localStorage.getItem('tish_admin_users_cache') || '[]');
            usersCount = Array.isArray(users) ? users.length : 0;
        } catch {}
        const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.price || 0), 0);
        const activeOrders = orders.filter(o => !['completed', 'pending_prepayment'].includes(o.status)).length;

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => o.createdAt?.startsWith(ds));
            const rev = dayOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.price || 0), 0);
            days.push({ label: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()], orders: dayOrders.length, revenue: rev });
        }
        const maxRev = Math.max(...days.map(d => d.revenue), 1);
        const maxOrd = Math.max(...days.map(d => d.orders), 1);
        const topProducts = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
        const getTopProductPreview = (product) => {
            if (product && Array.isArray(product.media)) {
                const firstImage = product.media.find((m) => m && m.type === 'image' && m.url);
                if (firstImage) {
                    return `<div class="admin-product-cell__preview" style="width:36px;height:28px;border-radius:6px;"><img src="${String(firstImage.url).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}" alt="${String(product.title || 'Товар').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}" loading="lazy"></div>`;
                }
            }
            return `<div class="admin-product-cell__preview" style="background:${product.gradient};width:36px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;">${Admin.ic('<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>')}</div>`;
        };

        c.innerHTML = `
            <div class="admin-stats">
                ${[
                    { cls: 'revenue', val: '$' + totalRevenue.toLocaleString(), label: 'Доход', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
                    { cls: 'users', val: String(usersCount), label: 'Пользователей', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
                    { cls: 'orders', val: orders.length + '', label: `Заказов (${activeOrders} акт.)`, icon: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>' },
                    { cls: 'products', val: products.length + '', label: 'Товаров', icon: '<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>' }
                ].map(s => `
                    <div class="admin-stat-card admin-stat-card--${s.cls}">
                        <div class="admin-stat-card__header"><div class="admin-stat-card__icon">${Admin.ic(s.icon)}</div></div>
                        <div class="admin-stat-card__value">${s.val}</div>
                        <div class="admin-stat-card__label">${s.label}</div>
                    </div>`).join('')}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
                <div class="admin-card">
                    <div class="admin-card__header"><h3 class="admin-card__title">📊 Доход за неделю</h3></div>
                    <div class="admin-chart">${days.map(d => `
                        <div class="admin-chart__bar-group">
                            <div class="admin-chart__bar" style="height:${d.revenue / maxRev * 100}%;background:linear-gradient(180deg,var(--purple-500),var(--magenta-500));"></div>
                            <div class="admin-chart__label">${d.label}</div>
                            <div class="admin-chart__value">$${d.revenue}</div>
                        </div>`).join('')}</div>
                </div>
                <div class="admin-card">
                    <div class="admin-card__header"><h3 class="admin-card__title">📦 Заказы за неделю</h3></div>
                    <div class="admin-chart">${days.map(d => `
                        <div class="admin-chart__bar-group">
                            <div class="admin-chart__bar" style="height:${d.orders / maxOrd * 100}%;background:linear-gradient(180deg,#22c55e,#10b981);"></div>
                            <div class="admin-chart__label">${d.label}</div>
                            <div class="admin-chart__value">${d.orders}</div>
                        </div>`).join('')}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                <div class="admin-card">
                    <div class="admin-card__header"><h3 class="admin-card__title">🔥 Топ товары</h3></div>
                    <div class="admin-list">${topProducts.length === 0 ? '<p class="admin-empty-text">Нет данных</p>' :
                        topProducts.map((p, i) => `
                            <div class="admin-list__item">
                                <span class="admin-list__rank">${i + 1}</span>
                                ${getTopProductPreview(p)}
                                <div style="flex:1;"><div style="font-weight:700;font-size:0.85rem;">${p.title}</div><div style="font-size:0.72rem;color:var(--color-muted);">${p.sales || 0} продаж</div></div>
                                <strong>$${p.price}</strong>
                            </div>`).join('')}</div>
                </div>
                <div class="admin-card">
                    <div class="admin-card__header"><h3 class="admin-card__title">📋 Последние действия</h3></div>
                    <div class="admin-list">${log.length === 0 ? '<p class="admin-empty-text">Нет действий</p>' :
                        log.slice(0, 8).map(l => `
                            <div class="admin-list__item" style="padding:10px 0;">
                                <div style="flex:1;"><div style="font-size:0.82rem;font-weight:600;">${l.action}</div>
                                ${l.details ? `<div style="font-size:0.72rem;color:var(--color-muted);">${l.details}</div>` : ''}</div>
                                <div style="font-size:0.7rem;color:var(--color-muted);white-space:nowrap;">${Admin.fmtDateTime(l.date)}</div>
                            </div>`).join('')}</div>
                </div>
            </div>`;
    }

    Admin.registerTab('dashboard', renderDashboard);
})(Admin);