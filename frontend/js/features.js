/**
 * SIMSOLDIER FEATURES
 * 包含：背包、聊天室、課表、影片、說明文件、日曆、倒數
 */

import { state, INITIAL_JOURNEY_STAGES, INITIAL_BACKPACK } from './state.js';
import { dom, switchTab } from './ui.js';
import { api } from './api.js';

// --- Constants ---
const INSTRUCTOR_RESPONSES = [
    "大聲點！我聽不見！", "懷疑啊？", "你這個兵怎麼當的？", "不要給我嬉皮笑臉！",
    "洗澡只有三分鐘，還在這邊跟我聊天？", "注意禮節！", "是不是想洞八？",
    "公差出列！", "還有時間滑手機？", "棉被折好了沒？"
];

const DOCS_DATA = {
    units: {
        title: "全國役政單位資料",
        content: "TABLE_PLACEHOLDER", // Will be init
        link: null
    },
    recheck: {
        title: "體位複檢標準表",
        content: "若您對體檢結果有疑義（如BMI過高/過低、視力問題、扁平足等），可申請複檢。<br><br>請參考下方標準圖表或是點擊連結查看詳細法規。<br><br><img src='docs/體位區分標準圖.png' class='w-full rounded mt-4 border border-stone-600' alt='體位區分標準圖'>",
        link: "https://dca.moi.gov.tw/PhysicalStatus/"
    },
    contact: {
        title: "各縣市役政單位通訊錄",
        content: "若您有兵單遺失、徵集日期查詢、抵免役期辦理等問題，請直接聯繫戶籍地公所兵役科。<br><br>詳細電話與地址請點擊下方連結至內政部役政司網站查詢。",
        link: "https://dca.moi.gov.tw/chaspx/news.aspx?web=225"
    },
    culture: {
        title: "國軍軍種文化與特性分析",
        content: `
<p class="text-stone-400 text-sm mb-4">深入剖析中華民國國軍主要軍種與特種部隊之組織文化、精神標語、管理風格與核心價值。</p>

<div class="overflow-x-auto rounded-lg border border-stone-700">
    <table class="w-full text-left border-collapse text-stone-300">
        <thead>
            <tr class="bg-stone-800 border-b border-stone-700 text-stone-300 text-sm">
                <th class="py-3 px-4 font-semibold w-28 whitespace-nowrap">軍種</th>
                <th class="py-3 px-4 font-semibold w-28 whitespace-nowrap">精神標語</th>
                <th class="py-3 px-4 font-semibold whitespace-nowrap">管理風格與組織特性</th>
                <th class="py-3 px-4 font-semibold whitespace-nowrap">文化核心</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-stone-800/80 text-sm bg-stone-900/60">
            <tr class="hover:bg-stone-800/40 transition-colors">
                <td class="py-4 px-4 font-bold text-white whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-1 rounded bg-green-700 text-green-100 border border-green-500 font-bold">
                        陸軍
                    </span>
                </td>
                <td class="py-4 px-4 whitespace-nowrap">
                    <span class="text-orange-400 font-bold">「忠誠」</span>
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300">
                    陸軍是國軍中規模最大、歷史最深的軍種。高度強調標準作業程序（SOP）、流程與權威結構。
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300">
                    透過嚴格的內務檢查與整齊劃一的隊伍，消融個人主義，藉此構建堅不可摧的集體防禦意志。
                </td>
            </tr>
            <tr class="hover:bg-stone-800/40 transition-colors">
                <td class="py-4 px-4 font-bold text-white whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-1 rounded bg-blue-900 text-blue-100 border border-blue-600 font-bold">
                        海軍
                    </span>
                </td>
                <td class="py-4 px-4 whitespace-nowrap">
                    <span class="text-orange-400 font-bold">「忠義」</span>
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300">
                    相較於陸軍的剛猛，海軍被視為「紳士軍隊」。由於海軍常需執行敦睦遠航等任務，接待友邦政要並宣揚國威，使得海軍官兵具備較高的禮儀素養與國際化視野。
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300">
                    相較於陸軍的嚴格階級服從，海軍內部的溝通往往更為扁平、直接，且強調基於技術信任的專業分工，而非僅依靠軍事階級來壓制。
                </td>
            </tr>
            <tr class="hover:bg-stone-800/40 transition-colors">
                <td class="py-4 px-4 font-bold text-white whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-1 rounded bg-sky-800 text-sky-100 border border-sky-400 font-bold">
                        空軍
                    </span>
                </td>
                <td class="py-4 px-4 whitespace-nowrap">
                    <span class="text-orange-400 font-bold">「忠勇」</span>
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300">
                    空軍是一個高度依賴尖端科技與裝備性能的軍種，組織內部展現出強烈的「專業型官僚」與「技術精英主義」特徵。
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300">
                    空軍擁有濃厚的「英雄崇拜」色彩，飛行員不僅是作戰核心，更是組織內的最高榮譽象徵，鼓勵官兵追求個人卓越與精準操作。由於飛航管制與飛機維修需要極高的科學準確性，空軍的管理往往比陸軍更具彈性。
                </td>
            </tr>
            <tr class="hover:bg-stone-800/40 transition-colors">
                <td class="py-4 px-4 font-bold text-white whitespace-nowrap">
                    <span class="block text-xs text-stone-500 mb-1">其他特色軍種</span>
                    <span class="inline-flex items-center px-2.5 py-1 rounded bg-red-900 text-red-100 border border-red-500 font-bold">
                        海軍陸戰隊
                    </span>
                </td>
                <td class="py-4 px-4 whitespace-nowrap">
                    <span class="text-orange-400 font-bold">「永遠忠誠」</span>
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300" colspan="2">
                    被公認為文化凝聚力最強的單位，強調「不怕苦、不怕難、不怕死」的三不怕精神。透過極度嚴苛的入伍儀式（如天堂路）建立起近乎宗教性的集體認同與終身榮譽感。
                </td>
            </tr>
            <tr class="hover:bg-stone-800/40 transition-colors">
                <td class="py-4 px-4 font-bold text-white whitespace-nowrap">
                    <span class="block text-xs text-stone-500 mb-1">其他特色軍種</span>
                    <span class="inline-flex items-center px-2.5 py-1 rounded bg-zinc-700 text-zinc-100 border border-zinc-500 font-bold">
                        憲兵
                    </span>
                </td>
                <td class="py-4 px-4 whitespace-nowrap">
                    <span class="text-orange-400 font-bold">「忠貞」</span>
                </td>
                <td class="py-4 px-4 leading-relaxed text-stone-300" colspan="2">
                    作為「軍中警察」與三軍標竿，憲兵的管理核心在於「法治」與「表率」。講究賞罰分明。
                </td>
            </tr>
        </tbody>
    </table>
</div>
        `,
        link: null
    },
    shengjia: {
        title: "身家調查說明",
        content: `
<p class="text-stone-400 text-sm mb-4">身家調查是徵兵體檢前的重要準備作業，由公所兵役科人員進行訪談並填寫資料。調查結果會影響後續體檢、延役與專長兵抽籤資格，務必如實填寫。</p>

<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">

  <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
    <div class="flex items-center gap-2 mb-2">
      <i class="fa-solid fa-id-card text-blue-400 text-lg"></i>
      <h4 class="font-bold text-white">一、基本資料</h4>
    </div>
    <ul class="text-stone-300 text-sm space-y-1 list-disc list-inside ml-2">
      <li>姓名</li>
      <li>身分證字號</li>
      <li>戶籍地址與現住址</li>
      <li>聯絡電話</li>
    </ul>
  </div>

  <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
    <div class="flex items-center gap-2 mb-2">
      <i class="fa-solid fa-graduation-cap text-green-400 text-lg"></i>
      <h4 class="font-bold text-white">二、就學意願</h4>
    </div>
    <p class="text-stone-300 text-sm mb-2">攸關是否辦理延役，必須如實說明：</p>
    <ul class="text-stone-300 text-sm space-y-1 list-disc list-inside ml-2">
      <li>大四畢業後是否直接入伍？</li>
      <li>是否有繼續升學（碩班、插大等）的計畫？</li>
      <li class="text-white font-bold">⚠ 有升學意願者可申請延役，於20歲之年11月15日前暫不接受徵集。</li>
    </ul>
  </div>

  <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
    <div class="flex items-center gap-2 mb-2">
      <i class="fa-solid fa-heart-pulse text-red-400 text-lg"></i>
      <h4 class="font-bold text-white">三、健康狀況</h4>
    </div>
    <p class="text-stone-300 text-sm mb-2">調查後系統會在體檢表上自動註記，供醫生參考：</p>
    <ul class="text-stone-300 text-sm space-y-1 list-disc list-inside ml-2">
      <li>是否領有身心障礙證明（手冊）？請說明疾病類別及等級</li>
      <li>是否有重大傷病、開刀紀錄？請填寫疾病名稱或手術日期</li>
      <li>是否有遺傳性疾病？</li>
      <li>是否曾就讀身心障礙之特殊教育班、特殊教育學校或資源班？</li>
    </ul>
  </div>

  <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
    <div class="flex items-center gap-2 mb-2">
      <i class="fa-solid fa-certificate text-stone-300 text-lg"></i>
      <h4 class="font-bold text-white">四、專長證照</h4>
    </div>
    <p class="text-stone-300 text-sm mb-2">具備以下類型的<strong class="text-white font-bold">國家級證照</strong>，才有資格參與「專長兵優先抽籤」：</p>
    <ul class="text-stone-300 text-sm space-y-1 list-disc list-inside ml-2">
      <li>資訊安全相關證照</li>
      <li>汽車修護技術士</li>
      <li>廚師丙級以上</li>
      <li>醫護人員執照（醫師、護理師等）</li>
      <li>其他經政府認定之技術士或專業執照</li>
    </ul>
  </div>

  <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
    <div class="flex items-center gap-2 mb-2">
      <i class="fa-solid fa-briefcase text-purple-400 text-lg"></i>
      <h4 class="font-bold text-white">五、個人專長</h4>
    </div>
    <ul class="text-stone-300 text-sm space-y-1 list-disc list-inside ml-2">
      <li>就讀科系（專長科系）</li>
      <li>目前從事職業</li>
      <li>民間職業專長（請說明初學／半熟練／熟練／精通）</li>
      <li>方言能力（閩南語、客家語、原住民語 — 粗通或流利）</li>
      <li>外國語言（英語、日語等 — 讀說寫譯能力）</li>
    </ul>
  </div>

</div>

<div class="mt-6">
  <h4 class="text-stone-400 text-sm font-bold mb-2 uppercase tracking-wider">官方身家調查表格參考</h4>
  <a href="docs/身家調查表格.pdf" download="身家調查表格.pdf"
     class="inline-flex items-center gap-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all duration-150">
    <i class="fa-solid fa-file-pdf text-xl"></i>
    <span>下載身家調查表格 PDF</span>
    <i class="fa-solid fa-download text-sm opacity-70"></i>
  </a>
</div>
        `,
        link: null
    }
};

// --- Inventory ---
// --- Inventory ---
export function initBackpack() {
    try {
        const saved = localStorage.getItem('simSoldier_inventory');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.backpack = INITIAL_BACKPACK.map(item => {
                const savedItem = Array.isArray(parsed) ? parsed.find(p => p.id === item.id) : null;
                return {
                    ...item,
                    acquired: savedItem ? !!savedItem.acquired : false
                };
            });
        } else {
            state.backpack = JSON.parse(JSON.stringify(INITIAL_BACKPACK));
        }
    } catch (e) {
        console.error('Error loading inventory from localStorage:', e);
        state.backpack = JSON.parse(JSON.stringify(INITIAL_BACKPACK));
    }
}

export function saveBackpackProgress() {
    try {
        if (!state.backpack) return;
        const toSave = state.backpack.map(i => ({ id: i.id, acquired: !!i.acquired }));
        localStorage.setItem('simSoldier_inventory', JSON.stringify(toSave));
    } catch (e) {
        console.error('Error saving inventory progress:', e);
    }
}

export function resetInventory() {
    if (confirm('確定要清空並重置入伍背包檢查表嗎？')) {
        if (state.backpack) {
            state.backpack.forEach(i => i.acquired = false);
        }
        saveBackpackProgress();
        renderInventory();
        syncJourneyAutoProgress();
    }
}

export function renderInventory() {
    if (!state.backpack || state.backpack.length === 0) {
        initBackpack();
    }
    const container = dom.inventoryCategoriesContainer;
    if (!container) return;
    container.innerHTML = '';

    // Category mapping
    const categories = {
        document: {
            title: "一、 行政證件與資料 (必查)",
            icon: "fa-file-signature",
            iconColor: "text-red-400",
            borderColor: "border-red-900/40"
        },
        financial_comm: {
            title: "二、 財務與電子通訊",
            icon: "fa-credit-card",
            iconColor: "text-amber-400",
            borderColor: "border-amber-900/40"
        },
        hygiene: {
            title: "三、 盥洗與個人衛生用品",
            icon: "fa-soap",
            iconColor: "text-blue-400",
            borderColor: "border-blue-900/40"
        },
        medical: {
            title: "四、 醫療與防蚊防護",
            icon: "fa-kit-medical",
            iconColor: "text-emerald-400",
            borderColor: "border-emerald-900/40"
        },
        essentials: {
            title: "五、 實用生活小物 (口袋內務)",
            icon: "fa-compass",
            iconColor: "text-purple-400",
            borderColor: "border-purple-900/40"
        },
        special: {
            title: "六、 特定軍種與注意事項",
            icon: "fa-circle-exclamation",
            iconColor: "text-rose-400",
            borderColor: "border-rose-900/40"
        }
    };

    // Initialize HTML for all categories
    const categoryDivs = {};
    Object.keys(categories).forEach(catKey => {
        const cat = categories[catKey];
        const panel = document.createElement('div');
        panel.className = `bg-stone-800/40 p-5 rounded-xl border ${cat.borderColor} flex flex-col h-full`;
        panel.innerHTML = `
            <div class="flex items-center gap-2 mb-4 pb-2 border-b border-stone-800">
                <i class="fa-solid ${cat.icon} ${cat.iconColor} text-lg"></i>
                <h4 class="font-bold text-white text-base">${cat.title}</h4>
            </div>
            <div class="space-y-3 flex-1" id="cat-list-${catKey}"></div>
        `;
        container.appendChild(panel);
        categoryDivs[catKey] = panel.querySelector(`#cat-list-${catKey}`);
    });

    // Populate items
    let acquiredCount = 0;
    let totalCount = state.backpack.length;

    state.backpack.forEach(item => {
        if (item.acquired) acquiredCount++;

        const catKey = item.category || 'special';
        const targetList = categoryDivs[catKey];
        if (!targetList) return;

        const div = document.createElement('div');
        div.className = `p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-stone-700/60 flex justify-between items-center group ${item.acquired ? 'bg-green-900/10 border-green-700/50' : 'bg-stone-900/60 border-stone-800'}`;
        div.onclick = () => toggleItem(item.id);

        div.innerHTML = `
            <div class="flex items-start gap-3 flex-1 min-w-0">
                <div class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${item.acquired ? 'bg-green-500 border-green-500' : 'border-stone-600'}">
                    ${item.acquired ? '<i class="fa-solid fa-check text-white text-[10px]"></i>' : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm leading-snug ${item.acquired ? 'text-green-400 line-through decoration-green-500/40' : 'text-stone-200'}">${item.name}</div>
                    ${item.note ? `<div class="text-xs text-stone-500 mt-1 leading-relaxed text-justify">${item.note}</div>` : ''}
                    ${item.link ? `<a href="${item.link}" target="_blank" onclick="event.stopPropagation()" class="mt-1.5 inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 border border-amber-900/65 bg-amber-900/10 px-2 py-0.5 rounded transition-colors"><i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i> 說明連結</a>` : ''}
                </div>
            </div>
            ${item.required ? '<span class="text-[10px] bg-red-950/80 text-red-400 border border-red-900/55 px-1.5 py-0.5 rounded font-bold ml-2 shrink-0">必備</span>' : ''}
        `;
        targetList.appendChild(div);
    });

    // Update progress text
    const progressEl = document.getElementById('inventory-progress-text');
    if (progressEl) {
        progressEl.textContent = `${acquiredCount} / ${totalCount} (${Math.round((acquiredCount / (totalCount || 1)) * 100)}%)`;
        if (acquiredCount === totalCount && totalCount > 0) {
            progressEl.className = 'text-green-400 font-bold animate-[pulse_1s_infinite]';
        } else {
            progressEl.className = 'text-green-400 font-bold';
        }
    }
}

function toggleItem(id) {
    const item = state.backpack.find(i => i.id === id);
    if (item) {
        item.acquired = !item.acquired;
        saveBackpackProgress();
        renderInventory();
        syncJourneyAutoProgress();
    }
}

// --- Chat ---
export async function handleChatSubmit(e) {
    e.preventDefault();
    const text = dom.chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    dom.chatInput.value = '';

    // Mark AI chat task as completed in Journey
    toggleJourneyTask('t3_3', true);

    // Add "typing" indicator
    const typingId = 'typing-' + Date.now();
    addTypingIndicator(typingId);

    try {
        const response = await api.askSimSoldier(text);
        removeTypingIndicator(typingId);
        addMessage(response, 'bot');

        // 若回應中含有 GPS 觸發標記，則自動執行 GPS 定位與醫院計算
        if (response.includes('id="hospital-gps-auto-trigger"')) {
            autoTriggerHospitalGPS();
        }
    } catch (e) {
        removeTypingIndicator(typingId);
        addMessage('班長現在不在營區，請稍後再試。', 'bot');
    }
}

function addTypingIndicator(id) {
    const div = document.createElement('div');
    div.id = id;
    div.className = `flex justify-start items-start gap-2 mb-3 animate-fade-in`;
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-stone-700 flex-shrink-0 border border-green-600 overflow-hidden">
            <img src="assets/images/instructor/instructor_avatar.png" class="w-full h-full object-cover">
        </div>
        <div class="px-3 py-2 rounded-xl bg-stone-700 text-stone-200 rounded-bl-none flex gap-1 items-center shadow-md">
            <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style="animation-delay: 0.1s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style="animation-delay: 0.2s"></span>
        </div>
    `;
    dom.chatMessages.appendChild(div);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    const isUser = sender === 'user';
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2 mb-4 animate-fade-in`;

    const contentClass = isUser
        ? "bg-green-700 text-white rounded-br-none"
        : "bg-stone-700 text-stone-200 rounded-bl-none";

    const avatar = isUser
        ? `<div class="w-8 h-8 rounded-full bg-green-800 flex-shrink-0 border border-green-600 flex items-center justify-center text-[14px] text-white overflow-hidden order-2 shadow-sm">
            <i class="fa-solid fa-user w-4 h-4 flex items-center justify-center"></i>
           </div>`
        : `<div class="w-8 h-8 rounded-full bg-stone-800 flex-shrink-0 border border-green-600 overflow-hidden order-1 shadow-sm">
            <img src="assets/images/instructor/instructor_avatar.png" class="w-full h-full object-cover">
           </div>`;

    div.innerHTML = `
        ${avatar}
        <div class="max-w-[85%] md:max-w-[50%] px-4 py-2 rounded-xl text-sm md:text-base shadow-md ${contentClass} whitespace-pre-wrap leading-snug ${isUser ? 'order-1 mr-1' : 'order-2 ml-1'}">
            ${text.replace(/\n{3,}/g, '\n\n').trim()}
        </div>
    `;
    dom.chatMessages.appendChild(div);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

export function initChatGreeting() {
    dom.chatMessages.innerHTML = '';

    if (!state.userData) {
        addMessage("注意！歡迎來到 SimSoldier 戰情顧問中心，有任何軍旅、生活適應或權益法規問題，隨時向教官發問！", 'bot');
        return;
    }

    const name = state.userData.name || "新兵";
    const scenario = state.userScenario || 'preparing';
    let greeting = "";

    if (scenario === 'enlisted') {
        greeting = `注意！${name}，現役在營期間請保持良好軍紀與作息！操課遇到瓶頸、射擊口訣要領、每日訓練或軍人權益申訴，有任何問題隨時向教官提問！`;
    } else if (scenario === 'deferred') {
        greeting = `您好！${name}，目前系統已為您優先排程「延役專區」。若對延期徵集申請條件、應備證明文件、體位複檢或停役法規有疑問，歡迎隨時在此諮詢！`;
    } else {
        // 準備入營 (preparing) 或預設
        if (state.userData.date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let [y, m, d] = state.userData.date.split(/[-/]/).map(Number);
            if (y < 1911 && y > 0) y += 1911; // 處理民國年轉換
            const targetDate = new Date(y, m - 1, d);
            
            targetDate.setHours(0, 0, 0, 0);

            const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                greeting = `注意！${name}，距離您預計入營尚有 ${diffDays} 天！請務必提前檢查入伍背包與必備證件，有任何新訓生活、折抵流程或準備問題，隨時向教官發問！`;
            } else if (diffDays === 0) {
                greeting = `注意！${name}，今日為入營報到日！請確認身分證、徵集令與隨身證件均已帶齊，祝入伍順利！有任何疑問隨時諮詢！`;
            } else {
                greeting = `注意！${name}，歡迎來到 SimSoldier 戰情中心！即將入伍的新兵請提早做好體能與心理調適，有任何入營疑難雜症歡迎隨時發問！`;
            }
        } else {
            greeting = `注意！${name}，歡迎來到 SimSoldier 戰情中心！即將入伍的新兵請提早做好生活與心理調適，有任何入營疑難雜症歡迎隨時向教官諮詢！`;
        }
    }

    addMessage(greeting, 'bot');
}


// --- Training ---
export function toggleTrainingDay(dayId, cardElement, btnElement) {
    const isCompleted = state.training.completed.includes(dayId);

    if (isCompleted) {
        state.training.completed = state.training.completed.filter(id => id !== dayId);
        cardElement.classList.remove('border-green-500', 'bg-green-900/20');
        cardElement.classList.add('border-l-4', 'border-stone-600');
        if (btnElement) {
            btnElement.className = "btn-confirm-training text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1";
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> 確認';
        }
    } else {
        state.training.completed.push(dayId);
        cardElement.classList.remove('border-stone-600');
        cardElement.classList.add('border-green-500', 'bg-green-900/20');
        if (btnElement) {
            btnElement.className = "btn-confirm-training text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1";
            btnElement.innerHTML = '<i class="fa-solid fa-xmark"></i> 取消';
        }
    }
    updateTrainingProgress();
    syncJourneyAutoProgress();
    updateDailyTaskProgress();
}

function updateTrainingProgress() {
    const totalDays = 5;
    const completedCount = state.training.completed.length;
    const percent = Math.round((completedCount / totalDays) * 100);

    dom.trainingProgressBar.style.width = `${percent}%`;
    dom.trainingProgressText.textContent = `${percent}%`;

    if (percent === 100) dom.trainingProgressBar.classList.add('shadow-[0_0_15px_rgba(34,197,94,0.8)]');
    else dom.trainingProgressBar.classList.remove('shadow-[0_0_15px_rgba(34,197,94,0.8)]');
}

// --- Daily Tasks ---
export function updateDailyTaskProgress() {
    const totalCheckboxes = dom.taskCheckboxes.length;
    const trainingTaskWeight = 1;
    const total = totalCheckboxes + trainingTaskWeight;

    let checked = 0;
    dom.taskCheckboxes.forEach(cb => { if (cb.checked) checked++; });
    if (state.training.completed.length > 0) checked += trainingTaskWeight;

    const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

    dom.dailyTaskBar.style.width = `${percent}%`;
    dom.dailyTaskPercent.textContent = `${percent}%`;

    if (percent === 100) dom.dailyTaskBar.classList.add('shadow-[0_0_10px_rgba(34,197,94,0.8)]');
    else dom.dailyTaskBar.classList.remove('shadow-[0_0_10px_rgba(34,197,94,0.8)]');
}

// --- Docs ---
const unitsData = [
    {
        category: "直轄市",
        items: [
            { name: "新北市政府民政局", phone: "02-29603456", fax: "02-29693894", addr: "新北市板橋區中山路1段161號11、14樓", url: "https://www.ca.ntpc.gov.tw/" },
            { name: "臺北市政府兵役局", phone: "02-23654361~4", fax: "02-23673072", addr: "臺北市中正區羅斯福路四段92號9樓", url: "https://docms.gov.taipei/" },
            { name: "桃園市政府民政局", phone: "03-3322101", fax: "03-3364817", addr: "桃園市桃園區縣府路1號6樓", url: "https://cab.tycg.gov.tw/" },
            { name: "臺中市政府民政局", phone: "04-22289111", fax: "04-22202480", addr: "臺中市臺中港路2段89號6樓", url: "https://www.civil.taichung.gov.tw/" },
            { name: "臺南市政府民政局", phone: "06-2991111", fax: "06-2982560", addr: "臺南市安平區永華路2段6號", url: "https://bca.tainan.gov.tw/" },
            { name: "高雄市兵役處", phone: "07-3373582", fax: "07-3312241", addr: "高雄市苓雅區四維3路2號4樓", url: "https://mildp.kcg.gov.tw/" }
        ]
    },
    {
        category: "各縣政府（本島）",
        items: [
            { name: "宜蘭縣政府民政處", phone: "03-9251000 #3060", fax: "03-9252434", addr: "宜蘭縣宜蘭市縣政北路1號3樓", url: "https://civil.e-land.gov.tw/" },
            { name: "新竹縣政府民政處", phone: "03-5518101#268", fax: "03-5513672", addr: "新竹縣竹北市光明六路10號", url: "https://civil.hsinchu.gov.tw/" },
            { name: "苗栗縣政府民政處", phone: "037-322150", fax: "037-354593", addr: "苗栗縣苗栗市縣府路100號", url: "https://www.miaoli.gov.tw/civil_affairs/" },
            { name: "彰化縣政府民政處", phone: "04-7222151 #0122", fax: "04-7293510", addr: "彰化縣彰化市中山路二段416號7樓", url: "https://civil.chcg.gov.tw/" },
            { name: "南投縣政府民政處", phone: "049-2222106-9", fax: "049-2238404", addr: "南投縣南投市中興路660號", url: "https://www.nantou.gov.tw/big5/bureau/index.php?dptid=376480000au100000" },
            { name: "雲林縣政府民政處", phone: "05-5322154", fax: "05-5352041", addr: "雲林縣斗六市雲林路二段515號", url: "https://civil.yunlin.gov.tw/" },
            { name: "嘉義縣政府民政處", phone: "05-3620123 -460、461", fax: "05-3620399", addr: "嘉義縣太保市祥和新村祥和一路東段1號", url: "https://civil.cyhg.gov.tw/" },
            { name: "屏東縣政府民政處", phone: "08-7324147", fax: "08-7331538", addr: "屏東縣屏東市自由路527號", url: "https://www.pthg.gov.tw/plancab/" },
            { name: "臺東縣政府民政處", phone: "089-326141", fax: "089-340560", addr: "臺東縣臺東市中山路276號", url: "https://ttca.taitung.gov.tw/Default.aspx" },
            { name: "花蓮縣政府民政處", phone: "03-8232047、8221894 #374、375", fax: "03-8230576", addr: "花蓮縣花蓮市府後路6號", url: "https://ca.hl.gov.tw/" }
        ]
    },
    {
        category: "各市政府及離島",
        items: [
            { name: "基隆市政府民政處", phone: "02-24201122 #2304~2311", fax: "02-24668739", addr: "基隆市中正區正信路205號2樓", url: "https://www.klcg.gov.tw/tw/civil" },
            { name: "新竹市政府民政處", phone: "03-5216121 #314~319", fax: "03-5214703", addr: "新竹市中正路120號", url: "https://dep-civil.hccg.gov.tw/" },
            { name: "嘉義市政府民政處", phone: "05-2254321", fax: "05-2259885", addr: "嘉義市中山路199號", url: "https://civil.chiayi.gov.tw/" },
            { name: "澎湖縣政府民政處", phone: "06-9274400", fax: "06-9274701", addr: "澎湖縣馬公市治平路32號", url: "https://www.penghu.gov.tw/civil/" },
            { name: "金門縣政府民政處", phone: "082-325753", fax: "082-322613", addr: "金門縣金城鎮民生路60號", url: "https://kccad.kinmen.gov.tw/" },
            { name: "連江縣政府民政處", phone: "0836-22485", fax: "0836-22209", addr: "連江縣南竿鄉介壽村76號", url: "https://www.matsu.gov.tw/" }
        ]
    }
];

function initDocsTable() {
    let tableHtml = '<div class="overflow-x-auto"><table class="w-full text-left text-xs text-stone-300 border-collapse min-w-[500px]">';
    tableHtml += '<thead><tr class="bg-stone-800 text-stone-400 border-b border-stone-700"><th class="p-2">單位</th><th class="p-2">電話</th><th class="p-2">傳真</th><th class="p-2">地址</th><th class="p-2">網址</th></tr></thead><tbody>';

    unitsData.forEach(group => {
        tableHtml += `<tr class="bg-stone-900 border-b border-stone-700"><td colspan="5" class="p-2 text-stone-300 font-bold bg-stone-900/80"><i class="fa-solid fa-layer-group text-stone-500 mr-2"></i>${group.category}</td></tr>`;
        group.items.forEach(u => {
            tableHtml += `<tr class="border-b border-stone-800 hover:bg-stone-800/50">
                <td class="p-2 text-green-400 font-bold pl-6 border-l-2 border-stone-700">${u.name}</td>
                <td class="p-2">${u.phone}</td>
                <td class="p-2 opacity-60 text-[10px] hidden md:table-cell">${u.fax}</td>
                <td class="p-2">${u.addr}</td>
                <td class="p-2">${u.url ? `<a href="${u.url}" target="_blank" class="text-blue-400 hover:text-blue-300"><i class="fa-solid fa-link"></i></a>` : ''}</td>
            </tr>`;
        });
    });
    tableHtml += '</tbody></table></div>';
    DOCS_DATA.units.content = tableHtml;
}
// Init the table logic
initDocsTable();

export function openDocsModal(type) {
    const data = DOCS_DATA[type];
    if (!data) return;

    dom.docsModalTitle.textContent = data.title;
    dom.docsModalContent.innerHTML = data.content;

    if (data.link) {
        dom.docsModalLink.href = data.link;
        dom.docsModalLink.classList.remove('hidden');
    } else {
        dom.docsModalLink.classList.add('hidden');
    }
    dom.modalDocs.classList.remove('hidden');
}

// --- Video ---
export function playVideo(data) {
    dom.playerTag.textContent = data.tag;
    dom.playerTag.className = `px-3 py-1 rounded text-sm mb-3 inline-block backdrop-blur-md text-white ${data.color}`;
    dom.playerTitle.textContent = data.title;
    dom.playerDesc.textContent = data.desc;

    dom.videoPlayer.classList.remove('hidden');
    dom.videoGallery.classList.add('hidden');
    dom.btnCloseVideo.classList.add('hidden');
}

export function closeVideo() {
    dom.videoPlayer.classList.add('hidden');
    dom.videoGallery.classList.remove('hidden');
    dom.btnCloseVideo.classList.remove('hidden');
}

// --- Calendar ---
export function renderCalendar() {
    if (!state.userData || !state.userData.date) return;

    const today = new Date();
    
    let [y, m, d] = state.userData.date.split(/[-/]/).map(Number);
    if (y < 1911 && y > 0) y += 1911; // 處理民國年轉換
    const targetDate = new Date(y, m - 1, d);
    
    const year = today.getFullYear();
    const month = today.getMonth();

    dom.calendarMonthYear.textContent = `${year} / ${(month + 1).toString().padStart(2, '0')}`;
    dom.calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        dom.calendarGrid.appendChild(document.createElement('div'));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const div = document.createElement('div');
        div.textContent = d;
        div.className = 'calendar-day';
        if (d === today.getDate() && month === today.getMonth()) div.classList.add('bg-green-500', 'text-white', 'rounded-full', 'font-bold');
        if (d === targetDate.getDate() && month === targetDate.getMonth()) div.classList.add('bg-red-600', 'text-white', 'rounded-full', 'font-bold');
        dom.calendarGrid.appendChild(div);
    }
}

// --- Countdown ---
export function updateCountdown() {
    if (!state.userData || !state.userData.date) return;
    const today = new Date();
    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);

    let [y, m, d] = state.userData.date.split(/[-/]/).map(Number);
    if (y < 1911 && y > 0) y += 1911; // 處理民國年轉換

    const enlistmentDate = new Date(y, m - 1, d);
    enlistmentDate.setHours(0, 0, 0, 0);

    let targetDate = enlistmentDate;
    let isDischargeCountdown = false;

    // Check if enlistment date has passed or is today
    if (today > enlistmentDate) {
        // Switch to Discharge Countdown
        isDischargeCountdown = true;
        // Calculate Discharge Date (Enlistment + 4 months)
        // Note: Actual service time might vary, assuming regular 4 months here
        const dischargeDate = new Date(enlistmentDate);
        dischargeDate.setMonth(dischargeDate.getMonth() + 4);
        targetDate = dischargeDate;
    }

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Fake Countdown Override (Only applies if not in discharge mode and tempCountdown is active)
    const displayDays = (state.userData.tempCountdown && !isDischargeCountdown) ? 30 : Math.max(0, diffDays);

    dom.daysLeftCount.textContent = displayDays;

    if (isDischargeCountdown) {
        dom.countdownTitle.textContent = diffDays <= 0 ? "已退伍" : "離營倒數";
        if (diffDays <= 0) {
            const t3_4 = findTaskById('t3_4');
            if (t3_4 && !t3_4.completed) {
                t3_4.completed = true;
                saveJourneyProgress();
                renderJourneySystem();
                openServiceCompletedModal();
            }
        }
    } else {
        dom.countdownTitle.textContent = diffDays <= 0 && !state.userData.tempCountdown ? "入營日" : "距離入營";
    }

    // Chart Logic
    const maxDays = isDischargeCountdown ? 120 : 365; // 4 months for discharge, 1 year for enlistment prep
    let percentage = (displayDays / maxDays) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    const circumference = 283;
    const dashOffset = ((100 - percentage) / 100) * circumference;
    dom.countdownRing.style.strokeDashoffset = dashOffset;

    let colorClass = '';
    let glowClass = '';
    let strokeHex = '';

    if (displayDays <= 30) {
        strokeHex = '#ef4444';
        glowClass = 'glow-red';
    } else if (displayDays <= 90) {
        strokeHex = '#f97316';
        glowClass = 'glow-orange';
    } else {
        strokeHex = '#22c55e';
        glowClass = 'glow-green';
    }

    dom.countdownRing.setAttribute('stroke', strokeHex);
}

// --- Date Input Helper (Ported from auth.js) ---
export function setupDateInputs() {
    const inputs = document.querySelectorAll('.date-input');
    const pickers = document.querySelectorAll('.hidden-picker');

    // Sync Picker -> Inputs
    pickers.forEach(picker => {
        // Remove old listeners to prevent duplicates if called multiple times
        // actually standard addEventListener adds multiples, but we only call init once usually.
        // For safety/simplicity in this context, just add.
        picker.onchange = (e) => {
            if (!e.target.value) return;
            // e.target.value is YYYY-MM-DD
            const [y, m, d] = e.target.value.split('-');

            // Derive ID prefix from picker ID (picker-input-date -> input-date)
            const prefix = e.target.id.replace('picker-', '');

            const elY = document.getElementById(`${prefix}-y`);
            const elM = document.getElementById(`${prefix}-m`);
            const elD = document.getElementById(`${prefix}-d`);

            if (elY) elY.value = y;
            if (elM) elM.value = m;
            if (elD) elD.value = d;
        };
    });

    inputs.forEach(input => {
        // clear old to be safe if possible, or just overwrite via onprop

        // 1. Input Event: Restrict numbers & Auto-jump
        input.oninput = (e) => {
            // Remove non-numeric characters
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            const maxLength = parseInt(e.target.getAttribute('maxlength'));
            const nextId = e.target.getAttribute('data-next');

            if (e.target.value.length >= maxLength) {
                if (nextId) document.getElementById(nextId).focus();
            }
        };

        // 2. Keydown Event: Backspace navigation
        input.onkeydown = (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0) {
                const prevId = e.target.getAttribute('data-prev');
                if (prevId) document.getElementById(prevId).focus();
            }
        };

        // 3. Blur Event: Simple Range Validation
        input.onblur = (e) => {
            const val = parseInt(e.target.value);
            if (isNaN(val)) return;

            if (e.target.id.endsWith('-m')) {
                if (val < 1) e.target.value = '01';
                if (val > 12) e.target.value = '12';
                e.target.value = e.target.value.padStart(2, '0');
            }
            if (e.target.id.endsWith('-d')) {
                if (val < 1) e.target.value = '01';
                if (val > 31) e.target.value = '31';
                e.target.value = e.target.value.padStart(2, '0');
            }
        };
    });
}

export function startCountdownTimer() {
    setInterval(updateCountdown, 1000 * 60 * 60);
    setTimeout(updateCountdown, 100);
}

// --- Hospital GPS Logic ---
const HOSPITALS_DATA = [
    { name: "臺北市立聯合醫院仁愛院區", lat: 25.0378, lng: 121.5438 },
    { name: "臺北市立聯合醫院和平婦幼院區", lat: 25.0347, lng: 121.5054 },
    { name: "臺北市立聯合醫院忠孝院區", lat: 25.0484, lng: 121.5835 },
    { name: "臺北市立聯合醫院中興院區", lat: 25.0503, lng: 121.5094 },
    { name: "臺北市立聯合醫院陽明院區", lat: 25.1027, lng: 121.5317 },
    { name: "臺北市立萬芳醫院", lat: 25.0001, lng: 121.5583 },
    { name: "三軍總醫院松山分院", lat: 25.0583, lng: 121.5592 },
    { name: "臺大醫院", lat: 25.0416, lng: 121.5174 },
    { name: "臺北榮民總醫院", lat: 25.1203, lng: 121.5202 },
    { name: "三軍總醫院", lat: 25.0685, lng: 121.5908 },
    { name: "高雄市立民生醫院", lat: 22.6267, lng: 120.3236 },
    { name: "高雄市立聯合醫院", lat: 22.6565, lng: 120.2863 },
    { name: "國軍高雄總醫院", lat: 22.6260, lng: 120.3398 },
    { name: "國軍高雄總醫院左營分院", lat: 22.6934, lng: 120.2946 },
    { name: "國立陽明交通大學附設醫院", lat: 24.7523, lng: 121.7588 },
    { name: "臺北榮民總醫院員山分院", lat: 24.7431, lng: 121.7169 },
    { name: "衛生福利部基隆醫院", lat: 25.1287, lng: 121.7456 },
    { name: "衛生福利部臺北醫院", lat: 25.0427, lng: 121.4623 },
    { name: "新北市立聯合醫院", lat: 25.0632, lng: 121.4878 },
    { name: "衛生福利部桃園醫院", lat: 24.9784, lng: 121.2678 },
    { name: "國軍桃園總醫院", lat: 24.8624, lng: 121.2407 },
    { name: "臺北榮民總醫院桃園分院", lat: 25.0041, lng: 121.3275 },
    { name: "臺大醫院新竹分院", lat: 24.8157, lng: 120.9774 },
    { name: "臺大醫院竹東分院", lat: 24.7001, lng: 121.0963 },
    { name: "臺北榮民總醫院新竹分院", lat: 24.7088, lng: 121.0991 },
    { name: "衛生福利部苗栗醫院", lat: 24.5772, lng: 120.8329 },
    { name: "衛生福利部豐原醫院", lat: 24.2404, lng: 120.7247 },
    { name: "衛生福利部臺中醫院", lat: 24.1396, lng: 120.6781 },
    { name: "國軍臺中總醫院", lat: 24.1481, lng: 120.7354 },
    { name: "衛生福利部南投醫院", lat: 23.9135, lng: 120.6865 },
    { name: "臺中榮民總醫院埔里分院", lat: 23.9744, lng: 120.9839 },
    { name: "衛生福利部彰化醫院", lat: 23.9619, lng: 120.5511 },
    { name: "臺大醫院雲林分院", lat: 23.7144, lng: 120.5441 },
    { name: "衛生福利部嘉義醫院", lat: 23.4819, lng: 120.4286 },
    { name: "臺中榮民總醫院嘉義分院", lat: 23.4795, lng: 120.4187 },
    { name: "衛生福利部朴子醫院", lat: 23.4619, lng: 120.2478 },
    { name: "衛生福利部臺南醫院", lat: 22.9954, lng: 120.2075 },
    { name: "衛生福利部新營醫院", lat: 23.3086, lng: 120.3164 },
    { name: "高雄榮民總醫院臺南分院", lat: 23.0039, lng: 120.2447 },
    { name: "衛生福利部旗山醫院", lat: 22.8906, lng: 120.4772 },
    { name: "衛生福利部屏東醫院", lat: 22.6744, lng: 120.4958 },
    { name: "高雄榮民總醫院屏東分院", lat: 22.6175, lng: 120.5484 },
    { name: "衛生福利部臺東醫院", lat: 22.7539, lng: 121.1506 },
    { name: "衛生福利部花蓮醫院", lat: 23.9778, lng: 121.6136 },
    { name: "國軍花蓮總醫院", lat: 24.0101, lng: 121.6178 },
    { name: "臺北榮民總醫院玉里分院", lat: 23.3444, lng: 121.3197 },
    { name: "三軍總醫院澎湖分院附設民眾診療服務處", lat: 23.5623, lng: 119.5794 },
    { name: "衛生福利部澎湖醫院", lat: 23.5656, lng: 119.5647 },
    { name: "衛生福利部金門醫院", lat: 24.4398, lng: 118.4165 },
    { name: "連江縣立醫院", lat: 26.1587, lng: 119.9389 },
    { name: "臺中榮民總醫院", lat: 24.1818, lng: 120.6052 },
    { name: "成大醫院", lat: 23.0017, lng: 120.2223 },
    { name: "高雄榮民總醫院", lat: 22.6781, lng: 120.3231 },
    { name: "慈濟綜合醫院", lat: 23.9928, lng: 121.6001 }
];

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function updateHospitalContainer(html) {
    const containers = document.querySelectorAll('#hospital-gps-auto-trigger');
    if (containers.length > 0) {
        const target = containers[containers.length - 1];
        target.innerHTML = html;
        target.removeAttribute('id'); // Remove id to prevent modifying it again
        target.className = "mt-4 space-y-2"; // Apply clean styling
        // Scroll to bottom so buttons are visible
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    }
}

function autoTriggerHospitalGPS() {
    if (!navigator.geolocation) {
        updateHospitalContainer('<div class="text-sm text-red-400"><i class="fa-solid fa-triangle-exclamation"></i> 您的瀏覽器不支援 GPS 功能，無法尋找最近醫院。</div>');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const withDist = HOSPITALS_DATA.map(h => ({
                ...h,
                dist: getDistance(userLat, userLng, h.lat, h.lng)
            }));

            withDist.sort((a, b) => a.dist - b.dist);
            const top3 = withDist.slice(0, 3);

            let html = '<div class="text-sm font-bold text-stone-300 mb-2 mt-2"><i class="fa-solid fa-location-dot text-green-500"></i> 離您最近的 3 間體檢醫院：</div>';
            html += '<div class="flex flex-col gap-2">';
            top3.forEach(h => {
                const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`;
                html += `
                <a href="${mapLink}" target="_blank" class="bg-blue-800 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm shadow-md inline-flex items-center gap-2 border border-blue-600">
                    <i class="fa-solid fa-map-location-dot"></i> ${h.name} (${h.dist.toFixed(1)} km)
                </a>`;
            });
            html += '</div>';
            updateHospitalContainer(html);
        },
        (error) => {
            updateHospitalContainer('<div class="text-sm text-red-400"><i class="fa-solid fa-triangle-exclamation"></i> 無法取得您的 GPS 位置。請確認是否已允許位置存取權限。</div>');
        },
        { timeout: 10000 }
    );
}

// ==========================================
// --- 服役歷程進度系統 (Service Journey System) ---
// ==========================================

export function initJourneySystem() {
    // 1. Load saved tasks or initialize from state
    try {
        const saved = localStorage.getItem('simSoldier_journeyTasks');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with INITIAL_JOURNEY_STAGES to ensure structure integrity
            state.journeyStages = INITIAL_JOURNEY_STAGES.map(stage => {
                const savedStage = parsed.find(s => s.id === stage.id);
                return {
                    ...stage,
                    tasks: stage.tasks.map(task => {
                        const savedTask = savedStage?.tasks?.find(t => t.id === task.id);
                        return {
                            ...task,
                            completed: savedTask ? !!savedTask.completed : false
                        };
                    })
                };
            });
        } else {
            state.journeyStages = JSON.parse(JSON.stringify(INITIAL_JOURNEY_STAGES));
        }
    } catch (e) {
        console.error('Error loading journey tasks:', e);
        state.journeyStages = JSON.parse(JSON.stringify(INITIAL_JOURNEY_STAGES));
    }

    // 2. Setup Stage Tabs Listener
    setupJourneyEventListeners();

    // 3. Auto sync with backpack / training / scenario
    syncJourneyAutoProgress(false);
    applyScenarioTaskProgression(state.userScenario, false);

    // 4. Initial Render
    renderJourneySystem();
}

/**
 * 依據身分情境自動推進任務進度
 * 當選擇「正在入營」(enlisted) 時，自動將「兵役整備期」(stage_1) 與「入營前適應期」(stage_2) 的任務標示為完成
 * @param {string} scenarioKey - 身分情境
 * @param {boolean} shouldRender - 是否立即重新渲染 UI
 */
export function applyScenarioTaskProgression(scenarioKey = state.userScenario, shouldRender = true) {
    if (!state.journeyStages || state.journeyStages.length === 0) return;

    if (scenarioKey === 'enlisted') {
        let hasChanges = false;
        state.journeyStages.forEach(stage => {
            if (stage.id === 'stage_1' || stage.id === 'stage_2') {
                stage.tasks.forEach(task => {
                    if (!task.completed) {
                        task.completed = true;
                        hasChanges = true;
                    }
                });
            }
        });
        if (hasChanges) {
            saveJourneyProgress();
            if (shouldRender) renderJourneySystem();
        }
    }
}

export function setupJourneyEventListeners() {
    // Reset Button
    if (dom.btnResetJourneyTasks) {
        dom.btnResetJourneyTasks.onclick = () => {
            if (confirm('確定要重置所有服役歷程階段任務進度嗎？')) {
                resetJourneyTasks();
            }
        };
    }

    // Stage filter tabs
    document.querySelectorAll('.journey-stage-tab').forEach(btn => {
        btn.onclick = () => {
            const stageId = btn.dataset.stage;
            setJourneyActiveStage(stageId);
        };
    });

    // Task Detail Modal Close
    if (dom.btnCloseTaskDetail) {
        dom.btnCloseTaskDetail.onclick = closeTaskDetailModal;
    }
    if (dom.modalTaskDetail) {
        dom.modalTaskDetail.onclick = (e) => {
            if (e.target === dom.modalTaskDetail) closeTaskDetailModal();
        };
    }

    // Service Completed Modal Close
    if (dom.btnCloseServiceCompletedModal) {
        dom.btnCloseServiceCompletedModal.onclick = closeServiceCompletedModal;
    }
    if (dom.modalServiceCompleted) {
        dom.modalServiceCompleted.onclick = (e) => {
            if (e.target === dom.modalServiceCompleted) closeServiceCompletedModal();
        };
    }

    // Auto complete tasks on tab switch (e.g. Rhapsody / Delay)
    window.addEventListener('tabSwitched', (e) => {
        if (e.detail === 'rhapsody') {
            toggleJourneyTask('t2_4', true);
        } else if (e.detail === 'delay') {
            toggleJourneyTask('t1_4', true);
        }
    });

    // Auto complete task t1_6 on locationSelected
    window.addEventListener('locationSelected', () => {
        toggleJourneyTask('t1_6', true);
    });

    window.toggleJourneyTask = toggleJourneyTask;
}

let activeDetailTaskId = null;

export function openTaskDetailModal(taskId) {
    let targetTask = null;
    let targetStage = null;

    for (const stage of state.journeyStages) {
        const found = stage.tasks.find(t => t.id === taskId);
        if (found) {
            targetTask = found;
            targetStage = stage;
            break;
        }
    }

    if (!targetTask || !dom.modalTaskDetail) return;
    activeDetailTaskId = taskId;

    // Set UI
    if (dom.taskDetailStageBadge) {
        dom.taskDetailStageBadge.textContent = `STAGE 0${targetStage.number} • ${targetStage.title}`;
    }
    if (dom.taskDetailTitle) {
        dom.taskDetailTitle.textContent = targetTask.title;
    }
    if (dom.taskDetailDesc) {
        dom.taskDetailDesc.textContent = targetTask.detail || targetTask.note || '暫無詳細說明。';
    }
    if (dom.taskDetailNote) {
        dom.taskDetailNote.textContent = targetTask.note || '請依照指引完成相關作業。';
    }

    // Type badge
    if (dom.taskDetailTypeBadge) {
        dom.taskDetailTypeBadge.textContent = targetTask.typeName;
    }

    // Status badge & toggle button
    updateDetailModalStatusUI(targetTask);

    // Action button
    if (dom.btnTaskDetailAction) {
        if (targetTask.linkTab) {
            dom.btnTaskDetailAction.classList.remove('hidden');
            const tabNames = {
                inventory: '前往入伍背包',
                training: '前往今日課表',
                shooting: '前往射擊口訣',
                quiz: '前往天兵課堂',
                chat: targetTask.id === 't1_2' ? '諮詢體檢地點' : '諮詢 AI 教官',
                locations: '前往新訓地點',
                delay: '前往延役專區',
                docs: '查看法規與折抵',
                game: '前往模擬籤筒',
                rhapsody: '前往大兵狂想曲'
            };
            dom.btnTaskDetailAction.innerHTML = `<span>${tabNames[targetTask.linkTab] || '前往查看'}</span> <i class="fa-solid fa-arrow-right text-[10px] ml-1"></i>`;
            dom.btnTaskDetailAction.onclick = () => {
                closeTaskDetailModal();
                switchTab(targetTask.linkTab);
                if (targetTask.prompt) {
                    fillAndFocusChatPrompt(targetTask.prompt);
                }
            };
        } else if (targetTask.linkUrl) {
            dom.btnTaskDetailAction.classList.remove('hidden');
            dom.btnTaskDetailAction.innerHTML = `<span>開啟線上申報</span> <i class="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1"></i>`;
            dom.btnTaskDetailAction.onclick = () => {
                window.open(targetTask.linkUrl, '_blank');
            };
        } else {
            dom.btnTaskDetailAction.classList.add('hidden');
        }
    }

    // Toggle button listener
    if (dom.btnToggleTaskDetailStatus) {
        dom.btnToggleTaskDetailStatus.onclick = () => {
            toggleJourneyTask(taskId);
            const updated = findTaskById(taskId);
            if (updated) updateDetailModalStatusUI(updated);
        };
    }

    dom.modalTaskDetail.classList.remove('hidden');
}

function updateDetailModalStatusUI(task) {
    if (dom.taskDetailStatusBadge) {
        if (task.completed) {
            dom.taskDetailStatusBadge.className = 'text-xs px-2.5 py-0.5 rounded border font-bold bg-emerald-950 text-emerald-300 border-emerald-700 flex items-center gap-1';
            dom.taskDetailStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> 已完成';
        } else {
            dom.taskDetailStatusBadge.className = 'text-xs px-2.5 py-0.5 rounded border font-bold bg-stone-800 text-stone-300 border-stone-700 flex items-center gap-1';
            dom.taskDetailStatusBadge.innerHTML = '<i class="fa-regular fa-circle"></i> 進行中';
        }
    }

    if (dom.btnToggleTaskDetailStatus) {
        if (task.isAutoOnly) {
            if (task.completed) {
                dom.btnToggleTaskDetailStatus.className = 'px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 bg-emerald-950/40 text-emerald-300 border-emerald-800 cursor-not-allowed';
                dom.btnToggleTaskDetailStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>離營倒數已歸零（已達成）</span>';
            } else {
                dom.btnToggleTaskDetailStatus.className = 'px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 bg-stone-800/70 text-stone-400 border-stone-700 cursor-not-allowed';
                dom.btnToggleTaskDetailStatus.innerHTML = '<i class="fa-regular fa-clock"></i> <span>待離營倒數歸零時達成</span>';
            }
            dom.btnToggleTaskDetailStatus.onclick = null;
        } else if (task.completed) {
            dom.btnToggleTaskDetailStatus.className = 'px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/80';
            dom.btnToggleTaskDetailStatus.innerHTML = '<i class="fa-solid fa-rotate-left"></i> <span>取消完成狀態</span>';
            dom.btnToggleTaskDetailStatus.onclick = () => {
                toggleJourneyTask(task.id);
                const updated = findTaskById(task.id);
                if (updated) updateDetailModalStatusUI(updated);
            };
        } else {
            dom.btnToggleTaskDetailStatus.className = 'px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 bg-emerald-900/70 text-emerald-200 border-emerald-700 hover:bg-emerald-800';
            dom.btnToggleTaskDetailStatus.innerHTML = '<i class="fa-solid fa-check"></i> <span>標記為已完成</span>';
            dom.btnToggleTaskDetailStatus.onclick = () => {
                toggleJourneyTask(task.id);
                const updated = findTaskById(task.id);
                if (updated) updateDetailModalStatusUI(updated);
            };
        }
    }
}

export function closeTaskDetailModal() {
    const modal = document.getElementById('modal-task-detail') || dom.modalTaskDetail;
    if (modal) {
        modal.classList.add('hidden');
    }
    activeDetailTaskId = null;
}

export function openServiceCompletedModal() {
    const modal = document.getElementById('modal-service-completed') || dom.modalServiceCompleted;
    const nameEl = document.getElementById('completed-modal-username') || dom.completedModalUsername;
    if (modal) {
        if (nameEl && state.userData && state.userData.name) {
            nameEl.textContent = state.userData.name;
        }
        modal.classList.remove('hidden');
    }
}

export function closeServiceCompletedModal() {
    const modal = document.getElementById('modal-service-completed') || dom.modalServiceCompleted;
    if (modal) {
        modal.classList.add('hidden');
    }
}

export function setJourneyActiveStage(stageId) {
    state.activeJourneyStage = stageId;
    renderJourneySystem();
}

export function resetJourneyTasks() {
    state.journeyStages.forEach(stage => {
        stage.tasks.forEach(task => {
            task.completed = false;
        });
    });
    saveJourneyProgress();
    renderJourneySystem();
}

export function saveJourneyProgress() {
    try {
        localStorage.setItem('simSoldier_journeyTasks', JSON.stringify(state.journeyStages));
    } catch (e) {
        console.error('Error saving journey progress:', e);
    }
}

export function toggleJourneyTask(taskId, manualState = null, force = false) {
    if (!state.journeyStages || state.journeyStages.length === 0) return;

    let targetTask = null;
    let targetStage = null;

    for (const stage of state.journeyStages) {
        const found = stage.tasks.find(t => t.id === taskId);
        if (found) {
            targetTask = found;
            targetStage = stage;
            break;
        }
    }

    if (!targetTask) return;
    if (targetTask.isAutoOnly && !force) return;

    const previousState = targetTask.completed;
    targetTask.completed = manualState !== null ? manualState : !targetTask.completed;

    saveJourneyProgress();
    renderJourneySystem();

    // Trigger Service Completion Modal if t3_4 is newly completed
    if (!previousState && targetTask.completed && targetTask.id === 't3_4') {
        openServiceCompletedModal();
    }
}

export function syncJourneyAutoProgress(shouldRender = true) {
    if (!state.journeyStages || state.journeyStages.length === 0) return;
    let hasChanges = false;
    let triggerCompletedModal = false;

    // Check Backpack: if 8 required items or >= 8 items acquired, auto mark t1_5
    if (state.backpack && state.backpack.length > 0) {
        const requiredAcquired = state.backpack.filter(i => i.required && i.acquired).length;
        const totalAcquired = state.backpack.filter(i => i.acquired).length;
        if (requiredAcquired >= 6 || totalAcquired >= 8) {
            const t1_5 = findTaskById('t1_5');
            if (t1_5 && !t1_5.completed) {
                t1_5.completed = true;
                hasChanges = true;
            }
        }
    }

    // Check Training: if any day completed, auto mark t2_1
    if (state.training && state.training.completed && state.training.completed.length > 0) {
        const t2_1 = findTaskById('t2_1');
        if (t2_1 && !t2_1.completed) {
            t2_1.completed = true;
            hasChanges = true;
        }
    }

    // Check Discharge / Departure Countdown for t3_4
    if (state.userData && state.userData.date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const enlistmentDate = new Date(state.userData.date);
        enlistmentDate.setHours(0, 0, 0, 0);
        if (today > enlistmentDate) {
            const dischargeDate = new Date(enlistmentDate);
            dischargeDate.setMonth(dischargeDate.getMonth() + 4);
            const diffTime = dischargeDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 0) {
                const t3_4 = findTaskById('t3_4');
                if (t3_4 && !t3_4.completed) {
                    t3_4.completed = true;
                    hasChanges = true;
                    triggerCompletedModal = true;
                }
            }
        }
    }

    if (hasChanges) {
        saveJourneyProgress();
        if (shouldRender) renderJourneySystem();
        if (triggerCompletedModal) openServiceCompletedModal();
    }
}

function findTaskById(taskId) {
    if (!state.journeyStages) return null;
    for (const stage of state.journeyStages) {
        const found = stage.tasks.find(t => t.id === taskId);
        if (found) return found;
    }
    return null;
}

export function renderJourneySystem() {
    if (!state.journeyStages || state.journeyStages.length === 0) return;

    // Calculate totals
    let totalTasks = 0;
    let completedTasks = 0;

    state.journeyStages.forEach(stage => {
        stage.tasks.forEach(task => {
            totalTasks++;
            if (task.completed) completedTasks++;
        });
    });

    const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // 1. Dynamic Element Lookup for 100% Reliability
    const progressBar = document.getElementById('journey-progress-bar') || dom.journeyProgressBar;
    const progressPercent = document.getElementById('journey-progress-percent') || dom.journeyProgressPercent;
    const tasksCount = document.getElementById('tasks-count') || dom.tasksCount;
    const dailyTaskBar = document.getElementById('daily-task-bar') || dom.dailyTaskBar;
    const dailyTaskPercent = document.getElementById('daily-task-percent') || dom.dailyTaskPercent;

    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    if (progressPercent) {
        progressPercent.textContent = `${percent}%`;
    }

    // Also sync daily task bar in calendar widget
    if (dailyTaskBar) {
        dailyTaskBar.style.width = `${percent}%`;
    }
    if (dailyTaskPercent) {
        dailyTaskPercent.textContent = `${percent}%`;
    }

    if (tasksCount) {
        tasksCount.textContent = `已完成 ${completedTasks} / ${totalTasks} 項 (${percent}%)`;
    }

    // 3. Render Stage Tasks List
    renderJourneyTasksList();

    // 4. Update Active Stage Filter Buttons UI
    updateStageFilterTabsUI();
}

function renderJourneyTasksList() {
    const container = document.getElementById('tasks-list') || dom.tasksList;
    if (!container) return;
    container.innerHTML = '';

    const currentFilter = state.activeJourneyStage || 'all';

    const stagesToRender = currentFilter === 'all'
        ? state.journeyStages
        : state.journeyStages.filter(s => s.id === currentFilter);

    if (stagesToRender.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-stone-500 text-sm">無對應階段任務</div>`;
        return;
    }

    stagesToRender.forEach(stage => {
        // Stage Header
        const stageHeader = document.createElement('div');
        stageHeader.className = 'pt-2 pb-1 flex items-center justify-between border-b border-stone-800 mb-2';
        stageHeader.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                <span class="text-xs font-bold uppercase tracking-wider text-stone-300">階段 0${stage.number}：${stage.title}</span>
                <span class="text-[11px] text-stone-500">(${stage.period})</span>
            </div>
            <span class="text-xs font-mono text-stone-400 font-bold">${stage.tasks.filter(t => t.completed).length}/${stage.tasks.length}</span>
        `;
        container.appendChild(stageHeader);

        // Tasks in this stage
        stage.tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 group ${task.completed
                    ? 'bg-emerald-950/15 border-emerald-800/40 hover:bg-emerald-950/25'
                    : 'bg-stone-800/50 border-stone-700/60 hover:bg-stone-800/80 hover:border-stone-600'
                }`;

            // Type badge color mapping
            const typeBadgeColors = {
                main: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
                equipment: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
                prep: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
                training: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
                quiz: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
                unit: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
                daily: 'bg-teal-950/80 text-teal-300 border-teal-700/60',
                discharge: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
                game: 'bg-orange-950/80 text-orange-300 border-orange-700/60',
                media: 'bg-pink-950/80 text-pink-300 border-pink-700/60'
            };
            const badgeClass = typeBadgeColors[task.type] || 'bg-stone-800 text-stone-300 border-stone-700';

            // Action Button
            let actionBtnHtml = '';
            if (task.linkTab) {
                const tabNames = {
                    inventory: '前往入伍背包',
                    training: '前往今日課表',
                    shooting: '前往射擊口訣',
                    quiz: '前往天兵課堂',
                    chat: task.id === 't1_2' ? '諮詢體檢地點' : '諮詢 AI 教官',
                    locations: '前往新訓地點',
                    delay: '前往延役專區',
                    docs: '查看法規與折抵',
                    game: '前往模擬籤筒',
                    rhapsody: '前往大兵狂想曲'
                };
                const label = tabNames[task.linkTab] || '前往查看';
                actionBtnHtml = `
                    <button class="btn-task-action text-xs px-2.5 py-1 rounded bg-stone-700/80 hover:bg-green-700 text-stone-200 hover:text-white border border-stone-600 hover:border-green-500 transition-colors flex items-center gap-1 font-medium whitespace-nowrap"
                        data-tab="${task.linkTab}" data-task-id="${task.id}">
                        <span>${label}</span>
                        <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                `;
            } else if (task.linkUrl) {
                actionBtnHtml = `
                    <a href="${task.linkUrl}" target="_blank" rel="noopener noreferrer"
                        class="text-xs px-2.5 py-1 rounded bg-stone-700/80 hover:bg-blue-700 text-stone-200 hover:text-white border border-stone-600 hover:border-blue-500 transition-colors flex items-center gap-1 font-medium whitespace-nowrap">
                        <span>線上申報</span>
                        <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>
                `;
            }

            const isAutoOnly = !!task.isAutoOnly;
            const checkboxHtml = isAutoOnly
                ? `<input type="checkbox" class="task-journey-checkbox w-5 h-5 mt-0.5 accent-green-600 rounded cursor-not-allowed opacity-60 shrink-0" ${task.completed ? 'checked' : ''} disabled data-task-id="${task.id}">`
                : `<input type="checkbox" class="task-journey-checkbox w-5 h-5 mt-0.5 accent-green-600 rounded cursor-pointer shrink-0" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">`;

            taskEl.innerHTML = `
                <div class="flex items-start gap-3 flex-1 cursor-pointer task-content-area">
                    ${checkboxHtml}
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                            <span class="text-[10px] px-2 py-0.5 rounded border font-bold ${badgeClass}">
                                ${task.typeName}
                            </span>
                            <span class="font-bold text-sm text-stone-100 group-hover:text-green-400 transition-colors ${task.completed ? 'line-through text-stone-400' : ''}">
                                ${task.title}
                            </span>
                            <span class="text-[10px] text-stone-500 hidden sm:inline-block">
                                <i class="fa-solid fa-circle-info"></i> 點擊查看詳情
                            </span>
                        </div>
                        <p class="text-xs text-stone-400 leading-relaxed">${task.note || ''}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-center pl-8 sm:pl-0">
                    ${actionBtnHtml}
                </div>
            `;

            // Bind checkbox change
            const checkbox = taskEl.querySelector('.task-journey-checkbox');
            if (checkbox && !isAutoOnly) {
                checkbox.addEventListener('change', () => {
                    toggleJourneyTask(task.id, checkbox.checked);
                });
            }

            // Bind click on task content (excluding checkbox) to open detail modal
            const contentArea = taskEl.querySelector('.task-content-area');
            if (contentArea) {
                contentArea.addEventListener('click', (e) => {
                    if (e.target.closest('.task-journey-checkbox')) return;
                    openTaskDetailModal(task.id);
                });
            }

            // Bind action button click
            const actionBtn = taskEl.querySelector('.btn-task-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tabId = actionBtn.dataset.tab;
                    const taskId = actionBtn.dataset.taskId;
                    if (tabId) {
                        switchTab(tabId);
                        const currentTask = findTaskById(taskId);
                        if (currentTask && currentTask.prompt) {
                            fillAndFocusChatPrompt(currentTask.prompt);
                        }
                    }
                });
            }

            container.appendChild(taskEl);
        });
    });
}

function updateStageFilterTabsUI() {
    const current = state.activeJourneyStage || 'all';
    document.querySelectorAll('.journey-stage-tab').forEach(btn => {
        if (btn.dataset.stage === current) {
            btn.className = 'journey-stage-tab px-3 py-1.5 rounded-lg border font-bold transition-all shrink-0 bg-green-900/40 text-green-300 border-green-700/60 shadow-sm';
        } else {
            btn.className = 'journey-stage-tab px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 bg-stone-800/80 text-stone-400 border-stone-700/60 hover:text-stone-200';
        }
    });
}

export function fillAndFocusChatPrompt(promptText) {
    const chatInput = document.getElementById('chat-input') || dom.chatInput;
    if (chatInput) {
        chatInput.value = promptText;
        setTimeout(() => {
            chatInput.focus();
            if (chatInput.setSelectionRange) {
                chatInput.setSelectionRange(promptText.length, promptText.length);
            }
        }, 150);
    }
}
