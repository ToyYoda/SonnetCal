import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp, setSessionCookie } from '@/lib/auth'
import { OtpVerifySchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = OtpVerifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const token = await verifyOtp(parsed.data.phone, parsed.data.code)
  if (!token) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Code' }, { status: 401 })
  }

  setSessionCookie(token)
  return NextResponse.json({ success: true })
}
