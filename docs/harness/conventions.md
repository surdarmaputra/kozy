# Conventions

## #naming

| Thing               | Style                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| components          | PascalCase fn, kebab-case file (`room-type-card.tsx`)                  |
| fns / vars          | camelCase                                                              |
| lib files           | kebab-case, one concern per file                                       |
| Sheet-derived types | keep the Sheet's Indonesian names (`Kamar`, `Lokasi`, `harga_bulanan`) |
| UI-facing strings   | English                                                                |

Sheet-shaped identifiers stay Indonesian on purpose: they map one-to-one to
columns the owner sees. Renaming them breaks that correspondence and the docs.

## #imports

Absolute via `#/` (`#/lib/select`, `#/components/photo`). `@/` also resolves.
No relative import past one level. Never import `#/lib/sheet` from a component.

## #component

- Presentation only. No fetching, no `process.env`, no business rules that
  belong in `select.ts`.
- Props typed inline; no `any`, no `React.FC`.
- Server-rendered by default. `useState` is fine (this is SSR, not RSC), but
  only for real interaction — the filter toggle, not derived data.
- Every interactive element needs a visible focus state and an accessible name.
  Icon-only controls need `aria-label`; decorative icons need `aria-hidden`.

## #route

Each route file owns: `loader` (a server fn), `headers` (see architecture
#caching), `head` (title + description + OG, built from real data), and the
component. Not-found renders inside the normal shell.

## #shadcn

`src/components/ui/**` is owned code, not a dependency. Customise it freely,
but keep it token-driven — never hardcode a colour there. Add new primitives
with `npx shadcn@latest add <name>`; don't hand-write one that exists upstream.

## #design-tokens

**All tokens live in `src/styles.css`.** A colour, radius, or font declared
anywhere else is a G1 failure.

- One accent (deep green). Status colours are semantic, not decorative:
  `--status-kosong` available, `--status-dibooking` reserved, `--status-terisi`
  occupied. Do not introduce a fourth hue.
- One radius scale, driven by `--radius`.
- Plus Jakarta Sans for text; JetBrains Mono via `.num` for prices, room codes,
  sizes and counts — anything a reader compares down a column.
- Dark mode is `prefers-color-scheme` only, redefining tokens under
  `@media`. No `.dark` class, no toggle, no JS, no flash.
- Mobile first: the room map and type grid must stay usable at 390px, and no
  page may scroll horizontally at any width.

## #copy

- UI is English. No em-dashes (`—`) anywhere visible; use a comma, a period, or
  a hyphen.
- Never name a person or role behind the WhatsApp number. It may be the owner's
  or a shared line; "penjaga kos" claims something we cannot guarantee.
- Prices via `formatRupiah`. Never hand-format a rupiah string.
- One label per intent. "Chat on WhatsApp" is the contact CTA everywhere;
  don't invent a synonym per section.

## #generated

Never hand-edit:

| File                            | Regenerate with                                                    |
| ------------------------------- | ------------------------------------------------------------------ |
| `src/routeTree.gen.ts`          | `npm run build` (not `tsr generate` — it drops the Register block) |
| `src/data/snapshot.json`        | `SHEET_ID=... npm run snapshot`                                    |
| `docs/kozy-sheet-template.xlsx` | `python3 scripts/make-sheet-template.py`                           |
| `package-lock.json`             | npm                                                                |

The `.xlsx` is built from `snapshot.json`, so refresh the snapshot first. It
ships formula-free on purpose: an unverifiable `#NAME?` in a client handover
file is worse than no summary.

## #docs-language

`docs/sop-client.md`, `docs/sheet-template.md`, and the `Panduan` tab of the
workbook are written for the owner and stay Indonesian. `docs/harness/**`,
`README.md`, and code comments are English. When UI copy changes, update the
labels quoted inside the Indonesian docs so they still match the screen.
