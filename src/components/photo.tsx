import { cn } from '#/lib/utils'
import { resolvePhoto } from '#/lib/photo'

/** Sheet rows routinely ship without photos. An empty slot is fine, a broken
 *  image icon is not, so render a neutral surface instead. */
export function Photo({
  src,
  alt,
  className,
  width,
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  width?: number
  priority?: boolean
}) {
  const resolved = resolvePhoto(src, width)
  if (!resolved) {
    return <div aria-hidden className={cn('bg-muted', className)} />
  }
  return (
    <img
      src={resolved}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('object-cover', className)}
    />
  )
}
