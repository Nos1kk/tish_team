/* =====================================================
   TISH STORE — AUTH MODULE (Google OAuth)
   Client-side Google Identity Services integration
   ===================================================== */

const Auth = (() => {
    const STORAGE_KEY = 'tish_auth';
    const API_TOKEN_KEY = 'tish_api_token';
    const GOOGLE_CLIENT_ID_FALLBACK = '67970829246-eoo42ui2n7ku2hb2evpmd5ejiqoe563t.apps.googleusercontent.com';
    
    let _user = null;
    let _initialized = false;
    let _googleClientId = '';

    function _loadSession() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const token = localStorage.getItem(API_TOKEN_KEY);
            if (raw && token) {
                _user = JSON.parse(raw);
                if (typeof Security !== 'undefined' && typeof Security.setUserToken === 'function') {
                    Security.setUserToken(token);
                }
                if (typeof Security !== 'undefined' && typeof Security.clearAdminToken === 'function') {
                    Security.clearAdminToken();
                }
                return true;
            }
            if (raw && !token) {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {}
        return false;
    }

    function _saveSession(userData, token) {
        _user = userData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        if (token) {
            localStorage.setItem(API_TOKEN_KEY, token);
            if (typeof Security !== 'undefined' && typeof Security.setUserToken === 'function') {
                Security.setUserToken(token);
            }
        }
    }

    function _clearSession() {
        _user = null;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(API_TOKEN_KEY);
        if (typeof Security !== 'undefined' && typeof Security.clearUserToken === 'function') {
            Security.clearUserToken();
        }
        if (typeof Security !== 'undefined' && typeof Security.clearAdminToken === 'function') {
            Security.clearAdminToken();
        }
    }

    function isLoggedIn() {
        return !!_user;
    }

    function getUser() {
        return _user;
    }

    function _isLocalHost() {
        const host = String(window.location.hostname || '').toLowerCase();
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    }

    function _showAuthUnavailable(message) {
        const msg = message || 'Вход временно недоступен: Google авторизация не настроена на сервере.';
        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
            btnContainer.innerHTML = `
                <div style="max-width:340px;width:100%;padding:12px 14px;border-radius:14px;border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.12);color:#fecaca;font-size:0.9rem;line-height:1.35;">
                    ${msg}<br>
                    <span style="opacity:.85;font-size:.8rem;">Проверьте переменную STORE_GOOGLE_CLIENT_ID в окружении сервера.</span>
                </div>
            `;
        }
    }

    async function _exchangeGoogleToken(credential) {
        const res = await fetch('/api/store/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
        });

        const contentType = String(res.headers.get('content-type') || '').toLowerCase();
        let json = null;
        if (contentType.includes('application/json')) {
            try {
                json = await res.json();
            } catch {}
        }

        if (!res.ok || !json?.success || !json?.token) {
            const reason = json?.error || `Auth HTTP ${res.status}`;
            throw new Error(reason);
        }
        return json;
    }

    async function _loadAuthConfig() {
        try {
            const res = await fetch('/api/store/auth/config');
            const json = await res.json();
            if (res.ok && json && json.success && json.enabled && json.clientId) {
                _googleClientId = String(json.clientId);
                return true;
            }
        } catch (e) {}

        if (!_googleClientId && _isLocalHost()) {
            _googleClientId = GOOGLE_CLIENT_ID_FALLBACK;
            return true;
        }

        _googleClientId = '';
        return false;
    }

    async function _validateServerSession() {
        const token = localStorage.getItem(API_TOKEN_KEY);
        if (!token) return false;

        const hasLocalSession = !!_user && !!localStorage.getItem(STORAGE_KEY);

        try {
            if (typeof Security !== 'undefined' && typeof Security.setUserToken === 'function') {
                Security.setUserToken(token);
            }

            const res = await fetch('/api/store/auth/session', { cache: 'no-store' });

            if (res.status === 401 || res.status === 403) {
                _clearSession();
                return false;
            }

            if (!res.ok) {
                // Temporary backend/network issues should not force logout.
                return hasLocalSession;
            }

            let json = null;
            try {
                json = await res.json();
            } catch {
                return hasLocalSession;
            }

            if (!json || typeof json !== 'object') {
                return hasLocalSession;
            }

            if (json.authenticated === false) {
                _clearSession();
                return false;
            }

            if (!json.authenticated || !json.user) {
                return hasLocalSession;
            }

            const authData = {
                email: json.user.email || '',
                name: json.user.name || '',
                avatar: json.user.picture || null,
                googleId: json.user.googleId || '',
                loginTime: Date.now()
            };
            _user = authData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
            _syncProfileWithGoogle(authData);
            return true;
        } catch (e) {
            return hasLocalSession;
        }
    }

    async function _handleCredentialResponse(response) {
        try {
            // Decode the JWT token from Google
            const payload = _parseJwt(response.credential);
            if (!payload || !payload.email) {
                if (typeof App !== 'undefined') App.showToast('Ошибка авторизации', 'error');
                return;
            }

            const session = await _exchangeGoogleToken(response.credential);

            const authData = {
                email: payload.email,
                name: payload.name || '',
                avatar: payload.picture || null,
                googleId: payload.sub,
                loginTime: Date.now()
            };

            _saveSession(authData, session.token);

            // Sync profile with Google data if profile is empty
            _syncProfileWithGoogle(authData);

            if (typeof Navigation !== 'undefined' && Navigation.syncNavbarAvatar) {
                setTimeout(() => Navigation.syncNavbarAvatar(), 0);
            }
            document.dispatchEvent(new CustomEvent('profileUpdated'));

            // Hide auth overlay
            _hideOverlay();

            if (typeof App !== 'undefined') App.showToast(`Добро пожаловать, ${authData.name}!`, 'success');
            if (typeof Notifications !== 'undefined') {
                Notifications.push('👋', 'Вход выполнен', `Вы вошли как ${authData.email}`, 'success');
            }
        } catch (e) {
            console.error('Auth error:', e);
            const reason = String(e?.message || '');
            const misconfigured = reason.includes('not configured') || reason.includes('Auth HTTP 503') || reason.includes('503');
            const message = misconfigured
                ? 'Вход недоступен: Google авторизация не настроена на сервере.'
                : 'Ошибка авторизации';
            if (misconfigured) {
                _showAuthUnavailable(message);
            }
            if (typeof App !== 'undefined') App.showToast(message, 'error');
        }
    }

    function _syncProfileWithGoogle(authData) {
        try {
            const raw = localStorage.getItem('tish_profile');
            let profile = raw ? JSON.parse(raw) : null;

            const applyAuthFields = (profileObj) => {
                if (!profileObj || typeof profileObj !== 'object') return profileObj;
                if (!profileObj.name && authData.name) profileObj.name = authData.name;
                profileObj.email = authData.email || profileObj.email || '';
                profileObj.googleId = authData.googleId;
                if (!profileObj.avatar && authData.avatar) profileObj.avatar = authData.avatar;
                return profileObj;
            };
            
            // Check if this profile belongs to a different user or is leftover demo data
            const isNewUser = !profile 
                || !profile.googleId 
                || profile.googleId !== authData.googleId;

            if (!isNewUser && profile) {
                profile = applyAuthFields(profile);
                localStorage.setItem('tish_profile', JSON.stringify(profile));
                localStorage.setItem('tish_profile_' + authData.googleId, JSON.stringify(profile));
                if (typeof Storage !== 'undefined' && Storage.set) {
                    Storage.set('tish_profile', profile);
                    Storage.set('tish_profile_' + authData.googleId, profile);
                }
                return;
            }
            
            if (isNewUser) {
                const inKey = 'tish_profile_' + authData.googleId;
                const incomingSavedRaw = localStorage.getItem(inKey);

                // ── Save outgoing user's profile (keyed by googleId) ──
                if (profile && profile.googleId) {
                    const outKey = 'tish_profile_' + profile.googleId;
                    localStorage.setItem(outKey, JSON.stringify(profile));
                    if (typeof Storage !== 'undefined' && Storage.set) {
                        Storage.set(outKey, profile);
                    }
                }

                // Clear old user-specific data, but KEEP admin/global data
                const GLOBAL_KEYS = [
                    'tish_auth', 'tish_admin_products', 'tish_admin_log',
                    'tish_admin_nfts', 'tish_admin_collections', 'tish_admin_cases',
                    'tish_admin_auth', 'tish_admin_notifs', 'tish_admin_achievements',
                    'tish_admin_notifications',
                    'tish_tishara_shop_products',
                    'tish_site_settings', 'tish_ref_settings', 'tish_analytics_events',
                    'tish_review_counts'
                ];
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('tish_profile_')) {
                        continue;
                    }
                    if (key && key.startsWith('tish_') && !GLOBAL_KEYS.includes(key)) {
                        keysToRemove.push(key);
                    }
                    if (key && key.startsWith('chat_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));

                // ── Try to restore incoming user's saved profile ──
                const savedRaw = incomingSavedRaw || localStorage.getItem(inKey);
                if (savedRaw) {
                    try {
                        const saved = applyAuthFields(JSON.parse(savedRaw));
                        localStorage.setItem('tish_profile', JSON.stringify(saved));
                        localStorage.setItem(inKey, JSON.stringify(saved));
                        if (typeof Storage !== 'undefined' && Storage.set) {
                            Storage.set('tish_profile', saved);
                            Storage.set(inKey, saved);
                        }
                        // Also restore their notifications, orders, etc. from server
                        if (typeof Storage !== 'undefined' && Storage.pullAll) {
                            Storage.pullAll().catch(() => {});
                        }
                        return; // Profile restored — no need to re-init fresh
                    } catch {}
                }

                // ── Also try to fetch from server ──
                fetch('/api/store/data/' + inKey)
                    .then(r => r.json())
                    .then(json => {
                        if (json.success && json.value && json.value.googleId === authData.googleId) {
                            const merged = applyAuthFields(json.value);
                            localStorage.setItem('tish_profile', JSON.stringify(merged));
                            localStorage.setItem(inKey, JSON.stringify(merged));
                            if (typeof Storage !== 'undefined' && Storage.set) {
                                Storage.set('tish_profile', merged);
                                Storage.set(inKey, merged);
                            }
                        }
                    })
                    .catch(() => {});
                
                // Re-init profile module with clean state + Google data
                if (typeof Profile !== 'undefined' && Profile.init) {
                    Profile.init();
                    const p = Profile.getUserData ? Profile.getUserData() : null;
                    if (p) {
                        p.name = p.name || authData.name || '';
                        p.email = authData.email || p.email || '';
                        p.googleId = authData.googleId;
                        if (!p.avatar && authData.avatar) p.avatar = authData.avatar;
                        p.joinDate = p.joinDate || new Date().toISOString();
                        if (Profile.save) Profile.save();
                    }
                }
            }
        } catch (e) { console.error('Profile sync error:', e); }
    }

    function _parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    function _showOverlay() {
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.classList.remove('is-hidden');
            // Generate stars
            const starsContainer = overlay.querySelector('.auth-stars');
            if (starsContainer && starsContainer.children.length === 0) {
                for (let i = 0; i < 40; i++) {
                    const star = document.createElement('div');
                    star.className = 'auth-star';
                    star.style.left = Math.random() * 100 + '%';
                    star.style.top = Math.random() * 100 + '%';
                    const size = (1 + Math.random() * 2.5) + 'px';
                    star.style.width = size;
                    star.style.height = size;
                    star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
                    star.style.setProperty('--star-opacity', (0.2 + Math.random() * 0.5).toString());
                    star.style.animationDelay = Math.random() * 5 + 's';
                    starsContainer.appendChild(star);
                }
            }
        }
    }

    function _hideOverlay() {
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.classList.add('is-hidden');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }
    }

    function logout() {
        fetch('/api/store/auth/logout', { method: 'POST' }).catch(() => {});
        try {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                google.accounts.id.disableAutoSelect();
            }
        } catch {}
        _clearSession();
        // Clear profile data
        localStorage.removeItem('tish_profile');
        // Reload to show auth screen
        window.location.reload();
    }

    function init() {
        if (_initialized) return;
        _initialized = true;

        (async () => {
            _loadSession();
            const validSession = await _validateServerSession();
            if (validSession) {
                _hideOverlay();
                return;
            }

            _showOverlay();
            const configReady = await _loadAuthConfig();
            if (!configReady) {
                _showAuthUnavailable();
                return;
            }

            if (typeof google !== 'undefined' && google.accounts) {
                _initGoogleSignIn();
            } else {
                window._authInitGoogle = () => {
                    _initGoogleSignIn();
                };
            }
        })();
    }

    function _initGoogleSignIn() {
        if (typeof google === 'undefined' || !google.accounts) return;
        const clientId = _googleClientId;
        if (!clientId) {
            _showAuthUnavailable();
            return;
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: _handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false
        });

        // Render the button inside our custom container
        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
            google.accounts.id.renderButton(btnContainer, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                width: 340,
                text: 'signin_with',
                shape: 'pill',
                logo_alignment: 'left'
            });
        }
    }

    // Public API
    return {
        init,
        isLoggedIn,
        getUser,
        logout
    };
})();
