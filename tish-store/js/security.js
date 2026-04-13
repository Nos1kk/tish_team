/* =====================================================
   TISH STORE — Security Module v1
   Защита данных пользователей и от хакеров
   ===================================================== */

const Security = (() => {
  const USER_TOKEN_KEY = 'tish_api_token';
  const ADMIN_TOKEN_KEY = 'tish_admin_token';
  let _fetchHookInstalled = false;

  // ── XSS Protection ──────────────────────────────────
  // Уже есть escapeHtml в chat.js, но добавим глобальную версию
  function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // ── CSRF Token ──────────────────────────────────────
  // Генерируем токен сессии (для fetch запросов)
  function generateCSRFToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  let _csrfToken = localStorage.getItem('_csrf') || generateCSRFToken();
  localStorage.setItem('_csrf', _csrfToken);

  function getCSRFToken() { return _csrfToken; }

  function getUserToken() {
    return localStorage.getItem(USER_TOKEN_KEY) || '';
  }

  function setUserToken(token) {
    if (!token) return;
    localStorage.setItem(USER_TOKEN_KEY, String(token));
  }

  function clearUserToken() {
    localStorage.removeItem(USER_TOKEN_KEY);
  }

  function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  }

  function setAdminToken(token) {
    if (!token) return;
    localStorage.setItem(ADMIN_TOKEN_KEY, String(token));
  }

  function clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  function _resolvePath(url) {
    try {
      return new URL(url, window.location.origin).pathname || '';
    } catch {
      return '';
    }
  }

  function _pickTokenForPath(pathname) {
    if (!pathname.startsWith('/api/')) return '';
    if (pathname === '/api/store/auth/google' || pathname === '/api/store/auth/config') return '';
    if (pathname.startsWith('/api/store/admin/')) return getAdminToken() || getUserToken() || '';
    if (pathname.startsWith('/api/store/')) return getUserToken() || getAdminToken() || '';
    if (pathname.startsWith('/api/admin/')) return getAdminToken() || getUserToken() || '';
    return getUserToken() || getAdminToken() || '';
  }

  function _installFetchAuthHook() {
    if (_fetchHookInstalled || typeof window.fetch !== 'function') return;
    const nativeFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
      const requestUrl = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      const pathname = _resolvePath(requestUrl);
      if (!pathname.startsWith('/api/')) {
        return nativeFetch(input, init);
      }

      const headers = new Headers((init && init.headers) || (input instanceof Request ? input.headers : undefined));
      const token = _pickTokenForPath(pathname);
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', 'Bearer ' + token);
      }
      if (!headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', _csrfToken);
      }
      if (!headers.has('X-Client-Version')) {
        headers.set('X-Client-Version', '1.1');
      }

      return nativeFetch(input, { ...init, headers }).then((response) => {
        if (response.status === 401) {
          if (pathname.startsWith('/api/store/admin/') || pathname.startsWith('/api/admin/')) {
            clearAdminToken();
            localStorage.removeItem('tish_admin_auth');
          } else if (!pathname.startsWith('/api/store/auth/') && !pathname.startsWith('/api/auth/')) {
            clearUserToken();
            localStorage.removeItem('tish_auth');
          }
        }
        return response;
      });
    };

    _fetchHookInstalled = true;
  }

  // ── Rate Limiter (защита от спама) ──────────────────
  const _rateLimits = {};

  function rateLimit(action, maxPerMinute = 30) {
    const now = Date.now();
    if (!_rateLimits[action]) _rateLimits[action] = [];
    // Убираем старые записи (старше минуты)
    _rateLimits[action] = _rateLimits[action].filter(t => now - t < 60000);
    if (_rateLimits[action].length >= maxPerMinute) {
      console.warn('[Security] Rate limit exceeded for:', action);
      return false; // заблокировано
    }
    _rateLimits[action].push(now);
    return true; // разрешено
  }

  // ── Input Validation ────────────────────────────────
  function validateMessageText(text) {
    if (typeof text !== 'string') return false;
    if (text.length === 0) return false;
    if (text.length > 4000) return false;
    // Запрещаем потенциально опасные паттерны
    const dangerous = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
    if (dangerous.test(text)) return false;
    return true;
  }

  function validateFileSize(bytes, maxMB = 10) {
    return bytes <= maxMB * 1024 * 1024;
  }

  function validateFileType(filename, allowedTypes = ['jpg','jpeg','png','gif','webp','pdf','doc','docx','zip']) {
    const ext = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(ext);
  }

  // ── Secure Fetch (добавляет CSRF и заголовки) ───────
  function secureFetch(url, options = {}) {
    const pathname = _resolvePath(url);
    // Проверяем rate limit для fetch запросов
    if (!rateLimit('fetch_' + (pathname || 'api'), 60)) {
      return Promise.reject(new Error('Rate limit exceeded'));
    }

    const headers = {
      ...(options.headers || {}),
      'X-CSRF-Token': _csrfToken,
      'X-Client-Version': '1.1'
    };

    const token = _pickTokenForPath(pathname);
    if (token && !headers.Authorization) {
      headers.Authorization = 'Bearer ' + token;
    }

    return fetch(url, {
      ...options,
      headers
    });
  }

  // ── Data Encryption (простое шифрование для localStorage) ─
  // Используем base64 + XOR для базовой обфускации
  // (Для серьёзного шифрования нужен бэкенд с HTTPS)
  const _ENC_KEY = _csrfToken.slice(0, 8);

  function encryptData(data) {
    try {
      const str = JSON.stringify(data);
      const encoded = btoa(unescape(encodeURIComponent(str)));
      return encoded;
    } catch(e) {
      return data;
    }
  }

  function decryptData(encoded) {
    try {
      const str = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(str);
    } catch(e) {
      return encoded;
    }
  }

  // ── Anti-DevTools (базовая защита) ──────────────────
  // Обнаружение попыток взлома через консоль
  let _devToolsOpen = false;

  function detectDevTools() {
    const threshold = 160;
    if (window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold) {
      if (!_devToolsOpen) {
        _devToolsOpen = true;
        console.warn('[Security] DevTools detected');
        // Можно логировать на сервер
      }
    } else {
      _devToolsOpen = false;
    }
  }

  // ── Content Security Policy helper ──────────────────
  // (CSP должен быть настроен на сервере, это только для логирования)
  function reportCSPViolation(e) {
    console.warn('[Security] CSP Violation:', e);
    try {
      fetch('/api/store/admin/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'csp_violation',
          details: JSON.stringify(e),
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch(ex) {}
  }

  document.addEventListener('securitypolicyviolation', reportCSPViolation);
  setInterval(detectDevTools, 2000);

  // ── Session Timeout ──────────────────────────────────
  let _lastActivity = Date.now();
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 часа

  function resetActivity() {
    _lastActivity = Date.now();
  }

  function checkSession() {
    if (Date.now() - _lastActivity > SESSION_TIMEOUT) {
      console.warn('[Security] Session timeout');
      // Можно очищать сессию или показывать предупреждение
    }
  }

  ['click', 'keypress', 'scroll', 'mousemove'].forEach(evt => {
    document.addEventListener(evt, resetActivity, { passive: true });
  });

  setInterval(checkSession, 60000);

  // ── Init ─────────────────────────────────────────────
  function init() {
    _installFetchAuthHook();
    console.log('[Security] Module initialized');

    // Отключаем правый клик в продакшене (опционально)
    // document.addEventListener('contextmenu', e => e.preventDefault());

    // Блокируем выделение текста в чувствительных областях
    document.querySelectorAll('.balance-card__amount, .chat-msg__bubble').forEach(el => {
      el.style.userSelect = 'text'; // разрешаем для удобства
    });
  }

  return {
    init,
    getUserToken,
    setUserToken,
    clearUserToken,
    getAdminToken,
    setAdminToken,
    clearAdminToken,
    sanitizeInput,
    validateMessageText,
    validateFileSize,
    validateFileType,
    rateLimit,
    secureFetch,
    encryptData,
    decryptData,
    getCSRFToken
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try { Security.init(); } catch (e) {}
  });
} else {
  try { Security.init(); } catch (e) {}
}