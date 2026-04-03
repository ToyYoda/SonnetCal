import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })
  const { user } = session
  return NextResponse.json({
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, verified: user.verified },
  })
}
