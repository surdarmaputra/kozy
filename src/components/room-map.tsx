import { StatusLegend, statusLabel } from '#/components/status-badge'
import { formatRupiah } from '#/lib/format'
import { groupByFloor, tipeSlug } from '#/lib/select'
import { cn } from '#/lib/utils'
import { waLinkForRoom } from '#/lib/wa'
import type { Kamar, Lokasi } from '#/lib/schema'

/**
 * Room map. Every room in the building at once, positioned by floor, so a
 * visitor reads availability the way they read a seat map: colour first, then
 * pick. Tapping a free room opens WhatsApp with that exact code.
 *
 * `highlight` dims every room outside one type, which is how the room type
 * page shows where that type actually sits in the building.
 */
export function RoomMap({
  rooms,
  lokasi,
  fallbackNumber,
  highlight,
}: {
  rooms: Array<Kamar>
  lokasi: Lokasi
  fallbackNumber: string
  highlight?: string
}) {
  const floors = groupByFloor(rooms)
  if (floors.length === 0) return null

  return (
    <div className="max-w-3xl">
      <StatusLegend />
      <div className="mt-6 space-y-4">
        {floors.map((floor) => (
          <div
            key={floor.lantai}
            className="rounded-xl border border-border bg-card p-4 sm:p-5"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              Floor <span className="num">{floor.lantai}</span>
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {floor.rooms.map((room) => (
                <li key={room.kode}>
                  <RoomTile
                    room={room}
                    lokasi={lokasi}
                    fallbackNumber={fallbackNumber}
                    dimmed={
                      highlight !== undefined &&
                      tipeSlug(room.tipe) !== highlight
                    }
                  />
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

function RoomTile({
  room,
  lokasi,
  fallbackNumber,
  dimmed,
}: {
  room: Kamar
  lokasi: Lokasi
  fallbackNumber: string
  dimmed: boolean
}) {
  const summary = `${room.kode} · ${room.tipe} · ${formatRupiah(room.harga_bulanan)}`
  const shell = cn(
    'flex h-16 w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-lg border text-center',
    tileStatus[room.status],
    dimmed && 'opacity-30',
  )

  if (room.status === 'terisi' || dimmed) {
    return (
      <span
        className={shell}
        title={summary}
        aria-label={`${summary} · ${statusLabel[room.status]}`}
      >
        <span className="num text-sm font-bold">{room.kode}</span>
        <span className="num text-[0.65rem]">{room.luas_m2} m²</span>
      </span>
    )
  }

  return (
    <a
      href={waLinkForRoom(lokasi, room, fallbackNumber)}
      target="_blank"
      rel="noreferrer"
      title={summary}
      aria-label={`Chat on WhatsApp about room ${summary}`}
      className={cn(
        shell,
        'transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <span className="num text-sm font-bold">{room.kode}</span>
      <span className="num text-[0.65rem]">{room.luas_m2} m²</span>
    </a>
  )
}
