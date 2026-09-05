import { Link } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'

export function SiteHeader({
  brand,
  waNumber,
}: {
  brand: string
  waNumber: string
}) {
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

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            hash="lokasi"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Lokasi
          </Link>
          {waNumber ? (
            <Button asChild size="sm" className="gap-2">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Chat WhatsApp ${brand}`}
              >
                <MessageCircle className="size-4" aria-hidden />
                <span className="hidden sm:inline">Chat WhatsApp</span>
              </a>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
