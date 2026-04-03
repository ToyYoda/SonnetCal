import Nav from '@/components/layout/Nav'
import EventForm from '@/components/events/EventForm'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewEventPage() {
  const session = await getSession()
  if (!session) redirect('/profile')

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="md:pt-16 pb-24 md:pb-8 max-w-2xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-white">
            Event <span className="text-gradient-pink">anlegen</span>
          </h1>
          <p className="text-night-400 text-sm mt-1">Erstelle ein neues Tanzevent für die Community</p>
        </div>
        <EventForm />
      </main>
    </div>
  )
}
