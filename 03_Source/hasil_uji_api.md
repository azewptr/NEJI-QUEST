# Hasil uji API /api/predict

| Kasus | Harapan | Hasil aktual | Status |
|---|---|---|---|
| Alur berhasil: data/kartu_baru.png | Perisai, ID 3, HTTP 200 | HTTP 200, Perisai, ID 3, skor 0.9803, 301.17 ms | LULUS |
| Gambar rusak (teks bernama .png) | HTTP 400 + pesan jelas | HTTP 400, Gambar rusak atau format tidak didukung. | LULUS |
| Berkas kosong | HTTP 400 + pesan jelas | HTTP 400, Berkas kosong. Pilih gambar kartu yang valid. | LULUS |
| Berkas lebih dari 8 MB | HTTP 400 + pesan jelas | HTTP 400, Pilih gambar berukuran maksimal 8 MB. | LULUS |
| 30 gambar split uji lewat API | mendekati 29/30 (hasil Colab Revianna) | 29/30 benar. Salah: ramuan_37.png: sebenarnya Ramuan, prediksi Perisai | LULUS |
