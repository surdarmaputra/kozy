/** Netlify keeps the rendered HTML for 60 seconds and will serve it stale for a
 *  day while it revalidates, so a slow or broken Sheet never reaches a visitor.
 *  The tag is what `/purge` invalidates when the client wants it live now. */
export const sheetCacheHeaders = {
  'Netlify-CDN-Cache-Control': 's-maxage=60, stale-while-revalidate=86400',
  'Netlify-Cache-Tag': 'sheet',
  'Cache-Control': 'public, max-age=0, must-revalidate',
}

/** For the unavailable page: never cache it, so a visitor sees real data the
 *  moment the Sheet comes back rather than a stale error for up to a minute. */
export const noStoreHeaders = {
  'Netlify-CDN-Cache-Control': 'no-store',
  'Cache-Control': 'no-store',
}
