/**
 * Refreshes the dev seed src/data/snapshot.json from the live Sheet.
 *
 *   SHEET_ID=... node scripts/snapshot.mjs
 *
 * This file is a development seed, not a runtime fallback: the app renders it
 * only when SHEET_ID is unset (local dev, the CI build). A failed fetch in
 * production serves the last copy read successfully instead (see src/lib/store.ts).
 * make-sheet-template.py also builds the client .xlsx from it, so commit it
 * after any structural change to the Sheet.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sheetId = process.env.SHEET_ID
if (!sheetId) {
  console.error('SHEET_ID is required')
  process.exit(1)
}

async function tab(name) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  const body = await response.text()
  if (body.trimStart().startsWith('<'))
    throw new Error(`${name}: not CSV, check sheet sharing`)

  const { csvToRecords } = await import('../src/lib/csv.ts')
  return csvToRecords(body)
}

const [config, lokasi, kamar, denah] = await Promise.all([
  tab('config'),
  tab('lokasi'),
  tab('kamar'),
  // Optional tab: an owner may never make it. Its absence is not an error.
  tab('denah').catch(() => []),
])
const target = fileURLToPath(
  new URL('../src/data/snapshot.json', import.meta.url),
)
writeFileSync(
  target,
  JSON.stringify({ config, lokasi, kamar, denah }, null, 2) + '\n',
)
console.log(
  `snapshot written: ${lokasi.length} lokasi, ${kamar.length} kamar, ${denah.length} baris denah`,
)
