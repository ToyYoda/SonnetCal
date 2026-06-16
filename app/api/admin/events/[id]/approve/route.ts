import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EventStatus, UserRole } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function POST(_: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const updated = await prisma.event.update({
    where: { id },
    data: { status: EventStatus.LIVE },
  })
  return NextResponse.json({ event: updated })
}
