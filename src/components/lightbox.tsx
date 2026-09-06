'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, X, ZoomIn } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '#/components/ui/dialog'
import { resolvePhoto } from '#/lib/photo'
import { cn } from '#/lib/utils'

const MIN_SCALE = 1
const MAX_SCALE = 5
const STEP = 0.5
const DRAG_THRESHOLD = 4

/**
 * Wraps a thumbnail in a zoom affordance. Tapping it opens the full image in a
 * dialog where it can be scaled up to five times and dragged around, so a
 * visitor can inspect any part of a room photo. When the source resolves to
 * nothing, the children render untouched with no trigger.
 */
export function Lightbox({
  src,
  alt,
  className,
  children,
}: {
  src: string
  alt: string
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(MIN_SCALE)
  const [dragging, setDragging] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  // Fraction of the scrollable image sitting under the viewport centre, captured
  // just before a zoom so the same point stays put afterwards.
  const focalRef = useRef<{ x: number; y: number } | null>(null)
  // Pointer origin + scroll origin for a drag-to-pan gesture.
  const panRef = useRef<{
    x: number
    y: number
    left: number
    top: number
  } | null>(null)
  // Set true once a drag passes the threshold, so the trailing click does not
  // also register as a zoom tap.
  const suppressClickRef = useRef(false)
  const full = resolvePhoto(src, 1600)

  useEffect(() => {
    if (!open) setScale(MIN_SCALE)
  }, [open])

  // Re-centre the scroll position on the pre-zoom focal point so zooming does
  // not just magnify the top-left corner.
  useEffect(() => {
    const el = viewportRef.current
    const focal = focalRef.current
    focalRef.current = null
    if (!el || !focal) return
    el.scrollLeft = focal.x * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = focal.y * el.scrollHeight - el.clientHeight / 2
  }, [scale])

  if (!full) return <>{children}</>

  const zoom = (delta: number) => {
    const el = viewportRef.current
    if (el) {
      focalRef.current = {
        x: el.scrollWidth
          ? (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth
          : 0.5,
        y: el.scrollHeight
          ? (el.scrollTop + el.clientHeight / 2) / el.scrollHeight
          : 0.5,
      }
    }
    setScale((current) =>
      Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, Number((current + delta).toFixed(2))),
      ),
    )
  }

  const zoomable = scale > MIN_SCALE

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Perbesar foto: ${alt}`}
        className={cn(
          'group relative block w-full cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          className,
        )}
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <ZoomIn className="size-4" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(96vw,1200px)] gap-0 border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,1200px)]"
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>

          <div className="mb-2 flex items-center justify-end gap-1.5">
            <div className="flex items-center rounded-full bg-background shadow-md">
              <button
                type="button"
                onClick={() => zoom(-STEP)}
                disabled={scale <= MIN_SCALE}
                aria-label="Perkecil"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="num w-12 text-center text-xs font-semibold text-foreground">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoom(STEP)}
                disabled={scale >= MAX_SCALE}
                aria-label="Perbesar"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
            <DialogClose
              aria-label="Tutup"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-background text-foreground shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="size-4" aria-hidden />
            </DialogClose>
          </div>

          <div
            ref={viewportRef}
            onPointerDown={(event) => {
              suppressClickRef.current = false
              if (!zoomable) return
              const el = viewportRef.current
              if (!el) return
              panRef.current = {
                x: event.clientX,
                y: event.clientY,
                left: el.scrollLeft,
                top: el.scrollTop,
              }
              el.setPointerCapture(event.pointerId)
              setDragging(true)
            }}
            onPointerMove={(event) => {
              const pan = panRef.current
              const el = viewportRef.current
              if (!pan || !el) return
              const dx = event.clientX - pan.x
              const dy = event.clientY - pan.y
              if (
                Math.abs(dx) > DRAG_THRESHOLD ||
                Math.abs(dy) > DRAG_THRESHOLD
              ) {
                suppressClickRef.current = true
              }
              el.scrollLeft = pan.left - dx
              el.scrollTop = pan.top - dy
            }}
            onPointerUp={(event) => {
              const el = viewportRef.current
              if (el?.hasPointerCapture(event.pointerId)) {
                el.releasePointerCapture(event.pointerId)
              }
              panRef.current = null
              setDragging(false)
            }}
            onPointerCancel={() => {
              panRef.current = null
              setDragging(false)
            }}
            style={{ touchAction: zoomable ? 'none' : 'auto' }}
            className={cn(
              'max-h-[82vh] overflow-auto overscroll-contain rounded-xl bg-card',
              dragging
                ? 'cursor-grabbing'
                : zoomable
                  ? 'cursor-grab'
                  : 'cursor-zoom-in',
            )}
          >
            <img
              src={full}
              alt={alt}
              draggable={false}
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false
                  return
                }
                if (scale <= MIN_SCALE) zoom(STEP)
                else if (scale >= MAX_SCALE) zoom(MIN_SCALE - scale)
              }}
              style={{ width: `${scale * 100}%` }}
              className="mx-auto block h-auto max-w-none object-contain select-none"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
