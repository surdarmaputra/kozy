import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { Photo } from '#/components/photo'
import { formatRupiah } from '#/lib/format'
import { cn } from '#/lib/utils'
import type { LokasiSummary } from '#/lib/select'

/** The first location gets the wide tile. It is the entry point most visitors
 *  tap, so it carries the landscape photo and the roomier type. */
export function LocationCard({
  lokasi,
  featured = false,
}: {
  lokasi: LokasiSummary
  featured?: boolean
}) {
  const available = lokasi.kamarKosong > 0

  return (
    <Link
      to="/lokasi/$slug"
      params={{ slug: lokasi.slug }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card',
        'transition-[transform,border-color] duration-200 hover:border-primary/45 active:scale-[0.99]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        featured && 'md:col-span-2 md:flex-row',
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden',
          featured ? 'md:w-1/2' : '',
        )}
      >
        <Photo
          src={lokasi.foto_urls[0] ?? ''}
          alt={`Suasana ${lokasi.nama}`}
          width={featured ? 1200 : 800}
          priority={featured}
          className={cn(
            'h-52 w-full sm:h-60',
            featured && 'md:h-full md:min-h-[19rem]',
          )}
        />
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col gap-4 p-5 sm:p-6',
          featured && 'md:justify-center',
        )}
      >
        <div>
          <h3
            className={cn(
              'font-bold tracking-tight',
              featured ? 'text-2xl sm:text-3xl' : 'text-xl',
            )}
          >
            {lokasi.nama}
          </h3>
          <p className="mt-2 flex items-start gap-1.5 text-sm leading-relaxed text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {lokasi.alamat}
          </p>
        </div>

        <dl className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <dt className="text-xs text-muted-foreground">Mulai dari</dt>
            <dd className="num mt-0.5 text-lg font-bold">
              {formatRupiah(lokasi.hargaMulai)}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                /bulan
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Kamar kosong</dt>
            <dd
              className={cn(
                'num mt-0.5 text-lg font-bold',
                available ? 'text-status-kosong' : 'text-muted-foreground',
              )}
            >
              {lokasi.kamarKosong}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                dari {lokasi.kamarTotal}
              </span>
            </dd>
          </div>
        </dl>

        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Lihat kamar
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  )
}
