import { db } from '../index.js';
import { chirps, NewChirp } from '../schema.js';

export async function createChirp(chirp: NewChirp) {
  const [newChirp] = await db.insert(chirps).values(chirp).returning();
  return newChirp;
}

export async function getAllChirps() {
  return await db.select().from(chirps).orderBy(chirps.createdAt);
}

export async function deleteAllChirps() {
  await db.delete(chirps);
}
