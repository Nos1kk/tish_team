/* =====================================================
   TISH STORE — Storage v4 (Server-first + Cache + Batch)
   ===================================================== */

const Storage = (() => {
  const SERVER_URL = window.location.origin;
  window._serverUrl = SERVER_URL;

  // ─── Состояние ─────────────────────────────────────
  let serverAvailable = null;
  const CACHE = {};
  let _pendingWrites = {};
  let _syncTimer = null;
  let _initPromise = null;

  // ─── Server Health Check ───────────────────────────
  async function checkServer() {
    if (serverAvailable !== null) return serverAvailable;
    try {
      const res = await fetch(`${SERVER_URL}/api/store/health`, { method: 'GET' });
      serverAvailable = res.ok;
    } catch {
      serverAvailable = false;
    }
    console.log(
      `[Storage] Server: ${serverAvailable ? '🟢 online' : '🔴 offline (localStorage fallback)'}`
    );
    return serverAvailable;
  }

  // ─── Внутренний: отправить накопленные изменения ───
  async function _flushToServer() {
    if (Object.keys(_pendingWrites).length === 0) return;
    if (!(await checkServer())) return;

    const toSend = { ..._pendingWrites };
    _pendingWrites = {};

    // Сначала пробуем bulk-эндпоинт
    try {
      const res = await fetch(`${SERVER_URL}/api/store/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: toSend })
      });
      if (res.ok) return; // успешно — выходим
    } catch {}

    // Fallback: по одному ключу
    for (const [key, value] of Object.entries(toSend)) {
      try {
        await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: value, value })
        });
      } catch (e) {
        // Не получилось — возвращаем в очередь
        _pendingWrites[key] = value;
        console.warn(`[Storage] Flush failed for "${key}"`, e);
      }
    }
  }

  // ─── Планировщик батча ─────────────────────────────
  function _scheduleBatch() {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => _flushToServer(), 300);
  }

  // ═══════════════════════════════════════════════════
  // СИНХРОННЫЙ get() — для обратной совместимости
  // Читает из CACHE → localStorage (без сервера)
  // Используй везде где нужен мгновенный результат
  // ═══════════════════════════════════════════════════
  function get(key, fallback = null) {
    // 1. Кэш (самый быстрый)
    if (CACHE[key] !== undefined) return CACHE[key];

    // 2. localStorage
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const val = JSON.parse(raw);
        CACHE[key] = val;
        return val;
      }
    } catch {}

    return fallback;
  }

  // ═══════════════════════════════════════════════════
  // ASYNC getAsync() — с проверкой сервера
  // Используй когда нужны свежие данные с сервера
  // ═══════════════════════════════════════════════════
  async function getAsync(key, fallback = null) {
    // Сначала отдаём локальное значение пока тянем с сервера
    const local = get(key, fallback);

    if (await checkServer()) {
      try {
        const res = await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`);
        const json = await res.json();

        // Поддержка обоих форматов: { data } и { value }
        const serverData = json.data !== undefined ? json.data : json.value;

        if (json.success && serverData !== null && serverData !== undefined) {
          // Обновляем кэш и localStorage
          CACHE[key] = serverData;
          try {
            localStorage.setItem(key, JSON.stringify(serverData));
          } catch {}
          return serverData;
        }
      } catch (e) {
        console.warn(`[Storage] getAsync failed for "${key}"`, e);
      }
    }

    return local;
  }

  // ═══════════════════════════════════════════════════
  // set() — синхронный в кэш + localStorage,
  //          асинхронный батч на сервер
  // ═══════════════════════════════════════════════════
  function set(key, value) {
    // 1. Кэш — мгновенно
    CACHE[key] = value;

    // 2. localStorage — мгновенно
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Storage] localStorage.setItem failed for "${key}"`, e);
    }

    // 3. Сервер — батчем через 300мс
    _pendingWrites[key] = value;

    // Mirror active profile into per-user key so admin sees all users historically
    if (key === 'tish_profile' && value && typeof value === 'object' && value.googleId) {
      const userKey = 'tish_profile_' + value.googleId;
      CACHE[userKey] = value;
      try {
        localStorage.setItem(userKey, JSON.stringify(value));
      } catch {}
      _pendingWrites[userKey] = value;
    }

    _scheduleBatch();
  }

  // ═══════════════════════════════════════════════════
  // remove() — удаляет из кэша, localStorage и сервера
  // ═══════════════════════════════════════════════════
  function remove(key) {
    delete CACHE[key];
    delete _pendingWrites[key];

    try {
      localStorage.removeItem(key);
    } catch {}

    // Удаляем с сервера асинхронно
    checkServer().then(online => {
      if (!online) return;
      fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      }).catch(() => {});
    });
  }

  // ─── Domain Shortcuts ──────────────────────────────
  // Синхронные (быстрые) версии
  function getProfile()           { return get('tish_profile', {}); }
  function setProfile(data)       { return set('tish_profile', data); }

  function getOrders()            { return get('tish_orders', []); }
  function setOrders(data)        { return set('tish_orders', data); }

  function getProducts()          { return get('tish_admin_products', []); }
  function setProducts(data)      { return set('tish_admin_products', data); }

  // Чаты — синхронные
  function getChat(chatId)        { return get('chat_' + chatId, []); }
  function setChat(chatId, data)  { return set('chat_' + chatId, data); }

  // Async-версии для критичных данных
  async function getProfileAsync()    { return getAsync('tish_profile', {}); }
  async function getOrdersAsync()     { return getAsync('tish_orders', []); }
  async function getProductsAsync()   { return getAsync('tish_admin_products', []); }

  // ─── Bulk: Pull All from Server ────────────────────
  async function pullAll() {
    if (!(await checkServer())) {
      console.warn('[Storage] pullAll skipped — server offline');
      return false;
    }

    // Важно: не используем bulk GET /api/store/sync на старте.
    // Он может вернуть большие chat_* payload (base64 вложения) и повесить вкладку.
    // Вместо этого тянем только необходимые ключи по одному.
    const keys = [
      'tish_profile', 'tish_orders',
      'tish_admin_products', 'tish_review_counts',
      'tish_tishara_shop_products',
      'tish_pinned_chats',
      'tish_admin_notifications', 'tish_admin_presence',
      'tish_archived_chats'
    ];
    let pulled = 0;

    for (const key of keys) {
      try {
        const res = await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`);
        const json = await res.json();
        const serverData = json.data !== undefined ? json.data : json.value;

        if (json.success && serverData !== null && serverData !== undefined) {
          CACHE[key] = serverData;
          try {
            localStorage.setItem(key, JSON.stringify(serverData));
          } catch {}
          pulled++;
        }
      } catch {}
    }

    console.log(`[Storage] pullAll: ${pulled}/${keys.length} keys loaded`);
    return true;
  }

  // ─── Bulk: Push All to Server ──────────────────────
  async function syncAll() {
    if (!(await checkServer())) {
      console.warn('[Storage] syncAll skipped — server offline');
      return false;
    }

    const keys = _collectAllKeys();
    let synced = 0;

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: parsed, value: parsed })
          });
          synced++;
        }
      } catch {}
    }

    console.log(`[Storage] syncAll: ${synced}/${keys.length} keys pushed to server`);
    return true;
  }

  // ─── Принудительная синхронизация ─────────────────
  async function forceSync() {
    clearTimeout(_syncTimer);
    await _flushToServer();
  }

  // ─── Немедленная запись одного ключа на сервер ────
  async function setNow(key, value) {
    // 1. Cache + localStorage мгновенно
    CACHE[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    // Убираем из батча (мы запишем сами)
    delete _pendingWrites[key];
    // 2. Прямой POST на сервер (без батча)
    if (!(await checkServer())) return false;
    try {
      const res = await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });

      if (res.ok && key === 'tish_profile' && value && typeof value === 'object' && value.googleId) {
        const userKey = 'tish_profile_' + value.googleId;
        CACHE[userKey] = value;
        try { localStorage.setItem(userKey, JSON.stringify(value)); } catch {}
        await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(userKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
      }

      return res.ok;
    } catch (e) {
      console.warn(`[Storage] setNow failed for "${key}"`, e);
      // Fallback: добавляем обратно в батч
      _pendingWrites[key] = value;
      _scheduleBatch();
      return false;
    }
  }

  // ─── Init ──────────────────────────────────────────
  async function init() {
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      await checkServer();
      if (serverAvailable) {
        await pullAll();
      }
      console.log('[Storage] Initialized');
      return true;
    })();

    return _initPromise;
  }

  // ─── Helpers ───────────────────────────────────────
  function _collectAllKeys() {
    const baseKeys = [
      'tish_profile', 'tish_orders',
      'tish_admin_products', 'tish_review_counts',
      'tish_pinned_chats'
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !baseKeys.includes(k)) {
        if (k.startsWith('chat_') || k.startsWith('tish_')) {
          baseKeys.push(k);
        }
      }
    }

    return baseKeys;
  }

  // Автозапуск при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  } else {
    setTimeout(init, 300);
  }

  // Сохраняем при закрытии страницы
  window.addEventListener('beforeunload', () => {
    forceSync();
  });

  // ─── Public API ────────────────────────────────────
  return {
    // Core (синхронный — основной для совместимости)
    get,
    set,
    remove,

    // Core async (для критичных данных)
    getAsync,

    // Domain shortcuts (синхронные)
    getProfile, setProfile,
    getOrders,  setOrders,
    getProducts, setProducts,
    getChat,    setChat,

    // Domain shortcuts (async)
    getProfileAsync,
    getOrdersAsync,
    getProductsAsync,

    // Bulk
    syncAll,
    pullAll,
    forceSync,
    setNow,
    init,
    checkServer
  };
})();