import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

type Params = { params: { id: string } }

export async function POST(_: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!session.user.verified) return NextResponse.json({ error: 'Verifizierung erforderlich' }, { status: 403 })

  const existing = await prisma.attendance.findUnique({
    where: { userId_eventId: { userId: session.userId, eventId: params.id } },
  })

  if (existing) {
    await prisma.attendance.delete({
      where: { userId_eventId: { userId: session.userId, eventId: params.id } },
    })
    const count = await prisma.attendance.count({ where: { eventId: params.id } })
    return NextResponse.json({ attending: false, count })
  } else {
    await prisma.attendance.create({
      data: { userId: session.userId, eventId: params.id },
    })
    const count = await prisma.attendance.count({ where: { eventId: params.id } })
    return NextResponse.json({ attending: true, count })
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession()
  const count = await prisma.attendance.count({ where: { eventId: params.id } })
  let attending = false
  if (session) {
    const record = await prisma.attendance.findUnique({
      where: { userId_eventId: { userId: session.userId, eventId: params.id } },
    })
    attending = !!record
  }
  return NextResponse.json({ attending, count })
}
