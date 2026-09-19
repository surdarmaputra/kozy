# Kozy

A multi-location room catalogue. Availability is read from a Google Sheet at
request time and served as SSR HTML cached at the CDN edge. **The Sheet is the
admin panel.** There is no CMS and no database.

### How sheet edits take effect

Edit a cell in the Sheet → save → the site catches up automatically in about
**1–2 minutes**. If you need it live immediately, open the purge URL:

```
https://<your-domain>/purge?secret=<PURGE_SECRET>
```

Bookmark this as "Refresh website". Opening it clears the cache so the next
visitor sees the latest data at once. `PURGE_SECRET` is set in Vercel — see
[step 3.4](#3-deploy-to-vercel).

---

## 1. Prepare the Google Sheet

1. **Upload the template.** Go to [Google Drive](https://drive.google.com),
   click **New → File upload**, and upload
   [`docs/kozy-sheet-template.xlsx`](docs/kozy-sheet-template.xlsx). Once
   uploaded, open it with Google Sheets.

2. **Fill in your data.** The spreadsheet has four tabs:

   | Tab      | Purpose                                                        |
   | -------- | -------------------------------------------------------------- |
   | `config` | Brand name, tagline, default WhatsApp number, office address   |
   | `lokasi` | One row per location (slug, name, address, photos, facilities) |
   | `kamar`  | One row per physical room (code, floor, type, price, status)   |
   | `denah`  | _(Optional)_ Floor-plan grid layout                            |

   The `Panduan` tab inside the file explains every column in Indonesian.

3. **Share it publicly (read-only).** In the Sheet: **File → Share → Share
   with others → General access → Anyone with the link → Viewer → Done.**
   The app fetches the Sheet as CSV with no credentials — sharing must be on
   or every fetch fails.

4. **Copy the Sheet ID.** It is the segment between `/d/` and the next `/` in
   the browser's address bar:

   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBd7Zw.../edit
                                          └────────── SHEET_ID ──────────┘
   ```

---

## 2. Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

No configuration needed to start. Without `SHEET_ID` the app serves
`src/data/snapshot.json` (sample data) so you can browse the UI immediately.

**To connect your real Sheet:**

```bash
cp .env.example .env
# edit .env — set SHEET_ID and PURGE_SECRET
npm run dev
```

Open `http://localhost:3000/purge?secret=<PURGE_SECRET>` and confirm it reports
**Google Sheet (live)** as the data source. If it says "Sheet unreachable",
re-check step 1.3 above.

After confirming, refresh the offline seed so it matches real data:

```bash
npm run snapshot
git commit -am "chore: refresh dev seed"
```

### Environment variables

| Variable       | Required in prod | Purpose                                                                                 |
| -------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `SHEET_ID`     | Yes              | Google Sheet ID (see step 1.4)                                                          |
| `PURGE_SECRET` | Yes              | Secret for `/purge` — generate with `openssl rand -hex 24`                              |
| `CACHE_DIR`    | No               | Directory for the last-good-copy file (default: `.cache/`, `/tmp/kozy-cache` on Vercel) |

---

## 3. Deploy to Vercel

1. **Connect the repo.** In Vercel: **Add New → Project → Import** this repo.
   Leave the framework preset as **Other** and accept the detected settings —
   [`vercel.json`](vercel.json) already sets the build command, the output
   directory and the SSR function route.

2. **Add environment variables.** Project Settings → Environment Variables →
   Add:

   | Key            | Value                           |
   | -------------- | ------------------------------- |
   | `SHEET_ID`     | from step 1.4                   |
   | `PURGE_SECRET` | the random string you generated |

   Scope both to **Production, Preview and Development**. Redeploy after adding
   them.

   `SHEET_ID` matters at build time as well as at runtime: the build bakes a
   copy of the Sheet into the bundle so a cold instance still serves real data
   if Google is unreachable.

3. **Deploy.** The SSR function is wired up by `vercel.json` — nothing to
   configure. Every push to `main` triggers a deploy.

4. **Give the owner the purge bookmark.** Build this URL and send it to the
   owner as a "Refresh the website" bookmark:

   ```
   https://<your-domain>/purge?secret=<PURGE_SECRET>
   ```

   Opening it clears the server cache and re-reads the Sheet, so an edit
   appears within a minute instead of waiting up to two.

   Also open the `Panduan` tab in the Google Sheet and replace the placeholder
   purge URL there with the real URL above — the owner will find it directly
   in the sheet without having to ask. Update the secret text in that tab to
   match the `PURGE_SECRET` you set in Vercel.

5. **Verify.** Open `/purge?secret=...` and confirm it shows **Google Sheet
   (live)** and the location/room counts you expect.

---

## Commands

```bash
npm run dev        # dev server on :3000, loads .env
npm run verify     # full gate: format → lint → typecheck → tests → build → route-tree
npm run build      # production build
npm run test       # unit tests only
npm run snapshot   # rewrite src/data/snapshot.json from the live Sheet
```

`npm run verify` runs the same steps as CI. Green locally means green in CI.

---

## Troubleshooting

| Symptom                               | Fix                                                               |
| ------------------------------------- | ----------------------------------------------------------------- |
| `/purge` says "Sheet unreachable"     | Re-check File → Share → Anyone with the link, Viewer              |
| `/purge` says "could not be read"     | Sheet never read successfully; fix sharing, then reload `/purge`  |
| `/purge` says "Purge not switched on" | `PURGE_SECRET` is unset — add it in Vercel and redeploy           |
| Edits take more than 2 minutes        | Normal CDN window; open the purge bookmark for an instant refresh |
| Rows silently missing                 | Failed validation — `/purge` lists the row numbers and reasons    |

---

## Stack

TanStack Start · Tailwind v4 · shadcn/ui · Zod · Vercel Functions

See [`AGENTS.md`](AGENTS.md) for the development contract and guardrail ladder.
