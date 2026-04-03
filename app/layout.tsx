import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'SonnetCal – Tanzevents in deiner Stadt',
  description: 'Salsa, Bachata, Kizomba und mehr – finde alle Tanzevents in deiner Region.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className={`${dmSerif.variable} ${dmSans.variable} font-body bg-night-950 text-night-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
