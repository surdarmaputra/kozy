import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { clearCatalogCache, getCatalog } from './sheet'

/** Every page reads through this. The handler body is stripped from the client
 *  bundle, so the Sheet URL and the seed data never ship to the browser.
 *  Resolves to null when the Sheet is unreachable and no copy has been saved. */
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
    source: 'sheet' | 'seed' | 'cache'
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
        message: 'Fitur perbarui belum diaktifkan',
        detail:
          'Variabel PURGE_SECRET masih kosong di Netlify. Minta developer mengisinya sekali, setelah itu halaman ini berfungsi.',
      }
    }

    if (data.secret !== expected) {
      return {
        ok: false,
        message: 'Secret salah',
        detail:
          'Buka lagi dari bookmark yang diberikan saat serah terima, jangan diketik manual.',
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

    if (!catalog) {
      return {
        ok: true,
        message: 'Cache dibersihkan, tetapi Sheet tidak bisa dibaca',
        detail:
          'Pembersihan berhasil. Belum ada salinan tersimpan sebagai cadangan, jadi pengunjung sementara melihat halaman tidak tersedia. Periksa lagi File > Share > Anyone with the link, Viewer, lalu buka tautan ini sekali lagi.',
      }
    }

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
        detail: `Tidak ada cache CDN yang terjangkau di lingkungan ini (${cdnError}).`,
        diagnostics,
      }
    }

    return {
      ok: true,
      message: 'Website sudah diperbarui',
      detail:
        'Buka halaman lokasi lalu tarik ke bawah untuk menyegarkan. Perubahannya langsung terlihat.',
      diagnostics,
    }
  })
