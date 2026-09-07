---
title: kozy
stack: TanStack Start · Tailwind v4 · shadcn/ui · Zod · Vitest · Netlify
---

A multi-location room catalogue. Availability is read from a Google Sheet at
request time, server-rendered, cached at Netlify's CDN. The owner edits the
Sheet from a phone; nothing here redeploys. **The Sheet is the admin panel.**

## The loop

`npm run verify` is the single gate. Same steps as CI, same order.

```
npm run verify   # check → lint → typecheck → test → build → route-tree drift
npm run dev      # dev server :3000
npm run snapshot # SHEET_ID=... refresh the dev seed src/data/snapshot.json
```

**Run it after every change. Never report work done without a green run.**
Never disable or narrow a check to make it pass. If a rule looks wrong, say so;
do not route around it. A gate bypassed once is bypassed always.

## Session start

1. `git status` + current branch
2. identify the task
3. load only the harness sections the changed paths map to (below)
4. confirm scope before coding

## Harness refs

Diff-driven. Load ONLY sections matching changed paths, never a whole doc.

| Changed path                                 | Doc · sections                                                |
| -------------------------------------------- | ------------------------------------------------------------- |
| `src/lib/{csv,schema,sheet,select,store}.ts` | architecture.md · #sheet-contract #resilience #server-only    |
| `src/lib/{catalog,http}.ts`                  | architecture.md · #server-fns #caching                        |
| `src/routes/**`                              | architecture.md · #routing #caching · conventions.md · #route |
| `src/components/**`                          | conventions.md · #component #design-tokens #copy              |
| `src/components/ui/**`                       | conventions.md · #shadcn                                      |
| `src/data/snapshot.json` · `scripts/**`      | architecture.md · #resilience · conventions.md · #generated   |
| `docs/**`                                    | conventions.md · #docs-language                               |
| any new `src/lib/*.ts`                       | testing.md · #unit                                            |
| `.github/workflows/**`                       | architecture.md · #ci                                         |

## Guardrails

G1 — Harness compliance (strict, no command)
Classify each changed file by path → load matching sections → check every
changed file against them. One violation = FAIL. On FAIL: list violations
with file+line, fix all, re-run G1 from scratch. Doubt = fail.
Auto-fail: `any` · relative imports past one level · new `src/lib/*.ts` with
no test · a new colour outside `src/styles.css` · hand-edited
`src/routeTree.gen.ts` · a Sheet column or status value renamed.

G2 — `npm run check` (prettier). Never widen `.prettierignore` to pass.
G3 — `npm run lint` (eslint).
G4 — `npm run typecheck`. Fix types; `any` is never the escape.
G5 — `npm test` (vitest). Fix code, not tests, unless the test is wrong.
G6 — `npm run build`. Imports/exports/config only, no logic changes.
G7 — Route-tree drift. `src/routeTree.gen.ts` is generated **by the build**,
not by `tsr generate` (the CLI omits the Register block). Never hand-edit.

Always: no secrets in code · no `console.log` in shipped code · no unused deps.

## Non-negotiables

**The Sheet contract is frozen.** Tabs `config` `lokasi` `kamar`; Indonesian
column names; status values `kosong` `dibooking` `terisi`. The owner's
spreadsheet and `docs/` depend on them. Renaming one is a breaking change to a
file this repo does not control. The three status _values_ are mapped to their
display label in exactly one place, `statusLabel` in
`src/components/status-badge.tsx`; read it before adding a status anywhere.

**A bad row never blanks a page, but wrong data is worse than none.** Rows
validate one at a time; a failure is skipped and reported at `/purge`, never
thrown. On a failed fetch: skip-row → last good copy (`src/lib/store.ts`:
memory → `CACHE_DIR` file → Netlify Blobs) → a friendly unavailable page at
HTTP 200 → CDN stale-while-revalidate. The committed `snapshot.json` is **not**
in this chain — it is a dev seed, rendered only when `SHEET_ID` is unset.

**`src/lib/sheet.ts` and `src/lib/store.ts` are server-only.** `sheet.ts`
carries the fetch and the dev-seed import; `store.ts` carries the file and
Netlify Blobs persistence. Components import selectors from `src/lib/select.ts`
instead. Check after changing any of them:
`grep -l "Pogung\|Batam Centre" dist/client/assets/*.js` must find nothing.

**Every catalogue route sends `sheetCacheHeaders`** from `src/lib/http.ts` when
its loader resolved to data (`noStoreHeaders` when it resolved to `null`). A
route without either silently drops to no CDN caching.

**Type facilities are an intersection**, never a union — a card must not
promise a facility some rooms of that type lack.

**Every WhatsApp link carries its own context** (room code, type, price). That
prefill is the conversion mechanism, not decoration.

## Layout

```
src/
├── routes/          file-based routes; `locations.$slug.type.$type.tsx` = /locations/:slug/type/:type
├── components/      presentational; ui/ is shadcn (owned, customised)
├── lib/
│   ├── csv.ts       RFC 4180 parser (gviz quotes fields)
│   ├── schema.ts    zod row schemas + per-row parse
│   ├── sheet.ts     SERVER ONLY: fetch, 60s cache, last-good fallback
│   ├── store.ts     SERVER ONLY: last-good persistence (memory/file/Blobs)
│   ├── select.ts    pure selectors, safe to import anywhere
│   ├── catalog.ts   server fns (loadCatalog, purgeSheetCache)
│   └── http.ts      sheetCacheHeaders, noStoreHeaders
├── data/snapshot.json   dev seed (SHEET_ID unset only); regenerate, never hand-edit
└── styles.css       ALL design tokens live here
docs/                 client handover (Indonesian) + harness/ (English)
```

## Gotchas

- `#/*` → `src/*` (package.json imports + tsconfig paths). `@/*` also resolves.
- Build runs without `SHEET_ID` on purpose and serves the dev seed (`source: 'seed'`). Keep it that way.
- `/purge` needs `PURGE_SECRET`; without it the page says so rather than 500ing.
- One light theme only. No dark mode, no `prefers-color-scheme` override, no class, no JS, no toggle.
- `devtools()` stays first in `vite.config.ts`.
- `.agents/` and `.claude/` are vendored skills; prettier ignores them.

## Skills

| Task                           | Skill                   |
| ------------------------------ | ----------------------- |
| Any UI or design change        | `design-taste-frontend` |
| Writing a commit, syncing a PR | `conventional-commit`   |
| Stress-testing a plan          | `grill-me`              |

## Defaults

- Smallest change that does the job. One concern per change.
- Say when unsure. A flagged uncertainty beats a confident wrong answer.
- No scope creep. Don't add a feature because the framework supports it.
- UI copy is Indonesian. `docs/harness/**`, `README.md`, and code comments stay English; `docs/` client handover stays Indonesian.
