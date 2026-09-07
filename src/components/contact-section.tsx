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
    ? `Halo, saya mau tanya soal ${context}.`
    : 'Halo, saya mau tanya soal kamar yang tersedia.'

  return (
    <section className="bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="max-w-lg">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ada yang mau ditanyakan?
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Harga, minimum sewa, aturan tamu, atau apa pun yang belum ada di
            halaman ini. Kirim pesan, kami balas pada jam kerja.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="group h-12 shrink-0 gap-2 px-7 text-base transition-transform active:scale-[0.98]"
        >
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle
              className="cta-icon size-5 transition-transform group-hover:scale-110"
              aria-hidden
            />
            Chat via WhatsApp
          </a>
        </Button>
      </div>
    </section>
  )
}
