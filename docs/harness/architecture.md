# Architecture

## Layers

| Layer                     | Responsibility                                   |
| ------------------------- | ------------------------------------------------ |
| `src/routes/**`           | loader + head + headers + page composition       |
| `src/lib/catalog.ts`      | server fns, the only bridge from route to Sheet  |
| `src/lib/sheet.ts`        | fetch, cache, snapshot fallback. **Server only** |
| `src/lib/{csv,schema}.ts` | parse and validate raw rows                      |
| `src/lib/select.ts`       | pure selectors over a parsed catalogue           |
| `src/components/**`       | presentation only, no fetching, no `process.env` |

Import direction is one way: routes → catalog → sheet → schema/csv.
Components may import `select.ts`, never `sheet.ts` or `catalog.ts` internals.

## #sheet-contract

Three tabs, read as CSV via gviz. No GCP project, no API key; the Sheet is
shared "Anyone with the link, Viewer".

```
config: key, value
lokasi: slug, nama, alamat, gmaps_url, lat, lng, deskripsi, fasilitas,
        nomor_wa, foto_urls, aktif
kamar:  kode, lokasi_slug, lantai, luas_m2, tipe, harga_bulanan, status,
        fasilitas, foto_urls, catatan, aktif
```

Frozen, in Indonesian, because the owner's spreadsheet and `docs/` describe
them. `status` is `kosong | dibooking | terisi`. `tipe` is free text on
purpose: it is how the owner names room types without a deploy.

Column semantics that are easy to get wrong:

- `aktif=FALSE` hides a row; rows are never deleted.
- `nomor_wa` may be blank → falls back to `config.wa_default`.
- `fasilitas` and `foto_urls` are comma-separated, split at parse time.
- Rooms sharing a `tipe` are one product. Their facilities are intersected,
  never unioned, so a type card cannot oversell.

## #resilience

Three layers. All three must keep working; a change that weakens one is a
regression even when tests pass.

1. **Skip the row.** `parseRows` validates each row alone. A failure is pushed
   to `skipped` with its 1-based sheet row number and reported at `/purge`.
   Nothing throws.
2. **Snapshot.** Fetch failure, revoked sharing, non-CSV response, or an empty
   `lokasi` tab → `src/data/snapshot.json`. Regenerate with `npm run snapshot`;
   never hand-edit. `scripts/make-sheet-template.py` rebuilds the client's
   `.xlsx` from the same file so the two cannot drift.
3. **Stale-while-revalidate.** The CDN serves the last good HTML during
   revalidation.

Load on Google is one fetch per tab per 5 minutes per instance, constant with
traffic. Do not add a per-request fetch.

## #server-only

`sheet.ts` imports `snapshot.json` and reads `process.env.SHEET_ID`. It must
never reach the browser. `createServerFn` in `catalog.ts` strips the handler
from the client bundle; importing `sheet.ts` from a component defeats that.

Check after touching either file:

```bash
npm run build && grep -l "Batam Centre" dist/client/assets/*.js   # must find nothing
```

## #server-fns

`loadCatalog` and `purgeSheetCache` in `src/lib/catalog.ts`. Route loaders call
these, never `getCatalog` directly. `purgeSheetCache` validates its secret,
clears the in-process cache, calls Netlify `purgeCache({ tags: ['sheet'] })`,
then re-reads so `/purge` can report what the Sheet actually returned.

## #routing

File-based, flat. `locations.$slug.index.tsx` → `/locations/:slug`;
`locations.$slug.type.$type.tsx` → `/locations/:slug/type/:type`. Slugs and
type slugs are matched against Sheet contents at request time, so a new
location or room type needs no route and no deploy.

A missing slug renders a friendly not-found page inside the normal shell, not a
thrown 404 — the Sheet is user-edited and typos are expected.

## #caching

Every catalogue route returns `sheetCacheHeaders` from `src/lib/http.ts`:

```
Netlify-CDN-Cache-Control: s-maxage=300, stale-while-revalidate=86400
Netlify-Cache-Tag: sheet
Cache-Control: public, max-age=0, must-revalidate
```

`/purge` is the exception and sends `no-store` plus `X-Robots-Tag: noindex`.
Route-level `headers()` does reach the response through the Netlify adapter;
this was verified against the built SSR bundle, not assumed.

## #ci

`.github/workflows/ci.yml` runs the same steps as `npm run verify`, on push to
`main` and on every PR. If you add a gate, add it to both or they drift. The
build runs without `SHEET_ID` deliberately, so CI exercises the snapshot path.
