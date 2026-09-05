# Cara mengubah isi website

Semua perubahan dilakukan dari Google Sheet. Tidak ada aplikasi lain,
tidak perlu menghubungi developer.

## 1. Mengubah status kamar

1. Buka Google Sheet dari HP, pilih tab `kamar`.
2. Cari baris kamarnya, ketuk kolom `status`, pilih dari dropdown:
   `kosong`, `dibooking`, atau `terisi`.
3. Buka bookmark **Perbarui website**.
4. Buka website, tarik layar ke bawah untuk refresh. Warnanya sudah berubah.

Tanpa langkah 3 pun perubahan tetap muncul sendiri dalam 5 menit.
Bookmark itu hanya untuk yang tidak mau menunggu.

## 2. Mengubah harga

Tab `kamar`, kolom `harga_bulanan`. Tulis angkanya saja, misal `1450000`.
Lalu buka bookmark **Perbarui website**.

## 3. Menambah lokasi baru

1. Tab `lokasi`, tambah satu baris di paling bawah.
2. Isi minimal `slug`, `nama`, `alamat`, `nomor_wa`, dan `aktif` = `TRUE`.
   `slug` ditulis huruf kecil tanpa spasi, contoh `condongcatur`.
3. Tab `kamar`, tambah baris kamarnya. Kolom `lokasi_slug` pilih dari dropdown.
4. Buka bookmark **Perbarui website**.
5. Halaman `/lokasi/condongcatur` langsung ada.

## 4. Menyembunyikan lokasi atau kamar

Jangan hapus barisnya. Ubah kolom `aktif` menjadi `FALSE`.
Datanya tetap tersimpan dan bisa ditampilkan lagi kapan saja.

## 5. Mengganti foto

1. Unggah foto ke Google Drive, klik kanan > Share > **Anyone with the link**.
2. Salin tautannya ke kolom `foto_urls`. Beberapa foto dipisah koma.
3. Buka bookmark **Perbarui website**.

## Kalau ada yang aneh

Buka bookmark **Perbarui website**. Halaman itu menyebutkan:

- **Sumber data**: harus tertulis "Google Sheet". Kalau tertulis
  "Snapshot cadangan", berarti website tidak bisa membaca Sheet. Cek
  File > Share, pastikan masih **Anyone with the link, Viewer**.
- **Terbaca**: jumlah lokasi dan kamar yang berhasil dibaca.
- **Baris yang dilewati**: nomor baris yang datanya belum lengkap.
  Perbaiki baris itu di Sheet, lalu buka bookmark lagi.

Website tidak pernah kosong. Kalau Sheet bermasalah, yang tampil adalah
data terakhir yang tersimpan di kode.
