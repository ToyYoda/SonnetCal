import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeFlyer, detectCancellation } from '@/lib/ai'
import { DanceStyle, EventStatus, EventType, DanceLevel } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 120

const CONFIDENCE_AUTO_PUBLISH = 0.95
const CONFIDENCE_REVIEW_THRESHOLD = 0.5

const VALID_STYLES = new Set(Object.values(DanceStyle))
const VALID_TYPES  = new Set(Object.values(EventType))
const VALID_LEVELS = new Set(Object.values(DanceLevel))

// Twilio webhook verification token
const WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN

/** GET: Twilio/Meta webhook verification */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (WEBHOOK_TOKEN && token === WEBHOOK_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

/** POST: Receive Twilio WhatsApp messages */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const from       = params.get('From') ?? ''        // whatsapp:+49...
    const msgBody    = params.get('Body') ?? ''
    const numMedia   = parseInt(params.get('NumMedia') ?? '0')
    const phone      = from.replace('whatsapp:', '')

    // Find user by phone (must be registered + verified)
    const user = await prisma.user.findUnique({ where: { phone } })

    // Handle cancellation text messages
    if (msgBody && detectCancellation(msgBody) && user) {
      const cancelled = await handleCancellation(msgBody, user.id)
      if (cancelled) {
        return NextResponse.json({ handled: 'cancellation' })
      }
    }

    // Handle media messages (flyer images)
    if (numMedia > 0) {
      const mediaUrl         = params.get('MediaUrl0') ?? ''
      const mediaContentType = params.get('MediaContentType0') ?? 'image/jpeg'

      if (!mediaUrl) return NextResponse.json({ error: 'No media URL' }, { status: 400 })
      if (!mediaContentType.startsWith('image/')) {
        return NextResponse.json({ handled: 'ignored_non_image' })
      }

      // Download image (Twilio requires auth for media URLs)
      const imageBase64 = await downloadTwilioMedia(mediaUrl)
      const safeType = toSafeMediaType(mediaContentType)

      // Save locally first
      const flyerUrl = await saveImageLocally(imageBase64, safeType)

      // AI analysis
      const extraction = await analyzeFlyer(imageBase64, safeType)

      if (!extraction.isEvent) {
        return NextResponse.json({ handled: 'ignored_not_event' })
      }

      if (extraction.confidence.overall < CONFIDENCE_REVIEW_THRESHOLD) {
        return NextResponse.json({ handled: 'ignored_low_confidence' })
      }

      const status: EventStatus = extraction.confidence.overall >= CONFIDENCE_AUTO_PUBLISH
        ? EventStatus.LIVE
        : EventStatus.ADMIN_REVIEW

      const danceStyle = (extraction.danceStyle ?? [])
        .map(s => s.toUpperCase())
        .filter(s => VALID_STYLES.has(s as DanceStyle)) as DanceStyle[]
      const eventType = VALID_TYPES.has(extraction.eventType as EventType)
        ? extraction.eventType as EventType : EventType.PARTY
      const level = VALID_LEVELS.has(extraction.level as DanceLevel)
        ? extraction.level as DanceLevel : DanceLevel.OPEN

      await prisma.event.create({
        data: {
          title:            extraction.title        ?? 'Unbekanntes Event',
          description:      extraction.description  ?? undefined,
          danceStyle,
          eventType,
          level,
          startDate:        new Date(extraction.startDate ?? Date.now()),
          endDate:          extraction.endDate ? new Date(extraction.endDate) : undefined,
          venueName:        extraction.venueName    ?? 'Unbekannt',
          address:          extraction.address      ?? 'Unbekannt',
          city:             extraction.city         ?? 'Unbekannt',
          price:            extraction.price        ?? undefined,
          flyerUrl,
          ticketUrl:        extraction.ticketUrl    ?? undefined,
          status,
          organizerId:      user?.id ?? undefined,
          confidenceScores: extraction.confidence as any,
          ingestSource:     `whatsapp:${phone}`,
        },
      })

      return NextResponse.json({ handled: 'event_created', status })
    }

    return NextResponse.json({ handled: 'no_action' })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleCancellation(text: string, userId: string): Promise<boolean> {
  // Find the most recent LIVE or ADMIN_REVIEW event owned by this user
  const event = await prisma.event.findFirst({
    where: {
      organizerId: userId,
      status: { in: [EventStatus.LIVE, EventStatus.ADMIN_REVIEW] },
    },
    orderBy: { startDate: 'asc' },
  })
  if (!event) return false
  await prisma.event.update({
    where: { id: event.id },
    data: { status: EventStatus.CANCELLED },
  })
  return true
}

async function downloadTwilioMedia(url: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const headers: Record<string, string> = {}
  if (accountSid && authToken) {
    headers['Authorization'] = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
  }
  const res = await fetch(url, { headers })
  const buffer = await res.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

async function saveImageLocally(base64: string, mediaType: string): Promise<string> {
  const ext = mediaType === 'image/png' ? '.png' : mediaType === 'image/webp' ? '.webp' : '.jpg'
  const filename = `${randomUUID()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), Buffer.from(base64, 'base64'))
  return `/uploads/${filename}`
}

function toSafeMediaType(ct: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (ct.includes('png'))  return 'image/png'
  if (ct.includes('gif'))  return 'image/gif'
  if (ct.includes('webp')) return 'image/webp'
  return 'image/jpeg'
}
