import { PrismaClient, DanceStyle, EventType, DanceLevel, EventStatus, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create demo admin
  const admin = await prisma.user.upsert({
    where: { phone: '+49123456789' },
    update: {},
    create: {
      phone: '+49123456789',
      name: 'Admin',
      role: UserRole.ADMIN,
      verified: true,
    },
  })

  // Create demo organizers
  const org1 = await prisma.user.upsert({
    where: { phone: '+49111111111' },
    update: {},
    create: { phone: '+49111111111', name: 'SalsaKings Basel', role: UserRole.ORGANIZER, verified: true },
  })
  const org2 = await prisma.user.upsert({
    where: { phone: '+49222222222' },
    update: {},
    create: { phone: '+49222222222', name: 'Bachata Vibes Freiburg', role: UserRole.ORGANIZER, verified: true },
  })

  const now = new Date()
  const d = (days: number, hour = 21) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + days)
    dt.setHours(hour, 0, 0, 0)
    return dt
  }

  const events = [
    {
      title: 'Salsa Night Basel',
      description: 'Die heißeste Salsa-Party am Rhein! Mit Live-Band und Top-DJs aus der ganzen Schweiz.',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.SALSA],
      eventType: EventType.PARTY,
      level: DanceLevel.OPEN,
      startDate: d(2),
      endDate: d(2, 3),
      venueName: 'Cargo Club',
      address: 'Rheinweg 38',
      city: 'Basel',
      lat: 47.5596,
      lng: 7.5886,
      price: 'CHF 15',
      organizerId: org1.id,
    },
    {
      title: 'Bachata Sensual Workshop',
      description: 'Intensiv-Workshop für Fortgeschrittene. Körperwellen, Dips und Styling.',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.BACHATA],
      eventType: EventType.WORKSHOP,
      level: DanceLevel.INTERMEDIATE,
      startDate: d(4, 15),
      endDate: d(4, 18),
      venueName: 'Tanzstudio Freiburg',
      address: 'Kaiser-Joseph-Str. 268',
      city: 'Freiburg',
      lat: 47.9990,
      lng: 7.8421,
      price: '€ 35',
      organizerId: org2.id,
    },
    {
      title: 'Kizomba & Urban Kiz Night',
      description: 'Entspannte Atmosphäre, smoother Kizomba und coole Urban Kiz Tracks.',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.KIZOMBA],
      eventType: EventType.PARTY,
      level: DanceLevel.OPEN,
      startDate: d(6),
      endDate: d(6, 4),
      venueName: 'Club Unique',
      address: 'Grünwälderstr. 16',
      city: 'Freiburg',
      lat: 47.9959,
      lng: 7.8494,
      price: '€ 12',
      organizerId: org2.id,
    },
    {
      title: 'Salsa & Bachata Festival',
      description: '3-Tage-Festival mit über 20 Workshops, Shows und Parties. Die größte Latino-Dance-Convention am Oberrhein.',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.SALSA, DanceStyle.BACHATA],
      eventType: EventType.FESTIVAL,
      level: DanceLevel.OPEN,
      startDate: d(14),
      endDate: d(16, 4),
      venueName: 'Messe Basel',
      address: 'Messeplatz 10',
      city: 'Basel',
      lat: 47.5636,
      lng: 7.5885,
      price: 'ab CHF 79',
      organizerId: org1.id,
    },
    {
      title: 'Salsa Anfänger-Kurs',
      description: 'Perfekt für absolute Anfänger. In 6 Wochen zur ersten Party – garantiert!',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.SALSA],
      eventType: EventType.WORKSHOP,
      level: DanceLevel.BEGINNER,
      startDate: d(8, 18),
      endDate: d(8, 20),
      venueName: 'Tanzschule Rhythmus',
      address: 'Steinenvorstadt 65',
      city: 'Basel',
      lat: 47.5534,
      lng: 7.5868,
      price: 'CHF 25',
      organizerId: org1.id,
    },
    {
      title: 'Latin Social – Donnerstag Special',
      description: 'Casual Social Dancing. Komm wie du bist, tanz die Nacht durch.',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.SALSA, DanceStyle.BACHATA, DanceStyle.KIZOMBA],
      eventType: EventType.SOCIAL,
      level: DanceLevel.OPEN,
      startDate: d(1),
      endDate: d(1, 2),
      venueName: 'La Paloma Lounge',
      address: 'Güterstraße 12',
      city: 'Freiburg',
      lat: 47.9975,
      lng: 7.8435,
      price: 'Eintritt frei',
      organizerId: org2.id,
    },
    {
      title: 'Zouk Sensual Night',
      description: 'Brazilian Zouk in seiner schönsten Form. DJ Pedro aus São Paulo legt auf.',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.ZOUK],
      eventType: EventType.PARTY,
      level: DanceLevel.OPEN,
      startDate: d(10),
      endDate: d(10, 4),
      venueName: 'Café Brasil',
      address: 'Martinsgasse 3',
      city: 'Basel',
      lat: 47.5582,
      lng: 7.5904,
      price: 'CHF 10',
      organizerId: org1.id,
    },
    {
      title: 'Bachata Styling für Leaders',
      description: 'Exklusiver Workshop: Körperausdruck, Footwork und Musicality für Leaders.',
      status: EventStatus.LIVE,
      danceStyle: [DanceStyle.BACHATA],
      eventType: EventType.WORKSHOP,
      level: DanceLevel.ADVANCED,
      startDate: d(12, 14),
      endDate: d(12, 17),
      venueName: 'Dance Academy Freiburg',
      address: 'Wilhelmstr. 10',
      city: 'Freiburg',
      lat: 48.0011,
      lng: 7.8432,
      price: '€ 45',
      organizerId: org2.id,
    },
  ]

  for (const event of events) {
    await prisma.event.create({ data: event })
  }

  console.log(`✅ Seed complete: ${events.length} events, 3 users created`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
