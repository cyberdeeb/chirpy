import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeJWT,
  validateJWT,
  hashPassword,
  checkPasswordHash,
  getBearerToken,
} from './auth.js';

describe('Password Hashing', () => {
  const password1 = 'correctPassword123!';
  const password2 = 'anotherPassword456!';
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it('should return true for the correct password', async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const result = await checkPasswordHash('wrongPassword', hash1);
    expect(result).toBe(false);
  });

  it('should return false when checking password1 against hash2', async () => {
    const result = await checkPasswordHash(password1, hash2);
    expect(result).toBe(false);
  });

  it('should generate different hashes for the same password', async () => {
    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password1);
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty password', async () => {
    const hash = await hashPassword('');
    const result = await checkPasswordHash('', hash);
    expect(result).toBe(true);
  });
});

describe('JWT Creation and Validation', () => {
  const secret = 'test-secret-key';
  const userID = '4d257297-5aad-47b5-b8a5-a4afe5c1905c';
  const expiresIn = 3600; // 1 hour

  it('should create and validate a valid JWT', () => {
    const token = makeJWT(userID, expiresIn, secret);
    const decoded = validateJWT(token, secret);

    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(userID);
    expect(decoded?.iss).toBe('chirpy');
    expect(decoded?.iat).toBeTypeOf('number');
    expect(decoded?.exp).toBeTypeOf('number');
  });

  it('should include correct expiration time', () => {
    const token = makeJWT(userID, expiresIn, secret);
    const decoded = validateJWT(token, secret);

    expect(decoded).not.toBeNull();
    expect(decoded?.exp).toBe(decoded?.iat! + expiresIn);
  });

  it('should reject JWT with wrong secret', () => {
    const token = makeJWT(userID, expiresIn, secret);
    const wrongSecret = 'wrong-secret-key';
    const decoded = validateJWT(token, wrongSecret);

    expect(decoded).toBeNull();
  });

  it('should reject expired JWT', () => {
    // Create token that expires immediately
    const expiredToken = makeJWT(userID, -1, secret);

    // Wait a moment to ensure token is expired
    setTimeout(() => {
      const decoded = validateJWT(expiredToken, secret);
      expect(decoded).toBeNull();
    }, 10);
  });

  it('should reject malformed JWT', () => {
    const malformedToken = 'not.a.valid.jwt.token';
    const decoded = validateJWT(malformedToken, secret);

    expect(decoded).toBeNull();
  });

  it('should reject empty token', () => {
    const decoded = validateJWT('', secret);
    expect(decoded).toBeNull();
  });

  it('should handle different user IDs', () => {
    const userID1 = 'user-1';
    const userID2 = 'user-2';

    const token1 = makeJWT(userID1, expiresIn, secret);
    const token2 = makeJWT(userID2, expiresIn, secret);

    const decoded1 = validateJWT(token1, secret);
    const decoded2 = validateJWT(token2, secret);

    expect(decoded1?.sub).toBe(userID1);
    expect(decoded2?.sub).toBe(userID2);
    expect(decoded1?.sub).not.toBe(decoded2?.sub);
  });

  it('should create tokens with different expiration times', () => {
    const shortExpiry = 60; // 1 minute
    const longExpiry = 7200; // 2 hours

    const shortToken = makeJWT(userID, shortExpiry, secret);
    const longToken = makeJWT(userID, longExpiry, secret);

    const shortDecoded = validateJWT(shortToken, secret);
    const longDecoded = validateJWT(longToken, secret);

    expect(shortDecoded?.exp).toBeLessThan(longDecoded?.exp!);
  });
});

describe('Bearer Token Extraction', () => {
  // Mock Express Request object
  const mockRequest = (authHeader?: string) =>
    ({
      get: (headerName: string) => {
        if (headerName.toLowerCase() === 'authorization') {
          return authHeader;
        }
        return undefined;
      },
    } as any);

  it('should extract valid bearer token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    const req = mockRequest(`Bearer ${token}`);

    const result = getBearerToken(req);
    expect(result).toBe(token);
  });

  it('should return empty string when no authorization header', () => {
    const req = mockRequest();

    const result = getBearerToken(req);
    expect(result).toBe('');
  });

  it('should return empty string when authorization header is empty', () => {
    const req = mockRequest('');

    const result = getBearerToken(req);
    expect(result).toBe('');
  });

  it('should return empty string for malformed authorization header', () => {
    const req = mockRequest('InvalidFormat');

    const result = getBearerToken(req);
    expect(result).toBe('');
  });

  it('should return empty string when not Bearer type', () => {
    const req = mockRequest('Basic dXNlcjpwYXNzd29yZA==');

    const result = getBearerToken(req);
    expect(result).toBe('');
  });

  it('should return empty string when Bearer has no token', () => {
    const req = mockRequest('Bearer');

    const result = getBearerToken(req);
    expect(result).toBe('');
  });

  it('should return empty string when Bearer has empty token', () => {
    const req = mockRequest('Bearer ');

    const result = getBearerToken(req);
    expect(result).toBe('');
  });

  it('should handle Bearer with extra spaces', () => {
    const token = 'valid.jwt.token';
    const req = mockRequest(`Bearer  ${token}`); // Extra space

    const result = getBearerToken(req);
    expect(result).toBe(''); // Should fail due to split length !== 2
  });

  it('should handle case-sensitive Bearer', () => {
    const token = 'valid.jwt.token';
    const req = mockRequest(`bearer ${token}`); // lowercase

    const result = getBearerToken(req);
    expect(result).toBe(''); // Should fail due to case sensitivity
  });

  it('should extract token from complex authorization header', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const req = mockRequest(`Bearer ${token}`);

    const result = getBearerToken(req);
    expect(result).toBe(token);
  });
});
