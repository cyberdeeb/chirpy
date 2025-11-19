import * as argon2 from 'argon2';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

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

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string
): string {
  type payload = Pick<JwtPayload, 'iss' | 'sub' | 'iat' | 'exp'>;

  const payload: payload = {
    iss: 'chirpy',
    sub: userID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(token: string, secret: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}
