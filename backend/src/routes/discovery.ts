import type { Express } from 'express';
import { z } from 'zod';
import { fail } from '../http/errors';
import { eventSelectSql } from '../database/event-query';
import type { RouteDependencies } from './dependencies';

export function registerDiscoveryRoutes(app: Express, { pool }: RouteDependencies) {
  app.get('/api/events', async (req, res) => {
    const filters = ["e.status='approved'", "v.status='approved'", 'e.starts_at>now()'];
    const values: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      values.push(value);
      filters.push(sql.replace('?', `$${values.length}`));
    };
    if (req.query.q)
      add(
        "(e.title || ' ' || e.description || ' ' || v.name) ILIKE ?",
        `%${String(req.query.q).slice(0, 100)}%`,
      );
    if (req.query.city) add('v.city=?', String(req.query.city));
    if (req.query.category) add('e.category=?', String(req.query.category));
    if (req.query.when === 'week') filters.push("e.starts_at < now()+interval '7 days'");
    if (req.query.when === 'weekend')
      filters.push("EXTRACT(ISODOW FROM e.starts_at AT TIME ZONE 'Africa/Johannesburg') IN (6,7)");
    res.json(
      (
        await pool.query(
          `${eventSelectSql} WHERE ${filters.join(' AND ')} ORDER BY e.starts_at LIMIT 100`,
          values,
        )
      ).rows,
    );
  });
  app.get('/api/events/:id', async (req, res) => {
    const event = (
      await pool.query(
        `${eventSelectSql} WHERE e.id=$1 AND e.status IN ('approved','cancelled') AND v.status='approved'`,
        [req.params.id],
      )
    ).rows[0];
    if (!event) fail(404, 'This gathering is not available.');
    res.json(event);
  });
}
