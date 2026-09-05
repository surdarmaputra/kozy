import { MessageCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'

/** Fallback for anyone who wants to ask something the page does not answer,
 *  placed after the rooms so it never competes with the per-room actions. */
export function ContactSection({
  waNumber,
  context,
}: {
  waNumber: string
  context?: string
}) {
  if (!waNumber) return null

  const message = context
    ? `Halo, saya mau bertanya tentang ${context}.`
    : 'Halo, saya mau bertanya soal kos.'

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="max-w-lg">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ada yang mau ditanyakan?
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Soal harga, durasi minimal sewa, aturan tamu, atau apa pun yang
            belum tertulis di sini. Kirim pesan, dibalas pada jam kerja.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="h-12 shrink-0 gap-2 px-7 text-base"
        >
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-5" aria-hidden />
            Chat WhatsApp
          </a>
        </Button>
      </div>
    </section>
  )
}
