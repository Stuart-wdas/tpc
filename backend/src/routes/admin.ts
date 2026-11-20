import type { Express } from 'express';
import { z } from 'zod';
import { fail } from '../http/errors';
import { eventSelectSql } from '../database/event-query';
import type { RouteDependencies } from './dependencies';

export function registerAdminRoutes(
  app: Express,
  { pool, users, requireUser, requireRole }: RouteDependencies,
) {
  app.get('/api/admin', requireUser, requireRole('admin'), async (_req, res) => {
    const [venues, events, accounts, stats, audit] = await Promise.all([
      pool.query(
        'SELECT v.*,u.name owner_name,u.email owner_email FROM venues v JOIN "user" u ON u.id=v.owner_id ORDER BY v.created_at DESC',
      ),
      pool.query(`${eventSelectSql} ORDER BY e.created_at DESC`),
      users.list(),
      pool.query(
        "SELECT (SELECT count(*)::int FROM \"user\") members,(SELECT count(*)::int FROM venues WHERE status='approved') venues,(SELECT count(*)::int FROM events WHERE status='approved' AND starts_at>now()) events,(SELECT count(*)::int FROM bookings WHERE status='confirmed') rsvps",
      ),
      pool.query(
        'SELECT a.*,u.name actor_name FROM audit_log a LEFT JOIN "user" u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 30',
      ),
    ]);
    res.json({
      venues: venues.rows,
      events: events.rows,
      users: accounts,
      stats: stats.rows[0],
      audit: audit.rows,
    });
  });
  app.patch('/api/admin/:kind/:id', requireUser, requireRole('admin'), async (req, res) => {
    const kind = z.enum(['venues', 'events', 'users']).parse(req.params.kind);
    const target = String(req.params.id);
    if (kind === 'users') {
      const data = z.object({ disabled: z.boolean() }).parse(req.body);
      if (target === req.currentUser!.id) fail(409, 'You cannot disable your own admin account.');
      if (!(await users.setDisabled(req.currentUser!.id, target, data.disabled)))
        fail(404, 'Record not found.');
      return res.json({ ok: true });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let action = '';
      let note = '';
      let result;
      {
        const input = z
          .object({
            status: z.enum(
              kind === 'venues' ? ['approved', 'rejected'] : ['approved', 'rejected', 'cancelled'],
            ),
            note: z.string().trim().max(1000).default(''),
          })
          .parse(req.body);
        if (input.status === 'rejected' && input.note.length < 5)
          fail(400, 'Please give the business a reason for rejection.');
        if (kind === 'events' && input.status === 'approved') {
          const event = (
            await client.query(
              'SELECT e.*,v.status venue_status FROM events e JOIN venues v ON v.id=e.venue_id WHERE e.id=$1',
              [target],
            )
          ).rows[0];
          if (
            !event ||
            event.venue_status !== 'approved' ||
            new Date(event.starts_at) <= new Date() ||
            event.status === 'cancelled'
          )
            fail(409, 'Approve the venue and use a future, active event before publishing.');
        }
        // Table name comes only from the closed enum above.
        result = await client.query(
          `UPDATE ${kind} SET status=$1,review_note=$2 WHERE id=$3 RETURNING id`,
          [input.status, input.note, target],
        );
        action = `${input.status} ${kind}`;
        note = input.note;
      }
      if (!result.rowCount) fail(404, 'Record not found.');
      await client.query(
        'INSERT INTO audit_log(actor_id,action,target_id,note) VALUES ($1,$2,$3,$4)',
        [req.currentUser!.id, action, target, note],
      );
      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });
}
