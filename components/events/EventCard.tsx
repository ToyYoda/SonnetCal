'use client'

import Link from 'next/link'
import { MapPin, Clock, Users, Ticket } from 'lucide-react'
import { formatTime, formatDate, cn, DANCE_STYLE_LABELS, EVENT_TYPE_LABELS, LEVEL_LABELS, DANCE_STYLE_COLORS, EVENT_TYPE_COLORS } from '@/lib/utils'

type Event = {
  id: string
  title: string
  danceStyle: string[]
  eventType: string
  level: string
  startDate: string
  endDate: string | null
  venueName: string
  city: string
  price: string | null
  flyerUrl: string | null
  _count: { attendances: number }
  organizer: { id: string; name: string | null } | null
}

export default function EventCard({ event }: { event: Event }) {
  const start = new Date(event.startDate)

  return (
    <Link href={`/event/${event.id}`} className="block">
      <article className="card-hover group flex gap-4">
        {/* Date block */}
        <div className="flex-shrink-0 w-14 flex flex-col items-center justify-center glass-sm rounded-xl px-2 py-3 text-center">
          <span className="text-xs font-medium text-night-400 uppercase">
            {formatDate(start, 'MMM')}
          </span>
          <span className="text-2xl font-display text-white leading-none">
            {formatDate(start, 'dd')}
          </span>
          <span className="text-xs text-night-500 mt-0.5">
            {formatDate(start, 'EEE')}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-white group-hover:text-neon-pink transition-colors truncate">
              {event.title}
            </h3>
            <span className={cn('badge flex-shrink-0 text-[10px]', EVENT_TYPE_COLORS[event.eventType])}>
              {EVENT_TYPE_LABELS[event.eventType]}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {event.danceStyle.map(s => (
              <span key={s} className={cn('badge text-[10px]', DANCE_STYLE_COLORS[s])}>
                {DANCE_STYLE_LABELS[s]}
              </span>
            ))}
            <span className="badge bg-night-800/60 text-night-400 border-night-700/40 text-[10px]">
              {LEVEL_LABELS[event.level]}
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-night-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(start)}{event.endDate ? `–${formatTime(event.endDate)}` : ''}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.venueName}, {event.city}
            </span>
            {event._count.attendances > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event._count.attendances}
              </span>
            )}
            {event.price && (
              <span className="flex items-center gap-1 text-neon-amber">
                <Ticket className="w-3 h-3" />
                {event.price}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
