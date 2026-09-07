import { SiteHeader } from '#/components/site-header'

/** Shown when the Sheet cannot be read and nothing has ever been saved to fall
 *  back on. Better an honest "come back shortly" than stale room data. No footer
 *  here: it needs the config and location list this render does not have. */
export function CatalogUnavailable() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader brand="Kozy" />
      <main
        id="konten"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-24 text-center"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Ketersediaan kamar sedang tidak bisa ditampilkan
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Kami belum bisa memuat daftar kamar terbaru. Silakan coba lagi
          beberapa menit lagi.
        </p>
      </main>
    </div>
  )
}
