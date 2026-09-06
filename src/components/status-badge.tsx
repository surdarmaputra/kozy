import { cn } from '#/lib/utils'
import type { RoomStatus } from '#/lib/schema'

/** The Sheet keeps its own vocabulary (kosong / dibooking / terisi) because the
 *  owner types those values. The site shows the English reading of them. */
export const statusLabel: Record<RoomStatus, string> = {
  kosong: 'Available',
  dibooking: 'Reserved',
  terisi: 'Occupied',
}

const statusStyle: Record<RoomStatus, string> = {
  kosong: 'bg-status-kosong-surface text-status-kosong',
  dibooking: 'bg-status-dibooking-surface text-status-dibooking',
  terisi: 'bg-status-terisi-surface text-status-terisi',
}

export function StatusBadge({
  status,
  className,
}: {
  status: RoomStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        statusStyle[status],
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  )
}

/** Reading key for the room map. Three states is few enough that a legend beats
 *  a tooltip nobody taps on a phone. */
export function StatusLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {(['kosong', 'dibooking', 'terisi'] as Array<RoomStatus>).map(
        (status) => (
          <li
            key={status}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span
              aria-hidden
              className={cn('size-2.5 rounded-full', {
                'bg-status-kosong': status === 'kosong',
                'bg-status-dibooking': status === 'dibooking',
                'bg-status-terisi': status === 'terisi',
              })}
            />
            {statusLabel[status]}
          </li>
        ),
      )}
    </ul>
  )
}
