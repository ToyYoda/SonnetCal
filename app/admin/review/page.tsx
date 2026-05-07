import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, cn } from '@/lib/utils'
import Nav from '@/components/layout/Nav'
import { ChevronRight, Upload, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import IngestForm from '@/components/admin/IngestForm'

export default async function AdminReviewPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/profile')

  const events = await prisma.event.findMany({
    where: { status: 'ADMIN_REVIEW' },
    orderBy: { createdAt: 'desc' },
    include: { organizer: { select: { name: true, phone: true } } },
  })

  return (
    <div className="min-h-screen">
      <Nav isAdmin={true} />
      <main className="md:pt-16 pb-24 md:pb-8 max-w-3xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-white">
            Admin <span className="text-gradient-pink">Review</span>
          </h1>
          <p className="text-night-400 text-sm mt-1">{events.length} Events warten auf Prüfung</p>
        </div>

        {/* Manual ingest */}
        <div className="card mb-6">
          <h2 className="text-xs font-semibold text-night-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" /> Flyer manuell einlesen
          </h2>
          <IngestForm />
        </div>

        {/* Review queue */}
        {events.length === 0 ? (
          <div className="card text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-neon-teal mx-auto mb-3" />
            <p className="text-night-300 font-medium">Keine Events in der Warteschlange</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => {
              const scores = event.confidenceScores as Record<string, number> | null
              const overall = scores?.overall ?? null
              return (
                <Link
                  key={event.id}
                  href={`/admin/review/${event.id}`}
                  className="card flex items-center gap-4 hover:border-neon-pink/30 transition-colors group"
                >
                  {event.flyerUrl && (
                    <img src={event.flyerUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-night-900" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{event.title}</p>
                    <p className="text-night-500 text-xs mt-0.5">
                      {formatDate(event.startDate)} · {event.city}
                    </p>
                    {event.organizer && (
                      <p className="text-night-600 text-xs">{event.organizer.name ?? event.organizer.phone}</p>
                    )}
                    {event.ingestSource && (
                      <p className="text-night-600 text-xs">Quelle: {event.ingestSource}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {overall !== null && (
                      <ConfidenceBadge score={overall} />
                    )}
                    <ChevronRight className="w-4 h-4 text-night-600 group-hover:text-neon-pink transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.85
    ? 'text-neon-teal bg-neon-teal/10 border-neon-teal/20'
    : score >= 0.6
    ? 'text-neon-amber bg-neon-amber/10 border-neon-amber/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20'
  return (
    <span className={cn('badge text-[10px]', color)}>{pct}% sicher</span>
  )
}
