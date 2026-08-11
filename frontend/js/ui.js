/**
 * SIMSOLDIER UI
 *DOM 元素選取與視圖切換邏輯
 */

import { state } from './state.js';

// DOM Elements Cache
export const dom = {
    // --- Views ---
    views: {
        home: document.getElementById('view-home'),
        training: document.getElementById('view-training'),
        inventory: document.getElementById('view-inventory'),
        chat: document.getElementById('view-chat'),
        docs: document.getElementById('view-docs'),
        rhapsody: document.getElementById('view-rhapsody'),
        video: document.getElementById('view-video'),
        game: document.getElementById('view-game'),
        locations: document.getElementById('view-locations'),
        quiz: document.getElementById('view-quiz'),
        delay: document.getElementById('view-delay'),
        shooting: document.getElementById('view-shooting')
    },

    // --- Training ---
    trainingProgressBar: document.getElementById('training-progress-bar'),
    trainingProgressText: document.getElementById('training-progress-text'),
    trainingContent: document.getElementById('training-content'),

    // --- Inventory ---
    inventoryCategoriesContainer: document.getElementById('inventory-categories-container'),

    // --- Chat ---
    chatInput: document.getElementById('chat-input'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),

    // --- Docs ---
    modalDocs: document.getElementById('modal-docs'),
    docsModalTitle: document.getElementById('docs-modal-title'),
    docsModalContent: document.getElementById('docs-modal-content'),
    modalDocs: document.getElementById('modal-docs'),
    docsModalTitle: document.getElementById('docs-modal-title'),
    docsModalContent: document.getElementById('docs-modal-content'),
    docsModalLink: document.getElementById('docs-modal-link'),
    btnCloseDocs: document.getElementById('btn-close-docs'),

    // --- Video ---
    videoPlayer: document.getElementById('video-player'),
    videoGallery: document.getElementById('video-gallery'),
    btnCloseVideo: document.getElementById('close-video-player'),
    btnClosePlayer: document.getElementById('close-video-player'), // Alias for main.js compatibility
    playerTag: document.getElementById('player-tag'),
    playerTitle: document.getElementById('player-title'),
    playerDesc: document.getElementById('player-desc'),

    // --- Tasks (Daily) ---
    dailyTaskBar: document.getElementById('daily-task-bar'), // Need to check HTML if this exists
    dailyTaskPercent: document.getElementById('daily-task-percent'), // Need to check HTML
    taskCheckboxes: document.querySelectorAll('.task-checkbox'),

    // --- Sidebar & Header ---
    sidebarNav: document.getElementById('sidebar-nav'),
    userInfoSidebar: document.getElementById('user-info-sidebar'),
    sidebarName: document.getElementById('sidebar-name'),
    sidebarRole: document.getElementById('sidebar-role'),
    btnLoginSidebar: document.getElementById('btn-login-sidebar'),

    headerGuestTools: document.getElementById('header-guest-tools'),
    headerUserTools: document.getElementById('header-user-tools'),
    btnLoginHeader: document.getElementById('btn-login-header'),
    btnEditProfile: document.getElementById('btn-edit-profile'),
    headerNameMobile: document.getElementById('header-name-mobile'),
    headerStatusMobile: document.getElementById('header-status-mobile'),

    // --- Onboarding Modal ---
    modalOnboarding: document.getElementById('modal-onboarding'),
    inputName: document.getElementById('input-name'),
    // Date Pickers (Custom)
    pickerInputDate: document.getElementById('picker-input-date'),
    pickerInputBirthday: document.getElementById('picker-input-birthday'),

    // Split Inputs - Date
    inputDateY: document.getElementById('input-date-y'),
    inputDateM: document.getElementById('input-date-m'),
    inputDateD: document.getElementById('input-date-d'),

    // Split Inputs - Birthday
    inputBirthdayY: document.getElementById('input-birthday-y'),
    inputBirthdayM: document.getElementById('input-birthday-m'),
    inputBirthdayD: document.getElementById('input-birthday-d'),
    inputRole: document.getElementById('input-role'),
    inputDisabilityType: document.getElementById('input-disability-type'),
    sectionDisability: document.getElementById('section-disability'),
    inputHeight: document.getElementById('input-height'),
    inputWeight: document.getElementById('input-weight'),
    inputMeds: document.getElementById('input-meds'),
    btnSubmitOnboarding: document.getElementById('btn-submit-onboarding'),
    btnCloseOnboarding: document.getElementById('btn-close-onboarding'),
    btnUnlockGuest: document.getElementById('btn-unlock-guest'),
    btnSetupDate: document.getElementById('btn-setup-date'),

    // --- Logout Modal ---
    modalLogout: document.getElementById('modal-logout'),
    btnCancelLogout: document.getElementById('btn-cancel-logout'),
    btnConfirmLogout: document.getElementById('btn-confirm-logout'),

    // --- Home Widgets ---
    widgetStatus: document.getElementById('widget-status-report'),
    widgetGuest: document.getElementById('widget-guest-prompt'),
    statusType: document.getElementById('status-type'),
    statusReason: document.getElementById('status-reason'),
    statusInstruction: document.getElementById('status-instruction'),
    statusIcon: document.getElementById('status-icon'),
    widgetLocation: document.getElementById('widget-location'),
    locationDisplay: document.getElementById('location-display'),

    // --- Countdown ---
    countdownTitle: document.getElementById('countdown-title'),
    btnEndFake: document.getElementById('btn-end-fake'),
    countdownContentGuest: document.getElementById('countdown-content-guest'),
    countdownContentUser: document.getElementById('countdown-content-user'),
    countdownContentExempt: document.getElementById('countdown-content-exempt'),
    daysLeftCount: document.getElementById('days-left-count'),
    btnFakeCountdown: document.getElementById('btn-fake-countdown'),
    countdownRing: document.getElementById('countdown-ring'),

    // --- Tasks ---
    tasksCard: document.getElementById('tasks-card'),
    tasksLockOverlay: document.getElementById('tasks-lock-overlay'),

    // --- Game ---
    // (Game DOM elements might be handled in game.js, but keeping references here is fine)
    linkGame: document.getElementById('link-game'),
    linkVideo: document.getElementById('link-video'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnQuitGame: document.getElementById('btn-quit-game'),
    btnRetryGame: document.getElementById('btn-retry-game'),
    btnBackHome: document.getElementById('btn-back-home'),

    // --- Calendar ---
    calendarPanel: document.getElementById('calendar-panel'),
    calendarGrid: document.getElementById('calendar-grid'),
    calendarMonthYear: document.getElementById('calendar-month-year'),

    // --- Settings Menu ---
    btnSettingsSidebar: document.getElementById('btn-settings-sidebar'),
    settingsMenuSidebar: document.getElementById('settings-menu-sidebar'),
    // --- Settings Menu & Scenario ---
    btnSettingsSidebar: document.getElementById('btn-settings-sidebar'),
    settingsMenuSidebar: document.getElementById('settings-menu-sidebar'),
    btnEditProfileSidebar: document.getElementById('btn-edit-profile-sidebar'),
    btnGameBackpackSidebar: document.getElementById('btn-game-backpack-sidebar'),
    btnDeleteAccountSidebar: document.getElementById('btn-delete-account-sidebar'),
    btnLogoutSidebar: document.getElementById('btn-logout-sidebar'),

    // --- Scenario Triage Modal & Elements ---
    modalScenarioSelect: document.getElementById('modal-scenario-select'),
    btnCloseScenarioModal: document.getElementById('btn-close-scenario-modal'),
    scenarioCardsContainer: document.getElementById('scenario-cards-container'),
    scenarioGuidancePanel: document.getElementById('scenario-guidance-panel'),
    guidanceIconBox: document.getElementById('guidance-icon-box'),
    guidanceTitle: document.getElementById('guidance-title'),
    guidanceDesc: document.getElementById('guidance-desc'),
    guidanceTextContent: document.getElementById('guidance-text-content'),
    btnReselectScenario: document.getElementById('btn-reselect-scenario'),
    btnConfirmScenario: document.getElementById('btn-confirm-scenario'),
    sidebarScenarioTag: document.getElementById('sidebar-scenario-tag'),
    btnSidebarSwitchScenario: document.getElementById('btn-sidebar-switch-scenario'),
    btnHeaderScenarioSwitch: document.getElementById('btn-header-scenario-switch'),
    headerScenarioText: document.getElementById('header-scenario-text')
};

// --- Scenario Config & Dict ---

export const SCENARIO_CONFIG = {
    preparing: {
        id: 'preparing',
        title: '準備入營',
        icon: 'fa-shield-halved',
        colorClass: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
        guidanceTitle: '🛡️ 準備入營客製指南',
        guidanceDesc: '系統已為您優先排程「戰情儀表板」、「入伍背包裝備清單」、「行政折抵與證件」與「新訓地點」！',
        guidanceText: '您好！即將踏入軍旅生涯，本系統已為您優先排程側邊欄。建議您第一步進入【戰情儀表板】查看總覽，或進入【入伍背包】確認必帶物品，並於【行政中心】查閱軍訓成績單折抵退伍日事宜！',
        defaultTab: 'home',
        blocks: [
            {
                title: '核心推薦',
                badge: '必備準備',
                tabs: ['home', 'inventory', 'docs', 'locations']
            },
            {
                title: '戰情與學習',
                badge: '觀念建立',
                tabs: ['quiz', 'chat']
            },
            {
                title: '操演與其他',
                badge: '輔助資源',
                tabs: ['delay', 'shooting', 'training', 'rhapsody']
            }
        ]
    },
    enlisted: {
        id: 'enlisted',
        title: '正在入營',
        icon: 'fa-person-military-rifle',
        colorClass: 'text-amber-400',
        badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
        guidanceTitle: '🎖️ 正在入營客製指南',
        guidanceDesc: '系統已為您將「戰情儀表板」、「今日課表」與「教官聊天室」設為營內優先焦點！',
        guidanceText: '勇士好！已為您將日常營內必備功能擺至側邊欄最頂端。操課與自由時間可隨時打開【今日課表】查看進度，或透過【射擊口訣】複習單兵要領！',
        defaultTab: 'home',
        blocks: [
            {
                title: '核心推薦',
                badge: '每日營內',
                tabs: ['home', 'training', 'chat']
            },
            {
                title: '操演與檢定',
                badge: '熟練操課',
                tabs: ['shooting', 'quiz', 'rhapsody']
            },
            {
                title: '行政與物資',
                badge: '後勤輔助',
                tabs: ['inventory', 'docs', 'locations', 'delay']
            }
        ]
    },
    deferred: {
        id: 'deferred',
        title: '延緩入營',
        icon: 'fa-hourglass-half',
        colorClass: 'text-cyan-400',
        badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
        guidanceTitle: '⏳ 延緩入營客製指南',
        guidanceDesc: '系統已優先為您提供「延役專區」天數試算、「行政中心」體位標準與「教官諮詢」！',
        guidanceText: '您好！針對辦理延期徵集、體位複檢或停役身家調查，我們已將【延役專區】與【行政中心】調整至首位，幫助您第一時間精準試算天數與備齊證明文件。',
        defaultTab: 'delay',
        blocks: [
            {
                title: '核心推薦',
                badge: '延役處理',
                tabs: ['delay', 'docs', 'locations']
            },
            {
                title: '諮詢與資材',
                badge: '政策掌握',
                tabs: ['chat', 'inventory', 'home']
            },
            {
                title: '訓練與娛樂',
                badge: '軍常識庫',
                tabs: ['quiz', 'shooting', 'training', 'rhapsody']
            }
        ]
    }
};

export const NAV_ITEMS_DICT = {
    home: { id: 'home', title: '戰情儀表板', icon: 'fa-chart-line' },
    training: { id: 'training', title: '今日課表', icon: 'fa-dumbbell' },
    inventory: { id: 'inventory', title: '入伍背包', icon: 'fa-briefcase' },
    chat: { id: 'chat', title: '教官聊天室', icon: 'fa-comments' },
    docs: { id: 'docs', title: '行政中心', icon: 'fa-bars' },
    locations: { id: 'locations', title: '新訓地點', icon: 'fa-map-location-dot' },
    delay: { id: 'delay', title: '延役專區', icon: 'fa-calendar-minus' },
    rhapsody: { id: 'rhapsody', title: '大兵狂想曲', icon: 'fa-music' },
    quiz: { id: 'quiz', title: '天兵課堂', icon: 'fa-graduation-cap' },
    shooting: { id: 'shooting', title: '射擊口訣', icon: 'fa-crosshairs' }
};

/**
 * 動態渲染側邊導覽列 (分區與排序)
 * @param {string} scenarioKey - 身分情境 (preparing | enlisted | deferred)
 */
export function renderSidebarNav(scenarioKey = 'preparing') {
    const config = SCENARIO_CONFIG[scenarioKey] || SCENARIO_CONFIG.preparing;
    state.userScenario = scenarioKey;

    if (!dom.sidebarNav) return;
    dom.sidebarNav.innerHTML = '';

    config.blocks.forEach((block, blockIndex) => {
        const blockContainer = document.createElement('div');
        blockContainer.className = 'space-y-1 mb-4';

        // HUD Block Header
        const headerEl = document.createElement('div');
        headerEl.className = 'px-2 py-1 text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase flex items-center justify-between border-b border-stone-800/80 mb-2';
        headerEl.innerHTML = `
            <span class="flex items-center gap-1"><i class="fa-solid fa-chevron-right text-[9px] text-green-500"></i> ${block.title}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded bg-stone-900 border border-stone-800 text-stone-400 font-normal">${block.badge}</span>
        `;
        blockContainer.appendChild(headerEl);

        // Buttons in block
        block.tabs.forEach(tabId => {
            const item = NAV_ITEMS_DICT[tabId];
            if (!item) return;

            const btn = document.createElement('button');
            btn.dataset.tab = tabId;
            btn.className = `nav-btn w-full flex items-center justify-between px-3.5 py-2 rounded-lg transition-all text-stone-400 hover:bg-stone-800 hover:text-stone-200 text-left group`;

            const isRecommended = (blockIndex === 0);
            const badgeHtml = isRecommended
                ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-950 text-green-400 border border-green-800/60 shrink-0">推薦</span>`
                : '';

            btn.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <i class="fa-solid ${item.icon} text-[18px] w-5 text-center group-hover:scale-110 transition-transform"></i>
                    <span class="font-bold text-sm truncate">${item.title}</span>
                </div>
                ${badgeHtml}
            `;

            btn.addEventListener('click', () => switchTab(tabId));
            blockContainer.appendChild(btn);
        });

        dom.sidebarNav.appendChild(blockContainer);
    });

    // Update Scenario Badges
    if (dom.sidebarScenarioTag) {
        dom.sidebarScenarioTag.className = `text-xs font-bold ${config.colorClass} flex items-center gap-1.5 mt-0.5 truncate`;
        dom.sidebarScenarioTag.innerHTML = `<i class="fa-solid ${config.icon}"></i> <span>${config.title}</span>`;
    }

    if (dom.headerScenarioText) {
        dom.headerScenarioText.className = `font-bold flex items-center gap-1 text-[11px] md:text-xs ${config.colorClass}`;
        dom.headerScenarioText.innerHTML = `<i class="fa-solid ${config.icon}"></i> 情境: ${config.title}`;
    }

    // Refresh active tab highlighting
    if (state.activeTab) {
        switchTab(state.activeTab);
    }
}

/**
 * 開啟情境分流 Modal
 * @param {boolean} canClose - 是否允許自由關閉 (已選取過時為 true)
 */
export function openScenarioModal(canClose = false) {
    if (!dom.modalScenarioSelect) return;
    dom.modalScenarioSelect.classList.remove('hidden');

    if (dom.btnCloseScenarioModal) {
        if (canClose) {
            dom.btnCloseScenarioModal.classList.remove('hidden');
        } else {
            dom.btnCloseScenarioModal.classList.add('hidden');
        }
    }
}

export function closeScenarioModal() {
    if (dom.modalScenarioSelect) {
        dom.modalScenarioSelect.classList.add('hidden');
    }
}

/**
 * 切換側邊欄與主畫面 View
 * @param {string} tabId - 目標 Tab ID (home, training, etc.)
 */
export function switchTab(tabId) {
    state.activeTab = tabId;

    // Toggle Views
    Object.keys(dom.views).forEach(key => {
        const view = dom.views[key];
        if (!view) return; // Guard against missing DOM

        if (key === tabId) {
            view.classList.remove('hidden');
            view.classList.add('animate-fade-in');
        } else {
            view.classList.add('hidden');
            view.classList.remove('animate-fade-in');
        }
    });

    // Update Sidebar Nav
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        if (isActive) {
            btn.classList.add('bg-green-900/30', 'text-green-400', 'border-green-800/50');
            btn.classList.remove('text-stone-400', 'hover:bg-stone-800', 'hover:text-stone-200');
        } else {
            btn.classList.remove('bg-green-900/30', 'text-green-400', 'border-green-800/50');
            btn.classList.add('text-stone-400', 'hover:bg-stone-800', 'hover:text-stone-200');
        }
    });

    // Update Mobile Nav
    document.querySelectorAll('.nav-btn-mobile').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        if (isActive) {
            btn.classList.add('text-green-500');
            btn.classList.remove('text-stone-500');
        } else {
            btn.classList.add('text-stone-500');
            btn.classList.remove('text-green-500');
        }
    });
}
window.switchTab = switchTab;
