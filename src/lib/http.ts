/** Vercel's edge keeps the rendered HTML for 60 seconds and will serve it stale
 *  for a day while it revalidates, so a slow or broken Sheet never reaches a
 *  visitor. `/purge` clears the server-side cache; the edge copy ages out on its
 *  own within the minute. */
export const sheetCacheHeaders = {
  'Vercel-CDN-Cache-Control': 'max-age=60, stale-while-revalidate=86400',
  'Cache-Control': 'public, max-age=0, must-revalidate',
}

/** For the unavailable page: never cache it, so a visitor sees real data the
 *  moment the Sheet comes back rather than a stale error for up to a minute. */
export const noStoreHeaders = {
  'Vercel-CDN-Cache-Control': 'no-store',
  'Cache-Control': 'no-store',
}
