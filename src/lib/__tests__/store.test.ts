import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lokasiSchema, parseRows } from '../schema'
import { __resetStore, persist, recall } from '../store'
import type { Catalog } from '../schema'

function fixture(overrides: Partial<Catalog> = {}): Catalog {
  return {
    config: { brand: 'Kozy', tagline: '', wa_default: '', alamat_kantor: '' },
    lokasi: parseRows(
      lokasiSchema,
      [{ slug: 'seturan', nama: 'Kozy Seturan', aktif: 'TRUE' }],
      'lokasi',
      [],
    ),
    kamar: [],
    denah: [],
    source: 'sheet',
    fetchedAt: '2026-01-01T00:00:00.000Z',
    skipped: [],
    ...overrides,
  }
}

async function waitFor(predicate: () => boolean, ms = 1000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('condition not met in time')
}

const ENV_KEYS = ['CACHE_DIR', 'NETLIFY', 'NETLIFY_DEPLOYMENT'] as const

describe('store', () => {
  let dir: string
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kozy-store-'))
    saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
    for (const key of ENV_KEYS) delete process.env[key]
    process.env.CACHE_DIR = dir
    __resetStore()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
    __resetStore()
  })

  it('recall returns the persisted catalogue, stamped as a saved copy', async () => {
    persist(fixture())
    const hit = await recall()
    expect(hit?.source).toBe('cache')
    expect(hit?.lokasi[0].slug).toBe('seturan')
  })

  it('recall reads the cache file an earlier run left behind', async () => {
    writeFileSync(join(dir, 'catalog.json'), JSON.stringify(fixture()))
    const hit = await recall()
    expect(hit?.source).toBe('cache')
    expect(hit?.kamar).toEqual([])
  })

  it('recall defaults denah to [] for a copy saved before the tab existed', async () => {
    const { denah: _drop, ...preDenah } = fixture()
    writeFileSync(join(dir, 'catalog.json'), JSON.stringify(preDenah))
    const hit = await recall()
    expect(hit?.denah).toEqual([])
  })

  it('persist writes a cache file a cold instance can recover from', async () => {
    persist(fixture())
    await waitFor(() => existsSync(join(dir, 'catalog.json')))
    __resetStore()
    expect((await recall())?.source).toBe('cache')
  })

  it('recall returns null when nothing has been saved', async () => {
    expect(await recall()).toBeNull()
  })

  it('recall rejects a saved copy that has no locations', async () => {
    writeFileSync(
      join(dir, 'catalog.json'),
      JSON.stringify(fixture({ lokasi: [] })),
    )
    expect(await recall()).toBeNull()
  })

  it('recall ignores a corrupt cache file', async () => {
    writeFileSync(join(dir, 'catalog.json'), '{ not json')
    expect(await recall()).toBeNull()
  })

  it('persist degrades silently when the cache dir cannot be written', async () => {
    writeFileSync(join(dir, 'blocked'), 'x')
    process.env.CACHE_DIR = join(dir, 'blocked', 'nested')
    expect(() => persist(fixture())).not.toThrow()
    // the in-memory copy is still there
    expect((await recall())?.source).toBe('cache')
  })
})
