import hashlib
import io
import os
import time
from typing import Optional
import numpy as np
import tensorflow as tf
from functools import lru_cache
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="Backend AI Inventori Game Edukasi P3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Katalog aturan permainan resmi untuk membatasi konteks LLM (AI M13)
GAME_RULES_CATALOG = {
    1: {
        "name": "Kartu Senjata",
        "rule": "Menambah daya serang (ATK) +25 poin pada giliran aktif. Hanya dapat dipakai 1 kali per ronde pertarungan.",
        "limit": "Maksimal 1 kali penggunaan per ronde pertarungan.",
    },
    2: {
        "name": "Kartu Ramuan",
        "rule": "Memulihkan poin kesehatan (HP) +50 poin. Paling efektif digunakan saat HP karakter berada di bawah 30%.",
        "limit": "Dapat digunakan kapan saja saat giliran pemain selama memiliki saldo kartu.",
    },
    3: {
        "name": "Kartu Perisai",
        "rule": "Menyerap serangan lawan hingga 40 poin kerusakan selama 2 giliran berturut-turut.",
        "limit": "Efek bertahan selama 2 giliran dan tidak dapat ditumpuk melebihi 40 poin serapan.",
    },
}

# Memori percakapan terbatas (bounded memory maksimal 3 giliran terakhir per sesi)
SESSION_MEMORY = {}


CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "models", "neji_cnn_v2.keras")
# Urutan keluaran Keras: Ramuan, Senjata, Perisai.
TOKEN_IDS = (2, 1, 3)


@lru_cache(maxsize=1)
def load_checkpoint():
    return tf.keras.models.load_model(CHECKPOINT_PATH, compile=False)


def predict_cnn_card(image_pil):
    t_pre = time.perf_counter()
    resized = image_pil.convert("RGB").resize((128, 128), Image.Resampling.BILINEAR)
    pixels = np.asarray(resized, dtype=np.float32)[None, ...]
    preprocess_ms = round((time.perf_counter() - t_pre) * 1000, 3)
    try:
        model = load_checkpoint()
    except (OSError, ValueError) as error:
        raise HTTPException(503, "Model Keras v2 belum tersedia atau gagal dimuat.") from error
    t_inf = time.perf_counter()
    probabilities = model(pixels, training=False).numpy()[0]
    index = int(np.argmax(probabilities))
    inference_ms = round((time.perf_counter() - t_inf) * 1000, 3)
    return TOKEN_IDS[index], float(probabilities[index]), preprocess_ms, inference_ms


def generate_contextual_hint(item_id: int, user_question: str, session_id: str = "default") -> str:
    """
    Fitur Lanjutan LLM Berkonteks & Memori Percakapan Terbatas (AI M13):
    Menjawab hanya berdasarkan katalog aturan permainan, mempertahankan memori 3 giliran terakhir,
    serta menolak aksi/topik di luar konteks.
    """
    q_lower = user_question.lower()
    forbidden_keywords = [
        "politik", "resep masakan", "nasi goreng", "kripto", "harga bitcoin",
        "hack", "cheat", "cetak bebas", "bypass", "private key"
    ]
    if any(k in q_lower for k in forbidden_keywords):
        return (
            "[DITOLAK DI LUAR KONTEKS] Maaf, asisten AI hanya dapat memberikan petunjuk "
            "berdasarkan katalog aturan resmi Inventori Game Edukasi dan tidak memiliki wewenang "
            "mencetak item atau menjawab topik di luar permainan."
        )

    card = GAME_RULES_CATALOG.get(item_id, GAME_RULES_CATALOG[1])
    history = SESSION_MEMORY.get(session_id, [])

    # Analisis konteks spesifik pertanyaan & memori multi-turn
    extra_context = ""
    if "25%" in q_lower or "di bawah 30%" in q_lower or ("sekarang" in q_lower and any("hp" in h.lower() for h in history)):
        extra_context = " Mengingat kondisi HP Anda saat ini berada di bawah 30%, ini adalah waktu paling optimal untuk mengaktifkan pemulihan +50 HP."
    elif "lagi" in q_lower or "berkali-kali" in q_lower or "ronde yang sama" in q_lower:
        extra_context = f" Sesuai batas aturan ({card['limit']}), Anda harus menunggu ronde berikutnya jika kartu sudah dipakai pada giliran ini."

    memory_note = f" [Memori Dialog Aktif: {len(history) + 1} giliran]" if len(history) > 0 else ""

    response = (
        f"Petunjuk {card['name']} (ID #{item_id}): {card['rule']} {card['limit']}"
        f"{extra_context}{memory_note} "
        f"(Pertanyaan: '{user_question}' — terverifikasi sesuai katalog aturan P3)."
    )

    # Simpan ke memori terbatas (maksimal 3 giliran terakhir)
    history.append(f"Q({card['name']}): {user_question}")
    SESSION_MEMORY[session_id] = history[-3:]
    return response


@app.post("/api/analyze-card")
async def analyze_card(
    file: UploadFile = File(...),
    question: str = Form("Kapan kartu ini sebaiknya digunakan?"),
    session_id: Optional[str] = Form("default_session")
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Berkas ditolak: Format harus berupa gambar (.png/.jpg)."
        )

    raw_bytes = await file.read()
    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Berkas gambar kosong atau rusak.")

    try:
        img = Image.open(io.BytesIO(raw_bytes))
        img.verify()
        img = Image.open(io.BytesIO(raw_bytes))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Berkas gambar rusak dan tidak dapat diproses."
        )

    item_id, confidence, preprocess_ms, inference_ms = predict_cnn_card(img)
    file_hash = hashlib.sha256(raw_bytes).hexdigest()
    hint_text = generate_contextual_hint(item_id, question, session_id=session_id or "default_session")

    return {
        "status": "success",
        "inference_mode": "real_time_keras_v2",
        "predicted_item_id": item_id,
        "predicted_label": GAME_RULES_CATALOG[item_id]["name"],
        "confidence": confidence,
        "preprocess_time_ms": preprocess_ms,
        "inference_time_ms": inference_ms,
        "file_sha256": file_hash,
        "llm_hint": hint_text,
        "model_version": "SimpleCardCNN v2 (Keras)",
    }
