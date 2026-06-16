import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatDateRange, formatTime, DANCE_STYLE_LABELS, EVENT_TYPE_LABELS, LEVEL_LABELS, DANCE_STYLE_COLORS, EVENT_TYPE_COLORS, cn } from '@/lib/utils'
import Nav from '@/components/layout/Nav'
import AttendButton from '@/components/events/AttendButton'
import { MapPin, Clock, Ticket, ArrowLeft, Calendar, User, Globe } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const [event, session] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true } },
        _count: { select: { attendances: true } },
      },
    }),
    getSession(),
  ])

  if (!event) notFound()

  let userAttending = false
  if (session) {
    const a = await prisma.attendance.findUnique({
      where: { userId_eventId: { userId: session.userId, eventId: event.id } },
    })
    userAttending = !!a
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.address}, ${event.city}`)}`
  const isOwner = session?.userId === event.organizerId
  const isAdmin = session?.user.role === 'ADMIN'

  return (
    <div className="min-h-screen">
      <Nav isAdmin={session?.user?.role === 'ADMIN'} />
      <main className="md:pt-16 pb-24 md:pb-8 max-w-2xl mx-auto px-4 pt-6">
        {/* Back */}
        <Link href="/calendar" className="btn-ghost pl-0 mb-6 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Kalender
        </Link>

        {/* Flyer */}
        {event.flyerUrl && (
          <div className="rounded-2xl overflow-hidden mb-6 bg-night-900">
            <img src={event.flyerUrl} alt={event.title} className="w-full h-auto object-contain" />
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={cn('badge', EVENT_TYPE_COLORS[event.eventType])}>
              {EVENT_TYPE_LABELS[event.eventType]}
            </span>
            {event.danceStyle.map(s => (
              <span key={s} className={cn('badge', DANCE_STYLE_COLORS[s])}>
                {DANCE_STYLE_LABELS[s]}
              </span>
            ))}
            <span className="badge bg-night-800/60 text-night-400 border-night-700/40">
              {LEVEL_LABELS[event.level]}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">{event.title}</h1>

          {event.organizer?.name && (
            <p className="text-night-400 text-sm flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Veranstalter: {event.organizer.name}
            </p>
          )}
        </div>

        {/* Info card */}
        <div className="card mb-4 space-y-4">
          <InfoRow icon={<Calendar className="w-4 h-4 text-neon-pink" />} label="Datum">
            {formatDateRange(event.startDate, event.endDate)}
          </InfoRow>
          <InfoRow icon={<Clock className="w-4 h-4 text-neon-purple" />} label="Uhrzeit">
            {formatTime(event.startDate)}
            {event.endDate && ` – ${formatTime(event.endDate)}`}
            {event.doorTime && ` (Einlass: ${formatTime(event.doorTime)})`}
          </InfoRow>
          <InfoRow icon={<MapPin className="w-4 h-4 text-neon-teal" />} label="Ort">
            <span>{event.venueName}</span>
            <br />
            <span className="text-night-400 text-sm">{event.address}, {event.city}</span>
          </InfoRow>
          {event.price && (
            <InfoRow icon={<Ticket className="w-4 h-4 text-neon-amber" />} label="Eintritt">
              {event.price}
            </InfoRow>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="card mb-4">
            <h2 className="text-sm font-medium text-night-400 uppercase tracking-wider mb-3">Beschreibung</h2>
            <p className="text-night-200 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <AttendButton
            eventId={event.id}
            initialAttending={userAttending}
            initialCount={event._count.attendances}
            isLoggedIn={!!session}
          />

          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary justify-center">
            <Globe className="w-4 h-4" />
            Route planen
          </a>

          {event.ticketUrl && (
            <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
              <Ticket className="w-4 h-4" />
              Tickets kaufen
            </a>
          )}

          {(isOwner || isAdmin) && (
            <Link href={`/events/${event.id}/edit`} className="btn-ghost justify-center border border-night-700/50">
              Event bearbeiten
            </Link>
          )}
        </div>

        {/* Map placeholder */}
        <div className="mt-4 rounded-2xl overflow-hidden glass-sm h-48 flex items-center justify-center">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
             className="text-night-400 text-sm hover:text-neon-teal transition-colors flex flex-col items-center gap-2">
            <MapPin className="w-8 h-8" />
            <span>{event.venueName}, {event.city}</span>
            <span className="text-xs text-night-500">Tippen für Google Maps</span>
          </a>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-night-500 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-night-100 text-sm">{children}</div>
      </div>
    </div>
  )
}
