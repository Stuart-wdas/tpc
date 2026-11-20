import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { connectDatabase } from '../src/db';
import { createAuth } from '../src/auth';
import { createApp } from '../src/app';
import { migrate } from '../src/database/migrate';
import { createDatabase } from '../src/database/client';
import { seed } from '../src/seed';
import { randomUUID } from 'node:crypto';

let db: Awaited<ReturnType<typeof connectDatabase>>, app: Express;
const origin = 'http://localhost:3000';
type Agent = ReturnType<typeof request.agent>;
let admin: Agent, host: Agent, member: Agent;
async function signup(username: string) {
  const agent = request.agent(app);
  const result = await agent
    .post('/api/auth/sign-up/email')
    .set('Origin', origin)
    .send({
      username,
      name: username,
      email: `${username}@example.com`,
      password: 'Testing2026!',
      role: 'admin',
      disabled: false,
    });
  expect(result.status).toBe(200);
  return agent;
}
async function event(capacity = 12) {
  const id = randomUUID();
  await db.pool.query(
    "INSERT INTO events(id,venue_id,title,description,category,starts_at,duration,capacity,status) VALUES ($1,'dough','A test gathering','A welcoming gathering for a meaningful test.','Outdoors',now()+interval '30 days',90,$2,'approved')",
    [id, capacity],
  );
  return id;
}
beforeAll(async () => {
  db = await connectDatabase(true);
  // Destructive reset is confined to the explicit disposable TEST_DATABASE_URL.
  await db.pool.query(
    'DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public',
  );
  await migrate(db.pool);
  const auth = createAuth(createDatabase(db.pool), origin);
  await seed(db.pool);
  app = createApp(db.pool, auth);
  admin = request.agent(app);
  host = request.agent(app);
  member = request.agent(app);
  expect(
    (
      await admin
        .post('/api/auth/sign-in/username')
        .set('Origin', origin)
        .send({ username: 'admin', password: '123' })
    ).status,
  ).toBe(200);
  expect(
    (
      await host
        .post('/api/auth/sign-in/username')
        .set('Origin', origin)
        .send({ username: 'host', password: 'HostDemo2026!' })
    ).status,
  ).toBe(200);
  expect(
    (
      await member
        .post('/api/auth/sign-in/username')
        .set('Origin', origin)
        .send({ username: 'member', password: 'MemberDemo2026!' })
    ).status,
  ).toBe(200);
});
afterAll(async () => {
  await db?.close();
});
describe('Identity and permission boundaries', () => {
  it('seeds admin / 123 and authenticates through Better Auth', async () => {
    const me = await admin.get('/api/me');
    expect(me.body.role).toBe('admin');
    expect(me.body.name).toBe('TPC Admin');
  });
  it('rejects incorrect passwords and requires eight characters on signup', async () => {
    expect(
      (
        await request(app)
          .post('/api/auth/sign-in/username')
          .send({ username: 'admin', password: 'wrong' })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app).post('/api/auth/sign-up/email').send({
          username: 'shortpwd',
          name: 'Short',
          email: 'short@example.com',
          password: '123',
        })
      ).status,
    ).toBe(400);
  });
  it('prevents client-supplied roles from creating administrators', async () => {
    const agent = await signup('role_attack');
    expect((await agent.get('/api/me')).body.role).toBe('member');
    expect((await agent.get('/api/admin')).status).toBe(403);
  });
  it('rejects anonymous and member access to protected portals', async () => {
    expect((await request(app).get('/api/admin')).status).toBe(401);
    expect((await member.get('/api/admin')).status).toBe(403);
    expect((await member.get('/api/business')).status).toBe(403);
    expect((await host.get('/api/admin')).status).toBe(403);
  });
  it('blocks cross-origin and non-JSON app mutations', async () => {
    expect(
      (await member.patch('/api/me').set('Origin', 'https://bad.example').send({})).status,
    ).toBe(403);
    expect(
      (await member.post('/api/saved/coffee-club').set('Content-Type', 'text/plain').send('x'))
        .status,
    ).toBe(415);
  });
  it('saves profile choices without accepting privilege changes', async () => {
    expect(
      (
        await member
          .patch('/api/me')
          .send({ name: 'Alex Test', city: 'Durban', interests: ['Books'], role: 'admin' })
      ).status,
    ).toBe(200);
    const me = await member.get('/api/me');
    expect(me.body.city).toBe('Durban');
    expect(me.body.interests).toEqual(['Books']);
    expect(me.body.role).toBe('member');
  });
  it('disables access, revokes sessions, and prevents self-disable', async () => {
    const agent = await signup('disabled_user');
    const id = (await agent.get('/api/me')).body.id;
    expect((await admin.patch(`/api/admin/users/${id}`).send({ disabled: true })).status).toBe(200);
    expect((await agent.get('/api/me')).status).toBe(401);
    const self = (await admin.get('/api/me')).body.id;
    expect((await admin.patch(`/api/admin/users/${self}`).send({ disabled: true })).status).toBe(
      409,
    );
  });
});
describe('Discovery and member plans', () => {
  it('filters by city/category/search and resists SQL input', async () => {
    const r = await request(app).get('/api/events?city=Cape%20Town&category=Books');
    expect(r.body.length).toBe(1);
    expect(r.body[0].id).toBe('book-club');
    expect(
      (await request(app).get('/api/events?q=' + encodeURIComponent("' OR 1=1 --"))).body,
    ).toEqual([]);
  });
  it('saves and removes an event idempotently', async () => {
    await member.post('/api/saved/coffee-club').send({});
    await member.post('/api/saved/coffee-club').send({});
    expect(
      (await member.get('/api/saved')).body.filter((e: { id: string }) => e.id === 'coffee-club'),
    ).toHaveLength(1);
    await member.delete('/api/saved/coffee-club').send({});
    expect((await member.get('/api/saved')).body).toHaveLength(0);
  });
  it('makes RSVP idempotent, supports cancellation, and prevents cancellation by another user', async () => {
    const id = await event();
    const a = await member.post(`/api/events/${id}/rsvp`).send({});
    const b = await member.post(`/api/events/${id}/rsvp`).send({});
    expect(a.status).toBe(201);
    expect(b.body.id).toBe(a.body.id);
    expect((await host.delete(`/api/bookings/${a.body.id}`).send({})).status).toBe(404);
    expect((await member.delete(`/api/bookings/${a.body.id}`).send({})).status).toBe(200);
    const again = await member.post(`/api/events/${id}/rsvp`).send({});
    expect(again.body.id).toBe(a.body.id);
  });
  it('never oversells capacity under concurrent requests', async () => {
    const id = await event(2);
    const agents = [];
    for (let i = 0; i < 6; i++) agents.push(await signup(`capacity_${i}`));
    const results = await Promise.all(
      agents.map((agent) => agent.post(`/api/events/${id}/rsvp`).send({})),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(2);
    expect(results.filter((r) => r.status === 409)).toHaveLength(4);
    expect((await request(app).get(`/api/events/${id}`)).body.attendees).toBe(2);
  });
  it('rejects past and cancelled gatherings', async () => {
    const id = await event();
    await db.pool.query("UPDATE events SET starts_at=now()-interval '1 day' WHERE id=$1", [id]);
    expect((await member.post(`/api/events/${id}/rsvp`).send({})).status).toBe(409);
    const cancel = await event();
    await host.post(`/api/business/events/${cancel}/cancel`).send({});
    expect((await member.post(`/api/events/${cancel}/rsvp`).send({})).status).toBe(409);
  });
});
describe('Business to admin publication lifecycle', () => {
  it('requires venue and event approval, then permits owned check-in and moderation', async () => {
    const business = await signup('new_business');
    const venue = await business.post('/api/business/apply').send({
      name: 'Test Café',
      description: 'A welcoming local space for neighbours to connect.',
      city: 'Cape Town',
      address: '1 Test Road, Gardens',
      category: 'Café',
      website: '',
    });
    expect(venue.status).toBe(201);
    expect((await business.get('/api/me')).body.role).toBe('business');
    const payload = {
      venue_id: venue.body.id,
      title: 'The neighbourhood hello',
      description: 'Join our friendly gathering for good conversation and a warm welcome.',
      category: 'Food & drink',
      starts_at: new Date(Date.now() + 86400000 * 20).toISOString(),
      duration: 90,
      capacity: 10,
      image: 'coffee',
      status: 'pending',
    };
    expect((await business.post('/api/business/events').send(payload)).status).toBe(409);
    expect(
      (await admin.patch(`/api/admin/venues/${venue.body.id}`).send({ status: 'approved' })).status,
    ).toBe(200);
    const gathering = await business.post('/api/business/events').send(payload);
    expect(gathering.status).toBe(201);
    const id = gathering.body.id;
    expect((await request(app).get(`/api/events/${id}`)).status).toBe(404);
    expect(
      (await admin.patch(`/api/admin/events/${id}`).send({ status: 'rejected', note: 'Too short' }))
        .status,
    ).toBe(200);
    expect(
      (
        await business
          .patch(`/api/business/events/${id}`)
          .send({ ...payload, title: 'The neighbourhood hello again' })
      ).status,
    ).toBe(200);
    expect((await admin.patch(`/api/admin/events/${id}`).send({ status: 'approved' })).status).toBe(
      200,
    );
    expect((await request(app).get(`/api/events/${id}`)).status).toBe(200);
    const booking = await member.post(`/api/events/${id}/rsvp`).send({});
    expect(booking.status).toBe(201);
    expect((await host.get(`/api/business/events/${id}/attendees`)).status).toBe(403);
    expect(
      (await host.patch(`/api/business/attendees/${booking.body.id}`).send({ checked_in: true }))
        .status,
    ).toBe(403);
    expect(
      (
        await business
          .patch(`/api/business/attendees/${booking.body.id}`)
          .send({ checked_in: true })
      ).status,
    ).toBe(200);
    expect((await business.get(`/api/business/events/${id}/attendees`)).body[0].checked_in).toBe(
      true,
    );
    expect((await business.patch(`/api/business/events/${id}`).send(payload)).status).toBe(409);
    expect((await business.post(`/api/business/events/${id}/cancel`).send({})).status).toBe(200);
    const plans = (await member.get('/api/bookings')).body;
    expect(plans.find((e: { id: string }) => e.id === id).status).toBe('cancelled');
    expect((await admin.get('/api/admin')).body.audit.length).toBeGreaterThan(0);
  });
  it('validates event dates, descriptions and capacity and hides unapproved venues', async () => {
    expect(
      (
        await host.post('/api/business/events').send({
          venue_id: 'dough',
          title: 'Bad event',
          description: 'short',
          category: 'Books',
          starts_at: '2020-01-01T10:00:00Z',
          duration: 1,
          capacity: -1,
        })
      ).status,
    ).toBe(400);
    const id = await event();
    await admin
      .patch('/api/admin/venues/dough')
      .send({ status: 'rejected', note: 'Need updated venue details.' });
    expect((await request(app).get(`/api/events/${id}`)).status).toBe(404);
    expect((await member.post(`/api/events/${id}/rsvp`).send({})).status).toBe(409);
    await admin.patch('/api/admin/venues/dough').send({ status: 'approved' });
  });
  it('prevents another business from editing an owned venue', async () => {
    const agent = await signup('other_owner');
    await agent.post('/api/business/apply').send({
      name: 'Other Café',
      description: 'A second welcoming local café space for everyone.',
      city: 'Durban',
      address: '2 Other Road',
      category: 'Café',
    });
    expect(
      (
        await agent.patch('/api/business/venues/dough').send({
          name: 'Stolen',
          description: 'A description that meets the required length.',
          city: 'Durban',
          address: '2 Other Road',
          category: 'Café',
        })
      ).status,
    ).toBe(403);
  });
});
