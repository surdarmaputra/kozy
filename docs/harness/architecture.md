# Architecture

## Layers

| Layer                     | Responsibility                                              |
| ------------------------- | ----------------------------------------------------------- |
| `src/routes/**`           | loader + head + headers + page composition                  |
| `src/lib/catalog.ts`      | server fns, the only bridge from route to Sheet             |
| `src/lib/sheet.ts`        | fetch, 60s cache, last-good fallback. **Server only**       |
| `src/lib/store.ts`        | last-good persistence: memory, file, Blobs. **Server only** |
| `src/lib/{csv,schema}.ts` | parse and validate raw rows                                 |
| `src/lib/select.ts`       | pure selectors over a parsed catalogue                      |
| `src/components/**`       | presentation only, no fetching, no `process.env`            |

Import direction is one way: routes → catalog → sheet → store → schema/csv.
Components may import `select.ts`, never `sheet.ts`, `store.ts`, or
`catalog.ts` internals.

## #sheet-contract

Three required tabs plus one optional (`denah`), read as CSV via gviz. No GCP
project, no API key; the Sheet is shared "Anyone with the link, Viewer".

```
config: key, value
lokasi: slug, nama, alamat, gmaps_url, lat, lng, deskripsi, fasilitas,
        nomor_wa, foto_urls, aktif
kamar:  kode, lokasi_slug, lantai, luas_m2, tipe, harga_bulanan, status,
        fasilitas, foto_urls, catatan, aktif
denah:  lokasi_slug, lantai, baris, sel, arah          (optional tab)
```

The three required tabs are frozen, in Indonesian, because the owner's
spreadsheet and `docs/` describe them. `status` is `kosong | dibooking |
terisi`. `tipe` is free text on purpose: it is how the owner names room types
without a deploy.

Column semantics that are easy to get wrong:

- `aktif=FALSE` hides a row; rows are never deleted.
- `nomor_wa` may be blank → falls back to `config.wa_default`.
- `fasilitas` and `foto_urls` are comma-separated, split at parse time.
- Rooms sharing a `tipe` are one product. Their facilities are intersected,
  never unioned, so a type card cannot oversell.

`denah` is additive and **fetched tolerantly**: `fetchTab('denah').catch(() =>
[])` inside `readCatalog`'s `Promise.all`, so a missing tab, revoked share, or
non-CSV response on it alone yields no drawing rather than failing the whole
read. Each row is one visual row of a floor; `sel` is comma-separated cell
tokens (a room `kode`, one of `pintu|tangga|lift|lorong`, `.` for a gap, or free
text shown as a labelled spot). `floorPlansFor` (`src/lib/select.ts`) turns the
rows into one drawing per floor; a floor with no rows is absent from the result
and `RoomMap` renders it as the plain per-floor listing. An active room no cell
references is returned in `unmapped` so a typo cannot hide it. A last-good copy
saved before this tab existed has no `denah` key — read it as `catalog.denah ??
[]` (`store.ts` `recall` also backfills `[]`).

## #resilience

Four layers. All must keep working; a change that weakens one is a regression
even when tests pass. The guiding rule: **a stale-but-real copy beats an error,
and an honest error beats wrong data.**

1. **Skip the row.** `parseRows` validates each row alone. A failure is pushed
   to `skipped` with its 1-based sheet row number and reported at `/purge`.
   Nothing throws.
2. **Last good copy.** Fetch failure, revoked sharing, non-CSV response, or an
   empty `lokasi` tab → the last catalogue that was read successfully, from
   `src/lib/store.ts`: in-process memory, then a file under `CACHE_DIR`
   (default `.cache/`), then Netlify Blobs (only when
   `NETLIFY_DEPLOYMENT === 'true' || NETLIFY`). Served with `source: 'cache'`.
   `store.persist()` writes all three on every successful fetch;
   `clearCatalogCache()` (a `/purge`) never evicts them.
3. **Friendly unavailable page.** Nothing has ever been read successfully (a
   cold instance mid-outage, or a first deploy before the Sheet is shared) →
   `getCatalog()` returns `null` and each catalogue route renders
   `CatalogUnavailable` inside the normal shell at HTTP 200 with `no-store`.
4. **Stale-while-revalidate.** The CDN serves the last good HTML during
   revalidation.

`src/data/snapshot.json` is **not** a resilience layer. It is a dev seed,
rendered (`source: 'seed'`) only when `SHEET_ID` is unset — local dev and the
CI build. Regenerate with `npm run snapshot`; never hand-edit.
`scripts/make-sheet-template.py` rebuilds the client's `.xlsx` from the same
file so the two cannot drift.

Load on Google is one fetch per tab per 60 seconds per instance, constant with
traffic. Do not add a per-request fetch.

## #server-only

`sheet.ts` reads `process.env.SHEET_ID` and dynamically imports the dev seed;
`store.ts` uses `node:fs/promises` and `@netlify/blobs`. Neither may reach the
browser. `createServerFn` in `catalog.ts` strips the handler from the client
bundle; importing `sheet.ts` or `store.ts` from a component defeats that.

Check after touching any of them:

```bash
npm run build && grep -l "Batam Centre" dist/client/assets/*.js   # must find nothing
```

## #server-fns

`loadCatalog` and `purgeSheetCache` in `src/lib/catalog.ts`. Route loaders call
these, never `getCatalog` directly. `loadCatalog` resolves to `Catalog | null`
(`null` = Sheet unreachable and no saved copy). `purgeSheetCache` validates its
secret, clears the in-process cache (not the persisted copy), calls Netlify
`purgeCache({ tags: ['sheet'] })`, then re-reads so `/purge` can report what the
Sheet actually returned — including "could not be read" when the re-read is
`null`.

## #routing

File-based, flat. `index.tsx` → `/`, `locations.$slug.index.tsx` →
`/locations/:slug`, `purge.tsx` → `/purge`. Slugs are matched against Sheet
contents at request time, so a new location needs no route and no deploy. Room
types have no route of their own: the location page groups by the `tipe` column
and shows every type's detail inline, in a dialog.

A missing slug renders a friendly not-found page inside the normal shell, not a
thrown 404 — the Sheet is user-edited and typos are expected.

## #caching

Every catalogue route returns `sheetCacheHeaders` from `src/lib/http.ts` when
its loader resolved to data:

```
Netlify-CDN-Cache-Control: s-maxage=60, stale-while-revalidate=86400
Netlify-Cache-Tag: sheet
Cache-Control: public, max-age=0, must-revalidate
```

When the loader resolved to `null` (the unavailable page) the route returns
`noStoreHeaders` instead, so recovery is visible the moment the Sheet is back:
`headers: ({ loaderData }) => loaderData == null ? noStoreHeaders : sheetCacheHeaders`.

`/purge` is the exception and sends `no-store` plus `X-Robots-Tag: noindex`.
Route-level `headers()` does reach the response through the Netlify adapter;
this was verified against the built SSR bundle, not assumed.

## #ci

`.github/workflows/ci.yml` runs the same steps as `npm run verify`, on push to
`main` and on every PR. If you add a gate, add it to both or they drift. The
build runs without `SHEET_ID` deliberately, so CI exercises the dev-seed path
(`source: 'seed'`).
