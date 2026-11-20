import { beforeAll, afterAll, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { getMigrations } from 'better-auth/db/migration';
import { hashPassword } from 'better-auth/crypto';
import request from 'supertest';
import { connectDatabase } from '../src/db';
import { migrate } from '../src/database/migrate';
import { createDatabase } from '../src/database/client';
import { userRepository } from '../src/database/users';
import { createAuth } from '../src/auth';
import { createApp } from '../src/app';
import { seed } from '../src/seed';

let db: Awaited<ReturnType<typeof connectDatabase>>;
let passwordHash: string, oldCookie: string;
const previousSecret = process.env.BETTER_AUTH_SECRET;
beforeAll(async () => {
  process.env.BETTER_AUTH_SECRET = 'legacy-migration-test-secret-at-least-32-chars';
  db = await connectDatabase(true);
  await db.pool.query(
    'DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public',
  );
  // Kysely is used only to reproduce the original pre-Drizzle Better Auth schema.
  const legacy = betterAuth({
    database: db.pool,
    baseURL: 'http://localhost:3000',
    secret: 'legacy-migration-test-secret-at-least-32-chars',
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'member', input: false },
        disabled: { type: 'boolean', defaultValue: false, input: false },
      },
    },
    plugins: [username()],
    rateLimit: { enabled: false },
  });
  await (await getMigrations(legacy.options)).runMigrations();
  await db.pool.query(
    await readFile(new URL('./fixtures/legacy-app.sql', import.meta.url), 'utf8'),
  );
  passwordHash = await hashPassword('123');
  await db.pool.query(
    `INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt",username,"displayUsername",role,disabled) VALUES ('legacy-admin','Legacy Admin','admin@tpc.local',true,now(),now(),'admin','admin','admin',false)`,
  );
  await db.pool.query(
    `INSERT INTO account (id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES ('legacy-account','legacy-admin','credential','legacy-admin',$1,now(),now())`,
    [passwordHash],
  );
  await db.pool.query(
    `INSERT INTO profiles VALUES ('legacy-admin','Durban',ARRAY['Books']); INSERT INTO venues (id,owner_id,name,description,city,address,category,status) VALUES ('legacy-venue','legacy-admin','Legacy Venue','An existing venue','Durban','1 Existing Road','Café','approved'); INSERT INTO events (id,venue_id,title,description,category,starts_at,duration,capacity,status) VALUES ('legacy-event','legacy-venue','Existing gathering','An existing gathering','Books',now()+interval '30 days',90,12,'approved'); INSERT INTO bookings (id,event_id,user_id) VALUES ('legacy-booking','legacy-event','legacy-admin'); INSERT INTO saved_events VALUES ('legacy-admin','legacy-event')`,
  );
  const response = await legacy.handler(
    new Request('http://localhost:3000/api/auth/sign-in/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '123' }),
    }),
  );
  expect(response.status).toBe(200);
  oldCookie = response.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  await migrate(db.pool);
});
afterAll(async () => {
  await db?.close();
  if (previousSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
  else process.env.BETTER_AUTH_SECRET = previousSecret;
});

it('adopts existing users, password hashes, profiles, bookings and saved events without replacing IDs', async () => {
  const users = userRepository(createDatabase(db.pool));
  expect((await users.findByUsername('admin'))?.id).toBe('legacy-admin');
  expect((await users.profile('legacy-admin')).city).toBe('Durban');
  expect(
    (await db.pool.query('SELECT password FROM account WHERE id=$1', ['legacy-account'])).rows[0]
      .password,
  ).toBe(passwordHash);
  expect((await db.pool.query("SELECT id FROM bookings WHERE id='legacy-booking'")).rowCount).toBe(
    1,
  );
  expect(
    (await db.pool.query("SELECT * FROM saved_events WHERE user_id='legacy-admin'")).rowCount,
  ).toBe(1);
});
it('accepts existing sessions through the Drizzle adapter', async () => {
  const app = createApp(db.pool, createAuth(createDatabase(db.pool)));
  const me = await request(app).get('/api/me').set('Cookie', oldCookie);
  expect(me.status).toBe(200);
  expect(me.body.id).toBe('legacy-admin');
});
it('repeats Drizzle migrations and seed without changing existing credentials or records', async () => {
  await migrate(db.pool);
  await seed(db.pool);
  expect(
    (await db.pool.query('SELECT id,password FROM account WHERE "userId"=$1', ['legacy-admin']))
      .rows,
  ).toEqual([{ id: 'legacy-account', password: passwordHash }]);
  expect(
    (await db.pool.query('SELECT count(*)::int count FROM drizzle.__drizzle_migrations')).rows[0]
      .count,
  ).toBe(1);
});
it('rolls back business role promotion if venue insertion fails', async () => {
  const users = userRepository(createDatabase(db.pool));
  const id = await users.ensureSeedUser(
    'rollback_member',
    'Rollback Member',
    'member',
    'RollbackTest2026!',
  );
  await expect(
    users.applyAsBusiness(id, {
      name: null as unknown as string,
      description: 'Valid details',
      city: 'Cape Town',
      address: '1 Test Road',
      category: 'Café',
      website: '',
    }),
  ).rejects.toThrow();
  expect((await users.findById(id))?.role).toBe('member');
});
