'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, Sparkles } from 'lucide-react'

export default function IngestForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/admin/ingest', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setResult(`Fehler: ${data.error}`); return }
      if (!data.isEvent) { setResult('Kein Event-Flyer erkannt.'); return }
      const pct = Math.round((data.extraction?.confidence?.overall ?? 0) * 100)
      setResult(
        data.status === 'LIVE'
          ? `✅ Automatisch veröffentlicht (${pct}% Konfidenz)`
          : `🔍 Zur Review hinzugefügt (${pct}% Konfidenz)`
      )
      setTimeout(() => router.refresh(), 2500)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-night-700 hover:border-neon-pink/40 hover:bg-neon-pink/5 transition-all text-night-400 hover:text-neon-pink text-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'KI analysiert…' : 'Flyer hochladen & KI-Analyse starten'}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      {result && <p className="mt-2 text-sm text-night-300">{result}</p>}
    </div>
  )
}
