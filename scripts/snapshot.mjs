/**
 * Refreshes src/data/snapshot.json from the live Sheet.
 *
 *   SHEET_ID=... node scripts/snapshot.mjs
 *
 * The snapshot is the last line of defence: if the Sheet is deleted, renamed,
 * or un-shared, the site keeps rendering this file. Commit it after any
 * structural change to the Sheet.
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

const [config, lokasi, kamar] = await Promise.all([
  tab('config'),
  tab('lokasi'),
  tab('kamar'),
])
const target = fileURLToPath(
  new URL('../src/data/snapshot.json', import.meta.url),
)
writeFileSync(target, JSON.stringify({ config, lokasi, kamar }, null, 2) + '\n')
console.log(`snapshot written: ${lokasi.length} lokasi, ${kamar.length} kamar`)
