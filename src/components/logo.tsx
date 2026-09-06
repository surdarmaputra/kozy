import { cn } from '#/lib/utils'

/** The Kozy mark: a bold K on a rounded square in the accent green. Same shape
 *  as the favicon so the browser tab and the header read as one brand. Colour
 *  comes from the design tokens, never a literal here. */
export function Logo({
  className,
  label = 'K',
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground',
        className,
      )}
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  )
}
