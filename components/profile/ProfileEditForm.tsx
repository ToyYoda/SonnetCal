'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Save, Loader2, Pencil, X } from 'lucide-react'

type Props = {
  name: string | null
  avatarUrl: string | null
  phone: string
}

export default function ProfileEditForm({ name, avatarUrl, phone }: Props) {
  const [open, setOpen]         = useState(false)
  const [nameVal, setName]      = useState(name ?? '')
  const [avatar, setAvatar]     = useState<string | null>(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const fileRef                 = useRef<HTMLInputElement>(null)
  const router                  = useRouter()

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvatar(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal || undefined, avatarUrl: avatar ?? undefined }),
      })
      if (!res.ok) { setError('Speichern fehlgeschlagen'); return }
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1.5 text-xs text-night-500 hover:text-neon-pink transition-colors mx-auto"
      >
        <Pencil className="w-3 h-3" />
        Profil bearbeiten
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-3 text-left animate-in">
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border border-night-700" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-pink/30 to-neon-purple/30 border border-neon-pink/20 flex items-center justify-center">
              <span className="font-display text-3xl text-white">
                {(nameVal || phone)[0].toUpperCase()}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-neon-pink flex items-center justify-center shadow-lg hover:bg-neon-pink/80 transition-colors"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
        {avatar && (
          <button onClick={() => setAvatar(null)} className="text-xs text-night-500 hover:text-red-400 transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Bild entfernen
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-night-400 mb-1">Anzeigename</label>
        <input
          className="input-field"
          placeholder="Dein Name"
          value={nameVal}
          onChange={e => setName(e.target.value)}
          maxLength={60}
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="btn-ghost flex-1">Abbrechen</button>
        <button onClick={save} disabled={saving} className="btn-primary flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>
    </div>
  )
}
