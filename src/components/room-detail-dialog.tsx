'use client'

import { Check, MessageCircle, StickyNote } from 'lucide-react'
import { Photo } from '#/components/photo'
import { StatusBadge } from '#/components/status-badge'
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
import { waLinkForRoom } from '#/lib/wa'
import type { Kamar, Lokasi } from '#/lib/schema'

/**
 * The room map used to jump straight to WhatsApp on tap. That skips the one
 * thing a visitor wants first: the room's price, size, and any note the owner
 * left on it in the Sheet. This dialog is that stop. The WhatsApp link still
 * carries the room's full context, it is just one deliberate tap further in.
 */
export function RoomDetailDialog({
  room,
  lokasi,
  fallbackNumber,
  onClose,
}: {
  room: Kamar | null
  lokasi: Lokasi
  fallbackNumber: string
  onClose: () => void
}) {
  return (
    <Dialog
      open={room !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {room ? (
          <div className="flex flex-col">
            {room.foto_urls[0] ? (
              <Photo
                src={room.foto_urls[0]}
                alt={`Kamar ${room.kode} di ${lokasi.nama}`}
                width={720}
                className="aspect-[16/10] w-full"
              />
            ) : null}

            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <DialogHeader className="gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="num text-xl">
                    Kamar {room.kode}
                  </DialogTitle>
                  <StatusBadge status={room.status} />
                </div>
                <DialogDescription>
                  {room.tipe} di {lokasi.nama}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-3 gap-3">
                <Fact label="Harga" value={formatRupiah(room.harga_bulanan)} />
                <Fact label="Luas" value={`${room.luas_m2} m²`} />
                <Fact label="Lantai" value={String(room.lantai)} />
              </dl>

              {room.fasilitas.length > 0 ? (
                <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {room.fasilitas.map((item) => (
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

              {room.catatan ? (
                <div className="relative flex gap-2.5 rounded-lg border border-status-dibooking/45 bg-status-dibooking-surface p-3">
                  <span
                    aria-hidden
                    className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-status-dibooking ring-2 ring-background"
                  />
                  <StickyNote
                    className="mt-0.5 size-4 shrink-0 text-status-dibooking"
                    aria-hidden
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-status-dibooking">
                      Catatan
                    </p>
                    <p className="mt-0.5 leading-relaxed text-foreground">
                      {room.catatan}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-1 flex flex-col gap-2">
                {room.status === 'terisi' ? (
                  <Button
                    disabled
                    className="h-11 w-full"
                    aria-label="Kamar ini sudah terisi dan tidak bisa dibooking"
                  >
                    Kamar sudah terisi
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="group h-11 w-full gap-2 transition-transform active:scale-[0.98]"
                  >
                    <a
                      href={waLinkForRoom(lokasi, room, fallbackNumber)}
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
                )}
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
