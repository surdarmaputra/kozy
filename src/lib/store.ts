/** Persists the last catalogue we read successfully so a Sheet outage serves
 *  that copy instead of stale build-time data. Three backends, tried in order:
 *  in-process memory, a local file (`CACHE_DIR`, default `.cache/`), and Netlify
 *  Blobs (only when deployed). Every backend fails soft: a broken write or read
 *  degrades to the next one, never throws on the request path.
 *
 *  Server only. Imported by `sheet.ts`, never by a component. */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Catalog } from './schema'

type Backend = {
  name: 'memory' | 'file' | 'blob'
  load: () => Promise<Catalog | null>
  save: (catalog: Catalog) => Promise<void>
}

const cacheDir = () => process.env.CACHE_DIR ?? '.cache'
const catalogFile = () => join(cacheDir(), 'catalog.json')

// Same switch as vite.config.ts: Blobs is a Netlify-only backend.
const onNetlify = () =>
  process.env.NETLIFY_DEPLOYMENT === 'true' || Boolean(process.env.NETLIFY)

let lastGood: Catalog | null = null

const memory: Backend = {
  name: 'memory',
  load: async () => lastGood,
  save: async (catalog) => {
    lastGood = catalog
  },
}

const file: Backend = {
  name: 'file',
  load: async () => {
    try {
      return JSON.parse(await readFile(catalogFile(), 'utf8')) as Catalog
    } catch {
      return null
    }
  },
  save: async (catalog) => {
    try {
      await mkdir(cacheDir(), { recursive: true })
      await writeFile(catalogFile(), JSON.stringify(catalog), 'utf8')
    } catch {
      // read-only filesystem, no permission, disk full — the next backend or a
      // later render covers us.
    }
  },
}

async function blobStore() {
  if (!onNetlify()) return null
  try {
    const { getStore } = await import('@netlify/blobs')
    return getStore('catalog')
  } catch {
    // Not running inside a Netlify function — no blob context to bind to.
    return null
  }
}

const blob: Backend = {
  name: 'blob',
  load: async () => {
    const store = await blobStore()
    if (!store) return null
    try {
      const raw = await store.get('catalog.json', { type: 'text' })
      return raw ? (JSON.parse(raw) as Catalog) : null
    } catch {
      return null
    }
  },
  save: async (catalog) => {
    const store = await blobStore()
    if (!store) return
    try {
      await store.setJSON('catalog.json', catalog)
    } catch {
      // transient Blobs error — memory and file already hold this copy.
    }
  },
}

const backends: Array<Backend> = [memory, file, blob]

/** Fire-and-forget. Sets the in-memory copy synchronously, then flushes the
 *  slower backends without blocking the response. */
export function persist(catalog: Catalog): void {
  lastGood = catalog
  for (const backend of backends) {
    void backend.save(catalog).catch(() => undefined)
  }
}

/** First backend holding a usable copy wins. Stamps `source: 'cache'` so the
 *  page and /purge can say the data is a saved copy, not live. */
export async function recall(): Promise<Catalog | null> {
  for (const backend of backends) {
    const hit = await backend.load()
    if (hit && Array.isArray(hit.lokasi) && hit.lokasi.length > 0) {
      return { ...hit, source: 'cache' }
    }
  }
  return null
}

/** Test seam: drop the in-memory copy. */
export function __resetStore(): void {
  lastGood = null
}
