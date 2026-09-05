import { Link, createFileRoute } from '@tanstack/react-router'
import { ContactSection } from '#/components/contact-section'
import { LocationCard } from '#/components/location-card'
import { Photo } from '#/components/photo'
import { SiteFooter } from '#/components/site-footer'
import { SiteHeader } from '#/components/site-header'
import { Button } from '#/components/ui/button'
import { loadCatalog } from '#/lib/catalog'
import { formatRupiah } from '#/lib/format'
import { sheetCacheHeaders } from '#/lib/http'
import { activeLokasi } from '#/lib/select'

export const Route = createFileRoute('/')({
  loader: () => loadCatalog(),
  headers: () => sheetCacheHeaders,
  head: ({ loaderData }) => {
    const brand = loaderData?.config.brand ?? 'Kozy'
    const description =
      loaderData?.config.tagline ??
      'Every room and its current availability, updated straight from a Google Sheet.'
    return {
      meta: [
        { title: `${brand} | Room catalogue` },
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: brand },
        { property: 'og:description', content: description },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    }
  },
  component: Home,
})

function Home() {
  const catalog = Route.useLoaderData()
  const lokasi = activeLokasi(catalog)
  const single = lokasi.length === 1

  const totalKosong = lokasi.reduce((sum, item) => sum + item.kamarKosong, 0)
  const prices = lokasi
    .map((item) => item.hargaMulai)
    .filter((price) => price > 0)
  const hargaTerendah = prices.length > 0 ? Math.min(...prices) : 0
  const heroPhoto =
    lokasi.find((item) => item.foto_urls.length > 0)?.foto_urls[0] ?? ''

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader brand={catalog.config.brand} />

      <main id="konten" className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-10 pb-14 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pt-24">
          <div>
            <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {catalog.config.brand}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {catalog.config.tagline}
            </p>
            <div className="mt-8">
              {single && lokasi[0] ? (
                <Button asChild size="lg" className="h-12 px-7 text-base">
                  <Link to="/locations/$slug" params={{ slug: lokasi[0].slug }}>
                    View rooms
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="h-12 px-7 text-base">
                  <a href="#locations">See locations</a>
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Photo
              src={heroPhoto}
              alt={`${lokasi[0]?.nama ?? catalog.config.brand} building`}
              width={1400}
              priority
              className="aspect-[4/3] w-full lg:aspect-[5/4]"
            />
          </div>
        </section>

        <section
          aria-label="Availability summary"
          className="border-y border-border bg-card"
        >
          <dl className="mx-auto grid w-full max-w-6xl grid-cols-3 divide-x divide-border px-4 sm:px-6">
            <Stat label="Locations" value={String(lokasi.length)} />
            <Stat label="Rooms available" value={String(totalKosong)} accent />
            <Stat label="From" value={formatRupiah(hargaTerendah)} />
          </dl>
        </section>

        <section
          id="locations"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {single ? 'Location' : 'Choose a location'}
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
            The WhatsApp number can differ per location. Every chat button on
            the site already points at the right one.
          </p>

          {lokasi.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              No location data yet. Please try again in a moment.
            </p>
          ) : (
            <div
              className={single ? 'mt-10' : 'mt-10 grid gap-5 md:grid-cols-2'}
            >
              {lokasi.map((item) => (
                <LocationCard key={item.slug} lokasi={item} wide={single} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <ol className="mt-10 max-w-2xl">
            {steps.map((step) => (
              <li
                key={step.title}
                className="border-t border-border py-7 last:border-b"
              >
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <ContactSection waNumber={catalog.config.wa_default} />
      <SiteFooter config={catalog.config} lokasi={lokasi} />
    </div>
  )
}

const steps = [
  {
    title: 'Open a location page',
    body: 'The address, shared facilities, the map, and the room map all sit on one page.',
  },
  {
    title: 'Read the room map',
    body: 'Each room is coloured by state: available, reserved, or occupied.',
  },
  {
    title: 'Tap an available room',
    body: 'WhatsApp opens with the room code, its type, and its price already written in the message.',
  },
]

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="px-2 py-6 text-center sm:py-8">
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd
        className={`num mt-1 text-base font-bold tracking-tight sm:text-2xl ${
          accent ? 'text-status-kosong' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
