# Kozy

A multi-location boarding house catalogue. Room availability is read straight
from a Google Sheet at request time, rendered on the server, and cached at
Netlify's CDN. The owner changes a room's status from their phone in the Sheet,
with no deploy and no developer involved.

## Stack

- TanStack Start (SSR, file-based routing) on Vite
- Tailwind v4 + shadcn/ui
- Zod for per-row Sheet validation
- Netlify Functions for SSR and `purgeCache`

## Running it

```bash
npm install
cp .env.example .env      # fill in SHEET_ID and PURGE_SECRET
npm run dev               # http://localhost:3000
```

Without `SHEET_ID` the app renders `src/data/snapshot.json`, so it can be
developed without access to any Sheet.

```bash
npm run test    # unit tests for the parser, schema, and selectors
npm run build   # client + SSR bundle
npm run lint
```

## Environment variables

| Name           | Required          | Value                                   |
| -------------- | ----------------- | --------------------------------------- |
| `SHEET_ID`     | yes in production | the id from the spreadsheet URL         |
| `PURGE_SECRET` | yes in production | a random string, the guard for `/purge` |

The Sheet must be shared as **Anyone with the link, Viewer**. No GCP project and
no API key.

## Pages

| Path                          | Content                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `/`                           | Property name, aggregate vacancies, list of active locations         |
| `/locations/$slug`            | Gallery, facilities, room map by floor, room type list, location map |
| `/locations/$slug/type/$type` | One room type, with every other type dimmed on the room map          |
| `/purge?secret=`              | Cache invalidation plus a plain-language report on the data          |

No route needs adding when the owner adds a location or a room type. `$slug` and
`$type` are matched against the Sheet's contents at request time.

## Language

The site is in English. The Sheet keeps its Indonesian column names (`lokasi`,
`kamar`, `harga_bulanan`, `aktif`) and its Indonesian status values (`kosong`,
`dibooking`, `terisi`), because that is the owner's own vocabulary and what the
handover docs describe. The site translates those values for display, in
`statusLabel` in `src/components/status-badge.tsx`.

## Room types

The `tipe` column in the `kamar` tab is free text, not an enum, so the owner can
name their own types without a deploy. Rooms sharing a `tipe` are grouped into
one card and one type page. The facilities shown are the **intersection** across
every room of that type, never the union, so a card cannot promise a facility
some of its rooms lack.

The room map draws every physical room as a coloured tile grouped by floor. An
available tile is a `wa.me` link carrying that room's code.

## Cache and purge

Every catalogue page sends:

```
Netlify-CDN-Cache-Control: s-maxage=300, stale-while-revalidate=86400
Netlify-Cache-Tag: sheet
```

Netlify holds the HTML for 5 minutes and serves it stale for up to a day while
revalidating, so a slow or broken Sheet never reaches a visitor.
`/purge?secret=...` calls `purgeCache({ tags: ['sheet'] })` and clears the
in-process cache, making a change visible immediately.

Load on Google is capped at one fetch per tab per 5 minutes per instance,
constant with traffic.

## Three layers of resilience

1. **Skip the row.** Every row is validated by Zod on its own. A row that fails
   is dropped, the rest still render, and its row number is reported at `/purge`.
2. **Snapshot.** If the fetch fails, sharing is revoked, or the `lokasi` tab is
   empty, the app falls back to the committed `src/data/snapshot.json`.
3. **Stale-while-revalidate.** The CDN serves the previous HTML during
   revalidation.

Refresh the snapshot after any structural change to the Sheet:

```bash
SHEET_ID=... npm run snapshot
git commit -am "chore: refresh snapshot"
```

## Deploying to Netlify

1. Connect this repo to Netlify. `netlify.toml` already sets the build command
   and the publish directory.
2. Site settings > Environment variables: set `SHEET_ID` and `PURGE_SECRET`.
3. After the first deploy, make a bookmark for the owner:
   `https://<domain>/purge?secret=<PURGE_SECRET>`.

## Working on this repo

[`AGENTS.md`](AGENTS.md) is the contract for humans and agents alike: the
single gate (`npm run verify`), the guardrail ladder, the frozen Sheet
contract, and a diff-driven map into [`docs/harness/`](docs/harness/).

## Handover

The handover docs are written in Indonesian for the owner.

- [docs/sop-client.md](docs/sop-client.md) - one page SOP for the owner
- [docs/sheet-template.md](docs/sheet-template.md) - tabs, columns, and the data
  validation to install in the Sheet
- [docs/kozy-sheet-template.xlsx](docs/kozy-sheet-template.xlsx) - ready to
  upload to Google Sheets, with sample data and a guide tab
