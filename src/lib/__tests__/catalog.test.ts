import { describe, expect, it } from 'vitest'
import { csvToRecords, parseCsv } from '../csv'
import { denahRowSchema, kamarSchema, lokasiSchema, parseRows } from '../schema'
import {
  activeLokasi,
  floorPlansFor,
  groupByFloor,
  roomTypesFor,
  roomsFor,
  tipeSlug,
} from '../select'
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
    tipe: ' Deluxe AC ',
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
    expect(kamar.tipe).toBe('Deluxe AC')
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
    expect(skipped[0]).toContain('row 3')
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
          tipe: 'Standard AC',
          fasilitas: 'AC, Lemari, Kulkas',
        },
        {
          kode: 'S21',
          lokasi_slug: 'seturan',
          lantai: '2',
          harga_bulanan: '1850000',
          status: 'kosong',
          luas_m2: '18',
          tipe: 'Deluxe',
          fasilitas: 'AC, Lemari',
        },
        {
          kode: 'S11',
          lokasi_slug: 'seturan',
          lantai: '1',
          harga_bulanan: '990000',
          status: 'terisi',
          luas_m2: '15',
          tipe: 'Standard AC',
          fasilitas: 'AC, Lemari',
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
    denah: parseRows(
      denahRowSchema,
      [
        {
          lokasi_slug: 'seturan',
          lantai: '1',
          baris: '2',
          sel: 's11, lorong, WC',
          arah: 'utara',
        },
        {
          lokasi_slug: 'seturan',
          lantai: '1',
          baris: '1',
          sel: 'pintu, ., .',
        },
      ],
      'denah',
      skipped,
    ),
    source: 'seed',
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

describe('denahRowSchema', () => {
  it('coerces the shapes a human types and splits sel into ordered tokens', () => {
    const row = denahRowSchema.parse({
      lokasi_slug: ' Batam-Centre ',
      lantai: ' 2 ',
      baris: '1',
      sel: 'A1, A2 , lorong, . ',
      arah: ' Utara ',
    })
    expect(row.lokasi_slug).toBe('batam-centre')
    expect(row.lantai).toBe(2)
    expect(row.sel).toEqual(['A1', 'A2', 'lorong', '.'])
    expect(row.arah).toBe('utara')
  })

  it('keeps a quoted sel cell that contains a comma intact', () => {
    const [record] = csvToRecords(
      'lokasi_slug,lantai,baris,sel\nx,1,1,"A1, A2, Ruang, Tunggu"',
    )
    expect(denahRowSchema.parse(record).sel).toEqual([
      'A1',
      'A2',
      'Ruang',
      'Tunggu',
    ])
  })

  it('drops an unrecognised arah to empty rather than failing the row', () => {
    expect(
      denahRowSchema.parse({ lokasi_slug: 'x', sel: 'A1', arah: 'atas' }).arah,
    ).toBe('')
  })

  it('skips a denah row with no lokasi_slug and keeps its neighbours', () => {
    const skipped: Array<string> = []
    const rows = parseRows(
      denahRowSchema,
      [
        { lokasi_slug: 'x', lantai: '1', baris: '1', sel: 'A1' },
        { lokasi_slug: '', lantai: '1', baris: '2', sel: 'A2' },
      ],
      'denah',
      skipped,
    )
    expect(rows).toHaveLength(1)
    expect(skipped[0]).toContain('denah row 3')
  })
})

describe('floorPlansFor', () => {
  it('builds one drawing per drawn floor, rows in baris order, with its arah', () => {
    const plans = floorPlansFor(catalogFixture(), 'seturan')
    expect(plans.map((plan) => plan.lantai)).toEqual([1])
    expect(plans[0].arah).toBe('utara')
    expect(plans[0].rows).toHaveLength(2)
    expect(plans[0].rows[0].map((cell) => cell.kind)).toEqual([
      'marker',
      'gap',
      'gap',
    ])
  })

  it('resolves a room token case-insensitively and passes other tokens through as spots', () => {
    const [floor] = floorPlansFor(catalogFixture(), 'seturan')
    const second = floor.rows[1]
    expect(second[0]).toMatchObject({ kind: 'room' })
    expect(second[0]).toHaveProperty('room.kode', 'S11')
    expect(second[1]).toEqual({ kind: 'marker', marker: 'lorong' })
    expect(second[2]).toEqual({ kind: 'spot', label: 'WC' })
  })

  it('lists an active room the drawing left out under unmapped, never hiding it', () => {
    const [floor] = floorPlansFor(catalogFixture(), 'seturan')
    expect(floor.unmapped.map((room) => room.kode)).toEqual(['S12'])
  })

  it('returns nothing when the location has no denah rows', () => {
    expect(
      floorPlansFor({ ...catalogFixture(), denah: [] }, 'seturan'),
    ).toEqual([])
  })

  it('does not throw when denah is absent on a recalled old copy', () => {
    const catalog = catalogFixture()
    delete (catalog as { denah?: unknown }).denah
    expect(floorPlansFor(catalog, 'seturan')).toEqual([])
  })
})

describe('roomTypesFor', () => {
  it('groups by the type name typed in the Sheet, vacancies then cheapest first', () => {
    const types = roomTypesFor(catalogFixture(), 'seturan')
    expect(types.map((type) => type.slug)).toEqual(['standard-ac', 'deluxe'])
  })

  it('counts vacancies per type and keeps inactive rooms out', () => {
    const standard = roomTypesFor(catalogFixture(), 'seturan').find(
      (type) => type.slug === 'standard-ac',
    )!
    expect(standard.rooms).toHaveLength(2)
    expect(standard.kosong).toBe(1)
    expect(standard.hargaMin).toBe(990000)
    expect(standard.hargaMax).toBe(1290000)
  })

  it('lists only facilities every room of the type has, never the union', () => {
    const standard = roomTypesFor(catalogFixture(), 'seturan').find(
      (type) => type.slug === 'standard-ac',
    )!
    expect(standard.fasilitas).toEqual(['AC', 'Lemari'])
  })
})

describe('tipeSlug', () => {
  it('makes a url segment out of a free-text type name', () => {
    expect(tipeSlug('Deluxe AC')).toBe('deluxe-ac')
    expect(tipeSlug('  Tipe A / Pojok ')).toBe('tipe-a-pojok')
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
