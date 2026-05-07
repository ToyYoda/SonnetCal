import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  name:      z.string().min(1).max(60).optional(),
  avatarUrl: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: parsed.data,
    select: { id: true, name: true, avatarUrl: true, phone: true },
  })

  return NextResponse.json({ user })
}
