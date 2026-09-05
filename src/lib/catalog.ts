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
        message: 'Purge is not switched on yet',
        detail:
          'The PURGE_SECRET variable is empty on Netlify. Ask a developer to set it once and this page works from then on.',
      }
    }

    if (data.secret !== expected) {
      return {
        ok: false,
        message: 'Wrong secret',
        detail:
          'Open it again from the bookmark you were given at handover rather than typing it by hand.',
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
        message: 'Local cache cleared',
        detail: `No CDN cache is reachable in this environment (${cdnError}).`,
        diagnostics,
      }
    }

    return {
      ok: true,
      message: 'The website is up to date',
      detail:
        'Open a location page and pull down to refresh. The change is visible straight away.',
      diagnostics,
    }
  })
