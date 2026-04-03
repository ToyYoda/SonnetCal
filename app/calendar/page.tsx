import { prisma } from '@/lib/prisma'
import { EventStatus } from '@prisma/client'
import CalendarClient from '@/components/calendar/CalendarClient'

export const revalidate = 60

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const { danceStyle, eventType, level, city, from, to, search } = searchParams

  const where: any = {
    status: EventStatus.LIVE,
    startDate: { gte: new Date() },
    ...(danceStyle && { danceStyle: { has: danceStyle } }),
    ...(eventType  && { eventType }),
    ...(level      && { level }),
    ...(city       && { city: { contains: city, mode: 'insensitive' } }),
    ...(search     && {
      OR: [
        { title:     { contains: search, mode: 'insensitive' } },
        { venueName: { contains: search, mode: 'insensitive' } },
        { city:      { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: { select: { id: true, name: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { startDate: 'asc' },
    take: 200,
  })

  const serialized = events.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate:   e.endDate?.toISOString() ?? null,
    doorTime:  e.doorTime?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }))

  return <CalendarClient initialEvents={serialized} searchParams={searchParams} />
}
