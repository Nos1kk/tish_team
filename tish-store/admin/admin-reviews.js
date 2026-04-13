/* =====================================================
   TISH STORE — Admin Reviews v2.1
   Fixes: ReviewCounts, Storage sync, type mismatch,
          missing init(), double save removed
===================================================== */

const AdminReviews = (() => {

  // ── Init (требуется для admin-main.js) ─────────────
  function init() {
    console.log('[AdminReviews] Module initialized');
    // Можно добавить подписки на события если нужно
  }

  // ── Рендер вкладки ──────────────────────────────────
  async function renderReviewsTab(c) {
    const container = c ||
                      document.getElementById('adminReviewsContent') ||
                      document.querySelector('[data-tab-content="reviews"]');
    if (!container) return;

    // Всегда читаем свежие данные с сервера
    let profile;
    try {
      const res = await fetch('/api/store/reviews');
      const json = await res.json();
      if (json.success) {
        profile = { reviews: json.reviews };
      } else {
        profile = Storage.get('tish_profile') || {};
      }
    } catch(e) {
      profile = Storage.get('tish_profile') || {};
    }
    const reviews = profile.reviews || [];
    const pending  = reviews.filter(r => r.status === 'pending_moderation');
    const approved = reviews.filter(r => !r.status || r.status === 'approved');
    const rejected = reviews.filter(r => r.status === 'rejected');

    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-section__header">
          <h2 class="admin-section__title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Модерация отзывов
          </h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span style="padding:4px 12px;background:rgba(245,158,11,0.1);color:#d97706;border-radius:20px;font-size:0.75rem;font-weight:700;">
              На проверке: ${pending.length}
            </span>
            <span style="padding:4px 12px;background:rgba(34,197,94,0.1);color:#16a34a;border-radius:20px;font-size:0.75rem;font-weight:700;">
              Одобрено: ${approved.length}
            </span>
            <span style="padding:4px 12px;background:rgba(239,68,68,0.1);color:#dc2626;border-radius:20px;font-size:0.75rem;font-weight:700;">
              Отклонено: ${rejected.length}
            </span>
          </div>
        </div>

        ${reviews.length === 0
          ? `<div style="text-align:center;padding:40px;color:var(--color-muted);">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;display:block;opacity:0.3">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p>Отзывов пока нет</p>
            </div>`
          : ''
        }

        ${pending.length > 0 ? `
          <div style="margin-bottom:24px;">
            <h3 style="font-size:0.85rem;font-weight:700;color:#d97706;margin-bottom:12px;">
              ⏳ На проверке (${pending.length})
            </h3>
            ${pending.map(r => renderReviewCard(r)).join('')}
          </div>
        ` : ''}

        ${approved.length > 0 ? `
          <div style="margin-bottom:24px;">
            <h3 style="font-size:0.85rem;font-weight:700;color:#16a34a;margin-bottom:12px;">
              ✅ Одобренные (${approved.length})
            </h3>
            ${approved.map(r => renderReviewCard(r)).join('')}
          </div>
        ` : ''}

        ${rejected.length > 0 ? `
          <div>
            <h3 style="font-size:0.85rem;font-weight:700;color:#dc2626;margin-bottom:12px;">
              ❌ Отклонённые (${rejected.length})
            </h3>
            ${rejected.map(r => renderReviewCard(r)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderReviewCard(review) {
    const stars = '★'.repeat(review.rating || 5) + '☆'.repeat(5 - (review.rating || 5));
    const authorRaw = [review.userName, review.userLogin, review.userEmail]
      .map(v => String(v || '').trim())
      .find(Boolean) || 'Пользователь';
    const safeAuthor = String(authorRaw)
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
    const statusColors = {
      pending_moderation: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#d97706' },
      approved:           { bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.2)',  text: '#16a34a' },
      rejected:           { bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.2)',  text: '#dc2626' }
    };
    const status = review.status || 'approved';
    const sc = statusColors[status] || statusColors.approved;
    const statusLabel = {
      pending_moderation: 'На проверке',
      approved: 'Одобрен',
      rejected: 'Отклонён'
    }[status] || 'Одобрен';
    const safeReviewId = String(review.id || '').replace(/'/g, "\\'");
    const safeProfileKey = String(review.profileKey || '').replace(/'/g, "\\'");

    return `
      <div id="review-card-${review.id}" style="
        background:${sc.bg};
        border:1px solid ${sc.border};
        border-radius:16px;
        padding:16px;
        margin-bottom:12px;
        transition:all 0.3s ease;
      ">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-weight:700;font-size:0.9rem;">${(review.productName || review.product || 'Товар').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
              <span style="color:#f59e0b;font-size:0.9rem;">${stars}</span>
              <span style="font-size:0.75rem;color:var(--color-muted);">${review.rating || 5}/5</span>
            </div>
            <p style="font-size:0.85rem;color:var(--color-text);margin-bottom:8px;line-height:1.5;">${(review.text || '').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}</p>
            <div style="font-size:0.72rem;color:var(--color-muted);display:flex;gap:12px;flex-wrap:wrap;">
              <span>Пользователь: ${safeAuthor}</span>
              <span>Дата: ${review.date || new Date().toLocaleDateString('ru')}</span>
              <span style="color:${sc.text};font-weight:600;">Статус: ${statusLabel}</span>
            </div>
            ${review.rejectReason
              ? `<div style="font-size:0.75rem;color:#dc2626;margin-top:4px;">
                  Причина: ${review.rejectReason}
                  ${review.rejectComment ? ` — ${review.rejectComment}` : ''}
                </div>`
              : ''
            }
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;flex-direction:column;">
            ${status !== 'approved' ? `
              <button
                id="btn-approve-${review.id}"
                onclick="AdminReviews.approveReview('${safeReviewId}','${safeProfileKey}')"
                style="padding:8px 14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:10px;cursor:pointer;font-size:0.78rem;font-weight:700;white-space:nowrap;min-width:100px;"
              >✅ Одобрить</button>
            ` : ''}
            ${status !== 'rejected' ? `
              <button
                id="btn-reject-${review.id}"
                onclick="AdminReviews.openRejectModal('${safeReviewId}','${safeProfileKey}')"
                style="padding:8px 14px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:10px;cursor:pointer;font-size:0.78rem;font-weight:700;white-space:nowrap;min-width:100px;"
              >❌ Отклонить</button>
            ` : ''}
            <button
              onclick="AdminReviews.deleteReview('${safeReviewId}','${safeProfileKey}')"
              style="padding:8px 14px;background:rgba(239,68,68,0.08);color:#ef4444;border:1px solid rgba(239,68,68,0.2);border-radius:10px;cursor:pointer;font-size:0.78rem;font-weight:600;white-space:nowrap;"
            >🗑 Удалить</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Одобрение ───────────────────────────────────────
  async function approveReview(reviewId, profileKey = '') {
    const btn = document.getElementById(`btn-approve-${reviewId}`);
    if (btn) { btn.textContent = 'Сохранение...'; btn.disabled = true; }

    try {
      const res = await fetch(`/api/store/reviews/${encodeURIComponent(reviewId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', profileKey })
      });
      const json = await res.json();

      if (!json.success) {
        App.showToast(json.error || 'Ошибка при одобрении', 'error');
        if (btn) { btn.textContent = '✅ Одобрить'; btn.disabled = false; }
        return;
      }

      // Обновляем локальный кэш, чтобы другие модули видели изменение
      try { await Storage.pullAll(); } catch(e) {}

      if (typeof ReviewCounts !== 'undefined' && typeof ReviewCounts.onReviewStatusChanged === 'function') {
        ReviewCounts.onReviewStatusChanged();
      }

      App.showToast('Отзыв одобрен!', 'success');
      renderReviewsTab();

    } catch(e) {
      console.error('[AdminReviews] approveReview error:', e);
      App.showToast('Ошибка при одобрении', 'error');
      if (btn) { btn.textContent = '✅ Одобрить'; btn.disabled = false; }
    }
  }

  // ── Модалка отклонения ─────────────────────────────
  function openRejectModal(reviewId, profileKey = '') {
    let modal = document.getElementById('rejectReviewModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'rejectReviewModal';
    modal.className = 'profile-modal is-open';
    modal.innerHTML = `
      <div class="profile-modal__backdrop" onclick="this.parentElement.remove();"></div>
      <div class="profile-modal__container" style="max-width:420px;">
        <div class="profile-modal__header">
          <div class="profile-modal__title">Отклонить отзыв</div>
          <button class="profile-modal__close" onclick="this.closest('.profile-modal').remove();">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="profile-modal__body">
          <div class="form-group">
            <label class="form-label">Причина отклонения</label>
            <select class="input" id="rejectReasonSelect">
              <option value="spam">Спам / Реклама</option>
              <option value="inappropriate">Неприемлемый контент</option>
              <option value="fake">Поддельный отзыв</option>
              <option value="offtopic">Не по теме</option>
              <option value="other">Другая причина</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Комментарий (необязательно)</label>
            <textarea class="textarea" id="rejectCommentText" placeholder="Поясните причину..." rows="3"></textarea>
          </div>
        </div>
        <div class="profile-modal__footer">
          <button class="btn btn-secondary btn-sm" onclick="this.closest('.profile-modal').remove();">
            Отмена
          </button>
          <button class="btn btn-sm" style="background:#ef4444;color:white;border:none;"
            onclick="AdminReviews.rejectReview('${reviewId}','${String(profileKey || '').replace(/'/g, "\\'")}')">
            ❌ Отклонить
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // ── Отклонение ──────────────────────────────────────
  async function rejectReview(reviewId, profileKey = '') {
    const reason  = document.getElementById('rejectReasonSelect')?.value || 'other';
    const comment = document.getElementById('rejectCommentText')?.value  || '';
    document.getElementById('rejectReviewModal')?.remove();

    try {
      const res = await fetch(`/api/store/reviews/${encodeURIComponent(reviewId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectReason: reason, rejectComment: comment, profileKey })
      });
      const json = await res.json();

      if (!json.success) {
        App.showToast(json.error || 'Ошибка при отклонении', 'error');
        return;
      }

      // Обновляем локальный кэш
      try { await Storage.pullAll(); } catch(e) {}

      if (typeof ReviewCounts !== 'undefined' && typeof ReviewCounts.onReviewStatusChanged === 'function') {
        ReviewCounts.onReviewStatusChanged();
      }

      App.showToast('Отзыв отклонён', 'info');
      renderReviewsTab();

    } catch(e) {
      console.error('[AdminReviews] rejectReview error:', e);
      App.showToast('Ошибка при отклонении', 'error');
    }
  }

  // ── Удаление ────────────────────────────────────────
  async function deleteReview(reviewId, profileKey = '') {
    if (!confirm('Удалить отзыв навсегда?')) return;

    try {
      const query = profileKey ? ('?profileKey=' + encodeURIComponent(profileKey)) : '';
      const res = await fetch(`/api/store/reviews/${encodeURIComponent(reviewId)}${query}`, {
        method: 'DELETE'
      });
      const json = await res.json();

      if (!json.success) {
        App.showToast(json.error || 'Ошибка удаления', 'error');
        return;
      }

      // Обновляем локальный кэш
      try { await Storage.pullAll(); } catch(e) {}

      if (typeof ReviewCounts !== 'undefined' && typeof ReviewCounts.onReviewStatusChanged === 'function') {
        ReviewCounts.onReviewStatusChanged();
      }

      App.showToast('Отзыв удалён', 'info');
      renderReviewsTab();

    } catch(e) {
      console.error('[AdminReviews] deleteReview error:', e);
      App.showToast('Ошибка удаления', 'error');
    }
  }

  // Register directly (same pattern as other admin modules)
  if (typeof Admin !== 'undefined') {
    Admin.registerTab('reviews', (c) => AdminReviews.renderReviewsTab(c));
  }

  // ── Public API ──────────────────────────────────────
  return {
    init,              // FIX 6: добавлен init()
    renderReviewsTab,
    approveReview,
    openRejectModal,
    rejectReview,
    deleteReview
  };

})();