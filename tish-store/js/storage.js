/* =====================================================
   TISH STORE — Storage v5 (Server-first, no localStorage persistence)
   ===================================================== */

const Storage = (() => {
  const SERVER_URL = window.location.origin;
  window._serverUrl = SERVER_URL;

  const CACHE = Object.create(null);
  const RAW = Object.create(null);
  const LEGACY = {
    getItem: localStorage.getItem.bind(localStorage),
    setItem: localStorage.setItem.bind(localStorage),
    removeItem: localStorage.removeItem.bind(localStorage),
    key: localStorage.key.bind(localStorage),
    get length() { return localStorage.length; }
  };

  let serverAvailable = null;
  let _pendingWrites = {};
  let _syncTimer = null;
  let _initPromise = null;
  let _bridgeInstalled = false;

  const BOOTSTRAP_KEYS = [
    'tish_profile',
    'tish_orders',
    'tish_admin_products',
    'tish_review_counts',
    'tish_tishara_shop_products',
    'tish_pinned_chats',
    'tish_admin_notifications',
    'tish_admin_presence',
    'tish_archived_chats'
  ];

  function _isManagedKey(key) {
    return String(key || '').length > 0;
  }

  function _isServerSyncKey(key) {
    const k = String(key || '');
    if (k.startsWith('chat_')) return true;
    if (k.startsWith('tish_profile_')) return true;

    return [
      'tish_profile',
      'tish_orders',
      'tish_admin_products',
      'tish_review_counts',
      'tish_tishara_shop_products',
      'tish_pinned_chats',
      'tish_admin_notifications',
      'tish_admin_presence',
      'tish_archived_chats',
      'tish_notifications',
      'tish_cart',
      'tish_subscription',
      'tish_favorites',
      'tish_admin_log',
      'tish_admin_notifs',
      'tish_admin_nfts',
      'tish_admin_collections',
      'tish_admin_cases',
      'tish_analytics_events'
    ].includes(k);
  }

  function _serialize(value) {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch { return null; }
  }

  function _parse(raw) {
    if (raw == null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }

  function _setRawCache(key, raw) {
    const k = String(key || '');
    if (!k) return;
    RAW[k] = raw;
    CACHE[k] = _parse(raw);
  }

  function _setValueCache(key, value) {
    const k = String(key || '');
    if (!k) return;
    CACHE[k] = value;
    const raw = _serialize(value);
    if (raw !== null) RAW[k] = raw;
  }

  function _scheduleBatch() {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => _flushToServer(), 300);
  }

  async function checkServer(force = false) {
    if (!force && serverAvailable !== null) return serverAvailable;
    try {
      const res = await fetch(`${SERVER_URL}/api/store/health`, { method: 'GET' });
      serverAvailable = res.ok;
    } catch {
      serverAvailable = false;
    }
    return serverAvailable;
  }

  async function _flushToServer() {
    if (Object.keys(_pendingWrites).length === 0) return;
    if (!(await checkServer(true))) return;

    const toSend = { ..._pendingWrites };
    _pendingWrites = {};

    try {
      const res = await fetch(`${SERVER_URL}/api/store/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: toSend })
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const denied = Number(json?.denied || 0);
        const errors = Number(json?.errors || 0);
        if (denied === 0 && errors === 0) return;
      }
    } catch {}

    for (const [key, value] of Object.entries(toSend)) {
      try {
        const res = await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
        if (!res.ok) {
          _pendingWrites[key] = value;
        }
      } catch {
        _pendingWrites[key] = value;
      }
    }
  }

  function _installManagedLocalStorageBridge() {
    if (_bridgeInstalled) return;

    localStorage.getItem = (key) => {
      const k = String(key || '');
      if (!_isManagedKey(k)) return LEGACY.getItem(k);

      if (Object.prototype.hasOwnProperty.call(RAW, k)) return RAW[k];

      const rawLegacy = LEGACY.getItem(k);
      if (rawLegacy !== null) {
        _setRawCache(k, rawLegacy);
        return rawLegacy;
      }

      if (Object.prototype.hasOwnProperty.call(CACHE, k)) {
        const raw = _serialize(CACHE[k]);
        return raw === null ? null : raw;
      }

      return null;
    };

    localStorage.setItem = (key, value) => {
      const k = String(key || '');
      const raw = String(value);
      if (!_isManagedKey(k)) {
        return LEGACY.setItem(k, raw);
      }

      _setRawCache(k, raw);
      if (_isServerSyncKey(k)) {
        _pendingWrites[k] = CACHE[k];
        _scheduleBatch();
      }
    };

    localStorage.removeItem = (key) => {
      const k = String(key || '');
      if (!_isManagedKey(k)) {
        return LEGACY.removeItem(k);
      }

      delete CACHE[k];
      delete RAW[k];
      delete _pendingWrites[k];

      if (_isServerSyncKey(k)) {
        checkServer(true).then((online) => {
          if (!online) return;
          fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(k)}`, {
            method: 'DELETE'
          }).catch(() => {});
        });
      }
    };

    _bridgeInstalled = true;
  }

  async function _migrateLegacyLocalStorage() {
    const moved = [];
    for (let i = 0; i < LEGACY.length; i++) {
      const key = LEGACY.key(i);
      if (!key || !_isManagedKey(key)) continue;
      const raw = LEGACY.getItem(key);
      if (raw === null) continue;

      _setRawCache(key, raw);
      if (_isServerSyncKey(key)) {
        _pendingWrites[key] = CACHE[key];
      }
      moved.push(key);
    }

    if (Object.keys(_pendingWrites).length > 0) {
      await _flushToServer();
    }

    moved.forEach((key) => {
      try { LEGACY.removeItem(key); } catch {}
    });
  }

  function get(key, fallback = null) {
    const k = String(key || '');
    if (!k) return fallback;
    if (Object.prototype.hasOwnProperty.call(CACHE, k)) return CACHE[k];

    const raw = LEGACY.getItem(k);
    if (raw !== null) {
      _setRawCache(k, raw);
      return CACHE[k];
    }

    return fallback;
  }

  async function getAsync(key, fallback = null) {
    const local = get(key, fallback);

    if (await checkServer(true)) {
      try {
        const res = await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`);
        const json = await res.json();
        const serverData = json.data !== undefined ? json.data : json.value;
        if (json.success && serverData !== null && serverData !== undefined) {
          _setValueCache(key, serverData);
          return serverData;
        }
      } catch {}
    }

    return local;
  }

  function set(key, value) {
    _setValueCache(key, value);

    if (_isServerSyncKey(key)) {
      _pendingWrites[key] = value;

      if (key === 'tish_profile' && value && typeof value === 'object' && value.googleId) {
        const userKey = 'tish_profile_' + value.googleId;
        _setValueCache(userKey, value);
        _pendingWrites[userKey] = value;
      }

      _scheduleBatch();
    }
  }

  function remove(key) {
    const k = String(key || '');
    delete CACHE[k];
    delete RAW[k];
    delete _pendingWrites[k];

    if (_isServerSyncKey(k)) {
      checkServer(true).then((online) => {
        if (!online) return;
        fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(k)}`, {
          method: 'DELETE'
        }).catch(() => {});
      });
    }
  }

  function getProfile() { return get('tish_profile', {}); }
  function setProfile(data) { return set('tish_profile', data); }
  function getOrders() { return get('tish_orders', []); }
  function setOrders(data) { return set('tish_orders', data); }
  function getProducts() { return get('tish_admin_products', []); }
  function setProducts(data) { return set('tish_admin_products', data); }
  function getChat(chatId) { return get('chat_' + chatId, []); }
  function setChat(chatId, data) { return set('chat_' + chatId, data); }

  async function getProfileAsync() { return getAsync('tish_profile', {}); }
  async function getOrdersAsync() { return getAsync('tish_orders', []); }
  async function getProductsAsync() { return getAsync('tish_admin_products', []); }

  async function pullAll() {
    if (!(await checkServer(true))) return false;

    const keys = new Set(BOOTSTRAP_KEYS);
    try {
      const res = await fetch(`${SERVER_URL}/api/store/data`);
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.keys)) {
        json.keys.forEach((k) => {
          if (_isServerSyncKey(k)) keys.add(String(k));
        });
      }
    } catch {}

    for (const key of keys) {
      try {
        const res = await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`);
        const json = await res.json();
        const value = json.data !== undefined ? json.data : json.value;
        if (res.ok && json.success && value !== undefined && value !== null) {
          _setValueCache(key, value);
        }
      } catch {}
    }

    return true;
  }

  async function syncAll() {
    if (!(await checkServer(true))) return false;
    const keys = _collectAllKeys();
    for (const key of keys) {
      if (!_isServerSyncKey(key)) continue;
      const value = get(key, null);
      if (value === null || value === undefined) continue;
      try {
        await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
      } catch {}
    }
    return true;
  }

  async function forceSync() {
    clearTimeout(_syncTimer);
    await _flushToServer();
  }

  async function setNow(key, value) {
    _setValueCache(key, value);
    delete _pendingWrites[key];

    if (!_isServerSyncKey(key)) return true;
    if (!(await checkServer(true))) {
      _pendingWrites[key] = value;
      _scheduleBatch();
      return false;
    }

    try {
      const res = await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });

      if (res.ok && key === 'tish_profile' && value && typeof value === 'object' && value.googleId) {
        const userKey = 'tish_profile_' + value.googleId;
        _setValueCache(userKey, value);
        await fetch(`${SERVER_URL}/api/store/data/${encodeURIComponent(userKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
      }

      return res.ok;
    } catch {
      _pendingWrites[key] = value;
      _scheduleBatch();
      return false;
    }
  }

  async function init() {
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      _installManagedLocalStorageBridge();
      await _migrateLegacyLocalStorage();
      await checkServer(true);
      if (serverAvailable) await pullAll();
      return true;
    })();

    return _initPromise;
  }

  function _collectAllKeys() {
    const keys = new Set(Object.keys(CACHE).filter((k) => _isServerSyncKey(k)));
    for (let i = 0; i < LEGACY.length; i++) {
      const k = LEGACY.key(i);
      if (k && _isServerSyncKey(k)) keys.add(k);
    }
    return Array.from(keys);
  }

  _installManagedLocalStorageBridge();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }

  window.addEventListener('beforeunload', () => {
    forceSync();
  });

  return {
    get,
    set,
    remove,
    getAsync,
    getProfile,
    setProfile,
    getOrders,
    setOrders,
    getProducts,
    setProducts,
    getChat,
    setChat,
    getProfileAsync,
    getOrdersAsync,
    getProductsAsync,
    syncAll,
    pullAll,
    forceSync,
    setNow,
    init,
    checkServer
  };
})();
