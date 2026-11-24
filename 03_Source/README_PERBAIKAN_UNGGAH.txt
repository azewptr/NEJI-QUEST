PERBAIKAN UNGGAH KARTU NEJI QUEST

1. Tutup server web lama melalui Ctrl+C pada terminalnya.
2. Ekstrak paket ini ke folder baru, lalu buka 03_Source.
3. Jalankan PASANG_DEPENDENSI.bat. Tunggu sampai instalasi berhasil.
4. Jalankan JALANKAN_WEB.bat, buka http://127.0.0.1:8000,
   lalu tekan Ctrl+F5 untuk memuat JavaScript terbaru.
5. Di Unggah Kartu, pilih ramuan_03.png lalu klik Analisis gambar.

Pilih file menyiapkan pratinjau. Analisis gambar menjalankan CNN.
Tahap pengiriman gambar ke IPFS ada pada proses penerbitan kurator.

Perbaikan:
- Menjalankan .venv hasil installer sebagai prioritas ketika .runtime juga ada.
- Mengunci Keras 3.13.2 sesuai metadata model.
- Mengembalikan JSON HTTP 503 jika pemuatan atau inferensi model gagal.
- Mencatat traceback lengkap pada terminal server.
- Menampilkan pesan server yang jelas jika respons bukan JSON.
- Mengganti label Pindai menjadi Analisis gambar.
- Menampilkan status file dipilih dan menonaktifkan tombol selama analisis.

Gunakan requirements.txt untuk pemasangan seperti pada batch.
Bukti pengujian disertakan dalam HASIL_UJI_UNGGAH.txt.
