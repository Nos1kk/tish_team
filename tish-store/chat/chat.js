/* =====================================================
   TISH STORE — CHAT MODULE v6 (All Bugs Fixed)
   Fixes:
   1. Реакции не смещаются (правильное позиционирование)
   2. После отзыва можно писать (инпут не блокируется)
   3. FAQ панель скрываемая с кнопкой-подсказкой
   4. callAdmin отправляет уведомление админу на сервер
   5. Удаление чатов
   6. Архив чатов
   7. Пересланные сообщения с меткой "Переслано"
===================================================== */

const Chat = (() => {
  let activeChatId = null;
  let isRecording = false;
  let recordingTimer = null;
  let recordingSeconds = 0;
  let mediaRecorder = null;
  let audioChunks = [];
  let attachments = [];
  let _noAutoScroll = false;
  let faqPanelOpen = true; // FAQ panel state
  // ===== CONTEXT MENU =====
  let replyingTo = null;
  let selectedMessages = new Set();
  let pinnedMessages = [];
  let _pinnedChats = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('tish_pinned_chats') || '["support"]');
      return Array.isArray(parsed) ? parsed : ['support'];
    } catch {
      return ['support'];
    }
  })();
  let _adminPresence = null;
  let _presenceRefreshTimer = null;
  let _presenceLastFetchTs = 0;
  let _messageRefreshTimer = null;
  let _hydratedChatIds = new Set();
  let _chatServerTokens = new Map();
  let _storageWarningShown = false;
  let _chatRealtimeEventsBound = false;
  let _contextMenuBound = false;
  let _mobileLayoutMode = 'list';
  let _mobileLayoutEventsBound = false;
  let _chatPopupEventsBound = false;
  let _chatTopPopupTimer = null;
  let _chatTopPopupLastSig = '';
  let _chatTopPopupLastAt = 0;

  const MAX_ATTACH_FILE_BYTES = 4 * 1024 * 1024;
  const MAX_ATTACH_TOTAL_BYTES = 10 * 1024 * 1024;
  const CHAT_REFRESH_VISIBLE_MS = 2500;
  const CHAT_REFRESH_BACKGROUND_MS = 7000;
  const URGENT_FAB_POS_KEY = 'tish_urgent_fab_pos';
  const PAYMENT_METHODS = {
    sber_card: {
      id: 'sber_card',
      label: 'Карта Сбербанка',
      cardNumber: '2202 2088 4512 7391',
      receiver: 'Кирилл Кусенко Александрович'
    }
  };
  let _paymentModalState = null;
  let _discountModalState = null;

  const DEFAULT_CURRENCY = 'USD';
  const CURRENCY_META = {
    USD: { symbol: '$', label: 'USD' },
    RUB: { symbol: '₽', label: 'RUB' }
  };

  function _isDebugGhostMessage(msg) {
    if (!msg || msg.type !== 'text') return false;
    const text = String(msg.text || '').trim().toLowerCase();
    return text === 'test append' || text === 'test from admin';
  }

  function _isBackgroundPage() {
    return document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus());
  }

  function _isMobileChatViewport() {
    return window.innerWidth <= 1024;
  }

  function _isCompactChatViewport() {
    return window.innerWidth <= 1024;
  }

  /* ===== Inject mobile-chat CSS directly from JS (cache-proof) ===== */
  function _injectMobileChatStyles() {
    if (document.getElementById('_chatMobileCSS')) return;
    const s = document.createElement('style');
    s.id = '_chatMobileCSS';
    s.textContent = [
      '@media(max-width:1024px){',
      '  .chat-page.chat-page--mobile-list .chat-list{ display:flex !important; }',
      '  .chat-page.chat-page--mobile-list .chat-window{ display:none !important; }',
      '  .chat-page.chat-page--mobile-chat .chat-list{ display:none !important; }',
      '  .chat-page.chat-page--mobile-chat .chat-window{',
      '    display:flex !important; flex-direction:column !important;',
      '    position:fixed !important; top:0 !important; left:0 !important; right:0 !important; bottom:0 !important;',
      '    width:100vw !important; height:100vh !important; height:100svh !important;',
      '    max-height:none !important;',
      '    z-index:9999 !important; margin:0 !important; border-radius:0 !important;',
      '    border:none !important; box-shadow:none !important; inset:0 !important;',
      '    background:var(--color-bg-elevated,#0d0d1a) !important;',
      '  }',
      '  .chat-page.chat-page--mobile-chat .chat-window__header{',
      '    position:sticky !important; top:0 !important; z-index:10 !important;',
      '    padding:10px 12px !important; padding-top:calc(10px + env(safe-area-inset-top)) !important;',
      '    background:var(--color-bg-elevated,#0d0d1a) !important;',
      '    border-bottom:1px solid rgba(139,92,246,0.14) !important;',
      '    gap:10px !important; min-height:56px !important;',
      '  }',
      '  .chat-page.chat-page--mobile-chat .chat-messages{',
      '    flex:1 1 0 !important; overflow-y:auto !important; min-height:0 !important;',
      '  }',
      '  .chat-page.chat-page--mobile-chat .chat-input{',
      '    position:sticky !important; bottom:0 !important; z-index:10 !important;',
      '    padding-bottom:calc(10px + env(safe-area-inset-bottom)) !important;',
      '    background:var(--color-bg-elevated,#0d0d1a) !important;',
      '  }',
      '}'
    ].join('\n');
    // Append to end of body for max cascade priority
    (document.body || document.head).appendChild(s);
  }

  function _syncMobileChatLayout() {
    _injectMobileChatStyles();
    const page = document.getElementById('chatPage');
    const list = document.getElementById('chatList');
    const w = document.getElementById('chatWindow');
    if (!list || !w) return;

    if (!_isMobileChatViewport()) {
      if (page) {
        page.classList.remove('chat-page--mobile-list');
        page.classList.remove('chat-page--mobile-chat');
      }
      list.style.cssText = '';
      w.style.cssText = '';
      w.style.display = 'flex';
      const backBtn = w.querySelector('.chat-back-btn');
      if (backBtn) backBtn.style.display = 'none';
      return;
    }

    const showChat = _mobileLayoutMode === 'chat' && !!activeChatId;
    if (page) {
      page.classList.toggle('chat-page--mobile-chat', showChat);
      page.classList.toggle('chat-page--mobile-list', !showChat);
    }
    /* Belt-and-suspenders: also set inline styles for fullscreen */
    list.style.display = showChat ? 'none' : '';
    if (showChat) {
      w.style.cssText = 'display:flex !important;flex-direction:column;position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;height:100svh;z-index:9999;margin:0;border-radius:0;border:none;box-shadow:none;background:var(--color-bg-elevated,#0d0d1a);';
    } else {
      w.style.cssText = 'display:none;';
    }
    const backBtn = w.querySelector('.chat-back-btn');
    if (backBtn) backBtn.style.display = showChat ? 'inline-flex' : 'none';
  }

  function _ensureTopPopupHost() {
    let host = document.getElementById('chatTopPopupHost');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'chatTopPopupHost';
    host.className = 'chat-top-popup-host';
    document.body.appendChild(host);
    return host;
  }

  function _hideTopPopup(immediate = false) {
    if (_chatTopPopupTimer) {
      clearTimeout(_chatTopPopupTimer);
      _chatTopPopupTimer = null;
    }
    const host = document.getElementById('chatTopPopupHost');
    if (!host) return;
    const popup = host.querySelector('.chat-top-popup');
    if (!popup) return;
    if (immediate) {
      popup.remove();
      return;
    }
    popup.classList.remove('is-visible');
    setTimeout(() => {
      if (host.contains(popup)) popup.remove();
    }, 220);
  }

  function _resolveIncomingPopupTitle(chatId) {
    const chat = getChats().find((item) => _sameId(item.id, chatId));
    if (!chat) return 'Новое сообщение';
    if (chat.type === 'support') return 'Поддержка Tish Team';
    const name = String(chat.orderName || '').trim() || 'Заказ';
    return 'Заказ: ' + name;
  }

  function _openChatFromPopup(chatId) {
    const targetId = String(chatId || '').trim();
    if (!targetId) return;
    try {
      if (typeof Navigation !== 'undefined' && typeof Navigation.showPage === 'function') {
        Navigation.showPage('chat');
      } else if (typeof App !== 'undefined' && typeof App.showPage === 'function') {
        App.showPage('chat');
      }
    } catch {}

    const tryOpen = () => {
      try { openChat(targetId); } catch {}
    };
    setTimeout(tryOpen, 90);
    setTimeout(tryOpen, 260);
  }

  function _showTopPopup(detail) {
    if (!_isCompactChatViewport()) return;
    if (!detail || detail.from === 'user') return;

    const chatId = String(detail.chatId || '').trim();
    if (!chatId) return;

    if (!_isBackgroundPage() && _sameId(activeChatId, chatId)) return;

    const text = String(detail.text || '').trim() || 'Вам пришло сообщение в чат';
    const signature = chatId + '|' + text.slice(0, 100);
    const now = Date.now();
    if (signature === _chatTopPopupLastSig && (now - _chatTopPopupLastAt) < 1800) return;
    _chatTopPopupLastSig = signature;
    _chatTopPopupLastAt = now;

    const host = _ensureTopPopupHost();
    _hideTopPopup(true);
    host.innerHTML = `
      <div class="chat-top-popup" role="button" tabindex="0" aria-label="Открыть чат">
        <div class="chat-top-popup__icon">${IC.chat}</div>
        <div class="chat-top-popup__body">
          <div class="chat-top-popup__title">${escapeHtml(_resolveIncomingPopupTitle(chatId))}</div>
          <div class="chat-top-popup__text">${escapeHtml(text)}</div>
        </div>
        <button type="button" class="chat-top-popup__close" aria-label="Закрыть">${IC.x}</button>
      </div>
    `;

    const popup = host.querySelector('.chat-top-popup');
    const closeBtn = host.querySelector('.chat-top-popup__close');
    if (!popup || !closeBtn) return;

    const openTargetChat = () => {
      _hideTopPopup();
      _openChatFromPopup(chatId);
    };

    popup.addEventListener('click', openTargetChat);
    popup.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTargetChat();
      }
    });
    closeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      _hideTopPopup();
    });

    requestAnimationFrame(() => popup.classList.add('is-visible'));
    _chatTopPopupTimer = setTimeout(() => {
      _hideTopPopup();
    }, 4600);
  }

  function _bindTopPopupEvents() {
    if (_chatPopupEventsBound) return;
    _chatPopupEventsBound = true;
    document.addEventListener('chatNewMessage', (event) => {
      const detail = event?.detail;
      if (!detail) return;
      _showTopPopup(detail);
    });
  }

  function _emitIncomingChatMessage(chatId, msg) {
    if (!msg || msg.from !== 'admin') return;
    if (!_isBackgroundPage() && activeChatId === chatId) return;
    document.dispatchEvent(new CustomEvent('chatNewMessage', {
      detail: {
        id: msg.id,
        chatId,
        from: msg.from,
        type: msg.type || 'text',
        text: msg.text || getMessagePreview(msg)
      }
    }));
  }

  function _withScrollLock(fn) {
    const c = document.getElementById('chatMessages');
    if (!c) { try { fn(); } catch(e) {} return; }
    const saved = c.scrollTop;
    _noAutoScroll = true;
    try { fn(); } catch(e) {}
    c.scrollTop = saved;
    requestAnimationFrame(() => { c.scrollTop = saved; });
    [30, 80, 150, 300, 500].forEach(t =>
      setTimeout(() => { if (c) c.scrollTop = saved; }, t)
    );
    setTimeout(() => { _noAutoScroll = false; }, 600);
  }

  // ===== SVG ICONS =====
  const IC = {
    fire: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f97316" stroke-width="2"><path d="M12 22c-4.97 0-9-2.69-9-6 0-4 5-11 9-14 4 3 9 10 9 14 0 3.31-4.03 6-9 6z"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#d946ef" stroke-width="2"><path d="M12 2l2.09 6.26L20 10.27l-4.74 3.74L16.18 22 12 18.56 7.82 22l.92-7.99L4 10.27l5.91-1.01z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    alert: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    file: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg>',
    invoice: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    money: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#22c55e" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    gift: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#d946ef" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>',
    support: '<span class="support-neon-t">T</span>',
    clock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f97316" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ec4899" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    thumbsUp: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    forward: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>',
    archive: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    unarchive: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><polyline points="10 16 12 14 14 16"/><line x1="12" y1="14" x2="12" y2="21"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
    bellRing: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="18" cy="8" r="3" fill="#ef4444" stroke="none"/></svg>'
  };

  // ===== REACTIONS =====
  const REACTIONS = [
    { emoji: IC.heart, name: 'heart', label: 'Love' },
    { emoji: IC.thumbsUp, name: 'thumbsUp', label: 'Like' },
    { emoji: IC.fire, name: 'fire', label: 'Fire' },
    { emoji: IC.sparkle, name: 'sparkle', label: 'Wow' },
    { emoji: IC.check, name: 'check', label: 'Done' }
  ];

  // ===== FAQ =====
  const FAQ_ITEMS = [
    { q: 'Как оформить заказ?', a: 'Выберите товар в каталоге, нажмите "Заказать", внесите предоплату 30% и ожидайте начала работы.' },
    { q: 'Сколько стоит работа?', a: 'Цены указаны на карточках товаров. Точная стоимость зависит от сложности.' },
    { q: 'Какие сроки?', a: 'Стандарт: 3-7 дней. Для срочных заказов есть приоритетная обработка.' },
    { q: 'Как оплатить?', a: 'Оплата в чате заказа. Админ выставит счёт после выполнения.' },
    { q: 'Возврат денег?', a: 'Возврат предоплаты возможен до начала работы. После — индивидуально.' },
    { q: 'Как получить скидку?', a: 'Через TISHARA бонусы, реферальную программу, или подписку Tishara Club.' }
  ];

  // ===== STORAGE =====
  function _getSupportChatId() {
    try {
      const profile = JSON.parse(localStorage.getItem('tish_profile') || '{}');
      if (profile.googleId) return 'support_' + profile.googleId;
    } catch {}
    return 'support';
  }

  function _ensurePinnedSupportChat(forcePersist = false) {
    const supportId = _getSupportChatId();
    const source = Array.isArray(_pinnedChats) ? _pinnedChats : [];
    const normalized = source
      .map((id) => String(id || '').trim())
      .filter(Boolean)
      .filter((id, idx, arr) => arr.indexOf(id) === idx)
      .filter((id) => !(id === 'support' && supportId !== 'support'));

    const withoutSupport = normalized.filter((id) => id !== supportId);
    const next = [supportId, ...withoutSupport];
    const changed = forcePersist || next.length !== source.length || next.some((id, idx) => id !== source[idx]);

    _pinnedChats = next;
    if (changed) {
      localStorage.setItem('tish_pinned_chats', JSON.stringify(_pinnedChats));
      if (typeof Storage !== 'undefined' && Storage.set) {
        Storage.set('tish_pinned_chats', _pinnedChats);
      }
    }
  }

  function _sameId(a, b) {
    return String(a ?? '') === String(b ?? '');
  }

  function _timeToTodayToken(value) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
    if (!m) return 0;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min)) return 0;
    if (h < 0 || h > 23 || min < 0 || min > 59) return 0;
    const d = new Date();
    d.setHours(h, min, 0, 0);
    return d.getTime();
  }

  function _messageToken(msg, fallback = 0) {
    if (!msg || typeof msg !== 'object') return fallback;
    const dateTs = Date.parse(msg.date || msg.createdAt || msg.transferAt || '');
    if (Number.isFinite(dateTs) && dateTs > 0) return dateTs;
    const idNum = Number(msg.id);
    if (Number.isFinite(idNum) && idNum > 0) return idNum;
    const timeTs = _timeToTodayToken(msg.time);
    if (timeTs > 0) return timeTs;
    return fallback;
  }

  function _getProfileReadState(profile) {
    const source = profile && typeof profile === 'object' ? profile : getProfileData();
    if (!source || typeof source !== 'object') return {};
    const state = source.chatReadState;
    return state && typeof state === 'object' ? state : {};
  }

  function _getChatReadToken(chatId, profile) {
    if (!chatId) return 0;
    const state = _getProfileReadState(profile);
    const token = Number(state[String(chatId)] || 0);
    return Number.isFinite(token) && token > 0 ? token : 0;
  }

  function _setChatReadToken(chatId, token) {
    if (!chatId) return;
    const nextToken = Number(token || 0);
    if (!Number.isFinite(nextToken) || nextToken <= 0) return;

    const profile = getProfileData();
    const state = _getProfileReadState(profile);
    const id = String(chatId);
    const current = Number(state[id] || 0);
    if (Number.isFinite(current) && current >= nextToken) return;

    profile.chatReadState = { ...state, [id]: nextToken };
    saveProfileData(profile);
  }

  function _getLastAdminToken(messages) {
    let token = 0;
    (Array.isArray(messages) ? messages : []).forEach((m, idx) => {
      if (m && m.from === 'admin') {
        token = Math.max(token, _messageToken(m, idx + 1));
      }
    });
    return token;
  }

  function _getLastMessageToken(messages) {
    let token = 0;
    (Array.isArray(messages) ? messages : []).forEach((m, idx) => {
      token = Math.max(token, _messageToken(m, idx + 1));
    });
    return token;
  }

  function _countUnreadAdminMessages(messages, chatId, profile) {
    const list = Array.isArray(messages) ? messages : [];
    const readToken = _getChatReadToken(chatId, profile);
    if (readToken <= 0) {
      return list.filter((m) => m && m.from === 'admin' && !m.read).length;
    }
    return list.reduce((sum, m, idx) => {
      if (!m || m.from !== 'admin') return sum;
      return _messageToken(m, idx + 1) > readToken ? sum + 1 : sum;
    }, 0);
  }

  function _resolveInvoiceCurrency(msg, chatId = activeChatId) {
    const raw = String(msg?.currency || msg?.invoiceCurrency || '').toUpperCase();
    if (raw && CURRENCY_META[raw]) return raw;
    const order = _findOrderByChatId(chatId);
    if (!order) return DEFAULT_CURRENCY;
    return getOrderCurrency(order, 'invoice');
  }

  function _refreshTrackedChatsFromServer() {
    const ids = new Set();
    if (activeChatId) ids.add(String(activeChatId));
    ids.add(_getSupportChatId());
    ids.forEach((id) => {
      if (!id) return;
      refreshMessagesFromServer(id);
    });
  }

  function _startMessageRefreshLoop() {
    if (_messageRefreshTimer) return;
    const interval = _isBackgroundPage() ? CHAT_REFRESH_BACKGROUND_MS : CHAT_REFRESH_VISIBLE_MS;
    _refreshTrackedChatsFromServer();
    _messageRefreshTimer = setInterval(_refreshTrackedChatsFromServer, interval);
  }

  function _stopMessageRefreshLoop() {
    if (_messageRefreshTimer) {
      clearInterval(_messageRefreshTimer);
      _messageRefreshTimer = null;
    }
  }

  function _restartMessageRefreshLoop() {
    _stopMessageRefreshLoop();
    _startMessageRefreshLoop();
  }

  function _bindChatRealtimeEvents() {
    if (_chatRealtimeEventsBound) return;
    _chatRealtimeEventsBound = true;

    document.addEventListener('visibilitychange', () => {
      if (!_messageRefreshTimer) return;
      _restartMessageRefreshLoop();
      if (!document.hidden) {
        _refreshTrackedChatsFromServer();
      }
    });

    window.addEventListener('focus', () => {
      _refreshTrackedChatsFromServer();
      if (_messageRefreshTimer) {
        _restartMessageRefreshLoop();
      }
    });
  }

  function _findOrderByChatId(chatId) {
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    return orders.find(o => _sameId(o.chatId, chatId)) || null;
  }

  function _resolveOrderImage(order) {
    if (!order) return null;
    if (order.productImage) return String(order.productImage);
    try {
      if (typeof Catalog !== 'undefined' && typeof Catalog.getProducts === 'function') {
        const products = Catalog.getProducts() || [];
        const product = products.find((p) => _sameId(p.id, order.productId));
        if (product && Array.isArray(product.media)) {
          const firstImage = product.media.find((m) => m && m.type === 'image' && m.url);
          if (firstImage) return String(firstImage.url);
        }
      }
    } catch {}
    return null;
  }

  function _renderOrderAvatar(chat, avatarClass) {
    const cls = avatarClass || 'chat-item__avatar';
    const bg = chat.isUrgent
      ? 'linear-gradient(135deg,#ef4444,#f97316)'
      : (chat.orderGradient || 'linear-gradient(135deg,var(--purple-500),var(--magenta-500))');
    const iconFallback = chat.isUrgent
      ? IC.bolt
      : chat.type === 'support'
        ? IC.support
        : '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>';
    const imageHtml = chat.orderImage
      ? `<img class="chat-order-avatar__img" src="${escapeHtml(chat.orderImage)}" alt="${escapeHtml(chat.orderName || 'Товар')}">`
      : '';
    const urgentDot = (chat.isUrgent && chat.type !== 'support') ? '<span class="chat-order-urgent-dot">⚡</span>' : '';
    const onlineDot = (cls === 'chat-item__avatar' && chat.type === 'support' && chat.online)
      ? '<span class="chat-item__online"></span>'
      : '';
    return `<div class="${cls}" style="background:${bg}">${imageHtml || iconFallback}${urgentDot}${onlineDot}</div>`;
  }

  function _isOrderChatLocked(order) {
    if (!order) return false;
    if (order.status === 'completed') return true;
    if (order.status === 'paid' && (order.verified === true || order.checked === true || order.isVerified === true)) {
      return true;
    }
    return false;
  }

  function _isActiveChatLocked() {
    const order = _findOrderByChatId(activeChatId);
    return _isOrderChatLocked(order);
  }

  function _attachmentBytesTotal() {
    return attachments.reduce((sum, item) => sum + Number(item?.bytes || 0), 0);
  }

  function _canAttach(file) {
    if (!file) return false;
    if (attachments.length >= 10) {
      App.showToast('Можно прикрепить максимум 10 файлов за раз', 'warning');
      return false;
    }
    if (file.size > MAX_ATTACH_FILE_BYTES) {
      App.showToast('Файл слишком большой. Максимум 4 МБ на файл', 'warning');
      return false;
    }
    if ((_attachmentBytesTotal() + file.size) > MAX_ATTACH_TOTAL_BYTES) {
      App.showToast('Слишком большой общий размер вложений. Лимит 10 МБ', 'warning');
      return false;
    }
    return true;
  }

  function _findMessageById(msgId) {
    if (!activeChatId) return null;
    const msgs = getMessages(activeChatId);
    return msgs.find(m => _sameId(m.id, msgId)) || null;
  }

  function _readAdminPresenceLocal() {
    try {
      const raw = localStorage.getItem('tish_admin_presence');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      _adminPresence = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  function _isPresenceFresh(presence) {
    if (!presence || !presence.lastSeen) return false;
    const ts = Date.parse(presence.lastSeen);
    if (Number.isNaN(ts)) return false;
    return (Date.now() - ts) <= 45000;
  }

  function isAdminOnline() {
    const presence = _adminPresence || _readAdminPresenceLocal();
    if (!presence) return false;
    const hasAdminRole = presence.isAdmin === true || String(presence.role || '').toLowerCase() === 'admin';
    return presence.online === true && hasAdminRole && _isPresenceFresh(presence);
  }

  async function refreshAdminPresence(force = false) {
    const now = Date.now();
    if (!force && (now - _presenceLastFetchTs) < 8000) {
      return _adminPresence || _readAdminPresenceLocal();
    }
    _presenceLastFetchTs = now;
    try {
      const res = await fetch('/api/store/data/tish_admin_presence');
      const json = await res.json();
      const value = json.value !== undefined ? json.value : json.data;
      if (json.success && value && typeof value === 'object') {
        _adminPresence = value;
        localStorage.setItem('tish_admin_presence', JSON.stringify(value));
        return value;
      }
    } catch {}
    return _adminPresence || _readAdminPresenceLocal();
  }

  function _updateActiveHeaderPresence() {
    if (!activeChatId) return;
    const chat = getChats().find(c => c.id === activeChatId);
    if (!chat || chat.type !== 'support') return;
    const statusEl = document.querySelector('.chat-window__status');
    if (!statusEl) return;

    if (isAdminOnline()) {
      statusEl.classList.remove('chat-window__status--offline');
      statusEl.innerHTML = '<span class="chat-window__status-dot"></span>Администратор в сети';
    } else {
      statusEl.classList.add('chat-window__status--offline');
      statusEl.textContent = 'Администратор офлайн';
    }
  }

  function _stopPresencePolling() {
    if (_presenceRefreshTimer) {
      clearInterval(_presenceRefreshTimer);
      _presenceRefreshTimer = null;
    }
  }

  function _ensurePresencePolling(chatId) {
    if (!chatId || !String(chatId).startsWith('support')) {
      _stopPresencePolling();
      return;
    }
    if (_presenceRefreshTimer) return;
    _presenceRefreshTimer = setInterval(() => {
      refreshAdminPresence(true).then(() => {
        if (activeChatId === chatId) {
          renderChatList();
          _updateActiveHeaderPresence();
        }
      });
    }, 12000);
  }

  function getMessages(chatId) {
    let list = [];
    try {
      const data = localStorage.getItem('chat_' + chatId);
      list = data ? JSON.parse(data) : [];
    } catch {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    const cleaned = list.filter((m) => !m.deleted && !_isDebugGhostMessage(m));
    if (cleaned.length !== list.length) {
      try {
        localStorage.setItem('chat_' + chatId, JSON.stringify(cleaned));
      } catch {}
      if (typeof Storage !== 'undefined' && Storage.set) {
        Storage.set('chat_' + chatId, cleaned);
      }
    }
    return cleaned;
  }

  // Pull fresh messages from server (async); merges with local, then re-renders
  async function refreshMessagesFromServer(chatId) {
    try {
      const local = getMessages(chatId);
      const sinceToken = Number(_chatServerTokens.get(String(chatId)) || 0);
      const query = `?since=${encodeURIComponent(String(sinceToken || 0))}&limit=240`;
      const res = await fetch('/api/store/chat/' + encodeURIComponent(chatId) + query);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.messages)) {
        if (json.lastToken !== undefined && json.lastToken !== null) {
          _chatServerTokens.set(String(chatId), Number(json.lastToken) || 0);
        }
        if (json.incremental && json.messages.length === 0) {
          _hydratedChatIds.add(chatId);
          return;
        }

        const knownIds = new Set(local.map((m) => String(m.id ?? '')));
        const shouldEmitIncoming = _hydratedChatIds.has(chatId) || local.length > 0;
        const result = mergeMessageLists(json.messages, local)
          .filter(m => !m.deleted && !_isDebugGhostMessage(m));

        if (_sameId(activeChatId, chatId) && !_isBackgroundPage()) {
          const lastAdminToken = _getLastAdminToken(result);
          if (lastAdminToken > 0) {
            _setChatReadToken(chatId, lastAdminToken);
          }
          result.forEach((m) => {
            if (m && m.from === 'admin') m.read = true;
          });
        }

        localStorage.setItem('chat_' + chatId, JSON.stringify(result));
        if (typeof Storage !== 'undefined' && Storage.set) {
          Storage.set('chat_' + chatId, result);
        }

        if (shouldEmitIncoming) {
          result.forEach((m) => {
            const id = String(m.id ?? '');
            if (!id || knownIds.has(id)) return;
            _emitIncomingChatMessage(chatId, m);
          });
        }

        _hydratedChatIds.add(chatId);

        if (_sameId(activeChatId, chatId)) {
          renderMessages(chatId);
        }
        renderChatList();
        updateChatBadge();
      }
    } catch { /* silent — local data already shown */ }
  }

  function saveMessages(chatId, msgs) {
    let localSaved = true;
    try {
      localStorage.setItem('chat_' + chatId, JSON.stringify(msgs));
    } catch (e) {
      localSaved = false;
      if (!_storageWarningShown) {
        _storageWarningShown = true;
        if (typeof App !== 'undefined') {
          App.showToast('Вложения слишком большие для локального хранилища. Уменьшите размер файлов.', 'warning');
        }
      }
    }
    // Sync to server
    if (typeof Storage !== 'undefined') {
      if (typeof Storage.setNow === 'function') {
        Storage.setNow('chat_' + chatId, msgs).catch(() => {
          if (typeof Storage.set === 'function') Storage.set('chat_' + chatId, msgs);
        });
      } else if (typeof Storage.set === 'function') {
        Storage.set('chat_' + chatId, msgs);
      }
    }

    // Keep the most recent part of chat locally even when quota is exceeded.
    if (!localSaved) {
      try {
        const tail = Array.isArray(msgs) ? msgs.slice(-120) : msgs;
        localStorage.setItem('chat_' + chatId, JSON.stringify(tail));
      } catch {}
    }
  }

  function _pushMessageNow(chatId, message) {
    if (!chatId || !message) return Promise.resolve(false);

    return fetch('/api/store/chat/' + encodeURIComponent(chatId) + '/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    }).then((res) => res.ok).catch(() => false);
  }

  function _pushMessagesNow(chatId, messages) {
    const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
    if (!chatId || list.length === 0) return;

    Promise.allSettled(list.map((msg) => _pushMessageNow(chatId, msg))).finally(() => {
      refreshMessagesFromServer(chatId);
    });
  }

  function formatTime(date) {
    if (!(date instanceof Date)) date = new Date(date);
    return date.getHours().toString().padStart(2,'0') + ':' +
      date.getMinutes().toString().padStart(2,'0');
  }

  // ===== ARCHIVE & DELETE =====
  function getArchivedChats() {
    const data = localStorage.getItem('tish_archived_chats');
    return data ? JSON.parse(data) : [];
  }

  function saveArchivedChats(list) {
    localStorage.setItem('tish_archived_chats', JSON.stringify(list));
    if (typeof Storage !== 'undefined' && Storage.set) {
      Storage.set('tish_archived_chats', list);
    }
  }

  function archiveChat(chatId) {
    const archived = getArchivedChats();
    if (!archived.includes(chatId)) {
      archived.push(chatId);
      saveArchivedChats(archived);
    }
    if (activeChatId === chatId) {
      activeChatId = null;
      const w = document.getElementById('chatWindow');
      if (w) {
        w.innerHTML = `<div class="chat-window--empty"><div class="chat-empty">
          <div class="chat-empty__icon">${IC.chat}</div>
          <h3 class="chat-empty__title">Чат в архиве</h3>
          <p class="chat-empty__desc">Выберите другой чат</p>
        </div></div>`;
      }
    }
    renderChatList();
    App.showToast('Чат перемещён в архив', 'info');
  }

  function unarchiveChat(chatId) {
    const archived = getArchivedChats().filter(id => id !== chatId);
    saveArchivedChats(archived);
    renderChatList();
    App.showToast('Чат восстановлен из архива', 'success');
  }
  function togglePinChat(chatId) {
    const supportId = _getSupportChatId();
    if (chatId === supportId) {
        App.showToast('Чат с поддержкой всегда закреплён', 'info');
        return;
    }
    const MAX_PINNED = 3;
    
    if (_pinnedChats.includes(chatId)) {
        _pinnedChats = _pinnedChats.filter(id => id !== chatId);
        App.showToast('Чат откреплён', 'info');
    } else {
        const userPinned = _pinnedChats.filter(id => id !== supportId);
        if (userPinned.length >= MAX_PINNED - 1) {
        App.showToast('Можно закрепить максимум 3 чата', 'warning');
        return;
        }
        _pinnedChats.push(chatId);
        App.showToast('Чат закреплён', 'success');
    }

      _ensurePinnedSupportChat(true);
    renderChatList();
    }

  function deleteChat(chatId) {
    if (!confirm('Удалить чат? Это действие нельзя отменить.')) return;
    // Remove messages
    localStorage.removeItem('chat_' + chatId);
    localStorage.removeItem('chat_pinned_' + chatId);
    if (typeof Storage !== 'undefined' && Storage.remove) {
      Storage.remove('chat_' + chatId);
    }
    // Remove from archived
    const archived = getArchivedChats().filter(id => id !== chatId);
    saveArchivedChats(archived);

    if (activeChatId === chatId) {
      activeChatId = null;
      const w = document.getElementById('chatWindow');
      if (w) {
        w.innerHTML = `<div class="chat-window--empty"><div class="chat-empty">
          <div class="chat-empty__icon">${IC.chat}</div>
          <h3 class="chat-empty__title">Выберите чат</h3>
          <p class="chat-empty__desc">Чат удалён</p>
        </div></div>`;
      }
    }
    renderChatList();
    App.showToast('Чат удалён', 'info');
  }

  const STATUS_LABELS = {
    'pending_prepayment':'Ожидает предоплату','prepaid':'Предоплачен',
    'prepayment_verification':'Предоплата на проверке',
    'in_progress':'В работе','invoice_sent':'Выставлен счёт',
    'payment_verification':'Оплата на проверке',
    'paid':'Оплачен','completed':'Завершён'
  };
  const STATUS_COLORS = {
    'prepaid':'#3b82f6','in_progress':'#8b5cf6',
    'prepayment_verification':'#f97316','invoice_sent':'#f59e0b',
    'payment_verification':'#f97316','paid':'#22c55e','completed':'#16a34a'
  };

  function getProfileData() {
    try {
      const raw = localStorage.getItem('tish_profile');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveProfileData(profile) {
    localStorage.setItem('tish_profile', JSON.stringify(profile || {}));
    if (typeof Storage !== 'undefined' && Storage.set) {
      Storage.set('tish_profile', profile || {});
    }
  }

  function normalizeCurrency(currency, fallback = DEFAULT_CURRENCY) {
    const code = String(currency || '').toUpperCase();
    if (CURRENCY_META[code]) return code;
    const fb = String(fallback || '').toUpperCase();
    return CURRENCY_META[fb] ? fb : DEFAULT_CURRENCY;
  }

  function getCurrencyMeta(currency) {
    const code = normalizeCurrency(currency);
    return CURRENCY_META[code] || CURRENCY_META[DEFAULT_CURRENCY];
  }

  function getOrderCurrency(order, paymentType) {
    if (!order) return DEFAULT_CURRENCY;
    const regionFallback = String(order.region || '').toUpperCase() === 'RU' ? 'RUB' : DEFAULT_CURRENCY;
    if (paymentType === 'urgent_prepayment') {
      return normalizeCurrency(order.urgentCurrency || order.prepaymentCurrency || order.currency, regionFallback);
    }
    if (paymentType === 'prepayment') {
      return normalizeCurrency(order.prepaymentCurrency || order.currency, regionFallback);
    }
    return normalizeCurrency(order.currency || order.invoiceCurrency || order.prepaymentCurrency, regionFallback);
  }

  function formatMoney(amount, currency, withCode = false) {
    const num = Number(amount || 0);
    const rounded = Math.max(0, Math.round(num));
    const meta = getCurrencyMeta(currency);
    const spaced = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return withCode ? `${meta.symbol}${spaced} ${meta.label}` : `${meta.symbol}${spaced}`;
  }

  function getInvoiceBreakdown(order) {
    const base = Math.max(0, Math.round(Number(order?.invoiceAmount || 0)));
    const lines = (Array.isArray(order?.invoiceDiscounts) ? order.invoiceDiscounts : [])
      .map((line) => ({
        ...line,
        amount: Math.max(0, Math.round(Number(line?.amount || 0)))
      }))
      .filter((line) => line.amount > 0);
    const totalDiscount = lines.reduce((sum, line) => sum + line.amount, 0);
    const total = Math.max(0, base - totalDiscount);
    return { base, lines, totalDiscount, total };
  }

  function getCurrentOrderDiscountMeta(order) {
    const meta = order && typeof order.invoiceDiscountMeta === 'object' && order.invoiceDiscountMeta
      ? order.invoiceDiscountMeta
      : {};
    return {
      discountId: meta.discountId ?? null,
      promoCode: String(meta.promoCode || ''),
      tisharaSpent: Math.max(0, Math.round(Number(meta.tisharaSpent || 0)))
    };
  }

  function pushProfileTisharaHistory(profile, value, label) {
    if (!profile) return;
    profile.tisharaHistory = Array.isArray(profile.tisharaHistory) ? profile.tisharaHistory : [];
    profile.tisharaHistory.unshift({
      type: value < 0 ? 'spend' : 'refund',
      label,
      value,
      date: new Date().toISOString().split('T')[0]
    });
    if (profile.tisharaHistory.length > 50) {
      profile.tisharaHistory = profile.tisharaHistory.slice(0, 50);
    }
  }

  function getDiscountCandidates(profile, orderMeta) {
    const discounts = Array.isArray(profile?.discounts) ? profile.discounts : [];
    return discounts.filter((discount) => {
      const isActive = discount && discount.active !== false;
      const isCurrent = String(discount?.id ?? '') === String(orderMeta?.discountId ?? '');
      return isActive || isCurrent;
    });
  }

  function resolveInvoiceDiscountDraft(order, profile, selectedDiscountId, promoCodeRaw, tisharaRaw) {
    const breakdown = getInvoiceBreakdown({ invoiceAmount: order.invoiceAmount, invoiceDiscounts: [] });
    const base = breakdown.base;
    const meta = getCurrentOrderDiscountMeta(order);
    const candidates = getDiscountCandidates(profile, meta);

    const selected = candidates.find((d) => String(d?.id ?? '') === String(selectedDiscountId || '')) || null;
    const promoCode = String(promoCodeRaw || '').trim().toUpperCase();
    const promoDiscount = promoCode
      ? candidates.find((d) => String(d?.code || '').trim().toUpperCase() === promoCode) || null
      : null;

    if (promoCode && !promoDiscount) {
      return { ok: false, error: 'Промокод не найден среди активных скидок' };
    }

    const appliedDiscount = promoDiscount || selected;
    const percent = Math.max(0, Math.min(100, Number(appliedDiscount?.percent || 0)));
    const discountAmount = Math.min(base, Math.round(base * (percent / 100)));
    const maxAfterDiscount = Math.max(0, base - discountAmount);

    const prevSpent = Math.max(0, Math.round(Number(meta.tisharaSpent || 0)));
    const availableTishara = Math.max(0, Math.round(Number(profile?.tishara || 0))) + prevSpent;

    let requestedTishara = Math.max(0, Math.round(Number(tisharaRaw || 0)));
    if (!Number.isFinite(requestedTishara)) requestedTishara = 0;
    if (requestedTishara > availableTishara) {
      return { ok: false, error: 'Недостаточно TISHARA для списания' };
    }
    const tisharaSpent = Math.min(requestedTishara, maxAfterDiscount);

    const lines = [];
    if (appliedDiscount && discountAmount > 0) {
      lines.push({
        id: 'DISC-' + Date.now().toString(36).toUpperCase(),
        type: 'discount',
        discountId: appliedDiscount.id,
        code: appliedDiscount.code || '',
        source: appliedDiscount.source || 'Промокод',
        percent,
        amount: discountAmount,
        label: `${appliedDiscount.name || ('Скидка ' + percent + '%')}${appliedDiscount.code ? ' · ' + appliedDiscount.code : ''}`
      });
    }
    if (tisharaSpent > 0) {
      lines.push({
        id: 'TISH-' + Date.now().toString(36).toUpperCase(),
        type: 'tishara',
        amount: tisharaSpent,
        tisharaSpent,
        label: `Списание TISHARA · ${tisharaSpent} ✦`
      });
    }

    const final = Math.max(0, base - discountAmount - tisharaSpent);
    return {
      ok: true,
      base,
      final,
      lines,
      discount: appliedDiscount,
      promoCode,
      tisharaSpent,
      availableTishara,
      prevTisharaSpent: prevSpent,
      discountAmount
    };
  }

  function copyTextToClipboard(text, okMessage) {
    if (!text) return;
    if (typeof App !== 'undefined' && typeof App.copyToClipboard === 'function') {
      App.copyToClipboard(text);
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => App.showToast(okMessage || 'Скопировано', 'success'))
        .catch(() => App.showToast('Не удалось скопировать', 'warning'));
      return;
    }
    App.showToast('Буфер обмена недоступен', 'warning');
  }

  function getMessagePreview(msg) {
    if (!msg) return '';
    const t = (msg.text || '').replace(/<[^>]*>/g, '');
    if (msg.forwarded) return '↪ ' + t.slice(0, 40);
    if (msg.type === 'text') return t.slice(0, 50);
    if (msg.type === 'file') return '📎 Файл';
    if (msg.type === 'image') return '🖼 Фото';
    if (msg.type === 'voice') return '🎙 Голосовое';
    if (msg.type === 'invoice') return '💰 Счёт ' + formatMoney(msg.invoiceAmount, _resolveInvoiceCurrency(msg));
    if (msg.type === 'system') return t.slice(0, 50);
    return t.slice(0, 50);
  }

  // ===== GET CHATS =====
  function getChats() {
    _ensurePinnedSupportChat();
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const chats = [];
    const archived = getArchivedChats();
    const profile = getProfileData();

    orders.forEach(order => {
      if (order.chatId && (order.status !== 'pending_prepayment' || order.isUrgent)) {
        const messages = getMessages(order.chatId);
        if (messages.length === 0) {
          messages.push({
            id: 1, from: 'admin', type: 'text',
            text: order.isUrgent
              ? 'СРОЧНЫЙ ЗАКАЗ! Описание: "' + (order.urgentDescription || order.productName) + '". Сроки: ' + (order.urgentDeadline || 'Не указаны') + '. Ожидайте ответа администратора.'
              : 'Здравствуйте! Заказ ' + order.id + ' (' + order.productName + ') принят. Предоплата ' + formatMoney(order.prepayment, getOrderCurrency(order, 'prepayment')) + ' получена. Ожидайте ответа администратора.',
            time: formatTime(new Date(order.prepaidAt || order.createdAt)),
            reactions: {}
          });
          saveMessages(order.chatId, messages);
        }
        const lastMsg = messages[messages.length - 1];
        const unread = _countUnreadAdminMessages(messages, order.chatId, profile);
        chats.push({
          id: order.chatId, type: 'order', orderId: order.id,
          orderName: order.productName,
          orderGradient: order.productGradient || 'linear-gradient(135deg,var(--purple-500),var(--magenta-500))',
          orderImage: _resolveOrderImage(order),
          orderStatus: order.status, orderPrice: order.price,
          orderPrepayment: order.prepayment,
          isUrgent: order.isUrgent || false,
          isArchived: archived.includes(order.chatId),
          adminName: 'Администратор',
          lastMessage: getMessagePreview(lastMsg),
          lastTime: lastMsg ? lastMsg.time : '',
          lastToken: _messageToken(lastMsg, messages.length),
          unread, online: false, messages
        });
      }
    });

    // Support chat — per-user, нельзя архивировать и удалять
    const supportChatId = _getSupportChatId();
    const supportMsgs = getMessages(supportChatId);
    if (supportMsgs.length === 0) {
      supportMsgs.push({ id: 1, from: 'admin', type: 'text', text: 'Добро пожаловать в поддержку Tish Team! Выберите вопрос ниже или позовите администратора.', time: '09:00', reactions: {} });
      supportMsgs.push({ id: 2, from: 'system', type: 'system', text: 'Ответ администратора приходит в течение 12 часов', time: '09:00' });
      saveMessages(supportChatId, supportMsgs);
    }
    const lastS = supportMsgs[supportMsgs.length - 1];
    chats.push({
      id: supportChatId, type: 'support', orderId: null,
      orderName: 'Поддержка', orderGradient: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
      orderImage: null,
      orderStatus: null, isUrgent: false, isArchived: false,
      adminName: 'Tish Team',
      lastMessage: getMessagePreview(lastS), lastTime: lastS ? lastS.time : '',
      unread: _countUnreadAdminMessages(supportMsgs, supportChatId, profile),
      lastToken: _messageToken(lastS, supportMsgs.length),
      online: isAdminOnline(), messages: supportMsgs
    });

    chats.sort((a, b) => {
      const byToken = Number(b.lastToken || 0) - Number(a.lastToken || 0);
      if (byToken !== 0) return byToken;
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
    return chats;
  }

  // ===== RENDER =====
  function render() {
    _stopPresencePolling();
    const page = document.getElementById('chatPage');
    if (!page) return;
    page.innerHTML = `
      <div class="chat-list" id="chatList">
        <div class="chat-list__header">
          <h2 class="chat-list__title">${IC.chat} Чаты</h2>
          <div class="chat-list__tabs">
            <button class="chat-list__tab active" onclick="Chat._setListTab('active',this)">Активные</button>
            <button class="chat-list__tab" onclick="Chat._setListTab('archive',this)">Архив</button>
          </div>
          <div class="chat-list__search">
            <svg class="chat-list__search-icon" viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="chat-list__search-input" placeholder="Поиск..." oninput="Chat.filterChats(this.value)">
          </div>
        </div>
        <div class="chat-list__items" id="chatListItems"></div>
      </div>
      <div class="chat-window" id="chatWindow">
        <div class="chat-window--empty">
          <div class="chat-empty">
            <div class="chat-empty__icon">${IC.chat}</div>
            <h3 class="chat-empty__title">НЕТ АКТИВНЫХ ЧАТОВ</h3>
            <p class="chat-empty__desc">Когда появится новый чат, он отобразится в этом разделе</p>
          </div>
        </div>
      </div>`;
    renderChatList();
    const chats = getChats();
    const hasActive = activeChatId && chats.find(c => c.id === activeChatId);
    if (hasActive && !_isMobileChatViewport()) {
      openChat(activeChatId);
    } else {
      activeChatId = null;
      _mobileLayoutMode = 'list';
      _syncMobileChatLayout();
    }
  }

  let _currentTab = 'active';

  function _setListTab(tab, btn) {
    _currentTab = tab;
    document.querySelectorAll('.chat-list__tab').forEach(b => b.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      const target = document.querySelector(`.chat-list__tab[onclick*=\"${tab}\"]`);
      if (target) target.classList.add('active');
    }
    renderChatList();
  }

  function renderChatList(filter) {
    const c = document.getElementById('chatListItems');
    if (!c) return;
    const prevScrollTop = c.scrollTop;
    let chats = getChats();
    if (filter) {
      const q = filter.toLowerCase();
      chats = chats.filter(ch => ch.orderName.toLowerCase().includes(q));
    }

    // Фильтр по табу
    const isArchiveTab = _currentTab === 'archive';
    let filtered = chats.filter(ch => ch.type === 'support' ? !isArchiveTab : ch.isArchived === isArchiveTab);

    // Сортировка: закреплённые сверху, дальше — по свежести
    filtered.sort((a, b) => {
    const aPinned = _pinnedChats.includes(a.id);
    const bPinned = _pinnedChats.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    // Среди закреплённых — support первым
    if (aPinned && bPinned) {
        if (a.type === 'support') return -1;
        if (b.type === 'support') return 1;
    }
    const byToken = Number(b.lastToken || 0) - Number(a.lastToken || 0);
    if (byToken !== 0) return byToken;
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return String(a.id || '').localeCompare(String(b.id || ''));
    });
    
    if (filtered.length === 0) {
      c.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--color-muted);">
        ${isArchiveTab ? 'АРХИВ ПУСТ' : 'НЕТ АКТИВНЫХ ЧАТОВ'}
      </div>`;
      c.scrollTop = 0;
      return;
    }

    c.innerHTML = filtered.map(chat => {
      const sc = STATUS_COLORS[chat.orderStatus] || '#6b7280';
      const sl = STATUS_LABELS[chat.orderStatus] || '';
      const canManage = chat.type !== 'support';
      return `<div class="chat-item ${activeChatId===chat.id?'active':''} 
        ${chat.isUrgent?'chat-item--urgent':''} 
        ${chat.isArchived?'chat-item--archived':''} 
        ${_pinnedChats.includes(chat.id)?'chat-item--pinned':''}" 
        onclick="Chat.openChat('${chat.id}')">
        ${_pinnedChats.includes(chat.id) ? '<div class="chat-item__pin-indicator"></div>' : ''}
        ${_renderOrderAvatar(chat, 'chat-item__avatar')}
        <div class="chat-item__info">
          <div class="chat-item__name">${chat.isUrgent?'<span class="chat-urgent-badge">СРОЧНО</span> ':''}${chat.type==='support'?'Tish Team':chat.orderName}</div>
          <div class="chat-item__preview">${chat.lastMessage}</div>
          ${sl?`<div style="font-size:0.65rem;color:${sc};font-weight:600;margin-top:2px;">${sl}</div>`:''}
        </div>
        <div class="chat-item__meta">
          <div class="chat-item__time">${chat.lastTime}</div>
          ${chat.unread>0?`<span class="chat-item__unread">${chat.unread}</span>`:''}
        </div>
        ${canManage ? `<div class="chat-item__actions" onclick="event.stopPropagation()">
        ${chat.isArchived
            ? `<button class="chat-item__action-btn" title="Из архива" onclick="Chat.unarchiveChat('${chat.id}')">${IC.unarchive}</button>`
            : `<button class="chat-item__action-btn" title="В архив" onclick="Chat.archiveChat('${chat.id}')">${IC.archive}</button>`
        }
        <button class="chat-item__action-btn ${_pinnedChats.includes(chat.id) ? 'chat-item__action-btn--active' : ''}" 
            title="${_pinnedChats.includes(chat.id) ? 'Открепить' : 'Закрепить'}" 
            onclick="Chat.togglePinChat('${chat.id}')">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="${_pinnedChats.includes(chat.id) ? '#8b5cf6' : 'none'}" stroke="${_pinnedChats.includes(chat.id) ? '#8b5cf6' : 'currentColor'}" stroke-width="2">
            <path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.76z"/>
            </svg>
        </button>
        </div>` : ''}
      </div>`;
    }).join('');

    const maxScroll = Math.max(0, c.scrollHeight - c.clientHeight);
    c.scrollTop = Math.min(prevScrollTop, maxScroll);
  }

  function filterChats(q) { renderChatList(q); }

  // ===== OPEN CHAT =====
  function openChat(chatId) {
    activeChatId = chatId;
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    const messages = getMessages(chatId);
    let hasChanges = false;
    let lastAdminToken = 0;
    messages.forEach((m, idx) => {
      if (m && m.from === 'admin') {
        lastAdminToken = Math.max(lastAdminToken, _messageToken(m, idx + 1));
        if (!m.read) {
          m.read = true;
          hasChanges = true;
        }
      }
    });
    if (lastAdminToken > 0) {
      _setChatReadToken(chatId, lastAdminToken);
    }
    if (hasChanges) {
      saveMessages(chatId, messages);
    }
    renderChatList();
    updateChatBadge();

    const w = document.getElementById('chatWindow');
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const order = orders.find(o => _sameId(o.chatId, chatId));
    const isSupportChat = chat.type === 'support';
    const isCompleted = order && order.status === 'completed';
    const hasReviewed = order && order.reviewed;
    const isLocked = _isOrderChatLocked(order);
    const adminOnline = isSupportChat ? isAdminOnline() : false;
    const orderStatusText = order ? (STATUS_LABELS[order.status] || 'Чат по заказу') : 'Чат по заказу';

    w.innerHTML = `
      <div class="chat-window__header">
        <button class="chat-back-btn" onclick="Chat.showChatList()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        ${_renderOrderAvatar(chat, 'chat-window__avatar')}
        <div class="chat-window__info">
          <div class="chat-window__name">${isSupportChat?'Tish Team':(chat.orderName || chat.adminName)}</div>
          <div class="chat-window__status ${isSupportChat && !adminOnline ? 'chat-window__status--offline' : ''}">${isSupportChat ? (adminOnline ? '<span class="chat-window__status-dot"></span>В сети' : 'Не в сети') : orderStatusText}</div>
        </div>
        ${chat.orderId?`<span class="chat-window__order-tag">${chat.orderId}</span>`:''}
      </div>
      ${chat.orderStatus==='invoice_sent'?renderInvoiceBanner(chat,order):''}
      ${order && (order.status === 'prepayment_verification' || order.status === 'payment_verification') ? renderPaymentVerificationBanner(order) : ''}
      ${order&&order.isUrgent&&order.status==='pending_prepayment'&&!order.urgentPrepaid?renderUrgentPrepayBanner(order):''}
      ${isLocked ? '<div class="chat-order-locked-note">Этот чат закрыт после завершения заказа. Вы можете оставить отзыв ниже.</div>' : ''}
      <div class="chat-messages" id="chatMessages"></div>
      ${isSupportChat ? renderFaqToggle() + renderFaqPanelHTML() : ''}
      ${isCompleted && !hasReviewed ? renderReviewPrompt(order) : ''}
      ${isCompleted && hasReviewed ? renderReviewDone() : ''}
      <div class="chat-input ${isLocked ? 'chat-input--disabled' : ''}" id="chatInput">
        <div class="chat-input__attachments" id="chatAttachments"></div>
        <div class="chat-input__recording" id="chatRecording" style="display:none;">
          <div class="chat-input__recording-dot"></div>
          <div class="chat-input__recording-time" id="recordingTime">0:00</div>
          <button class="chat-input__recording-cancel" onclick="Chat.cancelRecording()">Отмена</button>
          <button class="btn btn-primary btn-sm" onclick="Chat.stopRecording()" style="padding:6px 14px;">Отправить</button>
        </div>
        <div class="chat-input__row" id="chatInputRow">
          <div class="chat-input__actions">
            <button class="chat-input__action-btn" data-tooltip="Фото" style="position:relative;">
              ${IC.image}
              <input type="file" multiple accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp" onchange="Chat.addImages(this)" style="position:absolute;inset:0;opacity:0;cursor:pointer;" ${isLocked ? 'disabled' : ''}>
            </button>
            <button class="chat-input__action-btn" data-tooltip="Файл" style="position:relative;">
              ${IC.file}
              <input type="file" multiple accept="*/*" onchange="Chat.addFiles(this)" style="position:absolute;inset:0;opacity:0;cursor:pointer;" ${isLocked ? 'disabled' : ''}>
            </button>
            <button class="chat-input__action-btn ${isRecording?'chat-input__action-btn--recording':''}" data-tooltip="Голосовое" onclick="Chat.toggleRecording()" id="voiceBtn" ${isLocked ? 'disabled' : ''}>
              ${IC.mic}
            </button>
          </div>
          <textarea class="chat-input__field" id="chatTextField" placeholder="${isLocked ? 'Чат закрыт после завершения заказа' : 'Сообщение...'}" rows="1" onkeydown="Chat.handleKey(event)" oninput="Chat.autoResize(this)" ${isLocked ? 'disabled' : ''}></textarea>
          <button class="chat-input__send" onclick="Chat.sendMessage()" ${isLocked ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>`;

    renderMessages(chatId);
    renderPinnedBar();

    // Pull fresh messages from server in background (so admin replies appear)
    refreshMessagesFromServer(chatId);

    if (isSupportChat) {
      refreshAdminPresence(true).then(() => {
        if (activeChatId === chatId) {
          renderChatList();
          _updateActiveHeaderPresence();
        }
      });
      _ensurePresencePolling(chatId);
    } else {
      _stopPresencePolling();
    }

    // Восстанавливаем состояние FAQ панели
    const faqPanel = document.getElementById('chatFaqPanel');
    const faqToggle = document.getElementById('chatFaqToggle');
    if (faqPanel && faqToggle) {
      if (!faqPanelOpen) {
        faqPanel.classList.add('chat-faq-panel--hidden');
        faqToggle.classList.remove('chat-faq-toggle--open');
      } else {
        faqToggle.classList.add('chat-faq-toggle--open');
      }
    }

    _mobileLayoutMode = 'chat';
    _syncMobileChatLayout();
  }

  // ===== REVIEW PROMPT =====
  function renderReviewPrompt(order) {
    return `<div class="chat-review-prompt" id="chatReviewPrompt">
      <div class="chat-review-prompt__title">${IC.star} Заказ завершён!</div>
      <div class="chat-review-prompt__desc">Вы можете оставить отзыв о товаре (по желанию)</div>
      <button class="chat-review-prompt__btn" onclick="Chat.openReviewFromChat('${order.id}')">
        ${IC.star} Оставить отзыв
      </button>
    </div>`;
  }

  function renderReviewDone() {
    return `<div class="chat-review-done">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      Спасибо за ваш отзыв!
    </div>`;
  }

  function openReviewFromChat(orderId) {
    try {
      const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
      const order = orders.find(o => _sameId(o.id, orderId));
      if (!order) { App.showToast('Заказ не найден', 'error'); return; }
      if (typeof Profile !== 'undefined' && Profile.openWriteReview) {
        Profile.openWriteReview(order.productId || '', order.productName || 'Товар', order.id);
      } else {
        App.showToast('Перейдите в профиль для отзыва', 'info');
      }
    } catch(e) {
      console.warn('openReviewFromChat error:', e);
    }
  }

  // ===== FAQ PANEL — с кнопкой-подсказкой =====
  function renderFaqToggle() {
    return `<div class="chat-faq-toggle chat-faq-toggle--open" id="chatFaqToggle" onclick="Chat.toggleFaqPanel()">
      <span class="chat-faq-toggle__label">${IC.support} Частые вопросы и помощь</span>
      <span class="chat-faq-toggle__arrow">${IC.chevronDown}</span>
    </div>`;
  }

  function renderFaqPanelHTML() {
    return `<div class="chat-faq-panel" id="chatFaqPanel">
      <div class="chat-faq-panel__items">
        ${FAQ_ITEMS.map((item, i) => `<button class="chat-faq-btn" onclick="Chat.askFaq(${i})">${item.q}</button>`).join('')}
      </div>
      <button class="chat-faq-call-admin" onclick="Chat.callAdmin()">
        ${IC.bellRing} Позвать администратора
      </button>
      <div class="chat-faq-notice">${IC.clock} Ответ администратора в течение 12 часов</div>
    </div>`;
  }

  function toggleFaqPanel() {
    faqPanelOpen = !faqPanelOpen;
    const panel = document.getElementById('chatFaqPanel');
    const toggle = document.getElementById('chatFaqToggle');
    if (panel) panel.classList.toggle('chat-faq-panel--hidden', !faqPanelOpen);
    if (toggle) toggle.classList.toggle('chat-faq-toggle--open', faqPanelOpen);
  }

  function askFaq(index) {
    const faq = FAQ_ITEMS[index];
    const supportId = _getSupportChatId();
    if (!faq || activeChatId !== supportId) return;
    const msgs = getMessages(supportId);
    msgs.push({ id: Date.now(), from: 'user', type: 'text', text: faq.q, time: formatTime(new Date()), reactions: {} });
    saveMessages(supportId, msgs);
    renderMessages(supportId);
    setTimeout(() => {
      const m2 = getMessages(supportId);
      m2.push({ id: Date.now() + 1, from: 'admin', type: 'text', text: faq.a, time: formatTime(new Date()), read: false, reactions: {} });
      saveMessages(supportId, m2);
      renderMessages(supportId);
      renderChatList();
    }, 600);
  }

  // ===== FIX: callAdmin — теперь отправляет реальное уведомление =====
  function callAdmin() {
    const supportId = _getSupportChatId();
    if (activeChatId !== supportId) return;
    const msgs = getMessages(supportId);
    const profile = JSON.parse(localStorage.getItem('tish_profile') || '{}');
    const userName = (profile.username || profile.name || profile.email || 'Пользователь');

    const callMessage = {
      id: Date.now(),
      from: 'user',
      type: 'text',
      text: '🔔 Хочу связаться с администратором',
      time: formatTime(new Date()),
      reactions: {}
    };
    const systemMessage = {
      id: Date.now() + 1,
      from: 'system',
      type: 'system',
      text: 'Уведомление отправлено администратору. Ожидайте ответа.'
    };
    msgs.push(callMessage);
    msgs.push(systemMessage);
    saveMessages(supportId, msgs);
    renderMessages(supportId);
    renderChatList();
    _pushMessagesNow(supportId, [callMessage, systemMessage]);

    // Отправляем уведомление на сервер в admin log
    try {
      fetch('/api/store/admin/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'call_admin',
          details: `Пользователь "${userName}" запросил помощь администратора в чате поддержки`,
          chatId: supportId,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch(e) {}

    // Сохраняем в localStorage для админ-панели
    const adminNotifs = JSON.parse(localStorage.getItem('tish_admin_notifications') || '[]');
    adminNotifs.unshift({
      id: Date.now(),
      type: 'call_admin',
      user: userName,
      chatId: supportId,
      message: `Пользователь "${userName}" зовёт администратора`,
      time: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('tish_admin_notifications', JSON.stringify(adminNotifs));
    if (typeof Storage !== 'undefined') {
      if (typeof Storage.setNow === 'function') {
        Storage.setNow('tish_admin_notifications', adminNotifs).catch(() => {
          if (typeof Storage.set === 'function') Storage.set('tish_admin_notifications', adminNotifs);
        });
      } else if (typeof Storage.set === 'function') {
        Storage.set('tish_admin_notifications', adminNotifs);
      }
    }

    App.showToast('Уведомление отправлено администратору!', 'success');
  }

  function getCurrentReactionActor() {
    try {
      const profile = JSON.parse(localStorage.getItem('tish_profile') || '{}');
      if (profile.googleId) return 'user_' + profile.googleId;
    } catch {}
    return 'user';
  }

  function normalizeReactionActors(value) {
    const actors = {};
    if (value === true) {
      actors.legacy = true;
      return actors;
    }
    if (typeof value === 'number' && value > 0) {
      for (let i = 0; i < value; i++) actors['legacy' + i] = true;
      return actors;
    }
    if (Array.isArray(value)) {
      value.forEach((actor, idx) => {
        if (actor !== undefined && actor !== null) actors[String(actor)] = true;
        else actors['legacy' + idx] = true;
      });
      return actors;
    }
    if (value && typeof value === 'object') {
      let hasAny = false;
      Object.entries(value).forEach(([k, v]) => {
        if (v) {
          actors[k] = true;
          hasAny = true;
        }
      });
      if (!hasAny && typeof value.count === 'number' && value.count > 0) {
        for (let i = 0; i < value.count; i++) actors['legacy' + i] = true;
      }
    }
    return actors;
  }

  function reactionCount(value) {
    return Object.keys(normalizeReactionActors(value)).length;
  }

  function mergeReactionMaps(a, b) {
    const out = {};
    const srcA = (a && typeof a === 'object') ? a : {};
    const srcB = (b && typeof b === 'object') ? b : {};
    const names = new Set([...Object.keys(srcA), ...Object.keys(srcB)]);
    names.forEach((name) => {
      const actors = {
        ...normalizeReactionActors(srcA[name]),
        ...normalizeReactionActors(srcB[name])
      };
      if (Object.keys(actors).length > 0) out[name] = actors;
    });
    return out;
  }

  function mergeMessage(oldMsg, newMsg) {
    if (!oldMsg) return newMsg;
    if (!newMsg) return oldMsg;
    const merged = { ...oldMsg, ...newMsg };
    merged.reactions = mergeReactionMaps(oldMsg.reactions, newMsg.reactions);
    if (oldMsg.deleted || newMsg.deleted) merged.deleted = true;
    return merged;
  }

  function mergeMessageLists(serverMsgs, localMsgs) {
    const merged = new Map();
    (Array.isArray(serverMsgs) ? serverMsgs : []).forEach((m) => {
      if (m && m.id !== undefined && m.id !== null) merged.set(m.id, m);
    });
    (Array.isArray(localMsgs) ? localMsgs : []).forEach((m) => {
      if (!m || m.id === undefined || m.id === null) return;
      const prev = merged.get(m.id);
      merged.set(m.id, mergeMessage(prev, m));
    });
    return Array.from(merged.values()).sort((a, b) => (a.id || 0) - (b.id || 0));
  }

  // ===== FIX: REACTIONS — правильное позиционирование =====
  function toggleReactionMenu(msgId) {
    const existing = document.getElementById('reactionMenu_' + msgId);
    if (existing) { existing.remove(); return; }
    document.querySelectorAll('.chat-reaction-menu').forEach(m => m.remove());

    const msgEl = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (!msgEl) return;

    const menu = document.createElement('div');
    menu.className = 'chat-reaction-menu';
    menu.id = 'reactionMenu_' + msgId;
    menu.innerHTML = REACTIONS.map(r =>
      `<button class="chat-reaction-btn" onclick="Chat.addReaction(${msgId},'${r.name}')" title="${r.label}">${r.emoji}</button>`
    ).join('');

    // FIX: добавляем меню в .chat-msg__content, а не в .chat-msg
    const content = msgEl.querySelector('.chat-msg__content');
    if (content) {
      content.appendChild(menu);
    }

    setTimeout(() => menu.classList.add('chat-reaction-menu--visible'), 10);

    // Закрываем при клике вне
    const closeHandler = (e) => {
      if (!menu.contains(e.target) && !e.target.closest('.chat-msg__react-btn')) {
        menu.classList.remove('chat-reaction-menu--visible');
        setTimeout(() => menu.remove(), 200);
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 50);
  }

  function addReaction(msgId, reactionName) {
    if (!activeChatId) return;
    _withScrollLock(() => {
      const msgs = getMessages(activeChatId);
      const msg = msgs.find(m => m.id === msgId);
      if (!msg) return;
      if (!msg.reactions) msg.reactions = {};

      const actor = getCurrentReactionActor();
      const actors = normalizeReactionActors(msg.reactions[reactionName]);
      if (actors[actor]) {
        delete actors[actor];
      } else {
        actors[actor] = true;
      }

      if (Object.keys(actors).length === 0) {
        delete msg.reactions[reactionName];
      } else {
        msg.reactions[reactionName] = actors;
      }

      saveMessages(activeChatId, msgs);
      document.querySelectorAll('.chat-reaction-menu').forEach(m => m.remove());
      renderMessages(activeChatId);
    });
  }

  function renderReactions(msg) {
    if (!msg.reactions) return '';
    const keys = Object.keys(msg.reactions).filter(k => reactionCount(msg.reactions[k]) > 0);
    if (keys.length === 0) return '';
    return `<div class="chat-msg__reactions">${keys.map(k => {
      const r = REACTIONS.find(x => x.name === k);
      if (!r) return '';
      const count = reactionCount(msg.reactions[k]);
      const actor = getCurrentReactionActor();
      const isMine = !!normalizeReactionActors(msg.reactions[k])[actor];
      return `<span class="chat-msg__reaction ${isMine ? 'chat-msg__reaction--active' : ''}" onclick="Chat.addReaction(${msg.id},'${k}')">${r.emoji}${count > 1 ? `<span class="reaction-count">${count}</span>` : ''}</span>`;
    }).join('')}</div>`;
  }

  // ===== RENDER MESSAGES =====
  function renderMessages(chatId) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const wasAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 80;
    const savedScroll = container.scrollTop;
    const messages = getMessages(chatId).filter(m => !m.deleted);
    container.innerHTML = '<div class="chat-date-sep">Сегодня</div>' +
      messages.map(msg => renderMessage(msg)).join('');

    if (_noAutoScroll) {
      container.scrollTop = savedScroll;
      requestAnimationFrame(() => { container.scrollTop = savedScroll; });
    } else if (wasAtBottom) {
      scrollToBottom();
    } else {
      container.scrollTop = savedScroll;
    }
  }

  function renderMessage(msg) {
    const isUser = msg.from === 'user';
    const cls = isUser ? 'chat-msg--user' : 'chat-msg--admin';
    const isSelected = selectedMessages.has(msg.id);
    let content = '';

    // Reply quote
    let replyHtml = '';
    if (msg.replyTo) {
      const allMsgs = getMessages(activeChatId);
      const original = allMsgs.find(m => m.id === msg.replyTo);
      if (original) {
        const replyName = original.from === 'user' ? 'Вы' : 'Администратор';
        const replyText = (original.text || 'Медиа').replace(/<[^>]*>/g, '').slice(0, 60);
        replyHtml = `<div class="chat-msg__reply" onclick="Chat.scrollToMessage(${msg.replyTo})">
          <div class="chat-msg__reply-name">${replyName}</div>
          <div class="chat-msg__reply-text">${escapeHtml(replyText)}</div>
        </div>`;
      }
    }

    // FIX: Forwarded label с иконкой
    let forwardedHtml = '';
    if (msg.forwarded) {
      forwardedHtml = `<div class="chat-msg__forwarded">${IC.forward} Переслано</div>`;
    }

    switch (msg.type) {
      case 'text':
        content = `${replyHtml}${forwardedHtml}<div class="chat-msg__bubble">${escapeHtml(msg.text)}</div>`;
        break;
      case 'file':
        content = `${replyHtml}${forwardedHtml}<div class="chat-msg__file" onclick="Chat.openFilePreviewById(${msg.id})">
          <div class="chat-msg__file-icon">${IC.file}</div>
          <div class="chat-msg__file-info"><div class="chat-msg__file-name">${msg.fileName||'Файл'}</div><div class="chat-msg__file-size">${msg.fileSize||''}${msg.mimeType ? ` • ${escapeHtml(msg.mimeType)}` : ''}</div></div>
        </div>`;
        break;
      case 'image':
        content = `${replyHtml}${forwardedHtml}<div class="chat-msg__image" onclick="Chat.openImagePreviewById(${msg.id})">
          ${msg.imageData ? `<img src="${msg.imageData}" alt="Фото">` : `<div class="chat-msg__image-placeholder">${IC.image}</div>`}
        </div>`;
        break;
      case 'voice':
        content = `${replyHtml}<div class="chat-msg__bubble chat-msg__voice">
          <button class="chat-msg__voice-btn" onclick="Chat.playVoiceById(this,${msg.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <div class="chat-msg__voice-wave">${genVoiceBars()}</div>
          <span class="chat-msg__voice-dur">${msg.duration||'0:00'}</span>
        </div>`;
        break;
      case 'invoice':
        const invoiceCurrency = _resolveInvoiceCurrency(msg, activeChatId);
        content = `<div class="chat-msg__bubble chat-msg__invoice">
          <div style="font-weight:700;margin-bottom:4px;">${IC.invoice} Счёт выставлен</div>
          <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:800;">${formatMoney(msg.invoiceAmount, invoiceCurrency, true)}</div>
        </div>`;
        break;
      case 'system':
        return `<div class="chat-date-sep" style="color:var(--purple-500);">${msg.text}</div>`;
      default:
        content = `<div class="chat-msg__bubble">${msg.text||''}</div>`;
    }

    const selectMode = selectedMessages.size > 0;

    return `<div class="chat-msg ${cls} ${isSelected ? 'chat-msg--selected' : ''}" data-msg-id="${msg.id}">
      ${selectMode ? `<label class="chat-msg__checkbox" onclick="event.stopPropagation();Chat.toggleSelectMessage(${msg.id})">
        <div class="chat-msg__check ${isSelected ? 'chat-msg__check--active' : ''}">
          ${isSelected ? IC.check : ''}
        </div>
      </label>` : ''}
      ${!isUser ? `<div class="chat-msg__avatar" style="background:linear-gradient(135deg,var(--purple-400),var(--magenta-400))"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width:16px;height:16px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>` : ''}
      <div class="chat-msg__content">
        ${content}
        ${renderReactions(msg)}
        <div class="chat-msg__meta">
          <span class="chat-msg__time">${msg.time||''}</span>
          <button class="chat-msg__react-btn" onclick="Chat.toggleReactionMenu(${msg.id})">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }

  function genVoiceBars() {
    let b = '';
    for (let i = 0; i < 24; i++) b += `<div class="chat-msg__voice-bar" style="height:${4+Math.random()*20}px"></div>`;
    return b;
  }

  function escapeHtml(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  // ===== SCROLL =====
  function scrollToBottom() {
    if (_noAutoScroll) return;
    const c = document.getElementById('chatMessages');
    if (c) requestAnimationFrame(() => requestAnimationFrame(() => { c.scrollTop = c.scrollHeight + 9999; }));
  }

  // ===== FILE HANDLING =====
  function addImages(inp) {
    if (_isActiveChatLocked()) {
      App.showToast('Чат закрыт после завершения заказа', 'info');
      inp.value = '';
      return;
    }
    if (!inp.files.length) return;
    Array.from(inp.files).forEach(f => {
      if (!_canAttach(f)) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        attachments.push({
          type: 'image',
          name: f.name,
          size: fmtSize(f.size),
          bytes: f.size,
          mimeType: f.type || 'image/*',
          imageData: ev.target.result
        });
        renderAttachments();
      };
      reader.readAsDataURL(f);
    });
    inp.value = '';
  }

  function addFiles(inp) {
    if (_isActiveChatLocked()) {
      App.showToast('Чат закрыт после завершения заказа', 'info');
      inp.value = '';
      return;
    }
    if (!inp.files.length) return;
    Array.from(inp.files).forEach(f => {
      if (!_canAttach(f)) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (f.type.startsWith('image/')) {
          attachments.push({
            type: 'image',
            name: f.name,
            size: fmtSize(f.size),
            bytes: f.size,
            mimeType: f.type || 'image/*',
            imageData: ev.target.result
          });
        } else {
          attachments.push({
            type: 'file',
            name: f.name,
            size: fmtSize(f.size),
            bytes: f.size,
            mimeType: f.type || 'application/octet-stream',
            fileData: ev.target.result
          });
        }
        renderAttachments();
      };
      reader.readAsDataURL(f);
    });
    inp.value = '';
  }

  function removeAttachment(i) { attachments.splice(i, 1); renderAttachments(); }

  function renderAttachments() {
    const c = document.getElementById('chatAttachments');
    if (!c) return;
    if (attachments.length === 0) { c.innerHTML = ''; return; }
    c.innerHTML = attachments.map((a, i) => `<div class="chat-input__attachment">
      ${a.type === 'image' && a.imageData ? `<img src="${a.imageData}" style="width:24px;height:24px;border-radius:4px;object-fit:cover;">` : IC.file}
      <span style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.name}</span>
      <button class="chat-input__attachment-remove" onclick="Chat.removeAttachment(${i})">${IC.x}</button>
    </div>`).join('');
  }

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  // ===== SEND MESSAGE =====
  function sendMessage() {
    if (_isActiveChatLocked()) {
      App.showToast('Чат закрыт после завершения заказа. Оставьте отзыв.', 'info');
      return;
    }
    const field = document.getElementById('chatTextField');
    if (!field || !activeChatId) return;
    const text = field.value.trim();
    if (!text && attachments.length === 0) return;
    const messages = getMessages(activeChatId);
    const time = formatTime(new Date());
    const outbound = [];
    attachments.forEach(att => {
      const msg = {
        id: Date.now() + Math.random(), from: 'user', type: att.type,
        fileName: att.name, fileSize: att.size, bytes: att.bytes || 0, mimeType: att.mimeType || '', imageData: att.imageData, fileData: att.fileData,
        time, read: false, reactions: {},
        replyTo: replyingTo ? replyingTo.id : null
      };
      messages.push(msg);
      outbound.push(msg);
    });
    if (text) {
      const msg = {
        id: Date.now(), from: 'user', type: 'text', text, time, read: false,
        reactions: {}, replyTo: replyingTo ? replyingTo.id : null
      };
      messages.push(msg);
      outbound.push(msg);
    }
    saveMessages(activeChatId, messages);
    field.value = '';
    field.style.height = 'auto';
    attachments = [];
    replyingTo = null;
    cancelReply();
    renderAttachments();
    renderMessages(activeChatId);
    renderChatList();
    _pushMessagesNow(activeChatId, outbound);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  // ===== VOICE =====
  function toggleRecording() { isRecording ? stopRecording() : startRecording(); }

  async function startRecording() {
    if (_isActiveChatLocked()) {
      App.showToast('Чат закрыт после завершения заказа', 'info');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = () => stream.getTracks().forEach(t => t.stop());
      mediaRecorder.start();
      isRecording = true;
      recordingSeconds = 0;
      document.getElementById('chatRecording').style.display = 'flex';
      document.getElementById('chatInputRow').style.display = 'none';
      recordingTimer = setInterval(() => {
        recordingSeconds++;
        const el = document.getElementById('recordingTime');
        if (el) el.textContent = `${Math.floor(recordingSeconds/60)}:${(recordingSeconds%60).toString().padStart(2,'0')}`;
      }, 1000);
    } catch { App.showToast('Микрофон недоступен', 'error'); }
  }

  function stopRecording() {
    if (!mediaRecorder || !isRecording) return;
    mediaRecorder.stop();
    isRecording = false;
    clearInterval(recordingTimer);
    document.getElementById('chatRecording').style.display = 'none';
    document.getElementById('chatInputRow').style.display = 'flex';
    const duration = `${Math.floor(recordingSeconds/60)}:${(recordingSeconds%60).toString().padStart(2,'0')}`;
    setTimeout(() => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        const msgs = getMessages(activeChatId);
        const voiceMessage = { id: Date.now(), from: 'user', type: 'voice', duration, audioData: reader.result, time: formatTime(new Date()), reactions: {} };
        msgs.push(voiceMessage);
        saveMessages(activeChatId, msgs);
        renderMessages(activeChatId);
        renderChatList();
        _pushMessagesNow(activeChatId, [voiceMessage]);
      };
      reader.readAsDataURL(blob);
    }, 100);
  }

  function cancelRecording() {
    if (mediaRecorder && isRecording) mediaRecorder.stop();
    isRecording = false;
    clearInterval(recordingTimer);
    audioChunks = [];
    document.getElementById('chatRecording').style.display = 'none';
    document.getElementById('chatInputRow').style.display = 'flex';
  }

  // ===== PREVIEWS =====
  function openImagePreviewById(msgId) {
    const msg = _findMessageById(msgId);
    if (!msg || !msg.imageData) return;
    openImagePreview(msg.imageData);
  }

  function openImagePreview(data) {
    if (!data) return;
    let m = document.getElementById('imagePreviewModal');
    if (m) m.remove();
    m = document.createElement('div');
    m.id = 'imagePreviewModal';
    m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;cursor:pointer;';
    m.onclick = () => m.remove();
    m.innerHTML = `<img src="${data}" style="max-width:90%;max-height:90%;border-radius:12px;">`;
    document.body.appendChild(m);
  }

  function openFilePreviewById(msgId) {
    const msg = _findMessageById(msgId);
    if (!msg || !msg.fileData) return;
    openFilePreview(msg.fileName || 'Файл', msg.fileData, msg.mimeType || '');
  }

  function openFilePreview(name, data, mimeType = '') {
    if (!data) return;
    const a = document.createElement('a');
    a.href = data;
    a.download = name || 'file';
    a.target = '_blank';
    a.rel = 'noopener';
    if (mimeType === 'application/pdf') a.target = '_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function playVoiceById(btn, msgId) {
    const msg = _findMessageById(msgId);
    if (!msg || !msg.audioData) return;
    playVoice(btn, msg.audioData);
  }

  function playVoice(btn, data) {
    if (data) {
      const audio = new Audio(data);
      audio.play();
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
      audio.onended = () => { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; };
    }
  }

  function showChatList() {
    _mobileLayoutMode = 'list';
    _syncMobileChatLayout();
  }

  // ===== INVOICE =====
  function renderInvoiceBanner(chat, order) {
    if (!order || !order.invoiceAmount) return '';
    const currency = getOrderCurrency(order, 'invoice');
    const breakdown = getInvoiceBreakdown(order);
    const method = PAYMENT_METHODS.sber_card;
    const discountRows = breakdown.lines.map((line) => `
      <div style="display:flex;justify-content:space-between;gap:8px;font-size:0.8rem;color:var(--color-muted);">
        <span>${escapeHtml(line.label || 'Скидка')}</span>
        <strong style="color:#22c55e;">− ${formatMoney(line.amount, currency)}</strong>
      </div>
    `).join('');

    return `<div class="chat-invoice-banner"><div class="chat-invoice-banner__header">${IC.invoice} Счёт за заказ ${order.id}</div>
      <div class="chat-invoice-banner__amount">
        <div>Сумма: <strong>${formatMoney(breakdown.base, currency)}</strong></div>
        ${discountRows ? `<div style="margin-top:8px;display:grid;gap:4px;">${discountRows}</div>` : ''}
        <div style="font-family:var(--font-mono);font-weight:800;font-size:1.1rem;color:var(--purple-600);margin-top:8px;">Итого: ${formatMoney(breakdown.total, currency, true)}</div>
        <div style="font-size:0.8rem;color:var(--color-muted);margin-top:6px;display:grid;gap:2px;">
          <span>Оплата: ${method.label}, ${method.cardNumber}</span>
          <span>Получатель: ${method.receiver}</span>
          <button class="btn btn-ghost btn-sm" style="width:max-content;margin-top:4px;color:#fff;background:rgba(139,92,246,0.32);border:1px solid rgba(255,255,255,0.2);" onclick="Chat.copyPaymentRequisites('sber_card')">Копировать реквизиты</button>
        </div>
      </div>
      <div class="chat-invoice-banner__actions">
        <button class="btn btn-ghost btn-sm" onclick="Chat.openApplyDiscount('${order.id}')">Скидка / промокод / TISHARA</button>
        <button class="btn btn-primary btn-sm" onclick="Chat.payInvoice('${order.id}')">Отправить чек на ${formatMoney(breakdown.total, currency)}</button>
      </div></div>`;
  }

  function renderPaymentVerificationBanner(order) {
    const req = getLatestPendingPaymentRequest(order);
    const amount = req ? Number(req.amount || 0) : 0;
    const currency = req ? normalizeCurrency(req.currency || getOrderCurrency(order, req.type)) : getOrderCurrency(order, 'invoice');
    const typeText = req ? getPaymentTypeLabel(req.type) : 'платежа';
    const method = req && PAYMENT_METHODS[req.method] ? PAYMENT_METHODS[req.method] : PAYMENT_METHODS.sber_card;
    const sentAt = req && req.createdAt ? formatTime(new Date(req.createdAt)) : formatTime(new Date());
    return `<div class="chat-invoice-banner" style="background:linear-gradient(135deg,rgba(249,115,22,0.10),rgba(251,146,60,0.04));border-bottom-color:rgba(249,115,22,0.24);">
      <div class="chat-invoice-banner__header" style="color:#ea580c;">${IC.clock} Заявка на проверку ${typeText}</div>
      <div class="chat-invoice-banner__amount">
        <div>Сумма: <strong>${formatMoney(amount || 0, currency, true)}</strong> • Метод: ${method.label}</div>
        <div style="font-size:0.8rem;color:var(--color-muted);margin-top:6px;">Отправлено: ${sentAt}. Ожидайте подтверждение администратора.</div>
      </div>
    </div>`;
  }

  function renderUrgentPrepayBanner(order) {
    const method = PAYMENT_METHODS.sber_card;
    const currency = getOrderCurrency(order, 'urgent_prepayment');
    const amountText = formatMoney(order.prepayment || 0, currency, true);
    return `<div class="chat-invoice-banner" style="background:linear-gradient(135deg,rgba(239,68,68,0.06),rgba(249,115,22,0.03));">
      <div class="chat-invoice-banner__header" style="color:#ef4444;">${IC.alert} Предоплата (без скидок)</div>
      <div style="font-size:0.85rem;margin-bottom:8px;">Предоплата: <strong>${amountText}</strong></div>
      <div style="font-size:0.78rem;color:var(--color-muted);margin-bottom:8px;display:grid;gap:2px;">
        <span>${method.label}: ${method.cardNumber}</span>
        <span>Получатель: ${method.receiver}</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" style="color:#fff;background:rgba(139,92,246,0.32);border:1px solid rgba(255,255,255,0.2);" onclick="Chat.copyPaymentRequisites('sber_card')">Копировать реквизиты</button>
        <button class="btn btn-primary btn-sm" onclick="Chat.payUrgentPrepay('${order.id}')">Отправить чек на ${formatMoney(order.prepayment || 0, currency)}</button>
      </div>
    </div>`;
  }

  function getPaymentTypeLabel(paymentType) {
    if (paymentType === 'prepayment') return 'предоплаты';
    if (paymentType === 'urgent_prepayment') return 'срочной предоплаты';
    if (paymentType === 'invoice') return 'финальной оплаты';
    return 'платежа';
  }

  function getPendingStatus(paymentType) {
    return paymentType === 'invoice' ? 'payment_verification' : 'prepayment_verification';
  }

  function getPaymentAmount(order, paymentType) {
    if (!order) return 0;
    if (paymentType === 'invoice') {
      return getInvoiceBreakdown(order).total;
    }
    return Math.max(0, Math.round(Number(order.prepayment || Math.ceil(Number(order.price || 0) * 0.3))));
  }

  function isPaymentAllowed(order, paymentType) {
    if (!order) return false;
    if (paymentType === 'prepayment') return order.status === 'pending_prepayment';
    if (paymentType === 'urgent_prepayment') return !!order.isUrgent && order.status === 'pending_prepayment' && !order.urgentPrepaid;
    if (paymentType === 'invoice') return order.status === 'invoice_sent';
    return false;
  }

  function getLatestPendingPaymentRequest(order) {
    const list = Array.isArray(order?.paymentRequests) ? order.paymentRequests : [];
    for (let i = list.length - 1; i >= 0; i--) {
      const req = list[i];
      if (req && req.status === 'pending') return req;
    }
    return null;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('read_failed'));
      reader.readAsDataURL(file);
    });
  }

  function closePaymentRequestModal() {
    const modal = document.getElementById('paymentRequestModal');
    if (modal) modal.remove();
    _paymentModalState = null;
    document.body.style.overflow = '';
  }

  function closeApplyDiscountModal() {
    const modal = document.getElementById('applyDiscountModal');
    if (modal) modal.remove();
    _discountModalState = null;
    document.body.style.overflow = '';
  }

  function copyPaymentRequisites(methodId = 'sber_card') {
    const method = PAYMENT_METHODS[methodId] || PAYMENT_METHODS.sber_card;
    const text = `Карта: ${method.cardNumber}\nПолучатель: ${method.receiver}`;
    copyTextToClipboard(text, 'Реквизиты скопированы');
  }

  function copyPaymentValue(value, okMessage) {
    copyTextToClipboard(String(value || ''), okMessage || 'Скопировано');
  }

  function pushAdminPaymentNotification(order, request) {
    const profile = JSON.parse(localStorage.getItem('tish_profile') || '{}');
    const userName = profile.name || 'Пользователь';
    const currency = normalizeCurrency(request.currency || getOrderCurrency(order, request.type));
    const amountText = formatMoney(request.amount || 0, currency, true);
    const list = JSON.parse(localStorage.getItem('tish_admin_notifications') || '[]');
    list.unshift({
      id: request.id,
      type: 'payment_check',
      user: userName,
      orderId: order.id,
      chatId: order.chatId || null,
      paymentType: request.type,
      amount: request.amount,
      currency,
      method: request.method,
      cardNumber: request.cardNumber,
      message: `Проверить ${getPaymentTypeLabel(request.type)}: ${amountText} по заказу ${order.id}`,
      time: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('tish_admin_notifications', JSON.stringify(list));
    if (typeof Storage !== 'undefined' && Storage.set) {
      Storage.set('tish_admin_notifications', list);
    }
  }

  function emitOrderStatus(text, orderId) {
    document.dispatchEvent(new CustomEvent('orderStatusChanged', {
      detail: { orderId, text }
    }));
  }

  function _setPaymentReceiptHint(message) {
    const hint = document.getElementById('paymentReqReceiptHint');
    if (!hint) return;
    if (!message) {
      hint.style.display = 'none';
      hint.textContent = '';
      return;
    }
    hint.textContent = message;
    hint.style.display = 'block';
  }

  function _validatePaymentRequestForm(showHint = false) {
    const senderName = (document.getElementById('paymentReqSenderName')?.value || '').trim();
    const transferAt = document.getElementById('paymentReqTransferAt')?.value || '';
    const file = document.getElementById('paymentReqReceipt')?.files?.[0];

    if (!senderName) {
      if (showHint) _setPaymentReceiptHint('Заполните поле "Имя отправителя".');
      return false;
    }
    if (!transferAt) {
      if (showHint) _setPaymentReceiptHint('Укажите время перевода.');
      return false;
    }
    if (!file) {
      if (showHint) _setPaymentReceiptHint('Прикрепите чек или скриншот перевода, чтобы отправить заявку.');
      return false;
    }

    _setPaymentReceiptHint('');
    return true;
  }

  function _bindPaymentRequestValidation() {
    const sender = document.getElementById('paymentReqSenderName');
    const transfer = document.getElementById('paymentReqTransferAt');
    const receipt = document.getElementById('paymentReqReceipt');
    [sender, transfer, receipt].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', () => _validatePaymentRequestForm(false));
      el.addEventListener('change', () => _validatePaymentRequestForm(false));
    });
  }

  function openPaymentRequestModal(orderId, paymentType) {
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    const profile = getProfileData();
    if (paymentType === 'urgent_prepayment' && !profile.region) {
      App.showToast('Для срочной оплаты сначала выберите регион в профиле', 'warning');
      if (typeof Profile !== 'undefined' && typeof Profile.openRegionModal === 'function') {
        Profile.openRegionModal();
      }
      return false;
    }

    if (!isPaymentAllowed(order, paymentType)) {
      App.showToast('Сейчас этот платеж недоступен', 'warning');
      return false;
    }

    const amount = getPaymentAmount(order, paymentType);
    const currency = getOrderCurrency(order, paymentType);
    const pendingStatus = getPendingStatus(paymentType);
    const method = PAYMENT_METHODS.sber_card;
    const defaultName = profile.name || '';
    const safeDefaultName = String(defaultName).replace(/"/g, '&quot;');
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    closePaymentRequestModal();
    _paymentModalState = { orderId, paymentType, amount, pendingStatus, currency };

    const modal = document.createElement('div');
    modal.className = 'profile-modal is-open';
    modal.id = 'paymentRequestModal';
    modal.innerHTML = `<div class="profile-modal__backdrop" onclick="Chat.closePaymentRequestModal()"></div>
      <div class="profile-modal__container" style="max-width:560px;">
        <div class="profile-modal__header">
          <div class="profile-modal__title">${IC.money} Проверка ${getPaymentTypeLabel(paymentType)}</div>
          <button class="profile-modal__close" onclick="Chat.closePaymentRequestModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="profile-modal__body">
          <div style="padding:14px;background:rgba(249,115,22,0.10);border:1px solid rgba(249,115,22,0.22);border-radius:12px;margin-bottom:14px;">
            <div style="font-weight:800;margin-bottom:6px;font-size:0.95rem;">Реквизиты для оплаты (шаг 1)</div>
            <div style="font-size:0.82rem;color:var(--color-muted);margin-bottom:8px;">Переведите <strong>${formatMoney(amount, currency, true)}</strong> и только потом заполните форму ниже.</div>
            <div style="display:grid;gap:4px;font-size:0.84rem;line-height:1.45;">
              <div><strong>Метод:</strong> ${method.label}</div>
              <div><strong>Номер карты:</strong> ${method.cardNumber}</div>
              <div><strong>Получатель:</strong> ${method.receiver}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
              <button class="btn btn-ghost btn-sm" style="color:#fff;background:rgba(139,92,246,0.38);border:1px solid rgba(255,255,255,0.22);" onclick="Chat.copyPaymentValue('${method.cardNumber}','Номер карты скопирован')">Копировать номер карты</button>
              <button class="btn btn-ghost btn-sm" style="color:#fff;background:rgba(139,92,246,0.38);border:1px solid rgba(255,255,255,0.22);" onclick="Chat.copyPaymentValue('${method.receiver}','Имя получателя скопировано')">Копировать получателя</button>
              <button class="btn btn-ghost btn-sm" style="color:#fff;background:rgba(139,92,246,0.38);border:1px solid rgba(255,255,255,0.22);" onclick="Chat.copyPaymentRequisites('sber_card')">Копировать реквизиты</button>
            </div>
          </div>
          <div style="font-size:0.84rem;font-weight:700;margin:2px 0 10px;">Заполните подтверждение оплаты (шаг 2)</div>
          <div style="padding:10px;background:rgba(139,92,246,0.06);border:1px dashed rgba(139,92,246,0.2);border-radius:10px;margin-bottom:12px;font-size:0.78rem;color:var(--color-muted);">
            Чек никуда не теряется: после отправки он попадет в проверку администратору.
          </div>
          <div class="form-group"><label class="form-label">Сумма</label>
            <input class="input" id="paymentReqAmount" value="${formatMoney(amount, currency, true)}" disabled></div>
          <div class="form-group"><label class="form-label">Способ оплаты</label>
            <select class="input" id="paymentReqMethod"><option value="sber_card">${method.label}</option></select></div>
          <div class="form-group"><label class="form-label">Имя отправителя *</label>
            <input class="input" id="paymentReqSenderName" placeholder="Иван Иванов" value="${safeDefaultName}"></div>
          <div class="form-group"><label class="form-label">Время перевода *</label>
            <input type="datetime-local" class="input" id="paymentReqTransferAt" value="${localIso}"></div>
          <div class="form-group"><label class="form-label">Комментарий</label>
            <textarea class="textarea" id="paymentReqComment" rows="2" placeholder="Номер операции, банк и т.д."></textarea></div>
          <div class="form-group"><label class="form-label">Чек / скриншот перевода *</label>
            <input type="file" class="input" id="paymentReqReceipt" accept="image/*,.pdf">
            <div id="paymentReqReceiptHint" style="display:none;margin-top:6px;font-size:0.76rem;color:#ef4444;"></div></div>
        </div>
        <div class="profile-modal__footer">
          <button class="btn btn-secondary btn-sm" onclick="Chat.closePaymentRequestModal()">Отмена</button>
          <button class="btn btn-primary btn-sm" id="paymentReqSubmitBtn" onclick="Chat.submitPaymentRequest()">Отправить на проверку</button>
        </div>
      </div>`;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    _bindPaymentRequestValidation();
    return true;
  }

  async function submitPaymentRequest() {
    const state = _paymentModalState;
    if (!state) return false;

    const senderName = (document.getElementById('paymentReqSenderName')?.value || '').trim();
    const transferAt = document.getElementById('paymentReqTransferAt')?.value || '';
    const comment = (document.getElementById('paymentReqComment')?.value || '').trim();
    const methodId = document.getElementById('paymentReqMethod')?.value || 'sber_card';
    const file = document.getElementById('paymentReqReceipt')?.files?.[0];

    if (!_validatePaymentRequestForm(true)) {
      if (!senderName) {
        App.showToast('Укажите имя отправителя', 'warning');
      } else if (!transferAt) {
        App.showToast('Укажите время перевода', 'warning');
      } else {
        App.showToast('Прикрепите чек или скриншот перевода', 'warning');
      }
      return false;
    }

    if (file.size > MAX_ATTACH_FILE_BYTES) {
      App.showToast('Файл чека слишком большой (максимум 4 МБ)', 'warning');
      return false;
    }

    let receiptData = '';
    try {
      receiptData = await readFileAsDataUrl(file);
    } catch {
      App.showToast('Не удалось прочитать файл чека', 'error');
      return false;
    }

    const method = PAYMENT_METHODS[methodId] || PAYMENT_METHODS.sber_card;
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const order = orders.find(o => o.id === state.orderId);
    if (!order || !isPaymentAllowed(order, state.paymentType)) {
      App.showToast('Статус заказа изменился. Обновите страницу.', 'warning');
      closePaymentRequestModal();
      return false;
    }

    const nowIso = new Date().toISOString();
    let transferIso = nowIso;
    try {
      transferIso = new Date(transferAt).toISOString();
    } catch {}
    const request = {
      id: 'PAY-' + Date.now().toString(36).toUpperCase(),
      type: state.paymentType,
      amount: state.amount,
      currency: state.currency,
      method: method.id,
      cardNumber: method.cardNumber,
      receiver: method.receiver,
      senderName,
      transferAt: transferIso,
      comment,
      receiptName: file.name,
      receiptMimeType: file.type || '',
      receiptSize: file.size,
      receiptData,
      status: 'pending',
      createdAt: nowIso
    };

    order.paymentRequests = Array.isArray(order.paymentRequests) ? order.paymentRequests : [];
    order.paymentRequests.push(request);
    order.lastPaymentRequestId = request.id;
    order.lastPaymentType = request.type;
    order.lastPaymentStatus = request.status;
    order.paymentRequestedAt = nowIso;
    order.status = state.pendingStatus;

    localStorage.setItem('tish_orders', JSON.stringify(orders));
    if (typeof Storage !== 'undefined' && Storage.set) {
      Storage.set('tish_orders', orders);
    }

    if (order.chatId) {
      const msgs = getMessages(order.chatId);
      const paidText = formatMoney(state.amount, state.currency, true);
      msgs.push({
        id: Date.now(),
        from: 'user',
        type: 'text',
        text: `Отправил заявку на проверку ${getPaymentTypeLabel(state.paymentType)}: ${paidText}. Метод: ${method.label}.`,
        time: formatTime(new Date()),
        reactions: {}
      });
      msgs.push({
        id: Date.now() + 1,
        from: 'system',
        type: 'system',
        text: 'Платеж отправлен администратору на проверку. Ожидайте подтверждение.'
      });
      saveMessages(order.chatId, msgs);
    }

    pushAdminPaymentNotification(order, request);
    emitOrderStatus(`Платеж по заказу ${order.id} отправлен на проверку`, order.id);
    closePaymentRequestModal();

    if (order.chatId && _sameId(activeChatId, order.chatId)) {
      openChat(order.chatId);
    } else {
      renderChatList();
    }

    if (typeof Profile !== 'undefined' && Profile.renderAll) Profile.renderAll();
    App.showToast('Платеж отправлен на проверку администратору', 'success', 5000);
    return true;
  }

  function payUrgentPrepay(orderId) {
    openPaymentRequestModal(orderId, 'urgent_prepayment');
  }

  function openApplyDiscount(orderId) {
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const order = orders.find((item) => item.id === orderId);
    if (!order || !order.invoiceAmount) {
      App.showToast('Счёт для скидки не найден', 'warning');
      return false;
    }
    if (order.status !== 'invoice_sent') {
      App.showToast('Скидки можно изменить только до отправки чека', 'info');
      return false;
    }

    const profile = getProfileData();
    const meta = getCurrentOrderDiscountMeta(order);
    const candidates = getDiscountCandidates(profile, meta);
    const currency = getOrderCurrency(order, 'invoice');
    const options = [
      '<option value="">Без скидки</option>',
      ...candidates.map((discount) => {
        const id = String(discount?.id ?? '').replace(/"/g, '&quot;');
        const selected = String(meta.discountId ?? '') === String(discount?.id ?? '') ? 'selected' : '';
        const code = discount?.code ? ` · ${escapeHtml(String(discount.code))}` : '';
        return `<option value="${id}" ${selected}>${escapeHtml(discount?.name || 'Скидка')} (${Number(discount?.percent || 0)}%)${code}</option>`;
      })
    ].join('');

    const safePromo = String(meta.promoCode || '').replace(/"/g, '&quot;');
    const maxTishara = Math.max(0, Math.round(Number(profile.tishara || 0))) + meta.tisharaSpent;

    closeApplyDiscountModal();
    _discountModalState = { orderId };

    const modal = document.createElement('div');
    modal.className = 'profile-modal is-open';
    modal.id = 'applyDiscountModal';
    modal.innerHTML = `<div class="profile-modal__backdrop" onclick="Chat.closeApplyDiscountModal()"></div>
      <div class="profile-modal__container" style="max-width:560px;">
        <div class="profile-modal__header">
          <div class="profile-modal__title">${IC.gift} Скидка, промокод и TISHARA</div>
          <button class="profile-modal__close" onclick="Chat.closeApplyDiscountModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="profile-modal__body" style="display:grid;gap:10px;">
          <div style="padding:12px;border-radius:12px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);display:grid;gap:6px;">
            <div style="display:flex;justify-content:space-between;gap:8px;"><span>Сумма счёта</span><strong id="invoiceDiscountBase">${formatMoney(order.invoiceAmount, currency, true)}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:8px;color:#22c55e;"><span>Скидка/промокод</span><strong id="invoiceDiscountValue">− ${formatMoney(0, currency)}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:8px;color:#22c55e;"><span>TISHARA</span><strong id="invoiceTisharaValue">− ${formatMoney(0, currency)}</strong></div>
            <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:1rem;"><strong>К оплате</strong><strong id="invoiceDiscountTotal">${formatMoney(order.invoiceAmount, currency, true)}</strong></div>
          </div>

          <div class="form-group"><label class="form-label">Выбрать скидку</label>
            <select class="input" id="invoiceDiscountSelect" onchange="Chat.previewInvoiceDiscount()">${options}</select>
            <div id="invoiceDiscountPicked" style="font-size:0.75rem;color:var(--color-muted);margin-top:6px;">Скидка не выбрана</div>
          </div>

          <div class="form-group"><label class="form-label">Промокод</label>
            <input class="input" id="invoicePromoCode" placeholder="Например: GIFT5" value="${safePromo}" oninput="Chat.previewInvoiceDiscount()">
          </div>

          <div class="form-group"><label class="form-label">Списать TISHARA</label>
            <input class="input" type="number" min="0" max="${maxTishara}" step="1" id="invoiceTisharaSpend" value="${meta.tisharaSpent}" oninput="Chat.previewInvoiceDiscount()">
            <div style="font-size:0.75rem;color:var(--color-muted);margin-top:6px;">Доступно: ${maxTishara} ✦ (включая уже примененные к этому заказу)</div>
          </div>

          <div id="invoiceDiscountError" style="display:none;padding:10px;border-radius:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);font-size:0.8rem;color:#ef4444;"></div>
        </div>
        <div class="profile-modal__footer">
          <button class="btn btn-secondary btn-sm" onclick="Chat.closeApplyDiscountModal()">Отмена</button>
          <button class="btn btn-primary btn-sm" onclick="Chat.submitApplyDiscount()">Применить</button>
        </div>
      </div>`;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    previewInvoiceDiscount();
    return true;
  }

  function previewInvoiceDiscount() {
    const state = _discountModalState;
    if (!state) return false;
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const order = orders.find((item) => item.id === state.orderId);
    if (!order) return false;

    const profile = getProfileData();
    const currency = getOrderCurrency(order, 'invoice');
    const selectedId = document.getElementById('invoiceDiscountSelect')?.value || '';
    const promoCode = document.getElementById('invoicePromoCode')?.value || '';
    const tisharaRaw = document.getElementById('invoiceTisharaSpend')?.value || '0';

    const draft = resolveInvoiceDiscountDraft(order, profile, selectedId, promoCode, tisharaRaw);
    const errorEl = document.getElementById('invoiceDiscountError');
    if (!draft.ok) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = draft.error || 'Не удалось рассчитать скидку';
      }
      return false;
    }

    const pickedLabel = draft.discount
      ? `${draft.discount.name || 'Скидка'} (${Number(draft.discount.percent || 0)}%)`
      : 'Скидка не выбрана';

    const baseEl = document.getElementById('invoiceDiscountBase');
    const discountEl = document.getElementById('invoiceDiscountValue');
    const tisharaEl = document.getElementById('invoiceTisharaValue');
    const totalEl = document.getElementById('invoiceDiscountTotal');
    const pickedEl = document.getElementById('invoiceDiscountPicked');
    const inputEl = document.getElementById('invoiceTisharaSpend');

    if (baseEl) baseEl.textContent = formatMoney(draft.base, currency, true);
    if (discountEl) discountEl.textContent = `− ${formatMoney(draft.discountAmount, currency)}`;
    if (tisharaEl) tisharaEl.textContent = `− ${formatMoney(draft.tisharaSpent, currency)}`;
    if (totalEl) totalEl.textContent = formatMoney(draft.final, currency, true);
    if (pickedEl) pickedEl.textContent = pickedLabel;
    if (inputEl) inputEl.max = String(draft.availableTishara);

    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
    return true;
  }

  function submitApplyDiscount() {
    const state = _discountModalState;
    if (!state) return false;

    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const order = orders.find((item) => item.id === state.orderId);
    if (!order || order.status !== 'invoice_sent') {
      App.showToast('Счёт уже изменился. Обновите чат.', 'warning');
      closeApplyDiscountModal();
      return false;
    }

    const profile = getProfileData();
    profile.tishara = Math.max(0, Math.round(Number(profile.tishara || 0)));

    const selectedId = document.getElementById('invoiceDiscountSelect')?.value || '';
    const promoCode = document.getElementById('invoicePromoCode')?.value || '';
    const tisharaRaw = document.getElementById('invoiceTisharaSpend')?.value || '0';
    const draft = resolveInvoiceDiscountDraft(order, profile, selectedId, promoCode, tisharaRaw);

    if (!draft.ok) {
      App.showToast(draft.error || 'Не удалось применить скидку', 'warning');
      previewInvoiceDiscount();
      return false;
    }

    const prevMeta = getCurrentOrderDiscountMeta(order);
    const deltaTishara = draft.tisharaSpent - prevMeta.tisharaSpent;

    if (deltaTishara > 0) {
      if (profile.tishara < deltaTishara) {
        App.showToast('Недостаточно TISHARA на балансе', 'warning');
        return false;
      }
      profile.tishara -= deltaTishara;
      pushProfileTisharaHistory(profile, -deltaTishara, `Списание TISHARA за заказ ${order.id}`);
    } else if (deltaTishara < 0) {
      profile.tishara += Math.abs(deltaTishara);
      pushProfileTisharaHistory(profile, Math.abs(deltaTishara), `Возврат TISHARA по заказу ${order.id}`);
    }

    order.invoiceDiscounts = draft.lines;
    order.invoiceDiscountMeta = {
      discountId: draft.discount ? draft.discount.id : null,
      promoCode: draft.promoCode,
      tisharaSpent: draft.tisharaSpent,
      appliedAt: new Date().toISOString()
    };

    localStorage.setItem('tish_orders', JSON.stringify(orders));
    if (typeof Storage !== 'undefined' && Storage.set) {
      Storage.set('tish_orders', orders);
    }
    saveProfileData(profile);

    closeApplyDiscountModal();

    if (order.chatId && _sameId(activeChatId, order.chatId)) {
      openChat(order.chatId);
    } else {
      renderChatList();
    }

    if (typeof Profile !== 'undefined' && typeof Profile.renderAll === 'function') {
      try {
        Profile.renderAll();
      } catch {}
    }

    App.showToast(`Скидка применена. К оплате: ${formatMoney(draft.final, getOrderCurrency(order, 'invoice'), true)}`, 'success');
    return true;
  }

  function payInvoice(orderId) {
    openPaymentRequestModal(orderId, 'invoice');
  }

  function requestPaymentVerification(orderId, paymentType) {
    return openPaymentRequestModal(orderId, paymentType || 'invoice');
  }

  // ===== BADGE =====
  function updateChatBadge() {
    const total = getChats().reduce((s, c) => s + c.unread, 0);
    document.querySelectorAll('[data-chat-count]').forEach(el => {
      el.textContent = total;
      el.style.display = total > 0 ? '' : 'none';
    });
  }

  function _readUrgentFabPosition() {
    try {
      const parsed = JSON.parse(localStorage.getItem(URGENT_FAB_POS_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return null;
      const x = Number(parsed.x);
      const y = Number(parsed.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    } catch {
      return null;
    }
  }

  function _saveUrgentFabPosition(pos) {
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    const value = { x: Math.round(pos.x), y: Math.round(pos.y) };
    try {
      localStorage.setItem(URGENT_FAB_POS_KEY, JSON.stringify(value));
    } catch {}
  }

  function _applyUrgentFabPosition(btn, pos) {
    if (!btn || !pos) return null;
    const rect = btn.getBoundingClientRect();
    const width = Math.max(56, Math.round(rect.width || 220));
    const height = Math.max(56, Math.round(rect.height || 56));
    const minX = 8;
    const minY = 8;
    const maxX = Math.max(minX, window.innerWidth - width - 8);
    const maxY = Math.max(minY, window.innerHeight - height - 8);
    const x = Math.min(maxX, Math.max(minX, Math.round(Number(pos.x) || minX)));
    const y = Math.min(maxY, Math.max(minY, Math.round(Number(pos.y) || minY)));

    btn.style.left = x + 'px';
    btn.style.top = y + 'px';
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    return { x, y };
  }

  function _initUrgentFabDraggable(btn) {
    if (!btn) return;
    const dragHandle = btn.querySelector('.urgent-order-fab__btn');
    if (!dragHandle) return;

    const saved = _readUrgentFabPosition();
    if (saved) {
      requestAnimationFrame(() => {
        _applyUrgentFabPosition(btn, saved);
      });
    }

    let drag = null;
    let suppressClickUntil = 0;

    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const moved = Math.abs(dx) > 4 || Math.abs(dy) > 4;
      if (!moved && !drag.moved) return;

      drag.moved = true;
      const applied = _applyUrgentFabPosition(btn, {
        x: drag.originX + dx,
        y: drag.originY + dy
      });
      drag.last = applied;
      btn.dataset.dragMoved = '1';
      e.preventDefault();
    };

    const onUp = (e) => {
      if (!drag) return;
      btn.classList.remove('urgent-order-fab--dragging');
      if (drag.moved) {
        suppressClickUntil = Date.now() + 350;
      }
      if (e && drag.pointerId !== null && dragHandle.hasPointerCapture?.(drag.pointerId)) {
        dragHandle.releasePointerCapture(drag.pointerId);
      }
      if (drag.last) {
        _saveUrgentFabPosition(drag.last);
      }
      drag = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };

    dragHandle.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      const rect = btn.getBoundingClientRect();
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        originX: rect.left,
        originY: rect.top,
        pointerId: e.pointerId ?? null,
        moved: false,
        last: null
      };
      btn.dataset.dragMoved = '0';
      btn.classList.add('urgent-order-fab--dragging');
      if (drag.pointerId !== null && dragHandle.setPointerCapture) {
        dragHandle.setPointerCapture(drag.pointerId);
      }
      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });

    dragHandle.addEventListener('click', (e) => {
      if (btn.dataset.dragMoved === '1' || Date.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        btn.dataset.dragMoved = '0';
        return;
      }
      Chat.openUrgentOrderForm();
    });

    window.addEventListener('resize', () => {
      const current = _readUrgentFabPosition();
      if (!current) return;
      const next = _applyUrgentFabPosition(btn, current);
      if (next) _saveUrgentFabPosition(next);
    });
  }

  // ===== URGENT BUTTON =====
  function createUrgentButton() {
    if (document.getElementById('urgentOrderBtn')) return;
    const btn = document.createElement('div');
    btn.id = 'urgentOrderBtn';
    btn.className = 'urgent-order-fab';
    btn.innerHTML = `<div class="urgent-order-fab__pulse"></div>
      <button class="urgent-order-fab__btn" type="button" aria-label="Срочный заказ">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span class="urgent-fab-text">Срочный заказ</span>
      </button>
      <button class="urgent-order-fab__close" onclick="Chat.toggleUrgentButton()" title="Скрыть">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    document.body.appendChild(btn);
    _initUrgentFabDraggable(btn);
  }

  function toggleUrgentButton() {
    const btn = document.getElementById('urgentOrderBtn');
    if (!btn) return;
    if (btn.classList.contains('urgent-order-fab--hidden')) {
      btn.classList.remove('urgent-order-fab--hidden');
    } else {
      btn.classList.add('urgent-order-fab--hidden');
      let restore = document.getElementById('urgentRestoreBtn');
      if (!restore) {
        restore = document.createElement('button');
        restore.id = 'urgentRestoreBtn';
        restore.className = 'urgent-restore-btn';
        restore.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        restore.onclick = () => { Chat.toggleUrgentButton(); restore.remove(); };
        document.body.appendChild(restore);
      }
    }
  }

  function openUrgentOrderForm() {
    const profile = getProfileData();
    const profileRegion = String(profile.region || '').toUpperCase();
    const hasRegion = !!profile.region;
    const defaultCurrency = profileRegion === 'RU' ? 'RUB' : 'USD';

    let modal = document.getElementById('urgentOrderModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.className = 'profile-modal is-open';
    modal.id = 'urgentOrderModal';
    modal.innerHTML = `<div class="profile-modal__backdrop" onclick="this.parentElement.remove();document.body.style.overflow='';"></div>
      <div class="profile-modal__container" style="max-width:520px;">
        <div class="profile-modal__header">
          <div class="profile-modal__title">${IC.bolt} Срочный заказ</div>
          <button class="profile-modal__close" onclick="this.closest('.profile-modal').remove();document.body.style.overflow='';">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="profile-modal__body">
          <div style="padding:12px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:12px;margin-bottom:16px;">
            <p style="font-size:0.85rem;color:#ef4444;font-weight:600;">${IC.alert} Срочные заказы обрабатываются вне очереди. Предоплата БЕЗ скидок.</p>
          </div>
          ${hasRegion ? '' : `<div style="padding:12px;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.25);border-radius:12px;margin-bottom:16px;font-size:0.82rem;color:#f97316;">
            Для оплаты срочного заказа нужно выбрать регион в профиле.
            <div style="margin-top:8px;"><button class="btn btn-ghost btn-sm" style="color:#fff;background:rgba(249,115,22,0.36);border:1px solid rgba(255,255,255,0.22);" onclick="if(typeof Profile!=='undefined'&&Profile.openRegionModal){Profile.openRegionModal();}">Выбрать регион</button></div>
          </div>`}
          <div class="form-group"><label class="form-label">Что нужно сделать? *</label>
            <textarea class="textarea" id="urgentDescription" placeholder="Опишите заказ..." rows="4"></textarea></div>
          <div class="form-group"><label class="form-label">Сроки *</label>
            <select class="input" id="urgentDeadline">
              <option value="2-3 часа">2-3 часа</option>
              <option value="6 часов">6 часов</option>
              <option value="12 часов">12 часов</option>
              <option value="24 часа" selected>24 часа</option>
              <option value="2-3 дня">2-3 дня</option>
            </select></div>
          <div class="form-group"><label class="form-label">Валюта срочного заказа *</label>
            <select class="input" id="urgentCurrency">
              <option value="RUB" ${defaultCurrency === 'RUB' ? 'selected' : ''}>Рубли (₽)</option>
              <option value="USD" ${defaultCurrency === 'USD' ? 'selected' : ''}>Доллары ($)</option>
            </select></div>
          <div class="form-group"><label class="form-label">Бюджет *</label>
            <input type="number" class="input" id="urgentBudget" placeholder="100" min="10"></div>
        </div>
        <div class="profile-modal__footer">
          <button class="btn btn-secondary btn-sm" onclick="this.closest('.profile-modal').remove();document.body.style.overflow='';">Отмена</button>
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#ef4444,#f97316);color:white;border:none;" onclick="Chat.submitUrgentOrder()">
            ${IC.bolt} Отправить
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  }

  function submitUrgentOrder() {
    const profile = getProfileData();
    if (!profile.region) {
      App.showToast('Сначала выберите регион в профиле', 'warning');
      if (typeof Profile !== 'undefined' && typeof Profile.openRegionModal === 'function') {
        Profile.openRegionModal();
      }
      return;
    }

    const desc = document.getElementById('urgentDescription')?.value?.trim();
    const deadline = document.getElementById('urgentDeadline')?.value || '24 часа';
    const regionCurrency = String(profile.region || '').toUpperCase() === 'RU' ? 'RUB' : 'USD';
    const currency = normalizeCurrency(document.getElementById('urgentCurrency')?.value, regionCurrency);
    const budget = parseInt(document.getElementById('urgentBudget')?.value, 10) || 100;
    if (!desc) { App.showToast('Опишите заказ', 'warning'); return; }
    if (budget < 10) { App.showToast('Минимальный бюджет: 10', 'warning'); return; }

    const prepayment = Math.ceil(budget * 0.3);
    const orderId = 'URG-' + Date.now().toString(36).toUpperCase();
    const chatId = 'chat_' + orderId;
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const userId = String(profile.googleId || '');
    const userEmail = String(profile.email || '');
    orders.push({
      id: orderId, productId: null, productName: desc.slice(0, 50),
      userId, userEmail,
      productGradient: 'linear-gradient(135deg,#ef4444,#f97316)',
      category: 'Другое', author: '', price: budget, prepayment,
      currency, prepaymentCurrency: currency, urgentCurrency: currency,
      status: 'pending_prepayment', createdAt: new Date().toISOString(),
      prepaidAt: null, chatId, isUrgent: true,
      urgentDescription: desc, urgentDeadline: deadline, urgentPrepaid: false,
      invoiceAmount: null, invoiceDiscounts: [], reviewed: false,
      paymentRequests: [], lastPaymentRequestId: null,
      lastPaymentType: null, lastPaymentStatus: null,
      paymentRequestedAt: null
    });
    localStorage.setItem('tish_orders', JSON.stringify(orders));
    Storage.set('tish_orders', orders);
    saveMessages(chatId, [
      { id: 1, from: 'system', type: 'system', text: 'Срочный заказ создан!' },
      { id: 2, from: 'user', type: 'text', text: 'Описание: ' + desc + '\nСрок: ' + deadline + '\nВалюта: ' + currency + '\nБюджет: ' + formatMoney(budget, currency, true), time: formatTime(new Date()), reactions: {} },
      { id: 3, from: 'admin', type: 'text', text: 'Срочный заказ принят! Ожидайте ответа администратора.\nПредоплата: ' + formatMoney(prepayment, currency, true) + ' (без скидок)', time: formatTime(new Date()), read: false, reactions: {} }
    ]);
    document.getElementById('urgentOrderModal')?.remove();
    document.body.style.overflow = '';
    App.showToast('Срочный заказ отправлен!', 'success', 5000);
    App.showPage('chat');
    setTimeout(() => openChat(chatId), 500);
  }

  // ===== ADMIN API =====
  function resolvePaymentVerification(orderId, approved, reason) {
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const o = orders.find(x => x.id === orderId);
    if (!o) return false;

    const req = getLatestPendingPaymentRequest(o);
    if (!req) return false;

    const nowIso = new Date().toISOString();
    req.status = approved ? 'approved' : 'rejected';
    req.reviewedAt = nowIso;
    req.reviewedBy = 'admin';
    if (!approved) req.rejectReason = (reason || '').trim();

    if (approved) {
      if (req.type === 'invoice') {
        o.chatId = o.chatId || 'chat_' + o.id;
        o.status = 'paid';
        o.paidAt = nowIso;
      } else if (req.type === 'urgent_prepayment') {
        o.chatId = o.chatId || 'chat_' + o.id;
        o.urgentPrepaid = true;
        o.urgentPrepaidAt = nowIso;
        o.status = 'in_progress';
      } else {
        o.chatId = o.chatId || 'chat_' + o.id;
        o.status = 'prepaid';
        o.prepaidAt = nowIso;
      }
      o.lastPaymentStatus = 'approved';
    } else {
      if (req.type === 'invoice') {
        o.status = 'invoice_sent';
      } else if (req.type === 'urgent_prepayment') {
        o.status = 'pending_prepayment';
      } else {
        o.status = 'pending_prepayment';
      }
      o.lastPaymentStatus = 'rejected';
    }

    localStorage.setItem('tish_orders', JSON.stringify(orders));
    Storage.set('tish_orders', orders);

    if (o.chatId) {
      const msgs = getMessages(o.chatId);
      const reqCurrency = normalizeCurrency(req.currency || getOrderCurrency(o, req.type));
      const reqAmountText = formatMoney(req.amount || 0, reqCurrency, true);
      if (approved) {
        msgs.push({ id: Date.now(), from: 'system', type: 'system', text: 'Платеж подтвержден администратором.' });
        if (req.type === 'invoice') {
          msgs.push({ id: Date.now() + 1, from: 'admin', type: 'text', text: `Оплата ${reqAmountText} подтверждена. Заказ готов к завершению.`, time: formatTime(new Date()), read: false, reactions: {} });
        } else if (req.type === 'urgent_prepayment') {
          msgs.push({ id: Date.now() + 1, from: 'admin', type: 'text', text: `Срочная предоплата ${reqAmountText} подтверждена. Работа начинается.`, time: formatTime(new Date()), read: false, reactions: {} });
        } else {
          msgs.push({ id: Date.now() + 1, from: 'admin', type: 'text', text: `Предоплата ${reqAmountText} подтверждена. Чат активирован.`, time: formatTime(new Date()), read: false, reactions: {} });
        }
      } else {
        const reasonText = req.rejectReason ? ` Причина: ${req.rejectReason}.` : '';
        msgs.push({ id: Date.now(), from: 'system', type: 'system', text: `Платеж отклонен администратором.${reasonText}` });
      }
      saveMessages(o.chatId, msgs);
    }

    emitOrderStatus(`Статус оплаты заказа ${o.id} обновлен`, o.id);
    if (o.chatId && _sameId(activeChatId, o.chatId)) {
      openChat(o.chatId);
    } else {
      renderChatList();
    }
    updateChatBadge();

    if (typeof Profile !== 'undefined' && typeof Profile.renderAll === 'function') {
      try {
        Profile.renderAll();
      } catch {}
    }

    return true;
  }

  function adminApprovePaymentRequest(orderId) {
    return resolvePaymentVerification(orderId, true, '');
  }

  function adminRejectPaymentRequest(orderId, reason) {
    return resolvePaymentVerification(orderId, false, reason || '');
  }

  function adminSendInvoice(orderId, amount, desc) {
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const o = orders.find(x => x.id === orderId);
    if (!o || !o.chatId) return;
    const invoiceCurrency = getOrderCurrency(o, 'invoice');
    o.invoiceAmount = amount;
    o.invoiceCurrency = invoiceCurrency;
    o.status = 'invoice_sent';
    o.invoiceDiscounts = [];
    o.invoiceDiscountMeta = { discountId: null, promoCode: '', tisharaSpent: 0 };
    localStorage.setItem('tish_orders', JSON.stringify(orders));
    Storage.set('tish_orders', orders);
    const msgs = getMessages(o.chatId);
    msgs.push({ id: Date.now(), from: 'admin', type: 'invoice', invoiceAmount: amount, currency: invoiceCurrency, invoiceCurrency, text: desc || '', time: formatTime(new Date()), read: false, reactions: {} });
    saveMessages(o.chatId, msgs);
    return true;
  }

  function adminConfirmPayment(orderId) {
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const o = orders.find(x => x.id === orderId);
    if (!o || !o.chatId) return;
    o.status = 'completed'; o.completedAt = new Date().toISOString();
    localStorage.setItem('tish_orders', JSON.stringify(orders));
    Storage.set('tish_orders', orders);
    const msgs = getMessages(o.chatId);
    msgs.push({ id: Date.now(), from: 'system', type: 'system', text: 'Заказ завершён!' });
    msgs.push({ id: Date.now()+1, from: 'admin', type: 'text', text: 'Заказ завершён! Вы можете оставить отзыв (по желанию).', time: formatTime(new Date()), read: false, reactions: {} });
    saveMessages(o.chatId, msgs);
    const profile = JSON.parse(localStorage.getItem('tish_profile') || '{}');
    if (!profile.purchases) profile.purchases = [];
    if (!profile.purchases.find(p => p.id === o.productId)) {
      profile.purchases.push({ id: o.productId || Date.now(), name: o.productName, price: o.price, date: new Date().toISOString().split('T')[0], category: o.category || '', gradient: o.productGradient, downloaded: false, reviewed: false });
      profile.stats = profile.stats || {};
      profile.stats.purchases = (profile.stats.purchases || 0) + 1;
      profile.stats.spent = (profile.stats.spent || 0) + o.price;
      localStorage.setItem('tish_profile', JSON.stringify(profile));
      if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_profile', profile);
    }
    return true;
  }

  function adminStartWork(orderId) {
    const orders = JSON.parse(localStorage.getItem('tish_orders') || '[]');
    const o = orders.find(x => x.id === orderId);
    if (!o) return false;
    o.chatId = o.chatId || ('chat_' + o.id);
    o.status = 'in_progress';
    o.startedAt = o.startedAt || new Date().toISOString();
    localStorage.setItem('tish_orders', JSON.stringify(orders));
    Storage.set('tish_orders', orders);
    const msgs = getMessages(o.chatId);
    const hasStartedMessage = msgs.some((m) => m && m.type === 'system' && String(m.text || '').toLowerCase().includes('работа начата'));
    if (!hasStartedMessage) {
      msgs.push({ id: Date.now(), from: 'system', type: 'system', text: 'Работа начата!' });
    }
    saveMessages(o.chatId, msgs);
    emitOrderStatus(`Работа по заказу ${o.id} начата`, o.id);
    if (o.chatId && _sameId(activeChatId, o.chatId)) {
      openChat(o.chatId);
    } else {
      renderChatList();
    }
    updateChatBadge();
    return true;
  }

  function showChatProfile() { App.showToast('Профиль чата', 'info'); }

  // ===== INIT =====
  function init() {
    _ensurePinnedSupportChat(true);
    activeChatId = null;
    _mobileLayoutMode = 'list';
    if (!_mobileLayoutEventsBound) {
      _mobileLayoutEventsBound = true;
      window.addEventListener('resize', () => {
        _syncMobileChatLayout();
      });
    }
    render();
    updateChatBadge();
    _bindChatRealtimeEvents();
    _bindTopPopupEvents();
    _startMessageRefreshLoop();
    createUrgentButton();
    initContextMenu();
  }

  function initContextMenu() {
    if (_contextMenuBound) return;
    _contextMenuBound = true;
    document.addEventListener('contextmenu', handleContextMenu);
    let pressTimer = null;
    document.addEventListener('touchstart', (e) => {
      const msgEl = e.target.closest('.chat-msg');
      if (!msgEl) return;
      pressTimer = setTimeout(() => {
        e.preventDefault();
        const msgId = parseInt(msgEl.dataset.msgId);
        showContextMenu(msgId, e.touches[0].clientX, e.touches[0].clientY);
      }, 500);
    }, { passive: false });
    document.addEventListener('touchend', () => { clearTimeout(pressTimer); });
    document.addEventListener('touchmove', () => { clearTimeout(pressTimer); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.chat-context-menu')) closeContextMenu();
    });
  }

  function handleContextMenu(e) {
    const msgEl = e.target.closest('.chat-msg');
    if (!msgEl) return;
    e.preventDefault();
    const msgId = parseInt(msgEl.dataset.msgId);
    showContextMenu(msgId, e.clientX, e.clientY);
  }

  function showContextMenu(msgId, x, y) {
    closeContextMenu();
    if (!activeChatId) return;
    const msgs = getMessages(activeChatId);
    const msg = msgs.find(m => m.id === msgId);
    if (!msg) return;
    const isUser = msg.from === 'user';

    const menu = document.createElement('div');
    menu.className = 'chat-context-menu';
    menu.id = 'chatContextMenu';

    const actor = getCurrentReactionActor();
    const reactionsHtml = REACTIONS.map((r) => {
      const active = !!normalizeReactionActors(msg.reactions?.[r.name])[actor];
      return `<button class="chat-ctx-reaction ${active ? 'chat-ctx-reaction--active' : ''}" onclick="Chat.addReaction(${msgId},'${r.name}')" title="${r.label}">${r.emoji}</button>`;
    }).join('');

    menu.innerHTML = `
      <div class="chat-ctx-reactions">${reactionsHtml}</div>
      <div class="chat-ctx-divider"></div>
      <button class="chat-ctx-item" onclick="Chat.startReply(${msgId})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        Ответить
      </button>
      <button class="chat-ctx-item" onclick="Chat.copyMessageText(${msgId})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Копировать текст
      </button>
      ${(() => {
        const pinned = JSON.parse(localStorage.getItem('chat_pinned_' + activeChatId) || '[]');
        const isAlreadyPinned = pinned.some(p => p.id === msgId);
        return `<button class="chat-ctx-item" onclick="Chat.pinMessage(${msgId})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 17v5"/>
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.76z"/>
            </svg>
            ${isAlreadyPinned ? 'Открепить' : 'Закрепить'}
        </button>`;
        })()}
      <button class="chat-ctx-item" onclick="Chat.openForwardMenu(${msgId})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
        Переслать
      </button>
      ${isUser ? `
        <div class="chat-ctx-divider"></div>
        <button class="chat-ctx-item chat-ctx-item--danger" onclick="Chat.deleteMessage(${msgId})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Удалить
        </button>
      ` : ''}
      <button class="chat-ctx-item" onclick="Chat.toggleSelectMessage(${msgId})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Выделить
      </button>
    `;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x, top = y;
    document.body.appendChild(menu);
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    if (left + mw > vw - 10) left = vw - mw - 10;
    if (top + mh > vh - 10) top = vh - mh - 10;
    if (left < 10) left = 10;
    if (top < 10) top = 10;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    requestAnimationFrame(() => menu.classList.add('chat-context-menu--visible'));
  }

  function closeContextMenu() {
    const menu = document.getElementById('chatContextMenu');
    if (menu) {
      menu.classList.remove('chat-context-menu--visible');
      setTimeout(() => menu.remove(), 200);
    }
  }

  // ===== REPLY =====
  function startReply(msgId) {
    closeContextMenu();
    if (!activeChatId) return;
    const msgs = getMessages(activeChatId);
    const msg = msgs.find(m => m.id === msgId);
    if (!msg) return;
    replyingTo = { id: msgId, text: (msg.text || '').slice(0, 80), from: msg.from };
    renderReplyBar();
    document.getElementById('chatTextField')?.focus();
  }

  function cancelReply() {
    replyingTo = null;
    const bar = document.getElementById('chatReplyBar');
    if (bar) bar.remove();
  }

  function renderReplyBar() {
    let bar = document.getElementById('chatReplyBar');
    if (bar) bar.remove();
    if (!replyingTo) return;
    const input = document.getElementById('chatInput');
    if (!input) return;
    bar = document.createElement('div');
    bar.id = 'chatReplyBar';
    bar.className = 'chat-reply-bar';
    bar.innerHTML = `
      <div class="chat-reply-bar__content">
        <div class="chat-reply-bar__name">${replyingTo.from === 'user' ? 'Вы' : 'Администратор'}</div>
        <div class="chat-reply-bar__text">${escapeHtml(replyingTo.text)}</div>
      </div>
      <button class="chat-reply-bar__close" onclick="Chat.cancelReply()">${IC.x}</button>
    `;
    input.insertBefore(bar, input.firstChild);
  }

  // ===== PIN MESSAGE =====
  function pinMessage(msgId) {
    closeContextMenu();
    if (!activeChatId) return;
    const msgs = getMessages(activeChatId);
    const msg = msgs.find(m => m.id === msgId);
    if (!msg) return;
    let pinned = JSON.parse(localStorage.getItem('chat_pinned_' + activeChatId) || '[]');
    const exists = pinned.find(p => p.id === msgId);
    if (exists) {
      pinned = pinned.filter(p => p.id !== msgId);
      App.showToast('Сообщение откреплено', 'info');
    } else {
      pinned.push({ id: msgId, text: (msg.text || '').slice(0, 100), from: msg.from, time: msg.time });
      App.showToast('Сообщение закреплено', 'success');
    }
    localStorage.setItem('chat_pinned_' + activeChatId, JSON.stringify(pinned));
    if (typeof Storage !== 'undefined' && Storage.set) Storage.set('chat_pinned_' + activeChatId, pinned);
    renderPinnedBar();
  }

  function renderPinnedBar() {
    let bar = document.getElementById('chatPinnedBar');
    if (bar) bar.remove();
    if (!activeChatId) return;
    const pinned = JSON.parse(localStorage.getItem('chat_pinned_' + activeChatId) || '[]');
    if (pinned.length === 0) return;
    const header = document.querySelector('.chat-window__header');
    if (!header) return;
    bar = document.createElement('div');
    bar.id = 'chatPinnedBar';
    bar.className = 'chat-pinned-bar';
    const current = pinned[pinned.length - 1];
    bar.innerHTML = `
      <div class="chat-pinned-bar__icon">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--purple-500)" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.76z"/></svg>
      </div>
      <div class="chat-pinned-bar__content" onclick="Chat.scrollToMessage(${current.id})">
        <div class="chat-pinned-bar__label">Закреплённое${pinned.length > 1 ? ' (' + pinned.length + ')' : ''}</div>
        <div class="chat-pinned-bar__text">${escapeHtml(current.text)}</div>
      </div>
      <button class="chat-pinned-bar__close" onclick="Chat.unpinAll()">${IC.x}</button>
    `;
    header.after(bar);
  }

  function scrollToMessage(msgId) {
    const el = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('chat-msg--highlight');
      setTimeout(() => el.classList.remove('chat-msg--highlight'), 2000);
    }
  }

  function unpinAll() {
    if (!activeChatId) return;
    localStorage.removeItem('chat_pinned_' + activeChatId);
    const bar = document.getElementById('chatPinnedBar');
    if (bar) bar.remove();
    App.showToast('Все сообщения откреплены', 'info');
  }

  // ===== FIX: FORWARD MESSAGE — добавляем метку "Переслано" =====
  function openForwardMenu(msgId) {
    closeContextMenu();
    const chats = getChats();
    let modal = document.getElementById('forwardModal');
    if (modal) modal.remove();

    // Включаем архивные чаты тоже
    const allTargets = chats.filter(c => c.id !== activeChatId);

    modal = document.createElement('div');
    modal.className = 'profile-modal is-open';
    modal.id = 'forwardModal';
    modal.innerHTML = `
      <div class="profile-modal__backdrop" onclick="this.parentElement.remove();document.body.style.overflow='';"></div>
      <div class="profile-modal__container" style="max-width:400px;">
        <div class="profile-modal__header">
          <div class="profile-modal__title">Переслать сообщение</div>
          <button class="profile-modal__close" onclick="this.closest('.profile-modal').remove();document.body.style.overflow='';">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="profile-modal__body">
          <div class="chat-forward-list">
            ${allTargets.map(c => `
              <button class="chat-forward-item" onclick="Chat.forwardMessage(${msgId},'${c.id}')">
                <div class="chat-forward-item__avatar" style="background:${c.orderGradient}">
                  ${c.type === 'support' ? IC.support : '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>'}
                </div>
                <div class="chat-forward-item__info">
                  <div class="chat-forward-item__name">${c.type === 'support' ? 'Tish Team' : c.orderName}</div>
                  <div class="chat-forward-item__type">${c.type === 'support' ? 'Поддержка' : c.isArchived ? 'Архив' : 'Заказ'}</div>
                </div>
              </button>
            `).join('')}
            ${allTargets.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--color-muted);">Нет других чатов</div>' : ''}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  }

  function forwardMessage(msgId, targetChatId) {
    const msgs = getMessages(activeChatId);
    const msg = msgs.find(m => m.id === msgId);
    if (!msg) return;

    const targetMsgs = getMessages(targetChatId);
    targetMsgs.push({
      ...msg,
      id: Date.now(),
      forwarded: true,
      forwardedFrom: activeChatId,
      time: formatTime(new Date()),
      read: false
    });
    saveMessages(targetChatId, targetMsgs);

    document.getElementById('forwardModal')?.remove();
    document.body.style.overflow = '';
    App.showToast('Сообщение переслано', 'success');
    renderChatList();
  }

  // ===== COPY TEXT =====
  function copyMessageText(msgId) {
    closeContextMenu();
    const msgs = getMessages(activeChatId);
    const msg = msgs.find(m => m.id === msgId);
    if (msg && msg.text) {
      navigator.clipboard.writeText(msg.text).then(() => {
        App.showToast('Текст скопирован', 'success');
      });
    }
  }

  // ===== DELETE MESSAGE =====
  function deleteMessage(msgId) {
    closeContextMenu();
    if (!activeChatId) return;
    _withScrollLock(() => {
      const msgs = getMessages(activeChatId);
      const idx = msgs.findIndex(m => m.id === msgId);
      if (idx === -1) return;
      if (msgs[idx].from !== 'user') {
        App.showToast('Можно удалять только свои сообщения', 'warning');
        return;
      }
      msgs.splice(idx, 1);
      saveMessages(activeChatId, msgs);
      renderMessages(activeChatId);
      renderChatList();
      App.showToast('Сообщение удалено', 'info');
    });
  }

  // ===== SELECT MESSAGES =====
  function toggleSelectMessage(msgId) {
    closeContextMenu();
    _withScrollLock(() => {
      if (selectedMessages.has(msgId)) {
        selectedMessages.delete(msgId);
      } else {
        selectedMessages.add(msgId);
      }
      renderMessages(activeChatId);
      renderSelectionBar();
    });
  }

  function renderSelectionBar() {
    let bar = document.getElementById('chatSelectionBar');
    if (bar) bar.remove();
    if (selectedMessages.size === 0) return;
    const input = document.getElementById('chatInput');
    if (!input) return;
    bar = document.createElement('div');
    bar.id = 'chatSelectionBar';
    bar.className = 'chat-selection-bar';
    bar.innerHTML = `
      <span>Выбрано: ${selectedMessages.size}</span>
      <button class="btn btn-sm" style="background:#ef4444;color:white;border:none;" onclick="Chat.deleteSelected()">Удалить</button>
      <button class="btn btn-sm btn-ghost" onclick="Chat.clearSelection()">Отмена</button>
    `;
    input.before(bar);
  }

  function deleteSelected() {
    if (!activeChatId) return;
    _withScrollLock(() => {
      let msgs = getMessages(activeChatId);
      msgs = msgs.filter(m => !(selectedMessages.has(m.id) && m.from === 'user'));
      saveMessages(activeChatId, msgs);
      selectedMessages.clear();
      renderMessages(activeChatId);
      const bar = document.getElementById('chatSelectionBar');
      if (bar) bar.remove();
      App.showToast('Сообщения удалены', 'info');
    });
  }

  function clearSelection() {
    _withScrollLock(() => {
      selectedMessages.clear();
      renderMessages(activeChatId);
      const bar = document.getElementById('chatSelectionBar');
      if (bar) bar.remove();
    });
  }

  // ===== DOUBLE-TAP → HEART =====
  (function() {
    let _dtTime = 0, _dtMsgId = null, _dtHandledByTouch = false;

    function showHeartPop(msgEl) {
      const content = msgEl.querySelector('.chat-msg__content') || msgEl.querySelector('.chat-msg__bubble');
      if (!content) return;
      content.style.position = 'relative';
      const pop = document.createElement('div');
      pop.className = 'chat-msg__heart-pop';
      pop.innerHTML = '<svg viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
      content.appendChild(pop);
      setTimeout(() => {
        pop.classList.add('chat-msg__heart-pop--fade');
        setTimeout(() => pop.remove(), 400);
      }, 600);
    }

    function handleDoubleTap(e) {
      const msgEl = e.target.closest('.chat-msg');
      if (!msgEl) return false;
      if (e.target.closest('button, a, .chat-msg__checkbox, .chat-reaction-menu, .chat-context-menu, .chat-msg__react-btn, .chat-msg__reply, .chat-msg__reactions, .chat-msg__reaction')) return false;
      const msgId = parseInt(msgEl.dataset.msgId);
      if (!msgId || isNaN(msgId)) return false;
      const now = Date.now();
      if (_dtMsgId === msgId && (now - _dtTime) < 400) {
        e.preventDefault();
        e.stopPropagation();
        addReaction(msgId, 'heart');
        showHeartPop(msgEl);
        _dtTime = 0; _dtMsgId = null;
        return true;
      }
      _dtTime = now; _dtMsgId = msgId;
      return false;
    }

    document.addEventListener('touchend', function(e) {
      if (handleDoubleTap(e)) {
        _dtHandledByTouch = true;
        setTimeout(() => { _dtHandledByTouch = false; }, 600);
      }
    }, { passive: false });

    document.addEventListener('click', function(e) {
      if (_dtHandledByTouch) return;
      handleDoubleTap(e);
    });
  })();

  return {
    init, openChat, showChatList, filterChats,
    sendMessage, handleKey, autoResize,
    addImages, addFiles, removeAttachment,
    toggleRecording, startRecording, stopRecording, cancelRecording,
    playVoice, playVoiceById,
    openImagePreview, openImagePreviewById,
    openFilePreview, openFilePreviewById,
    showChatProfile, toggleReactionMenu, addReaction,
    askFaq, callAdmin, openReviewFromChat,
    payUrgentPrepay, openApplyDiscount, payInvoice,
    requestPaymentVerification, openPaymentRequestModal,
    submitPaymentRequest, closePaymentRequestModal,
    closeApplyDiscountModal, previewInvoiceDiscount, submitApplyDiscount,
    copyPaymentRequisites, copyPaymentValue,
    updateChatBadge, toggleUrgentButton,
    openUrgentOrderForm, submitUrgentOrder,
    adminSendInvoice, adminConfirmPayment, adminStartWork,
    adminApprovePaymentRequest, adminRejectPaymentRequest,
    startReply, cancelReply, pinMessage, scrollToMessage, unpinAll,
    openForwardMenu, forwardMessage, copyMessageText,
    deleteMessage, toggleSelectMessage, deleteSelected, clearSelection,
    // Archive/Delete
    archiveChat, unarchiveChat, deleteChat,
    // FAQ toggle
    toggleFaqPanel,
    // Internal
    _setListTab,
    togglePinChat,
    refreshActiveChat: () => { if (activeChatId) openChat(activeChatId); },
  };
})();