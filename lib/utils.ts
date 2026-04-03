import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, fmt = 'dd. MMMM yyyy') {
  return format(new Date(date), fmt, { locale: de })
}

export function formatTime(date: Date | string) {
  return format(new Date(date), 'HH:mm', { locale: de })
}

export function formatDateRange(start: Date | string, end?: Date | string | null) {
  const s = new Date(start)
  if (!end) return formatDate(s)
  const e = new Date(end)
  if (isSameDay(s, e)) return `${formatDate(s)}, ${formatTime(s)}–${formatTime(e)}`
  return `${formatDate(s)} – ${formatDate(e)}`
}

export function getCalendarDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function isSameDate(a: Date, b: Date) {
  return isSameDay(a, b)
}

export function isCurrentMonth(day: Date, month: Date) {
  return isSameMonth(day, month)
}

export const DANCE_STYLE_LABELS: Record<string, string> = {
  SALSA:    'Salsa',
  BACHATA:  'Bachata',
  KIZOMBA:  'Kizomba',
  ZOUK:     'Zouk',
  TANGO:    'Tango',
  OTHER:    'Sonstiges',
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  PARTY:    'Party',
  WORKSHOP: 'Workshop',
  FESTIVAL: 'Festival',
  SOCIAL:   'Social',
}

export const LEVEL_LABELS: Record<string, string> = {
  OPEN:         'Open Level',
  BEGINNER:     'Anfänger',
  INTERMEDIATE: 'Fortgeschritten',
  ADVANCED:     'Profis',
}

export const DANCE_STYLE_COLORS: Record<string, string> = {
  SALSA:    'bg-neon-pink/20 text-neon-pink border-neon-pink/30',
  BACHATA:  'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
  KIZOMBA:  'bg-neon-teal/20 text-neon-teal border-neon-teal/30',
  ZOUK:     'bg-neon-amber/20 text-neon-amber border-neon-amber/30',
  TANGO:    'bg-red-500/20 text-red-400 border-red-500/30',
  OTHER:    'bg-night-600/40 text-night-300 border-night-500/30',
}

export const EVENT_TYPE_COLORS: Record<string, string> = {
  PARTY:    'bg-neon-pink/10 text-neon-pink',
  WORKSHOP: 'bg-blue-500/10 text-blue-400',
  FESTIVAL: 'bg-neon-amber/10 text-neon-amber',
  SOCIAL:   'bg-neon-teal/10 text-neon-teal',
}
