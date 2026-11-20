import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import type { Database } from './client';
import { account, auditLog, profiles, session, user, venues, type UserRole } from './schema';

export function userRepository(db: Database) {
  return {
    async findById(id: string) {
      return (
        await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            disabled: user.disabled,
          })
          .from(user)
          .where(eq(user.id, id))
          .limit(1)
      )[0];
    },
    async findByUsername(username: string) {
      return (await db.select().from(user).where(eq(user.username, username)).limit(1))[0];
    },
    async list() {
      return db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          disabled: user.disabled,
          createdAt: user.createdAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt));
    },
    async profile(userId: string) {
      return (
        (await db.select().from(profiles).where(eq(profiles.user_id, userId)).limit(1))[0] || {
          city: 'Cape Town',
          interests: [],
        }
      );
    },
    async updateProfile(userId: string, data: { name: string; city: string; interests: string[] }) {
      await db.transaction(async (tx) => {
        await tx
          .update(user)
          .set({ name: data.name, updatedAt: new Date() })
          .where(eq(user.id, userId));
        await tx
          .insert(profiles)
          .values({ user_id: userId, city: data.city, interests: data.interests })
          .onConflictDoUpdate({
            target: profiles.user_id,
            set: { city: data.city, interests: data.interests },
          });
      });
    },
    async applyAsBusiness(
      userId: string,
      data: {
        name: string;
        description: string;
        city: string;
        address: string;
        category: string;
        website: string;
      },
    ) {
      return db.transaction(async (tx) => {
        await tx
          .update(user)
          .set({ role: 'business', updatedAt: new Date() })
          .where(and(eq(user.id, userId), eq(user.role, 'member')));
        return (
          await tx
            .insert(venues)
            .values({ id: randomUUID(), owner_id: userId, ...data })
            .returning()
        )[0];
      });
    },
    async setDisabled(actorId: string, userId: string, disabled: boolean) {
      return db.transaction(async (tx) => {
        const changed = await tx
          .update(user)
          .set({ disabled, updatedAt: new Date() })
          .where(eq(user.id, userId))
          .returning({ id: user.id });
        if (!changed.length) return false;
        if (disabled) await tx.delete(session).where(eq(session.userId, userId));
        await tx.insert(auditLog).values({
          actor_id: actorId,
          action: disabled ? 'disabled user' : 'enabled user',
          target_id: userId,
        });
        return true;
      });
    },
    async ensureSeedUser(username: string, name: string, role: UserRole, password: string) {
      const existing = (
        await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1)
      )[0];
      if (existing) return existing.id;
      const id = randomUUID();
      const hashedPassword = await hashPassword(password);
      return db.transaction(async (tx) => {
        // The username conflict protects repeat/concurrent startup without resetting an existing hash.
        const inserted = await tx
          .insert(user)
          .values({
            id,
            name,
            email: `${username}@tpc.local`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            username,
            displayUsername: username,
            role,
            disabled: false,
          })
          .onConflictDoNothing({ target: user.username })
          .returning({ id: user.id });
        if (!inserted.length)
          return (await tx.select({ id: user.id }).from(user).where(eq(user.username, username)))[0]
            .id;
        await tx.insert(account).values({
          id: randomUUID(),
          accountId: id,
          providerId: 'credential',
          userId: id,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return id;
      });
    },
  };
}

export type UserRepository = ReturnType<typeof userRepository>;
