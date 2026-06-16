'use client'

import { isSameDay } from 'date-fns'
import { cn, isSameDate } from '@/lib/utils'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const STYLE_DOTS: Record<string, string> = {
  SALSA:   'bg-neon-pink',
  BACHATA: 'bg-neon-purple',
  KIZOMBA: 'bg-neon-teal',
  ZOUK:    'bg-neon-amber',
  TANGO:   'bg-red-400',
  OTHER:   'bg-night-400',
}

type Event = { id: string; danceStyle: string[] }

type Props = {
  days: Date[]
  eventsByDate: Map<string, Event[]>
  selectedDay: Date | null
  onSelectDay: (day: Date) => void
}

export default function WeekGrid({ days, eventsByDate, selectedDay, onSelectDay }: Props) {
  const today = new Date()

  return (
    <div className="card p-4">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-night-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mt-1">
        {days.map(day => {
          const key       = day.toISOString().slice(0, 10)
          const dayEvents = eventsByDate.get(key) ?? []
          const isToday   = isSameDay(day, today)
          const isSelected = selectedDay ? isSameDate(day, selectedDay) : false
          const hasEvents  = dayEvents.length > 0
          const styles     = [...new Set(dayEvents.flatMap(e => e.danceStyle))].slice(0, 3)

          return (
            <button
              key={key}
              onClick={() => hasEvents && onSelectDay(day)}
              disabled={!hasEvents}
              className={cn(
                'relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl min-h-[64px] transition-all duration-150',
                hasEvents && 'cursor-pointer hover:bg-night-800/60',
                isSelected && 'bg-neon-pink/15 ring-1 ring-neon-pink/40',
                isToday && !isSelected && 'ring-1 ring-night-600',
                !hasEvents && 'cursor-default opacity-40',
              )}
            >
              <span className={cn(
                'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all',
                isToday    && 'bg-neon-pink text-white text-xs',
                isSelected && !isToday && 'text-neon-pink font-semibold',
                !isToday && !isSelected && 'text-night-200',
              )}>
                {day.getDate()}
              </span>

              {styles.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {styles.map(s => (
                    <span key={s} className={cn('w-1.5 h-1.5 rounded-full', STYLE_DOTS[s] ?? 'bg-night-400')} />
                  ))}
                </div>
              )}

              {dayEvents.length > 1 && (
                <span className="absolute top-1 right-1 text-[9px] font-bold text-night-400">
                  {dayEvents.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
