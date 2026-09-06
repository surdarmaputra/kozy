'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { StatusLegend, statusLabel } from '#/components/status-badge'
import { formatRupiah } from '#/lib/format'
import { groupByFloor, tipeSlug } from '#/lib/select'
import { cn } from '#/lib/utils'
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
 */
export function RoomMap({
  rooms,
  highlight,
  highlightLabel,
  onSelectRoom,
}: {
  rooms: Array<Kamar>
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
        {floors.map((floor) => (
          <div
            key={floor.lantai}
            className="card-soft rounded-xl bg-card p-4 sm:p-5"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              Lantai <span className="num">{floor.lantai}</span>
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {floor.rooms.map((room) => (
                <li key={room.kode}>
                  {highlight !== undefined &&
                  tipeSlug(room.tipe) !== highlight ? (
                    <DimmedTile
                      room={room}
                      typeLabel={highlightLabel ?? 'yang dipilih'}
                    />
                  ) : (
                    <RoomTile room={room} onOpen={() => onSelectRoom(room)} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

const tileStatus: Record<Kamar['status'], string> = {
  kosong: 'border-status-kosong/45 bg-status-kosong-surface text-status-kosong',
  dibooking:
    'border-status-dibooking/45 bg-status-dibooking-surface text-status-dibooking',
  terisi: 'border-border bg-status-terisi-surface text-status-terisi',
}

const tileShell =
  'relative flex h-16 w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-lg border text-center'

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
