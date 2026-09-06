/** RFC 4180 CSV parser. Google's gviz endpoint quotes fields that contain
 *  commas, newlines or quotes, so a naive split() corrupts `fasilitas` and
 *  `deskripsi` columns. */
export function parseCsv(input: string): Array<Array<string>> {
  const rows: Array<Array<string>> = []
  let row: Array<string> = []
  let field = ''
  let quoted = false
  let i = 0

  // Strip UTF-8 BOM.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input

  while (i < text.length) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }

    if (char === '"') {
      quoted = true
      i += 1
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      i += 1
      continue
    }

    if (char === '\r' || char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i += char === '\r' && text[i + 1] === '\n' ? 2 : 1
      continue
    }

    field += char
    i += 1
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

/** Turns a CSV body into objects keyed by a normalised header row.
 *  Headers are lowercased and trimmed so a client renaming `Slug` to `slug`
 *  does not break the site. */
export function csvToRecords(input: string): Array<Record<string, string>> {
  const rows = parseCsv(input).filter((row) =>
    row.some((cell) => cell.trim() !== ''),
  )
  if (rows.length < 2) return []

  const headers = rows[0].map((header) => header.trim().toLowerCase())
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (header) record[header] = (row[index] ?? '').trim()
    })
    return record
  })
}
