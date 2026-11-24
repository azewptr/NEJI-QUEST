"""Uji API /api/predict secara langsung. Jalankan setelah server menyala di http://127.0.0.1:8000.
Perintah:  .venv\\Scripts\\python.exe scripts/uji_api.py
Hasil ditulis ke hasil_uji_api.md. Ini uji aplikasi (API), bukan pengganti evaluasi CNN/SVM di Colab."""
import csv, io, sys
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
URL = "http://127.0.0.1:8000/api/predict"
baris = []

def kirim(nama, isi, tipe="image/png"):
    r = requests.post(URL, files={"file": (nama, isi, tipe)}, timeout=60)
    try:
        return r.status_code, r.json()
    except ValueError:
        return r.status_code, {"detail": r.text[:80]}

def catat(kasus, harapan, aktual, lulus):
    baris.append((kasus, harapan, aktual, "LULUS" if lulus else "GAGAL"))
    print(("LULUS" if lulus else "GAGAL"), "|", kasus, "|", aktual)

try:
    kode, data = kirim("kartu_baru.png", (ROOT / "data/kartu_baru.png").read_bytes())
except requests.ConnectionError:
    sys.exit("Server belum menyala. Jalankan JALANKAN_WEB.bat dulu.")
catat("Alur berhasil: data/kartu_baru.png", "Perisai, ID 3, HTTP 200",
      f"HTTP {kode}, {data.get('label')}, ID {data.get('item_id')}, skor {data.get('score', 0):.4f}, {data.get('inference_ms')} ms",
      kode == 200 and data.get("item_id") == 3)
kode, data = kirim("palsu.png", b"ini bukan gambar")
catat("Gambar rusak (teks bernama .png)", "HTTP 400 + pesan jelas", f"HTTP {kode}, {data.get('detail')}", kode == 400)
kode, data = kirim("kosong.png", b"")
catat("Berkas kosong", "HTTP 400 + pesan jelas", f"HTTP {kode}, {data.get('detail')}", kode == 400)
kode, data = kirim("besar.png", b"0" * (8 * 1024 * 1024 + 10))
catat("Berkas lebih dari 8 MB", "HTTP 400 + pesan jelas", f"HTTP {kode}, {data.get('detail')}", kode == 400)

# 30 gambar split uji pada manifest, dikirim lewat API (uji sambungan, bukan evaluasi resmi)
if not (ROOT / "data/dataset").is_dir():
    catat("30 gambar split uji lewat API", "mendekati 29/30", "DILEWATI: folder data/dataset tidak ada. Salin dari paket asli tim", False)
    selesai = True
else:
    selesai = False
id_kelas = {"Ramuan": 1, "Senjata": 2, "Perisai": 3}
benar = total = 0
salah = []
with (ROOT / "data/manifest_neji_split_v2.csv").open(encoding="utf-8-sig") as f:
    for row in ([] if selesai else csv.DictReader(f)):
        if row["pembagian"] != "test":
            continue
        path = ROOT / "data/dataset" / row["kelas"].lower() / Path(row["file"]).name
        kode, data = kirim(path.name, path.read_bytes())
        total += 1
        if kode == 200 and data["item_id"] == id_kelas[row["kelas"]]:
            benar += 1
        else:
            salah.append(f"{path.name}: sebenarnya {row['kelas']}, prediksi {data.get('label')}")
if not selesai:
    catat("30 gambar split uji lewat API", "mendekati 29/30 (hasil Colab Revianna)", f"{benar}/{total} benar. Salah: {'; '.join(salah) or '-'}", total == 30 and benar >= 27)

with (ROOT / "hasil_uji_api.md").open("w", encoding="utf-8") as f:
    f.write("# Hasil uji API /api/predict\n\n| Kasus | Harapan | Hasil aktual | Status |\n|---|---|---|---|\n")
    for b in baris:
        f.write("| " + " | ".join(x.replace("|", "/") for x in b) + " |\n")
print("Ditulis: hasil_uji_api.md")
