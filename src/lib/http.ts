/** Netlify keeps the rendered HTML for 5 minutes and will serve it stale for a
 *  day while it revalidates, so a slow or broken Sheet never reaches a visitor.
 *  The tag is what `/purge` invalidates when the client wants it live now. */
export const sheetCacheHeaders = {
  'Netlify-CDN-Cache-Control': 's-maxage=300, stale-while-revalidate=86400',
  'Netlify-Cache-Tag': 'sheet',
  'Cache-Control': 'public, max-age=0, must-revalidate',
}
