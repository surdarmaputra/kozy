import { Link } from '@tanstack/react-router'
import type { LokasiSummary } from '#/lib/select'
import type { SiteConfig } from '#/lib/schema'

export function SiteFooter({
  config,
  lokasi,
}: {
  config: SiteConfig
  lokasi: Array<LokasiSummary>
}) {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-lg font-bold tracking-tight">{config.brand}</p>
          {config.alamat_kantor ? (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {config.alamat_kantor}
            </p>
          ) : null}
          {config.wa_default ? (
            <a
              href={`https://wa.me/${config.wa_default}`}
              target="_blank"
              rel="noreferrer"
              className="num mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              +{config.wa_default}
            </a>
          ) : null}
        </div>

        <nav aria-label="Lokasi kos">
          <p className="text-sm font-semibold">Lokasi</p>
          <ul className="mt-3 space-y-2">
            {lokasi.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/lokasi/$slug"
                  params={{ slug: item.slug }}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.nama}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border/70">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {config.brand}. Harga dan ketersediaan
          dapat berubah, konfirmasi lewat WhatsApp sebelum datang.
        </p>
      </div>
    </footer>
  )
}
