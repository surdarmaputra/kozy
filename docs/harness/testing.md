# Testing

## Shape

Vitest only, no browser runner, no e2e. The risk in this project is **parsing
someone else's spreadsheet**, so that is where the tests are. UI is verified by
running the built SSR bundle and looking at it, not by snapshot tests that
would freeze markup nobody has reviewed.

## #unit

Location: `src/lib/__tests__/<area>.test.ts`. Any new `src/lib/*.ts` needs
coverage in the same run.

Test the values a real sheet produces, not the happy path:

- messy cells — `"Rp 1.450.000"`, `" KOSONG "`, `"Deluxe AC "`, blank
- quoting — commas, newlines and doubled quotes inside a field
- header drift — casing and stray whitespace in row 1
- unknown enum — an unrecognised `status` must fall back to `terisi`, never
  make a room look bookable
- skip-row — one bad row drops, its neighbours survive, its row number is
  reported
- selectors — inactive rows excluded, vacancy counts, price range, facility
  intersection, floor grouping
- WhatsApp links — the room code, location name and price all reach the message

Fix the code, not the test, unless the test encodes the wrong rule.

## #manual

Some things tests here do not cover. Check them by hand when touched:

```bash
npm run build
SHEET_ID=broken PURGE_SECRET=x node <serve dist/server/server.js>
```

- a broken `SHEET_ID` still renders every page from the snapshot
- `/purge` reports source, counts, and skipped rows in plain language
- `Netlify-CDN-Cache-Control` and `Netlify-Cache-Tag` are on catalogue routes
- no snapshot strings in `dist/client/assets/*.js`
- light and dark, 390px and 1440px, no horizontal scroll

## #fixtures

Build fixtures with `parseRows` and the real schemas rather than hand-written
object literals, so a schema change surfaces in the tests instead of silently
diverging from what the parser actually produces.
