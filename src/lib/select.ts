import type { Catalog, Kamar, Lokasi } from './schema'

export type LokasiSummary = Lokasi & {
  kamarKosong: number
  kamarTotal: number
  hargaMulai: number
}

export function roomsFor(catalog: Catalog, slug: string): Array<Kamar> {
  return catalog.kamar
    .filter((room) => room.aktif && room.lokasi_slug === slug)
    .sort((a, b) => a.lantai - b.lantai || a.kode.localeCompare(b.kode, 'id'))
}

export function activeLokasi(catalog: Catalog): Array<LokasiSummary> {
  return catalog.lokasi
    .filter((lokasi) => lokasi.aktif)
    .map((lokasi) => {
      const rooms = roomsFor(catalog, lokasi.slug)
      const available = rooms.filter((room) => room.status === 'kosong')
      // Quote the cheapest room a visitor can actually take. Falling back to
      // the whole floor keeps a fully occupied location from reading "Rp0".
      const prices = (available.length > 0 ? available : rooms)
        .map((room) => room.harga_bulanan)
        .filter((price) => price > 0)
      return {
        ...lokasi,
        kamarKosong: available.length,
        kamarTotal: rooms.length,
        hargaMulai: prices.length > 0 ? Math.min(...prices) : 0,
      }
    })
    .sort(
      (a, b) =>
        b.kamarKosong - a.kamarKosong || a.nama.localeCompare(b.nama, 'id'),
    )
}

export function findLokasi(catalog: Catalog, slug: string): Lokasi | undefined {
  return catalog.lokasi.find(
    (lokasi) => lokasi.aktif && lokasi.slug === slug.toLowerCase(),
  )
}

export function groupByFloor(
  rooms: Array<Kamar>,
): Array<{ lantai: number; rooms: Array<Kamar> }> {
  const floors = new Map<number, Array<Kamar>>()
  rooms.forEach((room) => {
    const bucket = floors.get(room.lantai) ?? []
    bucket.push(room)
    floors.set(room.lantai, bucket)
  })
  return [...floors.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([lantai, list]) => ({ lantai, rooms: list }))
}
