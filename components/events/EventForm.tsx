'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DANCE_STYLES = ['SALSA','BACHATA','KIZOMBA','ZOUK','TANGO','OTHER']
const EVENT_TYPES  = ['PARTY','WORKSHOP','FESTIVAL','SOCIAL']
const LEVELS       = ['OPEN','BEGINNER','INTERMEDIATE','ADVANCED']

const DANCE_LABELS: Record<string,string> = { SALSA:'Salsa', BACHATA:'Bachata', KIZOMBA:'Kizomba', ZOUK:'Zouk', TANGO:'Tango', OTHER:'Sonstiges' }
const TYPE_LABELS:  Record<string,string> = { PARTY:'Party', WORKSHOP:'Workshop', FESTIVAL:'Festival', SOCIAL:'Social' }
const LEVEL_LABELS: Record<string,string> = { OPEN:'Open Level', BEGINNER:'Anfänger', INTERMEDIATE:'Fortgeschritten', ADVANCED:'Profis' }

type FormData = {
  title: string
  description: string
  danceStyle: string[]
  eventType: string
  level: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  venueName: string
  address: string
  city: string
  price: string
  flyerUrl: string
  ticketUrl: string
}

const initial: FormData = {
  title:'', description:'', danceStyle:[], eventType:'PARTY', level:'OPEN',
  startDate:'', startTime:'21:00', endDate:'', endTime:'03:00',
  venueName:'', address:'', city:'', price:'', flyerUrl:'', ticketUrl:'',
}

type Errors = Partial<Record<keyof FormData, string>>

export default function EventForm({ defaultValues }: { defaultValues?: Partial<FormData> }) {
  const [form, setForm] = useState<FormData>({ ...initial, ...defaultValues })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const set = (key: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  const toggleStyle = (style: string) => {
    setForm(f => ({
      ...f,
      danceStyle: f.danceStyle.includes(style)
        ? f.danceStyle.filter(s => s !== style)
        : [...f.danceStyle, style],
    }))
    if (errors.danceStyle) setErrors(e => ({ ...e, danceStyle: undefined }))
  }

  const validate = (): boolean => {
    const e: Errors = {}
    if (!form.title.trim())     e.title     = 'Titel ist erforderlich'
    if (form.title.length < 3)  e.title     = 'Titel zu kurz (min. 3 Zeichen)'
    if (!form.danceStyle.length) e.danceStyle = 'Mindestens einen Tanzstil wählen'
    if (!form.startDate)        e.startDate  = 'Startdatum ist erforderlich'
    if (!form.venueName.trim()) e.venueName  = 'Veranstaltungsort ist erforderlich'
    if (!form.address.trim())   e.address    = 'Adresse ist erforderlich'
    if (!form.city.trim())      e.city       = 'Stadt ist erforderlich'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)

    const toISO = (date: string, time: string) => date ? new Date(`${date}T${time}`).toISOString() : undefined

    const payload = {
      title:       form.title,
      description: form.description || undefined,
      danceStyle:  form.danceStyle,
      eventType:   form.eventType,
      level:       form.level,
      startDate:   toISO(form.startDate, form.startTime)!,
      endDate:     form.endDate ? toISO(form.endDate, form.endTime) : undefined,
      venueName:   form.venueName,
      address:     form.address,
      city:        form.city,
      price:       form.price || undefined,
      flyerUrl:    form.flyerUrl || undefined,
      ticketUrl:   form.ticketUrl || undefined,
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const { event } = await res.json()
        setSuccess(true)
        setTimeout(() => router.push(`/event/${event.id}`), 1000)
      } else {
        const { error } = await res.json()
        if (typeof error === 'object' && error.fieldErrors) {
          setErrors(error.fieldErrors)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card text-center py-16 animate-in">
        <p className="text-4xl mb-3">🎉</p>
        <p className="text-white font-medium text-lg">Event erstellt!</p>
        <p className="text-night-400 text-sm mt-1">Wird zur Überprüfung eingereicht…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in">
      {/* Basics */}
      <Section title="Grundinfos">
        <Field label="Titel *" error={errors.title}>
          <input className="input-field" placeholder="z.B. Salsa Night Basel" value={form.title} onChange={e => set('title', e.target.value)} />
        </Field>
        <Field label="Beschreibung" error={errors.description}>
          <textarea className="input-field min-h-[100px] resize-none" placeholder="Was erwartet die Gäste?" value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
      </Section>

      {/* Dance style */}
      <Section title="Tanzstil *">
        {errors.danceStyle && <p className="text-red-400 text-xs mb-2">{errors.danceStyle}</p>}
        <div className="flex flex-wrap gap-2">
          {DANCE_STYLES.map(s => (
            <button key={s} type="button" onClick={() => toggleStyle(s)}
              className={cn('px-3 py-1.5 rounded-full text-sm border transition-all',
                form.danceStyle.includes(s)
                  ? 'bg-neon-pink/15 text-neon-pink border-neon-pink/30'
                  : 'glass-sm text-night-300 border-night-700/50 hover:text-white'
              )}>
              {DANCE_LABELS[s]}
            </button>
          ))}
        </div>
      </Section>

      {/* Type + Level */}
      <Section title="Art & Level">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event-Typ">
            <select className="input-field" value={form.eventType} onChange={e => set('eventType', e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Level">
            <select className="input-field" value={form.level} onChange={e => set('level', e.target.value)}>
              {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Date/Time */}
      <Section title="Datum & Uhrzeit">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Startdatum *" error={errors.startDate}>
            <input type="date" className="input-field" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </Field>
          <Field label="Startzeit">
            <input type="time" className="input-field" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
          </Field>
          <Field label="Enddatum">
            <input type="date" className="input-field" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </Field>
          <Field label="Endzeit">
            <input type="time" className="input-field" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Location */}
      <Section title="Veranstaltungsort">
        <Field label="Name der Location *" error={errors.venueName}>
          <input className="input-field" placeholder="z.B. Cargo Club" value={form.venueName} onChange={e => set('venueName', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Adresse *" error={errors.address}>
            <input className="input-field" placeholder="Straße + Nr." value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <Field label="Stadt *" error={errors.city}>
            <input className="input-field" placeholder="Basel" value={form.city} onChange={e => set('city', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Optional */}
      <Section title="Weitere Infos">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Eintritt">
            <input className="input-field" placeholder="z.B. CHF 15" value={form.price} onChange={e => set('price', e.target.value)} />
          </Field>
          <Field label="Flyer-URL">
            <input type="url" className="input-field" placeholder="https://…" value={form.flyerUrl} onChange={e => set('flyerUrl', e.target.value)} />
          </Field>
        </div>
        <Field label="Ticket-URL">
          <input type="url" className="input-field" placeholder="https://…" value={form.ticketUrl} onChange={e => set('ticketUrl', e.target.value)} />
        </Field>
      </Section>

      {/* Submit */}
      <button onClick={submit} disabled={loading} className="btn-primary w-full py-3.5 text-base">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? 'Wird gespeichert…' : 'Event einreichen'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3">
      <h2 className="text-xs font-semibold text-night-400 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-night-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
