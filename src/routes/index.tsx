import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { CatalogUnavailable } from '#/components/catalog-unavailable'
import { ContactSection } from '#/components/contact-section'
import { LocationCard } from '#/components/location-card'
import { Photo } from '#/components/photo'
import { SiteFooter } from '#/components/site-footer'
import { SiteHeader } from '#/components/site-header'
import { Button } from '#/components/ui/button'
import { loadCatalog } from '#/lib/catalog'
import { formatRupiah } from '#/lib/format'
import { noStoreHeaders, sheetCacheHeaders } from '#/lib/http'
import { activeLokasi } from '#/lib/select'

export const Route = createFileRoute('/')({
  loader: () => loadCatalog(),
  headers: ({ loaderData }) =>
    loaderData == null ? noStoreHeaders : sheetCacheHeaders,
  head: ({ loaderData }) => {
    const brand = loaderData?.config.brand ?? 'Kozy'
    const description =
      loaderData?.config.tagline ??
      'Setiap kamar dan status ketersediaannya, diperbarui langsung dari Google Sheet.'
    return {
      meta: [
        { title: `${brand} | Katalog kamar kos` },
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
  if (!catalog) return <CatalogUnavailable />

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
            <h1 className="reveal text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {catalog.config.brand}
            </h1>
            <p className="reveal mt-5 max-w-lg text-base leading-relaxed text-muted-foreground [animation-delay:80ms] sm:text-lg">
              {catalog.config.tagline}
            </p>
            <div className="reveal mt-8 [animation-delay:160ms]">
              {single && lokasi[0] ? (
                <Button
                  asChild
                  size="lg"
                  className="group h-12 gap-2 px-7 text-base transition-transform active:scale-[0.98]"
                >
                  <Link to="/locations/$slug" params={{ slug: lokasi[0].slug }}>
                    Lihat kamar
                    <ArrowRight className="cta-arrow size-5" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="group h-12 gap-2 px-7 text-base transition-transform active:scale-[0.98]"
                >
                  <a href="#locations">
                    Lihat lokasi
                    <ArrowRight className="cta-arrow size-5" aria-hidden />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="reveal overflow-hidden rounded-xl [animation-delay:120ms]">
            <Photo
              src={heroPhoto}
              alt={`Bangunan ${lokasi[0]?.nama ?? catalog.config.brand}`}
              width={1400}
              priority
              className="aspect-[4/3] w-full lg:aspect-[5/4]"
            />
          </div>
        </section>

        <section aria-label="Ringkasan ketersediaan" className="bg-card">
          <dl className="mx-auto grid w-full max-w-6xl grid-cols-3 divide-x divide-border/60 px-4 sm:px-6">
            <Stat label="Lokasi" value={String(lokasi.length)} />
            <Stat label="Kamar tersedia" value={String(totalKosong)} accent />
            <Stat label="Mulai" value={formatRupiah(hargaTerendah)} />
          </dl>
        </section>

        <section
          id="locations"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {single ? 'Lokasi' : 'Pilih lokasi'}
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
            Nomor WhatsApp bisa berbeda tiap lokasi. Semua tombol chat di situs
            ini sudah mengarah ke nomor yang tepat.
          </p>

          {lokasi.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              Belum ada data lokasi. Silakan coba lagi sebentar.
            </p>
          ) : (
            <div
              className={
                single
                  ? 'reveal mt-10'
                  : 'reveal mt-10 grid gap-5 md:grid-cols-2'
              }
            >
              {lokasi.map((item) => (
                <LocationCard key={item.slug} lokasi={item} wide={single} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cara kerjanya
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
    title: 'Buka halaman lokasi',
    body: 'Alamat, fasilitas bersama, peta, dan denah kamar semua ada di satu halaman.',
  },
  {
    title: 'Baca denah kamar',
    body: 'Tiap kamar diberi warna sesuai status: tersedia, dibooking, atau terisi.',
  },
  {
    title: 'Ketuk kamar yang tersedia',
    body: 'WhatsApp terbuka dengan kode kamar, tipe, dan harganya sudah tertulis di pesan.',
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
