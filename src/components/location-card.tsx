import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { Photo } from '#/components/photo'
import { formatRupiah } from '#/lib/format'
import { cn } from '#/lib/utils'
import type { LokasiSummary } from '#/lib/select'

/** `wide` is for the single-location case, where a half-width card in an empty
 *  grid looks like a layout bug. It goes landscape and fills the row instead. */
export function LocationCard({
  lokasi,
  wide = false,
}: {
  lokasi: LokasiSummary
  wide?: boolean
}) {
  const available = lokasi.kamarKosong > 0

  return (
    <Link
      to="/locations/$slug"
      params={{ slug: lokasi.slug }}
      className={cn(
        'card-soft card-soft-hover group relative flex flex-col overflow-hidden rounded-xl bg-card',
        'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.99]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        wide && 'md:flex-row',
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden',
          wide ? 'md:w-1/2' : '',
        )}
      >
        <Photo
          src={lokasi.foto_urls[0] ?? ''}
          alt={`${lokasi.nama} building`}
          width={wide ? 1200 : 900}
          priority
          className={cn(
            'h-52 w-full sm:h-60',
            wide && 'md:h-full md:min-h-[19rem]',
          )}
        />
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col gap-4 p-5 sm:p-6',
          wide && 'md:justify-center',
        )}
      >
        <div>
          <h3
            className={cn(
              'font-bold tracking-tight',
              wide ? 'text-2xl sm:text-3xl' : 'text-xl',
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
            <dt className="text-xs text-muted-foreground">Mulai</dt>
            <dd className="num mt-0.5 text-lg font-bold">
              {formatRupiah(lokasi.hargaMulai)}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                /bulan
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tersedia</dt>
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
