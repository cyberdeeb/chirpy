import { db } from '../index.js';
import { NewUser, users } from '../schema.js';
import { eq } from 'drizzle-orm';

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function deleteAllUsers() {
  await db.delete(users);
}

export async function getUserByEmail(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user[0];
}

export async function updateUser(id: string, updatedFields: Partial<NewUser>) {
  const [updatedUser] = await db
    .update(users)
    .set({
      ...updatedFields,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
}
