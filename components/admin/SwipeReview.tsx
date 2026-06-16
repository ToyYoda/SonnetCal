'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import EventForm from '@/components/events/EventForm'

type ConfidenceScores = Record<string, number>

type Props = {
  event: {
    id: string
    title: string
    description: string | null
    danceStyle: string[]
    eventType: string
    level: string
    startDate: string
    endDate: string | null
    venueName: string
    address: string
    city: string
    price: string | null
    flyerUrl: string | null
    ticketUrl: string | null
    confidenceScores: ConfidenceScores | null
  }
}

export default function SwipeReview({ event }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [swipeX, setSwipeX] = useState(0)
  const [swipeHint, setSwipeHint] = useState<'approve' | 'reject' | null>(null)
  const touchStartX = useRef<number | null>(null)

  const scores = event.confidenceScores ?? {}

  const approve = async () => {
    setLoading('approve')
    await fetch(`/api/admin/events/${event.id}/approve`, { method: 'POST' })
    router.push('/admin/review')
    router.refresh()
  }

  const reject = async () => {
    setLoading('reject')
    await fetch(`/api/admin/events/${event.id}/reject`, { method: 'POST' })
    router.push('/admin/review')
    router.refresh()
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    setSwipeX(dx)
    if (dx > 60)       setSwipeHint('approve')
    else if (dx < -60) setSwipeHint('reject')
    else               setSwipeHint(null)
  }

  const onTouchEnd = () => {
    if (swipeHint === 'approve') approve()
    else if (swipeHint === 'reject') reject()
    setSwipeX(0)
    setSwipeHint(null)
    touchStartX.current = null
  }

  const defaultValues = {
    title:       event.title,
    description: event.description ?? '',
    danceStyle:  event.danceStyle as string[],
    eventType:   event.eventType,
    level:       event.level,
    startDate:   event.startDate.slice(0, 10),
    startTime:   event.startDate.slice(11, 16),
    endDate:     event.endDate?.slice(0, 10) ?? '',
    endTime:     event.endDate?.slice(11, 16) ?? '03:00',
    venueName:   event.venueName,
    address:     event.address,
    city:        event.city,
    price:       event.price ?? '',
    flyerUrl:    event.flyerUrl ?? '',
    ticketUrl:   event.ticketUrl ?? '',
  }

  return (
    <div className="space-y-6">
      {/* Swipe hint overlay */}
      {swipeHint && (
        <div className={cn(
          'fixed inset-0 z-40 pointer-events-none flex items-center justify-center',
          swipeHint === 'approve' ? 'bg-neon-teal/10' : 'bg-red-500/10'
        )}>
          <div className={cn(
            'rounded-3xl p-8 border-2',
            swipeHint === 'approve'
              ? 'border-neon-teal text-neon-teal'
              : 'border-red-400 text-red-400'
          )}>
            {swipeHint === 'approve'
              ? <Check className="w-16 h-16" />
              : <X className="w-16 h-16" />
            }
          </div>
        </div>
      )}

      {/* Flyer */}
      {event.flyerUrl && (
        <div
          className="rounded-2xl overflow-hidden bg-night-900 touch-pan-y select-none"
          style={{ transform: `translateX(${swipeX * 0.3}px)`, transition: swipeX === 0 ? 'transform 0.3s' : 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img src={event.flyerUrl} alt={event.title} className="w-full h-auto" />
          <p className="text-center text-night-500 text-xs py-2">← Wischen zum Ablehnen · Freigeben zum Wischen →</p>
        </div>
      )}

      {/* Confidence scores */}
      {Object.keys(scores).length > 0 && (
        <div className="card">
          <h3 className="text-xs font-semibold text-night-400 uppercase tracking-wider mb-3">KI-Konfidenz</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(scores).map(([field, score]) => (
              <ConfidenceRow key={field} field={field} score={score as number} />
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div>
        <h3 className="text-xs font-semibold text-night-400 uppercase tracking-wider mb-3 px-1">Felder bearbeiten & freigeben</h3>
        <EventForm defaultValues={defaultValues} eventId={event.id} />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <button
          onClick={reject}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-medium text-sm min-h-[44px]"
        >
          {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-5 h-5" />}
          Ablehnen
        </button>
        <button
          onClick={approve}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-neon-teal/30 bg-neon-teal/10 text-neon-teal hover:bg-neon-teal/20 transition-all font-medium text-sm min-h-[44px]"
        >
          {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
          Freigeben
        </button>
      </div>
    </div>
  )
}

function ConfidenceRow({ field, score }: { field: string; score: number }) {
  const pct = Math.round(score * 100)
  const isLow = score < 0.85
  const labels: Record<string, string> = {
    title: 'Titel', startDate: 'Datum', venueName: 'Location',
    address: 'Adresse', city: 'Stadt', danceStyle: 'Tanzstil', overall: 'Gesamt',
  }
  return (
    <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg', isLow ? 'bg-neon-amber/10 border border-neon-amber/20' : 'bg-night-800/50')}>
      <span className={cn('text-xs', isLow ? 'text-neon-amber' : 'text-night-300')}>
        {isLow && '⚠ '}{labels[field] ?? field}
      </span>
      <span className={cn('text-xs font-semibold', isLow ? 'text-neon-amber' : 'text-neon-teal')}>{pct}%</span>
    </div>
  )
}
