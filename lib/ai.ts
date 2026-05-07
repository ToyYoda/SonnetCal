import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ConfidenceScores = {
  title: number
  startDate: number
  venueName: number
  address: number
  city: number
  danceStyle: number
  overall: number
}

export type FlyerExtraction = {
  isEvent: boolean
  title: string | null
  description: string | null
  danceStyle: string[]
  eventType: 'PARTY' | 'WORKSHOP' | 'FESTIVAL' | 'SOCIAL' | null
  level: 'OPEN' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null
  startDate: string | null
  endDate: string | null
  venueName: string | null
  address: string | null
  city: string | null
  price: string | null
  ticketUrl: string | null
  confidence: ConfidenceScores
}

const EXTRACTION_PROMPT = `Du analysierst ein Bild und bestimmst ob es ein Tanzveranstaltungs-Flyer ist.

Antworte NUR mit einem validen JSON-Objekt (kein Markdown, keine Erklärung):
{
  "isEvent": true/false,
  "title": "Eventname oder null",
  "description": "Beschreibung oder null",
  "danceStyle": ["SALSA","BACHATA","KIZOMBA","ZOUK","TANGO","OTHER"] (nur erkannte Stile),
  "eventType": "PARTY"|"WORKSHOP"|"FESTIVAL"|"SOCIAL"|null,
  "level": "OPEN"|"BEGINNER"|"INTERMEDIATE"|"ADVANCED"|null,
  "startDate": "ISO-8601-Datetime oder null (Jahr ${new Date().getFullYear()} wenn nicht angegeben)",
  "endDate": "ISO-8601-Datetime oder null",
  "venueName": "Location-Name oder null",
  "address": "Straße + Nr. oder null",
  "city": "Stadtname oder null",
  "price": "Eintrittspreistext oder null",
  "ticketUrl": "Ticket-URL oder null",
  "confidence": {
    "title": 0.0–1.0,
    "startDate": 0.0–1.0,
    "venueName": 0.0–1.0,
    "address": 0.0–1.0,
    "city": 0.0–1.0,
    "danceStyle": 0.0–1.0,
    "overall": 0.0–1.0
  }
}

Erkennbare Tanzstile: Salsa, Bachata, Kizomba, Zouk, Tango.
Falls kein Tanzveranstaltungs-Flyer: isEvent=false, alle Felder null.`

export async function analyzeFlyer(
  imageData: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<FlyerExtraction> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imageData },
        },
        { type: 'text', text: EXTRACTION_PROMPT },
      ],
    }],
  })

  const text = (msg.content[0] as Anthropic.TextBlock).text.trim()
  // Strip potential markdown fences
  const json = text.startsWith('```') ? text.replace(/```[a-z]*\n?/g, '').trim() : text
  return JSON.parse(json) as FlyerExtraction
}

export async function analyzeFlyerFromUrl(imageUrl: string): Promise<FlyerExtraction> {
  const res = await fetch(imageUrl)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const contentType = (res.headers.get('content-type') ?? 'image/jpeg') as FlyerExtraction['danceStyle'] extends string[] ? never : 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  return analyzeFlyer(base64, contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
}

const CANCELLATION_KEYWORDS = [
  'fällt aus', 'abgesagt', 'storniert', 'cancelled', 'findet nicht statt',
  'verschoben', 'abgesagt', 'entfällt', 'wird abgesagt',
]

export function detectCancellation(text: string): boolean {
  const lower = text.toLowerCase()
  return CANCELLATION_KEYWORDS.some(kw => lower.includes(kw))
}
