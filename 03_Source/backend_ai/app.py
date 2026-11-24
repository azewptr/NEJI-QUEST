import hashlib
import io
import json
import logging
import os
import time
import urllib.error
import urllib.request
from functools import lru_cache
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
LABELS = ["Ramuan", "Senjata", "Perisai"]
app = FastAPI(title="Neji Quest CNN v2")
logger = logging.getLogger("uvicorn.error")


@lru_cache(maxsize=1)
def load_model():
    return tf.keras.models.load_model(
        ROOT / "backend_ai/models/neji_cnn_v2.keras", compile=False
    )


@app.get("/")
def home():
    return FileResponse(ROOT / "frontend/index.html")


@app.post("/api/predict")
def predict(file: UploadFile = File(...)):
    raw = file.file.read(8 * 1024 * 1024 + 1)
    if not raw:
        raise HTTPException(400, "Berkas kosong. Pilih gambar kartu yang valid.")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(400, "Pilih gambar berukuran maksimal 8 MB.")
    try:
        with Image.open(io.BytesIO(raw)) as image:
            if image.width * image.height > 20_000_000:
                raise HTTPException(400, "Resolusi gambar terlalu besar.")
            resized = image.convert("RGB").resize((128, 128), Image.Resampling.BILINEAR)
            pixels = np.asarray(resized, dtype=np.float32)[None, ...]
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise HTTPException(400, "Gambar rusak atau format tidak didukung.") from error
    try:
        model = load_model()
        start = time.perf_counter()
        scores = np.asarray(model(pixels, training=False))[0]
        if scores.shape != (len(LABELS),) or not np.isfinite(scores).all():
            raise ValueError("Keluaran CNN harus berisi tiga skor yang valid.")
    except Exception as error:
        logger.exception("Analisis kartu gagal pada model CNN v2")
        raise HTTPException(
            503,
            "Analisis CNN gagal. Pasang ulang dependensi melalui PASANG_DEPENDENSI.bat "
            "dan mulai ulang JALANKAN_WEB.bat. Jika masih gagal, periksa terminal server.",
        ) from error
    index = int(np.argmax(scores))
    return {
        "label": LABELS[index], "item_id": index + 1,
        "score": float(scores[index]), "model": "neji_cnn_v2.keras",
        "inference_ms": round((time.perf_counter() - start) * 1000, 2),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }


class Message(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=1500)


class HintRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=8)


@app.post("/api/hint")
def hint(body: HintRequest):
    if any(message.role not in ("user", "assistant") for message in body.messages):
        raise HTTPException(400, "Peran percakapan tidak valid.")
    prompt = (ROOT / "backend_ai/prompt.txt").read_text(encoding="utf-8")
    payload = {
        "model": os.environ.get("OLLAMA_MODEL", "qwen2.5:3b"),
        "messages": [{"role": "system", "content": prompt}]
        + [message.model_dump() for message in body.messages],
        "stream": False,
    }
    request = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            result = json.load(response)
        return {"answer": result["message"]["content"], "model": payload["model"]}
    except (urllib.error.URLError, TimeoutError, KeyError, ValueError) as error:
        raise HTTPException(503, "LLM belum siap. Jalankan Ollama dan unduh model sesuai README.") from error


app.mount("/static", StaticFiles(directory=ROOT / "frontend"), name="frontend")
