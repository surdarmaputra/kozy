import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { csvToRecords } from './src/lib/csv.ts'

const VIRTUAL_ID = 'virtual:build-snapshot'
const RESOLVED_ID = '\0' + VIRTUAL_ID

async function fetchTab(sheetId: string, tab: string) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
  const response = await fetch(url, { headers: { accept: 'text/csv' } })
  if (!response.ok) throw new Error(`tab "${tab}" ${response.status}`)
  const body = await response.text()
  if (body.trimStart().startsWith('<'))
    throw new Error(`tab "${tab}" did not return CSV, check the Sheet sharing`)
  return csvToRecords(body)
}

/** Bakes the Sheet as it reads at build time into the server bundle, so a cold
 *  instance during a Sheet outage still serves real data instead of the
 *  unavailable page. Emits null when there is no SHEET_ID or the read fails —
 *  the committed seed is sample data and must never stand in for the Sheet. */
function buildSnapshot(): Plugin {
  return {
    name: 'kozy:build-snapshot',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    async load(id) {
      if (id !== RESOLVED_ID) return
      const sheetId = process.env.SHEET_ID
      if (!sheetId) return 'export default null'
      try {
        const [config, lokasi, kamar, denah] = await Promise.all([
          fetchTab(sheetId, 'config'),
          fetchTab(sheetId, 'lokasi'),
          fetchTab(sheetId, 'kamar'),
          fetchTab(sheetId, 'denah').catch(() => []),
        ])
        return `export default ${JSON.stringify({ config, lokasi, kamar, denah })}`
      } catch (error) {
        this.warn(
          `build snapshot unavailable, deploying without it: ${String(error)}`,
        )
        return 'export default null'
      }
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    buildSnapshot(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
