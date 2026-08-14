from google import genai
from google.genai import types
from google.genai import errors
import chromadb
import os
import json
from pathlib import Path
import random
from dotenv import load_dotenv
from . import chat_config

load_dotenv()

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = None
if api_key:
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")

# Setup local vector database
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="my_knowledge_base")

documents = chat_config.documents

# Load JSON Index for Armed Forces Rights Act
RESOURCES_DIR = Path(__file__).parent / "resources"
JSON_PATH = RESOURCES_DIR / "軍人權益法條索引.json"
rights_act_data = []
if JSON_PATH.exists():
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            index_data = json.load(f)
            rights_act_data = index_data.get("Armed_Forces_Rights_Act_RAG", [])
    except Exception as e:
        print(f"Failed to load JSON index: {e}")

def format_user_info(user_info) -> str:
    if not user_info:
        return "無資料"
    
    if hasattr(user_info, "username"):
        info_lines = [
            f"姓名: {user_info.username or '未提供'}",
            f"身高: {user_info.height or '未提供'} 公分" if user_info.height else "身高: 未提供",
            f"體重: {user_info.weight or '未提供'} 公斤" if user_info.weight else "體重: 未提供",
            f"入伍日期: {user_info.entrance_date or '未提供'}",
            f"慢性病藥物史: {'是' if user_info.do_have_chronic_medications else '否'}"
        ]
        return "\n".join(info_lines)
    
    if isinstance(user_info, dict):
        return "\n".join(f"{k}: {v}" for k, v in user_info.items())
        
    return str(user_info)

def get_working_flash_model(client: genai.Client) -> str:
    excluded_keywords = {'omni', 'tts', 'live', 'audio', 'embedding', 'preview', 'robotics'}

    fallback_candidates = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-1.5-flash'
    ]

    candidates = []
    try:
        for m in client.models.list():
            name = getattr(m, 'name', str(m)).replace('models/', '')
            name_lower = name.lower()

            if 'flash' in name_lower and not any(k in name_lower for k in excluded_keywords):
                candidates.append(name)

        candidates.sort(reverse=True)
    except Exception as e:
        print(f"⚠️ Could not list models: {e}")

    if not candidates:
        candidates = fallback_candidates

    # Test candidates until one succeeds
    for model_name in candidates:
        try:
            # Silence AFC warning by explicitly setting tools=[] for the pre-flight ping
            client.models.generate_content(
                model=model_name,
                contents="ping",
                config=types.GenerateContentConfig(
                    max_output_tokens=1,
                    tools=[]  # Explicitly disables tool/function check during ping
                )
            )
            print(f"✅ Selected active model: {model_name}")
            return model_name
        except errors.APIError as e:
            if e.code == 429:
                print(f"⏭ Skipping {model_name} (Rate Limited / Quota Exhausted)")
            else:
                print(f"⏭ Skipping {model_name} (Error: {e.code})")
        except Exception:
            continue

    return 'gemini-2.5-flash'


def init_knowledge_base():
    """
    Initialize the knowledge base with embeddings.
    Only seeds if the collection is currently empty to save API quota.
    """
    if not client:
        return

    try:
        # Check if already seeded (Chroma in-memory persists for the life of the process)
        if collection.count() > 0:
            return

        print("Seeding knowledge base...")
        for i, text in enumerate(documents):
            result = client.models.embed_content(
                model="models/gemini-embedding-001",
                contents=text
            )
            collection.add(
                ids=[str(i)],
                embeddings=[result.embeddings[0].values],
                documents=[text]
            )
        print("Knowledge base seeded successfully.")
    except Exception as e:
        print(f"Failed to generate/store embeddings: {e}")

# Run initialization once at module load
init_knowledge_base()

def ask_gemini(user_info, question: str):
    if not client:
        return "Chat service is currently unavailable (API Key missing or invalid)."

    try:
        # 1. Embed the question
        result = client.models.embed_content(
            model="models/gemini-embedding-001",
            contents=question
        )
        
        # 2. Search for similar documents
        results = collection.query(
            query_embeddings=[result.embeddings[0].values],
            n_results=2
        )
        
        # 3. Build context from search results
        chroma_context_parts = []
        if results['documents']:
             for doc in results['documents'][0]:
                 chroma_context_parts.append(f"【來源：chat_config.py 內部知識庫】\n{doc}")
        chroma_context = "\n\n".join(chroma_context_parts)
             
        # 3.5. JSON Keyword Matching
        json_context_parts = []
        lower_q = question.lower()
        for item in rights_act_data:
            keywords = item.get("Keywords", [])
            if any(kw.lower() in lower_q for kw in keywords):
                for faq in item.get("FAQ", []):
                    json_context_parts.append(f"【來源：軍人權益法條索引.json (關鍵字：{', '.join(keywords)})】\n問：{faq['Question']}\n答：{faq['Answer']}")
        
        context = chroma_context
        if json_context_parts:
             context = "\n\n".join(json_context_parts) + "\n\n" + chroma_context
        
        # 4. Ask Gemini with the context
        user_info_str = format_user_info(user_info)
        prompt = chat_config.prompt_template.format(
            context=context,
            user_info=user_info_str,
            question=question
        )
        selected_model = get_working_flash_model(client)
        
        response = client.models.generate_content(
            model=selected_model,
            contents=prompt
        )
        
        cleaned_text = response.text.replace("**", "").replace("*", "").replace("##", "")
        final_text = chat_config.append_image_to_response(cleaned_text, question)
        return final_text
    except Exception as e:
        error_msg = str(e)
        print(f"Error during chat: {error_msg}")
        
        # Specific help for API Quota issues
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return "【系統提示】教官現在太累了 (API 額度已達上限)。請稍等 1 分鐘後再試，或檢查您的 API Key 配額設定。"
            
        return f"I'm sorry, I'm having trouble connecting to my brain right now. Error: {error_msg}"

# Test
if __name__ == "__main__":
    print(ask_gemini({}, "How many days of PTO do employees get?"))