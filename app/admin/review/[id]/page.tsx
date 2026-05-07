import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Nav from '@/components/layout/Nav'
import SwipeReview from '@/components/admin/SwipeReview'

type Props = { params: Promise<{ id: string }> }

export default async function ReviewDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/profile')

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) notFound()

  const serialized = {
    id:               event.id,
    title:            event.title,
    description:      event.description,
    danceStyle:       event.danceStyle as string[],
    eventType:        event.eventType,
    level:            event.level,
    startDate:        event.startDate.toISOString(),
    endDate:          event.endDate?.toISOString() ?? null,
    venueName:        event.venueName,
    address:          event.address,
    city:             event.city,
    price:            event.price,
    flyerUrl:         event.flyerUrl,
    ticketUrl:        event.ticketUrl,
    confidenceScores: event.confidenceScores as Record<string, number> | null,
  }

  return (
    <div className="min-h-screen">
      <Nav isAdmin={true} />
      <main className="md:pt-16 pb-24 md:pb-8 max-w-2xl mx-auto px-4 pt-6">
        <Link href="/admin/review" className="btn-ghost pl-0 mb-6 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Warteschlange
        </Link>

        <div className="mb-4">
          <h1 className="font-display text-2xl text-white">{event.title}</h1>
          <p className="text-night-400 text-sm mt-1">{event.city} · KI-Extraktion prüfen</p>
        </div>

        <SwipeReview event={serialized} />
      </main>
    </div>
  )
}
