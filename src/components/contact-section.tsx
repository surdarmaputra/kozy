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
    ? `Hi, I have a question about ${context}.`
    : 'Hi, I have a question about your rooms.'

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="max-w-lg">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Anything you want to ask?
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Price, minimum stay, guest rules, or anything this page does not
            cover. Send a message and we reply during working hours.
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
            <MessageCircle className="size-5" aria-hidden /> Chat on WhatsApp
          </a>
        </Button>
      </div>
    </section>
  )
}
