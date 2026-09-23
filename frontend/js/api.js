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
const OFFLINE_KEY = 'simSoldier_offline_mode';
const OFFLINE_PROFILE_KEY = 'simSoldier_offline_profile';

/**
 * 檢查是否處於離線模式
 */
function isOfflineMode() {
    return localStorage.getItem(OFFLINE_KEY) === 'true';
}

/**
 * 取得本地離線役男資料 (預設空資料或初值)
 */
function getOfflineProfile() {
    try {
        const data = localStorage.getItem(OFFLINE_PROFILE_KEY);
        if (data) return JSON.parse(data);
    } catch (_) {}
    return {
        name: '離線役男',
        date: null,
        birthday: '2004-01-01',
        role: 1,
        role_name: '行前準備',
        scenario: 'preparing',
        height: 175,
        weight: 70,
        gold: 0
    };
}

/**
 * 儲存本地離線役男資料
 */
function saveOfflineProfile(profile) {
    try {
        localStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify(profile));
    } catch (_) {}
}

/**
 * 離線模式內建精選題庫
 */
const FALLBACK_QUIZZES = [
    {
        id: 1,
        question: '進入軍營後，下列何者屬於通訊違禁品不得私自攜帶使用？',
        options: {
            A: '個人健保卡與身分證',
            B: '非公發智慧型手機未安裝MDM管制軟體',
            C: '個人常備慢性病藥物（附處方箋）',
            D: '指甲剪（無刀刃附件）'
        },
        answer: 'B',
        explanation: '未依國軍規定安裝軍用管制軟體（MDM）或具照相傳輸之電子設備屬通訊違禁品。',
        source: '國軍保密安全規定'
    },
    {
        id: 2,
        question: '在部隊基本教練中，「立正」姿勢時兩腳腳跟靠攏，腳尖向外分開約幾度？',
        options: {
            A: '30 度',
            B: '45 度',
            C: '60 度',
            D: '90 度'
        },
        answer: 'B',
        explanation: '國軍徒手基本教練準則規定，立正時兩腳腳跟靠攏並齊，腳尖向外分開 45 度。',
        source: '中華民國國軍徒手基本教練'
    },
    {
        id: 3,
        question: '下列何者為國軍士兵階級由低至高之正確排序？',
        options: {
            A: '二等兵 → 一等兵 → 上等兵',
            B: '一等兵 → 二等兵 → 上等兵',
            C: '下士 → 中士 → 上士',
            D: '二等兵 → 上等兵 → 一等兵'
        },
        answer: 'A',
        explanation: '國軍士兵編制由低至高依序為：二等兵、一等兵、上等兵。',
        source: '陸海空軍軍官士官士兵任官條例'
    },
    {
        id: 4,
        question: '役男入營前接受徵兵檢查，體位判定區分為哪三種？',
        options: {
            A: '甲等體位、乙等體位、丙等體位',
            B: '常備役體位、替代役體位、免役體位',
            C: '現役體位、預備役體位、退役體位',
            D: '戰鬥體位、後勤體位、免除體位'
        },
        answer: 'B',
        explanation: '役男徵兵體檢判定體位區分為「常備役體位」、「替代役體位」及「免役體位」。',
        source: '兵役法及體位區分標準'
    },
    {
        id: 5,
        question: '服義務役期間，下列哪一項行為符合軍紀與安全維護要求？',
        options: {
            A: '在營區內私自拍照打卡上傳社群媒體',
            B: '休假在外恪遵軍紀，不酒後駕車、不涉足不妥當場所',
            C: '未經醫務所核准私自分發藥物予同袍',
            D: '逾假不歸或未依規定回報行蹤'
        },
        answer: 'B',
        explanation: '休假恪遵軍紀安全規定，絕不酒駕、不吸毒、不涉足不良場所是維護軍譽與個人安全的基本要求。',
        source: '國軍軍紀維護實施規定'
    }
];

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
    if (base) {
        let path = url;
        try {
            const parsed = new URL(url);
            path = parsed.pathname + parsed.search;
        } catch (_) {}
        return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    const currentPort = typeof window !== 'undefined' ? window.location.port : '';
    if (currentPort === '8080' || currentPort === '80' || currentPort === '8443') {
        return url.replace('http://localhost:8000', '');
    } else {
        if (!url.startsWith('http')) {
            return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }
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
                api.disableOfflineMode();
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
            api.enableOfflineMode();
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
    if (isOfflineMode()) return;
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

export const SCENARIO_TO_ROLE_ID = {
    preparing: 1,
    enlisted: 2,
    deferred: 3
};

export const ROLE_ID_TO_SCENARIO = {
    1: 'preparing',
    2: 'enlisted',
    3: 'deferred'
};

export const ROLE_NAME_TO_SCENARIO = {
    '行前準備': 'preparing',
    '準備入營': 'preparing',
    '役男入營': 'enlisted',
    '正在入營': 'enlisted',
    '延後入營': 'deferred',
    '延緩入營': 'deferred'
};

// ──────────────────────────────────────────────────────────────
// API Object
// ──────────────────────────────────────────────────────────────

export const api = {
    /**
     * 檢查是否處於離線模式
     */
    isOfflineMode() {
        return isOfflineMode();
    },

    /**
     * 啟動離線模式 (跳過登入直接進入系統)
     */
    enableOfflineMode() {
        localStorage.setItem(OFFLINE_KEY, 'true');
        localStorage.setItem(SESSION_KEY, 'offline_token');
        if (!localStorage.getItem('simSoldier_username')) {
            localStorage.setItem('simSoldier_username', '離線役男');
        }
        if (typeof window !== 'undefined') {
            const path = window.location.pathname || '';
            const href = window.location.href || '';
            if (path.includes('login.html') || href.includes('login.html')) {
                window.location.href = 'loadingbar.html?dest=index.html';
            }
        }
    },

    /**
     * 關閉離線模式
     */
    disableOfflineMode() {
        localStorage.removeItem(OFFLINE_KEY);
    },

    /**
     * 取得目前離線役男資料
     */
    getOfflineProfile() {
        return getOfflineProfile();
    },

    /**
     * 儲存離線役男資料
     */
    saveOfflineProfile(profile) {
        saveOfflineProfile(profile);
    },

    /**
     * 內部 Fetch 封裝 (包含 Timeout 處理 + 連線失敗 Dialog)
     * @param {string} url - 原始 URL (localhost:8000 會被替換)
     * @param {object} options - fetch options
     * @param {number} timeout - ms
     * @param {boolean} _retried - 內部使用，避免無限重試
     */
    async _fetch(url, options = {}, timeout = 15000, _retried = false) {
        if (this.isOfflineMode()) {
            throw new Error('離線模式中，伺服器 API 請求已略過');
        }

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
                if (this.isOfflineMode()) {
                    throw new Error('離線模式中，收到 HTML 頁面而非 JSON API 回應');
                }
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

            if (this.isOfflineMode()) {
                throw error;
            }

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
            const roleId = SCENARIO_TO_ROLE_ID[profile.role] || (typeof profile.role === 'number' ? profile.role : 1);
            const res = await this._fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    role: roleId,
                    date_of_birth: profile.birthday,
                    height: parseInt(profile.height),
                    weight: parseInt(profile.weight),
                    entrance_date: profile.date
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
        if (this.isOfflineMode()) {
            const offline = getOfflineProfile();
            const scenario = offline.scenario || 'preparing';
            return {
                username: offline.name || '離線役男',
                role: offline.role || 1,
                role_name: offline.role_name || '行前準備',
                scenario: scenario,
                profile: {
                    name: offline.name || '離線役男',
                    date: offline.date || null,
                    birthday: offline.birthday || '2004-01-01',
                    role: offline.role || 1,
                    role_name: offline.role_name || '行前準備',
                    scenario: scenario,
                    height: offline.height || 175,
                    weight: offline.weight || 70,
                    gold: offline.gold || 0
                }
            };
        }

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
            const scenario = ROLE_NAME_TO_SCENARIO[data.role_name] || ROLE_ID_TO_SCENARIO[data.role] || 'preparing';
            return {
                username: data.username,
                role: data.role,
                role_name: data.role_name,
                scenario: scenario,
                profile: {
                    name: data.username,
                    date: data.entrance_date,
                    birthday: data.date_of_birth,
                    role: data.role,
                    role_name: data.role_name,
                    scenario: scenario,
                    height: data.height,
                    weight: data.weight,
                    gold: data.game_progress || 0
                }
            };
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    /**
     * 更新使用者 Profile
     * @param {object} profile 
     */
    async updateProfile(profile) {
        if (this.isOfflineMode()) {
            const current = getOfflineProfile();
            const updated = {
                ...current,
                name: profile.name !== undefined ? profile.name : current.name,
                birthday: profile.birthday !== undefined ? profile.birthday : current.birthday,
                height: profile.height ? parseInt(profile.height) : current.height,
                weight: profile.weight ? parseInt(profile.weight) : current.weight,
                date: profile.date !== undefined ? profile.date : current.date
            };
            if (profile.role) {
                updated.role = SCENARIO_TO_ROLE_ID[profile.role] || (typeof profile.role === 'number' ? profile.role : current.role);
                updated.scenario = ROLE_ID_TO_SCENARIO[updated.role] || 'preparing';
                updated.role_name = Object.keys(ROLE_NAME_TO_SCENARIO).find(k => ROLE_NAME_TO_SCENARIO[k] === updated.scenario) || '行前準備';
            }
            saveOfflineProfile(updated);
            localStorage.setItem('simSoldier_username', updated.name);
            return {
                ...updated,
                _nameChanged: profile.name && profile.name !== current.name
            };
        }

        try {
            const token = localStorage.getItem(SESSION_KEY);
            if (!token) throw new Error('Not logged in');

            const payload = {
                username: profile.name,
                date_of_birth: profile.birthday,
                height: parseInt(profile.height),
                weight: parseInt(profile.weight),
                entrance_date: profile.date
            };

            if (profile.role) {
                payload.role = SCENARIO_TO_ROLE_ID[profile.role] || profile.role;
            }

            const res = await this._fetch('http://localhost:8000/api/user_edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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
     * 更新使用者服役情境身分
     * @param {string} scenarioKey ('preparing' | 'enlisted' | 'deferred')
     */
    async updateScenario(scenarioKey) {
        if (this.isOfflineMode()) {
            const roleId = SCENARIO_TO_ROLE_ID[scenarioKey] || 1;
            const current = getOfflineProfile();
            current.role = roleId;
            current.scenario = scenarioKey;
            current.role_name = Object.keys(ROLE_NAME_TO_SCENARIO).find(k => ROLE_NAME_TO_SCENARIO[k] === scenarioKey) || '行前準備';
            saveOfflineProfile(current);
            localStorage.setItem('simSoldier_userScenario', scenarioKey);
            return { success: true, scenario: scenarioKey, role: roleId };
        }

        const roleId = SCENARIO_TO_ROLE_ID[scenarioKey] || 1;
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
                    role: roleId
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '情境身分更新失敗');
            }

            return await res.json();
        } catch (e) {
            console.error('Failed to sync scenario to server:', e);
            throw e;
        }
    },

    /**
     * 登出
     */
    logout() {
        this.disableOfflineMode();
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('simSoldier_username');
        sessionStorage.removeItem('simSoldier_currentUser');
        sessionStorage.removeItem('simSoldier_justRegistered');
        window.location.href = 'loadingbar.html?dest=login.html';
    },

    /**
     * 檢查是否已登入
     */
    checkAuth() {
        if (this.isOfflineMode()) {
            return true;
        }
        return !!localStorage.getItem(SESSION_KEY);
    },

    /**
     * 取得天兵課堂題庫
     * @param {number} limit 
     */
    async getRandomQuiz(limit = 5) {
        if (this.isOfflineMode()) {
            return FALLBACK_QUIZZES.slice(0, limit);
        }

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
            console.warn('API quiz fetch failed, using fallback quiz:', e);
            return FALLBACK_QUIZZES.slice(0, limit);
        }
    },

    /**
     * 開始體能訓練 (獲取 Session)
     */
    async startTraining(exerciseType) {
        if (this.isOfflineMode()) {
            return { session_token: 'offline_session_' + Date.now(), exercise_type: exerciseType };
        }

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
        if (this.isOfflineMode()) {
            return { success: true, message: '離線訓練紀錄已保留' };
        }

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
        if (this.isOfflineMode()) {
            return '報告！目前為離線測試模式，AI 連線功能已暫停，但各項戰備與測驗功能均可正常操作！';
        }

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
        if (this.isOfflineMode()) {
            return {
                total_users: 100,
                enlisted_count: 50,
                preparing_count: 40,
                deferred_count: 10
            };
        }

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
