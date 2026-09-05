import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Check, MessageCircle, Ruler } from 'lucide-react'
import { ContactSection } from '#/components/contact-section'
import { Photo } from '#/components/photo'
import { RoomMap } from '#/components/room-map'
import { SiteFooter } from '#/components/site-footer'
import { SiteHeader } from '#/components/site-header'
import { Button } from '#/components/ui/button'
import { loadCatalog } from '#/lib/catalog'
import { formatRupiah } from '#/lib/format'
import { sheetCacheHeaders } from '#/lib/http'
import { activeLokasi, findLokasi, findRoomType, roomsFor } from '#/lib/select'
import { waLinkForType } from '#/lib/wa'

export const Route = createFileRoute('/locations/$slug/type/$type')({
  loader: () => loadCatalog(),
  headers: () => sheetCacheHeaders,
  head: ({ loaderData, params }) => {
    const brand = loaderData?.config.brand ?? 'Kozy'
    const lokasi = loaderData ? findLokasi(loaderData, params.slug) : undefined
    const tipe = loaderData
      ? findRoomType(loaderData, params.slug, params.type)
      : undefined
    if (!lokasi || !tipe)
      return { meta: [{ title: `Room type not found | ${brand}` }] }

    const title = `${tipe.nama} rooms at ${lokasi.nama}`
    const description = `${tipe.kosong} of ${tipe.rooms.length} ${tipe.nama} rooms available. ${tipe.luasMin} m², from ${formatRupiah(tipe.hargaMin)} per month at ${lokasi.alamat}.`

    return {
      meta: [
        { title: `${title} | ${brand}` },
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        ...(tipe.foto
          ? [{ property: 'og:image' as const, content: tipe.foto }]
          : []),
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    }
  },
  component: TipeDetail,
})

function TipeDetail() {
  const catalog = Route.useLoaderData()
  const params = Route.useParams()
  const lokasi = findLokasi(catalog, params.slug)
  const tipe = lokasi
    ? findRoomType(catalog, lokasi.slug, params.type)
    : undefined

  if (!lokasi || !tipe) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <SiteHeader brand={catalog.config.brand} />
        <main
          id="konten"
          className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-24 text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight">
            Room type not found
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            This type may have been switched off. Have a look at the types
            available now.
          </p>
          <Button asChild className="mx-auto mt-8 h-11 px-6">
            <Link to="/">See locations</Link>
          </Button>
        </main>
        <SiteFooter config={catalog.config} lokasi={activeLokasi(catalog)} />
      </div>
    )
  }

  const rooms = roomsFor(catalog, lokasi.slug)
  const waNumber = lokasi.nomor_wa || catalog.config.wa_default
  const luas =
    tipe.luasMin === tipe.luasMax
      ? `${tipe.luasMin}`
      : `${tipe.luasMin}-${tipe.luasMax}`

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader brand={catalog.config.brand} />

      <main id="konten" className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
          <Link
            to="/locations/$slug"
            params={{ slug: lokasi.slug }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {lokasi.nama}
          </Link>
        </div>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-6 pb-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div className="overflow-hidden rounded-xl border border-border lg:order-2">
            <Photo
              src={tipe.foto}
              alt={`${tipe.nama} room at ${lokasi.nama}`}
              width={1200}
              priority
              className="aspect-[4/3] w-full"
            />
          </div>

          <div className="lg:order-1">
            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {tipe.nama}
            </h1>
            <p className="mt-3 text-muted-foreground">{lokasi.nama}</p>

            <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5">
              <div>
                <dt className="text-xs text-muted-foreground">Price</dt>
                <dd className="num mt-0.5 text-2xl font-bold">
                  {tipe.hargaMin === tipe.hargaMax
                    ? formatRupiah(tipe.hargaMin)
                    : `${formatRupiah(tipe.hargaMin)}+`}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                    per month
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Size</dt>
                <dd className="num mt-0.5 flex items-center gap-1.5 text-2xl font-bold">
                  <Ruler className="size-5 text-muted-foreground" aria-hidden />
                  {luas} m²
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Available</dt>
                <dd className="num mt-0.5 text-2xl font-bold text-status-kosong">
                  {tipe.kosong}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                    of {tipe.rooms.length}
                  </span>
                </dd>
              </div>
            </dl>

            {tipe.fasilitas.length > 0 ? (
              <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {tipe.fasilitas.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}

            <Button
              asChild
              size="lg"
              className="mt-8 h-12 gap-2 px-7 text-base"
            >
              <a
                href={waLinkForType(lokasi, tipe, catalog.config.wa_default)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-5" aria-hidden />
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Where {tipe.nama} rooms are
          </h2>
          <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
            Other room types are dimmed so this one stands out. Tap an available
            room to open WhatsApp.
          </p>
          <div className="mt-6">
            <RoomMap
              rooms={rooms}
              lokasi={lokasi}
              fallbackNumber={catalog.config.wa_default}
              highlight={tipe.slug}
            />
          </div>
        </section>
      </main>

      <ContactSection
        waNumber={waNumber}
        context={`${tipe.nama} rooms at ${lokasi.nama}`}
      />
      <SiteFooter config={catalog.config} lokasi={activeLokasi(catalog)} />
    </div>
  )
}
