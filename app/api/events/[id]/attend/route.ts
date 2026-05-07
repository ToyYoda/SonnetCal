import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(_: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!session.user.verified) return NextResponse.json({ error: 'Verifizierung erforderlich' }, { status: 403 })

  const existing = await prisma.attendance.findUnique({
    where: { userId_eventId: { userId: session.userId, eventId: id } },
  })

  if (existing) {
    await prisma.attendance.delete({
      where: { userId_eventId: { userId: session.userId, eventId: id } },
    })
    const count = await prisma.attendance.count({ where: { eventId: id } })
    return NextResponse.json({ attending: false, count })
  } else {
    await prisma.attendance.create({
      data: { userId: session.userId, eventId: id },
    })
    const count = await prisma.attendance.count({ where: { eventId: id } })
    return NextResponse.json({ attending: true, count })
  }
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  const count = await prisma.attendance.count({ where: { eventId: id } })
  let attending = false
  if (session) {
    const record = await prisma.attendance.findUnique({
      where: { userId_eventId: { userId: session.userId, eventId: id } },
    })
    attending = !!record
  }
  return NextResponse.json({ attending, count })
}
