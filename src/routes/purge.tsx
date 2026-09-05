import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { purgeSheetCache } from '#/lib/catalog'

/** Bookmarked by the owner and opened from a phone right after they edit the
 *  Sheet, so the page answers in words, not JSON. */
export const Route = createFileRoute('/purge')({
  validateSearch: z.object({ secret: z.string().default('') }),
  loaderDeps: ({ search }) => ({ secret: search.secret }),
  loader: ({ deps }) => purgeSheetCache({ data: { secret: deps.secret } }),
  headers: () => ({
    'Cache-Control': 'no-store',
    'Netlify-CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex',
  }),
  head: () => ({
    meta: [
      { title: 'Refresh the website' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: Purge,
})

function Purge() {
  const result = Route.useLoaderData()
  const Icon = result.ok ? CheckCircle2 : AlertTriangle

  return (
    <main
      id="konten"
      className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-4 py-16"
    >
      <div className="rounded-xl border border-border bg-card p-7 sm:p-9">
        <Icon
          className={`size-9 ${result.ok ? 'text-status-kosong' : 'text-status-dibooking'}`}
          aria-hidden
        />
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {result.message}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {result.detail}
        </p>

        {result.diagnostics ? (
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Data source</dt>
              <dd className="mt-0.5 font-semibold">
                {result.diagnostics.source === 'sheet'
                  ? 'Google Sheet'
                  : 'Committed snapshot'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Read</dt>
              <dd className="num mt-0.5 font-semibold">
                {result.diagnostics.lokasi} locations,{' '}
                {result.diagnostics.kamar} rooms
              </dd>
            </div>
          </dl>
        ) : null}

        {result.diagnostics && result.diagnostics.skipped.length > 0 ? (
          <div className="mt-6 rounded-lg bg-status-dibooking-surface p-4">
            <p className="text-sm font-semibold text-status-dibooking">
              These rows were skipped because their data is incomplete
            </p>
            <ul className="mt-2 space-y-1 text-sm text-status-dibooking">
              {result.diagnostics.skipped.slice(0, 8).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button asChild className="mt-8 h-11 w-full">
          <Link to="/">Open the website</Link>
        </Button>
      </div>
    </main>
  )
}
