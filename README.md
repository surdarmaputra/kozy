# Kozy

A multi-location room catalogue. Availability is read from a Google Sheet at
request time, server-rendered, and cached at Netlify's CDN. The owner changes a
room's status from their phone in the Sheet; the site updates within five
minutes, or instantly via `/purge`. There is no deploy, no CMS, and no database.

**The Google Sheet is the admin panel.**

---

## Quick start

Runs with no configuration. Without `SHEET_ID` the app serves the committed
sample data in `src/data/snapshot.json`, so you can develop without access to
any spreadsheet.

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

Two, both server-side only. Neither is ever sent to the browser.

| Variable       | Required   | Used by                                | If missing                          |
| -------------- | ---------- | -------------------------------------- | ----------------------------------- |
| `SHEET_ID`     | Production | `src/lib/sheet.ts`, `npm run snapshot` | Serves `src/data/snapshot.json`     |
| `PURGE_SECRET` | Production | `/purge`                               | `/purge` says it is not switched on |

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
back to the snapshot. There is no GCP project, no service account, and no API
key anywhere in this setup.

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

   The page reports which source it used. "Google Sheet" means it worked.
   "Committed snapshot" means it could not read the Sheet — the page names the
   reason, and it is almost always step 2.

5. **Refresh the committed fallback** so the offline copy matches real data:

   ```bash
   npm run snapshot
   git commit -am "chore: refresh snapshot"
   ```

---

## Commands

```bash
npm run dev        # dev server on :3000, loads .env
npm run verify     # the gate: format, lint, typecheck, tests, build, route-tree drift
npm run build      # production build (client + SSR bundle)
npm run test       # unit tests
npm run snapshot   # rewrite src/data/snapshot.json from the live Sheet
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
   `@netlify/vite-plugin-tanstack-start`; there is nothing to configure.

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
# expect: netlify-cdn-cache-control: s-maxage=300, stale-while-revalidate=86400
#         netlify-cache-tag: sheet
```

Then open `/purge?secret=...` and confirm it reports **Google Sheet** as the data
source, with the location and room counts you expect.

### Why the build ignores .env

`npm run build` never reads `SHEET_ID`, on purpose. The build must succeed
against the committed snapshot, because that is exactly the path production falls
back to when the Sheet is unreachable. CI builds without the variable for the
same reason. Data is fetched at request time, not at build time, so a build never
bakes in stale availability.

---

## Troubleshooting

| Symptom                                      | Cause and fix                                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/purge` says "Committed snapshot"           | The Sheet is not readable. Re-check File → Share → Anyone with the link, Viewer. The page names the underlying error. |
| `/purge` says "Purge is not switched on yet" | `PURGE_SECRET` is unset in that environment. Add it in Netlify and redeploy.                                          |
| `/purge` says "Wrong secret"                 | The URL's `secret=` does not match `PURGE_SECRET`. Use the bookmark rather than typing it.                            |
| Edits do not appear                          | Cached for up to 5 minutes. Open the purge bookmark, then reload.                                                     |
| Rows silently missing                        | A row failed validation. `/purge` lists the sheet row numbers and why. Rows with `aktif=FALSE` are hidden by design.  |
| Dev server exits on Netlify Edge Functions   | The Netlify plugin's bundled Deno failed to start in your environment. Builds and production are unaffected.          |

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

### Three layers of resilience

1. **Skip the row.** Every row is validated by Zod on its own. A row that fails
   is dropped, the rest still render, and its row number is reported at `/purge`.
2. **Snapshot.** If the fetch fails, sharing is revoked, or the `lokasi` tab is
   empty, the app falls back to the committed `src/data/snapshot.json`.
3. **Stale-while-revalidate.** The CDN serves the previous HTML during
   revalidation.

### Language

The site is in English. The Sheet keeps its Indonesian tab names, column names
and status values (`kosong`, `dibooking`, `terisi`), because that is the owner's
own vocabulary and what the handover docs describe. The three status values are
mapped for display in one place, `statusLabel` in
`src/components/status-badge.tsx`.

---

## Stack

- TanStack Start (SSR, file-based routing) on Vite
- Tailwind v4 + shadcn/ui
- Zod for per-row Sheet validation
- Netlify Functions for SSR and `purgeCache`

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
