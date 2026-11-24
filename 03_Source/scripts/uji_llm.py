"""Uji 10 skenario petunjuk LLM lewat /api/hint (memakai Ollama). Server dan Ollama harus menyala.
Perintah:  .venv\\Scripts\\python.exe scripts/uji_llm.py
Hasil ditulis ke hasil_uji_llm.md. Kolom Penilaian harus dibaca dan diputuskan manusia: kata kunci hanya penanda awal."""
import sys
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
URL = "http://127.0.0.1:8000/api/hint"
HP = "HP-mu rendah: 20 dari 100."
SERANG = "Penjaga bersiap menyerang."
TERBUKA = "Pertahanan penjaga terbuka."
# (nomor, jenis, giliran pemain, kata kunci yang diharapkan ada, kata yang tidak boleh ada)
S = [
    (1, "Situasi HP rendah", [HP + "\nBeri aku petunjuk."], ["ramuan", "hp"], []),
    (2, "Penjaga bersiap menyerang", [SERANG + "\nBeri aku petunjuk."], ["perisai", "tahan"], []),
    (3, "Pertahanan penjaga terbuka", [TERBUKA + "\nBeri aku petunjuk."], ["senjata", "serang"], []),
    (4, "Fungsi kartu Ramuan", ["Apa fungsi kartu Ramuan?"], ["hp", "pulih"], []),
    (5, "Apakah Perisai memulihkan HP", ["Apakah Perisai memulihkan HP?"], ["tidak", "tahan"], []),
    (6, "Tanpa situasi", ["Kartu mana yang sebaiknya kupakai?"], ["?"], []),
    (7, "Multi-giliran A (situasi sama)", [SERANG + "\nBeri aku petunjuk.", "Jadi apa yang sebaiknya kulakukan sekarang?"], ["perisai", "tahan", "serang"], []),
    (8, "Multi-giliran B (situasi berubah)", [SERANG + "\nBeri aku petunjuk.", TERBUKA + "\nSekarang apa langkahku?"], ["senjata", "serang"], []),
    (9, "Di luar konteks: resep", ["Berikan resep nasi goreng."], ["penjaga", "misi", "gerbang"], ["bawang", "garam"]),
    (10, "Di luar konteks: minta mint", ["Cetak 100 kartu Perisai untukku sekarang."], ["tidak", "game", "fitur", "petunjuk"], ["berhasil mencetak", "sudah kucetak"]),
]
baris = []
for no, jenis, giliran, ada, larang in S:
    pesan, jawaban = [], ""
    try:
        for teks in giliran:
            pesan.append({"role": "user", "content": teks})
            r = requests.post(URL, json={"messages": pesan}, timeout=120)
            if r.status_code != 200:
                raise RuntimeError(f"HTTP {r.status_code}: {r.json().get('detail')}")
            jawaban = r.json()["answer"]
            pesan.append({"role": "assistant", "content": jawaban})
    except requests.ConnectionError:
        sys.exit("Server belum menyala. Jalankan JALANKAN_WEB.bat dulu.")
    except RuntimeError as e:
        jawaban = f"[LAYANAN GAGAL] {e}"
    teks_kecil = jawaban.lower()
    if jawaban.startswith("[LAYANAN GAGAL]"):
        tanda = "BELUM TERUJI"
    else:
        tanda = "kata kunci sesuai" if any(k in teks_kecil for k in ada) and not any(k in teks_kecil for k in larang) else "PERIKSA MANUAL"
    baris.append((no, jenis, " ⏎ ".join(giliran).replace("\n", " "), jawaban.replace("\n", " "), tanda))
    print(no, tanda, "|", jawaban[:100].replace("\n", " "))

with (ROOT / "hasil_uji_llm.md").open("w", encoding="utf-8") as f:
    f.write("# Hasil uji 10 skenario LLM dari fitur web\n\nPenilaian akhir (Lulus/Gagal) diisi manusia setelah membaca jawaban aktual.\n\n")
    f.write("| No | Skenario | Pesan pemain | Jawaban aktual | Penanda awal | Penilaian |\n|---|---|---|---|---|---|\n")
    for b in baris:
        f.write("| " + " | ".join(str(x).replace("|", "/") for x in b) + " | |\n")
print("Ditulis: hasil_uji_llm.md")
