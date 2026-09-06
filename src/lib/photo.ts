const DRIVE_ID = /(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9_-]{10,})/

/** Google Drive share links do not render in an <img>. The thumbnail endpoint
 *  does, and it resizes server side, which keeps mobile payloads small. */
export function resolvePhoto(url: string, width = 1200): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (!trimmed.includes('drive.google.com')) return trimmed
  const id = DRIVE_ID.exec(trimmed)?.[1]
  return id
    ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
    : trimmed
}

export function firstPhoto(urls: Array<string>, width = 1200): string {
  const resolved = urls.map((url) => resolvePhoto(url, width)).filter(Boolean)
  return resolved[0] ?? ''
}
