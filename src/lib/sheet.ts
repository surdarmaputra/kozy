import { csvToRecords } from './csv'
import { configRowSchema, kamarSchema, lokasiSchema, parseRows } from './schema'
import type { Catalog, SiteConfig } from './schema'
import snapshot from '../data/snapshot.json' with { type: 'json' }

const TTL_MS = 5 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000

const defaultConfig: SiteConfig = {
  brand: 'Kozy',
  tagline: 'Kamar kos siap huni',
  wa_default: '',
  alamat_kantor: '',
}

type CacheEntry = { catalog: Catalog; expiresAt: number }
let cache: CacheEntry | null = null

export function sheetId(): string {
  return process.env.SHEET_ID ?? ''
}

function gvizUrl(tab: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId()}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
}

async function fetchTab(tab: string): Promise<Array<Record<string, string>>> {
  const response = await fetch(gvizUrl(tab), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: 'text/csv' },
  })
  if (!response.ok) throw new Error(`tab "${tab}" ${response.status}`)
  const body = await response.text()
  // A revoked share link returns a Google sign-in page with a 200.
  if (body.trimStart().startsWith('<'))
    throw new Error(`tab "${tab}" bukan CSV, cek sharing Sheet`)
  return csvToRecords(body)
}

function toConfig(
  rows: Array<Record<string, string>>,
  skipped: Array<string>,
): SiteConfig {
  const pairs = parseRows(configRowSchema, rows, 'config', skipped)
  const map = new Map(
    pairs.map((pair) => [pair.key.trim().toLowerCase(), pair.value]),
  )
  return {
    brand: map.get('brand') || defaultConfig.brand,
    tagline: map.get('tagline') || defaultConfig.tagline,
    wa_default: (map.get('wa_default') || '').replace(/[^0-9]/g, ''),
    alamat_kantor: map.get('alamat_kantor') || '',
  }
}

function snapshotCatalog(skipped: Array<string>): Catalog {
  const raw = snapshot as {
    config: Array<Record<string, string>>
    lokasi: Array<Record<string, string>>
    kamar: Array<Record<string, string>>
  }
  return {
    config: toConfig(raw.config, skipped),
    lokasi: parseRows(lokasiSchema, raw.lokasi, 'lokasi', skipped),
    kamar: parseRows(kamarSchema, raw.kamar, 'kamar', skipped),
    source: 'snapshot',
    fetchedAt: new Date().toISOString(),
    skipped,
  }
}

async function readCatalog(): Promise<Catalog> {
  const skipped: Array<string> = []

  if (!sheetId()) {
    skipped.push('SHEET_ID belum diisi, memakai snapshot.json')
    return snapshotCatalog(skipped)
  }

  try {
    const [config, lokasi, kamar] = await Promise.all([
      fetchTab('config'),
      fetchTab('lokasi'),
      fetchTab('kamar'),
    ])
    const catalog: Catalog = {
      config: toConfig(config, skipped),
      lokasi: parseRows(lokasiSchema, lokasi, 'lokasi', skipped),
      kamar: parseRows(kamarSchema, kamar, 'kamar', skipped),
      source: 'sheet',
      fetchedAt: new Date().toISOString(),
      skipped,
    }
    // An empty sheet is indistinguishable from a broken one for a visitor,
    // so treat it as a failure and keep the snapshot on screen.
    if (catalog.lokasi.length === 0) throw new Error('tab lokasi kosong')
    return catalog
  } catch (error) {
    skipped.push(
      `Gagal baca Sheet: ${error instanceof Error ? error.message : String(error)}`,
    )
    return snapshotCatalog(skipped)
  }
}

/** One fetch per tab per TTL regardless of traffic. Stale data is served while
 *  a refresh is in flight so a slow Sheet never blocks a render. */
export async function getCatalog(): Promise<Catalog> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.catalog

  try {
    const catalog = await readCatalog()
    cache = { catalog, expiresAt: now + TTL_MS }
    return catalog
  } catch {
    if (cache) return cache.catalog
    throw new Error('katalog tidak tersedia')
  }
}

export function clearCatalogCache() {
  cache = null
}
