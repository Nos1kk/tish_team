/* =====================================================
   TISH STORE — Review Counts Sync
   Обновляет счётчик отзывов и рейтинг под товарами
===================================================== */

const ReviewCounts = (() => {

  const OBSERVER_CONFIG = { childList: true, subtree: true };
  let domObserver = null;
  let observerFrame = 0;

  function readJsonSafe(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch(e) {
      return fallback;
    }
  }

  // Получить счётчики с сервера
  async function fetchCounts() {
    try {
      const res = await fetch('/api/store/review-counts');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.counts && typeof json.counts === 'object') {
          localStorage.setItem('tish_review_counts', JSON.stringify(json.counts));
          return json.counts;
        }
      }
    } catch(e) {}
    // Fallback к localStorage
    return readJsonSafe('tish_review_counts', {});
  }

  // Локальный fallback-пересчёт (сервер остаётся источником истины)
  function recalculate() {
    const profile = readJsonSafe('tish_profile', {});
    const reviews = Array.isArray(profile.reviews) ? profile.reviews : [];
    const visibleReviews = reviews.filter(r => r && (!r.status || r.status === 'approved'));

    const counts = {};
    visibleReviews.forEach(r => {
      const keys = Array.from(new Set([
        String(r.productId || ''),
        String(r.product || ''),
        String(r.orderId || '')
      ])).filter(k => k && k !== 'NaN' && k !== 'undefined' && k !== '');

      keys.forEach(key => {
        if (!counts[key]) counts[key] = { count: 0, totalRating: 0, ratings: [] };
        counts[key].count++;
        counts[key].totalRating += (r.rating || 5);
        counts[key].ratings.push(r.rating || 5);
      });
    });

    Object.values(counts).forEach(data => {
      data.avgRating = data.count > 0 ? (data.totalRating / data.count).toFixed(1) : '5.0';
    });

    localStorage.setItem('tish_review_counts', JSON.stringify(counts));

    return counts;
  }

  // Применить счётчики к DOM элементам карточек товаров
  function applyCounts(counts) {
    if (!counts) return;

    const apply = () => {
      // Обновляем все карточки товаров в каталоге
      document.querySelectorAll('[data-product-id]').forEach(card => {
        const productId = String(card.dataset.productId || '');
        const title = (card.querySelector('.product-card__title')?.textContent || '').trim();
        const data = counts[productId] || counts[title] || null;

        const ratingEl = card.querySelector('[data-review-rating]');
        const countEl = card.querySelector('[data-review-count]');
        const starsEl = card.querySelector('[data-review-stars]');
        const catalogRating = card.querySelector('.c3-rat');

        if (data && data.count > 0) {
          if (ratingEl) ratingEl.textContent = data.avgRating;
          if (countEl) countEl.textContent = data.count;
          if (starsEl) {
            starsEl.style.display = '';
            renderStars(starsEl, parseFloat(data.avgRating));
          }

          // Catalog v3 uses .c3-rat with two spans: [rating, (count)].
          if (catalogRating) {
            const spans = catalogRating.querySelectorAll('span');
            if (spans[0]) spans[0].textContent = String(data.avgRating);
            if (spans[1]) spans[1].textContent = `(${data.count})`;
          }

          // Показываем блок с рейтингом
          const ratingBlock = card.querySelector('.product-rating, [data-rating-block]');
          if (ratingBlock) ratingBlock.style.display = '';
        } else {
          if (ratingEl) ratingEl.textContent = '5.0';
          if (countEl) countEl.textContent = '0';
          if (catalogRating) {
            const spans = catalogRating.querySelectorAll('span');
            if (spans[0]) spans[0].textContent = '5';
            if (spans[1]) spans[1].textContent = '(0)';
          }
        }
      });
    };

    // Guard against observer feedback loop (observer -> applyCounts -> DOM mutation -> observer)
    if (domObserver) {
      domObserver.disconnect();
      try {
        apply();
      } finally {
        domObserver.observe(document.body, OBSERVER_CONFIG);
      }
      return;
    }

    apply();
  }

  function renderStars(container, rating) {
    const stars = Math.round(rating);
    container.innerHTML = Array.from({length: 5}, (_, i) =>
      `<svg viewBox="0 0 24 24" width="12" height="12" style="fill:${i < stars ? '#f59e0b' : 'none'};stroke:#f59e0b;stroke-width:2;">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`
    ).join('');
  }

  // Инициализация — загрузка и применение
  async function init() {
    const counts = await fetchCounts();
    applyCounts(counts);

    if (domObserver) return;

    // Наблюдаем за изменениями DOM (для динамически добавляемых карточек)
    domObserver = new MutationObserver(() => {
      if (observerFrame) return;
      observerFrame = requestAnimationFrame(() => {
        observerFrame = 0;
        const localCounts = readJsonSafe('tish_review_counts', {});
        applyCounts(localCounts);
      });
    });
    domObserver.observe(document.body, OBSERVER_CONFIG);
  }

  // Вызывается после одобрения/отклонения отзыва
  function onReviewStatusChanged() {
    // Локальный fallback для мгновенного UI, затем authoritative данные с сервера.
    const localCounts = recalculate();
    applyCounts(localCounts);

    if (typeof Catalog !== 'undefined' && typeof Catalog.renderCatalog === 'function') {
      Catalog.renderCatalog();
    }

    fetchCounts().then((serverCounts) => {
      applyCounts(serverCounts);
      if (typeof Catalog !== 'undefined' && typeof Catalog.renderCatalog === 'function') {
        Catalog.renderCatalog();
      }
    }).catch(() => {});
  }

  return { init, fetchCounts, recalculate, applyCounts, onReviewStatusChanged };
})();

// Автозапуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ReviewCounts.init());
} else {
  ReviewCounts.init();
}