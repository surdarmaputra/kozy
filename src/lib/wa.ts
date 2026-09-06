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
    `Halo, saya mau tanya kamar ${kamar.kode} di ${lokasi.nama}.`,
    `${formatRupiah(kamar.harga_bulanan)} per bulan, ${kamar.luas_m2} m², lantai ${kamar.lantai}.`,
    'Apakah masih tersedia?',
  ].join(' ')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function waLinkForLokasi(
  lokasi: Lokasi,
  fallbackNumber: string,
): string {
  const number = lokasi.nomor_wa || fallbackNumber
  const message = `Halo, saya mau tanya kamar mana saja yang tersedia di ${lokasi.nama}.`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function waLinkForType(
  lokasi: Lokasi,
  tipe: { nama: string; hargaMin: number },
  fallbackNumber: string,
): string {
  const number = lokasi.nomor_wa || fallbackNumber
  const message = [
    `Halo, saya mau tanya kamar tipe ${tipe.nama} di ${lokasi.nama}.`,
    `Mulai ${formatRupiah(tipe.hargaMin)} per bulan.`,
    'Apakah masih ada yang tersedia?',
  ].join(' ')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
