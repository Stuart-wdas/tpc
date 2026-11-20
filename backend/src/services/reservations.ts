import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { fail } from '../http/errors';
import type { bookings, events } from '../database/schema';

type Booking = typeof bookings.$inferSelect;
type AvailableEvent = typeof events.$inferSelect & { venue_status: string };

export async function reserveEventSeat(pool: Pool, eventId: string, userId: string) {
  const transaction = await pool.connect();

  try {
    await transaction.query('BEGIN');

    // Every reservation locks this event before counting seats, protecting the final place.
    const eventResult = await transaction.query<AvailableEvent>(
      `
      SELECT e.*, v.status AS venue_status
      FROM events e
      JOIN venues v ON v.id = e.venue_id
      WHERE e.id = $1
      FOR UPDATE OF e
    `,
      [eventId],
    );
    const event = eventResult.rows[0];

    if (
      !event ||
      event.status !== 'approved' ||
      event.venue_status !== 'approved' ||
      event.starts_at <= new Date()
    ) {
      fail(409, 'This gathering is no longer accepting RSVPs.');
    }

    const existingResult = await transaction.query<Booking>(
      `
      SELECT * FROM bookings WHERE event_id = $1 AND user_id = $2
    `,
      [eventId, userId],
    );
    const existingBooking = existingResult.rows[0];

    if (existingBooking?.status === 'confirmed') {
      await transaction.query('COMMIT');
      return { booking: existingBooking, created: false };
    }

    const countResult = await transaction.query<{ count: number }>(
      `
      SELECT count(*)::int AS count
      FROM bookings
      WHERE event_id = $1 AND status = 'confirmed'
    `,
      [eventId],
    );

    if (countResult.rows[0].count >= event.capacity) {
      fail(409, 'This gathering is full. Try another one or check back for a space.');
    }

    const reservation = await transaction.query<Booking>(
      `
      INSERT INTO bookings (id, event_id, user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET status = 'confirmed', checked_in = false, created_at = now()
      RETURNING *
    `,
      [randomUUID(), eventId, userId],
    );

    await transaction.query('COMMIT');
    return { booking: reservation.rows[0], created: true };
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    transaction.release();
  }
}
