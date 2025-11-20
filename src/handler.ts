import { Request, Response } from 'express';
import { config } from './config.js';
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
  getBearerToken,
} from './auth/auth.js';
import {
  createUser,
  deleteAllUsers,
  getUserByEmail,
} from './db/queries/users.js';
import {
  createChirp,
  getAllChirps,
  getChirpById,
} from './db/queries/chirps.js';

// ============================================================================
// HEALTH & MONITORING HANDLERS
// ============================================================================
// These handlers provide system health checks and monitoring capabilities

/**
 * Health check endpoint - returns OK status
 * Used for monitoring service availability
 */
export async function handlerReadiness(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('OK');
}

/**
 * Metrics dashboard - shows usage statistics
 * Returns HTML page with file server hit count
 */
export async function handlerMetrics(req: Request, res: Response) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileServerHits} times!</p>
  </body>
</html>
`);
}

// ============================================================================
// ADMIN HANDLERS
// ============================================================================
// Administrative functions - restricted to development environment

/**
 * Reset application state - development only
 * Resets hit counter and clears all users from database
 */
export async function handlerReset(req: Request, res: Response) {
  if (config.api.platform !== 'development') {
    res.status(403).send('Reset is only allowed in development platform');
    return;
  }
  config.api.fileServerHits = 0;
  await deleteAllUsers();
  res.set({ 'Content-Type': 'text/plain', charset: 'utf-8' });
  res.status(200).send('Hits reset to 0');
}

// ============================================================================
// CHIRP HANDLERS
// ============================================================================
// Core chirp functionality - creating and retrieving chirps

/**
 * Create new chirp with profanity filtering and JWT authentication
 * - Validates JWT bearer token for user authentication
 * - Extracts user ID from validated JWT token (not from request body for security)
 * - Validates chirp length (max 140 characters)
 * - Filters profane words and replaces with asterisks
 * - Saves chirp to database with authenticated user ID
 */
export async function handlerChirp(req: Request, res: Response) {
  type responseBody = {
    cleanedBody?: string;
    error?: string;
  };

  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const decoded = validateJWT(token, config.jwtSecret);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const profane = ['kerfuffle', 'sharbert', 'fornax'];

  const { body } = req.body;
  const userId = decoded.sub!; // Use user ID from validated JWT (! because we know it exists)

  if (!body || typeof body !== 'string') {
    const response: responseBody = {
      error: 'Missing data field',
    };
    res.status(400).json(response);
    return;
  }

  const maxLength = 140;

  if (body.length > maxLength) {
    const response: responseBody = {
      error: `Chirp is too long. Max length is ${maxLength}`,
    };
    res.status(400).json(response);
    return;
  }

  let updatedBody = '';
  for (const word of body.split(/\s+/)) {
    if (profane.includes(word.toLowerCase())) {
      updatedBody += '**** ';
    } else {
      updatedBody += word + ' ';
    }
  }

  const newChirp = await createChirp({ body: updatedBody.trim(), userId });

  res.status(201).json({
    id: newChirp.id,
    createdAt: newChirp.createdAt,
    updatedAt: newChirp.updatedAt,
    body: newChirp.body,
    userId: newChirp.userId,
  });
}

/**
 * Retrieve all chirps from database
 * Returns array of all chirp objects
 */
export async function handlerGetAllChirps(req: Request, res: Response) {
  const chirps = await getAllChirps();
  res.status(200).json(chirps);
}

/**
 * Retrieve a specific chirp by its ID
 * Extracts ID from URL parameters and fetches from database
 * Returns 404 if chirp doesn't exist, otherwise returns chirp object
 */
export async function handlerGetChirpById(req: Request, res: Response) {
  const { id } = req.params;
  const chirp = await getChirpById(id);
  if (!chirp) {
    res.status(404).json({ error: 'Chirp not found' });
    return;
  }
  res.status(200).json(chirp);
}

// ============================================================================
// USER HANDLERS
// ============================================================================
// User management functionality - creating and managing user accounts

/**
 * Create new user account with secure password hashing
 * - Validates required email and password fields
 * - Hashes password using Argon2 for security
 * - Creates user in database with unique email constraint
 * - Returns user object (excluding password) with generated UUID
 * - Handles duplicate email errors gracefully
 */
export async function handlerCreateUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await createUser({ email, hashedPassword });

    if (!newUser) {
      res
        .status(500)
        .json({ error: 'Failed to create user - user already exists' });
      return;
    }

    res.status(201).json({
      id: newUser.id,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      email: newUser.email,
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * Authenticate user login and generate JWT token
 * - Validates required email and password fields
 * - Looks up user by email in database
 * - Verifies password using Argon2 hash comparison
 * - Generates JWT token with configurable expiration (max 1 hour)
 * - Returns user info and JWT token for authenticated requests
 * - Uses secure error messages to prevent user enumeration
 */
export async function handlerLoginUser(req: Request, res: Response) {
  try {
    const { email, password, expiresInSeconds = 3600 } = req.body; // Default to 1 hour

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const actualExpiresInSeconds =
      expiresInSeconds > 3600 ? 3600 : expiresInSeconds;

    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await checkPasswordHash(
      password,
      user.hashedPassword
    );
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = makeJWT(user.id, actualExpiresInSeconds, config.jwtSecret);

    res.status(200).json({
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login user' });
  }
}
