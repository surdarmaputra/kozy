import { formatRupiah } from './format'
import type { Kamar, Lokasi } from './schema'

/** The whole funnel ends here: one tap, WhatsApp opens with the room already
 *  named so the visitor never has to describe what they are asking about. */
export function waLinkForRoom(
  lokasi: Lokasi,
  kamar: Kamar,
  fallbackNumber: string,
): string {
  const number = lokasi.nomor_wa || fallbackNumber
  const message = [
    `Hi, I would like to ask about room ${kamar.kode} at ${lokasi.nama}.`,
    `${formatRupiah(kamar.harga_bulanan)} per month, ${kamar.luas_m2} m², floor ${kamar.lantai}.`,
    'Is it still available?',
  ].join(' ')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function waLinkForLokasi(
  lokasi: Lokasi,
  fallbackNumber: string,
): string {
  const number = lokasi.nomor_wa || fallbackNumber
  const message = `Hi, I would like to ask which rooms are available at ${lokasi.nama}.`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function waLinkForType(
  lokasi: Lokasi,
  tipe: { nama: string; hargaMin: number },
  fallbackNumber: string,
): string {
  const number = lokasi.nomor_wa || fallbackNumber
  const message = [
    `Hi, I would like to ask about a ${tipe.nama} room at ${lokasi.nama}.`,
    `From ${formatRupiah(tipe.hargaMin)} per month.`,
    'Is one still available?',
  ].join(' ')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
