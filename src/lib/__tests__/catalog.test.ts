import { describe, expect, it } from 'vitest'
import { csvToRecords, parseCsv } from '../csv'
import { kamarSchema, lokasiSchema, parseRows } from '../schema'
import { activeLokasi, groupByFloor, roomsFor } from '../select'
import { resolvePhoto } from '../photo'
import { waLinkForRoom } from '../wa'
import type { Catalog } from '../schema'

describe('parseCsv', () => {
  it('keeps commas and newlines that live inside quoted cells', () => {
    const rows = parseCsv('a,"b,c","line1\nline2"\n1,2,3')
    expect(rows[0]).toEqual(['a', 'b,c', 'line1\nline2'])
    expect(rows[1]).toEqual(['1', '2', '3'])
  })

  it('unescapes doubled quotes', () => {
    expect(parseCsv('"say ""hi"""')[0]).toEqual(['say "hi"'])
  })
})

describe('csvToRecords', () => {
  it('normalises header casing and drops blank lines', () => {
    const records = csvToRecords('Kode, Status \nA1, kosong \n\n')
    expect(records).toEqual([{ kode: 'A1', status: 'kosong' }])
  })
})

describe('kamarSchema', () => {
  const row = {
    kode: 'A1',
    lokasi_slug: 'Pogung-Baru',
    lantai: '2',
    luas_m2: '14',
    tipe: 'Deluxe',
    harga_bulanan: 'Rp 1.450.000',
    status: ' KOSONG ',
    fasilitas: 'AC, Lemari , ',
    foto_urls: '',
    catatan: '',
    aktif: 'TRUE',
  }

  it('coerces the shapes a human actually types into a Sheet', () => {
    const kamar = kamarSchema.parse(row)
    expect(kamar.harga_bulanan).toBe(1450000)
    expect(kamar.status).toBe('kosong')
    expect(kamar.tipe).toBe('deluxe')
    expect(kamar.lokasi_slug).toBe('pogung-baru')
    expect(kamar.fasilitas).toEqual(['AC', 'Lemari'])
  })

  it('falls back to terisi for an unknown status rather than dropping the row', () => {
    expect(kamarSchema.parse({ ...row, status: 'renovasi' }).status).toBe(
      'terisi',
    )
  })
})

describe('parseRows', () => {
  it('skips only the invalid rows', () => {
    const skipped: Array<string> = []
    const result = parseRows(
      lokasiSchema,
      [
        { slug: 'seturan', nama: 'Kozy Seturan' },
        { slug: '', nama: 'Tanpa slug' },
        { slug: 'pogung', nama: 'Kozy Pogung' },
      ],
      'lokasi',
      skipped,
    )
    expect(result.map((item) => item.slug)).toEqual(['seturan', 'pogung'])
    expect(skipped).toHaveLength(1)
    expect(skipped[0]).toContain('baris 3')
  })
})

describe('resolvePhoto', () => {
  it('rewrites a Drive share link to the thumbnail endpoint', () => {
    expect(
      resolvePhoto(
        'https://drive.google.com/file/d/1AbCdEfGhIjK/view?usp=sharing',
        800,
      ),
    ).toBe('https://drive.google.com/thumbnail?id=1AbCdEfGhIjK&sz=w800')
  })

  it('leaves other hosts alone', () => {
    expect(resolvePhoto('https://picsum.photos/seed/x/800/600')).toBe(
      'https://picsum.photos/seed/x/800/600',
    )
  })
})

function catalogFixture(): Catalog {
  const skipped: Array<string> = []
  return {
    config: {
      brand: 'Kozy',
      tagline: '',
      wa_default: '628111',
      alamat_kantor: '',
    },
    lokasi: parseRows(
      lokasiSchema,
      [
        {
          slug: 'seturan',
          nama: 'Kozy Seturan',
          nomor_wa: '62822',
          aktif: 'TRUE',
        },
        { slug: 'lama', nama: 'Kozy Lama', aktif: 'FALSE' },
      ],
      'lokasi',
      skipped,
    ),
    kamar: parseRows(
      kamarSchema,
      [
        {
          kode: 'S12',
          lokasi_slug: 'seturan',
          lantai: '1',
          harga_bulanan: '1290000',
          status: 'kosong',
          luas_m2: '15',
        },
        {
          kode: 'S21',
          lokasi_slug: 'seturan',
          lantai: '2',
          harga_bulanan: '1850000',
          status: 'kosong',
          luas_m2: '18',
        },
        {
          kode: 'S11',
          lokasi_slug: 'seturan',
          lantai: '1',
          harga_bulanan: '990000',
          status: 'terisi',
          luas_m2: '15',
        },
        {
          kode: 'X1',
          lokasi_slug: 'seturan',
          lantai: '1',
          harga_bulanan: '500000',
          status: 'kosong',
          aktif: 'FALSE',
        },
      ],
      'kamar',
      skipped,
    ),
    source: 'snapshot',
    fetchedAt: '',
    skipped,
  }
}

describe('selectors', () => {
  it('hides inactive rows and quotes the cheapest available room', () => {
    const [seturan, ...rest] = activeLokasi(catalogFixture())
    expect(rest).toHaveLength(0)
    expect(seturan.kamarTotal).toBe(3)
    expect(seturan.kamarKosong).toBe(2)
    expect(seturan.hargaMulai).toBe(1290000)
  })

  it('groups rooms by floor in ascending order', () => {
    const floors = groupByFloor(roomsFor(catalogFixture(), 'seturan'))
    expect(floors.map((floor) => floor.lantai)).toEqual([1, 2])
    expect(floors[0].rooms.map((room) => room.kode)).toEqual(['S11', 'S12'])
  })
})

describe('waLinkForRoom', () => {
  it('prefills the room code, location and price and prefers the location number', () => {
    const catalog = catalogFixture()
    const link = waLinkForRoom(
      catalog.lokasi[0],
      catalog.kamar[0],
      catalog.config.wa_default,
    )
    expect(link.startsWith('https://wa.me/62822?text=')).toBe(true)
    const message = decodeURIComponent(link.split('text=')[1])
    expect(message).toContain('S12')
    expect(message).toContain('Kozy Seturan')
    expect(message).toContain('1.290.000')
  })
})
