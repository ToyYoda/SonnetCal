'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, KeyRound, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'otp'

export default function AuthFlow() {
  const [step, setStep]         = useState<Step>('phone')
  const [phone, setPhone]       = useState('')
  const [otp, setOtp]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [devOtp, setDevOtp]     = useState<string>('')
  const router = useRouter()

  const sendOtp = async () => {
    setError('')
    const normalized = phone.trim().replace(/\s/g, '')
    if (!/^\+\d{7,15}$/.test(normalized)) {
      setError('Bitte eine gültige Nummer eingeben (z.B. +49123456789)')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = typeof data.error === 'string'
          ? data.error
          : data.error?.formErrors?.[0] ?? 'Fehler beim Senden'
        setError(msg)
        return
      }
      if (data.devOtp) setDevOtp(data.devOtp)
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setError('')
    if (otp.length !== 6) { setError('Bitte 6-stelligen Code eingeben'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: otp }),
      })
      if (res.ok) {
        router.push('/calendar')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Ungültiger Code')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {step === 'phone' ? (
        <div className="card animate-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-neon-teal/10 border border-neon-teal/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-neon-teal" />
            </div>
            <div>
              <p className="text-white font-medium">WhatsApp-Nummer</p>
              <p className="text-night-500 text-xs">Wir schicken dir einen 6-stelligen Code</p>
            </div>
          </div>

          <input
            type="tel"
            className="input-field mb-3"
            placeholder="+49 123 456 789"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendOtp()}
            autoFocus
          />

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <button onClick={sendOtp} disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            Code senden
          </button>
        </div>
      ) : (
        <div className="card animate-in">
          <button onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            className="btn-ghost pl-0 mb-4 text-night-400">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <p className="text-white font-medium">Code eingeben</p>
              <p className="text-night-500 text-xs">Gesendet an {phone}</p>
            </div>
          </div>

          {devOtp && (
            <div className="bg-neon-amber/10 border border-neon-amber/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-neon-amber text-xs font-medium">🔧 Dev-Modus: Code ist <strong>{devOtp}</strong></p>
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="input-field mb-3 text-center text-2xl tracking-[0.4em] font-display"
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && verifyOtp()}
            autoFocus
          />

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Verifizieren
          </button>
        </div>
      )}
    </div>
  )
}
