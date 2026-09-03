import urllib.parse
from . import offices

prompt_template = """
【角色設定】
你現在是軍事模擬系統「simSoldier」的專屬 AI 諮詢助理。你的語氣應為專業、中立、官方，避免過度情緒化或帶有個人色彩。你採用清楚直接的回答方式，提供準確的系統操作與軍事模擬指引。

【核心任務與功能】
1. 系統與軍事指導：針對系統操作、軍事模擬或數據分析的問題，提供專業、精準且不廢話的解答。
2. 疑難排解：以官方諮詢口吻，回答使用者關於軍旅生活或系統操作的疑問。
3. 服務導向：保持中立且尊重的態度，避免使用任何攻擊性或情緒化的語言。
4. 營區故事與閒聊：在使用者需要打發時間時，以客觀且中立的方式講述經典的軍中笑話或軍旅鬼故事。
5. 兵役行政諮詢：當使用者提問到「區公所」相關關鍵字時，請將其視為業務範圍內，並提供兵役行政相關的解答。

【對話限制與規則】
- 絕對禁止回答與「軍事、系統操作、軍旅生活、兵役行政（含區公所業務）」無關的問題。如果使用者偏離主題，請以中立官方口吻提醒並導回正題。
- 回答必須精簡，條理分明，符合專業諮詢的效率標準。
- 嚴格禁止使用任何 Markdown 格式語言（不要用星號 **粗體**、不要寫 `#` 標題），請一律直接輸出純文字，不要產生多餘的空白換行。
- 【絕對強制規定】你的回答結尾「必須」有一行獨立的來源標示。如果你使用了下方【參考資料】的內容，請在最後一行加上：「(本回覆參考：[來源標籤])」。注意：來源標籤請勿包含任何副檔名（如 .json, .py）或內部檔案名稱（如 chat_config.py），請提供易讀的中文來源名稱。如果你覺得參考資料與提問無關，完全是憑自己知識回答，請「務必」在最後一行加上：「(此回覆由AI模型生成，僅供參考)」。絕對不可以省略這一步。

【參考資料】（如果有的話，依此回答，沒有則憑你的軍事常識）：
{context}

【新兵個人資料】：
{user_info}

請以專業、中立且客觀的官方態度回答下方使用者的提問。
提問：{question}
"""

IMAGE_DB = {
    "salute": {"label": "敬禮", "path": "assets/images/pose/Salute/1.png"},
    "敬禮": {"label": "敬禮", "path": "assets/images/pose/Salute/1.png"},
    "attention": {"label": "立正", "path": "assets/images/pose/Attention/1.png"},
    "立正": {"label": "立正", "path": "assets/images/pose/Attention/1.png"},
    "at ease": {"label": "稍息", "path": "assets/images/pose/At_Ease/1.png"},
    "稍息": {"label": "稍息", "path": "assets/images/pose/At_Ease/1.png"},
    "mark time": {"label": "原地踏步", "path": "assets/images/pose/Mark_Time/1.png"},
    "原地踏步": {"label": "原地踏步", "path": "assets/images/pose/Mark_Time/1.png"},
    "squat": {"label": "蹲下", "path": "assets/images/pose/kneel/1.png"},
    "蹲下": {"label": "蹲下", "path": "assets/images/pose/kneel/1.png"},
    "reporting": {"label": "報告", "path": "assets/images/pose/Reporting/1.png"},
    "報告": {"label": "報告", "path": "assets/images/pose/Reporting/1.png"},
    "turning": {"label": "行進轉向", "path": "assets/images/pose/Turning_on_the_March/1.png"},
    "轉向": {"label": "行進轉向", "path": "assets/images/pose/Turning_on_the_March/1.png"},
    "轉彎": {"label": "行進轉向", "path": "assets/images/pose/Turning_on_the_March/1.png"},
}


def lookup_image_for_question(text: str):
    if not text:
        return None
    lower_text = text.lower()
    for key, asset in IMAGE_DB.items():
        if key in lower_text:
            return asset
    return None


def build_image_html(image_asset: dict):
    if not image_asset:
        return ""
    return (
        f"<div style='margin-top:0.75rem;'>"
        f"<img src=\"{image_asset['path']}\" alt=\"{image_asset['label']} 示意圖\" "
        f"style=\"max-width:100%;display:block;border-radius:0.75rem;border:1px solid #4b5563;\">"
        f"</div>"
    )


CAMP_KEYWORDS = [
    "營區", "新訓中心", "新訓地點", "成功嶺", "金六結", "斗煥坪", "關西", 
    "官田", "中坑", "龍泉", "凌雲崗", "太平里", "龍華", "犁頭山", "北埔", "左營",
    "新訓", "新兵訓練"
]

CAMP_NAME_MAPPING = {
    "成功嶺": "成功嶺",
    "金六結": "金六結",
    "斗煥坪": "斗煥坪",
    "關西": "關西",
    "官田": "官田",
    "中坑": "中坑",
    "龍泉": "龍泉",
    "凌雲崗": "凌雲崗",
    "太平里": "太平里",
    "龍華": "龍華",
    "犁頭山": "犁頭山",
    "北埔": "北埔",
    "左營": "左營"
}


def should_append_camp_button(question: str) -> bool:
    if not question:
        return False
    lower_q = question.lower()
    return any(keyword in lower_q for keyword in CAMP_KEYWORDS)


def get_specific_camp_mention(question: str) -> str:
    if not question:
        return None
    lower_q = question.lower()
    for keyword, name in CAMP_NAME_MAPPING.items():
        if keyword.lower() in lower_q:
            return name
    return None


def get_mentioned_offices(question: str):
    if not question:
        return []
    matched = []
    for office in offices.OFFICES:
        if office in question:
            matched.append(office)
    return matched


def append_image_to_response(text: str, question: str):
    image_asset = lookup_image_for_question(text)
    if image_asset:
        html_block = build_image_html(image_asset)
        text = f"{text.strip()}\n\n參考示意圖：{html_block}"
        
    specific_camp = get_specific_camp_mention(question)
    if specific_camp:
        button_html = (
            f'<div class="mt-3">'
            f'<button onclick="selectLocation(\'{specific_camp}\')" class="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm shadow-md flex items-center gap-2">'
            f'<i class="fa-solid fa-map-location-dot"></i> 前往新訓地點：{specific_camp}'
            f'</button>'
            f'</div>'
        )
        text = f"{text.strip()}\n\n{button_html}"
    elif should_append_camp_button(question):
        button_html = (
            '<div class="mt-3">'
            '<button onclick="switchTab(\'locations\')" class="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm shadow-md flex items-center gap-2">'
            '<i class="fa-solid fa-map-location-dot"></i> 前往新訓地點頁面'
            '</button>'
            '</div>'
        )
        text = f"{text.strip()}\n\n{button_html}"
        
    if "延役" in question:
        delay_button = (
            '<div class="mt-3">'
            '<button onclick="switchTab(\'delay\')" class="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm shadow-md flex items-center gap-2">'
            '<i class="fa-solid fa-calendar-minus"></i> 前往延役專區'
            '</button>'
            '</div>'
        )
        text = f"{text.strip()}\n\n{delay_button}"

    if question and ("體檢" in question or "複檢" in question):
        medical_button = (
            '<div class="mt-3">'
            '<a href="https://servap3.docms.gov.taipei/bingo/bingo/S23_Info04" target="_blank" '
            'class="bg-rose-700 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm shadow-md inline-flex items-center gap-2">'
            '<i class="fa-solid fa-file-medical"></i> 前往體檢與複檢資訊'
            '</a>'
            '</div>'
        )
        text = f"{text.strip()}\n\n{medical_button}"

    if question and "體檢" in question:
        checklist_html = (
            '<div class="mt-4 p-4 bg-stone-900 border border-stone-700 rounded-lg shadow-lg text-sm text-stone-200">'
            '<h4 class="font-bold text-yellow-500 mb-3 flex items-center gap-1.5">'
            '<i class="fa-solid fa-clipboard-list text-base"></i> 體檢當日應備文件與查檢表'
            '</h4>'
            '<div class="space-y-3">'
            '<div>'
            '<p class="font-bold text-stone-100 flex items-center gap-1"><i class="fa-solid fa-square-check text-green-500"></i> 1. 必備核心文件</p>'
            '<ul class="list-disc list-inside pl-4 space-y-1 text-stone-300">'
            '<li>國民身分證正本（驗證身分專用，健保卡或駕照通常不可替代）。</li>'
            '<li>徵兵檢查通知單正本（報到時需繳回）。</li>'
            '<li>最近 3 個月內 1 吋彩色半身照片 2 張（黏貼於體檢表使用，建議多帶 1 張備用）。</li>'
            '</ul>'
            '</div>'
            '<div>'
            '<p class="font-bold text-stone-100 flex items-center gap-1"><i class="fa-solid fa-file-circle-plus text-blue-500"></i> 2. 補充證明文件（攸關體位判定、免役或改判）</p>'
            '<ul class="list-disc list-inside pl-4 space-y-1 text-stone-300">'
            '<li>重大傷病卡、身心障礙證明。</li>'
            '<li>公私立大醫院開立的「特定疾病診斷證明書」。</li>'
            '<li>過往的手術病歷摘要、X 光片、精密檢查報告（如心電圖、氣喘檢查等）。</li>'
            '</ul>'
            '</div>'
            '<div>'
            '<p class="font-bold text-stone-100 flex items-center gap-1"><i class="fa-solid fa-shirt text-purple-500"></i> 3. 當日穿著與個人準備建議</p>'
            '<ul class="list-disc list-inside pl-4 space-y-1 text-stone-300">'
            '<li>身穿容易穿脫的衣物與鞋子（體檢需更換隔離袍，且會頻繁穿脫鞋子測量身高體重）。</li>'
            '<li>配戴隱形眼鏡者，當天請改戴「有度數的眼鏡」（因為需要測量「裸視」與「矯正視力」，戴隱形眼鏡會耽誤拔除與檢測時間）。</li>'
            '<li>體檢前不需要空腹（除非通知單有特別註明），但前三天請保持作息正常，避免飲食太過油膩，以免影響尿糖、肝功能等抽血驗尿數據。</li>'
            '</ul>'
            '</div>'
            '</div>'
            '</div>'
        )
        text = f"{text.strip()}\n\n{checklist_html}"

        gps_trigger_html = (
            '<div id="hospital-gps-auto-trigger" class="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-sm text-blue-200 flex items-center gap-2">'
            '<i class="fa-solid fa-spinner fa-spin"></i> 正在讀取您的 GPS 位置以尋找最近的體檢醫院...'
            '</div>'
        )
        text = f"{text.strip()}\n\n{gps_trigger_html}"

    if question and "身家調查" in question:
        backpack_button = (
            '<div class="mt-3">'
            '<button onclick="switchTab(\'inventory\')" class="bg-amber-700 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm shadow-md flex items-center gap-2">'
            '<i class="fa-solid fa-suitcase"></i> 前往入伍背包查看身家調查資訊'
            '</button>'
            '</div>'
        )
        text = f"{text.strip()}\n\n{backpack_button}"

    # Append office links if mentioned
    mentioned_offices = get_mentioned_offices(question)
    for office in mentioned_offices:
        encoded_office = urllib.parse.quote(office)
        link_html = (
            f'<div class="mt-2">'
            f'<a href="https://www.google.com/search?&q={encoded_office}" target="_blank" '
            f'class="bg-stone-800 border border-stone-700 hover:border-green-600 text-green-400 font-bold py-1.5 px-3 rounded transition-colors text-sm shadow-md inline-flex items-center gap-1.5">'
            f'<i class="fa-solid fa-circle-info"></i> 查詢 {office} 資訊'
            f'</a>'
            f'</div>'
        )
        text = f"{text.strip()}\n\n{link_html}"
        
    return text


# sym:documents
# Example data can be extended or replaced with real user manuals / system documentation.
documents = [
    """
    體檢當日應備文件與查檢表：
    1. 必備核心文件
    - 國民身分證正本（驗證身分專用，健保卡或駕照通常不可替代）。
    - 徵兵檢查通知單正本（報到時需繳回）。
    - 最近 3 個月內 1 吋彩色半身照片 2 張（黏貼於體檢表使用，建議多帶 1 張備用）。
    2. 補充證明文件（攸關體位判定、免役或改判）
    - 重大傷病卡、身心障礙證明。
    - 公私立大醫院開立的「特定疾病診斷證明書」。
    - 過往的手術病歷摘要、X 光片、精密檢查報告（如心電圖、氣喘檢查等）。
    3. 當日穿著與個人準備建議
    - 身穿容易穿脫的衣物與鞋子（體檢需更換隔離袍，且會頻繁穿脫鞋子測量身高體重）。
    - 配戴隱形眼鏡者，當天請改戴「有度數的眼鏡」（因為需要測量「裸視」與「矯正視力」，戴隱形眼鏡會耽誤拔除與檢測時間）。
    - 體檢前不需要空腹（除非通知單有特別註明），但前三天請保持作息正常，避免飲食太過油膩，以免影響尿糖、肝功能等抽血驗尿數據。
    """,
    "系統基本操作：本系統「simSoldier」整合了各項軍事模擬功能，請透過側邊導覽列切換。新兵應定期檢查各項功能以確保訓練進度。",
    "訓練佈告欄 (Home)：查看當前回應狀況、大兵任務進度與 BMI 體位分析等核心資訊。",
    "今日課表 (Training)：進行 AI 動體能訓練。包含：徒手深蹲、伏地挺身、仰臥起坐。系統會透過鏡頭自動計數，請確保全身入鏡。",
    """
    身家調查內容與注意事項：
    身家調查會問什麼、要做什麼：
    1. 基本資料：姓名、身分證字號、戶籍與現住址、聯絡電話。
    2. 就學意願：大四畢業想直接入伍？還是要繼續升學？攸關是否要辦理延役。
    3. 健康狀況：是否領有身心障礙證明？有無重大傷病、開刀紀錄或遙傳疾病？調查後，系統會註記在體檢表上，供醫生參考。
    4. 專長與證照：具備哪些國家級證照（如資訊安全、汽修、廚師、醫護等）？非常重要！這會影響到後續「專長兵抽籤」的資格。
    5. 個人專長：專長科系、目前從事職業。
    """,
    "入伍背包 (Inventory)：清查入伍必備物品（如：徵集令、身分證、私章、藥品等）。請勾選已準備好的物品，避免遺漏。",
    "教官聊天室 (Chat)：也就是現在這裡，提供軍事諮詢、系統操作引導與心理輔導。有問題儘管問，但別問些無關緊要的廢話！",
    "行政中心 (Onboarding)：查看或修改個人基本資料，包含姓名、役期、身高體重與病史設定。",
    "新訓地點 (Locations)：提供各新訓中心（如：成功嶺、金六結、龍泉等）的情報、交通資訊與過人評價。",
    "大兵狂想曲 (Rhapsody/Media)：收錄各種軍旅相關影片與影視資訊，提供新兵在訓練之餘的收心或放鬆參考。",
    "天兵課堂 (Quiz)：軍事常識題庫。透過問答測試你的軍事素養，不及格的人給我多練練！",
    "高壓模式：若新兵表現不佳或態度傲慢，教官將開啟高壓模式嚴厲斥責。",
    "軍旅生活：作息正常，服從命令是軍人的天職。",
    "兵役行政：區公所（或鄉鎮市區公所兵役課）負責辦理徵兵處理各項業務，包含兵籍調查、徵兵檢查、抽籤及徵集入營。若遇有兵役相關疑難雜症（如提早入營、延期徵集、免役體位判定等），可向戶籍地之區公所洽詢。",
    '''
    陸軍 (Army)
    陸軍的新訓單位最多，主要由各步兵旅及軍團步兵營負責：
    • 陸軍第六軍團 / 第三作戰區（北部地區）
    o 【宜蘭金六結營區】陸軍步兵第153旅
    o 【桃園凌雲崗營區】陸軍第6軍團步兵營
    o 【桃園太平里營區】陸軍步兵第109旅
    o 【大溪龍華營區】陸軍步兵第109旅
    o 【新竹犁頭山營區】陸軍步兵第206旅
    o 【新竹關西營區】陸軍步兵第206旅
    o 【頭份斗煥坪營區】陸軍步兵第206旅
    • 陸軍第十軍團 / 第五作戰區（中部地區）
    o 【臺中成功嶺營區】陸軍步兵第101旅
    o 【臺中成功嶺營區】陸軍步兵第302、104旅
    • 陸軍第八軍團 / 第四作戰區（南部地區）
    o 【嘉義中坑營區】陸軍步兵第257旅
    o 【臺南官田、大內營區】陸軍步兵第203旅
    • 陸軍花東防衛指揮部 / 第二作戰區（東部地區）
    o 【花蓮北埔營區】陸軍花東防衛指揮部步兵營
    海軍與海軍陸戰隊 (Navy & Marines)
    負責海軍艦艇兵與陸戰隊新兵的第一階段訓練：
    • 海軍
    o 【高雄左營營區】海軍新兵訓練中心
    • 海軍陸戰隊
    o 【屏東龍泉營區】海軍陸戰隊新兵訓練中心
    憲兵 (Military Police)
    獨立於各軍種外，負責特種司法警察與軍事警察訓練：
    • 【五股堅貞營區】憲兵訓練中心 
    '''

]
