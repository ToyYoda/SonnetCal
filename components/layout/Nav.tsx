'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Plus, User, Music2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/calendar',    icon: Calendar,     label: 'Kalender' },
  { href: '/events/new',  icon: Plus,         label: 'Event' },
  { href: '/profile',     icon: User,         label: 'Profil' },
]

type Props = { isAdmin?: boolean }

export default function Nav({ isAdmin }: Props) {
  const pathname = usePathname()

  const allItems = isAdmin
    ? [...navItems, { href: '/admin/review', icon: ShieldCheck, label: 'Admin' }]
    : navItems

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-night-800/50 items-center px-6">
        <Link href="/calendar" className="flex items-center gap-2.5 mr-10">
          <div className="w-8 h-8 rounded-lg bg-neon-pink/20 flex items-center justify-center neon-border-pink">
            <Music2 className="w-4 h-4 text-neon-pink" />
          </div>
          <span className="font-display text-lg text-white tracking-wide">SonnetCal</span>
        </Link>

        <nav className="flex items-center gap-1">
          {allItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                pathname.startsWith(href)
                  ? 'bg-neon-pink/10 text-neon-pink border border-neon-pink/20'
                  : 'text-night-400 hover:text-white hover:bg-night-800/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-night-800/50">
        <div className="flex items-center justify-around px-2 py-3">
          {allItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200',
                  active ? 'text-neon-pink' : 'text-night-500 hover:text-night-200'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(255,45,120,0.7)]')} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
