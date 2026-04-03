import Nav from '@/components/layout/Nav'

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="md:pt-16 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  )
}
