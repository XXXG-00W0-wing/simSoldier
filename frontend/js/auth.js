/**
 * SIMSOLDIER AUTH
 * 處理登入/註冊頁面的邏輯
 */

import { api } from './api.js';

// 只在 login.html 使用
export function initAuthPage() {
    // Check if already logged in
    if (api.checkAuth()) {
        window.location.href = 'index.html';
        return;
    }

    setupTabSwitcher();
    setupStepNavigation();
    setupDateInputs();
    setupForms();
}

function setupTabSwitcher() {
    // 簡單的 Tab 切換邏輯 (Login <-> Register)
    window.switchTab = function (tab) {
        const loginBtn = document.getElementById('tab-login');
        const registerBtn = document.getElementById('tab-register');
        const loginForm = document.getElementById('form-login');
        const registerForm = document.getElementById('form-register');

        if (tab === 'login') {
            loginBtn.className = 'flex-1 py-2 rounded-md text-sm font-bold transition-all bg-green-900/30 text-green-400 border border-green-900/50 shadow-inner';
            registerBtn.className = 'flex-1 py-2 rounded-md text-sm font-bold text-stone-500 hover:text-stone-300 transition-all';
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerBtn.className = 'flex-1 py-2 rounded-md text-sm font-bold transition-all bg-green-900/30 text-green-400 border border-green-900/50 shadow-inner';
            loginBtn.className = 'flex-1 py-2 rounded-md text-sm font-bold text-stone-500 hover:text-stone-300 transition-all';
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    };
}


// Step Navigation Logic
function setupStepNavigation() {
    window.nextStep = async function () {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-password-confirm').value;
        const btn = document.querySelector('button[onclick="nextStep()"]');

        if (username.length < 2) return alert('帳號至少需要 2 個字元！');
        if (password.length < 4) return alert('密碼至少需要 4 個字元！');
        if (password !== confirm) return alert('兩次密碼輸入不一致！');

        // Check availability
        try {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 檢查中...';
            btn.disabled = true;

            const exists = await api.checkUsernameExists(username);

            btn.innerHTML = originalText;
            btn.disabled = false;

            if (exists) {
                return alert('此帳號已被註冊，請換一個試試！');
            }

            document.getElementById('reg-step-1').classList.add('hidden');
            document.getElementById('reg-step-2').classList.remove('hidden');

        } catch (error) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            alert(error.message);
        }
    };

    window.prevStep = function () {
        document.getElementById('reg-step-2').classList.add('hidden');
        document.getElementById('reg-step-1').classList.remove('hidden');
    };
}


// Custom Date Input Logic (Defaults, Auto-focus, Picker Sync, Validation)
function setupDateInputs() {
    const inputs = document.querySelectorAll('.date-input');
    const pickers = document.querySelectorAll('.hidden-picker');

    // 0. Set Default Values
    const today = new Date();
    const entYear = today.getFullYear();
    const entMonth = String(today.getMonth() + 1).padStart(2, '0');
    const entDay = String(today.getDate()).padStart(2, '0');

    // Default Entrance: Today
    if (document.getElementById('reg-date-y')) {
        document.getElementById('reg-date-y').value = entYear;
        document.getElementById('reg-date-m').value = entMonth;
        document.getElementById('reg-date-d').value = entDay;
    }

    // Default Birthday: 18 Years ago
    if (document.getElementById('reg-birthday-y')) {
        document.getElementById('reg-birthday-y').value = entYear - 18;
        document.getElementById('reg-birthday-m').value = entMonth;
        document.getElementById('reg-birthday-d').value = entDay;
    }

    // Sync Picker -> Inputs
    pickers.forEach(picker => {
        picker.addEventListener('change', (e) => {
            if (!e.target.value) return;
            // e.target.value is YYYY-MM-DD
            const [y, m, d] = e.target.value.split('-');

            // Derive ID prefix from picker ID (picker-reg-date -> reg-date)
            const prefix = e.target.id.replace('picker-', '');

            document.getElementById(`${prefix}-y`).value = y;
            document.getElementById(`${prefix}-m`).value = m;
            document.getElementById(`${prefix}-d`).value = d;
        });
    });

    inputs.forEach(input => {
        // 1. Input Event: Restrict numbers & Auto-jump
        input.addEventListener('input', (e) => {
            // Remove non-numeric characters
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            const maxLength = parseInt(e.target.getAttribute('maxlength'));
            const nextId = e.target.getAttribute('data-next');

            if (e.target.value.length >= maxLength) {
                if (nextId) document.getElementById(nextId).focus();
            }
        });

        // 2. Keydown Event: Backspace navigation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0) {
                const prevId = e.target.getAttribute('data-prev');
                if (prevId) document.getElementById(prevId).focus();
            }
        });

        // 3. Blur Event: Simple Range Validation (Month 1-12, Day 1-31)
        input.addEventListener('blur', (e) => {
            const val = parseInt(e.target.value);
            if (isNaN(val)) return;

            if (e.target.id.includes('-m')) {
                if (val < 1) e.target.value = '01';
                if (val > 12) e.target.value = '12';
                e.target.value = e.target.value.padStart(2, '0');
            }
            if (e.target.id.includes('-d')) {
                if (val < 1) e.target.value = '01';
                if (val > 31) e.target.value = '31'; // Rough check, exact check in submit
                e.target.value = e.target.value.padStart(2, '0');
            }
        });
    });
}

function setupForms() {
    // Login Form
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button');

        try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> 登入中...';
            btn.disabled = true;

            await api.login(username, password);
            window.location.href = 'loadingbar.html?dest=index.html';

        } catch (error) {
            alert(error.message);
            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i> 登入系統';
            btn.disabled = false;
        }
    });

    // Register Form
    document.getElementById('form-register').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Form Data extraction
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const realName = document.getElementById('reg-realname').value.trim();

        // Combine Date Parts
        const dy = document.getElementById('reg-date-y').value;
        const dm = document.getElementById('reg-date-m').value.padStart(2, '0');
        const dd = document.getElementById('reg-date-d').value.padStart(2, '0');
        const dateStr = `${dy}-${dm}-${dd}`; // YYYY-MM-DD

        const by = document.getElementById('reg-birthday-y').value;
        const bm = document.getElementById('reg-birthday-m').value.padStart(2, '0');
        const bd = document.getElementById('reg-birthday-d').value.padStart(2, '0');
        const birthdayStr = `${by}-${bm}-${bd}`;

        const height = document.getElementById('reg-height').value;
        const weight = document.getElementById('reg-weight').value;
        const btn = e.target.querySelector('button[type="submit"]');

        // Validation Helper
        const isValidDate = (dStr) => {
            const d = new Date(dStr);
            return d instanceof Date && !isNaN(d) && d.toISOString().slice(0, 10) === dStr;
        };

        const processDatePart = (val, len) => {
            if (!val || val.length === 0) return false;
            return true;
        }

        // Final Validation
        if (!realName) return alert('請輸入真實姓名！');

        if (!processDatePart(dy, 4) || !processDatePart(dm, 2) || !processDatePart(dd, 2)) return alert('入營日期格式錯誤！');
        if (!processDatePart(by, 4) || !processDatePart(bm, 2) || !processDatePart(bd, 2)) return alert('生日格式錯誤！');

        if (!isValidDate(dateStr)) return alert('入營日期無效（例如：2月30日）！');
        if (!isValidDate(birthdayStr)) return alert('生日日期無效！');

        // Logic Check: Birthday < Entrance
        if (new Date(birthdayStr) >= new Date(dateStr)) {
            return alert('生日必須早於入營日期！\n難道您是在軍營裡出生的嗎？ 🤔');
        }

        try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> 註冊中...';
            btn.disabled = true;

            // 1. Register (預設註冊，情境身分於首次進入系統時讓使用者點選)
            await api.register({
                username, password, profile: {
                    name: realName,
                    date: dateStr,
                    birthday: birthdayStr,
                    height: height,
                    weight: weight
                }
            });

            // 2. Auto Login (using the same credentials)
            await api.login(username, password);

            // 標記新註冊狀態，讓主系統進入時立即跳出「選擇您的服役情境身分」
            sessionStorage.setItem('simSoldier_justRegistered', 'true');
            localStorage.removeItem('simSoldier_userScenario');

            window.location.href = 'loadingbar.html?dest=index.html';

        } catch (error) {
            alert(error.message);
            btn.innerHTML = '<i class="fa-solid fa-user-plus mr-2"></i> 完成註冊';
            btn.disabled = false;
        }
    });
}
