# Struktur Google Sheet

Satu spreadsheet, tiga tab. Nama tab harus persis seperti di bawah (huruf kecil).
Baris pertama tiap tab adalah header dan tidak boleh diubah namanya.

## Tab `config`

| key             | value                                                               |
| --------------- | ------------------------------------------------------------------- |
| `brand`         | Nama yang tampil di header dan footer                               |
| `tagline`       | Satu kalimat di bawah judul halaman depan, maksimal sekitar 20 kata |
| `wa_default`    | Nomor WhatsApp pusat, format `628...` tanpa tanda `+`               |
| `alamat_kantor` | Alamat yang tampil di footer                                        |

## Tab `lokasi`

| Kolom        | Isi                                          | Contoh                                  |
| ------------ | -------------------------------------------- | --------------------------------------- |
| `slug`       | Alamat halaman, huruf kecil, tanpa spasi     | `pogung-baru`                           |
| `nama`       | Nama lokasi                                  | `Kozy Pogung Baru`                      |
| `alamat`     | Alamat lengkap                               | `Jl. Pogung Baru Blok C No. 14, Sleman` |
| `gmaps_url`  | Tautan Google Maps untuk tombol rute         | `https://maps.google.com/?q=...`        |
| `lat`, `lng` | Koordinat untuk peta di halaman              | `-7.7654`, `110.3742`                   |
| `deskripsi`  | Dua sampai tiga kalimat                      |                                         |
| `fasilitas`  | Dipisah koma                                 | `Wi-Fi, Dapur bersama, Parkir motor`    |
| `nomor_wa`   | Nomor penjaga lokasi ini                     | `6281227431905`                         |
| `foto_urls`  | Dipisah koma, urutan pertama jadi foto utama |                                         |
| `aktif`      | `TRUE` tampil, `FALSE` disembunyikan         | `TRUE`                                  |

## Tab `kamar`

| Kolom           | Isi                                             | Contoh                      |
| --------------- | ----------------------------------------------- | --------------------------- |
| `kode`          | Kode kamar                                      | `A1`                        |
| `lokasi_slug`   | Harus sama persis dengan `slug` di tab `lokasi` | `pogung-baru`               |
| `lantai`        | Angka                                           | `2`                         |
| `luas_m2`       | Angka                                           | `14`                        |
| `tipe`          | `standard` atau `deluxe`                        | `deluxe`                    |
| `harga_bulanan` | Angka, boleh pakai titik                        | `1450000`                   |
| `status`        | `kosong`, `dibooking`, atau `terisi`            | `kosong`                    |
| `fasilitas`     | Dipisah koma                                    | `AC, Kamar mandi dalam`     |
| `foto_urls`     | Dipisah koma                                    |                             |
| `catatan`       | Satu kalimat, boleh kosong                      | `Ditahan sampai 12 Oktober` |
| `aktif`         | `TRUE` tampil, `FALSE` disembunyikan            | `TRUE`                      |

## Data validation yang wajib dipasang

Dipasang sekali oleh developer, mencegah salah ketik dari HP.

1. `kamar!G:G` (`status`): Data > Data validation > Dropdown > `kosong`, `dibooking`, `terisi`.
2. `kamar!B:B` (`lokasi_slug`): Dropdown from a range > `lokasi!A2:A`.
3. `kamar!E:E` (`tipe`): Dropdown > `standard`, `deluxe`.
4. `lokasi!K:K` dan `kamar!K:K` (`aktif`): Dropdown > `TRUE`, `FALSE`.
5. Baris 1 di ketiga tab: klik kanan > Protect range, hanya pemilik yang boleh mengubah.

## Sharing

File > Share > General access > **Anyone with the link** > **Viewer**.
Tanpa itu website tidak bisa membaca datanya dan akan menampilkan data cadangan.

## Toleransi kesalahan

- Sel yang salah ketik hanya membuat baris itu dilewati, sisanya tetap tampil.
- `status` yang tidak dikenali dianggap `terisi`, supaya kamar tidak salah dijual.
- Harga boleh ditulis `Rp 1.450.000`, tetap terbaca sebagai angka.
- Kolom yang hilang atau sharing yang dicabut membuat website memakai
  `src/data/snapshot.json` yang tersimpan di kode. Halaman tidak pernah kosong.
