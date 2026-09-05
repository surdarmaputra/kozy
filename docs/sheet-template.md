# Struktur Google Sheet

Satu spreadsheet, tiga tab. Nama tab harus persis seperti di bawah (huruf kecil).
Baris pertama tiap tab adalah header dan tidak boleh diubah namanya.

Template siap pakai ada di [`docs/kozy-sheet-template.xlsx`](kozy-sheet-template.xlsx).
Unggah ke Google Drive, buka dengan Google Sheets, lalu isi datanya.

## Tab `config`

| key             | value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| `brand`         | Nama yang tampil di header, judul halaman depan, dan footer           |
| `tagline`       | Satu kalimat di bawah nama di halaman depan, maksimal sekitar 20 kata |
| `wa_default`    | Nomor WhatsApp utama, format `628...` tanpa tanda `+`                 |
| `alamat_kantor` | Alamat yang tampil di footer                                          |

## Tab `lokasi`

| Kolom        | Isi                                                                        | Contoh                               |
| ------------ | -------------------------------------------------------------------------- | ------------------------------------ |
| `slug`       | Alamat halaman, huruf kecil, tanpa spasi                                   | `batam-centre`                       |
| `nama`       | Nama lokasi                                                                | `Kozy Batam Centre`                  |
| `alamat`     | Alamat lengkap                                                             | `Jl. Engku Putri No. 12, Batam Kota` |
| `gmaps_url`  | Tautan Google Maps untuk tombol rute                                       | `https://maps.google.com/?q=...`     |
| `lat`, `lng` | Koordinat untuk peta di halaman                                            | `1.1204`, `104.0489`                 |
| `deskripsi`  | Dua sampai tiga kalimat                                                    |                                      |
| `fasilitas`  | Fasilitas bersama, dipisah koma                                            | `Wi-Fi, Dapur bersama, Parkir motor` |
| `nomor_wa`   | Nomor khusus lokasi ini. **Boleh dikosongkan**, nanti memakai `wa_default` | `6281364927150`                      |
| `foto_urls`  | Dipisah koma, urutan pertama jadi foto utama                               |                                      |
| `aktif`      | `TRUE` tampil, `FALSE` disembunyikan                                       | `TRUE`                               |

## Tab `kamar`

Satu baris untuk satu kamar fisik. Kamar inilah yang muncul sebagai kotak di
denah kamar.

| Kolom           | Isi                                                              | Contoh                        |
| --------------- | ---------------------------------------------------------------- | ----------------------------- |
| `kode`          | Kode kamar, tampil di denah                                      | `B3`                          |
| `lokasi_slug`   | Harus sama persis dengan `slug` di tab `lokasi`                  | `batam-centre`                |
| `lantai`        | Angka, menentukan pengelompokan di denah                         | `2`                           |
| `luas_m2`       | Angka                                                            | `16`                          |
| `tipe`          | **Nama tipe bebas.** Ditulis sama persis untuk kamar yang setipe | `Deluxe AC`                   |
| `harga_bulanan` | Angka, boleh pakai titik                                         | `1850000`                     |
| `status`        | `kosong`, `dibooking`, atau `terisi`                             | `kosong`                      |
| `fasilitas`     | Dipisah koma                                                     | `AC, Kamar mandi dalam`       |
| `foto_urls`     | Dipisah koma                                                     |                               |
| `catatan`       | Satu kalimat, boleh kosong                                       | `Ditahan sampai 18 September` |
| `aktif`         | `TRUE` tampil, `FALSE` disembunyikan                             | `TRUE`                        |

### Aturan penting soal `tipe`

Kolom `tipe` adalah yang mengelompokkan kamar menjadi kartu tipe kamar dan
halaman `/lokasi/{slug}/tipe/{tipe}`. Karena itu:

- **Tulis sama persis** untuk kamar yang setipe. `Deluxe AC` dan `deluxe ac`
  dianggap tipe yang sama, tetapi `Deluxe AC` dan `Deluxe A/C` menjadi dua tipe.
  Pakai dropdown supaya tidak salah ketik.
- **Satu tipe sebaiknya satu harga, satu luas, dan satu daftar fasilitas.**
  Kalau harganya berbeda-beda, kartu tipe menampilkan harga terendah dengan
  tanda `+`.
- **Fasilitas yang ditampilkan adalah irisan**, yaitu hanya yang dimiliki semua
  kamar bertipe itu. Kalau satu kamar tidak punya AC, AC tidak akan muncul di
  kartu tipe. Ini disengaja supaya tidak menjanjikan yang tidak ada.

## Data validation yang wajib dipasang

Dipasang sekali oleh developer, mencegah salah ketik dari HP.

1. `kamar!G:G` (`status`): Data > Data validation > Dropdown > `kosong`, `dibooking`, `terisi`.
2. `kamar!B:B` (`lokasi_slug`): Dropdown from a range > `lokasi!A2:A`.
3. `kamar!E:E` (`tipe`): Dropdown berisi daftar nama tipe yang dipakai. Tambah
   item baru di sini setiap kali ada tipe baru.
4. `lokasi!K:K` dan `kamar!K:K` (`aktif`): Dropdown > `TRUE`, `FALSE`.
5. Baris 1 di ketiga tab: klik kanan > Protect range, hanya pemilik yang boleh mengubah.

## Sharing

File > Share > General access > **Anyone with the link** > **Viewer**.
Tanpa itu website tidak bisa membaca datanya dan akan menampilkan data cadangan.

## Toleransi kesalahan

- Sel yang salah ketik hanya membuat baris itu dilewati, sisanya tetap tampil.
- `status` yang tidak dikenali dianggap `terisi`, supaya kamar tidak salah dijual.
- `tipe` yang kosong dianggap `Standard`.
- Harga boleh ditulis `Rp 1.850.000`, tetap terbaca sebagai angka.
- Kolom yang hilang atau sharing yang dicabut membuat website memakai
  `src/data/snapshot.json` yang tersimpan di kode. Halaman tidak pernah kosong.
