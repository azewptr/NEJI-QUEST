# Dokumentasi bagian Azera: web, gameplay, dan uji integrasi

Dibuat pada 18 November 2026 dari paket `Neji_Quest_Perbaikan_Unggah.zip` (yang berisi perbaikan unggah dari tim) digabung dengan perbaikan Azera. Dokumen ini memisahkan **apa yang sudah saya jalankan sendiri di sandbox** dari **apa yang masih harus kamu uji di laptop atau bersama tim**.

## 0. Tentang paket gabungan ini

`Neji_Quest_Perbaikan_Unggah.zip` dibuat dari versi **asli**, jadi perbaikan Azera tidak ada di sana, sedangkan perbaikan tim belum ada di versi Azera sebelumnya. Paket ini menggabungkan keduanya.

**Dari paket Perbaikan Unggah (dipertahankan):** `keras==3.13.2` dikunci beserta `requirements-lock.txt`; backend mengembalikan JSON 503 dan mencatat traceback di terminal bila model atau inferensi gagal; label **Unggah Kartu** dan **Analisis gambar**; status "Gambar dipilih"; batas 8 MB di frontend; `JALANKAN_WEB.bat` memilih `.venv` lebih dulu; skrip `test_upload.py` dan `test_response.cjs`; `frontend/contract-11155111.json` (kontrak Sepolia).

**Dari perbaikan Azera (ditambahkan):** pesan error kontrak dan jaringan, catatan koreksi kurator, tema RPG, HP misi, dan skrip `uji_api.py` serta `uji_llm.py`.

**Perubahan pada paket gabungan:**
- Folder `data/dataset` (120 gambar) **dikembalikan dari paket asli**. ZIP Perbaikan Unggah tidak membawanya, sehingga `check_data.py` akan gagal tanpa itu.
- `artifacts/` dan `cache/` dihapus karena hasil build yang dibuat ulang otomatis oleh Hardhat.
- `frontend/contract-31337.json` dihapus. Berkas itu berisi alamat deployment lokal lama. Jalankan `npm.cmd run deploy:local` untuk membuatnya lagi.
- Pesan "Berkas kosong" dipisahkan dari pesan batas 8 MB.

## 1. Konfigurasi paket yang sudah diperiksa terhadap kode

| Klaim | Hasil pemeriksaan |
|---|---|
| ID Ramuan 1, Senjata 2, Perisai 3 | Sesuai: `NejiInventory.sol` (id 1 sampai 3), `backend_ai/app.py` (`item_id = index + 1`), pilihan `<select>` di web. |
| Backend FastAPI, web dilayani dari `http://127.0.0.1:8000` | Sesuai. `/` mengirim `index.html`, `/static` mengirim isi folder `frontend`. |
| `POST /api/predict`, field multipart `file` | Sesuai. |
| `POST /api/hint` memakai Ollama `qwen2.5:3b` | Sesuai (`OLLAMA_MODEL` dapat diubah). |
| Python 3.11/3.12, Node.js 22 | Sesuai. `requirements.txt` dipasang dan berjalan pada Python 3.12 + TensorFlow 2.20.0. |
| ABI frontend cocok dengan kontrak | Sesuai: `configure`, `mint`, `balanceOf`, `uri`, `safeTransferFrom`, `items`. |

## 2. Fitur yang sudah ada dan pekerjaan Azera

**Sudah tersedia dari tim:** dataset 120 gambar dan manifest, model CNN v2, backend prediksi dan petunjuk, kontrak ERC-1155 dengan peran penerbit dan kuota, tes Hardhat, web dengan tiga halaman (Unggah Kartu, Inventori, Misi), pengaturan jaringan, dan skrip deploy.

**Pekerjaan Azera:** memastikan alur pindai sampai koreksi kurator bekerja, memeriksa misi, merapikan tampilan dan pesan status, menguji IPFS dan inventori, menguji bersama Naja, lalu merekam demo dan mencatat uji pengguna.

## 3. Instalasi dan menjalankan di Windows (VS Code)

Semua perintah diketik di **Terminal VS Code** (Terminal → New Terminal) pada folder `03_Source`.

1. Pasang **Python 3.12** (installer Windows 64-bit, centang *Add python.exe to PATH*) dan **Node.js 22 LTS**. Buka ulang VS Code. Cek `py --list` (harus ada 3.12) dan `node --version`.
2. Lingkungan Python (satu perintah per kali ketik):
   ```powershell
   py -3.12 -m venv .venv
   .venv\Scripts\python.exe -m pip install -r backend_ai/requirements.txt
   npm.cmd ci
   ```
3. Periksa data dan model. Hasil yang benar: `Lulus: 120 gambar, pembagian 20/10/10 per kelas, setiap grup utuh, model 3 kelas.`
   ```powershell
   .venv\Scripts\python.exe scripts/check_data.py
   ```
4. Jalankan web (terminal ini dibiarkan terbuka). Hasil yang benar: `Uvicorn running on http://127.0.0.1:8000`. Lain kali cukup klik dua kali `JALANKAN_WEB.bat`.
   ```powershell
   .venv\Scripts\python.exe -m uvicorn backend_ai.app:app --port 8000
   ```
5. Buka `http://127.0.0.1:8000`. Menu **Unggah Kartu**: pilih `data/kartu_baru.png`, klik **Analisis gambar**. Hasil yang diharapkan: `Saran AI: Perisai (ID 3) · Keyakinan sekitar 98%`, panel kurator terbuka otomatis.
6. **Ollama (untuk Minta Petunjuk):** pasang dari ollama.com dan buka aplikasinya. Di terminal baru: `ollama pull qwen2.5:3b` (unduhan besar), lalu `ollama list` harus menampilkan `qwen2.5:3b`. Permintaan pertama lambat karena model dimuat; batas waktu backend 90 detik.
7. **Kontrak lokal + MetaMask** (butuh dua terminal tambahan):
   - Terminal A: `npm.cmd run node` (biarkan menyala; mencetak 20 akun latihan beserta private key).
   - Terminal B: `npm.cmd run deploy:local` (membuat `frontend/contract-31337.json`). Muat ulang web.
   - MetaMask: Tambah jaringan manual: RPC `http://127.0.0.1:8545`, Chain ID `31337`, simbol `ETH`. Impor private key **akun #0** (kurator/penerbit) dan **akun #1** (pemain), **akun #2** (penerima), semuanya dari terminal A. Jangan pakai wallet dengan dana asli.
   - Web: *Pengaturan jaringan* → Lokal Hardhat; alamat kontrak terisi otomatis. Jika node dimatikan, deploy ulang.

## 4. Daftar perubahan dan alasannya

Struktur dan kode tim dipertahankan. Perubahan Azera hanya pada 4 berkas (ditambah 2 skrip dan dokumen ini). Perbaikan tim yang dipertahankan ada di bagian 0.

| Berkas | Perubahan | Alasan |
|---|---|---|
| `frontend/app.js` | ABI diberi *custom error* kontrak dan pesan galat diterjemahkan (`friendly`). | Diuji: tanpa ini, mint oleh pemain tampil sebagai "execution reverted (unknown custom error)". ethers v6 tidak men-decode custom error pada transaksi tulis, jadi di-decode manual dari `error.data`. |
| `frontend/app.js` | Pembatalan di wallet, saldo kurang, bukan penerbit, kuota habis, metadata dibekukan, server mati, dan waktu habis memakai pesan Indonesia yang jelas. | Pesan asli ("Failed to fetch", "user rejected action") tidak membantu pengguna. |
| `frontend/app.js` | `json()` tidak lagi gagal dengan "Unexpected token" saat server membalas non-JSON. | Galat 500 dari server menghasilkan pesan yang tidak terbaca. |
| `frontend/app.js` | Metadata IPFS gagal dibuka ditangani dengan pesan khusus. | Syarat penanganan media IPFS tidak tersedia. |
| `frontend/app.js` | Hasil pindai menampilkan kategori, ID, keyakinan, waktu inferensi, dan peringatan bila keyakinan < 70%. Panel kurator terbuka otomatis. | Hasil sebelumnya hanya skor, dan kategori final tersembunyi di dalam panel tertutup. |
| `frontend/app.js` | Catatan "Kategori final sesuai saran AI" atau "Kurator mengoreksi: ...". Provenance metadata mendapat `curator_final_category` dan `curator_corrected`. | Kurator dapat melihat koreksinya, dan metadata mencatat apakah AI dikoreksi. Tidak mengubah CID yang sudah ada. |
| `frontend/app.js` | Tombol dinonaktifkan selama transaksi atau permintaan berjalan. Tanda halaman aktif pada menu (`aria-current`). | Mencegah klik ganda dan menunjukkan posisi. |
| `frontend/app.js` | Misi: pilihan kartu dua langkah (pilih, lalu Gunakan), ikon SVG sederhana, bar HP 20, 50, 50 untuk tiga giliran. | HP 50 di giliran 2 mengikuti mockup. Nilai giliran 3 (50) adalah asumsi saya; ubah `hps` di `app.js` bila berbeda. |
| `frontend/app.js` | Situasi giliran 1 menjadi "HP-mu rendah: 20 dari 100." Petunjuk menampilkan pertanyaan dan jawaban. | Mengikuti proposal (HP 20 dari 100). Percakapan lebih mudah dibaca. |
| `frontend/index.html` | Catatan di halaman Misi bahwa misi berupa latihan di sesi browser dan kepemilikan diperiksa di Inventori. Petunjuk di Inventori. Batas ukuran file pada label. | Permintaan eksplisit. |
| `frontend/app.js`, `index.html`, `style.css` | **Semua notifikasi menjadi popup** di bagian atas layar (fungsi `status()`): hijau untuk berhasil, biru untuk info, merah untuk error (10 detik), kuning dengan animasi putar untuk proses berjalan (tetap tampil sampai selesai). Popup berhasil dan info hilang sendiri setelah 6 detik, dan semuanya punya tombol tutup (×). Pesan status di atas halaman dan teks umpan balik misi dihapus. | Permintaan Azera. Popup error memakai `role=alert` agar terbaca pembaca layar. |
| `frontend/style.css`, `frontend/index.html` (Misi) | Tampilan mengikuti **mockup tim**: latar terang dengan aksen hijau, tab menu bergaris bawah (urutan Misi, Inventori, Unggah Kartu; Misi sebagai halaman awal), bar HP, kartu bergambar, pilih kartu lalu tombol **Gunakan [kartu]**, dan **Minta Petunjuk** sebagai tautan. Status tetap terlihat saat halaman digulir, tombol minimal 44 px, tata letak ponsel. | Awalnya saya membuat tema gelap sendiri tanpa menanyakan desain tim. Sekarang dikembalikan ke mockup. Tidak ada level atau mekanik baru. |
| `backend_ai/app.py` | Berkas kosong kini membalas "Berkas kosong..." (sebelumnya "maksimal 8 MB"). | Pesan sebelumnya menyesatkan. |
| `scripts/uji_api.py` (baru) | Uji `/api/predict`: gambar valid, rusak, kosong, lebih 8 MB, dan 30 gambar split uji. | Bukti uji integrasi yang dapat diulang. |
| `scripts/uji_llm.py` (baru) | Menjalankan 10 skenario (3 situasi, 2 fungsi kartu, 1 tanpa situasi, 2 multi-giliran, 2 di luar konteks) lewat `/api/hint` dan menulis `hasil_uji_llm.md`. | Bukti uji LLM dari fitur web. Penilaian akhir diisi manusia. |

Tidak diubah: kontrak, tes, skrip deploy, model, prompt, dataset, dan CID apa pun. Tidak ada metadata baru yang diterbitkan.

## 5. Hasil pengujian

### 5a. Sudah saya jalankan sendiri (sandbox Linux, Python 3.12, Node 22)

| Pengujian | Hasil |
|---|---|
| `npx hardhat test` | 16 dari 16 lulus. |
| `npm run coverage` | 100% statements, branches, functions, dan lines untuk `NejiInventory.sol`. |
| Backend asli + model asli, `kartu_baru.png` | HTTP 200, **Perisai, ID 3, skor 0,9803**, 9,8 sampai 45 ms (angka waktu bervariasi tiap panggilan). |
| Gambar rusak, berkas kosong, berkas > 8 MB | HTTP 400 dengan pesan yang jelas. |
| Paket gabungan dengan `keras==3.13.2` (sandbox, salinan terpisah) | `npm ci` berhasil; Hardhat 16 dari 16; `check_data.py` lulus (120 gambar, 20/10/10); `uji_api.py` hasilnya sama dengan di bawah; `test_response.cjs` 5 PASS; uji `app.js` **52 dari 52**. |
| 30 gambar split uji lewat API | **29/30 benar**. Satu salah: `ramuan_37.png` diprediksi Perisai. Konsisten dengan laporan Colab Revianna (29/30). Ini uji sambungan aplikasi, bukan pengganti evaluasi resmi. |
| Alur Web3 dengan ABI persis dari `app.js` pada node Hardhat | configure, mint, saldo, transfer lulus. Penolakan configure ulang, mint tanpa peran, melebihi kuota, item belum dikonfigurasi, dan transfer melebihi saldo lulus. Gas mint 77.651 untuk mint ke-1 pada contoh itu; gas transfer 57.080. |
| Uji `app.js` di jsdom: backend dan model asli, node Hardhat asli, wallet dan gateway IPFS **ditiru** | **52 dari 52 lulus**: tiga giliran misi dan pilihan salah, mulai ulang, navigasi, pratinjau, pindai, koreksi kurator, isi metadata (final dan koreksi), gambar rusak, kosong, server mati, LLM gagal, jaringan salah, URI tidak valid, IPFS tidak tersedia, configure/mint/transfer, batal di wallet, bukan penerbit, saldo setelah transfer dan setelah pergantian akun. |

### 5b. Enam kasus uji integrasi (expected vs actual)

| Kasus | Expected | Actual di sandbox | Uji di laptopmu |
|---|---|---|---|
| Alur sukses | Perisai ID 3, configure, mint, saldo, transfer | Lulus (wallet ditiru) | ☐ dengan MetaMask asli |
| Gambar rusak | Pesan "Gambar rusak atau format tidak didukung." | Lulus | ☐ |
| AI/LLM gagal | Pesan jelas; server mati: "Tidak dapat menghubungi server..."; Ollama mati: "LLM belum siap..." | Lulus untuk keduanya | ☐ |
| Koreksi prediksi | Metadata `category` = kategori final, `curator_corrected: true` | Lulus | ☐ |
| Wallet ditolak / jaringan salah | "Permintaan dibatalkan di wallet." dan "Jaringan wallet berbeda..." | Lulus | ☐ MetaMask asli |
| IPFS tidak tersedia | "Metadata IPFS tidak dapat dibuka..." (configure) dan "Metadata IPFS belum tersedia." (kartu) | Lulus dengan gateway ditiru | ☐ dengan Pinata asli |

### 5c. Belum diuji (menunggu layanan atau anggota tim)

- **LLM nyata (Ollama):** belum bisa dijalankan di sandbox. Jalankan `scripts/uji_llm.py` di laptopmu setelah `ollama pull qwen2.5:3b`. Skor "10 dari 10" milik Revianna berlaku untuk uji di chat, bukan untuk web.
- **MetaMask asli** melalui antarmuka, termasuk popup persetujuan.
- **Gateway Pinata asli:** sandbox tidak punya akses internet ke Pinata. Gambar dan metadata Perisai belum dibuka dari gateway di `app.js`.
- **Tampilan di browser dan ponsel:** sandbox tidak punya browser grafis. CSS ditulis responsif tetapi **belum saya lihat secara visual**. Periksa di Chrome: F12 → Ctrl+Shift+M → pilih ukuran ponsel (lebar 375 px), lalu periksa tiap halaman.
- **Kontrak Sepolia:** `contract-11155111.json` berisi alamat `0x55e24295A0773CE4d198ad16d6E822FF4412D468`, hash deployment `0x04451cf1...5be4d`, dan gas 11.620.166. Sandbox tidak punya akses ke jaringan Sepolia, jadi **alamat ini belum saya periksa di jaringan**. Cocokkan dengan Dakhirotun dan lihat di sepolia.etherscan.io.
- Uji tiga pengguna, dan rekaman demo.

## 6. Kendala dan catatan yang masih tersisa

1. **Gateway Pinata dikunci di `app.js`** (`blue-gigantic-puma-300.mypinata.cloud`). Belum terbukti dapat dibuka dari laptop lain. Gateway khusus kadang membatasi akses.
2. **Metadata Perisai contoh hanya berisi nama, deskripsi, kategori, dan gambar.** Tidak ada pembuat, sumber/izin, versi, dan provenance AI. Metadata yang dibuat tombol *Setujui dan unduh* sudah lengkap, tetapi CID-nya baru. Setelah `configure`, URI dibekukan di kontrak. Putuskan bersama Revianna dan Naja sebelum konfigurasi final.
3. Alamat RPC Sepolia bawaan di `hardhat.config.cjs` adalah RPC publik. Pakai RPC milik Naja.
4. Ambang peringatan keyakinan rendah (70%) adalah pilihan saya. Ubah di `app.js` bila perlu.
5. Misi hanya mencatat pilihan di sesi browser. Kartu tidak berkurang, dan ini sudah dinyatakan di halaman.
6. Dua hal desain perlu diputuskan tim: nama menu (mockup tertulis "Pindai Kartu", paket Perbaikan Unggah memakai "Unggah Kartu") dan nilai HP giliran 3.
7. Status izin dataset (sintetis hasil generasi AI, CC0 belum ditetapkan) perlu ditegaskan Revianna untuk laporan.

## 7. Kebutuhan dari Revianna dan Naja

**Revianna**
- Konfirmasi gateway Pinata dapat dibuka dari jaringan lain. Berikan juga gambar dan metadata final Ramuan dan Senjata beserta CID, atau kartu yang akan diunggah Azera.
- Keputusan metadata Perisai: tetap versi singkat atau diganti versi lengkap sebelum configure.
- Hasil 10 skenario LLM dari web (jalankan `scripts/uji_llm.py` bersama), dan keputusan apakah petunjuk boleh menyebut nama kartu.
- Log Colab, tangkapan layar pelatihan, evaluasi CNN dan SVM (kode SVM dan evaluasi tidak ada di paket ini), serta status izin dataset.

**Naja**
- Konfirmasi akun latihan dan peran: akun #0 deployer, admin, dan penerbit.
- Kuota Ramuan dan Senjata untuk configure, dan siapa yang menjalankan `npm.cmd run node`.
- RPC Sepolia, kunci wallet latihan (jangan dibagikan di chat atau screenshot), alamat kontrak Sepolia, `contract-11155111.json`, dan bukti transaksi.
- Log `test-results.txt` dan `coverage-results.txt` hasil jalan di laptop Naja, serta catatan gas mint dan transfer.

## 8. Uji pemakaian tiga pengguna

Pakai browser dengan MetaMask dan akun latihan. Jangan bantu pengguna. Catat waktu dan kendala.

Tugas yang diberikan: (1) pindai `kartu_baru.png` dan sebutkan hasilnya, (2) lihat saldo Perisai di Inventori, (3) selesaikan misi tiga giliran, (4) kirim satu kartu ke akun lain, (5) coba Minta Petunjuk.

| Pengguna | Tugas 1 | Tugas 2 | Tugas 3 | Tugas 4 | Tugas 5 | Waktu total | Kendala dan komentar |
|---|---|---|---|---|---|---|---|
| 1 | ☐ | ☐ | ☐ | ☐ | ☐ | | |
| 2 | ☐ | ☐ | ☐ | ☐ | ☐ | | |
| 3 | ☐ | ☐ | ☐ | ☐ | ☐ | | |

Tanyakan di akhir: bagian mana yang membingungkan, apakah pesan galat membantu, dan apakah tahu bahwa misi tidak mengurangi kartu.

## 9. Urutan demonstrasi pekerjaan Azera (sekitar 6 menit)

1. Buka `http://127.0.0.1:8000`: jelaskan tiga halaman.
2. **Unggah Kartu**: pilih `kartu_baru.png`, pratinjau muncul, klik Pindai, tunjukkan Perisai ID 3 dengan keyakinannya.
3. **Koreksi kurator:** ubah kategori final ke Ramuan (catatan koreksi muncul), lalu kembalikan ke Perisai.
4. Hubungkan wallet kurator (akun #0), klik **Isi CID Perisai** dan **Setujui dan unduh metadata**, tunjukkan isi JSON.
5. **Tetapkan edisi** lalu **Terbitkan kartu** ke akun #1: tunjukkan status menunggu persetujuan, menunggu konfirmasi, berhasil, receipt, dan gas.
6. Ganti MetaMask ke akun #1, buka **Inventori**, Perbarui saldo: Perisai 1 dengan gambar IPFS.
7. **Kirim** satu Perisai ke akun #2, perbarui saldo pengirim, ganti akun, dan perbarui saldo penerima.
8. **Misi:** tiga giliran, satu pilihan salah dan coba lagi, **Minta Petunjuk** (Ollama menyala), Mulai ulang.
9. **Kasus gagal:** gambar rusak, mint oleh akun pemain (ditolak), batalkan transaksi di MetaMask.
10. Tutup dengan menunjukkan `hasil_uji_api.md` dan `hasil_uji_llm.md` (jalankan skripnya terlebih dahulu di laptopmu).
