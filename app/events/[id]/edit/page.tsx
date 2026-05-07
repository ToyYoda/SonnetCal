import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Nav from '@/components/layout/Nav'
import EventForm from '@/components/events/EventForm'
import { format } from 'date-fns'

type Props = { params: Promise<{ id: string }> }

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const [event, session] = await Promise.all([
    prisma.event.findUnique({ where: { id } }),
    getSession(),
  ])

  if (!event) notFound()
  if (!session) redirect('/profile')

  const isOwner = event.organizerId === session.userId
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) notFound()

  const toDateStr = (d: Date | null) => d ? format(d, 'yyyy-MM-dd') : ''
  const toTimeStr = (d: Date | null) => d ? format(d, 'HH:mm') : ''

  const defaultValues = {
    title:       event.title,
    description: event.description ?? '',
    danceStyle:  event.danceStyle as string[],
    eventType:   event.eventType,
    level:       event.level,
    startDate:   toDateStr(event.startDate),
    startTime:   toTimeStr(event.startDate),
    endDate:     toDateStr(event.endDate),
    endTime:     toTimeStr(event.endDate),
    venueName:   event.venueName,
    address:     event.address,
    city:        event.city,
    price:       event.price ?? '',
    flyerUrl:    event.flyerUrl ?? '',
    ticketUrl:   event.ticketUrl ?? '',
  }

  return (
    <div className="min-h-screen">
      <Nav isAdmin={session?.user?.role === 'ADMIN'} />
      <main className="md:pt-16 pb-24 md:pb-8 max-w-2xl mx-auto px-4 pt-6">
        <Link href={`/event/${event.id}`} className="btn-ghost pl-0 mb-6 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Event
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-3xl text-white">
            Event <span className="text-gradient-pink">bearbeiten</span>
          </h1>
          <p className="text-night-400 text-sm mt-1">{event.title}</p>
        </div>

        <EventForm defaultValues={defaultValues} eventId={event.id} />
      </main>
    </div>
  )
}
