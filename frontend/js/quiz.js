import { api } from './api.js';
import { dom } from './ui.js';

let quizData = [];
let currentIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 10;
let canAnswer = false;

// Dynamic DOM getter helper
function getQuizDom() {
    return {
        modulesMenu: document.getElementById('quiz-modules-menu'),
        module2Area: document.getElementById('quiz-module-2-area'),
        lobby: document.getElementById('quiz-lobby'),
        playArea: document.getElementById('quiz-play-area'),
        resultArea: document.getElementById('quiz-result-area'),
        progress: document.getElementById('quiz-progress'),
        score: document.getElementById('quiz-score'),
        timer: document.getElementById('quiz-timer'),
        timerBar: document.getElementById('quiz-timer-bar'),
        questionText: document.getElementById('quiz-question-text'),
        options: document.querySelectorAll('.quiz-option'),
        explanationArea: document.getElementById('quiz-explanation-area'),
        explanationText: document.getElementById('quiz-explanation-text'),
        sourceText: document.getElementById('quiz-source-text'),
        feedbackOverlay: document.getElementById('quiz-feedback-overlay'),
        feedbackIcon: document.getElementById('quiz-feedback-icon'),
        finalScore: document.getElementById('quiz-final-score'),
        rankText: document.getElementById('quiz-rank-text'),
        rankModal: document.getElementById('rank-details-modal'),
        rankModalTitle: document.getElementById('rank-modal-title'),
        rankModalImg: document.getElementById('rank-modal-img'),
        rankModalDesc: document.getElementById('rank-modal-desc'),
        btnCloseRankModal: document.getElementById('btn-close-rank-modal'),
        rankCards: document.querySelectorAll('.rank-card'),
    };
}

export const rankDescriptions = {
    '特級上將': '大元帥等級軍階，因「不合時宜」，已於2000年11月1日廢止。歷史上僅授予蔣中正一人。',
    '一級上將': '參謀總長（2013年1月15日以前）或總統府戰略顧問，中華民國一級上將為終身職，是目前中華民國國軍唯一沒有「服現役限制」、「除役年齡」的軍階，國防六法實施後除非立下特殊功勳或不幸殉職，二級上將才有機會升上一級上將。',
    '二級上將': '國防部二級上將官職如下（不含總統府戰略顧問、國家安全局局長）：參謀總長、國防部副部長（軍備、軍政）、陸軍司令、海軍司令、空軍司令、副參謀總長執行官、國防大學校長。',
    '中將': '主要擔任國防部常務次長、參謀本部副參謀總長、參謀次長、陸軍副司令、海軍副司令、空軍副司令、國防大學副校長、憲兵指揮官、資通電軍指揮官、國防部全民防衛動員署署長、全動署後備指揮部指揮官、國防部政治作戰局局長...等',
    '少將': '主要擔任國防部各直屬單位高階主官（主管）、各軍團（戰區）、防衛指揮部副指揮官、憲兵副指揮官、後備副指揮官、資通電軍副指揮官、陸軍副參謀長、海軍副參謀長、空軍副參謀長、陸軍聯兵旅長、海軍艦隊指揮部副指揮官',
    '上校': '陸軍副旅長、參謀主任、政戰主任、步兵旅正、副旅長或群指揮官等職務、海軍為艦隊指揮部副參謀長、艦隊指揮部政戰副主任、憲兵副參謀長、陸戰隊指揮部副參謀長、陸戰隊指揮部政戰副主任、一級艦艦長；在空軍為副聯隊長、大隊長、副大隊長或相等層級的職務，國軍歷史文物館館長、海、空軍文物館館長...等',
    '中校': '陸軍營長、群部副指揮官、政戰處長、科部科長、參謀主任或高司單位參謀；海軍二級艦艦長；空軍副大隊長、中隊長。',
    '少校': '陸軍副營長、營參謀主任、營輔導長、本部連（旅部連、群部連、營部連）或專業連隊連長；海軍三級艦艦長；空軍副中隊長、防空連連長。',
    '上尉': '陸軍連長、本部連（旅部連、群部連、營部連）或專業連隊副連長、空軍分隊長、連輔導長。',
    '中尉': '陸軍副連長、連輔導長、專業連隊的排（組）長職務。',
    '少尉': '陸軍排長、空軍區隊長，少數則因學歷、專長等因素成為參謀或特種官科軍官（如統計官、軍法官、行政官、資安官、新聞官、軍醫官、財務官、政戰官等）、具有大學或以上學歷的役男、可參加預官考試於入伍訓及專長訓後，授予少尉軍官階級。',
    '一等士官長': '總士官長、司令部士官督導長、旅級士官督導長、群級士官督導長。',
    '二等士官長': '營級士官督導長或各級參謀。',
    '三等士官長': '連級士官督導長或各級參謀。',
    '上士': '代理士官督導長與副排長。海軍上士於上士階級服役滿十年未升士官長則成為金色標示的資深上士。',
    '中士': '班長（砲兵為砲長、裝甲兵為車長）',
    '下士': '副班長，是經過預備士官考試後，所擔任的軍階。具有專科學校以上學歷者，經考試取得預備士官資格者，於入伍訓、士官基礎教育及專長訓後，授予下士士官軍階。',
    '上等兵': '在部隊之中通常是服役年資最久的士兵，為士兵階級的最高等級。在中華民國軍階制度中，一等兵服役滿一年，可以晉升為上等兵。現行部隊中的上等兵皆為志願役。上等兵亦可擔任班編制再細分的伍長職（非常備編制，通常3至5人一伍）。',
    '一等兵': '一等兵簡稱一兵，士兵的軍階，比二等兵軍階為高。在軍中，一等兵是新兵經過受訓，完成軍種初階訓練和專業兵科學校訓練後並在部隊留守數月。中華民國國軍規定二等兵服役滿半年，可晉升為一等兵。',
    '二等兵': '二等兵簡稱二兵，是近代國家的軍隊中階級最低的士兵。新加入軍隊的士兵經過基礎訓練即為二等兵，一般再經過一段時間之後可以升為一等兵。'
};

export function initQuiz() {
    const qDom = getQuizDom();

    // Unit Menu Navigation
    const btnUnit1 = document.getElementById('btn-quiz-unit-1');
    if (btnUnit1) btnUnit1.onclick = () => {
        if (qDom.modulesMenu) qDom.modulesMenu.classList.add('hidden');
        if (qDom.lobby) qDom.lobby.classList.remove('hidden');
    };

    const btnUnit2 = document.getElementById('btn-quiz-unit-2');
    if (btnUnit2) btnUnit2.onclick = () => {
        if (qDom.modulesMenu) qDom.modulesMenu.classList.add('hidden');
        if (qDom.module2Area) qDom.module2Area.classList.remove('hidden');
    };

    const btnBack1 = document.getElementById('btn-back-to-modules-1');
    if (btnBack1) btnBack1.onclick = () => {
        if (qDom.lobby) qDom.lobby.classList.add('hidden');
        if (qDom.modulesMenu) qDom.modulesMenu.classList.remove('hidden');
    };

    const btnBack2 = document.getElementById('btn-back-to-modules-2');
    if (btnBack2) btnBack2.onclick = () => {
        if (qDom.module2Area) qDom.module2Area.classList.add('hidden');
        if (qDom.modulesMenu) qDom.modulesMenu.classList.remove('hidden');
    };

    const btnStart = document.getElementById('btn-start-quiz');
    if (btnStart) btnStart.onclick = startQuiz;

    const btnNext = document.getElementById('btn-next-question');
    if (btnNext) btnNext.onclick = nextQuestion;

    const btnRetry = document.getElementById('btn-retry-quiz');
    if (btnRetry) btnRetry.onclick = startQuiz;

    const btnExit = document.getElementById('btn-exit-quiz');
    if (btnExit) btnExit.onclick = exitQuiz;

    const btnQuit = document.getElementById('btn-quit-quiz');
    if (btnQuit) btnQuit.onclick = exitQuiz;

    const options = document.querySelectorAll('.quiz-option');
    options.forEach(btn => {
        btn.onclick = () => selectOption(btn.dataset.option);
    });

    // Rank Modal Logic
    const cards = document.querySelectorAll('.rank-card');
    const modal = document.getElementById('rank-details-modal');
    const title = document.getElementById('rank-modal-title');
    const img = document.getElementById('rank-modal-img');
    const desc = document.getElementById('rank-modal-desc');
    const btnClose = document.getElementById('btn-close-rank-modal');

    cards.forEach(card => {
        card.onclick = () => {
            const rankSpan = card.querySelector('span');
            const rankImg = card.querySelector('img');
            if (!rankSpan || !rankImg) return;

            const rankName = rankSpan.textContent.trim();
            const imgSrc = rankImg.src;

            if (title) title.textContent = rankName;
            if (img) img.src = imgSrc;
            if (desc) desc.textContent = rankDescriptions[rankName] || '詳細介紹即將推出...';

            if (modal) modal.classList.remove('hidden');
        };
    });

    if (btnClose && modal) {
        btnClose.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    // Rank Matching Quiz Event Listeners
    const btnStartRank = document.getElementById('btn-start-rank-match');
    if (btnStartRank) btnStartRank.onclick = startRankMatchQuiz;

    const btnExitRank = document.getElementById('btn-exit-rank-match');
    if (btnExitRank) btnExitRank.onclick = exitRankMatchQuiz;

    const btnGradeRank = document.getElementById('btn-grade-rank-match');
    if (btnGradeRank) btnGradeRank.onclick = gradeRankMatchRound;

    const btnNextRank = document.getElementById('btn-next-rank-match');
    if (btnNextRank) btnNextRank.onclick = nextRankMatchRound;

    const btnRetryRank = document.getElementById('btn-retry-rank-match');
    if (btnRetryRank) btnRetryRank.onclick = startRankMatchQuiz;

    const btnQuitRank = document.getElementById('btn-quit-rank-match');
    if (btnQuitRank) btnQuitRank.onclick = exitRankMatchQuiz;

    const btnRealStart = document.getElementById('btn-real-start-rank-match');
    if (btnRealStart) btnRealStart.onclick = startRankMatchQuizGameplay;

    const btnBackLobby = document.getElementById('btn-back-to-module2-from-lobby');
    if (btnBackLobby) btnBackLobby.onclick = backToModule2FromLobby;
}

async function startQuiz() {
    try {
        const qDom = getQuizDom();
        currentIndex = 0;
        score = 0;
        if (qDom.score) qDom.score.textContent = '0';

        if (qDom.lobby) qDom.lobby.classList.add('hidden');
        if (qDom.resultArea) qDom.resultArea.classList.add('hidden');
        if (qDom.playArea) qDom.playArea.classList.remove('hidden');

        if (qDom.questionText) qDom.questionText.textContent = '正在裝填題目...';
        quizData = await api.getRandomQuiz(5);

        if (!quizData || quizData.length === 0) {
            throw new Error('找不到題目');
        }

        loadQuestion();
    } catch (e) {
        alert(e.message);
        exitQuiz();
    }
}

function loadQuestion() {
    const qDom = getQuizDom();
    const q = quizData[currentIndex];
    canAnswer = true;

    if (qDom.progress) qDom.progress.textContent = `${currentIndex + 1}/${quizData.length}`;
    if (qDom.questionText) qDom.questionText.textContent = q.question;

    const options = document.querySelectorAll('.quiz-option');
    options.forEach(btn => {
        const optKey = btn.dataset.option;
        const textSpan = btn.querySelector('.option-text');
        if (textSpan) textSpan.textContent = q.options[optKey] || '---';

        btn.classList.remove('border-green-500', 'border-red-500', 'bg-green-900/20', 'bg-red-900/20', 'opacity-50');
        btn.disabled = false;
    });

    if (qDom.explanationArea) qDom.explanationArea.classList.add('hidden');
    if (qDom.feedbackOverlay) qDom.feedbackOverlay.classList.add('hidden');

    resetTimer();
}

function resetTimer() {
    if (timer) clearInterval(timer);
    timeLeft = 10;
    updateTimerUI();

    timer = setInterval(() => {
        timeLeft -= 0.1;
        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(timer);
            handleTimeOut();
        }
        updateTimerUI();
    }, 100);
}

function updateTimerUI() {
    const qDom = getQuizDom();
    if (qDom.timer) qDom.timer.textContent = timeLeft.toFixed(1);
    const percent = (timeLeft / 10) * 100;
    if (qDom.timerBar) {
        qDom.timerBar.style.width = `${percent}%`;
        if (timeLeft < 3) {
            qDom.timerBar.classList.replace('bg-green-500', 'bg-red-500');
        } else {
            qDom.timerBar.classList.replace('bg-red-500', 'bg-green-500');
        }
    }
}

function selectOption(choice) {
    if (!canAnswer) return;
    canAnswer = false;
    if (timer) clearInterval(timer);

    const qDom = getQuizDom();
    const q = quizData[currentIndex];
    const isCorrect = choice === q.answer;

    if (qDom.feedbackOverlay && qDom.feedbackIcon) {
        qDom.feedbackOverlay.classList.remove('hidden');
        qDom.feedbackIcon.innerHTML = isCorrect
            ? '<i class="fa-solid fa-check text-green-500"></i>'
            : '<i class="fa-solid fa-xmark text-red-500"></i>';
        qDom.feedbackIcon.className = "text-8xl animate-bounce-in opacity-100 transition-all duration-300";

        setTimeout(() => {
            qDom.feedbackOverlay.classList.add('hidden');
        }, 800);
    }

    const options = document.querySelectorAll('.quiz-option');
    options.forEach(btn => {
        btn.disabled = true;
        const optKey = btn.dataset.option;
        if (optKey === q.answer) {
            btn.classList.add('border-green-500', 'bg-green-900/20');
        } else if (optKey === choice && !isCorrect) {
            btn.classList.add('border-red-500', 'bg-red-900/20');
        } else {
            btn.classList.add('opacity-50');
        }
    });

    if (isCorrect) {
        const bonus = Math.round(timeLeft * 10);
        score += 100 + bonus;
        if (qDom.score) qDom.score.textContent = score;
    }

    if (qDom.explanationArea) qDom.explanationArea.classList.remove('hidden');
    if (qDom.explanationText) qDom.explanationText.textContent = q.explanation || '本題無詳細說明。';
    if (qDom.sourceText) qDom.sourceText.textContent = `出處：${q.source || '國防部規章'}`;
}

function handleTimeOut() {
    selectOption(null);
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const qDom = getQuizDom();
    if (qDom.playArea) qDom.playArea.classList.add('hidden');
    if (qDom.resultArea) qDom.resultArea.classList.remove('hidden');

    if (qDom.finalScore) qDom.finalScore.textContent = score;

    let rank = "新兵戰士";
    let color = "text-stone-400";

    if (score >= 600) { rank = "精實模範生"; color = "text-green-400"; }
    else if (score >= 400) { rank = "及格邊緣人"; color = "text-yellow-400"; }
    else { rank = "純種大天兵"; color = "text-red-400"; }

    if (qDom.rankText) {
        qDom.rankText.textContent = `等級：${rank}`;
        qDom.rankText.className = `text-xl font-bold mb-8 tracking-wider ${color}`;
    }

    if (score >= 500 && window.confetti) {
        window.confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function exitQuiz() {
    const qDom = getQuizDom();
    if (timer) clearInterval(timer);
    if (qDom.playArea) qDom.playArea.classList.add('hidden');
    if (qDom.resultArea) qDom.resultArea.classList.add('hidden');
    if (qDom.lobby) qDom.lobby.classList.remove('hidden');
}

// ==========================================
// Rank Matching Quiz Logic
// ==========================================

function getMatchDom() {
    return {
        area: document.getElementById('rank-match-quiz-area'),
        resultArea: document.getElementById('rank-match-result-area'),
        slotsContainer: document.getElementById('rank-match-slots'),
        poolContainer: document.getElementById('rank-match-pool'),
        roundText: document.getElementById('rank-match-round-text'),
        btnGrade: document.getElementById('btn-grade-rank-match'),
        btnNext: document.getElementById('btn-next-rank-match'),
        finalScore: document.getElementById('rank-match-final-score'),
        finalRankText: document.getElementById('rank-match-rank-text'),
        lobby: document.getElementById('rank-match-lobby'),
    };
}

let matchQuizState = {
    allRanksShuffled: [],
    currentRoundIndex: 0,
    score: 0,
    totalCorrect: 0,
    currentRoundData: [],
    userAnswers: []
};

export function startRankMatchQuiz() {
    const mDom = getMatchDom();
    const module2 = document.getElementById('quiz-module-2-area');
    if (module2) module2.classList.add('hidden');
    if (mDom.resultArea) mDom.resultArea.classList.add('hidden');
    if (mDom.area) mDom.area.classList.add('hidden');
    if (mDom.lobby) mDom.lobby.classList.remove('hidden');
}

function startRankMatchQuizGameplay() {
    const allRanksList = Object.keys(rankDescriptions);

    matchQuizState.allRanksShuffled = [...allRanksList].sort(() => Math.random() - 0.5);
    matchQuizState.currentRoundIndex = 0;
    matchQuizState.score = 0;
    matchQuizState.totalCorrect = 0;

    const mDom = getMatchDom();
    if (mDom.lobby) mDom.lobby.classList.add('hidden');
    if (mDom.resultArea) mDom.resultArea.classList.add('hidden');
    if (mDom.area) mDom.area.classList.remove('hidden');

    loadRankMatchRound();
}

function backToModule2FromLobby() {
    const mDom = getMatchDom();
    if (mDom.lobby) mDom.lobby.classList.add('hidden');
    const module2 = document.getElementById('quiz-module-2-area');
    if (module2) module2.classList.remove('hidden');
}

function loadRankMatchRound() {
    const mDom = getMatchDom();
    const startIndex = matchQuizState.currentRoundIndex * 3;
    matchQuizState.currentRoundData = matchQuizState.allRanksShuffled.slice(startIndex, startIndex + 3);
    matchQuizState.userAnswers = [null, null, null];

    if (mDom.roundText) mDom.roundText.textContent = `第 ${matchQuizState.currentRoundIndex + 1} 輪`;

    if (mDom.btnGrade) {
        mDom.btnGrade.classList.remove('hidden');
        mDom.btnGrade.disabled = true;
    }
    if (mDom.btnNext) mDom.btnNext.classList.add('hidden');

    renderMatchSlots();
    renderMatchPool();
}

function renderMatchSlots() {
    const mDom = getMatchDom();
    if (!mDom.slotsContainer) return;
    mDom.slotsContainer.innerHTML = '';

    matchQuizState.currentRoundData.forEach((rank, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'flex flex-row items-center justify-between bg-stone-900 rounded-xl border-2 border-stone-700 p-3 pt-8 pb-3 shadow-lg relative gap-3 min-h-[90px]';

        const qNum = matchQuizState.currentRoundIndex * 3 + index + 1;
        const badge = document.createElement('span');
        badge.className = 'absolute top-1.5 left-1.5 bg-stone-950 text-blue-400 border border-stone-700 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md';
        badge.textContent = `第 ${qNum} 題`;
        slotDiv.appendChild(badge);

        const img = document.createElement('img');
        img.src = `docs/軍階/${rank}.png`;
        img.alt = rank;
        img.className = "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain shrink-0 drop-shadow-md";

        const dropZone = document.createElement('div');
        dropZone.dataset.index = index;
        dropZone.onclick = () => onMatchSlotClick(index);

        if (matchQuizState.userAnswers[index]) {
            dropZone.className = 'flex-1 min-h-[44px] h-full border-2 border-blue-500 bg-blue-900/30 text-blue-300 font-bold rounded-lg flex items-center justify-center cursor-pointer shadow-inner text-xs sm:text-sm py-1 px-2 leading-tight text-center';
            dropZone.textContent = matchQuizState.userAnswers[index];
        } else {
            dropZone.className = 'flex-1 min-h-[44px] h-full border-2 border-dashed border-stone-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-stone-800 text-stone-500 text-xs py-1 px-2 text-center';
            dropZone.textContent = '點擊放入';
        }

        slotDiv.appendChild(img);
        slotDiv.appendChild(dropZone);
        mDom.slotsContainer.appendChild(slotDiv);
    });
}

function renderMatchPool() {
    const mDom = getMatchDom();
    if (!mDom.poolContainer) return;
    mDom.poolContainer.innerHTML = '';

    const usedAnswers = matchQuizState.userAnswers.filter(a => a !== null);
    const availableOptions = matchQuizState.currentRoundData.filter(r => !usedAnswers.includes(r));

    // Sort stably so they don't jump around randomly
    const poolOptions = [...availableOptions].sort((a, b) => a.localeCompare(b, 'zh-Hant'));

    poolOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 text-xs sm:text-sm md:text-base cursor-pointer';
        btn.textContent = opt;
        btn.onclick = () => onMatchPoolClick(opt);
        mDom.poolContainer.appendChild(btn);
    });

    const allFilled = matchQuizState.userAnswers.every(a => a !== null);
    if (mDom.btnGrade) mDom.btnGrade.disabled = !allFilled;
}

function onMatchPoolClick(rankName) {
    const emptyIndex = matchQuizState.userAnswers.indexOf(null);
    if (emptyIndex !== -1) {
        matchQuizState.userAnswers[emptyIndex] = rankName;
        renderMatchSlots();
        renderMatchPool();
    }
}

function onMatchSlotClick(index) {
    if (matchQuizState.userAnswers[index]) {
        matchQuizState.userAnswers[index] = null;
        renderMatchSlots();
        renderMatchPool();
    }
}

function gradeRankMatchRound() {
    const mDom = getMatchDom();
    let roundCorrect = 0;

    if (!mDom.slotsContainer) return;
    const slots = mDom.slotsContainer.children;

    matchQuizState.currentRoundData.forEach((correctRank, index) => {
        const dropZone = slots[index].lastElementChild;
        const userAnswer = matchQuizState.userAnswers[index];

        if (userAnswer === correctRank) {
            roundCorrect++;
            dropZone.className = 'flex-1 min-h-[44px] h-full border-2 border-green-500 bg-green-900/40 text-green-400 font-bold rounded-lg flex items-center justify-center cursor-default text-xs sm:text-sm py-1 px-2 leading-tight text-center';
            dropZone.innerHTML = `${userAnswer} <i class="fa-solid fa-check ml-1"></i>`;
            dropZone.onclick = null;
        } else {
            dropZone.className = 'flex-1 min-h-[44px] h-full border-2 border-red-500 bg-red-900/40 text-red-400 font-bold rounded-lg flex flex-wrap items-center justify-center cursor-default text-[11px] sm:text-xs py-1 px-2 leading-tight text-center';
            dropZone.innerHTML = `<span class="line-through opacity-70">${userAnswer}</span> <i class="fa-solid fa-xmark mx-0.5"></i> <span class="text-green-400 font-bold">${correctRank}</span>`;
            dropZone.onclick = null;
        }
    });

    matchQuizState.totalCorrect += roundCorrect;
    matchQuizState.score = Math.round((matchQuizState.totalCorrect / 12) * 100);

    if (mDom.btnGrade) mDom.btnGrade.classList.add('hidden');
    if (mDom.btnNext) mDom.btnNext.classList.remove('hidden');
    if (mDom.poolContainer) {
        mDom.poolContainer.innerHTML = `<div class="text-stone-300 font-bold text-center text-lg">本輪答對 <span class="text-green-400">${roundCorrect}</span> / 3 題</div>`;
    }
}

function nextRankMatchRound() {
    matchQuizState.currentRoundIndex++;

    if (matchQuizState.currentRoundIndex >= 4) {
        showRankMatchResult();
    } else {
        loadRankMatchRound();
    }
}

function showRankMatchResult() {
    const mDom = getMatchDom();
    if (mDom.area) mDom.area.classList.add('hidden');
    if (mDom.resultArea) mDom.resultArea.classList.remove('hidden');

    if (mDom.finalScore) mDom.finalScore.textContent = matchQuizState.score;

    let rank = "菜鳥新兵";
    let color = "text-stone-400";

    if (matchQuizState.score === 100) { rank = "軍階辨識大師"; color = "text-green-400"; }
    else if (matchQuizState.score >= 80) { rank = "優秀鑑識官"; color = "text-blue-400"; }
    else if (matchQuizState.score >= 60) { rank = "勉強及格"; color = "text-yellow-400"; }
    else { rank = "超級大天兵"; color = "text-red-400"; }

    if (mDom.finalRankText) {
        mDom.finalRankText.textContent = `等級：${rank}`;
        mDom.finalRankText.className = `text-2xl font-bold mb-8 tracking-wider ${color}`;
    }

    if (matchQuizState.score >= 80 && window.confetti) {
        window.confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function exitRankMatchQuiz() {
    const mDom = getMatchDom();
    if (mDom.lobby) mDom.lobby.classList.add('hidden');
    if (mDom.area) mDom.area.classList.add('hidden');
    if (mDom.resultArea) mDom.resultArea.classList.add('hidden');
    const module2 = document.getElementById('quiz-module-2-area');
    if (module2) module2.classList.remove('hidden');
}
