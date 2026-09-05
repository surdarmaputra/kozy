import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { clearCatalogCache, getCatalog } from './sheet'

/** Every page reads through this. The handler body is stripped from the client
 *  bundle, so the Sheet URL and the snapshot never ship to the browser. */
export const loadCatalog = createServerFn({ method: 'GET' }).handler(() =>
  getCatalog(),
)

export type PurgeResult = {
  ok: boolean
  message: string
  detail: string
  /** Filled in after a successful purge so the client can confirm the Sheet was
   *  actually read, and see which rows were dropped, without calling anyone. */
  diagnostics?: {
    source: 'sheet' | 'snapshot'
    lokasi: number
    kamar: number
    skipped: Array<string>
  }
}

export const purgeSheetCache = createServerFn({ method: 'GET' })
  .validator(z.object({ secret: z.string().default('') }))
  .handler(async ({ data }): Promise<PurgeResult> => {
    const expected = process.env.PURGE_SECRET ?? ''

    if (!expected) {
      return {
        ok: false,
        message: 'Purge belum aktif',
        detail:
          'Variabel PURGE_SECRET belum diisi di Netlify. Minta developer mengisinya sekali, setelah itu tombol ini bekerja selamanya.',
      }
    }

    if (data.secret !== expected) {
      return {
        ok: false,
        message: 'Kode rahasia salah',
        detail:
          'Buka lagi lewat bookmark yang diberikan saat handover, jangan diketik manual.',
      }
    }

    clearCatalogCache()

    let cdnError = ''
    try {
      const { purgeCache } = await import('@netlify/functions')
      await purgeCache({ tags: ['sheet'] })
    } catch (error) {
      // Local dev has no Netlify cache to purge. The in-process cache above is
      // already cleared, which is the whole job outside production.
      cdnError = error instanceof Error ? error.message : String(error)
    }

    // Re-read straight away so the page can report what the Sheet actually
    // returned, not just that a cache was dropped.
    const catalog = await getCatalog()
    const diagnostics = {
      source: catalog.source,
      lokasi: catalog.lokasi.filter((item) => item.aktif).length,
      kamar: catalog.kamar.filter((item) => item.aktif).length,
      skipped: catalog.skipped,
    }

    if (cdnError) {
      return {
        ok: true,
        message: 'Cache lokal dibersihkan',
        detail: `Cache CDN tidak tersedia di lingkungan ini (${cdnError}).`,
        diagnostics,
      }
    }

    return {
      ok: true,
      message: 'Website sudah diperbarui',
      detail:
        'Buka halaman lokasi dan tarik ke bawah untuk refresh. Perubahan langsung terlihat.',
      diagnostics,
    }
  })
