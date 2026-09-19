import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lokasiSchema, parseRows } from '../schema'
import { clearCatalogCache, getCatalog } from '../sheet'
import { __resetStore } from '../store'
import type { Catalog } from '../schema'

function savedCatalog(): Catalog {
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
  }
}

const ENV_KEYS = ['SHEET_ID', 'CACHE_DIR', 'VERCEL'] as const

describe('getCatalog', () => {
  let dir: string
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kozy-sheet-'))
    saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
    for (const key of ENV_KEYS) delete process.env[key]
    process.env.CACHE_DIR = dir
    clearCatalogCache()
    __resetStore()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
    vi.unstubAllGlobals()
    clearCatalogCache()
    __resetStore()
  })

  it('renders the committed seed when SHEET_ID is unset', async () => {
    const catalog = await getCatalog()
    expect(catalog?.source).toBe('seed')
    expect(catalog?.lokasi.length ?? 0).toBeGreaterThan(0)
  })

  it('returns null when the Sheet fails and nothing has been saved', async () => {
    process.env.SHEET_ID = 'broken'
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    )
    expect(await getCatalog()).toBeNull()
  })

  it('serves the last saved copy while the Sheet is unreachable', async () => {
    process.env.SHEET_ID = 'broken'
    writeFileSync(join(dir, 'catalog.json'), JSON.stringify(savedCatalog()))
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    )
    const catalog = await getCatalog()
    expect(catalog?.source).toBe('cache')
    expect(catalog?.lokasi[0].slug).toBe('seturan')
  })
})
