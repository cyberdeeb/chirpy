import * as argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  const hashed = await argon2.hash(password);
  return hashed;
}

export async function checkPasswordHash(
  password: string,
  hash: string
): Promise<boolean> {
  return await argon2.verify(hash, password);
}
