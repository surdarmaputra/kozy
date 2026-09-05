import { MessageCircle, Ruler, Building2 } from 'lucide-react'
import { Photo } from '#/components/photo'
import { StatusBadge } from '#/components/status-badge'
import { formatRupiah } from '#/lib/format'
import { waLinkForRoom } from '#/lib/wa'
import { cn } from '#/lib/utils'
import type { Kamar, Lokasi } from '#/lib/schema'

const FACILITY_LIMIT = 4

export function RoomCard({
  kamar,
  lokasi,
  fallbackNumber,
}: {
  kamar: Kamar
  lokasi: Lokasi
  fallbackNumber: string
}) {
  const bookable = kamar.status !== 'terisi'
  const shown = kamar.fasilitas.slice(0, FACILITY_LIMIT)
  const hidden = kamar.fasilitas.length - shown.length

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border bg-card',
        bookable
          ? 'border-border transition-[border-color,transform] duration-200 hover:border-primary/45 focus-within:border-primary/45 active:scale-[0.995]'
          : 'border-border/60 opacity-70',
      )}
    >
      <Photo
        src={kamar.foto_urls[0] ?? ''}
        alt={`Kamar ${kamar.kode} di ${lokasi.nama}`}
        width={800}
        className="h-40 w-full"
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="num text-lg font-bold tracking-tight">
                {kamar.kode}
              </h4>
              <StatusBadge status={kamar.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground capitalize">
              {kamar.tipe}
            </p>
          </div>
          <p className="num text-right text-lg font-bold">
            {formatRupiah(kamar.harga_bulanan)}
            <span className="block text-xs font-medium text-muted-foreground">
              per bulan
            </span>
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Ruler className="size-4" aria-hidden />
            <dt className="sr-only">Luas</dt>
            <dd className="num">{kamar.luas_m2} m²</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="size-4" aria-hidden />
            <dt className="sr-only">Lantai</dt>
            <dd>
              Lantai <span className="num">{kamar.lantai}</span>
            </dd>
          </div>
        </dl>

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

        {kamar.catatan ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {kamar.catatan}
          </p>
        ) : null}

        <div className="mt-auto pt-1">
          {bookable ? (
            <a
              href={waLinkForRoom(lokasi, kamar, fallbackNumber)}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold',
                'transition-transform duration-150 active:translate-y-px',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'after:absolute after:inset-0 after:content-[""]',
                kamar.status === 'kosong'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border border-input bg-card text-foreground hover:bg-secondary',
              )}
            >
              <MessageCircle className="size-4" aria-hidden />
              Chat WhatsApp
              <span className="sr-only">
                {' '}
                tentang kamar {kamar.kode} di {lokasi.nama}
              </span>
            </a>
          ) : (
            <p className="flex h-10 items-center justify-center rounded-lg bg-secondary text-sm font-medium text-muted-foreground">
              Sedang dihuni
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
