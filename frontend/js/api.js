/**
 * SIMSOLDIER API CLIENT
 * 負責所有資料存取 (已串接 FastAPI 後端)
 *
 * APK / Debug 模式說明：
 *   當無法連線至後端時，會彈出設定對話框讓使用者輸入後端 URL。
 *   URL 會儲存在 localStorage 的 'simSoldier_apiBase' key 中。
 *   預設值為 '' (空字串) — 代表使用相對路徑，適用於 Nginx 反向代理。
 *   APK build 請輸入完整 URL，例如: https://your-server.com
 */

const DB_KEY = 'simSoldier_users';
const SESSION_KEY = 'simSoldier_token';
const API_BASE_KEY = 'simSoldier_apiBase';

// ──────────────────────────────────────────────────────────────
// Base URL Management
// ──────────────────────────────────────────────────────────────

/**
 * 取得目前設定的後端 Base URL
 * 空字串 = 使用相對路徑 (Nginx 反向代理模式)
 */
function getApiBase() {
    return localStorage.getItem(API_BASE_KEY) || '';
}

/**
 * 儲存後端 Base URL
 * @param {string} url - 完整 URL，例如 https://your-server.com，或留空使用相對路徑
 */
function setApiBase(url) {
    const trimmed = (url || '').replace(/\/$/, ''); // 移除結尾斜線
    localStorage.setItem(API_BASE_KEY, trimmed);
}

/**
 * 將 API 路徑轉換成完整 URL
 * @param {string} url - 原始 URL，例如 http://localhost:8000/api/login
 * @returns {string} - 處理後的 URL
 */
function resolveUrl(url) {
    const base = getApiBase();
    // 先將原始 localhost 路徑萃取出 pathname
    let path = url;
    try {
        const parsed = new URL(url);
        path = parsed.pathname + parsed.search;
    } catch (_) {
        // url 已經是相對路徑，直接使用
    }
    return base ? `${base}${path}` : path;
}

// ──────────────────────────────────────────────────────────────
// Backend URL Dialog UI
// ──────────────────────────────────────────────────────────────

/** Expected welcome message from the SimSoldier backend root endpoint */
const BACKEND_WELCOME = 'Welcome to SimSoldier Backend';

let _dialogPromise = null;

/**
 * 驗證指定 URL 是否為 SimSoldier 後端
 * 嘗試 GET {base}/ ，檢查回傳 JSON 是否包含正確的 welcome message
 * @param {string} baseUrl - 要驗證的 Base URL
 * @returns {Promise<{ok: boolean, detail: string}>}
 */
async function verifyBackend(baseUrl) {
    const testUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/` : '/';
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(testUrl, { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) {
            return { ok: false, detail: `伺服器回傳 HTTP ${res.status}` };
        }
        const data = await res.json();
        if (data && data.message === BACKEND_WELCOME) {
            return { ok: true, detail: '✅ 已驗證為 SimSoldier 後端' };
        }
        return { ok: false, detail: '⛔ 此伺服器不是 SimSoldier 後端' };
    } catch (err) {
        if (err.name === 'AbortError') {
            return { ok: false, detail: '⏱ 連線逾時，請確認 URL 或網路狀態' };
        }
        return { ok: false, detail: `❌ 無法連線 (${err.message})` };
    }
}

/**
 * 彈出後端 URL 設定對話框
 * 儲存前會先驗證 URL 是否指向真正的 SimSoldier 後端
 * @returns {Promise<string>} - 使用者輸入的 URL (已儲存)
 */
function showApiConfigDialog(errorMessage = '') {
    // 避免重複建立
    if (_dialogPromise) return _dialogPromise;

    _dialogPromise = new Promise((resolve) => {
        // 建立 Overlay
        const overlay = document.createElement('div');
        overlay.id = 'api-config-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Segoe UI', system-ui, sans-serif;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            background: #1a1a2e; border: 1px solid #e94560;
            border-radius: 12px; padding: 32px; width: min(420px, 90vw);
            box-shadow: 0 0 40px rgba(233,69,96,0.3); color: #eee;
        `;

        const icon = document.createElement('div');
        icon.textContent = '⚠️';
        icon.style.cssText = 'font-size: 2.5rem; text-align: center; margin-bottom: 12px;';

        const title = document.createElement('h2');
        title.textContent = '無法連線至後端';
        title.style.cssText = 'color: #e94560; margin: 0 0 8px; text-align: center; font-size: 1.25rem;';

        const subtitle = document.createElement('p');
        subtitle.style.cssText = 'margin: 0 0 16px; color: #aaa; font-size: 0.875rem; text-align: center;';
        subtitle.textContent = errorMessage || '請輸入後端 API 伺服器的完整 URL';

        const hint = document.createElement('p');
        hint.style.cssText = 'margin: 0 0 16px; color: #666; font-size: 0.75rem; text-align: center;';
        hint.textContent = '範例：https://your-server.com 或 http://192.168.1.100:8000';

        const currentBase = getApiBase();
        const input = document.createElement('input');
        input.type = 'url';
        input.placeholder = 'https://your-api-server.com';
        input.value = currentBase;
        input.style.cssText = `
            width: 100%; box-sizing: border-box; padding: 10px 14px;
            border-radius: 8px; border: 1px solid #444; background: #0f0f1a;
            color: #eee; font-size: 1rem; margin-bottom: 8px; outline: none;
        `;
        input.addEventListener('focus', () => { input.style.borderColor = '#e94560'; });
        input.addEventListener('blur', () => { input.style.borderColor = '#444'; });

        // Status indicator — shows verification result inline
        const status = document.createElement('p');
        status.style.cssText = `
            margin: 0 0 8px; padding: 8px 12px; border-radius: 6px;
            font-size: 0.8rem; text-align: center; display: none;
            transition: all 0.3s;
        `;

        const setStatus = (text, type) => {
            status.textContent = text;
            status.style.display = 'block';
            if (type === 'success') {
                status.style.background = 'rgba(46, 213, 115, 0.15)';
                status.style.color = '#2ed573';
                status.style.border = '1px solid rgba(46, 213, 115, 0.3)';
            } else if (type === 'error') {
                status.style.background = 'rgba(233, 69, 96, 0.15)';
                status.style.color = '#e94560';
                status.style.border = '1px solid rgba(233, 69, 96, 0.3)';
            } else {
                status.style.background = 'rgba(255, 255, 255, 0.05)';
                status.style.color = '#aaa';
                status.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            }
        };

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '驗證並儲存';
        saveBtn.style.cssText = `
            width: 100%; padding: 12px; margin-top: 8px;
            background: #e94560; border: none; border-radius: 8px;
            color: white; font-size: 1rem; cursor: pointer; font-weight: 600;
            transition: background 0.2s;
        `;
        saveBtn.addEventListener('mouseenter', () => { if (!saveBtn.disabled) saveBtn.style.background = '#c73652'; });
        saveBtn.addEventListener('mouseleave', () => { if (!saveBtn.disabled) saveBtn.style.background = '#e94560'; });

        const skipBtn = document.createElement('button');
        skipBtn.textContent = '離線模式 (僅本機)';
        skipBtn.style.cssText = `
            width: 100%; padding: 10px; margin-top: 8px;
            background: transparent; border: 1px solid #444; border-radius: 8px;
            color: #aaa; font-size: 0.875rem; cursor: pointer;
            transition: border-color 0.2s, color 0.2s;
        `;
        skipBtn.addEventListener('mouseenter', () => {
            skipBtn.style.borderColor = '#888';
            skipBtn.style.color = '#eee';
        });
        skipBtn.addEventListener('mouseleave', () => {
            skipBtn.style.borderColor = '#444';
            skipBtn.style.color = '#aaa';
        });

        const doSave = async () => {
            const val = input.value.trim();

            // Disable button while verifying
            saveBtn.disabled = true;
            saveBtn.textContent = '驗證中...';
            saveBtn.style.background = '#555';
            saveBtn.style.cursor = 'wait';
            input.disabled = true;

            setStatus('正在連線並驗證後端...', 'loading');

            const result = await verifyBackend(val);

            if (result.ok) {
                setStatus(result.detail, 'success');
                setApiBase(val);
                // Brief pause to show success before closing
                await new Promise(r => setTimeout(r, 600));
                document.body.removeChild(overlay);
                _dialogPromise = null;
                resolve(val);
            } else {
                setStatus(result.detail, 'error');
                // Re-enable inputs so user can try again
                saveBtn.disabled = false;
                saveBtn.textContent = '驗證並儲存';
                saveBtn.style.background = '#e94560';
                saveBtn.style.cursor = 'pointer';
                input.disabled = false;
                input.focus();
            }
        };

        const doSkip = () => {
            document.body.removeChild(overlay);
            _dialogPromise = null;
            resolve(getApiBase());
        };

        saveBtn.addEventListener('click', doSave);
        skipBtn.addEventListener('click', doSkip);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSave(); });

        card.append(icon, title, subtitle, hint, input, status, saveBtn, skipBtn);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        input.focus();
        input.select();
    });

    return _dialogPromise;
}

// ──────────────────────────────────────────────────────────────
// Local Storage Helpers
// ──────────────────────────────────────────────────────────────

function getLocalUsers() {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
}

function saveLocalUsers(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
}

// ──────────────────────────────────────────────────────────────
// Capacitor / APK Detection
// ──────────────────────────────────────────────────────────────

/**
 * 偵測是否在 Capacitor (APK) 環境中執行
 * Capacitor 會使用 https://localhost 或 capacitor:// scheme
 */
function isCapacitorApp() {
    // Capacitor native bridge exists
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        return true;
    }
    // Fallback: check if running from capacitor:// or https://localhost (Capacitor's androidScheme)
    const origin = window.location.origin || '';
    if (origin.startsWith('capacitor://') || origin === 'https://localhost') {
        return true;
    }
    return false;
}

/**
 * 確保後端 URL 已設定 — APK 首次啟動時自動彈出
 * 在 Capacitor 環境中，如果沒有設定 Base URL，就立即提示使用者設定
 */
async function ensureBackendConfigured() {
    if (isCapacitorApp() && !getApiBase()) {
        await showApiConfigDialog('首次使用 APK，請設定後端伺服器 URL');
    }
}

// 頁面載入時自動檢查 (Capacitor APK 專用)
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureBackendConfigured);
    } else {
        ensureBackendConfigured();
    }
}

// ──────────────────────────────────────────────────────────────
// API Object
// ──────────────────────────────────────────────────────────────

export const api = {
    /**
     * 內部 Fetch 封裝 (包含 Timeout 處理 + 連線失敗 Dialog)
     * @param {string} url - 原始 URL (localhost:8000 會被替換)
     * @param {object} options - fetch options
     * @param {number} timeout - ms
     * @param {boolean} _retried - 內部使用，避免無限重試
     */
    async _fetch(url, options = {}, timeout = 15000, _retried = false) {
        // APK 環境下，若尚未設定後端 URL，先提示使用者
        if (isCapacitorApp() && !getApiBase() && !_retried) {
            await showApiConfigDialog('請先設定後端伺服器 URL 才能使用此功能');
        }

        const resolvedUrl = resolveUrl(url);

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(resolvedUrl, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);

            // ── 關鍵修正：偵測 HTML 回應 (Capacitor 本機伺服器回傳 HTML 而非 JSON) ──
            // 在 APK 中，如果後端 URL 錯誤或未設定，Capacitor 的本機 Web Server
            // 會回傳 index.html (Content-Type: text/html) 而非 API 的 JSON 回應。
            // 若不攔截，後續 .json() 解析會得到 "Unexpected token '<'" 錯誤。
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                if (!_retried) {
                    await showApiConfigDialog(
                        '後端 URL 設定錯誤 — 收到 HTML 而非 API 回應\n請輸入正確的後端伺服器 URL'
                    );
                    return this._fetch(url, options, timeout, true);
                }
                throw new Error('後端 URL 錯誤：收到 HTML 頁面而非 JSON API 回應');
            }

            return response;
        } catch (error) {
            clearTimeout(id);

            // 逾時
            if (error.name === 'AbortError') {
                if (!_retried) {
                    await showApiConfigDialog('連線逾時，請確認後端 URL 是否正確');
                    return this._fetch(url, options, timeout, true);
                }
                throw new Error('伺服器連線逾時，請檢查網路或後端狀態');
            }

            // 網路錯誤 (APK 環境常見：後端地址未設定)
            if (!_retried) {
                await showApiConfigDialog(
                    `無法連線 (${error.message})\n請輸入正確的後端伺服器 URL`
                );
                return this._fetch(url, options, timeout, true);
            }

            throw error;
        }
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 手動開啟後端 URL 設定對話框
     * 可從設定頁面呼叫
     */
    openApiConfig() {
        _dialogPromise = null; // 強制重新開啟
        return showApiConfigDialog('手動設定後端 API URL');
    },

    /**
     * 取得目前的後端 Base URL
     */
    getApiBaseUrl() {
        return getApiBase() || '(相對路徑 — Nginx 模式)';
    },

    /**
     * 登入
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const res = await this._fetch('http://localhost:8000/api/login', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '帳號或密碼錯誤');
            }

            const data = await res.json();
            localStorage.setItem(SESSION_KEY, data.access_token);
            localStorage.setItem('simSoldier_username', username);

            return { success: true, username };
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 檢查帳號是否存在
     * @param {string} username 
     */
    async checkUsernameExists(username) {
        await this._delay(300);
        const users = getLocalUsers();
        return !!users[username];
    },

    /**
     * 註冊
     * @param {object} params { username, password, profile: {...} }
     */
    async register({ username, password, profile }) {
        try {
            const res = await this._fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    role: profile.role === 'disability' ? 2 : 1,
                    date_of_birth: profile.birthday,
                    height: parseInt(profile.height),
                    weight: parseInt(profile.weight),
                    entrance_date: profile.date,
                    do_have_chronic_medications: profile.medication === true || profile.isMedicated === 'yes'
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '註冊失敗');
            }

            return await this.login(username, password);
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 取得目前使用者資料
     */
    async getMe() {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            if (!token) throw new Error('Not logged in');

            const res = await this._fetch('http://localhost:8000/api/user_info', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem(SESSION_KEY);
                    throw new Error('Not logged in');
                }
                throw new Error('無法取得使用者資料');
            }

            const data = await res.json();
            return {
                username: data.username,
                profile: {
                    name: data.username,
                    date: data.entrance_date,
                    birthday: data.date_of_birth,
                    role: data.role === 2 ? 'disability' : 'regular',
                    height: data.height,
                    weight: data.weight,
                    medication: data.do_have_chronic_medications,
                    gold: data.game_currency
                }
            };
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 更新使用者 Profile
     * @param {object} newProfile 
     */
    async updateProfile(profile) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            if (!token) throw new Error('Not logged in');

            const res = await this._fetch('http://localhost:8000/api/user_edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: profile.name,
                    date_of_birth: profile.birthday,
                    height: parseInt(profile.height),
                    weight: parseInt(profile.weight),
                    entrance_date: profile.date,
                    do_have_chronic_medications: profile.medication
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '更新失敗');
            }

            const json_res = await res.json();
            if (profile.name && profile.name !== localStorage.getItem('simSoldier_username')) {
                json_res._nameChanged = true;
            }
            return json_res;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 登出
     */
    logout() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('simSoldier_username');
        window.location.href = 'loadingbar.html?dest=login.html';
    },

    /**
     * 檢查是否已登入
     */
    checkAuth() {
        return !!localStorage.getItem(SESSION_KEY);
    },

    /**
     * 取得天兵課堂題庫
     * @param {number} limit 
     */
    async getRandomQuiz(limit = 5) {
        try {
            const res = await this._fetch(`http://localhost:8000/api/quiz/random?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch quiz');
            const data = await res.json();
            return data.map(q => ({
                id: q.id,
                question: q.question,
                options: {
                    A: q.option_a,
                    B: q.option_b,
                    C: q.option_c,
                    D: q.option_d
                },
                answer: q.correct_option,
                explanation: q.explanation,
                source: q.source
            }));
        } catch (e) {
            console.error(e);
            throw new Error('無法取得題庫，請稍後再試');
        }
    },

    /**
     * 開始體能訓練 (獲取 Session)
     */
    async startTraining(exerciseType) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            const res = await this._fetch('http://localhost:8000/api/training/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ exercise_type: exerciseType })
            });
            if (!res.ok) throw new Error('無法啟動訓練連線');
            return await res.json();
        } catch (e) {
            console.error(e);
            throw new Error('無法啟動訓練：' + e.message);
        }
    },

    /**
     * 提交訓練結果 (防作弊機制)
     * @param {Object} data {session_token, exercise_type, reps, duration_seconds, rep_timestamps}
     */
    async completeTraining(data) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            const res = await this._fetch('http://localhost:8000/api/training/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('上傳訓練紀錄失敗');
            return await res.json();
        } catch (e) {
            console.error(e);
            throw new Error('結算失敗：' + e.message);
        }
    },

    /**
     * 與魔鬼班長 (Gemini) 聊天
     * @param {string} question 
     */
    async askSimSoldier(question) {
        try {
            const token = localStorage.getItem(SESSION_KEY);
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await this._fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({ question })
            });
            if (!res.ok) throw new Error('伺服器連線失敗');
            return await res.json();
        } catch (e) {
            console.error(e);
            return '連線失敗，請稍後再試。';
        }
    },

    /**
     * 獲取梯次統計資料
     */
    async getCohortStats() {
        try {
            const res = await this._fetch('http://localhost:8000/api/cohort-stats', {
                method: 'GET'
            });
            if (!res.ok) throw new Error('無法取得統計資料');
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    }
};
