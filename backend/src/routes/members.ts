import type { Express } from 'express';
import { z } from 'zod';
import { fail } from '../http/errors';
import { eventSelectSql } from '../database/event-query';
import type { RouteDependencies } from './dependencies';
import { categories, cities } from '../validation';
import { reserveEventSeat } from '../services/reservations';
export function registerMemberRoutes(
  app: Express,
  { pool, users, requireUser }: RouteDependencies,
) {
  app.get('/api/me', requireUser, async (req, res) => {
    const profile = await users.profile(req.currentUser!.id);
    res.json({ ...req.currentUser, ...profile });
  });
  app.patch('/api/me', requireUser, async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(2).max(100),
        city: z.enum(cities),
        interests: z.array(z.enum(categories)).max(6),
      })
      .parse(req.body);
    await users.updateProfile(req.currentUser!.id, data);
    res.json({ ok: true });
  });
  app.get('/api/bookings', requireUser, async (req, res) => {
    res.json(
      (
        await pool.query(
          `SELECT b.id booking_id,b.status booking_status,b.checked_in,e.id,e.title,e.starts_at,e.status,e.image,v.name venue_name,v.city,v.address FROM bookings b JOIN events e ON e.id=b.event_id JOIN venues v ON v.id=e.venue_id WHERE b.user_id=$1 AND b.status='confirmed' ORDER BY e.starts_at`,
          [req.currentUser!.id],
        )
      ).rows,
    );
  });
  app.post('/api/events/:id/rsvp', requireUser, async (request, response) => {
    const reservation = await reserveEventSeat(
      pool,
      String(request.params.id),
      request.currentUser!.id,
    );
    response.status(reservation.created ? 201 : 200).json(reservation.booking);
  });
  app.delete('/api/bookings/:id', requireUser, async (req, res) => {
    const result = await pool.query(
      "UPDATE bookings SET status='cancelled',checked_in=false WHERE id=$1 AND user_id=$2 RETURNING id",
      [req.params.id, req.currentUser!.id],
    );
    if (!result.rowCount) fail(404, 'Booking not found.');
    res.json({ ok: true });
  });
  app.get('/api/saved', requireUser, async (req, res) => {
    res.json(
      (
        await pool.query(
          `${eventSelectSql} JOIN saved_events s ON s.event_id=e.id WHERE s.user_id=$1 AND e.status='approved' AND v.status='approved' AND e.starts_at>now() ORDER BY e.starts_at`,
          [req.currentUser!.id],
        )
      ).rows,
    );
  });
  app.post('/api/saved/:id', requireUser, async (req, res) => {
    const event = await pool.query(
      "SELECT e.id FROM events e JOIN venues v ON v.id=e.venue_id WHERE e.id=$1 AND e.status='approved' AND v.status='approved'",
      [req.params.id],
    );
    if (!event.rowCount) fail(404, 'Event not found.');
    await pool.query(
      'INSERT INTO saved_events(user_id,event_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.currentUser!.id, req.params.id],
    );
    res.json({ ok: true });
  });
  app.delete('/api/saved/:id', requireUser, async (req, res) => {
    await pool.query('DELETE FROM saved_events WHERE user_id=$1 AND event_id=$2', [
      req.currentUser!.id,
      req.params.id,
    ]);
    res.json({ ok: true });
  });
}
