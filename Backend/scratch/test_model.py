import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    sys.exit(1)

genai.configure(api_key=api_key)

# ─── Change this to test any model ───────────────────────
MODEL_TO_TEST = "gemini-2.5-flash-lite"
# ─────────────────────────────────────────────────────────

print(f"Testing model: {MODEL_TO_TEST}\n")

try:
    model = genai.GenerativeModel(MODEL_TO_TEST)
    response = model.generate_content("tell me a joke.")
    print(f"✅ Model is WORKING!")
    print(f"   Response: {response.text.strip()}")
except Exception as e:
    print(f"❌ Model FAILED: {e}")
