import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !fromNumber) {
    // Dev fallback: print to console
    console.log(`📱 OTP for ${phone}: ${otp}`)
    return
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const body = new URLSearchParams({
    From: `whatsapp:${fromNumber}`,
    To:   `whatsapp:${phone}`,
    Body: `Dein SonnetCal Verifizierungscode: *${otp}*\n\nGültig für 10 Minuten.`,
  })

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    if (process.env.NODE_ENV === 'development') {
      console.warn('WhatsApp send failed (dev fallback):', err)
      console.log(`📱 OTP for ${phone}: ${otp}`)
      return
    }
    console.error('WhatsApp send failed:', err)
    throw new Error('WhatsApp-Nachricht konnte nicht gesendet werden')
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)
const SESSION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? 30)
const COOKIE_NAME = 'sonnetcal_session'

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  })
  const token = await new SignJWT({ sessionId: session.id, userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(JWT_SECRET)
  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId as string },
      include: { user: true },
    })
    if (!session || session.expiresAt < new Date()) return null
    return session
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    await prisma.session.delete({ where: { id: payload.sessionId as string } }).catch(() => {})
  } catch {}
  cookieStore.delete(COOKIE_NAME)
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

/** Generate & store a 6-digit OTP for a phone number */
export async function generateOtp(phone: string): Promise<{ otp: string; userId: string }> {
  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    user = await prisma.user.create({ data: { phone } })
  }
  // Invalidate old codes
  await prisma.otpCode.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  })
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min
  await prisma.otpCode.create({ data: { userId: user.id, code, expiresAt } })
  await sendWhatsAppOtp(phone, code)
  return { otp: code, userId: user.id }
}

/** Verify OTP and return a session token */
export async function verifyOtp(phone: string, code: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) return null
  const otpRecord = await prisma.otpCode.findFirst({
    where: { userId: user.id, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!otpRecord) return null
  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } })
  await prisma.user.update({ where: { id: user.id }, data: { verified: true } })
  return createSession(user.id)
}
