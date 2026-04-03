import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { EventCreateSchema, EventFilterSchema } from '@/lib/validations'
import { EventStatus, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const filter = EventFilterSchema.safeParse({
    danceStyle: searchParams.get('danceStyle') ?? undefined,
    eventType:  searchParams.get('eventType') ?? undefined,
    level:      searchParams.get('level') ?? undefined,
    city:       searchParams.get('city') ?? undefined,
    from:       searchParams.get('from') ?? undefined,
    to:         searchParams.get('to') ?? undefined,
    search:     searchParams.get('search') ?? undefined,
  })

  if (!filter.success) {
    return NextResponse.json({ error: filter.error.flatten() }, { status: 400 })
  }

  const { danceStyle, eventType, level, city, from, to, search } = filter.data

  const where: Prisma.EventWhereInput = {
    status: EventStatus.LIVE,
    ...(danceStyle && { danceStyle: { has: danceStyle as any } }),
    ...(eventType  && { eventType: eventType as any }),
    ...(level      && { level: level as any }),
    ...(city       && { city: { contains: city, mode: 'insensitive' } }),
    ...(from || to ? {
      startDate: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      },
    } : { startDate: { gte: new Date() } }),
    ...(search && {
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
      organizer:   { select: { id: true, name: true } },
      _count:      { select: { attendances: true } },
    },
    orderBy: { startDate: 'asc' },
    take: 100,
  })

  return NextResponse.json({ events })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = EventCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate:   parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      doorTime:  parsed.data.doorTime ? new Date(parsed.data.doorTime) : undefined,
      status:    EventStatus.DRAFT,
      organizerId: session.userId,
    },
  })

  return NextResponse.json({ event }, { status: 201 })
}
