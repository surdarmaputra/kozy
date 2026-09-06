'use client'

import { Check, MessageCircle } from 'lucide-react'
import { Photo } from '#/components/photo'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { formatRupiah } from '#/lib/format'
import { waLinkForType } from '#/lib/wa'
import type { Lokasi } from '#/lib/schema'
import type { RoomType } from '#/lib/select'

/**
 * Generic detail for a room type: what every room of the type shares (price
 * band, size band, the intersection of facilities), with no single room's code,
 * status, or note attached. Opened from "Lihat detail" on the type summary; a
 * tap on an actual room tile opens the room-specific dialog instead.
 */
export function TypeDetailDialog({
  tipe,
  lokasi,
  fallbackNumber,
  onClose,
}: {
  tipe: RoomType | null
  lokasi: Lokasi
  fallbackNumber: string
  onClose: () => void
}) {
  return (
    <Dialog
      open={tipe !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {tipe ? (
          <div className="flex flex-col">
            {tipe.foto ? (
              <Photo
                src={tipe.foto}
                alt={`Kamar ${tipe.nama} di ${lokasi.nama}`}
                width={720}
                className="aspect-[16/10] w-full"
              />
            ) : null}

            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <DialogHeader className="gap-1.5">
                <DialogTitle className="text-xl">{tipe.nama}</DialogTitle>
                <DialogDescription>{lokasi.nama}</DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-3 gap-3">
                <Fact
                  label="Harga"
                  value={
                    tipe.hargaMin === tipe.hargaMax
                      ? formatRupiah(tipe.hargaMin)
                      : `${formatRupiah(tipe.hargaMin)}+`
                  }
                />
                <Fact label="Luas" value={`${formatRange(tipe)} m²`} />
                <Fact
                  label="Tersedia"
                  value={`${tipe.kosong} / ${tipe.rooms.length}`}
                />
              </dl>

              {tipe.fasilitas.length > 0 ? (
                <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {tipe.fasilitas.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-1 flex flex-col gap-2">
                <Button
                  asChild
                  className="group h-11 w-full gap-2 transition-transform active:scale-[0.98]"
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
                <DialogClose asChild>
                  <Button variant="outline" className="h-11 w-full">
                    Tutup
                  </Button>
                </DialogClose>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="num mt-0.5 text-sm font-bold">{value}</dd>
    </div>
  )
}

function formatRange(tipe: RoomType): string {
  if (tipe.luasMin === 0 && tipe.luasMax === 0) return '-'
  return tipe.luasMin === tipe.luasMax
    ? String(tipe.luasMin)
    : `${tipe.luasMin}-${tipe.luasMax}`
}
