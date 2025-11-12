import { db } from '../index.js';
import { chirps, NewChirp } from '../schema.js';
import { eq } from 'drizzle-orm';

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
