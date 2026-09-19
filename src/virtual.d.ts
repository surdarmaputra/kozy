declare module 'virtual:build-snapshot' {
  /** Raw Sheet tabs captured at build time, or null when that build could not
   *  read the Sheet. Inlined by the `build-snapshot` plugin in vite.config.ts. */
  const snapshot: {
    config: Array<Record<string, string>>
    lokasi: Array<Record<string, string>>
    kamar: Array<Record<string, string>>
    denah?: Array<Record<string, string>>
  } | null
  export default snapshot
}
