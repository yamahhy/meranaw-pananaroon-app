# -------------------- Imports --------------------
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
import logging

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from gtts.lang import tts_langs

from mms import MMS  # Renamed to avoid conflict with 'mms_instance'
from search import search_proverbs_combined

import uvicorn  # <-- For running the app directly

# -------------------- Initialize App --------------------
app = FastAPI()
collection_name = "meranaw_proverbs"

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",  # dev frontend
    "http://localhost:5173",  # Vite
    "https://meranaw-pananaroon.vercel.app"  # your production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or use ["*"] to allow all during testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Print supported languages on server start
print("Supported gTTS languages:")
print(tts_langs())

# -------------------- Load T5 Model --------------------
from huggingface_hub import HfApi, HfFolder
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

token = "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"  # Replace with your token

model_id = "yamahhy/meranaw_interpreter_model"

tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=False, token=token)
model = AutoModelForSeq2SeqLM.from_pretrained(model_id, token=token)

generator = pipeline("text2text-generation", model=model, tokenizer=tokenizer)


# -------------------- MMS TTS Initialization --------------------
try:
    mms_instance = MMS()
except Exception as e:
    print(f"Error initializing MMS Text-to-Speech model: {e}")
    mms_instance = None

# -------------------- Constants and Helpers --------------------
MAX_PROMPT_LENGTH = 512  # Based on model token limit
SUPPORTED_LANGS = {"mrw", "tl", "en"}

def truncate_text(text: str, max_length: int = MAX_PROMPT_LENGTH) -> str:
    if len(text) > max_length:
        print(f"Truncating prompt from {len(text)} to {max_length} characters")
        return text[:max_length]
    return text

# -------------------- Data Models --------------------
class InterpretRequest(BaseModel):
    data: List  # expects [meranaw, englishTranslation, interpretation]

# -------------------- Routes --------------------

# --- Interpretation Generation ---
@app.post("/api/meranaw-interpreter")
async def interpret_proverb(req: InterpretRequest):
    try:
        meranaw, english_translation, interpretation = req.data
    except ValueError:
        raise HTTPException(status_code=400, detail="Request data must contain exactly 3 elements.")

    prompt = (
        f"interpret: Meranaw Proverb: {meranaw}\n"
        f"English Translation: {english_translation}\n"
        f"Interpretation: {interpretation}\n"
        f"Interpretation:"
    )
    prompt = truncate_text(prompt)
    
    result = generator(prompt, max_length=64, num_beams=3, repetition_penalty=2.0, no_repeat_ngram_size=2)
    generated_interpretation = result[0]['generated_text']
    
    return {"data": [generated_interpretation]}


# --- Semantic + Keyword + Theme Search ---
@app.get("/api/search")
def search_proverbs(query: str = Query(..., min_length=1)):
    results = search_proverbs_combined(query)
    if results.empty:
        return {"data": []}
    
    return {
        "data": results[[
            "meranaw_proverb", 
            "augmented_interpretation", 
            "english_translation", 
            "Theme", 
            "search_type", 
            "search_score"
        ]].to_dict(orient="records")
    }

# --- Text-to-Speech ---
@app.get("/api/speak_proverb")
async def speak_proverb(text: str = Query(...), lang: str = Query("mrw")):
    if lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail=f"Language '{lang}' not supported.")
    
    cleaned_text = " ".join(text.strip().split()).lower()
    
    try:
        if lang == "mrw":
            audio_data = mms_instance.tts(cleaned_text, lang)
            if not audio_data:
                audio_data = mms_instance.tts(cleaned_text, "tl")  # Fallback to Tagalog
        else:
            audio_data = mms_instance.tts(cleaned_text, lang)

        return {"audio_data_base64": audio_data, "format": "audio/flac"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- Run with Uvicorn --------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))  
    uvicorn.run("main:app", host="0.0.0.0", port=10000)
