/** Persists the last catalogue we read successfully so a Sheet outage serves
 *  that copy instead of nothing. Two backends, tried in order: in-process
 *  memory, then a local file (`CACHE_DIR`). Both fail soft: a broken write or
 *  read degrades to the next one, never throws on the request path.
 *
 *  Neither survives a cold instance, which is what the build-time snapshot in
 *  `sheet.ts` covers.
 *
 *  Server only. Imported by `sheet.ts`, never by a component. */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Catalog } from './schema'

type Backend = {
  name: 'memory' | 'file'
  load: () => Promise<Catalog | null>
  save: (catalog: Catalog) => Promise<void>
}

// Vercel's filesystem is read-only apart from /tmp, which survives warm
// invocations of the same instance but not a cold one.
const cacheDir = () =>
  process.env.CACHE_DIR ?? (process.env.VERCEL ? '/tmp/kozy-cache' : '.cache')
const catalogFile = () => join(cacheDir(), 'catalog.json')

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

const backends: Array<Backend> = [memory, file]

let flushing: Promise<unknown> = Promise.resolve()

/** Fire-and-forget. Sets the in-memory copy synchronously, then flushes the
 *  slower backends without blocking the response. */
export function persist(catalog: Catalog): void {
  lastGood = catalog
  flushing = Promise.all(
    backends.map((backend) => backend.save(catalog).catch(() => undefined)),
  )
}

/** First backend holding a usable copy wins. Stamps `source: 'cache'` so the
 *  page and /purge can say the data is a saved copy, not live. */
export async function recall(): Promise<Catalog | null> {
  for (const backend of backends) {
    const hit = await backend.load()
    if (hit && Array.isArray(hit.lokasi) && hit.lokasi.length > 0) {
      // A copy saved before the `denah` tab existed has no such key.
      return { ...hit, denah: hit.denah ?? [], source: 'cache' }
    }
  }
  return null
}

/** Test seam: drop the in-memory copy. */
export function __resetStore(): void {
  lastGood = null
}

/** Test seam: settle writes still in flight, so one test's `persist` cannot
 *  land in the next test's `CACHE_DIR`. */
export async function __flushStore(): Promise<void> {
  await flushing
}
