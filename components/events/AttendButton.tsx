'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Users, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  eventId: string
  initialAttending: boolean
  initialCount: number
  isLoggedIn: boolean
}

export default function AttendButton({ eventId, initialAttending, initialCount, isLoggedIn }: Props) {
  const [attending, setAttending] = useState(initialAttending)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const toggle = async () => {
    if (!isLoggedIn) {
      router.push('/profile')
      return
    }

    // Optimistic update
    setAttending(a => !a)
    setCount(c => attending ? c - 1 : c + 1)

    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/attend`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setAttending(data.attending)
        setCount(data.count)
      } else {
        // Revert on error
        setAttending(a => !a)
        setCount(c => attending ? c + 1 : c - 1)
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        'w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl font-medium transition-all duration-200',
        attending
          ? 'bg-neon-pink text-white neon-glow-pink hover:brightness-110'
          : 'glass text-night-200 hover:text-white hover:bg-night-700/40',
        isPending && 'opacity-70 cursor-not-allowed'
      )}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={cn('w-4 h-4 transition-all', attending && 'fill-current scale-110')} />
      )}
      <span>{attending ? 'Ich bin dabei!' : 'Bin dabei'}</span>
      {count > 0 && (
        <span className={cn(
          'flex items-center gap-1 text-sm',
          attending ? 'text-white/80' : 'text-night-400'
        )}>
          <Users className="w-3.5 h-3.5" />
          {count}
        </span>
      )}
    </button>
  )
}
