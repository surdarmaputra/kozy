import { Link } from '@tanstack/react-router'
import { Logo } from '#/components/logo'

/** Deliberately no chat button. Every WhatsApp action on this site is attached
 *  to a specific room or type, plus one general fallback above the footer. */
export function SiteHeader({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <Logo
            label={brand}
            className="transition-transform active:scale-95"
          />
          <span className="text-base">{brand}</span>
        </Link>

        <Link
          to="/"
          hash="locations"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Lokasi
        </Link>
      </div>
    </header>
  )
}
