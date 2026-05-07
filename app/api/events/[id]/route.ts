import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { EventUpdateSchema } from '@/lib/validations'
import { UserRole } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer:   { select: { id: true, name: true, phone: true } },
      attendances: { include: { user: { select: { id: true, name: true } } } },
      _count:      { select: { attendances: true } },
    },
  })
  if (!event) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json({ event })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const isAdmin = session.user.role === UserRole.ADMIN
  const isOwner = event.organizerId === session.userId
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = EventUpdateSchema.safeParse({ ...body, id })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { id: _id, startDate, endDate, doorTime, ...rest } = parsed.data
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate   && { endDate:   new Date(endDate)   }),
      ...(doorTime  && { doorTime:  new Date(doorTime)  }),
    },
  })
  return NextResponse.json({ event: updated })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const isAdmin = session.user.role === UserRole.ADMIN
  const isOwner = event.organizerId === session.userId
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
