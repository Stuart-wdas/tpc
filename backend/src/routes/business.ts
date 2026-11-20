import type { Express } from 'express';
import { z } from 'zod';
import { fail } from '../http/errors';
import { eventSelectSql } from '../database/event-query';
import type { RouteDependencies } from './dependencies';
import { venueSchema, eventSchema } from '../validation';
import { createVenueOwnershipCheck } from '../services/venue-ownership';
import { randomUUID } from 'node:crypto';
export function registerBusinessRoutes(
  app: Express,
  { pool, users, requireUser, requireRole }: RouteDependencies,
) {
  const requireVenueOwner = createVenueOwnershipCheck(pool);
  app.post('/api/business/apply', requireUser, async (req, res) => {
    if (req.currentUser!.role === 'admin') fail(409, 'Use a business account to register a venue.');
    const data = venueSchema.parse(req.body);
    const venue = await users.applyAsBusiness(req.currentUser!.id, data);
    res.status(201).json(venue);
  });
  app.get('/api/business', requireUser, requireRole('business'), async (req, res) => {
    const venues = (
      await pool.query('SELECT * FROM venues WHERE owner_id=$1 ORDER BY created_at', [
        req.currentUser!.id,
      ])
    ).rows;
    const events = (
      await pool.query(`${eventSelectSql} WHERE v.owner_id=$1 ORDER BY e.starts_at DESC`, [
        req.currentUser!.id,
      ])
    ).rows;
    res.json({ venues, events });
  });
  app.patch('/api/business/venues/:id', requireUser, requireRole('business'), async (req, res) => {
    await requireVenueOwner(String(req.params.id), req.currentUser!);
    const input = venueSchema.parse(req.body);
    const result = await pool.query(
      "UPDATE venues SET name=$1,description=$2,city=$3,address=$4,category=$5,website=$6,status='pending',review_note='' WHERE id=$7 RETURNING *",
      [
        input.name,
        input.description,
        input.city,
        input.address,
        input.category,
        input.website,
        req.params.id,
      ],
    );
    res.json(result.rows[0]);
  });
  app.post('/api/business/events', requireUser, requireRole('business'), async (req, res) => {
    const input = eventSchema.parse(req.body);
    const venue = await requireVenueOwner(input.venue_id, req.currentUser!);
    if (input.status === 'pending' && venue.status !== 'approved')
      fail(409, 'Your venue needs approval before submitting events.');
    res
      .status(201)
      .json(
        (
          await pool.query(
            'INSERT INTO events(id,venue_id,title,description,category,starts_at,duration,capacity,image,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [
              randomUUID(),
              input.venue_id,
              input.title,
              input.description,
              input.category,
              input.starts_at,
              input.duration,
              input.capacity,
              input.image,
              input.status,
            ],
          )
        ).rows[0],
      );
  });
  app.patch('/api/business/events/:id', requireUser, requireRole('business'), async (req, res) => {
    const input = eventSchema.parse(req.body);
    const venue = await requireVenueOwner(input.venue_id, req.currentUser!);
    const event = (await pool.query('SELECT * FROM events WHERE id=$1', [req.params.id])).rows[0];
    if (!event) fail(404, 'Event not found.');
    await requireVenueOwner(event.venue_id, req.currentUser!);
    if (!['draft', 'rejected'].includes(event.status))
      fail(
        409,
        'Only drafts and rejected events can be edited. Cancel a published event if plans change.',
      );
    if (input.status === 'pending' && venue.status !== 'approved')
      fail(409, 'Your venue needs approval before submitting events.');
    res.json(
      (
        await pool.query(
          "UPDATE events SET venue_id=$1,title=$2,description=$3,category=$4,starts_at=$5,duration=$6,capacity=$7,image=$8,status=$9,review_note='' WHERE id=$10 RETURNING *",
          [
            input.venue_id,
            input.title,
            input.description,
            input.category,
            input.starts_at,
            input.duration,
            input.capacity,
            input.image,
            input.status,
            req.params.id,
          ],
        )
      ).rows[0],
    );
  });
  app.post(
    '/api/business/events/:id/cancel',
    requireUser,
    requireRole('business'),
    async (req, res) => {
      const event = (await pool.query('SELECT * FROM events WHERE id=$1', [req.params.id])).rows[0];
      if (!event) fail(404, 'Event not found.');
      await requireVenueOwner(event.venue_id, req.currentUser!);
      await pool.query("UPDATE events SET status='cancelled' WHERE id=$1", [event.id]);
      res.json({ ok: true });
    },
  );
  app.get(
    '/api/business/events/:id/attendees',
    requireUser,
    requireRole('business'),
    async (req, res) => {
      const event = (await pool.query('SELECT * FROM events WHERE id=$1', [req.params.id])).rows[0];
      if (!event) fail(404, 'Event not found.');
      await requireVenueOwner(event.venue_id, req.currentUser!);
      res.json(
        (
          await pool.query(
            'SELECT b.id,b.checked_in,u.name FROM bookings b JOIN "user" u ON u.id=b.user_id WHERE b.event_id=$1 AND b.status=\'confirmed\' ORDER BY b.created_at',
            [event.id],
          )
        ).rows,
      );
    },
  );
  app.patch(
    '/api/business/attendees/:id',
    requireUser,
    requireRole('business'),
    async (req, res) => {
      const input = z.object({ checked_in: z.boolean() }).parse(req.body);
      const booking = (
        await pool.query(
          'SELECT b.*,e.venue_id,e.status event_status FROM bookings b JOIN events e ON e.id=b.event_id WHERE b.id=$1',
          [req.params.id],
        )
      ).rows[0];
      if (!booking || booking.status !== 'confirmed') fail(404, 'Booking not found.');
      await requireVenueOwner(booking.venue_id, req.currentUser!);
      if (booking.event_status === 'cancelled') fail(409, 'This event is cancelled.');
      await pool.query('UPDATE bookings SET checked_in=$1 WHERE id=$2', [
        input.checked_in,
        req.params.id,
      ]);
      res.json({ ok: true });
    },
  );
}
