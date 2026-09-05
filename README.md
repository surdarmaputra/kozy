# Kozy

Katalog kos multi-lokasi. Data ketersediaan kamar dibaca langsung dari Google
Sheet saat request, dirender di server, dan di-cache di CDN Netlify. Pemilik kos
mengubah status kamar dari HP lewat Sheet, tanpa deploy dan tanpa developer.

## Stack

- TanStack Start (SSR, file-based routing) on Vite
- Tailwind v4 + shadcn/ui
- Zod untuk validasi baris Sheet
- Netlify Functions untuk SSR dan `purgeCache`

## Menjalankan

```bash
npm install
cp .env.example .env      # isi SHEET_ID dan PURGE_SECRET
npm run dev               # http://localhost:3000
```

Tanpa `SHEET_ID`, aplikasi merender `src/data/snapshot.json`, jadi bisa
dikembangkan tanpa akses ke Sheet mana pun.

```bash
npm run test    # unit test parser, schema, dan selector
npm run build   # build klien + SSR bundle
npm run lint
```

## Environment variables

| Nama           | Wajib          | Isi                           |
| -------------- | -------------- | ----------------------------- |
| `SHEET_ID`     | ya di produksi | ID dari URL spreadsheet       |
| `PURGE_SECRET` | ya di produksi | String acak, penjaga `/purge` |

Sheet harus di-share sebagai **Anyone with the link, Viewer**. Tidak ada GCP
project dan tidak ada API key.

## Halaman

| Path             | Isi                                                             |
| ---------------- | --------------------------------------------------------------- |
| `/`              | Daftar lokasi aktif, agregat kamar kosong, harga terendah       |
| `/lokasi/$slug`  | Detail lokasi, galeri, fasilitas, grid kamar per lantai, peta   |
| `/purge?secret=` | Invalidasi cache dan laporan kondisi data, dalam bahasa manusia |

Route baru tidak perlu ditambahkan saat client menambah lokasi. `$slug`
dicocokkan dengan kolom `slug` di Sheet saat request.

## Cache dan purge

Setiap halaman katalog mengirim:

```
Netlify-CDN-Cache-Control: s-maxage=300, stale-while-revalidate=86400
Netlify-Cache-Tag: sheet
```

Netlify menyimpan HTML 5 menit dan menyajikan versi lama hingga 24 jam sambil
merevalidasi, sehingga Sheet yang lambat atau rusak tidak pernah sampai ke
pengunjung. `/purge?secret=...` memanggil `purgeCache({ tags: ['sheet'] })` dan
mengosongkan cache proses, jadi perubahan langsung terlihat.

Beban ke Google dibatasi satu fetch per tab per 5 menit per instance, konstan
terhadap jumlah pengunjung.

## Tiga lapis ketahanan

1. **Skip baris.** Setiap baris divalidasi Zod sendiri-sendiri. Baris yang gagal
   dilewati, sisanya tetap render. Nomor barisnya dilaporkan di `/purge`.
2. **Snapshot.** Bila fetch gagal, sharing dicabut, atau tab `lokasi` kosong,
   aplikasi memakai `src/data/snapshot.json` yang ikut ter-commit.
3. **Stale-while-revalidate.** CDN menyajikan HTML lama selama revalidasi.

Perbarui snapshot setelah perubahan struktur Sheet:

```bash
SHEET_ID=... npm run snapshot
git commit -am "chore: refresh snapshot"
```

## Deploy ke Netlify

1. Hubungkan repo ini ke Netlify. `netlify.toml` sudah mengatur build command
   dan publish directory.
2. Site settings > Environment variables: isi `SHEET_ID` dan `PURGE_SECRET`.
3. Setelah deploy pertama, buat bookmark untuk client:
   `https://<domain>/purge?secret=<PURGE_SECRET>` dengan nama "Perbarui website".

## Handover

- [docs/sop-client.md](docs/sop-client.md) - SOP satu halaman untuk pemilik kos
- [docs/sheet-template.md](docs/sheet-template.md) - struktur tab, kolom, dan
  data validation yang harus dipasang di Sheet
