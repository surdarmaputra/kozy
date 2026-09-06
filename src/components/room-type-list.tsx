import { useMemo, useState } from 'react'
import { DoorClosed } from 'lucide-react'
import { RoomTypeCard } from '#/components/room-type-card'
import { Switch } from '#/components/ui/switch'
import type { Lokasi } from '#/lib/schema'
import type { RoomType } from '#/lib/select'

export function RoomTypeList({
  types,
  lokasi,
  fallbackNumber,
}: {
  types: Array<RoomType>
  lokasi: Lokasi
  fallbackNumber: string
}) {
  // Defaults to what a visitor can act on today. The map above still shows the
  // whole building, so nothing is hidden, only deprioritised.
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const visible = useMemo(
    () => (onlyAvailable ? types.filter((tipe) => tipe.kosong > 0) : types),
    [types, onlyAvailable],
  )

  if (types.length === 0) {
    return (
      <EmptyState
        title="Belum ada kamar yang terdaftar"
        body="Data kamar untuk lokasi ini belum diisi. Kirim pesan WhatsApp untuk menanyakan ketersediaan terbaru."
      />
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tipe kamar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kamar dengan tipe sama punya harga, luas, dan daftar fasilitas yang
            sama.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 self-start rounded-lg border border-border bg-card px-4 py-2.5 sm:self-auto">
          <Switch
            checked={onlyAvailable}
            onCheckedChange={setOnlyAvailable}
            aria-label="Tampilkan hanya tipe yang punya kamar tersedia"
          />
          <span className="text-sm font-medium">Yang tersedia saja</span>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Semua kamar sedang terisi"
            body="Matikan filter untuk melihat semua tipe, atau kirim pesan dan kami kabari begitu ada yang kosong."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((tipe) => (
            <RoomTypeCard
              key={tipe.slug}
              tipe={tipe}
              lokasi={lokasi}
              fallbackNumber={fallbackNumber}
            />
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
