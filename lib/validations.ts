import { z } from 'zod'

export const EventCreateSchema = z.object({
  title:       z.string().min(3, 'Titel ist zu kurz').max(120),
  description: z.string().max(2000).optional(),
  danceStyle:  z.array(z.enum(['SALSA','BACHATA','KIZOMBA','ZOUK','TANGO','OTHER'])).min(1, 'Mindestens einen Tanzstil wählen'),
  eventType:   z.enum(['PARTY','WORKSHOP','FESTIVAL','SOCIAL']),
  level:       z.enum(['OPEN','BEGINNER','INTERMEDIATE','ADVANCED']),
  startDate:   z.string().datetime(),
  endDate:     z.string().datetime().optional(),
  doorTime:    z.string().datetime().optional(),
  venueName:   z.string().min(2, 'Veranstaltungsort ist erforderlich'),
  address:     z.string().min(5, 'Adresse ist erforderlich'),
  city:        z.string().min(2, 'Stadt ist erforderlich'),
  price:       z.string().optional(),
  flyerUrl:    z.string().optional().or(z.literal('')),
  ticketUrl:   z.string().url('Bitte eine gültige URL eingeben').optional().or(z.literal('')),
})

export const EventUpdateSchema = EventCreateSchema.partial().extend({
  id: z.string().cuid(),
})

export const PhoneSchema = z.object({
  phone: z.string().regex(/^\+\d{7,15}$/, 'Ungültige Telefonnummer (z.B. +49123456789)'),
})

export const OtpVerifySchema = z.object({
  phone: z.string(),
  code:  z.string().length(6, 'Der Code muss 6 Ziffern haben'),
})

export const EventFilterSchema = z.object({
  danceStyle: z.string().optional(),
  eventType:  z.string().optional(),
  level:      z.string().optional(),
  city:       z.string().optional(),
  from:       z.string().optional(),
  to:         z.string().optional(),
  search:     z.string().optional(),
})

export type EventCreateInput = z.infer<typeof EventCreateSchema>
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>
export type EventFilterInput = z.infer<typeof EventFilterSchema>
