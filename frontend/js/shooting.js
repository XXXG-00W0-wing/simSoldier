import { toggleJourneyTask } from './features.js';

export function initShootingGame() {
    // --- 1. Mnemonic Order Quiz Elements & State ---
    const MNEMONIC_CORRECT_ORDER = ['托', '抵', '握', '貼', '瞄', '停', '扣', '報'];
    let quizSlots = Array(8).fill(null); // Array of 8 slots
    let quizPool = [];

    const quizSlotsContainer = document.getElementById('mnemonic-quiz-slots');
    const quizPoolContainer = document.getElementById('mnemonic-quiz-pool');
    const btnGradeQuiz = document.getElementById('btn-grade-mnemonic-quiz');
    const btnResetQuiz = document.getElementById('btn-reset-mnemonic-quiz');
    const quizResultBox = document.getElementById('mnemonic-quiz-result');
    const quizCorrectNum = document.getElementById('quiz-correct-num');
    const quizAccuracyPct = document.getElementById('quiz-accuracy-pct');
    const quizRankBadge = document.getElementById('quiz-rank-badge');
    const quizErrorDetails = document.getElementById('quiz-error-details');

    // --- 2. Live Firing Simulator Elements & State ---
    const startBtn = document.getElementById('btn-start-shooting');
    const retryBtn = document.getElementById('btn-retry-shooting');
    const startScreen = document.getElementById('shooting-start-screen');
    const aimingArea = document.getElementById('shooting-aiming-area');
    const endScreen = document.getElementById('shooting-end-screen');

    // HUD
    const hud = document.getElementById('shooting-hud');
    const scoreDisplay = document.getElementById('shooting-score');
    const roundsDisplay = document.getElementById('shooting-rounds');
    const timerDisplay = document.getElementById('shooting-timer');
    const flash = document.getElementById('shooting-flash');
    const targetArea = document.getElementById('shooting-target-area');

    // Aiming Elements & T91 Gun
    const crosshair = document.getElementById('aim-crosshair');
    const t91GunContainer = document.getElementById('t91-gun-container');
    const btnMobileAim = document.getElementById('btn-mobile-aim');
    const btnMobileShoot = document.getElementById('btn-mobile-shoot');
    const gameContainer = document.getElementById('shooting-game-container');
    const targetHuman = document.getElementById('aim-target-human');

    // Virtual Joystick & Steady Aim Elements
    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');
    const steadyAimBadge = document.getElementById('steady-aim-badge');
    const textMobileAim = document.getElementById('text-mobile-aim');

    // Gyroscope Mobile Aiming Elements
    const btnToggleGyro = document.getElementById('btn-toggle-gyro');
    const textToggleGyro = document.getElementById('text-toggle-gyro');
    const btnRecenterGyro = document.getElementById('btn-recenter-gyro');

    // Instruction Modal & Warning Elements
    const btnShowInstructions = document.getElementById('btn-show-shooting-instructions');
    const btnOpenInstructionsStart = document.getElementById('btn-open-instructions-start');
    const modalInstructions = document.getElementById('modal-shooting-instructions');
    const btnCloseModal = document.getElementById('btn-close-shooting-modal');
    const btnUnderstandModal = document.getElementById('btn-understand-instructions');
    const orientationWarning = document.getElementById('shooting-orientation-warning');

    // End Elements
    const finalScoreDisplay = document.getElementById('shooting-final-score');
    const rankDisplay = document.getElementById('shooting-rank');

    // --- State Variables ---
    let score = 0;
    const maxRounds = 6;
    const maxScore = 60;
    let currentRound = 0;
    let timeRemaining = 30;
    let timerInterval = null;

    let isAiming = false;
    let isHoldingBreath = false;
    let timeElapsed = 0;
    let aimInterval;

    // Joystick & Steady Aim State
    let joystickVectorX = 0;
    let joystickVectorY = 0;
    let isSteadyAiming = false;
    let steadyAimTimer = null;
    let steadyAimTimeRemaining = 0;

    // Gyroscope State
    let isGyroEnabled = true;
    let calibBeta = null;
    let calibGamma = null;
    let rawGyroDeltaX = 0;
    let rawGyroDeltaY = 0;
    let smoothGyroX = 0;
    let smoothGyroY = 0;

    // Physics & Coordinates
    let cx = 50; // percentage
    let cy = 50;
    let baseX = 50;
    let baseY = 50;
    let recoilX = 0;
    let recoilY = 0;

    let mousePctX = 50;
    let mousePctY = 50;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchBaseX = 50;
    let touchBaseY = 50;

    // ==========================================
    // SECTION 1: MNEMONIC ORDER QUIZ LOGIC
    // ==========================================

    function initMnemonicQuiz() {
        if (!quizSlotsContainer || !quizPoolContainer) return;

        // Reset state & shuffle cards
        quizSlots = Array(8).fill(null);
        quizPool = [...MNEMONIC_CORRECT_ORDER];

        // Fisher-Yates Shuffle
        for (let i = quizPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [quizPool[i], quizPool[j]] = [quizPool[j], quizPool[i]];
        }

        if (quizResultBox) quizResultBox.classList.add('hidden');
        renderMnemonicQuizUI();
    }

    function renderMnemonicQuizUI() {
        if (!quizSlotsContainer || !quizPoolContainer) return;

        // 1. Render 8 Slots
        quizSlotsContainer.innerHTML = '';
        quizSlots.forEach((word, index) => {
            const slot = document.createElement('div');
            slot.className = `flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[72px] select-none ${word
                ? 'bg-stone-800 border-green-500 text-white cursor-pointer hover:bg-stone-700 active:scale-95 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                : 'bg-stone-950/80 border-dashed border-stone-700 text-stone-600'
                }`;

            if (word) {
                slot.innerHTML = `
                    <span class="text-xs text-green-400 font-tech font-bold">#${index + 1}</span>
                    <span class="text-xl md:text-2xl font-bold mt-0.5">${word}</span>
                `;
                slot.addEventListener('click', () => removeWordFromSlot(index));
            } else {
                slot.innerHTML = `
                    <span class="text-xs text-stone-600 font-tech font-bold">#${index + 1}</span>
                    <span class="text-xs text-stone-600 font-bold mt-1">空位</span>
                `;
            }
            quizSlotsContainer.appendChild(slot);
        });

        // 2. Render Pool Cards
        quizPoolContainer.innerHTML = '';
        if (quizPool.length === 0) {
            quizPoolContainer.innerHTML = `<span class="text-stone-500 text-sm italic">卡片已全數放入排序區，請點擊上方按鈕【開始評分】！</span>`;
        } else {
            quizPool.forEach((word, poolIndex) => {
                const card = document.createElement('button');
                card.className = 'w-14 h-14 md:w-16 md:h-16 text-xl md:text-2xl font-bold bg-stone-800 hover:bg-stone-700 text-white rounded-xl border-2 border-stone-600 hover:border-amber-400 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center select-none';
                card.textContent = word;
                card.addEventListener('click', () => addWordToNextSlot(word, poolIndex));
                quizPoolContainer.appendChild(card);
            });
        }
    }

    function addWordToNextSlot(word, poolIndex) {
        const nextEmptyIndex = quizSlots.findIndex(slot => slot === null);
        if (nextEmptyIndex !== -1) {
            quizSlots[nextEmptyIndex] = word;
            quizPool.splice(poolIndex, 1);
            renderMnemonicQuizUI();
        }
    }

    function removeWordFromSlot(slotIndex) {
        const word = quizSlots[slotIndex];
        if (word) {
            quizSlots[slotIndex] = null;
            quizPool.push(word);
            renderMnemonicQuizUI();
        }
    }

    function gradeMnemonicQuiz() {
        if (!quizResultBox) return;

        let correctCount = 0;
        let errors = [];

        for (let i = 0; i < 8; i++) {
            const userChoice = quizSlots[i];
            const correctWord = MNEMONIC_CORRECT_ORDER[i];
            if (userChoice === correctWord) {
                correctCount++;
            } else {
                errors.push({
                    position: i + 1,
                    userChoice: userChoice || '未選擇',
                    correctWord: correctWord
                });
            }
        }

        const accuracyPct = Math.round((correctCount / 8) * 100);

        if (quizCorrectNum) quizCorrectNum.textContent = correctCount;
        if (quizAccuracyPct) quizAccuracyPct.textContent = accuracyPct;

        if (quizRankBadge) {
            if (correctCount === 8) {
                quizRankBadge.textContent = '100% 滿分！完全精通';
                quizRankBadge.className = 'text-lg font-bold text-yellow-400 px-3 py-1 bg-yellow-950/80 rounded border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]';
                toggleJourneyTask('t2_2', true);
            } else if (correctCount >= 6) {
                quizRankBadge.textContent = '良好 (需微調)';
                quizRankBadge.className = 'text-lg font-bold text-green-400 px-3 py-1 bg-stone-900 rounded border border-green-700';
                toggleJourneyTask('t2_2', true);
            } else {
                quizRankBadge.textContent = '不熟練 (需加強)';
                quizRankBadge.className = 'text-lg font-bold text-red-400 px-3 py-1 bg-red-950/80 rounded border border-red-800';
            }
        }

        if (quizErrorDetails) {
            quizErrorDetails.innerHTML = '';
            if (errors.length === 0) {
                quizErrorDetails.innerHTML = `<div class="text-green-400 font-bold flex items-center gap-2"><i class="fa-solid fa-circle-check"></i> 太棒了！8 個順序完全正確！</div>`;
            } else {
                errors.forEach(err => {
                    const errRow = document.createElement('div');
                    errRow.className = 'flex items-center gap-2 text-stone-300';
                    errRow.innerHTML = `
                        <span class="bg-red-950 text-red-400 border border-red-800/80 px-2 py-0.5 rounded text-xs font-bold shrink-0">第 ${err.position} 項排序錯誤</span>
                        <span>您選擇：<strong class="text-red-400 font-bold">${err.userChoice}</strong>，正確應為：<strong class="text-green-400 font-bold">${err.correctWord}</strong></span>
                    `;
                    quizErrorDetails.appendChild(errRow);
                });
            }
        }

        quizResultBox.classList.remove('hidden');
        quizResultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (btnResetQuiz) btnResetQuiz.addEventListener('click', initMnemonicQuiz);
    if (btnGradeQuiz) btnGradeQuiz.addEventListener('click', gradeMnemonicQuiz);

    // Initialize Mnemonic Quiz on page load
    initMnemonicQuiz();


    // ==========================================
    // SECTION 2: INSTRUCTION MODAL & ORIENTATION
    // ==========================================

    function openModal() {
        if (modalInstructions) modalInstructions.classList.remove('hidden');
    }
    function closeModal() {
        if (modalInstructions) modalInstructions.classList.add('hidden');
    }

    if (btnShowInstructions) btnShowInstructions.addEventListener('click', openModal);
    if (btnOpenInstructionsStart) btnOpenInstructionsStart.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnUnderstandModal) btnUnderstandModal.addEventListener('click', closeModal);
    if (modalInstructions) {
        modalInstructions.addEventListener('click', (e) => {
            if (e.target === modalInstructions) closeModal();
        });
    }

    // --- Fullscreen Toggle (Reference to Rhapsody Fullscreen) ---
    const btnShootingFullscreen = document.getElementById('btn-shooting-fullscreen');
    if (btnShootingFullscreen && gameContainer) {
        btnShootingFullscreen.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!document.fullscreenElement) {
                try {
                    await gameContainer.requestFullscreen();
                } catch (err) {
                    console.error('Shooting fullscreen error:', err);
                    gameContainer.classList.add('fullscreen-shooting');
                    document.body.style.overflow = 'hidden';
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === gameContainer || (document.fullscreenElement && document.fullscreenElement.id === 'shooting-game-container')) {
                if (btnShootingFullscreen) {
                    btnShootingFullscreen.innerHTML = '<i class="fa-solid fa-compress text-lg"></i>';
                    btnShootingFullscreen.title = '退出全螢幕';
                }
                gameContainer.classList.add('fullscreen-shooting');
            } else if (!document.fullscreenElement) {
                if (btnShootingFullscreen) {
                    btnShootingFullscreen.innerHTML = '<i class="fa-solid fa-expand text-lg"></i>';
                    btnShootingFullscreen.title = '切換全螢幕';
                }
                gameContainer.classList.remove('fullscreen-shooting');
                document.body.style.overflow = '';
            }
        });
    }

    function checkFirstTimeModal() {
        const viewShooting = document.getElementById('view-shooting');
        if (viewShooting && !viewShooting.classList.contains('hidden')) {
            const hasSeenModal = sessionStorage.getItem('simsoldier_shooting_modal_seen');
            if (!hasSeenModal) {
                openModal();
                sessionStorage.setItem('simsoldier_shooting_modal_seen', 'true');
            }
        }
    }

    window.addEventListener('resize', () => {
        checkFirstTimeModal();
    });

    const observer = new MutationObserver(() => {
        checkFirstTimeModal();
    });
    const viewShooting = document.getElementById('view-shooting');
    if (viewShooting) {
        observer.observe(viewShooting, { attributes: true, attributeFilter: ['class'] });
    }

    setTimeout(() => {
        checkFirstTimeModal();
    }, 300);


    // ==========================================
    // SECTION 3: T91 SIMULATOR LOGIC & EVENTS
    // ==========================================

    if (startBtn) startBtn.addEventListener('click', startAimingPhase);
    if (retryBtn) retryBtn.addEventListener('click', startAimingPhase);

    if (viewShooting) {
        viewShooting.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    // --- Virtual Joystick Touch Event Handlers ---
    if (joystickContainer && joystickStick) {
        const handleJoystickTouch = (e) => {
            e.preventDefault();
            if (e.touches.length === 0) return;

            const touch = e.touches[0];
            const rect = joystickContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = touch.clientX - centerX;
            const dy = touch.clientY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 40;

            const angle = Math.atan2(dy, dx);
            const moveDist = Math.min(dist, maxRadius);

            const stickX = Math.cos(angle) * moveDist;
            const stickY = Math.sin(angle) * moveDist;

            joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

            joystickVectorX = (stickX / maxRadius);
            joystickVectorY = (stickY / maxRadius);
        };

        const resetJoystick = (e) => {
            if (e) e.preventDefault();
            joystickStick.style.transform = 'translate(0px, 0px)';
            joystickVectorX = 0;
            joystickVectorY = 0;
        };

        joystickContainer.addEventListener('touchstart', handleJoystickTouch, { passive: false });
        joystickContainer.addEventListener('touchmove', handleJoystickTouch, { passive: false });
        joystickContainer.addEventListener('touchend', resetJoystick, { passive: false });
        joystickContainer.addEventListener('touchcancel', resetJoystick, { passive: false });
    }

    // Mouse movement & Right-Click toggle aim / Left-Click fire for Desktop
    if (gameContainer) {
        gameContainer.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            const rect = gameContainer.getBoundingClientRect();
            mousePctX = ((e.clientX - rect.left) / rect.width) * 100;
            mousePctY = ((e.clientY - rect.top) / rect.height) * 100;
        });

        gameContainer.addEventListener('mousedown', (e) => {
            if (window.innerWidth >= 768) {
                if (e.button === 2) {
                    // Right click: toggle aiming mode
                    e.preventDefault();
                    if (aimingArea && !aimingArea.classList.contains('hidden')) {
                        toggleAimMode();
                    }
                } else if (e.button === 0) {
                    // Left click: Fire shot
                    if (isAiming) {
                        e.preventDefault();
                        fireShot();
                    }
                }
            }
        });
    }

    function toggleAimMode() {
        isAiming = !isAiming;
        if (isAiming) {
            if (crosshair) crosshair.classList.remove('opacity-30');
            showFloatingText('鐵瞄瞄準', 'text-amber-400 font-bold', cx, cy);
        } else {
            if (crosshair) crosshair.classList.add('opacity-30');
            showFloatingText('退出瞄準', 'text-stone-400 font-bold', cx, cy);
        }
    }

    // Keyboard Spacebar for hold breath (Desktop)
    window.addEventListener('keydown', (e) => {
        if (isAiming && window.innerWidth >= 768 && e.code === 'Space') {
            e.preventDefault();
            isHoldingBreath = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (window.innerWidth >= 768 && e.code === 'Space') {
            isHoldingBreath = false;
        }
    });

    // --- Mobile Aim (5-second Steady Lock) Button ---
    if (btnMobileAim) {
        btnMobileAim.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isAiming) {
                isAiming = true;
                if (crosshair) crosshair.classList.remove('opacity-30');
            }

            if (isSteadyAiming) return; // Already active

            isSteadyAiming = true;
            isHoldingBreath = true;
            steadyAimTimeRemaining = 5;

            if (steadyAimBadge) {
                steadyAimBadge.textContent = '5s';
                steadyAimBadge.classList.remove('hidden');
            }
            if (textMobileAim) textMobileAim.textContent = '鎖定中';
            btnMobileAim.classList.add('ring-4', 'ring-yellow-400', 'animate-pulse');

            showFloatingText('屏息瞄準！準心完全穩定 (5秒)', 'text-yellow-400 font-bold', cx, cy);

            if (steadyAimTimer) clearInterval(steadyAimTimer);
            steadyAimTimer = setInterval(() => {
                steadyAimTimeRemaining--;
                if (steadyAimBadge) steadyAimBadge.textContent = `${steadyAimTimeRemaining}s`;

                if (steadyAimTimeRemaining <= 0) {
                    clearInterval(steadyAimTimer);
                    steadyAimTimer = null;
                    isSteadyAiming = false;
                    isHoldingBreath = false;

                    if (steadyAimBadge) steadyAimBadge.classList.add('hidden');
                    if (textMobileAim) textMobileAim.textContent = '瞄準 (5s)';
                    btnMobileAim.classList.remove('ring-4', 'ring-yellow-400', 'animate-pulse');

                    showFloatingText('屏息結束！', 'text-stone-400 font-bold', cx, cy);
                }
            }, 1000);
        });
    }

    // Mobile Shoot Button (Right Bottom)
    if (btnMobileShoot) {
        btnMobileShoot.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAiming) {
                fireShot();
            } else {
                showFloatingText('請先點擊【瞄準】', 'text-amber-400 font-bold', 50, 50);
            }
        });
    }

    // --- Gyroscope Motion Aiming Logic ---
    async function requestGyroPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const state = await DeviceOrientationEvent.requestPermission();
                return state === 'granted';
            } catch (e) {
                console.warn('Gyro permission request error:', e);
                return false;
            }
        }
        return true;
    }

    function handleDeviceOrientation(e) {
        if (!isAiming || !isGyroEnabled || window.innerWidth >= 768) return;
        const beta = e.beta;
        const gamma = e.gamma;
        if (beta === null || gamma === null) return;

        // Auto-calibrate baseline on first reading
        if (calibBeta === null || calibGamma === null) {
            calibBeta = beta;
            calibGamma = gamma;
        }

        const orientationAngle = (screen.orientation && typeof screen.orientation.angle === 'number')
            ? screen.orientation.angle
            : (window.orientation || 0);

        const dBeta = beta - calibBeta;
        const dGamma = gamma - calibGamma;

        let dx = 0;
        let dy = 0;

        if (orientationAngle === 90) {
            // Landscape primary (top to left)
            dx = -dBeta;
            dy = -dGamma;
        } else if (orientationAngle === -90 || orientationAngle === 270) {
            // Landscape inverted (top to right)
            dx = dBeta;
            dy = dGamma;
        } else if (orientationAngle === 180) {
            // Portrait inverted
            dx = -dGamma;
            dy = -dBeta;
        } else {
            // Portrait (0)
            dx = dGamma;
            dy = dBeta;
        }

        // Sensitivity factor: ~1.2% offset per degree of tilt
        const SENSITIVITY = 1.2;
        rawGyroDeltaX = dx * SENSITIVITY;
        rawGyroDeltaY = dy * SENSITIVITY;
    }

    function recenterGyro() {
        calibBeta = null;
        calibGamma = null;
        rawGyroDeltaX = 0;
        rawGyroDeltaY = 0;
        smoothGyroX = 0;
        smoothGyroY = 0;
        showFloatingText('陀螺儀已歸零校準', 'text-amber-400 font-bold', cx, cy);
    }

    async function toggleGyro() {
        if (!isGyroEnabled) {
            const granted = await requestGyroPermission();
            if (!granted) {
                showFloatingText('陀螺儀權限未授權', 'text-red-400 font-bold', 50, 50);
                return;
            }
            isGyroEnabled = true;
            recenterGyro();
            if (textToggleGyro) textToggleGyro.textContent = '陀螺儀: 開';
            if (btnToggleGyro) {
                btnToggleGyro.className = 'px-2.5 py-1 bg-emerald-900/80 border border-emerald-500/80 text-emerald-300 hover:text-white rounded text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow';
            }
            showFloatingText('陀螺儀瞄準已開啟', 'text-emerald-400 font-bold', cx, cy);
        } else {
            isGyroEnabled = false;
            rawGyroDeltaX = 0;
            rawGyroDeltaY = 0;
            smoothGyroX = 0;
            smoothGyroY = 0;
            if (textToggleGyro) textToggleGyro.textContent = '陀螺儀: 關';
            if (btnToggleGyro) {
                btnToggleGyro.className = 'px-2.5 py-1 bg-stone-800 border border-stone-600 text-stone-400 hover:text-white rounded text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow';
            }
            showFloatingText('陀螺儀已關閉 (使用搖桿)', 'text-stone-400 font-bold', cx, cy);
        }
    }

    if (btnToggleGyro) {
        btnToggleGyro.addEventListener('click', (e) => {
            e.preventDefault();
            toggleGyro();
        });
    }

    if (btnRecenterGyro) {
        btnRecenterGyro.addEventListener('click', (e) => {
            e.preventDefault();
            recenterGyro();
        });
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });


    // --- Start Aiming Simulator Phase ---
    function startAimingPhase() {
        if (startScreen) startScreen.classList.add('hidden');
        if (endScreen) endScreen.classList.add('hidden');
        if (aimingArea) aimingArea.classList.remove('hidden');
        if (hud) hud.classList.remove('hidden');

        currentRound = 0;
        score = 0;
        if (scoreDisplay) scoreDisplay.textContent = score;
        updateRoundsDisplay();

        baseX = 50;
        baseY = 50;
        cx = 50;
        cy = 50;
        recoilX = 0;
        recoilY = 0;
        mousePctX = 50;
        mousePctY = 50;
        joystickVectorX = 0;
        joystickVectorY = 0;

        // Reset and auto-calibrate gyro
        calibBeta = null;
        calibGamma = null;
        rawGyroDeltaX = 0;
        rawGyroDeltaY = 0;
        smoothGyroX = 0;
        smoothGyroY = 0;
        if (window.innerWidth < 768 && isGyroEnabled) {
            requestGyroPermission();
        }

        isAiming = true;
        isHoldingBreath = false;
        isSteadyAiming = false;
        if (steadyAimTimer) {
            clearInterval(steadyAimTimer);
            steadyAimTimer = null;
        }
        if (steadyAimBadge) steadyAimBadge.classList.add('hidden');
        if (textMobileAim) textMobileAim.textContent = '瞄準 (5s)';
        if (btnMobileAim) btnMobileAim.classList.remove('ring-4', 'ring-yellow-400', 'animate-pulse');

        timeElapsed = 0;
        if (crosshair) crosshair.classList.remove('opacity-30');

        startTimer();

        clearInterval(aimInterval);
        aimInterval = setInterval(updateAimPhysics, 30);
    }

    // 30s Countdown Timer
    function startTimer() {
        stopTimer();
        timeRemaining = 30;
        if (timerDisplay) timerDisplay.textContent = timeRemaining;

        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timerDisplay) timerDisplay.textContent = timeRemaining;
            if (timeRemaining <= 0) {
                stopTimer();
                isAiming = false;
                showFloatingText('時間到！測驗完成', 'text-red-500 font-bold', 50, 40);
                setTimeout(() => endGame(), 1000);
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateAimPhysics() {
        if (!isAiming) return;
        timeElapsed += 0.03;

        const isDesktop = window.innerWidth >= 768;

        recoilX *= 0.85;
        recoilY *= 0.85;

        // Joystick and Gyro movement logic for mobile
        if (!isDesktop) {
            if (Math.abs(joystickVectorX) > 0.05 || Math.abs(joystickVectorY) > 0.05) {
                baseX += joystickVectorX * 1.6;
                baseY += joystickVectorY * 1.6;
                baseX = Math.max(10, Math.min(90, baseX));
                baseY = Math.max(10, Math.min(90, baseY));
            }

            // Gyro smoothing (Low-pass filter / Lerp)
            if (isGyroEnabled) {
                smoothGyroX += (rawGyroDeltaX - smoothGyroX) * 0.35;
                smoothGyroY += (rawGyroDeltaY - smoothGyroY) * 0.35;
            } else {
                smoothGyroX = 0;
                smoothGyroY = 0;
            }
        } else {
            baseX += (mousePctX - baseX) * 0.15;
            baseY += (mousePctY - baseY) * 0.15;
            smoothGyroX = 0;
            smoothGyroY = 0;
        }

        // Sway amplitude: 0 when isSteadyAiming
        let speed = (isHoldingBreath || isSteadyAiming) ? 0.1 : 1.8;
        let amplitudeX = isSteadyAiming ? 0 : ((isHoldingBreath ? 0.8 : (isDesktop ? 5 : 8)));
        let amplitudeY = isSteadyAiming ? 0 : ((isHoldingBreath ? 0.8 : (isDesktop ? 3.5 : 5.5)));

        const swayX = Math.sin(timeElapsed * speed * 1.9) * amplitudeX + Math.cos(timeElapsed * speed * 1.1) * (amplitudeX * 0.4);
        const swayY = Math.cos(timeElapsed * speed * 1.6) * amplitudeY + Math.sin(timeElapsed * speed * 0.8) * (amplitudeY * 0.4);

        cx = baseX + swayX + smoothGyroX + (isSteadyAiming ? 0 : recoilX);
        cy = baseY + swayY + smoothGyroY + (isSteadyAiming ? 0 : recoilY);

        cx = Math.max(5, Math.min(95, cx));
        cy = Math.max(5, Math.min(95, cy));

        if (crosshair) {
            crosshair.style.left = `${cx}%`;
            crosshair.style.top = `${cy}%`;
        }

        if (t91GunContainer) {
            const gunShiftX = (cx - 50) * 1.2;
            const gunRot = (cx - 50) * 0.12;
            t91GunContainer.style.transform = `translateX(calc(-50% + ${gunShiftX}px)) rotate(${gunRot}deg)`;
        }
    }

    /**
     * Tactile vibration helper (supports Capacitor Native Haptics, navigator.vibrate & Gamepad actuators)
     */
    function triggerTactileVibration(pattern, gamepadDuration = 50, weakMag = 0.5, strongMag = 0.8) {
        // 1. Capacitor Native Haptics (Android APK / iOS App)
        const haptics = window.Capacitor?.Plugins?.Haptics;
        if (haptics) {
            try {
                if (typeof pattern === 'number') {
                    if (typeof haptics.vibrate === 'function') {
                        haptics.vibrate({ duration: pattern });
                    }
                } else if (Array.isArray(pattern) && pattern.length > 0) {
                    if (pattern.length === 1) {
                        if (typeof haptics.vibrate === 'function') {
                            haptics.vibrate({ duration: pattern[0] });
                        }
                    } else {
                        // Multi-pulse pattern: play intervals sequentially
                        let delay = 0;
                        pattern.forEach((dur, idx) => {
                            if (idx % 2 === 0) {
                                setTimeout(() => {
                                    try {
                                        if (typeof haptics.vibrate === 'function') {
                                            haptics.vibrate({ duration: dur });
                                        }
                                    } catch (e) {}
                                }, delay);
                            }
                            delay += dur;
                        });
                    }
                } else if (typeof haptics.vibrate === 'function') {
                    haptics.vibrate({ duration: 50 });
                }
            } catch (err) {
                console.warn('Capacitor Haptics vibration error:', err);
            }
        }

        // 2. Web Vibration API (Mobile Chrome / Firefox / Safari)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (err) {
                // Ignore vibration errors if unsupported
            }
        }

        // 3. Gamepad Actuator (Controllers)
        if (typeof navigator !== 'undefined' && navigator.getGamepads) {
            try {
                const gamepads = navigator.getGamepads();
                for (const gp of gamepads) {
                    if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
                        gp.vibrationActuator.playEffect('dual-rumble', {
                            startDelay: 0,
                            duration: gamepadDuration,
                            weakMagnitude: weakMag,
                            strongMagnitude: strongMag
                        }).catch(() => {});
                    }
                }
            } catch (e) {
                // Ignore gamepad errors
            }
        }
    }

    /**
     * Gunshot feedback vibration (recoil impulse & screen kick)
     */
    function triggerShotFeedback() {
        // Immediate snappy recoil vibration kick
        triggerTactileVibration([45], 60, 0.4, 0.9);

        // Native tactile haptic impact kick for maximum physical sensation on mobile
        const haptics = window.Capacitor?.Plugins?.Haptics;
        if (haptics && typeof haptics.impact === 'function') {
            try {
                haptics.impact({ style: 'HEAVY' });
            } catch (e) {}
        }

        // Visual screen recoil vibration shake
        if (aimingArea) {
            aimingArea.style.transform = `translate(${(Math.random() - 0.5) * 6}px, ${-4 - Math.random() * 4}px)`;
            setTimeout(() => {
                if (aimingArea) aimingArea.style.transform = '';
            }, 60);
        }
    }

    /**
     * Target hit feedback vibration (bullet impact & target shudder)
     */
    function triggerHitFeedback(hitScore) {
        if (hitScore <= 0) return;

        // Slight bullet flight delay (75ms) for realistic ballistics & non-overlapping haptic feedback
        setTimeout(() => {
            const haptics = window.Capacitor?.Plugins?.Haptics;

            // Tactile vibration depending on hit precision
            if (hitScore === 10) {
                // Bullseye / Headshot / Heart: double-pulse high impact confirmation
                triggerTactileVibration([60, 35, 55], 120, 0.8, 1.0);
                if (haptics && typeof haptics.notification === 'function') {
                    try {
                        haptics.notification({ type: 'SUCCESS' });
                    } catch (e) {}
                }
            } else if (hitScore >= 7) {
                // Solid center / torso hit
                triggerTactileVibration([50], 80, 0.5, 0.7);
                if (haptics && typeof haptics.impact === 'function') {
                    try {
                        haptics.impact({ style: 'MEDIUM' });
                    } catch (e) {}
                }
            } else {
                // Outer body / Arm hit
                triggerTactileVibration([30], 50, 0.3, 0.5);
                if (haptics && typeof haptics.impact === 'function') {
                    try {
                        haptics.impact({ style: 'LIGHT' });
                    } catch (e) {}
                }
            }

            // Visual target impact vibration shudder
            if (targetHuman) {
                const shakeX = (Math.random() - 0.5) * 6;
                const shakeY = (Math.random() - 0.5) * 4;
                targetHuman.style.transition = 'transform 0.05s ease-out';
                targetHuman.style.transform = `translate(${shakeX}px, ${shakeY}px) scale(0.98)`;
                setTimeout(() => {
                    if (targetHuman) {
                        targetHuman.style.transition = '';
                        targetHuman.style.transform = '';
                    }
                }, 90);
            }
        }, 75);
    }

    function fireShot() {
        if (!isAiming || currentRound >= maxRounds) return;

        const isDesktop = window.innerWidth >= 768;

        if (!isSteadyAiming) {
            recoilY -= (isDesktop ? 14 : 10) + Math.random() * 4;
            recoilX += (Math.random() - 0.5) * (isDesktop ? 8 : 12);
        }

        // Firing recoil vibration feedback (Tactile haptics & visual recoil)
        triggerShotFeedback();

        triggerFlash(true, 'bg-yellow-200/50');

        // --- Hit Calculation on Human Silhouette Target (E型人形靶) ---
        const dxHead = cx - 50;
        const dyHead = cy - 30;
        const distHead = Math.sqrt(dxHead * dxHead + dyHead * dyHead);

        const dxChest = cx - 50;
        const dyChest = cy - 50;
        const distChest = Math.sqrt(dxChest * dxChest + dyChest * dyChest);

        let roundScore = 0;
        let ringText = '脫靶';
        let textColor = 'text-red-500';

        if (distChest < 4.0 || distHead < 3.5) {
            roundScore = 10;
            ringText = distHead < 3.5 ? '爆頭 10 分' : '心臟 10 分';
            textColor = 'text-yellow-400';
        } else if (distChest < 8.0 || distHead < 6.5) {
            roundScore = 9;
            ringText = '胸口 9 分';
            textColor = 'text-green-400';
        } else if (distChest < 12.0) {
            roundScore = 8;
            ringText = '軀幹 8 分';
            textColor = 'text-lime-400';
        } else if (distChest < 16.0 || (Math.abs(dxChest) < 14 && cy >= 20 && cy <= 75)) {
            roundScore = 7;
            ringText = '身體 7 分';
            textColor = 'text-stone-300';
        } else if (Math.abs(dxChest) < 18 && cy >= 10 && cy <= 82) {
            roundScore = 6;
            ringText = '手臂 6 分';
            textColor = 'text-stone-400';
        } else if (Math.abs(dxChest) < 22 && cy >= 10 && cy <= 88) {
            roundScore = 0;
            ringText = '擦邊 0 分';
            textColor = 'text-stone-500';
        }

        // Target hit vibration feedback (Tactile impact & target shudder)
        triggerHitFeedback(roundScore);

        score += roundScore;
        if (scoreDisplay) scoreDisplay.textContent = score;
        currentRound++;
        updateRoundsDisplay();

        showFloatingText(`${ringText} (+${roundScore})`, textColor, cx, cy);

        // Bullet Hole
        if (targetArea) {
            const hole = document.createElement('div');
            hole.className = 'absolute w-3 h-3 md:w-4 md:h-4 bg-stone-950 rounded-full border border-amber-500/80 shadow-[0_0_4px_rgba(245,158,11,1)] z-20';
            hole.style.left = `${cx}%`;
            hole.style.top = `${cy}%`;
            hole.style.transform = 'translate(-50%, -50%)';
            targetArea.appendChild(hole);
        }

        if (currentRound >= maxRounds) {
            isAiming = false;
            stopTimer();
            setTimeout(() => {
                endGame();
            }, 1200);
        }
    }

    function showFloatingText(text, colorClass, pctX, pctY) {
        if (!targetArea) return;
        const floatText = document.createElement('div');
        floatText.textContent = text;
        floatText.className = `absolute font-bold text-xl md:text-3xl pointer-events-none z-30 shadow-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${colorClass}`;
        floatText.style.left = `${pctX}%`;
        floatText.style.top = `${pctY}%`;
        floatText.style.transform = 'translate(-50%, -100%)';
        floatText.style.transition = 'all 1.5s cubic-bezier(0.165, 0.84, 0.44, 1)';
        targetArea.appendChild(floatText);

        requestAnimationFrame(() => {
            floatText.style.transform = 'translate(-50%, -250%)';
            floatText.style.opacity = '0';
        });

        setTimeout(() => floatText.remove(), 1500);
    }

    function updateRoundsDisplay() {
        if (roundsDisplay) roundsDisplay.textContent = `${currentRound}/${maxRounds}`;
    }

    function triggerFlash(show, bgClass = 'bg-yellow-200/50') {
        if (!flash) return;
        flash.className = `absolute inset-0 z-40 pointer-events-none mix-blend-overlay ${bgClass}`;
        flash.classList.remove('hidden');
        setTimeout(() => {
            flash.classList.add('hidden');
        }, 60);
    }

    function endGame() {
        clearInterval(aimInterval);
        stopTimer();
        if (steadyAimTimer) {
            clearInterval(steadyAimTimer);
            steadyAimTimer = null;
        }

        if (endScreen) endScreen.classList.remove('hidden');
        if (finalScoreDisplay) finalScoreDisplay.textContent = score;

        let rank = '';
        let rankClass = '';
        if (score >= 54) {
            rank = '神槍手 (特優)';
            rankClass = 'text-yellow-400';
        } else if (score >= 42) {
            rank = '合格射手 (優良)';
            rankClass = 'text-green-400';
        } else if (score >= 30) {
            rank = '菜鳥射手 (及格)';
            rankClass = 'text-stone-300';
        } else {
            rank = '天兵 (不及格)';
            rankClass = 'text-red-500';
        }

        if (score >= 30) {
            toggleJourneyTask('t2_2', true);
        }

        if (rankDisplay) {
            rankDisplay.textContent = `評等：${rank}`;
            rankDisplay.className = `text-xl font-bold mb-6 bg-stone-950 py-2.5 rounded-lg border border-stone-800 w-full ${rankClass}`;
        }
    }
}
