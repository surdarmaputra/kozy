import { Link } from '@tanstack/react-router'

/** Deliberately no chat button. Every WhatsApp action on this site is attached
 *  to a specific room or type, plus one general fallback above the footer. */
export function SiteHeader({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
            {brand.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-base">{brand}</span>
        </Link>

        <Link
          to="/"
          hash="lokasi"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Lokasi
        </Link>
      </div>
    </header>
  )
}
