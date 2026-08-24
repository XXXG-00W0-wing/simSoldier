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

    // Virtual Joystick & Steady Aim Elements
    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');
    const steadyAimBadge = document.getElementById('steady-aim-badge');
    const textMobileAim = document.getElementById('text-mobile-aim');

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

        // Joystick movement logic for mobile
        if (!isDesktop) {
            if (Math.abs(joystickVectorX) > 0.05 || Math.abs(joystickVectorY) > 0.05) {
                baseX += joystickVectorX * 1.6;
                baseY += joystickVectorY * 1.6;
                baseX = Math.max(10, Math.min(90, baseX));
                baseY = Math.max(10, Math.min(90, baseY));
            }
        } else {
            baseX += (mousePctX - baseX) * 0.15;
            baseY += (mousePctY - baseY) * 0.15;
        }

        // Sway amplitude: 0 when isSteadyAiming
        let speed = (isHoldingBreath || isSteadyAiming) ? 0.1 : 1.8;
        let amplitudeX = isSteadyAiming ? 0 : ((isHoldingBreath ? 0.8 : (isDesktop ? 5 : 12)));
        let amplitudeY = isSteadyAiming ? 0 : ((isHoldingBreath ? 0.8 : (isDesktop ? 3.5 : 8)));

        const swayX = Math.sin(timeElapsed * speed * 1.9) * amplitudeX + Math.cos(timeElapsed * speed * 1.1) * (amplitudeX * 0.4);
        const swayY = Math.cos(timeElapsed * speed * 1.6) * amplitudeY + Math.sin(timeElapsed * speed * 0.8) * (amplitudeY * 0.4);

        cx = baseX + swayX + (isSteadyAiming ? 0 : recoilX);
        cy = baseY + swayY + (isSteadyAiming ? 0 : recoilY);

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

    function fireShot() {
        if (!isAiming || currentRound >= maxRounds) return;

        const isDesktop = window.innerWidth >= 768;

        if (!isSteadyAiming) {
            recoilY -= (isDesktop ? 14 : 10) + Math.random() * 4;
            recoilX += (Math.random() - 0.5) * (isDesktop ? 8 : 12);
        }

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
            roundScore = 5;
            ringText = '擦邊 5 分';
            textColor = 'text-stone-500';
        }

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
