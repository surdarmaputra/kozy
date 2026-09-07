import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

// The Netlify plugin boots a local Deno-based edge-functions emulator in dev.
// We only want that when actually targeting Netlify: always for `vite build`,
// and in dev only when NETLIFY_DEPLOYMENT=true. Defaults to off locally so
// `npm run dev` is pure Vite + TanStack Start SSR.
const netlifyDeployment =
  process.env.NETLIFY_DEPLOYMENT === 'true' || Boolean(process.env.NETLIFY)

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    ...(command === 'build' || netlifyDeployment ? [netlify()] : []),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
