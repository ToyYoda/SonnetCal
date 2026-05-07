const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? 'llama3.2-vision'

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
  "isEvent": true,
  "title": "Eventname",
  "description": "Beschreibung oder null",
  "danceStyle": ["SALSA","BACHATA","KIZOMBA","ZOUK","TANGO","OTHER"],
  "eventType": "PARTY",
  "level": "OPEN",
  "startDate": "2025-06-15T21:00:00",
  "endDate": null,
  "venueName": "Club XY",
  "address": "Musterstraße 1",
  "city": "Basel",
  "price": "CHF 15",
  "ticketUrl": null,
  "confidence": {
    "title": 0.95,
    "startDate": 0.88,
    "venueName": 0.91,
    "address": 0.72,
    "city": 0.95,
    "danceStyle": 0.98,
    "overall": 0.90
  }
}

Regeln:
- danceStyle: nur aus [SALSA, BACHATA, KIZOMBA, ZOUK, TANGO, OTHER]
- eventType: nur PARTY, WORKSHOP, FESTIVAL oder SOCIAL
- level: nur OPEN, BEGINNER, INTERMEDIATE oder ADVANCED
- startDate: ISO-8601, Jahr ${new Date().getFullYear()} wenn nicht angegeben
- confidence: 0.0–1.0 je nach Lesbarkeit/Eindeutigkeit
- Falls KEIN Tanzveranstaltungs-Flyer: {"isEvent": false, alles andere null}`

async function ollamaChat(prompt: string, imageBase64?: string): Promise<string> {
  const message: Record<string, unknown> = { role: 'user', content: prompt }
  if (imageBase64) message.images = [imageBase64]

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [message],
      stream: false,
      format: 'json',
      options: { temperature: 0 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ollama error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.message?.content ?? ''
}

function extractFirstJson(text: string): string {
  const start = text.indexOf('{')
  if (start === -1) throw new Error('Kein JSON in Ollama-Antwort gefunden')

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape)              { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"')          { inString = !inString; continue }
    if (inString)            continue
    if (ch === '{') depth++
    if (ch === '}') { depth--; if (depth === 0) return text.slice(start, i + 1) }
  }

  throw new Error('Unvollständiges JSON in Ollama-Antwort')
}

export async function analyzeFlyer(
  imageBase64: string,
  _mediaType: string
): Promise<FlyerExtraction> {
  const raw = await ollamaChat(EXTRACTION_PROMPT, imageBase64)
  const jsonStr = extractFirstJson(raw)
  return JSON.parse(jsonStr) as FlyerExtraction
}

export async function analyzeFlyerFromUrl(imageUrl: string): Promise<FlyerExtraction> {
  const res = await fetch(imageUrl)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const ct = res.headers.get('content-type') ?? 'image/jpeg'
  return analyzeFlyer(base64, ct)
}

const CANCELLATION_KEYWORDS = [
  'fällt aus', 'abgesagt', 'storniert', 'cancelled', 'findet nicht statt',
  'verschoben', 'entfällt', 'wird abgesagt',
]

export function detectCancellation(text: string): boolean {
  const lower = text.toLowerCase()
  return CANCELLATION_KEYWORDS.some(kw => lower.includes(kw))
}
