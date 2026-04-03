# SonnetCal 🕺💃

> KI-gestützter Tanz-Event-Kalender für die Tanzszene am Oberrhein

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Datenbank**: PostgreSQL + Prisma ORM
- **Auth**: JWT + WhatsApp OTP
- **Styling**: Tailwind CSS (Dark Mode)
- **Sprache**: TypeScript

## Phase 1 – Umgesetzt

| User Story | Status |
|---|---|
| US.01 Kalenderansicht + Filter | ✅ |
| US.02 Monat/Listen-Ansicht Toggle | ✅ |
| US.03 Filterprofile (Tanzstil, Level, Typ) | ✅ |
| US.04 Social Attendance ("Bin dabei") | ✅ |
| US.05 Karte + Route planen | ✅ |
| US.12 Veranstalter-Formular | ✅ |
| US.18 WhatsApp-OTP Auth | ✅ |

## Setup

### 1. Repository klonen & Dependencies installieren

```bash
git clone https://github.com/ToyYoda/SonnetCal.git
cd SonnetCal
npm install
```

### 2. Environment-Variablen

```bash
cp .env.example .env
```

Trage deine Werte ein:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sonnetcal"
JWT_SECRET="dein-geheimer-key"
```

### 3. Datenbank einrichten

```bash
# Schema pushen
npm run db:push

# Mit Demo-Daten befüllen
npm run db:seed
```

### 4. Dev-Server starten

```bash
npm run dev
```

→ App läuft auf [http://localhost:3000](http://localhost:3000)

## Projektstruktur

```
sonnetcal/
├── app/
│   ├── api/
│   │   ├── auth/           # send-otp, verify-otp, logout, me
│   │   └── events/         # CRUD + Attendance
│   ├── calendar/           # Hauptseite
│   ├── event/[id]/         # Event-Detailseite
│   ├── events/new/         # Neues Event anlegen
│   └── profile/            # Login + Profil
├── components/
│   ├── calendar/           # CalendarClient, MonthGrid
│   ├── events/             # EventCard, EventForm, AttendButton
│   ├── layout/             # Nav
│   └── ui/                 # AuthFlow
├── lib/
│   ├── auth.ts             # JWT, OTP, Sessions
│   ├── prisma.ts           # DB Client
│   ├── utils.ts            # Helpers, Labels, Colors
│   └── validations.ts      # Zod Schemas
└── prisma/
    ├── schema.prisma        # Datenmodell
    └── seed.ts              # Demo-Daten
```

## API-Übersicht

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/events` | Events mit Filtern abrufen |
| POST | `/api/events` | Neues Event erstellen |
| GET | `/api/events/:id` | Event-Details |
| PATCH | `/api/events/:id` | Event bearbeiten |
| DELETE | `/api/events/:id` | Event löschen |
| POST | `/api/events/:id/attend` | Teilnahme togglen |
| GET | `/api/events/:id/attend` | Teilnahmestatus |
| POST | `/api/auth/send-otp` | OTP senden |
| POST | `/api/auth/verify-otp` | OTP verifizieren |
| POST | `/api/auth/logout` | Abmelden |
| GET | `/api/auth/me` | Aktueller User |

## WhatsApp-Integration

Im Dev-Modus wird der OTP-Code direkt im Browser angezeigt und in der Konsole geloggt.  
Für Production: Twilio oder 360dialog konfigurieren in `app/api/auth/send-otp/route.ts`.

## Phase 2 – Ausblick

- WhatsApp-Bot (Flyer-Ingestion)
- LLM-Extraktion (Llama 3 Vision)
- Admin-Review-Interface
- Confidence-Score-Routing
- iCal/ICS-Export
