import { NextRequest, NextResponse } from 'next/server'
import { generateOtp } from '@/lib/auth'
import { PhoneSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = PhoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { otp, userId } = await generateOtp(parsed.data.phone)

  // In production: send via WhatsApp API
  // await sendWhatsAppMessage(parsed.data.phone, `Dein SonnetCal Code: ${otp}`)
  
  // In development: log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 OTP for ${parsed.data.phone}: ${otp}`)
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Code wurde gesendet',
    // Only expose OTP in dev for testing
    ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
  })
}
