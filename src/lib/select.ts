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

export type RoomType = {
  /** As typed in the Sheet, used verbatim in headings. */
  nama: string
  slug: string
  rooms: Array<Kamar>
  kosong: number
  hargaMin: number
  hargaMax: number
  luasMin: number
  luasMax: number
  /** Only what every room of this type actually has. Listing the union would
   *  promise an AC to whoever ends up in the room without one. */
  fasilitas: Array<string>
  foto: string
}

export function tipeSlug(tipe: string): string {
  return tipe
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function roomTypesFor(catalog: Catalog, slug: string): Array<RoomType> {
  const groups = new Map<string, Array<Kamar>>()
  roomsFor(catalog, slug).forEach((room) => {
    const key = tipeSlug(room.tipe)
    const bucket = groups.get(key) ?? []
    bucket.push(room)
    groups.set(key, bucket)
  })

  return [...groups.entries()]
    .map(([key, rooms]) => {
      const prices = rooms
        .map((room) => room.harga_bulanan)
        .filter((price) => price > 0)
      const sizes = rooms.map((room) => room.luas_m2).filter((size) => size > 0)
      const shared = rooms
        .slice(1)
        .reduce(
          (kept, room) => kept.filter((item) => room.fasilitas.includes(item)),
          rooms[0].fasilitas,
        )
      return {
        nama: rooms[0].tipe,
        slug: key,
        rooms,
        kosong: rooms.filter((room) => room.status === 'kosong').length,
        hargaMin: prices.length > 0 ? Math.min(...prices) : 0,
        hargaMax: prices.length > 0 ? Math.max(...prices) : 0,
        luasMin: sizes.length > 0 ? Math.min(...sizes) : 0,
        luasMax: sizes.length > 0 ? Math.max(...sizes) : 0,
        fasilitas: shared,
        foto:
          rooms.find((room) => room.foto_urls.length > 0)?.foto_urls[0] ?? '',
      }
    })
    .sort((a, b) => b.kosong - a.kosong || a.hargaMin - b.hargaMin)
}
