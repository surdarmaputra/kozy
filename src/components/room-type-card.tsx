import { Link } from '@tanstack/react-router'
import { MessageCircle, Ruler } from 'lucide-react'
import { Photo } from '#/components/photo'
import { Button } from '#/components/ui/button'
import { formatRupiah } from '#/lib/format'
import { waLinkForType } from '#/lib/wa'
import { cn } from '#/lib/utils'
import type { Lokasi } from '#/lib/schema'
import type { RoomType } from '#/lib/select'

const FACILITY_LIMIT = 5

export function RoomTypeCard({
  tipe,
  lokasi,
  fallbackNumber,
}: {
  tipe: RoomType
  lokasi: Lokasi
  fallbackNumber: string
}) {
  const shown = tipe.fasilitas.slice(0, FACILITY_LIMIT)
  const hidden = tipe.fasilitas.length - shown.length
  const available = tipe.kosong > 0

  return (
    <article className="card-soft card-soft-hover flex flex-col overflow-hidden rounded-xl bg-card transition-shadow duration-200">
      <Photo
        src={tipe.foto}
        alt={`${tipe.nama} room at ${lokasi.nama}`}
        width={900}
        className="h-44 w-full"
      />

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">{tipe.nama}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Ruler className="size-4" aria-hidden />
              <span className="num">
                {formatRange(tipe.luasMin, tipe.luasMax)} m²
              </span>
            </p>
          </div>
          <p className="num shrink-0 text-right text-lg font-bold">
            {tipe.hargaMin === tipe.hargaMax
              ? formatRupiah(tipe.hargaMin)
              : `${formatRupiah(tipe.hargaMin)}+`}
            <span className="block text-xs font-medium text-muted-foreground">
              per bulan
            </span>
          </p>
        </div>

        <p className="text-sm">
          <span
            className={cn(
              'num font-bold',
              available ? 'text-status-kosong' : 'text-muted-foreground',
            )}
          >
            {tipe.kosong}
          </span>{' '}
          <span className="text-muted-foreground">
            dari <span className="num">{tipe.rooms.length}</span> kamar tersedia
          </span>
        </p>

        {shown.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {shown.map((item) => (
              <li
                key={item}
                className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
              >
                {item}
              </li>
            ))}
            {hidden > 0 ? (
              <li className="num rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                +{hidden}
              </li>
            ) : null}
          </ul>
        ) : null}

        {tipe.catatan ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tipe.catatan}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            asChild
            className="group h-11 flex-1 gap-2 transition-transform active:scale-[0.98]"
          >
            <a
              href={waLinkForType(lokasi, tipe, fallbackNumber)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle
                className="cta-icon size-4 transition-transform group-hover:scale-110"
                aria-hidden
              />
              Chat via WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 flex-1">
            <Link
              to="/locations/$slug/type/$type"
              params={{ slug: lokasi.slug, type: tipe.slug }}
            >
              Denah kamar
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

function formatRange(min: number, max: number): string {
  if (min === 0 && max === 0) return '-'
  return min === max ? String(min) : `${min}-${max}`
}
