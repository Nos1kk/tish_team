/* =====================================================
   ADMIN — Chat Module v3 (Full Feature Parity)
   SVG reactions, voice recording, image/file preview,
   context menu, reply, pin, forward, per-user support
   Syncs via Storage.set (same path as user chat)
   ===================================================== */

((Admin) => {
    let _activeChatId = null;
    let _messages = [];
    let _pollTimer = null;
    let _replyTo = null;
    let _isRecording = false;
    let _mediaRecorder = null;
    let _audioChunks = [];
    let _recSeconds = 0;
    let _recTimer = null;
    let _attachments = [];
    let _pinned = [];
    let _chatList = [];
    let _currentAudio = null;
    let _saving = false;
    let _deletedIds = new Set();
    let _showArchived = false;
    let _storageWarningShown = false;
    let _chatServerTokens = new Map();
    let _mobileLayoutMode = 'list';
    let _mobileLayoutEventsBound = false;

    const MAX_ATTACH_FILE_BYTES = 4 * 1024 * 1024;
    const MAX_ATTACH_TOTAL_BYTES = 10 * 1024 * 1024;
    const CURRENCY_META = {
        USD: { symbol: '$', code: 'USD' },
        RUB: { symbol: '₽', code: 'RUB' }
    };

    function _isMobileViewport() {
        return window.innerWidth <= 768;
    }

    function _syncMobileLayout() {
        const layout = document.querySelector('.achat-layout');
        if (!layout) return;

        if (!_isMobileViewport()) {
            layout.classList.remove('achat-layout--mobile-list');
            layout.classList.remove('achat-layout--mobile-chat');
            return;
        }

        const mode = (_mobileLayoutMode === 'chat' && _activeChatId) ? 'chat' : 'list';
        layout.classList.toggle('achat-layout--mobile-chat', mode === 'chat');
        layout.classList.toggle('achat-layout--mobile-list', mode !== 'chat');
    }

    function _normalizeCurrency(currency, fallback = '') {
        const code = String(currency || '').toUpperCase();
        if (CURRENCY_META[code]) return code;
        const fb = String(fallback || '').toUpperCase();
        return CURRENCY_META[fb] ? fb : '';
    }

    function _formatMoney(amount, currency, withCode = false) {
        const numeric = Math.max(0, Math.round(Number(amount || 0)));
        const code = _normalizeCurrency(currency, 'USD') || 'USD';
        const meta = CURRENCY_META[code] || CURRENCY_META.USD;
        const spaced = String(numeric).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return withCode ? `${meta.symbol}${spaced} ${meta.code}` : `${meta.symbol}${spaced}`;
    }

    function _messageToken(msg, fallback = 0) {
        if (!msg || typeof msg !== 'object') return fallback;
        const ts = Date.parse(msg.date || msg.createdAt || '');
        if (Number.isFinite(ts) && ts > 0) return ts;
        const idNum = Number(msg.id);
        if (Number.isFinite(idNum) && idNum > 0) return idNum;
        const timeStr = String(msg.time || '').trim();
        const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
        if (m) {
            const d = new Date();
            d.setHours(Number(m[1]), Number(m[2]), 0, 0);
            return d.getTime();
        }
        return fallback;
    }

    function _messagePreview(msg, fallbackCurrency = 'USD') {
        if (!msg || typeof msg !== 'object') return '';
        if (msg.type === 'image') return 'Фото';
        if (msg.type === 'file') return 'Файл';
        if (msg.type === 'voice') return 'Голосовое';
        if (msg.type === 'invoice') {
            const currency = _normalizeCurrency(msg.currency || msg.invoiceCurrency || '', fallbackCurrency) || 'USD';
            return 'Счёт ' + _formatMoney(msg.invoiceAmount || 0, currency);
        }
        return String(msg.text || '').trim();
    }

    function _invoiceCurrency(msg) {
        const raw = String(msg?.currency || msg?.invoiceCurrency || '').toUpperCase();
        const fromMsg = CURRENCY_META[raw] ? raw : '';
        if (fromMsg) return fromMsg;
        const orders = typeof Admin.getOrders === 'function' ? Admin.getOrders() : [];
        const order = orders.find((o) => String(o?.chatId ?? '') === String(_activeChatId ?? ''));
        const regionFallback = String(order?.region || '').toUpperCase() === 'RU' ? 'RUB' : 'USD';
        return _normalizeCurrency(order?.invoiceCurrency || order?.currency || order?.prepaymentCurrency || '', regionFallback) || regionFallback;
    }

    // ── SVG Icons (same as chat.js) ──────────────────────
    const IC = {
        heart: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ec4899" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        thumbsUp: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
        fire: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f97316" stroke-width="2"><path d="M12 22c-4.97 0-9-2.69-9-6 0-4 5-11 9-14 4 3 9 10 9 14 0 3.31-4.03 6-9 6z"/></svg>',
        sparkle: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#d946ef" stroke-width="2"><path d="M12 2l2.09 6.26L20 10.27l-4.74 3.74L16.18 22 12 18.56 7.82 22l.92-7.99L4 10.27l5.91-1.01z"/></svg>',
        check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        file: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        image: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        mic: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg>',
        x: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        forward: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>',
        trash: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
        send: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
        refresh: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
        pin: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 2h6l-1.5 5.5L17 11H7l3.5-3.5z"/></svg>',
        copy: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
        reply: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>'
    };

    const REACTIONS = [
        { emoji: IC.heart, name: 'heart', label: 'Love' },
        { emoji: IC.thumbsUp, name: 'thumbsUp', label: 'Like' },
        { emoji: IC.fire, name: 'fire', label: 'Fire' },
        { emoji: IC.sparkle, name: 'sparkle', label: 'Wow' },
        { emoji: IC.check, name: 'check', label: 'Done' }
    ];

    // ── Helpers ───────────────────────────────────────────
    function _esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function _fmtTime(m) {
        if (m.time) return m.time;
        if (m.date) return new Date(m.date).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
        return '';
    }

    function _genVoiceBars() {
        let bars = '';
        for (let i = 0; i < 24; i++) {
            bars += `<div class="achat-voice-bar" style="height:${4 + Math.random() * 20}px"></div>`;
        }
        return bars;
    }

    function _fmtSize(bytes) {
        const b = Number(bytes || 0);
        if (b < 1024) return b + ' B';
        if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
        return (b / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function _isDebugGhostMessage(msg) {
        if (!msg || msg.type !== 'text') return false;
        const text = String(msg.text || '').trim().toLowerCase();
        return text === 'test append' || text === 'test from admin';
    }

    function _supportIcon(chat = null, compact = false) {
        const avatar = String(chat?.userAvatar || '').trim();
        const sizeClass = compact ? ' achat-support-avatar--sm' : '';
        if (avatar) {
            return `<span class="achat-support-avatar${sizeClass}"><img src="${_esc(avatar)}" alt="${_esc(chat?.label || 'Пользователь')}" loading="lazy"></span>`;
        }
        const compactClass = compact ? ' achat-support-t--sm' : '';
        return `<span class="achat-support-t${compactClass}">T</span>`;
    }

    function _headerAvatar(chat) {
        if (chat?.type === 'support') {
            return _supportIcon(chat, false);
        }
        const orderImage = String(chat?.orderImage || '').trim();
        if (orderImage) {
            return `<span class="achat-header__avatar"><img src="${_esc(orderImage)}" alt="${_esc(chat?.label || 'Чат')}" loading="lazy"></span>`;
        }
        return '<span class="achat-header__avatar achat-header__avatar--fallback">📦</span>';
    }

    function _resolveOrderImage(order) {
        if (!order) return null;
        if (order.productImage) return String(order.productImage);
        const products = typeof Admin.getProducts === 'function' ? Admin.getProducts() : [];
        const product = products.find((p) => String(p?.id ?? '') === String(order.productId ?? ''));
        if (!product || !Array.isArray(product.media)) return null;
        const firstImage = product.media.find((m) => m && m.type === 'image' && m.url);
        return firstImage ? String(firstImage.url) : null;
    }

    function _renderOrderSidebarIcon(chat) {
        const gradient = _esc(chat?.orderGradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)');
        const image = chat?.orderImage
            ? `<img class="achat-sidebar__thumb" src="${_esc(chat.orderImage)}" alt="${_esc(chat.label || 'Товар')}" loading="lazy">`
            : '📦';
        const urgent = chat?.isUrgent ? '<span class="achat-sidebar__item-icon-urgent">⚡</span>' : '';
        return `<span class="achat-sidebar__item-icon achat-sidebar__item-icon--thumb" style="background:${gradient};">${image}${urgent}</span>`;
    }

    function _attachmentBytesTotal() {
        return _attachments.reduce((sum, item) => sum + Number(item?.bytes || 0), 0);
    }

    function _canAttach(file) {
        if (!file) return false;
        if (_attachments.length >= 10) {
            if (typeof App !== 'undefined') App.showToast('Максимум 10 вложений за раз', 'warning');
            return false;
        }
        if (file.size > MAX_ATTACH_FILE_BYTES) {
            if (typeof App !== 'undefined') App.showToast('Файл слишком большой. Лимит 4 МБ', 'warning');
            return false;
        }
        if ((_attachmentBytesTotal() + file.size) > MAX_ATTACH_TOTAL_BYTES) {
            if (typeof App !== 'undefined') App.showToast('Слишком большой общий размер вложений (лимит 10 МБ)', 'warning');
            return false;
        }
        return true;
    }

    function _reactionActor() {
        return 'admin';
    }

    function _normalizeReactionActors(value) {
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

    function _reactionCount(value) {
        return Object.keys(_normalizeReactionActors(value)).length;
    }

    function _mergeReactionMaps(a, b) {
        const out = {};
        const srcA = (a && typeof a === 'object') ? a : {};
        const srcB = (b && typeof b === 'object') ? b : {};
        const names = new Set([...Object.keys(srcA), ...Object.keys(srcB)]);

        names.forEach((name) => {
            const actors = {
                ..._normalizeReactionActors(srcA[name]),
                ..._normalizeReactionActors(srcB[name])
            };
            if (Object.keys(actors).length > 0) out[name] = actors;
        });
        return out;
    }

    function _mergeMessage(oldMsg, newMsg) {
        if (!oldMsg) return newMsg;
        if (!newMsg) return oldMsg;
        const merged = { ...oldMsg, ...newMsg };
        merged.reactions = _mergeReactionMaps(oldMsg.reactions, newMsg.reactions);
        if (oldMsg.deleted || newMsg.deleted) merged.deleted = true;
        return merged;
    }

    function _mergeMessageLists(serverMsgs, localMsgs) {
        const merged = new Map();
        (Array.isArray(serverMsgs) ? serverMsgs : []).forEach((m) => {
            if (m && m.id !== undefined && m.id !== null) merged.set(m.id, m);
        });
        (Array.isArray(localMsgs) ? localMsgs : []).forEach((m) => {
            if (!m || m.id === undefined || m.id === null) return;
            const prev = merged.get(m.id);
            merged.set(m.id, _mergeMessage(prev, m));
        });
        return Array.from(merged.values()).sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    function _getLastMessageToken(messages) {
        let token = 0;
        (Array.isArray(messages) ? messages : []).forEach((m, idx) => {
            token = Math.max(token, _messageToken(m, idx + 1));
        });
        return token;
    }

    // ══════════════════════════════════════════════════════
    // TAB RENDER
    // ══════════════════════════════════════════════════════

    async function renderTab(c) {
        _stopPoll();
        await _buildChatList();

        if (!_mobileLayoutEventsBound) {
            _mobileLayoutEventsBound = true;
            window.addEventListener('resize', _syncMobileLayout);
        }
        if (!_activeChatId) _mobileLayoutMode = 'list';

        c.innerHTML = `
        <div class="achat-layout">
          <div class="achat-sidebar">
            <div class="achat-sidebar__header" id="adminChatSidebarHeader">
              <span class="achat-sidebar__title">Чаты</span>
              <button class="achat-icon-btn" onclick="Admin.toggleShowArchived()" title="Архив">📥</button>
              <button class="achat-icon-btn" onclick="Admin.refreshAdminChat()" title="Обновить">${IC.refresh}</button>
            </div>
            <div class="achat-sidebar__list" id="adminChatList"></div>
          </div>
          <div class="achat-main">
            <div class="achat-header" id="adminChatHeader"></div>
            <div class="achat-pinned" id="adminPinnedBar"></div>
            <div class="achat-messages" id="adminChatMessages">
              <div class="achat-empty">Выберите чат</div>
            </div>
            <div class="achat-reply-bar" id="adminReplyBar" style="display:none;"></div>
            <div class="achat-rec-bar" id="adminRecBar" style="display:none;">
              <span class="achat-rec-dot"></span>
              <span class="achat-rec-time" id="adminRecTime">0:00</span>
              <span class="achat-rec-label">Запись...</span>
              <button class="achat-icon-btn achat-rec-cancel" onclick="Admin.cancelAdminRec()">${IC.x}</button>
              <button class="btn btn-primary btn-sm" onclick="Admin.stopAdminRec()">Отправить</button>
            </div>
            <div class="achat-attach-preview" id="adminAttachPreview" style="display:none;"></div>
            <div class="achat-input-row" id="adminChatInputArea">
              <div class="achat-input-actions">
                <label class="achat-icon-btn" title="Фото">
                  <input type="file" accept="image/*" multiple style="display:none;" onchange="Admin.addAdminImages(this)">
                  ${IC.image}
                </label>
                <label class="achat-icon-btn" title="Файл">
                  <input type="file" multiple style="display:none;" onchange="Admin.addAdminFiles(this)">
                  ${IC.file}
                </label>
              </div>
              <textarea id="adminChatInput" class="achat-input-field" placeholder="Сообщение..." rows="1"
                oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Admin.sendAdminMessage();}"></textarea>
              <button class="achat-icon-btn" onclick="Admin.toggleAdminRec()" id="adminRecBtn" title="Голосовое">${IC.mic}</button>
              <button class="achat-send-btn" onclick="Admin.sendAdminMessage()">${IC.send}</button>
            </div>
          </div>
        </div>`;

        _renderChatList();
        if (_activeChatId) {
            _loadChat();
        }
        _syncMobileLayout();
        _startPoll();
    }

    // ══════════════════════════════════════════════════════
    // CHAT LIST — per-user support + order chats
    // ══════════════════════════════════════════════════════

    async function _buildChatList() {
        _chatList = [];

        // 1. Fetch all support chats from server (per-user)
        try {
            const res = await fetch('/api/store/admin/support-chats');
            const json = await res.json();
            if (json.success && Array.isArray(json.chats)) {
                json.chats.forEach(sc => {
                    _chatList.push({
                        id: sc.chatId,
                        label: (sc.userName || 'Пользователь'),
                        type: 'support',
                        userAvatar: String(sc.userAvatar || '').trim(),
                        subtitle: sc.googleId ? sc.googleId.slice(0, 8) + '...' : '',
                        lastMsg: sc.lastMessage || '',
                        lastTime: sc.lastTime || '',
                        lastAt: Number(sc.lastAt || 0),
                        unread: sc.unread || 0,
                        orderImage: null,
                        orderGradient: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
                        isUrgent: false
                    });
                });
            }
        } catch {
            // Fallback: check for old-style 'support' chat
            _chatList.push({
                id: 'support', label: 'Поддержка', type: 'support', subtitle: '', lastMsg: '', lastTime: '', unread: 0,
                lastAt: 0,
                userAvatar: '',
                orderImage: null, orderGradient: 'linear-gradient(135deg,#06b6d4,#8b5cf6)', isUrgent: false
            });
        }

        // 2. Order chats
        const orders = Admin.getOrders();
        orders.forEach(o => {
            if (o.chatId) {
                let msgs = [];
                try {
                    const raw = JSON.parse(localStorage.getItem('chat_' + o.chatId) || '[]');
                    msgs = Array.isArray(raw) ? raw.filter((m) => m && !m.deleted && !_isDebugGhostMessage(m)) : [];
                } catch {
                    msgs = [];
                }
                const last = msgs.length ? msgs[msgs.length - 1] : null;
                const orderCurrency = _normalizeCurrency(o.invoiceCurrency || o.currency || o.prepaymentCurrency || '', 'USD') || 'USD';
                _chatList.push({
                    id: o.chatId,
                    label: (o.productName || o.id),
                    type: 'order',
                    subtitle: o.id,
                    lastMsg: _messagePreview(last, orderCurrency),
                    lastTime: last ? _fmtTime(last) : '',
                    unread: msgs.filter((m) => m && m.from === 'user' && !m.read).length,
                    lastAt: _messageToken(last, msgs.length),
                    userAvatar: '',
                    orderImage: _resolveOrderImage(o),
                    orderGradient: o.productGradient || 'linear-gradient(135deg,#8b5cf6,#d946ef)',
                    isUrgent: !!o.isUrgent
                });
            }
        });

        _chatList.sort((a, b) => {
            const byTime = Number(b.lastAt || 0) - Number(a.lastAt || 0);
            if (byTime !== 0) return byTime;
            const byUnread = Number(b.unread || 0) - Number(a.unread || 0);
            if (byUnread !== 0) return byUnread;
            return String(a.id || '').localeCompare(String(b.id || ''));
        });

        if (!_activeChatId && _chatList.length) {
            _activeChatId = _chatList[0].id;
        }
    }

    function _getArchived() {
        try { return JSON.parse(localStorage.getItem('admin_archived_chats') || '[]'); }
        catch { return []; }
    }
    function _setArchived(list) {
        localStorage.setItem('admin_archived_chats', JSON.stringify(list));
    }
    function _toggleArchiveChat(chatId) {
        const archived = _getArchived();
        const idx = archived.indexOf(chatId);
        if (idx >= 0) archived.splice(idx, 1);
        else archived.push(chatId);
        _setArchived(archived);
        _renderChatList();
        if (typeof App !== 'undefined') App.showToast(idx >= 0 ? 'Разархивировано' : 'Архивировано', 'success');
    }
    function _toggleShowArchived() {
        _showArchived = !_showArchived;
        _renderChatList();
    }

    function _renderChatList() {
        const el = document.getElementById('adminChatList');
        const headerEl = document.getElementById('adminChatSidebarHeader');
        if (!el) return;
        const prevScrollTop = el.scrollTop;

        const archived = _getArchived();
        const active = _chatList.filter(ch => !archived.includes(ch.id));
        const archivedList = _chatList.filter(ch => archived.includes(ch.id));
        const list = _showArchived ? archivedList : active;

        // Update sidebar header
        if (headerEl) {
            headerEl.innerHTML = `
                <span class="achat-sidebar__title">${_showArchived ? '📥 Архив' : 'Чаты'}</span>
                <button class="achat-icon-btn ${_showArchived ? 'achat-icon-btn--active' : ''}" onclick="Admin.toggleShowArchived()" title="${_showArchived ? 'Активные (' + active.length + ')' : 'Архив (' + archivedList.length + ')'}">${_showArchived ? '💬' : '📥'}</button>
                <button class="achat-icon-btn" onclick="Admin.refreshAdminChat()" title="Обновить">${IC.refresh}</button>
            `;
        }

        if (!list.length) {
            el.innerHTML = `<div class="achat-empty" style="padding:20px;">${_showArchived ? 'Нет архивных чатов' : 'Нет чатов'}</div>`;
            el.scrollTop = 0;
            return;
        }

        el.innerHTML = list.map(ch => {
            const isArc = archived.includes(ch.id);
            return `
            <div class="achat-sidebar__item ${ch.id === _activeChatId ? 'achat-sidebar__item--active' : ''}" 
                 onclick="Admin.openChat('${_esc(ch.id)}')">
                ${ch.type === 'support'
                    ? `<div class="achat-sidebar__item-icon">${_supportIcon(ch, true)}</div>`
                    : _renderOrderSidebarIcon(ch)
                }
                <div class="achat-sidebar__item-info">
                    <div class="achat-sidebar__item-name">${_esc(ch.label || '')}</div>
                    ${ch.subtitle ? `<div class="achat-sidebar__item-sub">${_esc(ch.subtitle)}</div>` : ''}
                    ${ch.lastMsg ? `<div class="achat-sidebar__item-last">${_esc(ch.lastMsg.slice(0, 35))}</div>` : ''}
                </div>
                ${ch.unread ? `<span class="achat-sidebar__badge">${ch.unread}</span>` : ''}
                <button class="achat-icon-btn achat-archive-btn" onclick="event.stopPropagation();Admin.archiveChat('${_esc(ch.id)}')" title="${isArc ? 'Разархивировать' : 'Архивировать'}">${isArc ? '💬' : '📥'}</button>
            </div>`;
        }).join('');

        const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
        el.scrollTop = Math.min(prevScrollTop, maxScroll);
    }

    function _renderHeader() {
        const bar = document.getElementById('adminChatHeader');
        if (!bar) return;
        const ch = _chatList.find(c => c.id === _activeChatId);
        const isSupport = ch?.type === 'support';
        const archived = _getArchived();
        const isArc = archived.includes(_activeChatId);
        const headerAvatar = _headerAvatar(ch || {});
        const headerDot = isSupport ? '' : '<span class="achat-header__dot achat-header__dot--muted"></span>';
        bar.innerHTML = `
            <div class="achat-header__left">
                <button class="achat-icon-btn achat-mobile-back-btn" onclick="Admin.showAdminChatList()" title="К списку">←</button>
                ${headerAvatar}
                ${headerDot}
                <span class="achat-header__name">${_esc(ch?.label || _activeChatId)}</span>
                ${ch?.isUrgent ? '<span class="admin-urgent-badge">⚡ Срочно</span>' : ''}
            </div>
            <div class="achat-header__actions">
                <button class="achat-icon-btn" onclick="Admin.archiveChat('${_esc(_activeChatId)}')" title="${isArc ? 'Разархивировать' : 'Архивировать'}">${isArc ? '💬' : '📥'}</button>
                <button class="achat-icon-btn" onclick="Admin.refreshAdminChat()" title="Обновить">${IC.refresh}</button>
            </div>
        `;
    }

    // ══════════════════════════════════════════════════════
    // MESSAGES: Load, render, save
    // ══════════════════════════════════════════════════════

    async function _loadChat() {
        if (!_activeChatId) return;
        let serverMsgs = null;
        const cachedLocal = JSON.parse(localStorage.getItem('chat_' + _activeChatId) || '[]');
        const localSource = _messages.length ? _messages : cachedLocal;
        const sinceToken = Number(_chatServerTokens.get(String(_activeChatId)) || 0);

        try {
            const query = `?since=${encodeURIComponent(String(sinceToken || 0))}&limit=240`;
            const res = await fetch('/api/store/chat/' + encodeURIComponent(_activeChatId) + query);
            const json = await res.json();
            if (json.success && Array.isArray(json.messages)) {
                if (json.lastToken !== undefined && json.lastToken !== null) {
                    _chatServerTokens.set(String(_activeChatId), Number(json.lastToken) || 0);
                }
                if (json.incremental && json.messages.length === 0) {
                    return;
                }
                serverMsgs = json.messages;
            }
        } catch {}

        if (serverMsgs) {
            _messages = _mergeMessageLists(serverMsgs, localSource);
            _deletedIds.forEach((id) => {
                const msg = _messages.find((m) => m.id === id);
                if (msg) msg.deleted = true;
            });
        } else if (!_messages.length) {
            _messages = JSON.parse(localStorage.getItem('chat_' + _activeChatId) || '[]');
        }

        _messages = _messages.filter((m) => !m.deleted && !_isDebugGhostMessage(m));

        let readUpdated = false;
        _messages.forEach((m) => {
            if (m && m.from === 'user' && !m.read) {
                m.read = true;
                readUpdated = true;
            }
        });

        localStorage.setItem('chat_' + _activeChatId, JSON.stringify(_messages));
        if (readUpdated) {
            await _saveChat();
            const current = _chatList.find((c) => c.id === _activeChatId);
            if (current) current.unread = 0;
        }
        _loadPinned();
        _renderHeader();
        _renderMessages();
        _renderPinnedBar();
    }

    function _persistLocalChatSnapshot() {
        if (!_activeChatId) return;
        try {
            localStorage.setItem('chat_' + _activeChatId, JSON.stringify(_messages));
        } catch (err) {
            if (!_storageWarningShown) {
                _storageWarningShown = true;
                if (typeof App !== 'undefined') App.showToast('Локальное хранилище переполнено. Уменьшите размер вложений.', 'warning');
            }
        }

        if (typeof Storage !== 'undefined' && typeof Storage.set === 'function') {
            Storage.set('chat_' + _activeChatId, _messages);
        }
    }

    function _appendMessageToServer(msg) {
        if (!_activeChatId || !msg) return Promise.resolve(false);
        return fetch('/api/store/chat/' + encodeURIComponent(_activeChatId) + '/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
        }).then((res) => res.ok).catch(() => false);
    }

    function _pushAdminMessagesNow(messages) {
        const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
        if (!_activeChatId || list.length === 0) return;
        Promise.allSettled(list.map((m) => _appendMessageToServer(m))).finally(() => {
            _loadChat();
        });
    }

    async function _saveChat() {
        if (!_activeChatId) return;
        _saving = true;
        try {
            // 1. localStorage мгновенно
            try {
                localStorage.setItem('chat_' + _activeChatId, JSON.stringify(_messages));
            } catch (err) {
                if (!_storageWarningShown) {
                    _storageWarningShown = true;
                    if (typeof App !== 'undefined') App.showToast('Локальное хранилище переполнено. Уменьшите размер вложений.', 'warning');
                }
            }

            // 2. Прямой POST на сервер (чат-эндпоинт с merge)
            try {
                await fetch('/api/store/chat/' + encodeURIComponent(_activeChatId), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: _messages })
                });
            } catch (e) {
                console.warn('[AdminChat] Server save failed:', e);
                // Fallback: через Storage.set batch
                if (typeof Storage !== 'undefined') {
                    if (typeof Storage.setNow === 'function') {
                        Storage.setNow('chat_' + _activeChatId, _messages).catch(() => {
                            if (typeof Storage.set === 'function') Storage.set('chat_' + _activeChatId, _messages);
                        });
                    } else if (typeof Storage.set === 'function') {
                        Storage.set('chat_' + _activeChatId, _messages);
                    }
                }
            }
        } finally {
            _saving = false;
        }
    }

    // ── Pinned ───────────────────────────────────────────
    function _loadPinned() {
        try { _pinned = JSON.parse(localStorage.getItem('chat_pinned_' + _activeChatId) || '[]'); }
        catch { _pinned = []; }
    }
    function _savePinned() {
        localStorage.setItem('chat_pinned_' + _activeChatId, JSON.stringify(_pinned));
    }

    // ══════════════════════════════════════════════════════
    // RENDER MESSAGES
    // ══════════════════════════════════════════════════════

    function _renderMessages() {
        const box = document.getElementById('adminChatMessages');
        if (!box) return;

        const visible = _messages.filter(m => !m.deleted);
        if (!visible.length) {
            box.innerHTML = '<div class="achat-empty">Сообщений нет</div>';
            return;
        }

        box.innerHTML = visible.map(m => _renderMsg(m)).join('');
        box.scrollTop = box.scrollHeight;
    }

    function _renderMsg(m) {
        const isAdmin = m.from === 'admin';
        const isSystem = m.from === 'system' || m.type === 'system';
        const time = _fmtTime(m);
        const isPinned = _pinned.includes(m.id);
        const activeChat = _chatList.find((c) => c.id === _activeChatId);
        const senderName = activeChat && activeChat.type === 'support'
            ? String(activeChat.label || 'Пользователь')
            : 'Пользователь';

        if (isSystem) {
            return `<div class="achat-msg-system">${_esc(m.text)}</div>`;
        }

        let content = '';
        switch (m.type) {
            case 'voice':
                const audioSrc = m.audioData || m.audio || '';
                content = `
                    <div class="achat-voice">
                        <button class="achat-voice-btn" onclick="Admin.playAdminVoice(this)" data-audio="${_esc(audioSrc)}">▶</button>
                        <div class="achat-voice-wave">${_genVoiceBars()}</div>
                        <span class="achat-voice-dur">${m.duration || '0:00'}</span>
                    </div>`;
                break;
            case 'image':
                const imgSrc = m.imageData || m.imageUrl || '';
                content = `<img class="achat-msg-img" src="${_esc(imgSrc)}" onclick="Admin.previewImage(this.src)" alt="image">`;
                if (m.text) content += `<div class="achat-msg-text">${_esc(m.text)}</div>`;
                break;
            case 'file':
                content = `
                    <div class="achat-msg-file" onclick="Admin.downloadFile('${_esc(String(m.id || ''))}', '${_esc(m.fileName || 'file')}')">
                        <span class="achat-msg-file__icon">${IC.file}</span>
                        <span class="achat-msg-file__name">${_esc(m.fileName || 'Файл')}${m.fileSize ? ` • ${_esc(m.fileSize)}` : ''}${m.mimeType ? ` • ${_esc(m.mimeType)}` : ''}</span>
                    </div>`;
                if (m.text) content += `<div class="achat-msg-text">${_esc(m.text)}</div>`;
                break;
            case 'invoice':
                content = `<div class="achat-msg-invoice">💰 Счёт: ${_formatMoney(m.invoiceAmount || 0, _invoiceCurrency(m), true)}</div>`;
                break;
            default:
                content = `<div class="achat-msg-text">${_esc(m.text || '')}</div>`;
        }

        let replyHtml = '';
        if (m.replyTo) {
            const orig = _messages.find(x => x.id === m.replyTo);
            if (orig) {
                replyHtml = `
                    <div class="achat-reply-quote" onclick="Admin.scrollToAdminMsg(${m.replyTo})">
                        <div class="achat-reply-quote__name">${orig.from === 'admin' ? 'Админ' : 'Пользователь'}</div>
                        <div class="achat-reply-quote__text">${_esc((orig.text || '').slice(0, 60))}</div>
                    </div>`;
            }
        }

        let fwdLabel = m.forwarded ? `<div class="achat-fwd-label">${IC.forward} Переслано</div>` : '';

        let reactionsHtml = '';
        if (m.reactions) {
            const keys = Object.keys(m.reactions).filter((k) => _reactionCount(m.reactions[k]) > 0);
            if (keys.length) {
                const items = keys.map((name) => {
                    const r = REACTIONS.find((x) => x.name === name);
                    if (!r) return '';
                    const count = _reactionCount(m.reactions[name]);
                    const isMine = !!_normalizeReactionActors(m.reactions[name])[_reactionActor()];
                    return `<span class="achat-reaction ${isMine ? 'achat-reaction--active' : ''}" onclick="Admin.adminReact(${m.id},'${name}')">${r.emoji}${count > 1 ? `<span class="achat-reaction-count">${count}</span>` : ''}</span>`;
                });
                reactionsHtml = `<div class="achat-reactions">${items.join('')}</div>`;
            }
        }

        return `
        <div id="adminMsg-${m.id}" class="achat-msg ${isAdmin ? 'achat-msg--admin' : 'achat-msg--user'}"
             oncontextmenu="event.preventDefault();Admin.showAdminMsgMenu(event,${m.id});">
            <div class="achat-msg__bubble ${isAdmin ? 'achat-bubble--admin' : 'achat-bubble--user'}">
                ${isPinned ? `<div class="achat-pinned-label">${IC.pin} Закреплено</div>` : ''}
                ${fwdLabel}
                ${!isAdmin ? `<div class="achat-msg__sender">${_esc(senderName)}</div>` : ''}
                ${replyHtml}
                ${content}
                <div class="achat-msg__time">${time}${isAdmin ? ' ✓' : ''}</div>
                ${reactionsHtml}
            </div>
        </div>`;
    }

    function _renderPinnedBar() {
        const bar = document.getElementById('adminPinnedBar');
        if (!bar) return;
        if (!_pinned.length) { bar.innerHTML = ''; return; }
        const last = _messages.find(m => m.id === _pinned[_pinned.length - 1]);
        bar.innerHTML = `
            <div class="achat-pinned__content" onclick="Admin.scrollToAdminMsg(${_pinned[_pinned.length - 1]})">
                ${IC.pin}
                <span class="achat-pinned__text">${_esc(last?.text || 'Закреплённое сообщение')}</span>
                <span class="achat-pinned__count">${_pinned.length}</span>
                <button class="achat-icon-btn" onclick="event.stopPropagation();Admin.unpinAllAdmin()">${IC.x}</button>
            </div>
        `;
    }

    function _renderReplyBar() {
        const bar = document.getElementById('adminReplyBar');
        if (!bar) return;
        if (!_replyTo) { bar.style.display = 'none'; return; }
        const orig = _messages.find(m => m.id === _replyTo);
        bar.style.display = 'flex';
        bar.innerHTML = `
            <span class="achat-reply-bar__icon">${IC.reply}</span>
            <span class="achat-reply-bar__text">${_esc(orig?.text || '...')}</span>
            <button class="achat-icon-btn" onclick="Admin.cancelAdminReply()">${IC.x}</button>
        `;
    }

    function _renderAttachPreview() {
        const el = document.getElementById('adminAttachPreview');
        if (!el) return;
        if (!_attachments.length) { el.style.display = 'none'; return; }
        el.style.display = 'flex';
        el.innerHTML = _attachments.map((a, i) => `
            <div class="achat-attach-item">
                ${a.type === 'image' ? IC.image : IC.file}
                <span>${_esc((a.name || '').slice(0, 20))}${a.size ? ` • ${_esc(a.size)}` : ''}</span>
                <button class="achat-icon-btn" onclick="Admin.removeAdminAttach(${i})">${IC.x}</button>
            </div>
        `).join('');
    }

    // ══════════════════════════════════════════════════════
    // CONTEXT MENU
    // ══════════════════════════════════════════════════════

    function showMsgMenu(e, msgId) {
        const old = document.getElementById('adminCtxMenu');
        if (old) old.remove();

        const m = _messages.find(x => x.id === msgId);
        if (!m) return;
        const isPinned = _pinned.includes(msgId);

        const menu = document.createElement('div');
        menu.id = 'adminCtxMenu';
        menu.className = 'achat-ctx-menu';
        menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
        menu.style.top = Math.min(e.clientY, window.innerHeight - 320) + 'px';

        // Reactions row
        const reactRow = document.createElement('div');
        reactRow.className = 'achat-ctx-reactions';
        REACTIONS.forEach(r => {
            const btn = document.createElement('button');
            btn.className = 'achat-ctx-reaction-btn';
            btn.innerHTML = r.emoji;
            btn.title = r.label;
            const isActive = !!_normalizeReactionActors(m.reactions?.[r.name])[_reactionActor()];
            if (isActive) btn.classList.add('achat-ctx-reaction-btn--active');
            btn.onclick = () => { _addReaction(msgId, r.name); menu.remove(); };
            reactRow.appendChild(btn);
        });
        menu.appendChild(reactRow);

        // Actions
        const actions = [
            { icon: IC.reply, label: 'Ответить', action: () => { _replyTo = msgId; _renderReplyBar(); document.getElementById('adminChatInput')?.focus(); } },
            { icon: IC.copy, label: 'Копировать', action: () => { navigator.clipboard.writeText(m.text || ''); if (typeof App !== 'undefined') App.showToast('Скопировано', 'success'); } },
            { icon: IC.pin, label: isPinned ? 'Открепить' : 'Закрепить', action: () => _togglePin(msgId) },
            { icon: IC.forward, label: 'Переслать', action: () => _openForwardMenu(msgId) },
            { icon: IC.trash, label: 'Удалить', action: () => _deleteMsg(msgId), danger: true },
        ];

        actions.forEach(it => {
            const btn = document.createElement('button');
            btn.className = 'achat-ctx-item' + (it.danger ? ' achat-ctx-item--danger' : '');
            btn.innerHTML = `<span class="achat-ctx-item__icon">${it.icon}</span>${it.label}`;
            btn.onclick = () => { it.action(); menu.remove(); };
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
        setTimeout(() => {
            const close = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); } };
            document.addEventListener('click', close);
        }, 10);
    }

    // ══════════════════════════════════════════════════════
    // ACTIONS
    // ══════════════════════════════════════════════════════

    function sendMessage() {
        const input = document.getElementById('adminChatInput');
        const text = input?.value?.trim();
        if (!text && !_attachments.length) return;

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        const base = {
            id: Date.now(),
            from: 'admin',
            time: timeStr,
            date: now.toISOString(),
            read: false,
            reactions: {}
        };

        if (_replyTo) { base.replyTo = _replyTo; _replyTo = null; _renderReplyBar(); }

        const outbound = [];

        if (_attachments.length) {
            for (const att of _attachments) {
                const msg = { ...base, id: Date.now() + Math.random() * 1000 | 0 };
                if (att.type === 'image') {
                    msg.type = 'image';
                    msg.imageData = att.data;
                    msg.mimeType = att.mimeType || 'image/*';
                    msg.fileSize = att.size || '';
                    msg.bytes = att.bytes || 0;
                    if (text && _attachments.indexOf(att) === 0) msg.text = text;
                } else {
                    msg.type = 'file';
                    msg.fileName = att.name;
                    msg.fileData = att.data;
                    msg.fileSize = att.size || '';
                    msg.mimeType = att.mimeType || 'application/octet-stream';
                    msg.bytes = att.bytes || 0;
                }
                _messages.push(msg);
                outbound.push(msg);
            }
            _attachments = [];
            _renderAttachPreview();
        } else {
            base.type = 'text';
            base.text = text;
            _messages.push(base);
            outbound.push(base);
        }

        input.value = '';
        input.style.height = 'auto';
        _persistLocalChatSnapshot();
        _renderMessages();
        _pushAdminMessagesNow(outbound);

        if (typeof Admin.logAction === 'function') {
            Admin.logAction('Чат', `[${_activeChatId}] ${(text || 'файл').slice(0, 40)}`);
        }
    }

    // Reactions: per-actor toggle with counters
    function _addReaction(msgId, name) {
        const m = _messages.find(x => x.id === msgId);
        if (!m) return;
        if (!m.reactions) m.reactions = {};

        const actor = _reactionActor();
        const actors = _normalizeReactionActors(m.reactions[name]);
        if (actors[actor]) {
            delete actors[actor];
        } else {
            actors[actor] = true;
        }

        if (Object.keys(actors).length === 0) {
            delete m.reactions[name];
        } else {
            m.reactions[name] = actors;
        }

        _saveChat();
        _renderMessages();
    }

    function _togglePin(msgId) {
        const idx = _pinned.indexOf(msgId);
        if (idx >= 0) _pinned.splice(idx, 1);
        else _pinned.push(msgId);
        _savePinned();
        _renderPinnedBar();
        if (typeof App !== 'undefined') App.showToast(idx >= 0 ? 'Откреплено' : 'Закреплено', 'success');
    }

    function unpinAll() {
        _pinned = [];
        _savePinned();
        _renderPinnedBar();
    }

    function _deleteMsg(msgId) {
        const m = _messages.find(m => m.id === msgId);
        if (m) {
            m.deleted = true;
            _deletedIds.add(msgId);
        }
        _saveChat();
        _renderMessages();
        if (typeof App !== 'undefined') App.showToast('Удалено', 'info');
    }

    function scrollToMsg(msgId) {
        const el = document.getElementById('adminMsg-' + msgId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('achat-msg--highlight');
            setTimeout(() => el.classList.remove('achat-msg--highlight'), 1500);
        }
    }

    function cancelReply() {
        _replyTo = null;
        _renderReplyBar();
    }

    // ── Forward ──────────────────────────────────────────
    function _openForwardMenu(msgId) {
        const m = _messages.find(x => x.id === msgId);
        if (!m) return;

        const old = document.getElementById('adminForwardModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'adminForwardModal';
        modal.className = 'achat-modal-overlay';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        const targets = _chatList.filter(c => c.id !== _activeChatId);
        modal.innerHTML = `
            <div class="achat-modal">
                <div class="achat-modal__header">
                    <span>${IC.forward} Переслать сообщение</span>
                    <button class="achat-icon-btn" onclick="this.closest('.achat-modal-overlay').remove()">${IC.x}</button>
                </div>
                <div class="achat-modal__body">
                    ${targets.map(t => `
                        <button class="achat-modal__item" onclick="Admin.forwardMsg(${msgId},'${_esc(t.id)}')">
                            ${t.type === 'support' ? 'Поддержка: ' : ''}${_esc(t.label || t.id)}
                        </button>
                    `).join('') || '<div class="achat-empty">Нет доступных чатов</div>'}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async function forwardMsg(msgId, targetChatId) {
        const m = _messages.find(x => x.id === msgId);
        if (!m) return;

        const now = new Date();
        const fwd = {
            ...m,
            id: Date.now(),
            from: 'admin',
            forwarded: true,
            time: `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`,
            date: now.toISOString(),
            reactions: {}
        };
        delete fwd.replyTo;
        delete fwd.deleted;

        // Use append endpoint for reliable forwarding
        try {
            await fetch('/api/store/chat/' + encodeURIComponent(targetChatId) + '/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fwd)
            });
        } catch (e) {
            console.warn('[AdminChat] Forward failed:', e);
        }

        const modal = document.getElementById('adminForwardModal');
        if (modal) modal.remove();
        if (typeof App !== 'undefined') App.showToast('Переслано', 'success');
    }

    // ── Voice recording ──────────────────────────────────
    async function toggleRecording() {
        if (_isRecording) return stopRecording();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            _audioChunks = [];
            _mediaRecorder = new MediaRecorder(stream);
            _mediaRecorder.ondataavailable = e => { if (e.data.size > 0) _audioChunks.push(e.data); };
            _mediaRecorder.start();
            _isRecording = true;
            _recSeconds = 0;

            // Show recording bar, hide input
            const recBar = document.getElementById('adminRecBar');
            const inputArea = document.getElementById('adminChatInputArea');
            if (recBar) recBar.style.display = 'flex';
            if (inputArea) inputArea.style.display = 'none';

            _recTimer = setInterval(() => {
                _recSeconds++;
                const el = document.getElementById('adminRecTime');
                if (el) el.textContent = `${Math.floor(_recSeconds / 60)}:${String(_recSeconds % 60).padStart(2, '0')}`;
            }, 1000);
        } catch {
            if (typeof App !== 'undefined') App.showToast('Нет доступа к микрофону', 'error');
        }
    }

    function stopRecording() {
        if (!_isRecording || !_mediaRecorder) return;

        // Set onstop BEFORE calling stop (fix race condition)
        _mediaRecorder.onstop = function() {
            _mediaRecorder.stream?.getTracks().forEach(t => t.stop());
            const blob = new Blob(_audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
                const dur = `${Math.floor(_recSeconds / 60)}:${String(_recSeconds % 60).padStart(2, '0')}`;
                const now = new Date();
                _messages.push({
                    id: Date.now(),
                    from: 'admin',
                    type: 'voice',
                    audioData: reader.result,
                    duration: dur,
                    time: `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`,
                    date: now.toISOString(),
                    read: false,
                    reactions: {}
                });
                _saveChat();
                _renderMessages();
            };
            reader.readAsDataURL(blob);
        };

        _mediaRecorder.stop();
        _isRecording = false;
        clearInterval(_recTimer);

        const recBar = document.getElementById('adminRecBar');
        const inputArea = document.getElementById('adminChatInputArea');
        if (recBar) recBar.style.display = 'none';
        if (inputArea) inputArea.style.display = 'flex';
    }

    function cancelRecording() {
        if (!_isRecording) return;
        _mediaRecorder.onstop = () => {};
        _mediaRecorder?.stop();
        _mediaRecorder?.stream?.getTracks().forEach(t => t.stop());
        _isRecording = false;
        clearInterval(_recTimer);
        _audioChunks = [];

        const recBar = document.getElementById('adminRecBar');
        const inputArea = document.getElementById('adminChatInputArea');
        if (recBar) recBar.style.display = 'none';
        if (inputArea) inputArea.style.display = 'flex';
    }

    function playVoice(btn) {
        const data = btn.getAttribute('data-audio');
        if (!data) return;

        if (_currentAudio) {
            _currentAudio.pause();
            _currentAudio = null;
            document.querySelectorAll('.achat-voice-btn--playing').forEach(b => {
                b.classList.remove('achat-voice-btn--playing');
                b.textContent = '▶';
            });
        }

        const audio = new Audio(data);
        _currentAudio = audio;
        btn.textContent = '⏸';
        btn.classList.add('achat-voice-btn--playing');
        audio.play();
        audio.onended = () => {
            btn.textContent = '▶';
            btn.classList.remove('achat-voice-btn--playing');
            _currentAudio = null;
        };
    }

    // ── Image preview ────────────────────────────────────
    function previewImage(src) {
        const old = document.getElementById('adminImgPreview');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'adminImgPreview';
        overlay.className = 'achat-img-preview';
        overlay.onclick = () => overlay.remove();
        overlay.innerHTML = `<img src="${src}" class="achat-img-preview__img">`;
        document.body.appendChild(overlay);
    }

    // ── File download ────────────────────────────────────
    function downloadFile(msgId, fileName) {
        const msg = _messages.find(m => String(m.id) === String(msgId));
        if (!msg || !msg.fileData) return;

        const a = document.createElement('a');
        a.href = msg.fileData;
        a.download = fileName || msg.fileName || 'file';
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ── File/Image attachments ──────────────────────────
    function addImages(input) {
        Array.from(input.files).forEach(f => {
            if (!_canAttach(f)) return;
            const reader = new FileReader();
            reader.onload = () => {
                _attachments.push({
                    type: 'image',
                    data: reader.result,
                    name: f.name,
                    size: _fmtSize(f.size),
                    bytes: f.size,
                    mimeType: f.type || 'image/*'
                });
                _renderAttachPreview();
            };
            reader.readAsDataURL(f);
        });
        input.value = '';
    }

    function addFiles(input) {
        Array.from(input.files).forEach(f => {
            if (!_canAttach(f)) return;
            const reader = new FileReader();
            reader.onload = () => {
                _attachments.push({
                    type: f.type && f.type.startsWith('image/') ? 'image' : 'file',
                    data: reader.result,
                    name: f.name,
                    size: _fmtSize(f.size),
                    bytes: f.size,
                    mimeType: f.type || 'application/octet-stream'
                });
                _renderAttachPreview();
            };
            reader.readAsDataURL(f);
        });
        input.value = '';
    }

    function removeAttach(idx) {
        _attachments.splice(idx, 1);
        _renderAttachPreview();
    }

    // ── Chat switching & polling ─────────────────────────
    function openChat(chatId) {
        _activeChatId = chatId;
        if (!_chatServerTokens.has(String(chatId))) {
            _chatServerTokens.set(String(chatId), 0);
        }
        _mobileLayoutMode = 'chat';
        _replyTo = null;
        _attachments = [];
        _deletedIds.clear();
        _messages = [];
        _renderChatList();
        _syncMobileLayout();
        _loadChat();
    }

    function showChatList() {
        _mobileLayoutMode = 'list';
        _syncMobileLayout();
    }

    function _startPoll() {
        _stopPoll();
        _pollTimer = setInterval(async () => {
            await _buildChatList();
            _renderChatList();
            if (_activeChatId) _loadChat();
        }, 3000);
    }

    function _stopPoll() {
        if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    }

    // ── Public API ───────────────────────────────────────
    Admin.registerTab('chat', renderTab);
    Admin.sendAdminMessage = sendMessage;
    Admin.openChat = openChat;
    Admin.showAdminChatList = showChatList;
    Admin.refreshAdminChat = () => { _saving = false; _loadChat(); };
    Admin.showAdminMsgMenu = showMsgMenu;
    Admin.adminReact = (id, name) => _addReaction(id, name);
    Admin.scrollToAdminMsg = scrollToMsg;
    Admin.cancelAdminReply = cancelReply;
    Admin.unpinAllAdmin = unpinAll;
    Admin.toggleAdminRec = toggleRecording;
    Admin.stopAdminRec = stopRecording;
    Admin.cancelAdminRec = cancelRecording;
    Admin.playAdminVoice = (btn) => playVoice(btn);
    Admin.addAdminImages = addImages;
    Admin.addAdminFiles = addFiles;
    Admin.removeAdminAttach = removeAttach;
    Admin.previewImage = previewImage;
    Admin.downloadFile = downloadFile;
    Admin.forwardMsg = forwardMsg;
    Admin.archiveChat = _toggleArchiveChat;
    Admin.toggleShowArchived = _toggleShowArchived;
})(Admin);
