import { db } from '../index.js';
import { refreshTokens, NewRefreshToken } from '../schema.js';
import { eq } from 'drizzle-orm';

export async function createRefreshToken(token: NewRefreshToken) {
  const [newToken] = await db.insert(refreshTokens).values(token).returning();
  return newToken;
}

export async function getRefreshTokenByUserId(userId: string) {
  const token = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, userId))
    .limit(1);
  return token[0];
}

export async function getRefreshTokenByToken(tokenStr: string) {
  const token = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, tokenStr))
    .limit(1);
  return token[0];
}

export async function revokeRefreshToken(tokenStr: string) {
  const [revokedToken] = await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokens.token, tokenStr))
    .returning();
  return revokedToken;
}
