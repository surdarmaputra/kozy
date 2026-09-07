import { csvToRecords } from './csv'
import {
  configRowSchema,
  denahRowSchema,
  kamarSchema,
  lokasiSchema,
  parseRows,
} from './schema'
import type { Catalog, SiteConfig } from './schema'
import { persist, recall } from './store'

const TTL_MS = 60 * 1000
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
    throw new Error(`tab "${tab}" did not return CSV, check the Sheet sharing`)
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

/** Sample data shipped in the repo. Rendered only when SHEET_ID is unset (local
 *  dev, the CI build). Never a fallback for a failed fetch — a real outage shows
 *  the last good copy or a friendly unavailable page instead. Loaded lazily so
 *  the JSON stays out of the hot server bundle. */
async function seedCatalog(skipped: Array<string>): Promise<Catalog> {
  const { default: seed } = await import('../data/snapshot.json', {
    with: { type: 'json' },
  })
  const raw = seed as {
    config: Array<Record<string, string>>
    lokasi: Array<Record<string, string>>
    kamar: Array<Record<string, string>>
    denah?: Array<Record<string, string>>
  }
  return {
    config: toConfig(raw.config, skipped),
    lokasi: parseRows(lokasiSchema, raw.lokasi, 'lokasi', skipped),
    kamar: parseRows(kamarSchema, raw.kamar, 'kamar', skipped),
    denah: parseRows(denahRowSchema, raw.denah ?? [], 'denah', skipped),
    source: 'seed',
    fetchedAt: new Date().toISOString(),
    skipped,
  }
}

/** Reads the Sheet, or the seed when there is no SHEET_ID. Throws on any read
 *  failure — the caller decides what to serve instead. */
async function readCatalog(): Promise<Catalog> {
  const skipped: Array<string> = []

  if (!sheetId()) return seedCatalog(skipped)

  // `denah` is optional: an owner who never makes the tab, or a revoked share on
  // it alone, must not fail the whole read. Its failure means "no drawing", and
  // the map falls back to the plain per-floor listing.
  const [config, lokasi, kamar, denah] = await Promise.all([
    fetchTab('config'),
    fetchTab('lokasi'),
    fetchTab('kamar'),
    fetchTab('denah').catch(() => [] as Array<Record<string, string>>),
  ])
  const catalog: Catalog = {
    config: toConfig(config, skipped),
    lokasi: parseRows(lokasiSchema, lokasi, 'lokasi', skipped),
    kamar: parseRows(kamarSchema, kamar, 'kamar', skipped),
    denah: parseRows(denahRowSchema, denah, 'denah', skipped),
    source: 'sheet',
    fetchedAt: new Date().toISOString(),
    skipped,
  }
  // An empty sheet reads the same as a broken one for a visitor, so treat it as
  // a failure and let the last good copy stay on screen.
  if (catalog.lokasi.length === 0) throw new Error('the lokasi tab is empty')
  return catalog
}

/** One fetch per tab per TTL regardless of traffic. On failure: the last
 *  in-memory copy, then the persisted copy from disk/Blobs, then null so the
 *  route can render a friendly unavailable page. */
export async function getCatalog(): Promise<Catalog | null> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.catalog

  try {
    const catalog = await readCatalog()
    cache = { catalog, expiresAt: now + TTL_MS }
    if (catalog.source === 'sheet') persist(catalog)
    return catalog
  } catch {
    // Serve the stale in-memory copy, but push the expiry out a full TTL so a
    // down Sheet is not re-hit on every request during the outage.
    if (cache) {
      cache = { catalog: cache.catalog, expiresAt: now + TTL_MS }
      return cache.catalog
    }
    // Cold instance mid-outage: pull the last good copy off disk/Blobs and cache
    // it so that cost is paid once per TTL, not per request.
    const recalled = await recall()
    if (recalled) {
      cache = { catalog: recalled, expiresAt: now + TTL_MS }
      return recalled
    }
    return null
  }
}

/** Clears only the in-process cache, not the persisted last-good copy: a purge
 *  must never destroy the outage safety net. */
export function clearCatalogCache() {
  cache = null
}
