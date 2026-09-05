import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Check, MapPin, MessageCircle } from 'lucide-react'
import { Photo } from '#/components/photo'
import { RoomBoard } from '#/components/room-board'
import { SiteFooter } from '#/components/site-footer'
import { SiteHeader } from '#/components/site-header'
import { Button } from '#/components/ui/button'
import { loadCatalog } from '#/lib/catalog'
import { formatRupiah } from '#/lib/format'
import { sheetCacheHeaders } from '#/lib/http'
import { activeLokasi, findLokasi, roomsFor } from '#/lib/select'
import { waLinkForLokasi } from '#/lib/wa'

export const Route = createFileRoute('/lokasi/$slug')({
  loader: () => loadCatalog(),
  headers: () => sheetCacheHeaders,
  head: ({ loaderData, params }) => {
    const lokasi = loaderData ? findLokasi(loaderData, params.slug) : undefined
    const brand = loaderData?.config.brand ?? 'Kozy'
    if (!lokasi)
      return { meta: [{ title: `Lokasi tidak ditemukan | ${brand}` }] }

    const rooms = loaderData ? roomsFor(loaderData, lokasi.slug) : []
    const kosong = rooms.filter((room) => room.status === 'kosong').length
    const title = `${lokasi.nama} | Kos dekat ${lokasi.alamat.split(',')[0]}`
    const description = `${kosong} kamar kosong di ${lokasi.nama}, ${lokasi.alamat}. Lihat harga, luas, dan fasilitas tiap kamar lalu chat langsung lewat WhatsApp.`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        ...(lokasi.foto_urls[0]
          ? [{ property: 'og:image' as const, content: lokasi.foto_urls[0] }]
          : []),
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    }
  },
  component: LokasiDetail,
})

function LokasiDetail() {
  const catalog = Route.useLoaderData()
  const { slug } = Route.useParams()
  const lokasi = findLokasi(catalog, slug)

  if (!lokasi) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <SiteHeader
          brand={catalog.config.brand}
          waNumber={catalog.config.wa_default}
        />
        <main
          id="konten"
          className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-24 text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight">
            Lokasi tidak ditemukan
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Halaman ini mungkin sudah dinonaktifkan. Lihat daftar lokasi yang
            sedang menerima penyewa.
          </p>
          <Button asChild className="mx-auto mt-8 h-11 px-6">
            <Link to="/">Lihat lokasi</Link>
          </Button>
        </main>
        <SiteFooter config={catalog.config} lokasi={activeLokasi(catalog)} />
      </div>
    )
  }

  const rooms = roomsFor(catalog, lokasi.slug)
  const available = rooms.filter((room) => room.status === 'kosong')
  const hargaMulai = Math.min(
    ...(available.length > 0 ? available : rooms)
      .map((room) => room.harga_bulanan)
      .filter(Boolean),
  )
  const waLink = waLinkForLokasi(lokasi, catalog.config.wa_default)
  const gallery = lokasi.foto_urls.slice(0, 3)

  return (
    <div className="flex min-h-[100dvh] flex-col pb-24 sm:pb-0">
      <SiteHeader
        brand={catalog.config.brand}
        waNumber={catalog.config.wa_default}
      />

      <main id="konten" className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Semua lokasi
          </Link>
        </div>

        <section className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                {lokasi.nama}
              </h1>
              <p className="mt-3 flex items-start gap-2 leading-relaxed text-muted-foreground">
                <MapPin className="mt-1 size-4 shrink-0" aria-hidden />
                {lokasi.alamat}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
              <p className="hidden text-sm text-muted-foreground sm:block">
                <span className="num block text-2xl font-bold text-foreground">
                  {formatRupiah(Number.isFinite(hargaMulai) ? hargaMulai : 0)}
                </span>
                mulai per bulan
              </p>
              <Button
                asChild
                size="lg"
                className="hidden h-12 gap-2 px-6 text-base sm:inline-flex"
              >
                <a href={waLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-5" aria-hidden />
                  Chat WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {gallery.length > 0 ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="overflow-hidden rounded-xl border border-border sm:col-span-2">
                <Photo
                  src={gallery[0]}
                  alt={`Bangunan ${lokasi.nama}`}
                  width={1400}
                  priority
                  className="aspect-[16/10] w-full"
                />
              </div>
              {gallery.length > 1 ? (
                <div className="hidden gap-3 sm:grid sm:grid-rows-2">
                  {gallery.slice(1).map((photo, index) => (
                    <div
                      key={photo}
                      className="overflow-hidden rounded-xl border border-border"
                    >
                      <Photo
                        src={photo}
                        alt={`Fasilitas ${lokasi.nama} ${index + 1}`}
                        width={700}
                        className="aspect-[16/10] w-full sm:h-full"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr] md:gap-14">
          {lokasi.deskripsi ? (
            <p className="max-w-[65ch] text-lg leading-relaxed">
              {lokasi.deskripsi}
            </p>
          ) : (
            <div />
          )}

          {lokasi.fasilitas.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground">
                Fasilitas bersama
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 md:grid-cols-1">
                {lokasi.fasilitas.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <RoomBoard
            rooms={rooms}
            lokasi={lokasi}
            fallbackNumber={catalog.config.wa_default}
          />
        </section>

        {lokasi.lat !== 0 && lokasi.lng !== 0 ? (
          <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Lokasi di peta
            </h2>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <iframe
                title={`Peta ${lokasi.nama}`}
                src={`https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full border-0 sm:h-[420px]"
              />
            </div>
            {lokasi.gmaps_url ? (
              <a
                href={lokasi.gmaps_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Buka rute di Google Maps
              </a>
            ) : null}
          </section>
        ) : null}
      </main>

      {/* Most visitors arrive on a phone and decide while scrolling the room
          grid. The bar keeps the one action they came for within thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            <span className="num block truncate text-base font-bold text-foreground">
              {formatRupiah(Number.isFinite(hargaMulai) ? hargaMulai : 0)}
            </span>
            <span className="num">{available.length}</span> kamar kosong
          </p>
          <Button asChild size="lg" className="h-11 shrink-0 gap-2">
            <a href={waLink} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden />
              Chat WhatsApp
            </a>
          </Button>
        </div>
      </div>

      <SiteFooter config={catalog.config} lokasi={activeLokasi(catalog)} />
    </div>
  )
}
