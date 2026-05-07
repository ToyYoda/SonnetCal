import Nav from '@/components/layout/Nav'
import AuthFlow from '@/components/ui/AuthFlow'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { LogOut, Calendar, Heart, User } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="min-h-screen">
        <Nav isAdmin={session?.user?.role === 'ADMIN'} />
        <main className="md:pt-16 pb-24 md:pb-8 max-w-md mx-auto px-4 pt-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-neon-pink" />
            </div>
            <h1 className="font-display text-3xl text-white">Anmelden</h1>
            <p className="text-night-400 text-sm mt-2">Mit deiner WhatsApp-Nummer verifizieren</p>
          </div>
          <AuthFlow />
        </main>
      </div>
    )
  }

  // Logged in: show profile
  const [eventCount, attendanceCount] = await Promise.all([
    prisma.event.count({ where: { organizerId: session.userId } }),
    prisma.attendance.count({ where: { userId: session.userId } }),
  ])

  const myEvents = await prisma.event.findMany({
    where: { organizerId: session.userId },
    orderBy: { startDate: 'desc' },
    take: 5,
    select: { id: true, title: true, startDate: true, status: true },
  })

  return (
    <div className="min-h-screen">
      <Nav isAdmin={session?.user?.role === 'ADMIN'} />
      <main className="md:pt-16 pb-24 md:pb-8 max-w-md mx-auto px-4 pt-6">
        {/* Profile header */}
        <div className="card mb-4 text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-pink/30 to-neon-purple/30 flex items-center justify-center mx-auto mb-3 border border-neon-pink/20">
            <span className="font-display text-2xl text-white">
              {(session.user.name ?? session.user.phone)[0].toUpperCase()}
            </span>
          </div>
          <h2 className="font-display text-xl text-white">{session.user.name ?? 'Tänzer:in'}</h2>
          <p className="text-night-500 text-sm">{session.user.phone}</p>
          {session.user.verified && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-neon-teal bg-neon-teal/10 px-2.5 py-1 rounded-full border border-neon-teal/20">
              ✓ Verifiziert
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center py-4">
            <Calendar className="w-5 h-5 text-neon-pink mx-auto mb-1" />
            <p className="font-display text-2xl text-white">{eventCount}</p>
            <p className="text-night-400 text-xs">Meine Events</p>
          </div>
          <div className="card text-center py-4">
            <Heart className="w-5 h-5 text-neon-purple mx-auto mb-1" />
            <p className="font-display text-2xl text-white">{attendanceCount}</p>
            <p className="text-night-400 text-xs">Zusagen</p>
          </div>
        </div>

        {/* My events */}
        {myEvents.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-xs font-medium text-night-400 uppercase tracking-wider mb-3">Meine Events</h3>
            <div className="space-y-2">
              {myEvents.map(e => (
                <a key={e.id} href={`/event/${e.id}`} className="flex items-center justify-between py-2 border-b border-night-800/50 last:border-0 hover:text-neon-pink transition-colors">
                  <div>
                    <p className="text-sm text-night-200">{e.title}</p>
                    <p className="text-xs text-night-500">{formatDate(e.startDate)}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="btn-secondary w-full text-red-400 hover:text-red-300">
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </form>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    LIVE:         'text-neon-teal bg-neon-teal/10 border-neon-teal/20',
    DRAFT:        'text-night-400 bg-night-800/50 border-night-700/50',
    ADMIN_REVIEW: 'text-neon-amber bg-neon-amber/10 border-neon-amber/20',
    CANCELLED:    'text-red-400 bg-red-500/10 border-red-500/20',
  }
  const labels: Record<string, string> = { LIVE:'Live', DRAFT:'Entwurf', ADMIN_REVIEW:'Review', CANCELLED:'Abgesagt' }
  return (
    <span className={`badge text-[10px] ${map[status] ?? ''}`}>{labels[status] ?? status}</span>
  )
}
