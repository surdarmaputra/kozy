import { useMemo, useState } from 'react'
import { DoorClosed } from 'lucide-react'
import { RoomCard } from '#/components/room-card'
import { StatusLegend } from '#/components/status-badge'
import { Switch } from '#/components/ui/switch'
import { groupByFloor } from '#/lib/select'
import type { Kamar, Lokasi } from '#/lib/schema'

export function RoomBoard({
  rooms,
  lokasi,
  fallbackNumber,
}: {
  rooms: Array<Kamar>
  lokasi: Lokasi
  fallbackNumber: string
}) {
  const availableCount = useMemo(
    () => rooms.filter((room) => room.status === 'kosong').length,
    [rooms],
  )
  // Defaults to the rooms a visitor can actually act on. The toggle is right
  // there for anyone who wants to see the whole building.
  const [onlyAvailable, setOnlyAvailable] = useState(true)

  const floors = useMemo(() => {
    const visible = onlyAvailable
      ? rooms.filter((room) => room.status === 'kosong')
      : rooms
    return groupByFloor(visible)
  }, [rooms, onlyAvailable])

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="Belum ada kamar terdaftar"
        body="Data kamar untuk lokasi ini belum diisi. Hubungi kami lewat WhatsApp untuk ketersediaan terbaru."
      />
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Kamar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-semibold text-foreground">
              {availableCount}
            </span>{' '}
            dari <span className="num">{rooms.length}</span> kamar kosong hari
            ini
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 self-start rounded-lg border border-border bg-card px-4 py-2.5 sm:self-auto">
          <Switch
            checked={onlyAvailable}
            onCheckedChange={setOnlyAvailable}
            aria-label="Tampilkan kamar kosong saja"
          />
          <span className="text-sm font-medium">Kamar kosong saja</span>
        </label>
      </div>

      <div className="mt-4">
        <StatusLegend />
      </div>

      {floors.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Semua kamar sedang terisi"
            body="Matikan filter untuk melihat seluruh kamar, atau chat penjaga kos supaya dikabari saat ada yang kosong."
          />
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {floors.map((floor) => (
            <section key={floor.lantai}>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Lantai <span className="num">{floor.lantai}</span>
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {floor.rooms.map((room) => (
                  <RoomCard
                    key={`${room.lokasi_slug}-${room.kode}`}
                    kamar={room}
                    lokasi={lokasi}
                    fallbackNumber={fallbackNumber}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <DoorClosed
        className="mx-auto size-8 text-muted-foreground"
        aria-hidden
      />
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
