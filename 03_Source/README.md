# Neji Quest dengan dataset dan CNN v2 Revianna

Folder ini adalah proyek baru untuk kartu Ramuan, Senjata, dan Perisai milik Kelompok Neji. Dataset lengkap 120 gambar ada di data/dataset. File neji_cnn_v2.keras sudah disertakan di backend_ai/models. Manifest memakai pembagian grup versi 2 yang sudah kalian periksa di Colab. Hasil eksperimen sebelumnya tersimpan sebagai bukti pekerjaan Revianna, dan perlu dirujuk ke log Colab saat membuat laporan.

ID pada kontrak baru mengikuti urutan model secara langsung. Ramuan adalah 1, Senjata 2, Perisai 3. Urutan indeks model adalah 0, 1, 2. Gunakan kontrak NejiInventory dari folder ini agar web dan kontrak memakai aturan yang sama.

Cara membuka di laptop teman: ekstrak ZIP, masuk folder 03_Source, pasang Python 3.11/3.12 dan Node.js 22, lalu klik dua kali PASANG_DEPENDENSI.bat. Setelah instalasi selesai klik JALANKAN_WEB.bat dan buka http://127.0.0.1:8000. Instalasi pertama mengunduh TensorFlow sehingga memerlukan waktu dan koneksi internet.

## Mulai bersama

Ekstrak ZIP, buka VS Code, pilih File lalu Open Folder, dan pilih 03_Source yang berisi README ini. Pilih Terminal lalu New Terminal. Jalankan semua perintah dari folder ini. Untuk menguji wallet, gunakan browser dengan ekstensi MetaMask.

Pasang Python 3.11 atau 3.12 dari python.org dan Node.js 22 LTS dari nodejs.org jika belum tersedia. Pada Windows dengan Python 3.11:

```powershell
py -3.11 -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend_ai/requirements.txt
npm.cmd ci
```

Jika Python 3.12 yang dipasang, ganti -3.11 menjadi -3.12. Model berasal dari Colab. Jika proses memuat model mengalami masalah kompatibilitas, simpan versi TensorFlow Colab dan kirim pesan error lengkap untuk penyesuaian dependensi.

## Azera mulai dari web dan CNN

```powershell
.venv\Scripts\python.exe scripts/check_data.py
.venv\Scripts\python.exe -m uvicorn backend_ai.app:app --port 8000
```

Buka http://127.0.0.1:8000 pada browser. Terminal server tetap menyala selama aplikasi dipakai. Pada pemakaian berikutnya, klik dua kali JALANKAN_WEB.bat. Unggah data/kartu_baru.png pada Pindai Kartu lalu klik Pindai. Model asli Revianna langsung menjalankan inferensi. Hasil yang diharapkan adalah Perisai. Skor prediksi dihitung saat aplikasi berjalan.

Web memiliki tiga halaman. Pindai Kartu berisi unggah, prediksi, tinjauan, unduh metadata, konfigurasi edisi, dan mint. Inventori membaca saldo dari kontrak, menampilkan gambar dari URI IPFS, dan memberi formulir transfer. Misi memiliki tiga situasi dengan pilihan kartu berdasarkan fungsi. Misi berjalan sebagai latihan di sesi browser. Kepemilikan untuk demonstrasi blockchain diverifikasi dari Inventori.

Tombol Isi CID Perisai menggunakan file gambar dan metadata yang telah Revianna unggah ke Pinata. Untuk kartu lain, unggah gambar ke Public IPFS lewat Pinata lalu isi URI gambarnya. Hubungkan wallet kreator/kurator, tinjau kategori, klik Setujui dan unduh metadata. Unggah JSON final ke Pinata, lalu tempel URI metadata. URI yang sudah ditetapkan pada kontrak dibekukan. Perubahan edisi pada pengembangan berikutnya memerlukan perluasan ID/versi kontrak.

Metadata Perisai contoh telah diverifikasi pada sesi sebelumnya dan memuat nama, deskripsi, kategori, dan gambar. Lengkapi sumber, pembuat, versi, dan provenance lewat alur unduh metadata jika ingin memakai struktur metadata lengkap proyek. JSON yang diperbarui menghasilkan CID baru.

## Dakhirotun mulai dari kontrak lokal

Di terminal baru:

```powershell
npm.cmd test
npm.cmd run coverage
npm.cmd run node
```

Biarkan node menyala. Buka terminal lain dan jalankan:

```powershell
npm.cmd run deploy:local
```

Deployment membuat frontend/contract-31337.json berisi alamat, ABI, receipt dan gas deployment. Buka ulang halaman web agar alamat terisi. Di Pengaturan jaringan pilih Lokal Hardhat.

Tambahkan jaringan lokal ke MetaMask dengan RPC http://127.0.0.1:8545, chain ID 31337, dan simbol ETH. Impor akun latihan #0 yang ditampilkan terminal node Hardhat untuk kurator. Hubungkan wallet ke web. Akun deployer mendapat peran admin dan penerbit. Akun Hardhat #1 dapat dipakai sebagai pemain/penerima. Seluruh akun node lokal adalah akun latihan yang hanya dipakai pada lingkungan pengembangan.

Di Pindai Kartu buka Tinjauan dan penerbitan kurator. Klik Isi CID Perisai, periksa kategori dan metadata, lalu klik Tetapkan edisi. Setujui transaksi MetaMask. Isi wallet penerima pemain dan jumlah 1 lalu klik Terbitkan kartu. Catat receipt dan gas yang tampil. Beralih ke wallet pemain, hubungkan ulang, buka Inventori, klik Perbarui saldo. Saldo Perisai seharusnya 1. Kirim satu kartu ke akun latihan lain lalu perbarui saldo pada masing-masing akun. Coba mint dari pemain untuk menunjukkan penolakan akses.

Jika node Hardhat dimulai ulang, jalankan deployment kembali karena state node lokal kembali kosong. Simpan hasil deployment dan pengujian yang benar-benar dijalankan sebagai bukti.

## Petunjuk LLM

Implementasi petunjuk menggunakan Ollama lokal dan prompt backend_ai/prompt.txt. Pasang Ollama dari ollama.com, buka aplikasinya lalu jalankan di terminal:

```powershell
ollama pull qwen2.5:3b
```

Setelah model siap, tombol Minta Petunjuk di halaman Misi memanggil LLM. Pesan terakhir dibatasi menjadi maksimal tiga pasang percakapan. Model bisa diubah lewat environment OLLAMA_MODEL sebelum server web dimulai. Backend menampilkan status layanan gagal jika Ollama belum siap. Jalankan 10 skenario pada fitur web dan catat jawaban aktual. Hasil 10 skenario di chat sebelumnya berlaku pada pengujian awal prompt.

## Sepolia

Setelah semua alur lokal lulus, gunakan akun latihan dan tetapkan konfigurasi di terminal:

```powershell
$env:SEPOLIA_RPC_URL = "URL_RPC_SEPOLIA"
$env:SEPOLIA_PRIVATE_KEY = "KUNCI_WALLET_LATIHAN"
npm.cmd run deploy:sepolia
```

Sesudah deploy pilih Sepolia di Pengaturan jaringan web dan di MetaMask. Alamat dibaca dari frontend/contract-11155111.json. Jangan bagikan private key pada screenshot atau repositori. Simpan receipt, chain ID, alamat kontrak dan CID sebagai bukti. Mint, transfer, dan konfigurasi edisi memerlukan wallet yang sesuai pada jaringan yang dipilih.

## Sumber teknis

- OpenZeppelin ERC-1155 https://docs.openzeppelin.com/contracts/5.x/erc1155
- Ethers v6 https://docs.ethers.org/v6/getting-started/
- Ollama Chat API https://docs.ollama.com/api/chat

## Pembagian kerja dan uji integrasi

Azera memeriksa UI, memuat gambar, hasil CNN, koreksi kategori, IPFS, dan tampilan saldo. Dakhirotun menjalankan tes/coverage, deploy, konfigurasi edisi, mint/transfer dan bukti gas. Revianna menyerahkan log Colab serta memeriksa apakah inferensi dan kategori final sesuai model. Bersama-sama jalankan enam kasus berupa alur sukses, gambar rusak, AI/LLM gagal, koreksi prediksi, wallet ditolak/jaringan salah, dan media IPFS tidak tersedia. Catat expected dan actual hasil masing-masing kasus. Lakukan uji pemakaian pada tiga pengguna serta simpan kontribusi tiap anggota.
