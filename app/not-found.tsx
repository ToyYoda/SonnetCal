import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-8xl text-neon-pink/30 mb-4">404</p>
        <h1 className="font-display text-3xl text-white mb-2">Seite nicht gefunden</h1>
        <p className="text-night-400 mb-6">Diese Seite existiert nicht oder wurde verschoben.</p>
        <Link href="/calendar" className="btn-primary">
          Zum Kalender
        </Link>
      </div>
    </div>
  )
}
