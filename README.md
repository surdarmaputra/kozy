# Kozy

A multi-location room catalogue. Availability is read from a Google Sheet at
request time, server-rendered, and cached at Netlify's CDN. The owner changes a
room's status from their phone in the Sheet; the site catches up on its own
within about one to two minutes, or instantly via `/purge`. There is no deploy,
no CMS, and no database.

**The Google Sheet is the admin panel.**

---

## Quick start

Runs with no configuration. Without `SHEET_ID` the app serves the committed
sample seed in `src/data/snapshot.json`, so you can develop without access to
any spreadsheet. (With a `SHEET_ID` set, that file is never used — a failed
fetch falls back to the last copy read successfully, not to the seed.)

```bash
npm install
npm run dev        # http://localhost:3000
```

To point it at a real Sheet, create `.env` and fill in the two variables below:

```bash
cp .env.example .env
```

`npm run dev` and `npm run snapshot` load `.env` automatically (via Node's
`--env-file-if-exists`). `npm run build` deliberately does not — see
[Why the build ignores .env](#why-the-build-ignores-env).

---

## Environment variables

Server-side only. None is ever sent to the browser.

| Variable             | Required   | Used by                                | If missing                                    |
| -------------------- | ---------- | -------------------------------------- | --------------------------------------------- |
| `SHEET_ID`           | Production | `src/lib/sheet.ts`, `npm run snapshot` | Serves the dev seed `src/data/snapshot.json`  |
| `PURGE_SECRET`       | Production | `/purge`                               | `/purge` says it is not switched on           |
| `CACHE_DIR`          | No         | `src/lib/store.ts`                     | Last-good copy is written under `.cache/`     |
| `NETLIFY_DEPLOYMENT` | No         | `vite.config.ts`, `src/lib/store.ts`   | Local dev; no edge emulator, no Netlify Blobs |

### `SHEET_ID` — how to get the value

It is the long id in the middle of your spreadsheet's URL. Open the Sheet in a
browser and read the address bar:

```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBd7ZWmpVwGT8H4LxTk9RcAbCdE/edit#gid=0
                                       └──────────────── SHEET_ID ────────────────┘
```

Copy the segment between `/d/` and the next `/`. It is roughly 44 characters of
letters, digits, hyphens and underscores.

```env
SHEET_ID=1BxiMVs0XRA5nFMdKvBd7ZWmpVwGT8H4LxTk9RcAbCdE
```

Take the id from the **`/edit` URL**, not from a "Share" or "Publish to the web"
link — those contain a different token that will not work.

The Sheet must also be readable without a login. In the Sheet:
**File → Share → General access → Anyone with the link → Viewer.**

Without that, Google returns a sign-in page instead of CSV and the site falls
back to the last copy it read successfully (or a friendly unavailable page if it
never got one). There is no GCP project, no service account, and no API key
anywhere in this setup.

### `PURGE_SECRET` — how to produce the value

Any long random string. Generate one, do not invent one by hand:

```bash
openssl rand -hex 24
# or, if openssl is unavailable:
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

```env
PURGE_SECRET=9f2c7a41e8b0d35619ac4f7e2b8d0c136a5e94f712db3c80
```

It is the only thing between the public and your cache-purge endpoint, so treat
it like a password: never commit it, and give the owner the full bookmark URL
rather than the bare secret.

---

## Connecting a real Google Sheet

1. **Create the spreadsheet from the template.** Upload
   [`docs/kozy-sheet-template.xlsx`](docs/kozy-sheet-template.xlsx) to Google
   Drive and open it with Google Sheets. It already contains the three required
   tabs, the correct headers, sample rows, dropdowns, and a `Panduan` guide tab
   for the owner.

   Building one by hand instead? The required tabs and columns are in
   [`docs/sheet-template.md`](docs/sheet-template.md). Tab names and column names
   must match exactly; they are the contract this app parses.

2. **Share it.** File → Share → General access → **Anyone with the link** →
   **Viewer**.

3. **Copy the id** from the URL, as described above, into `.env`.

4. **Check it locally.**

   ```bash
   npm run dev
   # open http://localhost:3000/purge?secret=<your PURGE_SECRET>
   ```

   The page reports which source it used. "Google Sheet (live)" means it worked.
   "Saved copy, Sheet unreachable" or "Sample data, no SHEET_ID" means it could
   not read the Sheet — the page names the reason, and it is almost always
   step 2.

5. **Refresh the dev seed** so the offline copy matches real data:

   ```bash
   npm run snapshot
   git commit -am "chore: refresh dev seed"
   ```

---

## Commands

```bash
npm run dev        # dev server on :3000, loads .env
npm run verify     # the gate: format, lint, typecheck, tests, build, route-tree drift
npm run build      # production build (client + SSR bundle)
npm run test       # unit tests
npm run snapshot   # rewrite the dev seed src/data/snapshot.json from the live Sheet
```

`npm run verify` runs the same steps as CI in the same order. Green locally
means green in CI.

---

## Deploying to Netlify

1. **Connect the repository.** In Netlify: Add new site → Import an existing
   project → pick this repo. [`netlify.toml`](netlify.toml) already sets the
   build command (`vite build`) and publish directory (`dist/client`), so accept
   the detected settings.

2. **Set both environment variables.** Site configuration → Environment
   variables → Add a variable, twice:

   | Key            | Value                           |
   | -------------- | ------------------------------- |
   | `SHEET_ID`     | the id from your Sheet's URL    |
   | `PURGE_SECRET` | the random string you generated |

   Scope them to **all deploy contexts** so preview deploys work too. Netlify
   only picks up new variables on the next build, so redeploy after adding them.

3. **Deploy.** The SSR bundle is emitted to a Netlify Function automatically by
   `@netlify/vite-plugin-tanstack-start`; there is nothing to configure. The
   last-good copy is stored in Netlify Blobs (no setup — the function has a store
   bound automatically); set `NETLIFY_DEPLOYMENT=true` if you also want the edge
   emulator when running `netlify dev` locally.

4. **Give the owner their purge bookmark.** After the first deploy, build this
   URL and have them bookmark it as something like "Refresh the website":

   ```
   https://<your-domain>/purge?secret=<PURGE_SECRET>
   ```

   Send the whole URL. The owner never needs to know it contains a secret.

5. **Custom domain** (optional): Domain management → Add a domain. The domain is
   the only recurring cost; hosting fits in Netlify's free tier.

### Verifying a deployment

```bash
curl -sI https://<your-domain>/ | grep -i netlify
# expect: netlify-cdn-cache-control: s-maxage=60, stale-while-revalidate=86400
#         netlify-cache-tag: sheet
```

Then open `/purge?secret=...` and confirm it reports **Google Sheet (live)** as
the data source, with the location and room counts you expect.

### Why the build ignores .env

`npm run build` never reads `SHEET_ID`, on purpose. Data is fetched at request
time, not at build time, so a build never bakes in stale availability. Without
the variable the build renders the committed dev seed, which keeps CI honest
without needing Sheet access. Production always has `SHEET_ID` set; if the Sheet
is unreachable there it serves the last copy it read successfully, never the
seed.

---

## Troubleshooting

| Symptom                                       | Cause and fix                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/purge` says "Saved copy, Sheet unreachable" | The Sheet is not readable; visitors see the last good copy. Re-check File → Share → Anyone with the link, Viewer. The page names the underlying error. |
| `/purge` says "could not be read"             | The Sheet is not readable and nothing was ever saved. Visitors see a temporary unavailable page. Fix sharing, then reopen `/purge`.                    |
| `/purge` says "Purge is not switched on yet"  | `PURGE_SECRET` is unset in that environment. Add it in Netlify and redeploy.                                                                           |
| `/purge` says "Wrong secret"                  | The URL's `secret=` does not match `PURGE_SECRET`. Use the bookmark rather than typing it.                                                             |
| Edits do not appear                           | Cached. Wait ~1–2 minutes and reload twice, or open the purge bookmark for an immediate refresh.                                                       |
| Rows silently missing                         | A row failed validation. `/purge` lists the sheet row numbers and why. Rows with `aktif=FALSE` are hidden by design.                                   |
| Dev server exits on Netlify Edge Functions    | The Netlify plugin's bundled Deno failed to start in your environment. Builds and production are unaffected.                                           |

---

## How it works

### Pages

| Path                          | Content                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `/`                           | Property name, aggregate vacancies, list of active locations         |
| `/locations/$slug`            | Gallery, facilities, room map by floor, room type list, location map |
| `/locations/$slug/type/$type` | One room type, with every other type dimmed on the room map          |
| `/purge?secret=`              | Cache invalidation plus a plain-language report on the data          |

No route needs adding when the owner adds a location or a room type. `$slug` and
`$type` are matched against the Sheet's contents at request time.

### Room types

The `tipe` column in the `kamar` tab is free text, not an enum, so the owner can
name their own types without a deploy. Rooms sharing a `tipe` are grouped into
one card and one type page. The facilities shown are the **intersection** across
every room of that type, never the union, so a card cannot promise a facility
some of its rooms lack.

The room map draws every physical room as a coloured tile grouped by floor. An
available tile is a `wa.me` link carrying that room's code, type and price.

### Cache and purge

Every catalogue page that resolved to data sends:

```
Netlify-CDN-Cache-Control: s-maxage=60, stale-while-revalidate=86400
Netlify-Cache-Tag: sheet
```

Netlify holds the HTML for 60 seconds and serves it stale for up to a day while
revalidating, so a slow or broken Sheet never reaches a visitor. The unavailable
page (see below) sends `no-store` instead, so recovery shows immediately.

Load on Google is capped at one fetch per tab per 60 seconds per instance,
constant with traffic.

#### How soon does a Sheet edit show up?

Two caches sit in front of the Sheet:

| Layer                       | Window                                         | Behaviour                                                                      |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| In-process (per instance)   | 60 s TTL                                       | one Sheet fetch per tab per 60 s; last good copy served while it refetches     |
| Netlify CDN (rendered HTML) | `s-maxage=60` + `stale-while-revalidate=86400` | fresh for 60 s, then the old page is served for up to 24 h while it re-renders |

**If you do not purge, just wait.** After the 60-second window the first visitor
still gets the old page but triggers a background re-render; the next visitor
gets the new one. In practice an edit lands in **about 1–2 minutes** on a site
with steady traffic. With little or no traffic it can sit longer — nothing
re-renders until someone asks for the page — but a visitor is never made to wait
for a slow render (that is the 24 h stale window).

**If you need it live now**, open `/purge?secret=...`. It calls
`purgeCache({ tags: ['sheet'] })` and clears the in-process cache, so the very
next request re-renders from the Sheet. `PURGE_SECRET` must be set for this to
work; if it is left unset, the wait above is the only path and `/purge` just
reports that it is switched off.

### Four layers of resilience

The rule: a stale-but-real copy beats an error, and an honest error beats wrong
data.

1. **Skip the row.** Every row is validated by Zod on its own. A row that fails
   is dropped, the rest still render, and its row number is reported at `/purge`.
2. **Last good copy.** If the fetch fails, sharing is revoked, or the `lokasi`
   tab is empty, the app serves the last catalogue it read successfully — held
   in memory, in a file under `CACHE_DIR` (default `.cache/`), and on Netlify in
   Blobs. Shown as "Saved copy" on `/purge`. The committed `snapshot.json` is a
   dev seed, not part of this chain.
3. **Unavailable page.** If nothing has ever been read successfully, each
   catalogue route renders a friendly "temporarily unavailable" page at HTTP 200
   rather than showing stale or wrong data.
4. **Stale-while-revalidate.** The CDN serves the previous HTML during
   revalidation.

### Language

The site is in Indonesian. The Sheet keeps its Indonesian tab names, column
names and status values (`kosong`, `dibooking`, `terisi`), because that is the
owner's own vocabulary and what the handover docs describe. The three status
values are mapped to their display label in one place, `statusLabel` in
`src/components/status-badge.tsx`. `docs/harness/**`, this README, and code
comments stay English for developers.

---

## Stack

- TanStack Start (SSR, file-based routing) on Vite
- Tailwind v4 + shadcn/ui
- Zod for per-row Sheet validation
- Netlify Functions for SSR and `purgeCache`, Netlify Blobs for the last-good copy

## Working on this repo

[`AGENTS.md`](AGENTS.md) is the contract for humans and agents alike: the single
gate (`npm run verify`), the guardrail ladder, the frozen Sheet contract, and a
diff-driven map into [`docs/harness/`](docs/harness/).

## Handover

Written in Indonesian for the owner.

- [docs/sop-client.md](docs/sop-client.md) - one page SOP
- [docs/sheet-template.md](docs/sheet-template.md) - tabs, columns, and the data
  validation to install in the Sheet
- [docs/kozy-sheet-template.xlsx](docs/kozy-sheet-template.xlsx) - ready to
  upload to Google Sheets, with sample data and a guide tab
