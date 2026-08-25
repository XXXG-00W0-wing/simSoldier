/**
 * SIMSOLDIER STATE
 * 管理全域應用程式狀態
 */

export const state = {
    isLoggedIn: false,
    userData: null,
    serviceStatus: null,
    activeTab: 'home',
    userScenario: 'preparing', // 'preparing' | 'enlisted' | 'deferred'
    backpack: [],
    game: {
        isPlaying: false,
        score: 0,
        timeLeft: 30,
        timer: null,
        spawnTimer: null,
        mosquitoes: []
    },
    training: {
        completed: [] // Array of day IDs
    },
    journeyStages: [],
    activeJourneyStage: 'all' // 'all' | 'stage_1' | 'stage_2' | 'stage_3'
};

// 四大服役歷程主線與任務設定
export const INITIAL_JOURNEY_STAGES = [
    {
        id: 'stage_1',
        number: 1,
        title: '兵役整備期',
        period: '入伍前階段',
        icon: 'fa-file-shield',
        colorClass: 'emerald',
        badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
        activeGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
        description: '完成徵兵體檢、軍種抽籤及各項行前裝備物資整備',
        tasks: [
            { 
                id: 't1_2', 
                title: '完成役男徵兵體檢', 
                type: 'main', 
                typeName: '主線任務', 
                completed: false, 
                linkTab: 'chat', 
                prompt: '請問我要到哪裡進行體檢?',
                note: '依指定時間前往指定醫院報到受檢，確認體位判定（常備役/替代役/免役）',
                detail: '應依指定時間、地點，攜帶徵兵檢查通知書、國民身分證及照片前往指定醫院報到受檢。若在外地就學或工作，得使用線上系統申請跨縣市代檢。體位判定將直接影響後續服役役別。\n\n點擊快捷按鈕將引導至「教官聊天室」並自動填入「請問我要到哪裡進行體檢?」為您即時解答體檢地點與醫院須知！'
            },
            { 
                id: 't1_3', 
                title: '完成軍種抽籤', 
                type: 'main', 
                typeName: '主線任務', 
                completed: false, 
                linkTab: 'game', 
                note: '親自或由家屬代為抽取陸/海/空/海陸籤號，決定未來服役軍種',
                detail: '判定為常備役體位或替代役體位者，應辦理抽籤。凡參加抽籤役男應親自或委託有行為能力之家屬到場抽籤。籤號分為陸軍、海軍艦艇兵、海軍陸戰隊與空軍等類別。\n\n點擊快捷按鈕將引導至「模擬籤筒」小遊戲，親自體驗搖晃籤筒或委託里長代抽的刺激過程！'
            },
            { 
                id: 't1_4', 
                title: '熟讀延役專區說明', 
                type: 'main', 
                typeName: '主線任務', 
                completed: false, 
                linkTab: 'delay', 
                note: '了解體位複檢、延期徵集事故原因與在學緩徵相關法規',
                detail: '接到徵集令後，若合於常備役體位服替代役役男延期徵訓事故表各項原因（如考試、出國、重病或家庭變故），得填具申請書報由區公所核轉市政府核辦。'
            },
            { 
                id: 't1_5', 
                title: '入伍背包必備 8 項證件與個人物資清點', 
                type: 'equipment', 
                typeName: '裝備任務', 
                completed: false, 
                linkTab: 'inventory', 
                note: '確認徵集令、身分證、健保卡、郵局存摺、私章、畢業證書等 8 項必備證件',
                detail: '入營報到當日必須隨身攜帶：徵集令正本、身分證與健保卡正本、郵局或指定銀行存摺影本、私章、畢業證書影本、軍訓折抵成績單正本與戶口名簿影本。嚴禁攜帶各類違禁品與大陸廠牌通訊器材。'
            },
            { 
                id: 't1_6', 
                title: '根據徵集令查找自己的新訓地點', 
                type: 'main', 
                typeName: '主線任務', 
                completed: false, 
                linkTab: 'locations', 
                note: '進入「新訓地點」地圖查閱各軍種新訓營區、交通路線與營區簡介',
                detail: '收到徵集令（兵單）後，請仔細核對記載之新兵訓練中心（如：成功嶺、金六結、關西、中坑、官田等）。\n\n點擊快捷按鈕將引導至「新訓地點」專區，可依軍種篩選、在地圖上查看營區精確位置並一鍵規劃 Google Maps 導航路線。點選或查找營區後將自動標示任務為已完成！'
            }
        ]
    },
    {
        id: 'stage_2',
        number: 2,
        title: '入營前適應期',
        period: '新訓準備與操課',
        icon: 'fa-person-military-pointing',
        colorClass: 'amber',
        badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
        activeGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
        description: '提前掌握入營作息課表、熟記單兵射擊口訣並建立軍旅常識',
        tasks: [
            { 
                id: 't2_1', 
                title: '今日課表練習與作息調適', 
                type: 'training', 
                typeName: '操課任務', 
                completed: false, 
                linkTab: 'training', 
                note: '熟悉新兵訓練 5 日基礎課表作息、體能鍛鍊與生活常規',
                detail: '提早調整生理時鐘，習慣 06:00 起床、早操晨跑、按表操課、午休、傍晚體能測驗與 22:00 就寢。多做深蹲、伏地挺身與核心肌群訓練，降低入營初期的體力負擔。'
            },
            { 
                id: 't2_2', 
                title: '熟悉單兵射擊口訣模擬', 
                type: 'training', 
                typeName: '操課任務', 
                completed: false, 
                linkTab: 'shooting', 
                note: '掌握「托、抵、握、貼、瞄、停、扣、報」箱上瞄準與射擊八大要領',
                detail: '單兵步槍射擊要訣：托槍要穩、抵肩要緊、握把要牢、貼腮要實、瞄準要正、停息要緩、扣引要輕、報靶要快。牢記覘孔、準星與目標成一直線之三點一線瞄準要領。'
            },
            { 
                id: 't2_3', 
                title: '通過「天兵課堂」軍事法規與常識問答', 
                type: 'quiz', 
                typeName: '測驗任務', 
                completed: false, 
                linkTab: 'quiz', 
                note: '完成違禁品辨識、階級稱謂、軍紀法規與常見軍旅應對常識測驗',
                detail: '透過趣味問答熟悉軍中官士兵軍銜辨識、內務櫃擺放標準、防中暑要領、長官應答禮儀與國軍常見違禁規定，避免入營時不慎成為班長眼中的「大天兵」。'
            },
            { 
                id: 't2_4', 
                title: '遊玩「大兵狂想曲」軍旅小遊戲', 
                type: 'game', 
                typeName: '遊戲任務', 
                completed: false, 
                linkTab: 'rhapsody', 
                note: '體驗大兵狂想曲闖關小遊戲，在歡樂互動中提前適應部隊節奏', 
                detail: '「大兵狂想曲」是專為役男設計的趣味互動闖關遊戲，融合軍旅生活情境與幽默互動。透過遊戲體驗提前適應軍中紀律與生活步調！\n\n點擊「前往大兵狂想曲」即可進入遊戲開始遊玩。'
            }
        ]
    },
    {
        id: 'stage_3',
        number: 3,
        title: '入營服役期',
        period: '部隊生活與日常',
        icon: 'fa-shield-halved',
        colorClass: 'blue',
        badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
        activeGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.35)]',
        description: '透過 AI 教官進行心緒諮詢與部隊生活適應',
        tasks: [
            { 
                id: 't3_3', 
                title: '心緒與部隊生活適應諮詢（AI 教官）', 
                type: 'daily', 
                typeName: '每日任務', 
                completed: false, 
                linkTab: 'chat', 
                note: '隨時向 AI 教官諮詢軍旅適應、休假規定、心理調適與權益保障',
                detail: '服役期間若遇生活適應不良、人際壓力、法規疑義或休假相關問題，隨時打開 SimSoldier 戰情顧問中心與 AI 教官互動對話，獲得專業即時的解答與心緒支持。'
            },
            { 
                id: 't3_4', 
                title: '離營倒數歸零（役期圓滿達成）', 
                type: 'discharge', 
                typeName: '結訓任務', 
                completed: false, 
                isAutoOnly: true,
                note: '當入營服役離營倒數天數歸零時，系統自動標記達成',
                detail: '圓滿服滿兵役役期，光榮達成結訓離營。\n\n當入營服役離營倒數天數歸零時，系統將自動標示為已達成。'
            }
        ]
    }
];

// 預設背包清單
export const INITIAL_BACKPACK = [
    // 一、 必備行政證件與資料
    { id: 1, name: "徵集令正本", category: "document", acquired: false, required: true, note: "入伍通知書，報到必查" },
    { id: 2, name: "身分證與健保卡正本", category: "document", acquired: false, required: true, note: "身分查驗與健保登記使用" },
    { id: 3, name: "郵局或指定銀行存摺正面影本", category: "document", acquired: false, required: true, note: "供發放薪資使用，指定銀行通常為土地銀行、合作金庫或台新銀行" },
    { id: 4, name: "私章", category: "document", acquired: false, required: true, note: "建議準備便宜的普通木頭章，用於簽核文件與領福利金，勿帶銀行印鑑章以免遺失" },
    { id: 5, name: "最高學歷畢（結）業證書影本", category: "document", acquired: false, required: true, note: "辦理役別甄選或專長分發用" },
    { id: 6, name: "軍訓課程折抵成績單正本", category: "document", acquired: false, required: true, note: "全民國防教育折抵成績單，需回母校教官室蓋折抵章，這是提早退伍的唯一依據" },
    { id: 7, name: "戶口名簿影本", category: "document", acquired: false, required: true, note: "填寫資料及辦理戶籍地分發參考用" },
    { id: 8, name: "特殊專長證照與診斷證明", category: "document", acquired: false, required: false, note: "特殊專長證照、汽車駕照正本或個人特殊醫療診斷證明（視個人情況攜帶）" },

    // 二、 財務與電子通訊
    { id: 9, name: "現金與零錢", category: "financial_comm", acquired: false, required: false, note: "建議攜帶 1,000～3,000元，並多換 10/50元硬幣及 100元小鈔，用於投飲料、打電話或繳剪髮/洗衣雜費" },
    { id: 10, name: "智慧型手機", category: "financial_comm", acquired: false, required: false, note: "嚴禁攜帶中國大陸廠牌（如小米、華為、OPPO等）。手機入營會集中保管，定時開放使用" },
    { id: 11, name: "行動電源與充電線", category: "financial_comm", acquired: false, required: false, note: "營區不提供充電插座，請務必自備大容量行動電源" },
    { id: 12, name: "有線耳機", category: "financial_comm", acquired: false, required: false, note: "軍中多禁止使用藍牙裝置，若要在吵雜時段講電話，建議準備有線耳機" },
    { id: 13, name: "IC電話卡", category: "financial_comm", acquired: false, required: false, note: "入營初期手機開放時間極短，排隊打公用電話是與外界聯繫的保命符" },

    // 三、 盥洗與個人衛生用品
    { id: 14, name: "三合一沐浴乳", category: "hygiene", acquired: false, required: false, note: "強烈建議攜帶，一瓶可洗頭、洗臉加洗身體，能大幅節省戰鬥澡的時間並節省內務櫃空間" },
    { id: 15, name: "刮鬍刀", category: "hygiene", acquired: false, required: false, note: "手動拋棄式或電池式，營區不提供充電，切勿帶充電式電動刮鬍刀" },
    { id: 16, name: "衛生紙與袖珍面紙", category: "hygiene", acquired: false, required: false, note: "準備 1-2 包大包抽取式放寢室，並多備袖珍包隨身攜帶，方便操課時如廁或擦汗" },
    { id: 17, name: "指甲剪", category: "hygiene", acquired: false, required: false, note: "必須具備集屑器，以維持環境整潔" },
    { id: 18, name: "牙膏、牙刷與素色拖鞋", category: "hygiene", acquired: false, required: false, note: "牙膏、牙刷與素色止滑拖鞋（如藍白拖）" },

    // 四、 醫療與防蚊防護
    { id: 19, name: "防蚊用品", category: "medical", acquired: false, required: false, note: "嚴禁噴霧式防蚊液（屬違禁品會被沒收），請改帶膏狀、滾珠瓶或防蚊貼片（可貼於迷彩服內側或蚊帳）" },
    { id: 20, name: "個人常備藥品", category: "medical", acquired: false, required: false, note: "如感冒藥、胃藥、止痛藥、外用藥膏。入營後口服藥會統一保管並定時領用，務必保留原藥袋或處方箋" },
    { id: 21, name: "耳塞與眼罩", category: "medical", acquired: false, required: false, note: "大寢室幾十人同睡打呼與磨牙聲大，淺眠者必備耳塞（打靶時也能用）與眼罩" },
    { id: 22, name: "痱子粉或涼感濕紙巾", category: "medical", acquired: false, required: false, note: "蘆薈凝露亦可。夏天入伍極易長濕疹或曬傷，能幫助舒緩並較好入睡" },

    // 五、 實用生活小物（口袋內務）
    { id: 23, name: "防水拉鏈袋 (A6大小)", category: "essentials", acquired: false, required: false, note: "準備數個大小不一的防水袋，裝零錢、證件、小筆記本，方便塞進迷彩服口袋並防汗雨水" },
    { id: 24, name: "防水電子錶", category: "essentials", acquired: false, required: false, note: "必須具備夜光與鬧鐘功能。手機不在身上時，手錶是唯一能讓你在規定時間內集合的工具" },
    { id: 25, name: "奇異筆/簽字筆", category: "essentials", acquired: false, required: false, note: "務必在所有個人物品（如公發毛巾、內衣褲等）上寫上學號姓名，以免大鍋洗後拿錯或遺失" },
    { id: 26, name: "筆記本與原子筆", category: "essentials", acquired: false, required: false, note: "隨身記錄班長交代事項或抄寫單兵注意詞" },
    { id: 27, name: "生活照片 3 張", category: "essentials", acquired: false, required: false, note: "4X6 尺寸，用於貼在大兵手記上" },

    // 六、 特定軍種與特殊需求
    { id: 28, name: "海軍特殊用品", category: "special", acquired: false, required: false, note: "海軍有游泳訓練，需自備黑色游泳褲（公發尺寸較小）及有度數的泳鏡" },
    { id: 29, name: "海陸固定繩/備用眼鏡", category: "special", acquired: false, required: false, note: "海軍陸戰隊操課極耗體力，強烈建議近視者加裝眼鏡固定繩，並多備一副眼鏡" },
    { id: 30, name: "便服一套", category: "special", acquired: false, required: false, note: "通常只需穿入營那一套即可，放假時會直接穿同一套回家，不需額外多帶佔空間" },
    { id: 31, name: "注意：絕對不要攜帶違禁品", category: "special", acquired: false, required: false, note: "禁止打火機、香菸、酒、檳榔、撲克牌、各類噴霧罐、刀械、藍牙耳機及平板電腦等。內衣褲與襪子部隊皆會發放與洗滌" }
];

