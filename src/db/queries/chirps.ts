import { db } from '../index.js';
import { chirps, NewChirp } from '../schema.js';
import { eq, and } from 'drizzle-orm';

export async function createChirp(chirp: NewChirp) {
  const [newChirp] = await db.insert(chirps).values(chirp).returning();
  return newChirp;
}

export async function getAllChirps() {
  return await db.select().from(chirps).orderBy(chirps.createdAt);
}

export async function getChirpById(id: string) {
  const chirp = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, id))
    .limit(1);
  return chirp[0];
}

export async function deleteAllChirps() {
  await db.delete(chirps);
}

export async function deleteChirpById(id: string) {
  const [deletedChirp] = await db
    .delete(chirps)
    .where(eq(chirps.id, id))
    .returning();
  return deletedChirp;
}
