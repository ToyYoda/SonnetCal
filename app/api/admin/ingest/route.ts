import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { analyzeFlyer } from '@/lib/ai'
import { prisma } from '@/lib/prisma'
import { EventStatus, UserRole } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 120

const CONFIDENCE_AUTO_PUBLISH = 0.95

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Kein Bild angegeben' }, { status: 400 })
  }

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Ungültiges Bildformat' }, { status: 400 })
  }

  const bytes  = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const safeType = (ALLOWED.includes(file.type) ? file.type : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  const ext      = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg'
  const filename = `${randomUUID()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), Buffer.from(bytes))
  const flyerUrl = `/uploads/${filename}`

  let extraction
  try {
    extraction = await analyzeFlyer(base64, safeType)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `KI-Analyse fehlgeschlagen: ${msg}. Ist Ollama gestartet?` },
      { status: 502 }
    )
  }

  if (!extraction.isEvent) {
    return NextResponse.json({ isEvent: false, message: 'Kein Event-Flyer erkannt' })
  }

  const status: EventStatus = extraction.confidence.overall >= CONFIDENCE_AUTO_PUBLISH
    ? EventStatus.LIVE
    : EventStatus.ADMIN_REVIEW

  const event = await prisma.event.create({
    data: {
      title:            extraction.title       ?? 'Unbekanntes Event',
      description:      extraction.description ?? undefined,
      danceStyle:       (extraction.danceStyle ?? []) as any,
      eventType:        (extraction.eventType  ?? 'PARTY') as any,
      level:            (extraction.level      ?? 'OPEN') as any,
      startDate:        new Date(extraction.startDate ?? Date.now()),
      endDate:          extraction.endDate ? new Date(extraction.endDate) : undefined,
      venueName:        extraction.venueName   ?? 'Unbekannt',
      address:          extraction.address     ?? 'Unbekannt',
      city:             extraction.city        ?? 'Unbekannt',
      price:            extraction.price       ?? undefined,
      flyerUrl,
      ticketUrl:        extraction.ticketUrl   ?? undefined,
      status,
      organizerId:      session.userId,
      confidenceScores: extraction.confidence as any,
      ingestSource:     'manual_admin',
    },
  })

  return NextResponse.json({ isEvent: true, event, extraction, status }, { status: 201 })
}
