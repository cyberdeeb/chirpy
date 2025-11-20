import * as argon2 from 'argon2';
import { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

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

export function getBearerToken(req: Request): string {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return '';
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return '';
  }

  return parts[1];
}
