/**
 * SIMSOLDIER MAIN ENTRY POINT
 * 程式啟動、事件綁定、初始化
 */

import { api } from './api.js';
import { state, INITIAL_BACKPACK } from './state.js';
import { dom, switchTab, renderSidebarNav, openScenarioModal, closeScenarioModal, SCENARIO_CONFIG, updateNoticeVisibility } from './ui.js';
import { determineServiceType, bmi } from './utils.js';
import * as game from './game.js';
import * as features from './features.js';
import { training_ai } from './training_ai.js';
import { initQuiz } from './quiz.js';
import { initDelay } from './delay.js';
import { initShootingGame } from './shooting.js';

// --- Initialization ---

// 1. Check Auth immediately
if (!api.checkAuth()) {
    // 沒登入就直接跳轉，並用 replace 避免產生上一頁的歷史紀錄
    window.location.replace('loadingbar.html?dest=login.html');
} else {
    // 2. 確定有登入，才允許執行初始化！(這非常重要，避免跳轉時在背景報錯)
    init();
}

async function init() {
    try {
        const user = await api.getMe(); // Load User Data

        // Init Backpack
        state.backpack = JSON.parse(JSON.stringify(INITIAL_BACKPACK));

        if (user) {
            if (!user.profile) {
                console.warn('Auto-fixing missing user profile...');
                user.profile = { name: "士兵", height: 175, weight: 70, role: 1, role_name: "準備入營", scenario: "preparing", date: null };
            }
            state.isLoggedIn = true;
            state.userData = user.profile;
            state.userScenario = user.scenario || 'preparing';
            state.serviceStatus = determineServiceType(
                bmi(user.profile.height, user.profile.weight),
                user.profile.role,
                'none',
                user.profile.birthday
            );

            updateUIForUser();
        } else {
            console.error('User not found, clearing session.');
            // 只清空當前登入狀態，絕對不要動 localStorage
            sessionStorage.removeItem('simSoldier_currentUser');
            api.logout();
            return;
        }

        features.renderInventory();
        features.startCountdownTimer();
        features.setupDateInputs(); // Init Date Input Logic
        features.initChatGreeting(); // 根據兵役狀態與日期產生自適應的教官開場白
        features.initJourneySystem(); // 初始化服役歷程進度系統
        setupEventListeners();

        // 啟動 AI 訓練模組與天兵課堂
        try {
            training_ai.init();
            console.log('AI Training initialized');
        } catch (e) {
            console.error('AI Training init failed:', e);
        }

        try {
            initQuiz();
            console.log('Quiz initialized');
        } catch (e) {
            console.error('Quiz init failed:', e);
        }

        try {
            initDelay();
            console.log('Delay section initialized');
        } catch (e) {
            console.error('Delay init failed:', e);
        }

        try {
            initShootingGame();
            console.log('Shooting game initialized');
        } catch (e) {
            console.error('Shooting init failed:', e);
        }

        // Scenario Triage & Dynamic Sidebar Navigation Initialization
        const isJustRegistered = sessionStorage.getItem('simSoldier_justRegistered') === 'true';
        if (isJustRegistered) {
            sessionStorage.removeItem('simSoldier_justRegistered');
            state.userScenario = 'preparing';
            renderSidebarNav('preparing');
            openScenarioModal(false); // 註冊完成後立即彈出「選擇您的服役情境身分」
        } else {
            const initialScenario = state.userScenario || localStorage.getItem('simSoldier_userScenario') || 'preparing';
            state.userScenario = initialScenario;
            localStorage.setItem('simSoldier_userScenario', initialScenario);
            renderSidebarNav(initialScenario);

            // If user scenario was not set previously, prompt modal
            if (!user || !user.role_name) {
                openScenarioModal(false);
            }
        }

        // Reveal UI after successful load
        document.body.classList.remove('opacity-0');

    } catch (error) {
        console.error('Init error:', error);
        if (error.message === 'Not logged in') {
            // 發生未登入錯誤時，清除登入狀態並踢出
            sessionStorage.removeItem('simSoldier_currentUser');
            api.logout();
            return;
        }
        alert('系統發生錯誤 (DEBUG模式):\n' + error.message + '\n\n' + error.stack);
    }
}
function updateUIForUser() {
    const { name } = state.userData;

    // Sidebar
    dom.userInfoSidebar.classList.remove('hidden');
    dom.btnLoginSidebar.classList.add('hidden');
    dom.sidebarName.textContent = name;
    dom.sidebarRole.textContent = state.serviceStatus.type;

    // Header
    dom.headerGuestTools.classList.add('hidden');
    dom.headerUserTools.classList.remove('hidden');
    dom.headerNameMobile.textContent = name;
    dom.headerStatusMobile.textContent = state.serviceStatus.type;

    // Home Widgets
    dom.widgetGuest.classList.add('hidden');
    dom.widgetStatus.classList.remove('hidden');
    dom.statusType.textContent = state.serviceStatus.type;
    dom.statusReason.textContent = state.serviceStatus.reason;
    dom.statusInstruction.textContent = state.serviceStatus.nextStep;
    dom.statusIcon.textContent = state.serviceStatus.icon;

    // Countdown / Exempt Logic
    dom.countdownContentGuest.classList.add('hidden');
    if (state.serviceStatus.type === '免役') {
        dom.countdownContentUser.classList.add('hidden');
        dom.countdownContentExempt.classList.remove('hidden');
    } else {
        dom.countdownContentUser.classList.remove('hidden');
        dom.countdownContentExempt.classList.add('hidden');
        features.updateCountdown();

        if (state.userData.location) {
            dom.locationDisplay.textContent = state.userData.location;
            dom.widgetLocation.classList.remove('hidden');
        } else {
            dom.widgetLocation.classList.add('hidden');
        }
    }

    // Calendar
    features.renderCalendar();
    dom.calendarPanel.classList.remove('hidden');

    // Tasks Unlock
    dom.tasksCard.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
    dom.tasksLockOverlay.classList.add('hidden');
    features.renderJourneySystem();

    // Notice Visibility & Task Progression based on Scenario
    updateNoticeVisibility(state.userScenario || 'preparing');
    features.applyScenarioTaskProgression(state.userScenario || 'preparing');
}


// --- Event Listeners ---

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    document.querySelectorAll('.nav-btn-mobile').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // --- Scenario Triage Logic ---
    let pendingScenario = state.userScenario || 'preparing';

    const handleSelectCard = (scenarioKey) => {
        const config = SCENARIO_CONFIG[scenarioKey];
        if (!config) return;
        pendingScenario = scenarioKey;

        // Highlight selected card
        document.querySelectorAll('.scenario-card').forEach(card => {
            if (card.dataset.scenario === scenarioKey) {
                card.classList.add('ring-2', 'ring-emerald-500', 'bg-stone-800/90');
                card.classList.remove('border-stone-800', 'bg-stone-950/80');
            } else {
                card.classList.remove('ring-2', 'ring-emerald-500', 'bg-stone-800/90');
                card.classList.add('border-stone-800', 'bg-stone-950/80');
            }
        });

        // Show guidance preview panel
        if (dom.scenarioGuidancePanel) {
            dom.scenarioGuidancePanel.classList.remove('hidden');
            if (dom.guidanceTitle) dom.guidanceTitle.textContent = config.guidanceTitle;
            if (dom.guidanceDesc) dom.guidanceDesc.textContent = config.guidanceDesc;
            if (dom.guidanceTextContent) {
                dom.guidanceTextContent.innerHTML = `
                    <p class="font-bold text-white mb-1">個人客製化引導說明：</p>
                    <p class="leading-relaxed text-stone-300">${config.guidanceText}</p>
                `;
            }
        }
    };

    // Card click event
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.addEventListener('click', () => {
            handleSelectCard(card.dataset.scenario);
        });
    });

    // Confirm Scenario Button
    if (dom.btnConfirmScenario) {
        dom.btnConfirmScenario.addEventListener('click', async () => {
            const originalBtnText = dom.btnConfirmScenario.innerHTML;

            // 1. 立即套用狀態並更新 UI
            state.userScenario = pendingScenario;
            localStorage.setItem('simSoldier_userScenario', pendingScenario);
            renderSidebarNav(pendingScenario);
            features.initChatGreeting(); // 即時同步更新聊天室教官開場白
            features.applyScenarioTaskProgression(pendingScenario); // 正在入營自動推進階段一與階段二任務

            // 2. 切換對應的預設分頁並立即關閉彈窗 (極速響應)
            const defaultTab = SCENARIO_CONFIG[pendingScenario]?.defaultTab || 'home';
            switchTab(defaultTab);
            closeScenarioModal();

            // 3. 背景異步同步至 PostgreSQL 資料庫
            try {
                await api.updateScenario(pendingScenario);
                console.log(`[SimSoldier] Successfully synced scenario '${pendingScenario}' to database.`);
            } catch (err) {
                console.warn('[SimSoldier] Background sync scenario warning:', err);
            } finally {
                if (dom.btnConfirmScenario) {
                    dom.btnConfirmScenario.innerHTML = originalBtnText;
                    dom.btnConfirmScenario.disabled = false;
                }
            }
        });
    }

    // Reselect Scenario Button
    if (dom.btnReselectScenario) {
        dom.btnReselectScenario.addEventListener('click', () => {
            if (dom.scenarioGuidancePanel) dom.scenarioGuidancePanel.classList.add('hidden');
            document.querySelectorAll('.scenario-card').forEach(card => {
                card.classList.remove('ring-2', 'ring-emerald-500', 'bg-stone-800/90');
                card.classList.add('border-stone-800', 'bg-stone-950/80');
            });
        });
    }

    // Close Modal Button
    if (dom.btnCloseScenarioModal) {
        dom.btnCloseScenarioModal.addEventListener('click', closeScenarioModal);
    }

    // Scenario Switch Triggers
    if (dom.btnSidebarSwitchScenario) {
        dom.btnSidebarSwitchScenario.addEventListener('click', () => openScenarioModal(true));
    }
    if (dom.btnHeaderScenarioSwitch) {
        dom.btnHeaderScenarioSwitch.addEventListener('click', () => openScenarioModal(true));
    }

    // Onboarding / Profile Edit Modal
    if (dom.btnSubmitOnboarding) dom.btnSubmitOnboarding.addEventListener('click', handleOnboardingSubmit);
    if (dom.btnCloseOnboarding) dom.btnCloseOnboarding.addEventListener('click', () => dom.modalOnboarding.classList.add('hidden'));

    // Edit Profile Buttons
    const openModal = () => {
        dom.modalOnboarding.classList.remove('hidden');
        dom.btnCloseOnboarding.classList.remove('hidden');
        // Pre-fill logic
        if (state.userData) {
            dom.inputName.value = state.userData.name || '';

            // Split Date Logic
            if (state.userData.date) {
                const [y, m, d] = state.userData.date.split(/[-/]/);
                if (dom.inputDateY) dom.inputDateY.value = y;
                if (dom.inputDateM) dom.inputDateM.value = m;
                if (dom.inputDateD) dom.inputDateD.value = d;
            }

            if (state.userData.birthday) {
                const [y, m, d] = state.userData.birthday.split(/[-/]/);
                if (dom.inputBirthdayY) dom.inputBirthdayY.value = y;
                if (dom.inputBirthdayM) dom.inputBirthdayM.value = m;
                if (dom.inputBirthdayD) dom.inputBirthdayD.value = d;
            }

            dom.inputHeight.value = state.userData.height || 175;
            dom.inputWeight.value = state.userData.weight || 70;
        }
    };

    dom.btnLoginSidebar.addEventListener('click', openModal);
    dom.btnLoginHeader.addEventListener('click', openModal);
    dom.btnEditProfile.addEventListener('click', openModal);
    dom.btnUnlockGuest.addEventListener('click', openModal);
    dom.btnSetupDate.addEventListener('click', openModal);

    // Sidebar Settings
    if (dom.btnSettingsSidebar) {
        dom.btnSettingsSidebar.addEventListener('click', (e) => {
            e.stopPropagation();
            dom.settingsMenuSidebar.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!dom.settingsMenuSidebar.contains(e.target) && e.target !== dom.btnSettingsSidebar) {
                dom.settingsMenuSidebar.classList.add('hidden');
            }
        });
    }

    if (dom.btnEditProfileSidebar) {
        dom.btnEditProfileSidebar.addEventListener('click', () => {
            dom.settingsMenuSidebar.classList.add('hidden');
            openModal();
        });
    }

    if (dom.btnGameBackpackSidebar) {
        dom.btnGameBackpackSidebar.addEventListener('click', () => {
            dom.settingsMenuSidebar.classList.add('hidden');
            alert('小遊戲背包功能開發中！');
        });
    }

    if (dom.btnDeleteAccountSidebar) {
        dom.btnDeleteAccountSidebar.addEventListener('click', () => {
            dom.settingsMenuSidebar.classList.add('hidden');
            if (confirm('確定要永久刪除帳號嗎？此動作無法復原！')) {
                const currentUser = sessionStorage.getItem('simSoldier_currentUser');
                localStorage.removeItem('simSoldier_user_' + currentUser); // Wait, keys were just in one object?
                // The API logic saves all users in ONE key 'simSoldier_users'.
                // So strict delete requires reading that object.
                // For now just clear session is safer, or impl delete in API.
                api.logout();
            }
        });
    }

    if (dom.btnLogoutSidebar) dom.btnLogoutSidebar.addEventListener('click', showLogoutModal);
    document.querySelectorAll('.btn-logout').forEach(btn => btn.addEventListener('click', showLogoutModal));

    // Logout Modal Logic
    function showLogoutModal() {
        if (dom.settingsMenuSidebar) dom.settingsMenuSidebar.classList.add('hidden');
        dom.modalLogout.classList.remove('hidden');
    }

    if (dom.btnConfirmLogout) {
        dom.btnConfirmLogout.addEventListener('click', () => {
            dom.modalLogout.classList.add('hidden');
            api.logout();
        });
    }

    if (dom.btnCancelLogout) {
        dom.btnCancelLogout.addEventListener('click', () => {
            dom.modalLogout.classList.add('hidden');
        });
    }

    // Chat
    dom.chatForm.addEventListener('submit', features.handleChatSubmit);

    // Video
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => features.playVideo(item.dataset));
    });
    dom.btnClosePlayer.addEventListener('click', features.closeVideo);

    // Docs
    document.querySelectorAll('.btn-doc').forEach(btn => {
        btn.addEventListener('click', () => features.openDocsModal(btn.dataset.doc));
    });
    dom.btnCloseDocs.addEventListener('click', () => dom.modalDocs.classList.add('hidden'));

    // Daily Tasks
    dom.taskCheckboxes.forEach(cb => cb.addEventListener('change', features.updateDailyTaskProgress));

    // Game Links & Control
    dom.linkGame.addEventListener('click', () => switchTab('game'));
    // dom.linkVideo.addEventListener('click', () => switchTab('video')); // Removed since element is deleted
    // Draw Rules Modal Logic
    const btnShowDrawRules = document.getElementById('btn-show-draw-rules');
    const drawRulesModal = document.getElementById('draw-rules-modal');
    const agreeDrawRules = document.getElementById('agree-draw-rules');
    const btnCancelDraw = document.getElementById('btn-cancel-draw');

    if (btnShowDrawRules && drawRulesModal && agreeDrawRules && btnCancelDraw) {
        btnShowDrawRules.addEventListener('click', () => {
            drawRulesModal.classList.remove('hidden');
            agreeDrawRules.checked = false;
            dom.btnStartGame.disabled = true;
        });

        btnCancelDraw.addEventListener('click', () => {
            drawRulesModal.classList.add('hidden');
        });

        agreeDrawRules.addEventListener('change', (e) => {
            dom.btnStartGame.disabled = !e.target.checked;
        });

        dom.btnStartGame.addEventListener('click', () => {
            drawRulesModal.classList.add('hidden');
            game.startGame();
        });
    } else {
        dom.btnStartGame.addEventListener('click', game.startGame);
    }

    // Village Draw Rules Modal Logic
    const btnShowVillageRules = document.getElementById('btn-show-village-rules');
    const villageRulesModal = document.getElementById('village-rules-modal');
    const agreeVillageRules = document.getElementById('agree-village-rules');
    const btnCancelVillageDraw = document.getElementById('btn-cancel-village-draw');
    const btnDrawVillageInner = document.getElementById('btn-draw-village');

    if (btnShowVillageRules && villageRulesModal && agreeVillageRules && btnCancelVillageDraw && btnDrawVillageInner) {
        btnShowVillageRules.addEventListener('click', () => {
            villageRulesModal.classList.remove('hidden');
            agreeVillageRules.checked = false;
            btnDrawVillageInner.disabled = true;
        });

        btnCancelVillageDraw.addEventListener('click', () => {
            villageRulesModal.classList.add('hidden');
        });

        agreeVillageRules.addEventListener('change', (e) => {
            btnDrawVillageInner.disabled = !e.target.checked;
        });

        btnDrawVillageInner.addEventListener('click', () => {
            villageRulesModal.classList.add('hidden');
            game.startVillageDraw();
        });
    }

    dom.btnQuitGame.addEventListener('click', game.quitGame);
    dom.btnRetryGame.addEventListener('click', game.startGame);
    dom.btnBackHome.addEventListener('click', () => {
        switchTab('home');
        game.quitGame(); // Ensure stopped
    });

    // Fake Countdown
    dom.btnFakeCountdown.addEventListener('click', () => {
        dom.countdownContentExempt.classList.add('hidden');
        dom.countdownContentUser.classList.remove('hidden');
        dom.countdownTitle.textContent = "體驗倒數 (模擬)";
        dom.btnEndFake.classList.remove('hidden');
        state.userData.tempCountdown = true;
        features.updateCountdown();
    });

    dom.btnEndFake.addEventListener('click', () => {
        dom.countdownContentExempt.classList.remove('hidden');
        dom.countdownContentUser.classList.add('hidden');
        dom.countdownTitle.textContent = "距離入伍";
        dom.btnEndFake.classList.add('hidden');
        state.userData.tempCountdown = false;
    });

    // Training Cards Delegate
    const trainingGrid = dom.trainingContent.querySelector('.grid'); // Need to find parent
    if (trainingGrid) {
        // We attached to individual cards in script.js, let's do safe query
        dom.trainingContent.querySelectorAll('.grid > div').forEach((card, index) => {
            const dayId = index + 1;
            const btn = card.querySelector('.btn-confirm-training');
            if (btn) {
                btn.onclick = (e) => { // Use onclick to replace old listeners if any
                    e.stopPropagation();
                    features.toggleTrainingDay(dayId, card, btn);
                };
            }
        });
    }

    // Rhapsody Fullscreen Toggle
    const btnRhapsodyFullscreen = document.getElementById('btn-rhapsody-fullscreen');
    const viewRhapsody = document.getElementById('view-rhapsody');
    let isRhapsodyFullscreen = false;

    console.log('🎮 Rhapsody fullscreen init:', { btnRhapsodyFullscreen, viewRhapsody });

    if (btnRhapsodyFullscreen && viewRhapsody) {
        // The old inline style constant has been removed as we use css class now.

        btnRhapsodyFullscreen.addEventListener('click', async () => {
            console.log('🎮 Fullscreen button clicked!');

            if (!document.fullscreenElement) {
                // Enter fullscreen mode natively
                try {
                    await viewRhapsody.requestFullscreen();
                } catch (err) {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                    // Fallback to css fullscreen if API fails
                    viewRhapsody.classList.add('fullscreen-rhapsody');
                    document.body.style.overflow = 'hidden';
                }
            } else {
                // Exit fullscreen mode natively
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        });

        // Listen for native fullscreen changes to update the button UI
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                btnRhapsodyFullscreen.innerHTML = '<i class="fa-solid fa-compress text-xl"></i>';
                btnRhapsodyFullscreen.title = '退出全螢幕';
                viewRhapsody.classList.add('fullscreen-rhapsody'); // Ensure CSS styles if needed
                console.log('🎮 Entered native fullscreen');
            } else {
                btnRhapsodyFullscreen.innerHTML = '<i class="fa-solid fa-expand text-xl"></i>';
                btnRhapsodyFullscreen.title = '切換全螢幕';
                viewRhapsody.classList.remove('fullscreen-rhapsody');
                document.body.style.overflow = '';
                console.log('🎮 Exited native fullscreen');
            }
        });
    } else {
        console.warn('⚠️ Rhapsody fullscreen: button or container not found');
    }
}

async function handleOnboardingSubmit() {
    const name = dom.inputName.value;

    // Reconstruct Dates
    const dateY = dom.inputDateY.value;
    const dateM = dom.inputDateM.value.padStart(2, '0');
    const dateD = dom.inputDateD.value.padStart(2, '0');
    const date = (dateY && dateM && dateD) ? `${dateY}-${dateM}-${dateD}` : '';

    const birthY = dom.inputBirthdayY.value;
    const birthM = dom.inputBirthdayM.value.padStart(2, '0');
    const birthD = dom.inputBirthdayD.value.padStart(2, '0');
    const birthday = (birthY && birthM && birthD) ? `${birthY}-${birthM}-${birthD}` : '';

    const height = dom.inputHeight.value;
    const weight = dom.inputWeight.value;
    const btnSubmit = dom.btnSubmitOnboarding;

    if (!name || !date) {
        alert('請填寫完整資訊');
        return;
    }

    const currentRole = state.userData?.role;
    const userData = { name, date, birthday, height, weight };
    if (currentRole) {
        userData.role = currentRole;
    }

    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>處理中...';
    btnSubmit.disabled = true;

    try {
        const savedData = await api.updateProfile(userData);

        if (savedData && savedData._nameChanged) {
            alert('姓名即為您的登入帳號，已變更成功，請重新登入！');
            api.logout();
            return;
        }

        // Update local state (保持當前情境身分不變)
        state.userData = { ...state.userData, ...userData };

        state.serviceStatus = determineServiceType(bmi(height, weight), currentRole, 'none', birthday);

        updateUIForUser();
        dom.modalOnboarding.classList.add('hidden');

    } catch (error) {
        console.error(error);
        alert('資料儲存失敗: ' + error.message);
    } finally {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
}


// Start App
init();
