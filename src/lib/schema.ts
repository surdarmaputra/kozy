import { z } from 'zod'

/** Sheet cells arrive as strings. These coercers keep a single sloppy cell
 *  ("Rp 950.000", "ya", "TRUE ") from invalidating an otherwise good row. */
const csvList = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )

const boolish = z
  .string()
  .default('TRUE')
  .transform((value) => {
    const normalised = value.trim().toLowerCase()
    return !['false', '0', 'no', 'tidak', 'n', ''].includes(normalised)
  })

const numeric = (fallback: number) =>
  z
    .string()
    .default('')
    .transform((value) => {
      const digits = value
        .replace(/[^0-9,.-]/g, '')
        .replace(/\.(?=\d{3}\b)/g, '')
      const parsed = Number(digits.replace(',', '.'))
      return Number.isFinite(parsed) ? parsed : fallback
    })

export const statusValues = ['kosong', 'dibooking', 'terisi'] as const
export type RoomStatus = (typeof statusValues)[number]

const status = z
  .string()
  .default('terisi')
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.enum(statusValues).catch('terisi'))

/** Free text, not an enum: the owner names their own room types in the Sheet
 *  ("Standard", "Deluxe AC", "Tipe A") and the site groups by whatever they
 *  typed, so a new type needs no deploy. */
const tipe = z
  .string()
  .default('Standard')
  .transform((value) => value.trim() || 'Standard')

/** Which way the top of a floor drawing points. Anything the owner mistypes
 *  collapses to '' (no compass) rather than dropping the row. */
export const arahValues = ['utara', 'selatan', 'timur', 'barat'] as const
export type Arah = (typeof arahValues)[number]

const arah = z
  .string()
  .default('')
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.enum([...arahValues, '']).catch(''))

export const configRowSchema = z.object({
  key: z.string().min(1),
  value: z.string().default(''),
})

export const lokasiSchema = z.object({
  slug: z
    .string()
    .min(1)
    .transform((value) => value.trim().toLowerCase()),
  nama: z.string().min(1),
  alamat: z.string().default(''),
  gmaps_url: z.string().default(''),
  lat: numeric(0),
  lng: numeric(0),
  deskripsi: z.string().default(''),
  fasilitas: csvList,
  nomor_wa: z
    .string()
    .default('')
    .transform((value) => value.replace(/[^0-9]/g, '')),
  foto_urls: csvList,
  aktif: boolish,
})

export const kamarSchema = z.object({
  kode: z.string().min(1),
  lokasi_slug: z
    .string()
    .min(1)
    .transform((value) => value.trim().toLowerCase()),
  lantai: numeric(1),
  luas_m2: numeric(0),
  tipe,
  harga_bulanan: numeric(0),
  status,
  fasilitas: csvList,
  foto_urls: csvList,
  catatan: z.string().default(''),
  aktif: boolish,
})

/** One row of a floor drawing: the cells of `sel`, left to right. Optional tab,
 *  optional per floor; a floor with no row here renders as the plain listing. */
export const denahRowSchema = z.object({
  lokasi_slug: z
    .string()
    .min(1)
    .transform((value) => value.trim().toLowerCase()),
  lantai: numeric(1),
  baris: numeric(1),
  sel: csvList,
  arah,
})

export type Lokasi = z.infer<typeof lokasiSchema>
export type Kamar = z.infer<typeof kamarSchema>
export type DenahRow = z.infer<typeof denahRowSchema>

export type SiteConfig = {
  brand: string
  tagline: string
  wa_default: string
  alamat_kantor: string
}

export type Catalog = {
  config: SiteConfig
  lokasi: Array<Lokasi>
  kamar: Array<Kamar>
  /** Optional floor drawings. Absent on a last-good copy saved before the tab
   *  existed; empty when the Sheet has no `denah` tab or it is unreadable. Read
   *  it as `catalog.denah ?? []`. */
  denah?: Array<DenahRow>
  /** Where the render came from, surfaced on /purge so the client can tell
   *  "my edit is live" (`sheet`) from "the Sheet is unreachable and this is the
   *  last copy we read" (`cache`) or "no SHEET_ID, this is sample data" (`seed`). */
  source: 'sheet' | 'seed' | 'cache'
  fetchedAt: string
  skipped: Array<string>
}

/** Validates row by row and drops only the bad ones. A missing column or a
 *  half-typed row must never blank the page. */
export function parseRows<T>(
  schema: z.ZodType<T>,
  rows: Array<Record<string, string>>,
  label: string,
  skipped: Array<string>,
): Array<T> {
  const parsed: Array<T> = []
  rows.forEach((row, index) => {
    const result = schema.safeParse(row)
    if (result.success) {
      parsed.push(result.data)
      return
    }
    const reason = result.error.issues
      .map((issue) => issue.path.join('.') || 'row')
      .join(', ')
    skipped.push(`${label} row ${index + 2}: ${reason}`)
  })
  return parsed
}
