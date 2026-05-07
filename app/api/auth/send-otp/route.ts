import { NextRequest, NextResponse } from 'next/server'
import { generateOtp } from '@/lib/auth'
import { PhoneSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = PhoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const { otp } = await generateOtp(parsed.data.phone)
    const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)

    return NextResponse.json({
      success: true,
      message: twilioConfigured ? 'Code wurde via WhatsApp gesendet' : 'Code wurde gesendet',
      // Only expose OTP in dev when WhatsApp is not configured (mock mode)
      ...(!twilioConfigured && process.env.NODE_ENV === 'development' && { devOtp: otp }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
