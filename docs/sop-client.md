# Cara mengubah isi website

Semua perubahan dilakukan dari Google Sheet. Tidak ada aplikasi lain,
tidak perlu menghubungi developer.

## 1. Mengubah status kamar

1. Buka Google Sheet dari HP, pilih tab `kamar`.
2. Cari baris kamarnya, ketuk kolom `status`, pilih dari dropdown:
   `kosong`, `dibooking`, atau `terisi`.
3. Buka bookmark **Perbarui website**.
4. Buka website, tarik layar ke bawah untuk refresh. Warna kotak kamar di denah
   sudah berubah.

Tanpa langkah 3 pun perubahan tetap muncul sendiri dalam 1-2 menit.
Bookmark itu hanya untuk yang tidak mau menunggu.

## 2. Mengubah harga

Tab `kamar`, kolom `harga_bulanan`. Tulis angkanya saja, misal `1850000`.
Kalau harga satu tipe naik, ubah **semua** baris kamar bertipe itu supaya
harganya tetap seragam. Lalu buka bookmark **Perbarui website**.

## 3. Menambah tipe kamar baru

Tidak ada tab khusus untuk tipe kamar. Tipe terbentuk sendiri dari kolom `tipe`
di tab `kamar`.

1. Tambahkan nama tipe baru ke dropdown kolom `tipe`
   (Data > Data validation di kolom itu).
2. Isi kolom `tipe` di baris kamar yang bersangkutan dengan nama itu.
3. Pastikan harga, luas, dan fasilitas semua kamar bertipe sama diisi sama.
4. Buka bookmark **Perbarui website**.

Kartu tipe baru langsung muncul di halaman lokasi.

## 4. Menambah lokasi baru

1. Tab `lokasi`, tambah satu baris di paling bawah.
2. Isi minimal `slug`, `nama`, `alamat`, dan `aktif` = `TRUE`.
   `slug` ditulis huruf kecil tanpa spasi, contoh `sekupang`.
   Kolom `nomor_wa` boleh dikosongkan kalau memakai nomor utama.
3. Tab `kamar`, tambah baris kamarnya. Kolom `lokasi_slug` pilih dari dropdown.
4. Buka bookmark **Perbarui website**.
5. Halaman `/locations/sekupang` langsung ada.

## 5. Menyembunyikan lokasi atau kamar

Jangan hapus barisnya. Ubah kolom `aktif` menjadi `FALSE`.
Datanya tetap tersimpan dan bisa ditampilkan lagi kapan saja.

## 6. Mengganti foto

1. Unggah foto ke Google Drive, klik kanan > Share > **Anyone with the link**.
2. Salin tautannya ke kolom `foto_urls`. Beberapa foto dipisah koma.
3. Buka bookmark **Perbarui website**.

## Kalau ada yang aneh

Buka bookmark **Perbarui website**. Halaman itu menyebutkan:

- **Sumber data**: harus tertulis "Google Sheet (langsung)". Kalau tertulis "Salinan tersimpan, Sheet tidak terjangkau" atau "Data contoh, SHEET_ID belum diisi", berarti website tidak bisa membaca Sheet. Cek File > Share, pastikan masih **Anyone with the link, Viewer**.
- **Terbaca**: jumlah lokasi dan kamar yang berhasil dibaca.
- **Baris yang dilewati**: nomor baris yang datanya belum lengkap. Perbaiki baris itu di Sheet, lalu buka bookmark lagi.

Kalau Sheet bermasalah, yang tampil adalah salinan terakhir yang berhasil
dibaca website. Kalau website belum pernah berhasil membaca Sheet sama sekali,
muncul halaman "sementara tidak tersedia" sampai Sheet bisa dibaca lagi.
