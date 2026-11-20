import { z } from 'zod';
export const categories = [
  'Outdoors',
  'Books',
  'Arts & culture',
  'Food & drink',
  'Games & socials',
  'Music',
] as const;
export const cities = [
  'Cape Town',
  'Johannesburg',
  'Durban',
  'Pretoria',
  'Gqeberha',
  'Stellenbosch',
] as const;
export const venueSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(20).max(2000),
  city: z.enum(cities),
  address: z.string().trim().min(5).max(200),
  category: z.string().trim().min(2).max(50),
  website: z.union([z.literal(''), z.url().refine((v) => /^https?:\/\//.test(v))]).default(''),
});
export const eventSchema = z.object({
  venue_id: z.string().min(1),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(30).max(5000),
  category: z.enum(categories),
  starts_at: z.iso
    .datetime({ offset: true })
    .refine((v) => new Date(v).getTime() > Date.now(), 'Choose a future date'),
  duration: z.number().int().min(15).max(1440),
  capacity: z.number().int().min(1).max(1000),
  image: z.enum(['coffee', 'books', 'clay', 'dinner', 'garden', 'music']).default('coffee'),
  status: z.enum(['draft', 'pending']).default('draft'),
});
