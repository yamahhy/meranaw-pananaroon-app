import pandas as pd
import numpy as np
import ast
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# --- LOAD DATA AND MODEL ---

# df = pd.read_csv("augmented_meranaw_proverb.csv")
df = pd.read_csv(r"C:/Users/HP/Pictures/meranaw_proverb_search/main/augmented_meranaw_proverb.csv")

def normalize_meranaw_word(text):
    if not isinstance(text, str):
        return text  # Return unchanged if not a string

    normalization_map = {
        "aden": ["adn", "adun"],
        "ngka": ["angka"],
        "den": ["dn", "dun"],
         "penayaon": ["pnayawn", "penayawn"],
        "ig": ["eg", "tubig"],
        "laod": ["lawd", "laod"],
        "san": ["saan", "san bo"],
        "pembataesen": ["pmbatasn", "pmbatasen"],
        "inged": ["ingd", "ingud", "ing'd"],
        "bangoni": ["bangoningka", "bangon"],
        "myasapad": ["miyasapad"],
        "geda": ["gda", "g'da"],
        "gagao": ["gagaw"],
        "kawarao": ["kawaraw"],
        "tao": ["taw"],
        "skanyan": ["sekaniyan", "skaniyan", "sukaniyan"],
        "bes": ["bs", "bus"],
        "kena": ["kna", "k'na", "kuna"],
        "perak": ["pirak"],
        "sempad": ["sumpad"],
        "saden": ["sadn", "sadun", "sad'n"],
        "bangnsa": ["bangsa"],
        "kapenggiginawai": ["friendship", "ginawae", "kapnggiginawae"],
        "ayaden": ["ayadun", "ayadn", "ayad'n"],
        "maregen": ["margn", "marugun", "marugen"],
        "map'ragon": ["maperagon", "mapragon", "mapuragon"],
        "pen": ["pun", "pn", "p'n"],
        "aya ngka": ["ayangka"],
        "palaw": ["palao"],
        "pheranti": ["pranti", "phuranti", "peranti", "puranti"],
        "betad": ["btad", "butad", "b'tad"],
        "peman": ["pman", "puman"],
        "tademan": ["tadman", "taduman", "tad'man"],
        "madakel": ["madakl", "madakul"],
        "benar": ["bunar", "bnar", "b'nar"],
        "aken": ["akun", "akn"],
        "seka": ["ska", "suka"],
        "gopen": ["gopun", "gopn"],
        "tanoren": ["tanorn", "tanorun"],
        "delem": ["dlm", "dulm", "dulum"],
        "Phagendod": ["phagndod", "phag'ndod"],
        "tindeg": ["tindug", "tindg"],
        "ber-bereg": ["br-brg", "bur-burug", "burug"],
        "pelangkap": ["langkap", "plangkap", "pulangkap"],
        "rek": ["rk", "ruk"],
        "nggalebek": ["galebel", "galubuk", "galbk"],
        "courtship": ["ligaw", "pagidaan", "panoksam", "kapamanganakan", "kandiyalaga"],
        "marriage": ["karoma", "karuma", "kawing", "kakhawing"],
        "leadership": ["kandato", "olowan", "datu", "dato"],
        "conflict resolution": ["kapamasad sa rido", "rido"],
        "enthronement": ["kabangensa", "kabangsa", "khabangsa"],
        "argumentation": ["kapangilat", "kazambi sa lalag", "kasambi sa lalag"],
        "moral teaching": ["kapamangtuma", "tuma", "toma", "ginawa", "sarili"],
        "self-reflection": ["kapangtuma sa ped sa taw"]
    }

    for normalized, variants in normalization_map.items():
        for variant in variants:
            text = text.replace(variant, normalized)

    return text.lower().strip()


df['original_proverb_meranaw_normalized'] = df['meranaw_proverb'].apply(normalize_meranaw_word)
df['english_translation_normalized'] = df['english_translation'].apply(normalize_meranaw_word)


df['combined_text'] = df.apply(
    lambda row: ' '.join(filter(None, [
        row.get('english_translation_normalized', ''),
        # row.get('original_interpretation', ''),  # Optionally normalize if needed
        # row.get('augmented_interpretation_normalized', ''),
        row.get('original_proverb_meranaw_normalized', '')
    ])),
    axis=1
)

model = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")
proverb_embeddings = model.encode(df["combined_text"].tolist())

# Optional: Customize theme mapping
theme_mapping = {
  "marriage": "Marriage",
  "wedding": "Marriage",
  "kawing": "Marriage",
  "kakhawing": "Marriage",
  "courtship": "Courtship",
  "dating": "Courtship",
  "ligaw": "Courtship",
  "pagidaan": "Courtship",
  "panoksam": "Courtship",
  "kapamanganakan": "Courtship",
  "kandiyalaga": "Courtship",
  "karoma": "Marriage",
  "karuma": "Marriage",
  "leadership": "Leadership",
  "authority": "Leadership",
  "kandato": "Leadership",
  "olowan": "Leadership",
  "datu": "Leadership",
  "dato": "Leadership",
  "conflict resolution": "Conflict Resolution",
  "rido": "Conflict Resolution",
  "kapamasad sa rido": "Conflict Resolution",
  "enthronement": "Enthronement",
  "kabangensa": "Enthronement",
  "kabangsa": "Enthronement",
  "khabangsa": "Enthronement",
  "argumentation": "Argumentation",
  "kapangilat": "Argumentation",
  "kazambi sa lalag": "Argumentation",
  "kasambi sa lalag": "Argumentation",
  "moral teaching": "Moral Teaching and Self-Reflection",
  "tuma": "Moral Teaching and Self-Reflection",
  "toma": "Moral Teaching and Self-Reflection",
  "ginawa": "Moral Teaching and Self-Reflection",
  "sarili": "Moral Teaching and Self-Reflection",
  "self-reflection": "Moral Teaching and Self-Reflection",
  "love": "Love",
  "affection": "Love",
}

def is_theme_present(row, target_theme):
    theme_value = row.get('Theme')
    if pd.isna(theme_value):
        return False
    theme_value_lower = theme_value.lower().strip()
    target_theme_lower = target_theme.lower().strip()

    if target_theme_lower in theme_value_lower:
        return True

    try:
        themes = ast.literal_eval(theme_value)
        if isinstance(themes, list):
            return target_theme_lower in [t.lower().strip() for t in themes]
    except (ValueError, TypeError, SyntaxError):
        return False

    return False

def search_proverbs_combined(query, top_n=5):
    normalized_query = normalize_meranaw_word(query).lower()
    semantic_results_df = pd.DataFrame()
    keyword_results_df = pd.DataFrame()
    theme_results_df = pd.DataFrame()
    common_cols = df.columns.tolist()

    # --- Semantic Search ---
    if proverb_embeddings is not None:
        query_embedding = model.encode([normalized_query])
        similarities = cosine_similarity(query_embedding, proverb_embeddings)[0]
        sorted_indices = np.argsort(similarities)[::-1]
        semantic_results_df = df.iloc[sorted_indices[:top_n]].copy()
        semantic_results_df['search_score'] = similarities[sorted_indices[:top_n]]
        semantic_results_df['search_type'] = 'semantic'
        semantic_results_df = semantic_results_df[common_cols + ['search_score', 'search_type']]

    import re

    pattern = rf'\b{re.escape(normalized_query)}\b'

    search_mask = df.apply(
    lambda row: any(re.search(pattern, normalize_meranaw_word(str(field)))
                    for field in [
                        row.get('original_proverb_meranaw_normalized', ''),
                        row.get('meranaw_proverb', ''),
                        row.get('english_translation', '')
                    ]),
    axis=1
)

    keyword_results_df = df[search_mask].head(top_n).copy()
    keyword_results_df['search_score'] = 1.0
    keyword_results_df['search_type'] = 'keyword'
    keyword_results_df = keyword_results_df[common_cols + ['search_score', 'search_type']]

    # --- Theme Search ---
    target_theme = theme_mapping.get(normalized_query.strip(), normalized_query.strip())
    theme_mask = df.apply(lambda row: is_theme_present(row, target_theme), axis=1)
    theme_results_df = df[theme_mask].head(top_n).copy()
    theme_results_df['search_score'] = 0.9
    theme_results_df['search_type'] = 'theme'
    theme_results_df = theme_results_df[common_cols + ['search_score', 'search_type']]

    # --- Combine Results ---
    combined_results = pd.concat([semantic_results_df, keyword_results_df, theme_results_df], ignore_index=True).drop_duplicates(subset=common_cols, keep='first')
    ranked_results = combined_results.sort_values(by='search_score', ascending=False).head(top_n)

    return ranked_results
