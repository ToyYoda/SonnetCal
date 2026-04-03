'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import { LayoutGrid, List, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { cn, getCalendarDays, isSameDate, isCurrentMonth, DANCE_STYLE_LABELS, EVENT_TYPE_LABELS, LEVEL_LABELS } from '@/lib/utils'
import EventCard from '@/components/events/EventCard'
import MonthGrid from '@/components/calendar/MonthGrid'

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

type Props = {
  initialEvents: Event[]
  searchParams: Record<string, string>
}

type ViewMode = 'month' | 'list'

const DANCE_STYLES = ['SALSA', 'BACHATA', 'KIZOMBA', 'ZOUK', 'TANGO']
const EVENT_TYPES  = ['PARTY', 'WORKSHOP', 'FESTIVAL', 'SOCIAL']
const LEVELS       = ['OPEN', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export default function CalendarClient({ initialEvents, searchParams }: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState(searchParams.search ?? '')

  const [filters, setFilters] = useState({
    danceStyle: searchParams.danceStyle ?? '',
    eventType:  searchParams.eventType  ?? '',
    level:      searchParams.level      ?? '',
    city:       searchParams.city       ?? '',
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const applyFilters = useCallback((newFilters: typeof filters, q: string) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v) })
    if (q) params.set('search', q)
    router.push(`/calendar?${params.toString()}`)
  }, [router])

  const setFilter = (key: keyof typeof filters, val: string) => {
    const next = { ...filters, [key]: filters[key] === val ? '' : val }
    setFilters(next)
    applyFilters(next, search)
  }

  const clearAll = () => {
    const empty = { danceStyle: '', eventType: '', level: '', city: '' }
    setFilters(empty)
    setSearch('')
    router.push('/calendar')
  }

  const events = initialEvents

  const dayEvents = useMemo(() => {
    if (!selectedDay) return []
    return events.filter(e => isSameDate(new Date(e.startDate), selectedDay))
  }, [events, selectedDay])

  const displayedEvents = selectedDay && view === 'month' ? dayEvents : events

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    events.forEach(e => {
      const key = e.startDate.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    })
    return map
  }, [events])

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white">
            Tanz<span className="text-gradient-pink">events</span>
          </h1>
          <p className="text-night-400 text-sm mt-1">{events.length} Events gefunden</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <div className="flex glass rounded-xl p-1">
            <button
              onClick={() => setView('month')}
              className={cn('p-2 rounded-lg transition-all', view === 'month' ? 'bg-neon-pink/20 text-neon-pink' : 'text-night-400 hover:text-white')}
              title="Monatsansicht"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('p-2 rounded-lg transition-all', view === 'list' ? 'bg-neon-pink/20 text-neon-pink' : 'text-night-400 hover:text-white')}
              title="Listenansicht"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
          <input
            type="text"
            placeholder="Event, Ort oder Stadt suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters(filters, search)}
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
            showFilters || activeFilterCount > 0
              ? 'bg-neon-pink/10 text-neon-pink border-neon-pink/30'
              : 'glass text-night-300 border-night-700/50 hover:text-white'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-neon-pink text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {(activeFilterCount > 0 || search) && (
          <button onClick={clearAll} className="btn-ghost text-night-500 hover:text-neon-pink px-3">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-4 animate-slide-up space-y-4">
          <FilterGroup label="Tanzstil" options={DANCE_STYLES} labels={DANCE_STYLE_LABELS}
            active={filters.danceStyle} onToggle={v => setFilter('danceStyle', v)} color="pink" />
          <FilterGroup label="Typ" options={EVENT_TYPES} labels={EVENT_TYPE_LABELS}
            active={filters.eventType} onToggle={v => setFilter('eventType', v)} color="purple" />
          <FilterGroup label="Level" options={LEVELS} labels={LEVEL_LABELS}
            active={filters.level} onToggle={v => setFilter('level', v)} color="teal" />
        </div>
      )}

      {/* Month view */}
      {view === 'month' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="btn-ghost p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-display text-xl text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="btn-ghost p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <MonthGrid
            days={calendarDays}
            currentMonth={currentMonth}
            eventsByDate={eventsByDate}
            selectedDay={selectedDay}
            onSelectDay={day => setSelectedDay(prev => prev && isSameDate(prev, day) ? null : day)}
          />
        </div>
      )}

      {/* Events */}
      <div className="space-y-3">
        {view === 'month' && selectedDay && (
          <p className="text-night-400 text-sm mb-2">
            Events am {format(selectedDay, 'dd. MMMM', { locale: de })}
          </p>
        )}

        {displayedEvents.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-3">💃</p>
            <p className="text-night-300 font-medium">Keine Events gefunden</p>
            <p className="text-night-500 text-sm mt-1">Versuch andere Filter oder einen anderen Zeitraum</p>
          </div>
        ) : (
          displayedEvents.map((event, i) => (
            <div key={event.id} className="animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
              <EventCard event={event} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FilterGroup({
  label, options, labels, active, onToggle, color,
}: {
  label: string
  options: string[]
  labels: Record<string, string>
  active: string
  onToggle: (v: string) => void
  color: 'pink' | 'purple' | 'teal'
}) {
  const colors = {
    pink:   'bg-neon-pink/15 text-neon-pink border-neon-pink/30',
    purple: 'bg-neon-purple/15 text-neon-purple border-neon-purple/30',
    teal:   'bg-neon-teal/15 text-neon-teal border-neon-teal/30',
  }
  return (
    <div>
      <p className="text-night-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
              active === opt
                ? colors[color]
                : 'bg-night-800/50 text-night-400 border-night-700/50 hover:text-white hover:border-night-600'
            )}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  )
}
