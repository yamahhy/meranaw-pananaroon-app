import firebase_admin
from firebase_admin import credentials, firestore
import json

cred = credentials.Certificate('meranaw-pananaroon-firebase-adminsdk-fbsvc-29f342bf95.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

def fetch_proverbs_from_firestore():
    proverbs_ref = db.collection('meranaw_proverb')
    docs = proverbs_ref.stream()

    proverbs = []
    for doc in docs:
        data = doc.to_dict()
        proverbs.append({
            "id": doc.id,
            "meranaw": data.get("meranaw_proverb", ""),
            "literal_meaning": data.get("literal_translation_meranaw", ""),
            "english_translation": data.get("english_translation", ""),
            "theme": data.get("theme", "general")
        })

    with open('proverbs_cache.json', 'w', encoding='utf-8') as f:
        json.dump(proverbs, f, ensure_ascii=False, indent=2)

    return proverbs
