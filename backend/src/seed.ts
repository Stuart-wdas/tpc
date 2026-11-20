import type { Pool } from 'pg';
import { createDatabase } from './database/client';
import { userRepository } from './database/users';

export async function seed(pool: Pool) {
  const users = userRepository(createDatabase(pool));
  const password = process.env.SEED_ADMIN_PASSWORD || '123';
  const existing = await users.findByUsername('admin');
  if (process.env.NODE_ENV === 'production' && !existing && password.length < 12)
    throw new Error(
      'Set SEED_ADMIN_PASSWORD to at least 12 characters for the initial production admin.',
    );
  await users.ensureSeedUser('admin', 'TPC Admin', 'admin', password);
  // Demonstration records are only inserted into a fresh database, never overwrite users or events.
  if (
    (await pool.query('SELECT id FROM venues LIMIT 1')).rowCount ||
    process.env.NODE_ENV === 'production'
  )
    return;
  const owner = await users.ensureSeedUser(
    'host',
    'The Neighbourhood Team',
    'business',
    'HostDemo2026!',
  );
  await users.ensureSeedUser('member', 'Alex Morgan', 'member', 'MemberDemo2026!');
  const venues = [
    [
      'dough',
      'Dough & Co.',
      'A neighbourhood coffee spot for slow mornings and good company.',
      'Cape Town',
      '87 Kloof Street, Gardens',
      'Café',
    ],
    [
      'book',
      'The Book Lounge',
      'An independent bookshop with room for a new chapter.',
      'Cape Town',
      '71 Roeland Street, City Centre',
      'Bookshop',
    ],
    [
      'clay',
      'Clay Social Studio',
      'A sunny studio where trying something new is the whole point.',
      'Johannesburg',
      '18 4th Avenue, Parkhurst',
      'Studio',
    ],
    [
      'garden',
      'The Greenhouse',
      'A leafy meeting place for curious people.',
      'Durban',
      '22 Florida Road, Windermere',
      'Community space',
    ],
  ];
  for (const v of venues)
    await pool.query(
      "INSERT INTO venues (id,owner_id,name,description,city,address,category,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'approved') ON CONFLICT DO NOTHING",
      [v[0], owner, ...v.slice(1)],
    );
  const samples = [
    [
      'coffee-club',
      'dough',
      'A little walk. A good coffee.',
      'Start your Saturday with a gentle neighbourhood walk, then settle in for coffee and unhurried conversation. Come alone, bring a friend, or meet your next one. Your host will welcome everyone and make introductions. Coffee is available to buy at the café.',
      'Outdoors',
      'coffee',
      5,
      8,
      20,
      90,
    ],
    [
      'book-club',
      'book',
      'Between the covers',
      'Bring whatever you are reading. We will swap stories, discover new favourites and enjoy a relaxed hour together. No set book, homework or literary expertise required.',
      'Books',
      'books',
      6,
      11,
      12,
      90,
    ],
    [
      'clay-club',
      'clay',
      'Make something. Meet someone.',
      'A relaxed community clay session for first-timers and curious hands. Our host will guide you through a simple hand-building project. Materials are included in this free introductory gathering.',
      'Arts & culture',
      'clay',
      7,
      14,
      10,
      120,
    ],
    [
      'supper-club',
      'dough',
      'The long table',
      'Pull up a chair for an early evening of conversation. Meet your neighbours through a few thoughtful prompts, then see where the conversation goes. Food and drinks can be purchased separately from the venue.',
      'Food & drink',
      'dinner',
      8,
      18,
      16,
      120,
    ],
    [
      'garden-club',
      'garden',
      'Sunday, unplugged',
      'Put your phone away for an easy-going afternoon of board games and conversation in the garden. We will bring the games; you bring yourself. Everyone is welcome, including complete beginners.',
      'Games & socials',
      'garden',
      9,
      13,
      24,
      120,
    ],
    [
      'music-club',
      'book',
      'An evening worth listening to',
      'Discover local sounds at an intimate listening session. Share a track you love, hear the story behind someone else’s choice, and connect through music.',
      'Music',
      'music',
      10,
      18,
      18,
      90,
    ],
  ] as const;
  for (const [
    id,
    venue,
    title,
    description,
    category,
    image,
    days,
    hour,
    capacity,
    duration,
  ] of samples) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    date.setUTCHours(hour - 2, 0, 0, 0);
    await pool.query(
      "INSERT INTO events (id,venue_id,title,description,category,image,starts_at,capacity,duration,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved') ON CONFLICT DO NOTHING",
      [id, venue, title, description, category, image, date.toISOString(), capacity, duration],
    );
  }
}
