/**
 * AI Pose Detection – Multi-Exercise Training Session
 * Exercises: Squat → Push-up → Crunch (3 in total)
 * DB upload happens only after all 3 are completed.
 */

import { api } from './api.js';

// ── Exercise catalogue ──────────────────────────────────────────────────────
const EXERCISES = [
    {
        key: 'squats',
        name: '徒手深蹲 (Squats)',
        targetReps: 10,
        viewHint: '💡 正面或側面朝向鏡頭，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '下蹲至大腿約平行地面', '完全站直完成一次'],
        type: 'squat',
        guideImage: 'assets/images/training/squat_guide.png'
    },
    {
        key: 'pushups',
        name: '伏地挺身 (Push-ups)',
        targetReps: 10,
        viewHint: '💡 側面朝向鏡頭，手臂與上半身入鏡',
        rules: ['偵測到手臂與軀幹', '手肘彎曲下壓', '完全推起完成一次'],
        type: 'pushup',
        guideImage: 'assets/images/training/push_up_guide.png'
    },
    {
        key: 'legraise',
        name: '平躺抬腿 (Leg Raise)',
        targetReps: 10,
        viewHint: '💡 側面平躺，雙腿伸直朝上抬，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '雙腳伸直抬高至約90° (偵測中)', '穩住核心，慢慢放腳回原位計一次'],
        type: 'legraise',
        guideImage: 'assets/images/training/leg_raise_guide.png'
    },
    {
        key: 'jumpingjacks',
        name: '開合跳 (Jumping Jacks)',
        targetReps: 10,
        viewHint: '💡 正面朝向鏡頭，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '雙手舉過頭頂且雙腳張開大於肩寬', '雙手下放且雙腳併攏計一次'],
        type: 'jumpingjacks',
        guideImage: 'assets/images/training/jumping_jacks_guide.png'
    },
    {
        key: 'lunges',
        name: '弓箭步 (Lunges)',
        targetReps: 10,
        viewHint: '💡 側面朝向鏡頭，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '前腳膝角呈90度且後膝接近地面', '回到站立姿計一次'],
        type: 'lunges',
        guideImage: 'assets/images/training/lunges_guide.png'
    },
    {
        key: 'plank',
        name: '棒式 (Plank)',
        targetReps: 10,
        viewHint: '💡 側面朝向鏡頭，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '身體連線呈165°~180°', '每維持10秒計為一次 (共100秒)'],
        type: 'plank',
        guideImage: 'assets/images/training/plank_guide.png'
    },
    {
        key: 'bicepcurls',
        name: '二頭彎舉 (Bicep Curls)',
        targetReps: 10,
        viewHint: '💡 正面或側面朝向鏡頭，上半身入鏡',
        rules: ['偵測到上半身，手臂入鏡', '手肘彎曲小於45度', '手肘伸直大於150度計一次'],
        type: 'bicepcurls',
        guideImage: 'assets/images/training/bicep_curls_guide.png'
    },
    {
        key: 'lateralraise',
        name: '側平舉 (Lateral Raise)',
        targetReps: 10,
        viewHint: '💡 正面朝向鏡頭，上半身入鏡',
        rules: ['偵測到上半身，手臂入鏡', '雙臂側舉至與軀幹呈約80°~90°', '雙臂下放計一次'],
        type: 'lateralraise',
        guideImage: 'assets/images/training/lateral_raise_guide.png'
    },
    {
        key: 'crunches',
        name: '仰臥起坐 / 捲腹 (Crunches)',
        targetReps: 10,
        viewHint: '💡 側面朝向鏡頭，全身入鏡',
        rules: ['偵測到人體，全身入鏡', '軀幹抬起夾角小於60°', '躺平軀幹夾角大於120°計一次'],
        type: 'crunches',
        guideImage: 'assets/images/training/crunches_guide.png'
    }
];

// ── DOM cache ────────────────────────────────────────────────────────────────
const ui = {};

function initElements() {
    ui.canvas = document.getElementById('training-canvas');
    if (!ui.canvas) return false;
    ui.ctx = ui.canvas.getContext('2d');
    ui.video = document.getElementById('training-video');
    ui.cameraBtn = document.getElementById('btn-start-camera');
    ui.exerciseSelector = document.getElementById('exercise-selector');

    // Populate exercise selector
    if (ui.exerciseSelector) {
        ui.exerciseSelector.innerHTML = '';
        EXERCISES.forEach((ex, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = ex.name;
            ui.exerciseSelector.appendChild(option);
        });
    }

    ui.overlay = document.getElementById('training-overlay');
    ui.statusText = document.getElementById('ai-status-text');
    ui.exerciseName = document.getElementById('training-exercise-name');
    ui.stepLabel = document.getElementById('training-step-label');
    ui.repCount = document.getElementById('training-rep-count');
    ui.repTarget = document.getElementById('training-rep-target');
    ui.feedback = document.getElementById('training-feedback');
    ui.submitBtn = document.getElementById('btn-submit-training');
    ui.rule1 = document.getElementById('rule-1');
    ui.rule2 = document.getElementById('rule-2');
    ui.rule3 = document.getElementById('rule-3');
    ui.viewHint = document.getElementById('training-view-hint');
    ui.guideImage = document.getElementById('training-guide-image');
    ui.zoomBtn = document.getElementById('btn-zoom-guide');
    ui.canvasContainer = document.getElementById('training-canvas-container');
    ui.fullscreenCloseBtn = document.getElementById('btn-fullscreen-close');
    return true;
}

// ── Session / global state ───────────────────────────────────────────────────
let poseTracker = null;
let camera = null;
let isVideoMode = false;
let cameraRunning = false;

let currentExIdx = 0;          // 0=squat, 1=pushup, 2=crunch
let currentReps = 0;
let squatState = 'up';
let plankState = 'not_holding';
let plankAccumulatedTime = 0; // ms
let lastPlankTimestamp = 0;
let lastTransitionTime = 0;     // debounce: ms timestamp of last state change
const DEBOUNCE_DOWN_MS = 300;   // min ms to accept 'down' after 'up' (reduced to avoid dropping fast reps)
const DEBOUNCE_UP_MS = 400;   // min ms to accept 'up' (rep count) after 'down'
let repTimestamps = [];
let sessionToken = null;
let cameraStartTime = 0;        // 記錄相機開啟時間
const WARMUP_DELAY_MS = 3000;   // 倒數 3 秒 (毫秒)

// Accumulate results across exercises
const completedResults = [];    // [{session_token, exercise_type, reps, duration_seconds, rep_timestamps}, …]

// ── Helpers ──────────────────────────────────────────────────────────────────
function angle3(a, b, c) {
    const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let deg = Math.abs(r * 180 / Math.PI);
    return deg > 180 ? 360 - deg : deg;
}

function currentExercise() { return EXERCISES[currentExIdx]; }

// ── UI helpers ────────────────────────────────────────────────────────────────
function updateFeedback(msg, textCls = 'text-white', bgCls = 'bg-stone-800') {
    if (!ui.feedback) return;
    ui.feedback.textContent = msg;
    ui.feedback.className = `${textCls} font-bold ${bgCls} px-3 py-1 rounded transition-colors`;
}

function setRules(ex) {
    [ui.rule1, ui.rule2, ui.rule3].forEach((el, i) => {
        if (el) { el.textContent = ex.rules[i]; el.className = 'transition-colors text-stone-400'; }
    });
    if (ui.viewHint) ui.viewHint.textContent = ex.viewHint;
}

function setSubmitLocked(text = '訓練尚未完成') {
    ui.submitBtn.disabled = true;
    ui.submitBtn.innerHTML = `<span class="relative z-10 flex items-center justify-center gap-2"><i class="fa-solid fa-lock"></i> ${text}</span>`;
    ui.submitBtn.className = 'w-full py-4 rounded-xl font-bold text-stone-400 bg-stone-700 cursor-not-allowed transition-all duration-300';
}

function setSubmitNext(label) {
    ui.submitBtn.disabled = false;
    ui.submitBtn.innerHTML = `<span class="relative z-10 flex items-center justify-center gap-2"><i class="fa-solid fa-circle-check"></i> ${label} <i class="fa-solid fa-arrow-right"></i></span>`;
    ui.submitBtn.className = 'w-full py-4 rounded-xl font-bold text-white bg-green-600 cursor-pointer hover:bg-green-500 transition-all duration-300';
}

function setCameraActive(active) {
    if (active) {
        ui.cameraBtn.innerHTML = '<i class="fa-solid fa-video-slash mr-2"></i>關閉鏡頭';
        ui.cameraBtn.className = 'btn-primary bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2';
        if (window.innerWidth <= 768 && ui.canvasContainer) {
            ui.canvasContainer.classList.remove('relative', 'aspect-video', 'rounded');
            ui.canvasContainer.classList.add('fixed', 'inset-0', 'z-[9999]');
            if (ui.fullscreenCloseBtn) {
                ui.fullscreenCloseBtn.classList.remove('hidden');
                ui.fullscreenCloseBtn.classList.add('flex');
            }
        }
    } else {
        ui.cameraBtn.innerHTML = '<i class="fa-solid fa-video mr-2"></i>開啟鏡頭';
        ui.cameraBtn.className = 'btn-primary bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2';
        if (ui.canvasContainer) {
            ui.canvasContainer.classList.add('relative', 'aspect-video', 'rounded');
            ui.canvasContainer.classList.remove('fixed', 'inset-0', 'z-[9999]');
            if (ui.fullscreenCloseBtn) {
                ui.fullscreenCloseBtn.classList.add('hidden');
                ui.fullscreenCloseBtn.classList.remove('flex');
            }
        }
    }
}

function loadExerciseUI(idx) {
    const ex = EXERCISES[idx];
    if (ui.exerciseName) ui.exerciseName.textContent = ex.name;
    if (ui.stepLabel) ui.stepLabel.textContent = `第 ${idx + 1} / ${EXERCISES.length} 項`;
    if (ui.repCount) ui.repCount.textContent = '0';
    if (ui.repTarget) ui.repTarget.textContent = `/ ${ex.targetReps}`;
    setRules(ex);
    updateFeedback('請準備...', 'text-yellow-400', 'bg-yellow-900/30');
    setSubmitLocked();
    if (ui.guideImage && ex.guideImage) {
        ui.guideImage.src = ex.guideImage;
    }
}

function resetExerciseState() {
    currentReps = 0;
    squatState = 'up';
    plankState = 'not_holding';
    plankAccumulatedTime = 0;
    lastPlankTimestamp = 0;
    repTimestamps = [];
    sessionToken = null;
    if (ui.repCount) ui.repCount.textContent = '0';
    [ui.rule1, ui.rule2, ui.rule3].forEach(el => { if (el) el.className = 'transition-colors text-stone-400'; });
    updateFeedback('請準備...', 'text-yellow-400', 'bg-yellow-900/30');
    setSubmitLocked();
}

// ── Backend session ──────────────────────────────────────────────────────────
async function startSession() {
    try {
        const data = await api.startTraining();
        sessionToken = data.session_token;
        console.log('Session started:', sessionToken);
        return true;
    } catch (e) {
        console.error(e);
        updateFeedback('無法連線到伺服器（將繼續本地記錄）', 'text-orange-400', 'bg-orange-900/30');
        return false; // continue without session
    }
}

// ── MediaPipe system ─────────────────────────────────────────────────────────
async function prepareSystem() {
    await startSession();          // Get session token (non-blocking fail ok)
    ui.overlay.classList.add('hidden');
    if (poseTracker) return;

    updateFeedback('載入 AI 模型中...', 'text-blue-400', 'bg-blue-900/30');

    // 優先檢查是否在 APK (Capacitor) 環境或已載入本機 vendor 資源
    const isLocalBundle = !!document.querySelector('script[src*="vendor/mediapipe"]') ||
                          (typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
                          (window.location.origin === 'http://localhost' && !window.location.port);
    const mediapipePoseBase = window.__MEDIAPIPE_BASE_PATH__ ||
                              (isLocalBundle ? 'vendor/mediapipe/pose/' : 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/');

    poseTracker = new Pose({
        locateFile: file => `${mediapipePoseBase}${file}`
    });
    poseTracker.setOptions({
        modelComplexity: 0, // 改為 0 以大幅提升畫面偵數 (FPS)
        smoothLandmarks: true,
        enableSegmentation: false, smoothSegmentation: false,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
    });
    poseTracker.onResults(onResults);
    await poseTracker.initialize();

    // 暖機 (Warm-up) 模型：避免第一次處理影像時卡頓太久導致錯過影片開頭
    try {
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 64; dummyCanvas.height = 64;
        await poseTracker.send({ image: dummyCanvas });
    } catch (e) {
        console.warn('Warmup skipped:', e);
    }

    updateFeedback('模型就緒，開始偵測', 'text-green-400', 'bg-green-900/30');
}

// ── Pose callback ─────────────────────────────────────────────────────────────
function onResults(results) {
    if (!ui.ctx) return;

    // Prevent squashing by matching canvas internal resolution to video source aspect ratio
    if (results.image && results.image.width && results.image.height) {
        if (ui.canvas.width !== results.image.width || ui.canvas.height !== results.image.height) {
            ui.canvas.width = results.image.width;
            ui.canvas.height = results.image.height;
        }
    }

    const w = ui.canvas.width, h = ui.canvas.height;
    ui.ctx.save();
    ui.ctx.clearRect(0, 0, w, h);

    // 水平鏡像繪製視訊背景與骨架
    if (!isVideoMode) { ui.ctx.translate(w, 0); ui.ctx.scale(-1, 1); }
    ui.ctx.drawImage(results.image, 0, 0, w, h);

    if (results.poseLandmarks) {
        // 在攝影機模式或測試影片模式下皆繪製訓練用骨架
        if (isVideoMode || (!window.RhythmGame || (!window.RhythmGame.isPreview && !window.RhythmGame.isActive))) {
            drawConnectors(ui.ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
            drawLandmarks(ui.ctx, results.poseLandmarks, { color: '#FF4444', lineWidth: 2, radius: 4 });
        }
        // 配合模擬軍旅：在預備畫面中顯示骨架
        if (window.RhythmGame && window.RhythmGame.isPreview) {
            drawConnectors(ui.ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#4ade80', lineWidth: 3 }); // 綠色骨架
            drawLandmarks(ui.ctx, results.poseLandmarks, { color: '#ffffff', lineWidth: 2, radius: 4 });
        }
    }

    // 恢復畫布正向座標系，以便正常繪製倒數與 HUD 文字
    ui.ctx.restore();

    // 確保收到第一個畫格時才開始倒數計時
    if (!cameraStartTime) {
        cameraStartTime = Date.now();
    }

    const ex = currentExercise();
    const elapsed = Date.now() - cameraStartTime;

    // 檢查是否仍在 3 秒倒數緩衝期
    if (elapsed < WARMUP_DELAY_MS) {
        const remainingSec = Math.ceil((WARMUP_DELAY_MS - elapsed) / 1000);
        const secProgress = (elapsed % 1000) / 1000;
        // 在鏡頭顯示處中央繪製 3、2、1 倒數
        drawCountdown(w, h, `${remainingSec}`, '請就位', secProgress);
        updateFeedback(`請就位，${remainingSec} 秒後開始計數...`, 'text-yellow-400', 'bg-yellow-900/40');
    } else if (elapsed < WARMUP_DELAY_MS + 600) {
        // 倒數結束瞬間短暫顯示「開始！」
        drawCountdown(w, h, '開始！', '', 1);
        updateFeedback('開始動作！', 'text-green-400', 'bg-green-900/30');
    } else {
        // 超過倒數時間後開始分析動作與計數
        if (results.poseLandmarks && currentReps < ex.targetReps) {
            analyzeExercise(results.poseLandmarks, ex.type);
        }
    }

    // 只有非模擬軍旅模式才顯示普通的訓練 HUD
    if (!window.RhythmGame || (!window.RhythmGame.isPreview && !window.RhythmGame.isActive)) {
        drawHUD(w, h, ex.targetReps);
    }

    // 新增：將骨架資料與 Canvas Context 傳遞給模擬軍旅引擎
    if (results.poseLandmarks && window.RhythmGame && (window.RhythmGame.isActive || window.RhythmGame.isPreview)) {
        window.RhythmGame.processPose(results.poseLandmarks, ui.ctx);
    }
}

// ── Countdown Overlay (鏡頭中央 3、2、1 倒數) ────────────────────────────────
function drawCountdown(w, h, text, subtext = '請就位', progress = 0) {
    const cx = w / 2, cy = h / 2;
    const isNumber = !isNaN(Number(text));
    const r = Math.min(w, h) * 0.18;

    ui.ctx.save();

    // 半透明深色圓形底板
    ui.ctx.beginPath();
    ui.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ui.ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ui.ctx.fill();

    // 外環軌道底線
    ui.ctx.lineWidth = Math.max(4, Math.round(r * 0.08));
    ui.ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ui.ctx.stroke();

    // 動態倒數光環
    if (isNumber) {
        ui.ctx.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (1 - progress) * Math.PI * 2;
        ui.ctx.arc(cx, cy, r, startAngle, endAngle);
        ui.ctx.strokeStyle = '#facc15';
        ui.ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
        ui.ctx.shadowBlur = 15;
        ui.ctx.stroke();
    } else {
        ui.ctx.beginPath();
        ui.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ui.ctx.strokeStyle = '#22c55e';
        ui.ctx.shadowColor = 'rgba(34, 197, 94, 0.9)';
        ui.ctx.shadowBlur = 20;
        ui.ctx.stroke();
    }

    // 倒數主文字 (3, 2, 1 或 開始！)
    ui.ctx.textAlign = 'center';
    ui.ctx.textBaseline = 'middle';
    ui.ctx.fillStyle = isNumber ? '#facc15' : '#22c55e';
    ui.ctx.shadowColor = isNumber ? 'rgba(250, 204, 21, 0.9)' : 'rgba(34, 197, 94, 0.9)';
    ui.ctx.shadowBlur = 15;

    if (isNumber) {
        ui.ctx.font = `900 ${Math.round(r * 1.05)}px sans-serif`;
        ui.ctx.fillText(text, cx, subtext ? cy - r * 0.15 : cy);
    } else {
        ui.ctx.font = `900 ${Math.round(r * 0.55)}px sans-serif`;
        ui.ctx.fillText(text, cx, cy);
    }

    // 說明文字 (例如 "請就位")
    if (subtext) {
        ui.ctx.shadowBlur = 0;
        ui.ctx.font = `bold ${Math.round(r * 0.22)}px sans-serif`;
        ui.ctx.fillStyle = '#f1f5f9';
        ui.ctx.fillText(subtext, cx, cy + r * 0.52);
    }

    ui.ctx.restore();
}

// ── HUD overlay ──────────────────────────────────────────────────────────────
function drawHUD(w, h, target) {
    const pad = 12, boxW = 100, boxH = 62, x = w - boxW - pad, y = pad;
    ui.ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ui.ctx, x, y, boxW, boxH, 10); ui.ctx.fill();
    ui.ctx.font = 'bold 11px sans-serif'; ui.ctx.fillStyle = '#9ca3af'; ui.ctx.textAlign = 'center';
    ui.ctx.fillText('完成次數', x + boxW / 2, y + 16);
    ui.ctx.font = 'bold 30px sans-serif';
    ui.ctx.fillStyle = currentReps >= target ? '#22c55e' : '#ffffff';
    ui.ctx.fillText(`${currentReps} / ${target}`, x + boxW / 2, y + 52);
}
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

// ── Exercise Analyzer Dispatcher
function analyzeExercise(lm, type) {
    switch (type) {
        case 'squat': detectSquat(lm); break;
        case 'pushup': detectPushup(lm); break;
        case 'legraise': detectLegRaise(lm); break;
        case 'jumpingjacks': detectJumpingJacks(lm); break;
        case 'lunges': detectLunges(lm); break;
        case 'plank': detectPlank(lm); break;
        case 'bicepcurls': detectBicepCurls(lm); break;
        case 'lateralraise': detectLateralRaise(lm); break;
        case 'crunches': detectCrunches(lm); break;
    }
}

// Shared state machine with debounce
function repStateMachine(isDown, isUp) {
    const now = Date.now();
    if (isDown && squatState === 'up' && (now - lastTransitionTime) > DEBOUNCE_DOWN_MS) {
        squatState = 'down';
        lastTransitionTime = now;
        if (ui.rule2) ui.rule2.className = 'transition-colors text-green-400';
        updateFeedback('很好！恢復原位', 'text-green-400', 'bg-green-900/30');
    } else if (isUp && squatState === 'down' && (now - lastTransitionTime) > DEBOUNCE_UP_MS) {
        squatState = 'up';
        lastTransitionTime = now;
        currentReps++;
        if (ui.repCount) ui.repCount.textContent = currentReps;
        repTimestamps.push(now);
        if (ui.rule3) ui.rule3.className = 'transition-colors text-green-400';
        setTimeout(() => {
            if (ui.rule2) ui.rule2.className = 'transition-colors text-stone-400';
            if (ui.rule3) ui.rule3.className = 'transition-colors text-stone-400';
        }, 600);
        checkCompletion();
    } else if (squatState === 'up') {
        updateFeedback('開始動作', 'text-yellow-400', 'bg-yellow-900/30');
    }
}

// ── Time state machine for time-based exercises (Plank) ──────────────────────
function timeStateMachine(isHolding) {
    const now = Date.now();
    if (isHolding) {
        if (plankState === 'not_holding') {
            plankState = 'holding';
            lastPlankTimestamp = now;
            updateFeedback('很好！保持住！', 'text-green-400', 'bg-green-900/30');
            if (ui.rule2) ui.rule2.className = 'transition-colors text-green-400';
        } else {
            const delta = now - lastPlankTimestamp;
            plankAccumulatedTime += delta;
            lastPlankTimestamp = now;

            // 10 seconds = 1 rep
            const newReps = Math.floor(plankAccumulatedTime / 10000);
            if (newReps > currentReps) {
                currentReps = newReps;
                if (ui.repCount) ui.repCount.textContent = currentReps;
                repTimestamps.push(now);
                if (ui.rule3) ui.rule3.className = 'transition-colors text-green-400';
                setTimeout(() => {
                    if (ui.rule3) ui.rule3.className = 'transition-colors text-stone-400';
                }, 600);
                checkCompletion();
            }
        }
    } else {
        if (plankState === 'holding') {
            plankState = 'not_holding';
            updateFeedback('姿勢偏離！請打直身體', 'text-red-400', 'bg-red-900/30');
            if (ui.rule2) ui.rule2.className = 'transition-colors text-stone-400';
        } else {
            updateFeedback('請維持標準姿勢', 'text-yellow-400', 'bg-yellow-900/30');
        }
    }
}

// ── Squat (front or side) ────────────────────────────────────────────────────────
function detectSquat(lm) {
    const lH = lm[23], lK = lm[25], lA = lm[27], rH = lm[24], rK = lm[26], rA = lm[28];
    const sideOk = (lH.visibility > 0.5 && lK.visibility > 0.5 && lA.visibility > 0.5) ||
        (rH.visibility > 0.5 && rK.visibility > 0.5 && rA.visibility > 0.5);
    const frontOk = lK.visibility > 0.4 && rK.visibility > 0.4 && lH.visibility > 0.4 && rH.visibility > 0.4;
    if (!sideOk && !frontOk) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    let inDown, inUp;
    if (sideOk) {
        const angles = [];
        if (lH.visibility > 0.5 && lK.visibility > 0.5 && lA.visibility > 0.5) angles.push(angle3(lH, lK, lA));
        if (rH.visibility > 0.5 && rK.visibility > 0.5 && rA.visibility > 0.5) angles.push(angle3(rH, rK, rA));
        if (!angles.length) return;
        const avg = angles.reduce((a, b) => a + b, 0) / angles.length;
        inDown = avg < 100; inUp = avg > 155;
    } else {
        const d = ((lm[25].y + lm[26].y) / 2) - ((lm[23].y + lm[24].y) / 2);
        // Relaxed front-view thresholds: easier to hit the 'down' state (0.18 instead of 0.22)
        // and 'up' state (0.28 instead of 0.32)
        inDown = d < 0.18; inUp = d > 0.28;
    }
    repStateMachine(inDown, inUp);
}

// ── Push-up (side view: elbow angle) ────────────────────────────────────────
function detectPushup(lm) {
    const lS = lm[11], lE = lm[13], lW = lm[15], lH = lm[23], lK = lm[25], lA = lm[27];
    const rS = lm[12], rE = lm[14], rW = lm[16], rH = lm[24], rK = lm[26], rA = lm[28];

    // 檢查側身手臂主要關節點的置信度 (放寬門檻至 0.35；腳踝設為可選，不強制入鏡)
    const lArmOk = lS.visibility > 0.35 && lE.visibility > 0.35 && lW.visibility > 0.35;
    const rArmOk = rS.visibility > 0.35 && rE.visibility > 0.35 && rW.visibility > 0.35;

    if (!lArmOk && !rArmOk) {
        updateFeedback('請將側面手臂與上半身入鏡', 'text-yellow-400', 'bg-yellow-900/30');
        return;
    }
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    // 選擇手臂置信度較高的一側
    const lScore = lS.visibility + lE.visibility + lW.visibility + (lH.visibility || 0);
    const rScore = rS.visibility + rE.visibility + rW.visibility + (rH.visibility || 0);
    const useLeft = lArmOk && (!rArmOk || lScore >= rScore);

    const [S, E, W, H, K, A] = useLeft
        ? [lS, lE, lW, lH, lK, lA]
        : [rS, rE, rW, rH, rK, rA];

    // 1. 如果臀部可見，判斷軀幹是否大致呈俯臥水平
    if (H && H.visibility > 0.3) {
        const torsoDx = Math.abs(H.x - S.x);
        const torsoDy = Math.abs(H.y - S.y);
        const torsoAngleToGround = Math.atan2(torsoDy, torsoDx) * (180 / Math.PI); // 0°=完全水平, 90°=垂直站立

        // 放寬趴姿角度判定 (小於 65° 均算水平趴姿，避免相機角度仰俯誤差)
        if (torsoAngleToGround > 65) {
            updateFeedback('請保持水平俯臥姿態', 'text-orange-400', 'bg-orange-900/30');
            return;
        }

        // 2. 腳踝/膝蓋可選：若有照到則輔助判定身體直線，未照到則不強制 (可有可無)
        let isBodyStraight = true;
        if (A && A.visibility > 0.35) {
            const bodyLineAngle = angle3(S, H, A);
            isBodyStraight = bodyLineAngle > 125 && bodyLineAngle < 235;
        } else if (K && K.visibility > 0.35) {
            const bodyLineAngle = angle3(S, H, K);
            isBodyStraight = bodyLineAngle > 120 && bodyLineAngle < 240;
        }

        if (!isBodyStraight) {
            updateFeedback('請盡量打直身體', 'text-orange-400', 'bg-orange-900/30');
            return;
        }
    }

    // 3. 通過水平驗證後，判定手肘屈伸 (放寬條件：下壓手肘 < 100°，推起伸直 > 140°)
    const elbowAngle = angle3(S, E, W);
    repStateMachine(elbowAngle < 100, elbowAngle > 140);
}

// ── Lying Leg Raise (side view: ankle Y rise above hip Y) ────────────────
// Very stable: when lying flat, ankle ≈ hip Y. When raising, ankle goes ABOVE hip.
function detectLegRaise(lm) {
    const lHi = lm[23], lAn = lm[27];
    const rHi = lm[24], rAn = lm[28];
    const lOk = lHi.visibility > 0.5 && lAn.visibility > 0.5;
    const rOk = rHi.visibility > 0.5 && rAn.visibility > 0.5;
    if (!lOk && !rOk) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    // hipY - ankleY (normalized, 0=top): positive ⇒ ankles are higher than hips (legs raised)
    const hiY = ((lOk ? lHi.y : 0) + (rOk ? rHi.y : 0)) / (lOk && rOk ? 2 : 1);
    const anY = ((lOk ? lAn.y : 0) + (rOk ? rAn.y : 0)) / (lOk && rOk ? 2 : 1);
    const delta = hiY - anY;

    // Raised (“down” state in state machine): delta > 0.35: ankles significantly above hips
    // Flat (“up” / rest state): delta < 0.1
    repStateMachine(delta > 0.35, delta < 0.1);
}

// ── Jumping Jacks ────────────────────────────────────────────────────────────
function detectJumpingJacks(lm) {
    const lW = lm[15], rW = lm[16];
    const lA = lm[27], rA = lm[28];
    const lS = lm[11], rS = lm[12];
    if (lW.visibility < 0.5 || rW.visibility < 0.5 || lA.visibility < 0.5 || rA.visibility < 0.5) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    // Hands above shoulders (Y is smaller) and feet apart (distance large)
    const handsUp = lW.y < lS.y && rW.y < rS.y;
    // Normalized distance between ankles
    const feetDist = Math.abs(lA.x - rA.x);
    const feetApart = feetDist > 0.15;

    const handsDown = lW.y > lS.y && rW.y > rS.y;
    const feetTogether = feetDist < 0.1;

    repStateMachine(handsUp && feetApart, handsDown && feetTogether);
}

// ── Lunges ───────────────────────────────────────────────────────────────────
function detectLunges(lm) {
    const lH = lm[23], lK = lm[25], lA = lm[27];
    const rH = lm[24], rK = lm[26], rA = lm[28];
    const sideOk = (lH.visibility > 0.5 && lK.visibility > 0.5 && lA.visibility > 0.5) ||
        (rH.visibility > 0.5 && rK.visibility > 0.5 && rA.visibility > 0.5);
    if (!sideOk) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    const lAngle = angle3(lH, lK, lA);
    const rAngle = angle3(rH, rK, rA);

    const isUp = lAngle > 150 && rAngle > 150;
    const isDown = (lAngle < 110 && rAngle < 120) || (rAngle < 110 && lAngle < 120);

    repStateMachine(isDown, isUp);
}

// ── Plank ────────────────────────────────────────────────────────────────────
function detectPlank(lm) {
    const lS = lm[11], lH = lm[23], lA = lm[27];
    const rS = lm[12], rH = lm[24], rA = lm[28];

    const useLeft = (lS.visibility + lH.visibility + lA.visibility) > (rS.visibility + rH.visibility + rA.visibility);
    const [S, H, A] = useLeft ? [lS, lH, lA] : [rS, rH, rA];

    if (S.visibility < 0.5 || H.visibility < 0.5 || A.visibility < 0.5) {
        timeStateMachine(false);
        return;
    }
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    const bodyAngle = angle3(S, H, A);
    const isHolding = bodyAngle > 155 && bodyAngle < 190;

    timeStateMachine(isHolding);
}

// ── Bicep Curls ──────────────────────────────────────────────────────────────
function detectBicepCurls(lm) {
    const lS = lm[11], lE = lm[13], lW = lm[15];
    const rS = lm[12], rE = lm[14], rW = lm[16];

    const useLeft = (lS.visibility + lE.visibility + lW.visibility) > (rS.visibility + rE.visibility + rW.visibility);
    const [S, E, W] = useLeft ? [lS, lE, lW] : [rS, rE, rW];

    if (S.visibility < 0.5 || E.visibility < 0.5 || W.visibility < 0.5) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    const elbowAngle = angle3(S, E, W);

    const isUp = elbowAngle > 140;
    const isDown = elbowAngle < 60;

    repStateMachine(isDown, isUp);
}

// ── Lateral Raise ────────────────────────────────────────────────────────────
function detectLateralRaise(lm) {
    const lS = lm[11], lE = lm[13], lH = lm[23];
    const rS = lm[12], rE = lm[14], rH = lm[24];

    if (lS.visibility < 0.5 || lE.visibility < 0.5 || lH.visibility < 0.5 ||
        rS.visibility < 0.5 || rE.visibility < 0.5 || rH.visibility < 0.5) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    const lAngle = angle3(lH, lS, lE);
    const rAngle = angle3(rH, rS, rE);

    const isDown = lAngle > 75 && rAngle > 75;
    const isUp = lAngle < 35 && rAngle < 35;

    repStateMachine(isDown, isUp);
}

// ── Crunches ─────────────────────────────────────────────────────────────────
function detectCrunches(lm) {
    const lS = lm[11], lH = lm[23], lK = lm[25];
    const rS = lm[12], rH = lm[24], rK = lm[26];

    const useLeft = (lS.visibility + lH.visibility + lK.visibility) > (rS.visibility + rH.visibility + rK.visibility);
    const [S, H, K] = useLeft ? [lS, lH, lK] : [rS, rH, rK];

    if (S.visibility < 0.5 || H.visibility < 0.5 || K.visibility < 0.5) return;
    if (ui.rule1) ui.rule1.className = 'transition-colors text-green-400';

    const torsoAngle = angle3(S, H, K);

    const isDown = torsoAngle < 75;
    const isUp = torsoAngle > 110;

    repStateMachine(isDown, isUp);
}

// ── Completion logic ─────────────────────────────────────────────────────────
function checkCompletion() {
    const ex = currentExercise();
    if (currentReps < ex.targetReps) return;

    const isLast = currentExIdx === EXERCISES.length - 1;
    updateFeedback(`已完成 ${ex.targetReps} 下${ex.name}！`, 'text-green-400', 'bg-green-900/30');
    // Camera intentionally kept running so user can continue to next exercise without restarting

    // Save this exercise's result (do NOT stop camera)
    const dur = repTimestamps.length > 1
        ? Math.round((repTimestamps[repTimestamps.length - 1] - repTimestamps[0]) / 1000) : 1;
    completedResults.push({
        session_token: sessionToken,
        exercise_type: ex.key,
        reps: currentReps,
        duration_seconds: dur,
        rep_timestamps: [...repTimestamps]
    });
    // Note: camera keeps running so user doesn't need to restart it for the next exercise

    if (isLast) {
        setSubmitNext('上傳全部成績並完成');
    } else {
        setSubmitNext(`前往第 ${currentExIdx + 2} 項：${EXERCISES[currentExIdx + 1].name}`);
    }
}

// ── Retry current exercise ───────────────────────────────────────────────────
function retryExercise() {
    resetExerciseState();
    loadExerciseUI(currentExIdx);
    cameraStartTime = Date.now(); // 重設 3 秒倒數
    if (isVideoMode) {
        isVideoMode = false;
        ui.video.pause(); ui.video.src = '';
        ui.overlay.classList.remove('hidden');
    }
}

// ── Advance to next exercise (no reload) ─────────────────────────────────────
async function advanceOrSubmit() {
    if (currentReps < currentExercise().targetReps) return;

    const isLast = currentExIdx === EXERCISES.length - 1;

    if (isLast) {
        await submitAllResults();
    } else {
        // Move to next exercise — camera keeps running
        currentExIdx++;
        resetExerciseState();
        loadExerciseUI(currentExIdx);
        cameraStartTime = Date.now(); // 下一動作重新倒數 3 秒就位
        await startSession();   // fresh token for next exercise

        // Stop video if active (camera stays on)
        if (isVideoMode) {
            isVideoMode = false;
            ui.video.pause(); ui.video.src = '';
            ui.overlay.classList.remove('hidden');
        }
    }
}

// ── Submit all completed exercises to DB ─────────────────────────────────────
async function submitAllResults() {
    ui.submitBtn.disabled = true;
    ui.submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 上傳中...';

    for (const result of completedResults) {
        if (!result.session_token) continue;
        try {
            await api.completeTraining(result);
        } catch (e) {
            console.error('Upload failed for', result.exercise_type, e);
        }
    }

    // Stop camera
    if (ui.video) {
        ui.video.pause();
        if (ui.video.srcObject) {
            ui.video.srcObject.getTracks().forEach(track => track.stop());
            ui.video.srcObject = null;
        }
        ui.video.src = '';
        ui.video.removeAttribute('src');
        ui.video.removeAttribute('srcObject');
        ui.video.load();
    }
    if (camera) { camera.stop(); camera = null; cameraRunning = false; setCameraActive(false); }

    // Reset state for next time
    completedResults.length = 0;
    currentExIdx = 0;
    resetExerciseState();
    loadExerciseUI(0);
    isVideoMode = false;
    ui.video.pause(); ui.video.src = '';
    ui.overlay.classList.remove('hidden');
    if (ui.statusText) { ui.statusText.textContent = '系統就緒'; ui.statusText.className = 'text-green-400'; }

    // Show congratulation modal
    const modal = document.getElementById('training-complete-modal');
    if (modal) modal.classList.remove('hidden');
}

// ── Video loop ────────────────────────────────────────────────────────────────
async function processVideoFrame() {
    if (!ui.video.paused && !ui.video.ended && isVideoMode && poseTracker) {
        try { await poseTracker.send({ image: ui.video }); } catch (e) { console.warn(e); }
        requestAnimationFrame(processVideoFrame);
    } else {
        isVideoMode = false;
    }
}

// ── Event binding ─────────────────────────────────────────────────────────────
function bindEvents() {
    // Camera toggle
    const toggleCamera = async () => {
        if (cameraRunning || isVideoMode) {
            if (ui.video) {
                ui.video.pause();
                if (ui.video.srcObject) {
                    ui.video.srcObject.getTracks().forEach(track => track.stop());
                    ui.video.srcObject = null;
                }
                ui.video.src = '';
                ui.video.removeAttribute('src');
                ui.video.removeAttribute('srcObject');
                ui.video.load();
            }
            if (camera) { camera.stop(); camera = null; }
            isVideoMode = false;
            cameraRunning = false;
            cameraStartTime = 0;
            setCameraActive(false);
            ui.overlay.classList.remove('hidden');
            if (ui.ctx) ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
            return;
        }
        await prepareSystem();
        isVideoMode = false; ui.video.pause();
        // Configure Camera explicitly for performance
        camera = new Camera(ui.video, {
            onFrame: async () => { if (poseTracker) await poseTracker.send({ image: ui.video }); },
            width: 480,  // 降低解析度以提升效能
            height: 360
        });
        try {
            await camera.start();
            cameraRunning = true;
            cameraStartTime = 0; // 第一畫格進來時才開始倒數，避免啟動延遲吃掉倒數秒數
            setCameraActive(true);
        } catch (e) {
            console.error(e);
            let errorMsg = e.message;
            if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission dismissed') || errorMsg.includes('Permission denied')) {
                errorMsg = '相機權限被拒絕或忽略，請至瀏覽器網址列或設定中「允許」相機權限後重試。';
                alert(errorMsg); // 彈出視窗更能提醒手機使用者
            } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('Requested device not found')) {
                errorMsg = '找不到可用的相機設備。';
            }
            updateFeedback('無法開啟：' + errorMsg, 'text-red-400', 'bg-red-900/30');
            if (camera) { camera.stop(); camera = null; }
        }
    };
    ui.cameraBtn.onclick = toggleCamera;
    if (ui.fullscreenCloseBtn) {
        ui.fullscreenCloseBtn.onclick = toggleCamera;
    }

    // 暴露給全域供其他模組調用
    window.SharedAI = {
        startCamera: async () => { if (!cameraRunning) await toggleCamera(); },
        stopCamera: async () => { if (cameraRunning) await toggleCamera(); }
    };

    // Exercise selector dropdown
    if (ui.exerciseSelector) {
        ui.exerciseSelector.onchange = (event) => {
            const newIdx = parseInt(event.target.value, 10);
            if (!isNaN(newIdx) && newIdx >= 0 && newIdx < EXERCISES.length) {
                currentExIdx = newIdx;
                resetExerciseState();
                loadExerciseUI(currentExIdx);
                cameraStartTime = Date.now(); // 切換動作重新倒數 3 秒
                // Also update the completion array if we manually switch exercises
                // We'll clear the completed list to avoid sequence confusion, or just let them jump around
                completedResults.length = 0;
            }
        };
    }

    // Submit / advance button
    ui.submitBtn.onclick = advanceOrSubmit;

    // Retry button: reset current exercise
    const retryBtn = document.getElementById('btn-retry-training');
    if (retryBtn) retryBtn.onclick = retryExercise;

    // Modal close button
    const modalCloseBtn = document.getElementById('btn-close-complete-modal');
    if (modalCloseBtn) {
        modalCloseBtn.onclick = () => {
            const modal = document.getElementById('training-complete-modal');
            if (modal) modal.classList.add('hidden');
        };
    }

    // Zoom guide image modal
    if (ui.zoomBtn) {
        ui.zoomBtn.onclick = () => {
            const ex = currentExercise();
            const modal = document.getElementById('modal-image-zoom');
            const img = document.getElementById('zoom-modal-img');
            const title = document.getElementById('zoom-modal-title');
            if (modal && img && title) {
                img.src = ex.guideImage || '';
                title.textContent = ex.name;
                modal.classList.remove('hidden');
            }
        };
    }
}

// ── Public API ────────────────────────────────────────────────────────────────
export const training_ai = {
    init: () => {
        if (!initElements()) return;
        loadExerciseUI(0);
        bindEvents();
        if (ui.statusText) { ui.statusText.textContent = '系統就緒'; ui.statusText.className = 'text-green-400'; }
    }
};
