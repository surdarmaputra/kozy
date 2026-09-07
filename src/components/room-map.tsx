'use client'

import { ArrowUp, DoorClosed, Footprints, MoveVertical } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { StatusLegend, statusLabel } from '#/components/status-badge'
import { formatRupiah } from '#/lib/format'
import { groupByFloor, tipeSlug } from '#/lib/select'
import { cn } from '#/lib/utils'
import type { FloorPlan, PlanCell, PlanMarker } from '#/lib/select'
import type { Kamar } from '#/lib/schema'

/**
 * Room map. Every room in the building at once, positioned by floor, so a
 * visitor reads availability the way they read a seat map: colour first, then
 * pick. Tapping a room hands it back to the parent, which opens its detail
 * (price, size, note, WhatsApp), never WhatsApp straight away.
 *
 * `highlight` dims every room outside one type and makes those rooms inert:
 * tapping one only explains why it is dimmed. That is how the type selector
 * shows where a type actually sits in the building.
 *
 * `plans` is optional. A floor with a drawing renders as a grid with its
 * corridors, doors, stairs and lift, and a compass when the owner set one. A
 * floor with no drawing, or no `plans` at all, renders as the plain wrap of
 * tiles it always has.
 */
export function RoomMap({
  rooms,
  plans,
  highlight,
  highlightLabel,
  onSelectRoom,
}: {
  rooms: Array<Kamar>
  plans?: Array<FloorPlan>
  highlight?: string
  highlightLabel?: string
  onSelectRoom: (room: Kamar) => void
}) {
  const floors = groupByFloor(rooms)
  if (floors.length === 0) return null

  const hasNotes = rooms.some((room) => room.catatan !== '')

  return (
    <div className="max-w-3xl">
      <StatusLegend hasNotes={hasNotes} />
      <div className="mt-6 space-y-4">
        {floors.map((floor) => {
          const plan = plans?.find((item) => item.lantai === floor.lantai)
          return (
            <div
              key={floor.lantai}
              className="card-soft rounded-xl bg-card p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Lantai <span className="num">{floor.lantai}</span>
                </p>
                {plan && plan.arah !== '' ? <Compass arah={plan.arah} /> : null}
              </div>

              {plan ? (
                <PlanGrid
                  plan={plan}
                  highlight={highlight}
                  highlightLabel={highlightLabel}
                  onSelectRoom={onSelectRoom}
                />
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {floor.rooms.map((room) => (
                    <li key={room.kode}>
                      <RoomOrDimmed
                        room={room}
                        highlight={highlight}
                        highlightLabel={highlightLabel}
                        onSelectRoom={onSelectRoom}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlanGrid({
  plan,
  highlight,
  highlightLabel,
  onSelectRoom,
}: {
  plan: FloorPlan
  highlight?: string
  highlightLabel?: string
  onSelectRoom: (room: Kamar) => void
}) {
  return (
    <div className="mt-3">
      <div
        role="group"
        aria-label={`Denah lantai ${plan.lantai}`}
        className="overflow-x-auto pb-1"
      >
        <div className="w-max min-w-full space-y-2">
          {plan.rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((cell, cellIndex) => (
                <PlanCellView
                  key={cellIndex}
                  cell={cell}
                  highlight={highlight}
                  highlightLabel={highlightLabel}
                  onSelectRoom={onSelectRoom}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {plan.unmapped.length > 0 ? (
        <div className="mt-3 border-t border-dashed border-border pt-3">
          <p className="text-[0.7rem] font-semibold text-muted-foreground">
            Belum dipetakan
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {plan.unmapped.map((room) => (
              <li key={room.kode}>
                <RoomOrDimmed
                  room={room}
                  highlight={highlight}
                  highlightLabel={highlightLabel}
                  onSelectRoom={onSelectRoom}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function PlanCellView({
  cell,
  highlight,
  highlightLabel,
  onSelectRoom,
}: {
  cell: PlanCell
  highlight?: string
  highlightLabel?: string
  onSelectRoom: (room: Kamar) => void
}) {
  if (cell.kind === 'room')
    return (
      <RoomOrDimmed
        room={cell.room}
        highlight={highlight}
        highlightLabel={highlightLabel}
        onSelectRoom={onSelectRoom}
      />
    )
  if (cell.kind === 'marker') return <MarkerCell marker={cell.marker} />
  if (cell.kind === 'spot') return <SpotCell label={cell.label} />
  return <span aria-hidden className="block h-16 w-[4.5rem] shrink-0" />
}

function RoomOrDimmed({
  room,
  highlight,
  highlightLabel,
  onSelectRoom,
}: {
  room: Kamar
  highlight?: string
  highlightLabel?: string
  onSelectRoom: (room: Kamar) => void
}) {
  if (highlight !== undefined && tipeSlug(room.tipe) !== highlight)
    return (
      <DimmedTile room={room} typeLabel={highlightLabel ?? 'yang dipilih'} />
    )
  return <RoomTile room={room} onOpen={() => onSelectRoom(room)} />
}

const tileStatus: Record<Kamar['status'], string> = {
  kosong: 'border-status-kosong/45 bg-status-kosong-surface text-status-kosong',
  dibooking:
    'border-status-dibooking/45 bg-status-dibooking-surface text-status-dibooking',
  terisi: 'border-border bg-status-terisi-surface text-status-terisi',
}

const tileShell =
  'relative flex h-16 w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border text-center'

function TileFace({ room }: { room: Kamar }) {
  return (
    <>
      <span className="num text-sm font-bold">{room.kode}</span>
      <span className="num text-[0.65rem]">{room.luas_m2} m²</span>
      {room.catatan ? (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 size-2.5 rounded-full bg-status-dibooking ring-2 ring-card"
        />
      ) : null}
    </>
  )
}

function RoomTile({ room, onOpen }: { room: Kamar; onOpen: () => void }) {
  const summary = `${room.kode} · ${room.tipe} · ${formatRupiah(room.harga_bulanan)}`

  return (
    <button
      type="button"
      onClick={onOpen}
      title={summary}
      aria-label={`Lihat detail kamar ${summary} · ${statusLabel[room.status]}${
        room.catatan ? ' · ada catatan' : ''
      }`}
      className={cn(
        tileShell,
        tileStatus[room.status],
        'cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <TileFace room={room} />
    </button>
  )
}

function DimmedTile({ room, typeLabel }: { room: Kamar; typeLabel: string }) {
  const message = `Kamar ${room.kode} bukan tipe ${typeLabel}.`

  return (
    <Popover>
      <PopoverTrigger
        title={message}
        aria-label={message}
        className={cn(
          tileShell,
          tileStatus[room.status],
          'cursor-help opacity-30',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:opacity-60',
        )}
      >
        <TileFace room={room} />
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[15rem] px-3 py-2 text-sm">
        {message}
      </PopoverContent>
    </Popover>
  )
}

const markerLabel: Record<PlanMarker, string> = {
  pintu: 'Pintu',
  tangga: 'Tangga',
  lift: 'Lift',
  lorong: 'Lorong',
}

function MarkerCell({ marker }: { marker: PlanMarker }) {
  if (marker === 'lorong')
    return (
      <span
        aria-label="Lorong"
        className="flex h-16 w-[4.5rem] shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-[0.65rem] font-medium text-muted-foreground"
      >
        Lorong
      </span>
    )

  const Icon =
    marker === 'pintu'
      ? DoorClosed
      : marker === 'lift'
        ? MoveVertical
        : Footprints

  return (
    <span
      aria-label={markerLabel[marker]}
      className={cn(
        tileShell,
        'border-border bg-secondary text-secondary-foreground',
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="text-[0.65rem] font-medium">{markerLabel[marker]}</span>
    </span>
  )
}

function SpotCell({ label }: { label: string }) {
  return (
    <span
      className={cn(
        tileShell,
        'border-dashed border-border bg-secondary/60 px-1 text-muted-foreground',
      )}
    >
      <span className="text-[0.65rem] leading-tight font-medium break-words">
        {label}
      </span>
    </span>
  )
}

const arahRotation: Record<string, number> = {
  utara: 0,
  timur: 90,
  selatan: 180,
  barat: 270,
}

function Compass({ arah }: { arah: string }) {
  return (
    <span
      title={`Arah atas denah menghadap ${arah}`}
      className="flex items-center gap-1 rounded-md bg-secondary px-1.5 py-1 text-[0.65rem] font-semibold text-secondary-foreground"
    >
      <ArrowUp
        className="size-3"
        style={{ transform: `rotate(${arahRotation[arah] ?? 0}deg)` }}
        aria-hidden
      />
      <span className="uppercase">{arah}</span>
    </span>
  )
}
