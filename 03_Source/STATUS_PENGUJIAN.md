# Status pengujian paket baru

Pengujian dilakukan pada 18 November 2026.

- Dataset lokal memuat 120 gambar, masing-masing 40 Ramuan, Senjata, dan Perisai. Manifest versi 2 berisi 20 latih, 10 validasi dan 10 uji per kelas. Pemeriksaan menunjukkan grup desain tidak tersebar antarbagian.
- Model Keras yang disertakan memiliki SHA-256 497637f6c94f44de6dc61620f2472271163691eece1fb749e086b8d491d84bb9.
- Backend berhasil memuat model asli dan memprediksi kartu_baru.png sebagai Perisai, ID 3, skor 0,9802630543708801. Waktu inferensi yang diamati 122,19 ms pada percobaan ini.
- Pengujian kontrak Hardhat lulus 16 dari 16 kasus. Coverage kontrak NejiInventory buatan kelompok mencapai 100% untuk statements, lines, functions dan branches pada suite ini. Coverage bukan jaminan bebas celah. Log ada di test-results.txt dan coverage-results.txt.
- Browser headless berhasil membuka halaman, berpindah menu, dan menyelesaikan misi melalui pilihan Ramuan, Perisai, Senjata tanpa error JavaScript. Pratinjau tersimpan di frontend-preview.png.

Pengujian MetaMask melalui UI, akses gateway IPFS pada web baru, inferensi Ollama, usability dan deployment Sepolia masih perlu dijalankan bersama tim. Hasil uji di Colab dan uji LLM di chat yang dilaporkan Revianna tetap dirujuk pada bukti masing-masing. File inference-results.json merupakan hasil inferensi lokal langsung pada paket ini.
