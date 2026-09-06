'use client'

import { useState } from 'react'
import { DoorClosed, MessageCircle, Ruler } from 'lucide-react'
import { Lightbox } from '#/components/lightbox'
import { Photo } from '#/components/photo'
import { RoomDetailDialog } from '#/components/room-detail-dialog'
import { RoomMap } from '#/components/room-map'
import { TypeDetailDialog } from '#/components/type-detail-dialog'
import { Button } from '#/components/ui/button'
import { formatRupiah } from '#/lib/format'
import { cn } from '#/lib/utils'
import { waLinkForType } from '#/lib/wa'
import type { Kamar, Lokasi } from '#/lib/schema'
import type { RoomType } from '#/lib/select'

const FACILITY_LIMIT = 6

/**
 * One section instead of two, and one journey instead of a separate page. The
 * type list is the control for the floor map beside it: pick a type, the map
 * highlights where it sits, the summary carries its price and facilities. Both
 * "Lihat detail" on the summary and a tap on any lit room open the same detail
 * dialog. Nothing to scroll between, nothing to navigate away to. On a phone
 * the type list is a scrolling row above the map; from `lg` it is a rail on the
 * left with the map sticky beside it.
 */
export function RoomPicker({
  types,
  rooms,
  lokasi,
  fallbackNumber,
}: {
  types: Array<RoomType>
  rooms: Array<Kamar>
  lokasi: Lokasi
  fallbackNumber: string
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [detailRoom, setDetailRoom] = useState<Kamar | null>(null)
  const [detailType, setDetailType] = useState<RoomType | null>(null)

  if (types.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <DoorClosed
          className="mx-auto size-8 text-muted-foreground"
          aria-hidden
        />
        <p className="mt-4 font-semibold">Belum ada kamar yang terdaftar</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Data kamar untuk lokasi ini belum diisi. Kirim pesan WhatsApp untuk
          menanyakan ketersediaan terbaru.
        </p>
      </div>
    )
  }

  const active = types.find((tipe) => tipe.slug === activeSlug) ?? null
  const totalKosong = types.reduce((sum, tipe) => sum + tipe.kosong, 0)

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Pilih kamar
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
        Ketuk tipe untuk menyorotnya di denah. Ketuk kamar untuk lihat harga,
        catatan, dan tombol WhatsApp.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-8">
        <div
          role="group"
          aria-label="Pilih tipe kamar"
          className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-2.5 lg:overflow-visible lg:pb-0"
        >
          <TypeOption
            label="Semua tipe"
            caption={`${totalKosong}/${rooms.length} tersedia`}
            active={active === null}
            hasNote={false}
            onClick={() => setActiveSlug(null)}
          />
          {types.map((tipe) => (
            <TypeOption
              key={tipe.slug}
              label={tipe.nama}
              caption={`${tipe.kosong}/${tipe.rooms.length} tersedia`}
              active={tipe.slug === activeSlug}
              hasNote={tipe.rooms.some((room) => room.catatan !== '')}
              onClick={() => setActiveSlug(tipe.slug)}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {active ? (
            <TypeSummary
              tipe={active}
              lokasi={lokasi}
              fallbackNumber={fallbackNumber}
              onShowDetail={() => setDetailType(active)}
            />
          ) : null}
          <RoomMap
            rooms={rooms}
            highlight={active?.slug}
            highlightLabel={active?.nama}
            onSelectRoom={setDetailRoom}
          />
        </div>
      </div>

      <RoomDetailDialog
        room={detailRoom}
        lokasi={lokasi}
        fallbackNumber={fallbackNumber}
        onClose={() => setDetailRoom(null)}
      />
      <TypeDetailDialog
        tipe={detailType}
        lokasi={lokasi}
        fallbackNumber={fallbackNumber}
        onClose={() => setDetailType(null)}
      />
    </div>
  )
}

function TypeOption({
  label,
  caption,
  active,
  hasNote,
  onClick,
}: {
  label: string
  caption: string
  active: boolean
  hasNote: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors lg:w-full lg:px-4 lg:py-3',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active
          ? 'border-primary bg-accent text-accent-foreground'
          : 'border-border bg-card hover:border-input',
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
        {label}
        {hasNote ? (
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-status-dibooking"
            title="Ada kamar dengan catatan"
          />
        ) : null}
      </span>
      <span className="num mt-0.5 block text-xs whitespace-nowrap text-muted-foreground">
        {caption}
      </span>
    </button>
  )
}

function TypeSummary({
  tipe,
  lokasi,
  fallbackNumber,
  onShowDetail,
}: {
  tipe: RoomType
  lokasi: Lokasi
  fallbackNumber: string
  onShowDetail: () => void
}) {
  const shown = tipe.fasilitas.slice(0, FACILITY_LIMIT)
  const hidden = tipe.fasilitas.length - shown.length
  const price =
    tipe.hargaMin === tipe.hargaMax
      ? formatRupiah(tipe.hargaMin)
      : `${formatRupiah(tipe.hargaMin)}+`

  return (
    <div className="card-soft mb-6 flex flex-col gap-4 rounded-xl bg-card p-4 sm:flex-row sm:p-5">
      {tipe.foto ? (
        <Lightbox
          src={tipe.foto}
          alt={`Kamar ${tipe.nama} di ${lokasi.nama}`}
          className="rounded-lg sm:w-52 sm:shrink-0"
        >
          <Photo
            src={tipe.foto}
            alt={`Kamar ${tipe.nama} di ${lokasi.nama}`}
            width={640}
            className="aspect-[16/10] w-full"
          />
        </Lightbox>
      ) : null}

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{tipe.nama}</h3>
            <p className="num mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Ruler className="size-4" aria-hidden />
              {formatRange(tipe.luasMin, tipe.luasMax)} m² · {tipe.kosong}/
              {tipe.rooms.length} tersedia
            </p>
          </div>
          <p className="num shrink-0 text-right text-base font-bold">
            {price}
            <span className="block text-xs font-medium text-muted-foreground">
              per bulan
            </span>
          </p>
        </div>

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

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            asChild
            className="group h-10 flex-1 gap-2 transition-transform active:scale-[0.98]"
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
          <Button
            variant="outline"
            className="h-10 flex-1"
            onClick={onShowDetail}
          >
            Lihat detail
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatRange(min: number, max: number): string {
  if (min === 0 && max === 0) return '-'
  return min === max ? String(min) : `${min}-${max}`
}
