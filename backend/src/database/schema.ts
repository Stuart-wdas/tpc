import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  bigserial,
  index,
  unique,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';

export type UserRole = 'member' | 'business' | 'admin';
const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

// Preserve the original Better Auth table and column names when adopting existing databases.
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: instant('createdAt').notNull().defaultNow(),
  updatedAt: instant('updatedAt').notNull().defaultNow(),
  username: text('username').unique(),
  displayUsername: text('displayUsername'),
  role: text('role').$type<UserRole>().notNull().default('member'),
  disabled: boolean('disabled').notNull().default(false),
});
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: instant('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: instant('createdAt').notNull().defaultNow(),
    updatedAt: instant('updatedAt').notNull().defaultNow(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
);
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: instant('accessTokenExpiresAt'),
    refreshTokenExpiresAt: instant('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: instant('createdAt').notNull().defaultNow(),
    updatedAt: instant('updatedAt').notNull().defaultNow(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: instant('expiresAt').notNull(),
    createdAt: instant('createdAt').notNull().defaultNow(),
    updatedAt: instant('updatedAt').notNull().defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const profiles = pgTable('profiles', {
  user_id: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  city: text('city').notNull().default('Cape Town'),
  interests: text('interests')
    .array()
    .notNull()
    .default(sql`'{}'`),
});
export const venues = pgTable(
  'venues',
  {
    id: text('id').primaryKey(),
    owner_id: text('owner_id')
      .notNull()
      .references(() => user.id),
    name: text('name').notNull(),
    description: text('description').notNull(),
    city: text('city').notNull(),
    address: text('address').notNull(),
    category: text('category').notNull(),
    website: text('website').notNull().default(''),
    status: text('status').notNull().default('pending'),
    review_note: text('review_note').notNull().default(''),
    created_at: instant('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('venues_owner').on(table.owner_id),
    check('venues_status_check', sql`${table.status} IN ('pending','approved','rejected')`),
  ],
);
export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey(),
    venue_id: text('venue_id')
      .notNull()
      .references(() => venues.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    starts_at: instant('starts_at').notNull(),
    duration: integer('duration').notNull(),
    capacity: integer('capacity').notNull(),
    price: integer('price').notNull().default(0),
    image: text('image').notNull().default('coffee'),
    status: text('status').notNull().default('draft'),
    review_note: text('review_note').notNull().default(''),
    created_at: instant('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('events_discovery').on(table.status, table.starts_at),
    check('events_duration_check', sql`${table.duration} BETWEEN 15 AND 1440`),
    check('events_capacity_check', sql`${table.capacity} BETWEEN 1 AND 1000`),
    check('events_price_check', sql`${table.price} = 0`),
    check(
      'events_status_check',
      sql`${table.status} IN ('draft','pending','approved','rejected','cancelled')`,
    ),
  ],
);
export const bookings = pgTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    event_id: text('event_id')
      .notNull()
      .references(() => events.id),
    user_id: text('user_id')
      .notNull()
      .references(() => user.id),
    status: text('status').notNull().default('confirmed'),
    checked_in: boolean('checked_in').notNull().default(false),
    created_at: instant('created_at').notNull().defaultNow(),
  },
  (table) => [
    unique('bookings_event_id_user_id_key').on(table.event_id, table.user_id),
    index('bookings_event_status').on(table.event_id, table.status),
    check('bookings_status_check', sql`${table.status} IN ('confirmed','cancelled')`),
  ],
);
export const savedEvents = pgTable(
  'saved_events',
  {
    user_id: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    event_id: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.event_id] })],
);
export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actor_id: text('actor_id').references(() => user.id),
  action: text('action').notNull(),
  target_id: text('target_id').notNull(),
  note: text('note').notNull().default(''),
  created_at: instant('created_at').defaultNow(),
});
