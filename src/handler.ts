import { Request, Response } from 'express';
import { config } from './config.js';
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
  getBearerToken,
  makeRefreshToken,
} from './auth/auth.js';
import {
  createUser,
  deleteAllUsers,
  getUserByEmail,
  updateUser,
  upgradeUserToChirpyRed,
} from './db/queries/users.js';
import {
  createChirp,
  deleteChirpById,
  getAllChirps,
  getChirpById,
} from './db/queries/chirps.js';
import {
  createRefreshToken,
  getRefreshTokenByToken,
  revokeRefreshToken,
} from './db/queries/refreshToken.js';
import { get } from 'http';

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

/**
 * Delete a specific chirp by its ID with JWT authentication and ownership validation
 * - Requires valid JWT bearer token in Authorization header
 * - Extracts user ID from validated JWT token for ownership verification
 * - Verifies the chirp exists and belongs to the authenticated user
 * - Deletes the chirp from database if ownership is confirmed
 * - Returns 204 No Content on success, 404 if not found, 403 if not owner
 */
export async function handlerDeleteChirpById(req: Request, res: Response) {
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

  const userId = decoded.sub!;
  const { id } = req.params;

  const deletedChirp = await getChirpById(id);

  if (!deletedChirp) {
    res.status(404).json({ error: 'Chirp not found' });
    return;
  }
  if (deletedChirp.userId !== userId) {
    res.status(403).json({ error: "Forbidden - cannot delete others' chirps" });
    return;
  }
  await deleteChirpById(id);
  res.status(204).json(deletedChirp);
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
      isChirpyRed: newUser.isChirpyRed,
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * Webhook handler for upgrading user to Chirpy Red premium status
 * - Processes webhook events for user upgrades
 * - Validates event type is 'user.upgraded'
 * - Updates user's isChirpyRed status in database
 * - Returns 204 No Content for all cases (webhook acknowledgment)
 */
export async function handlerUpgradeUserToChirpyRed(
  req: Request,
  res: Response
) {
  const { event, data } = req.body;
  if (event !== 'user.upgraded') {
    res.status(204).send();
    return;
  }

  const userId = data.userId;

  const updatedUser = await upgradeUserToChirpyRed(userId);
  if (!updatedUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.status(204).send();
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

    const token = makeJWT(user.id, expiresInSeconds, config.jwtSecret);
    const refreshToken = makeRefreshToken();

    await createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days expiration
      revokedAt: null,
    });

    res.status(200).json({
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      isChirpyRed: user.isChirpyRed,
      token: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login user' });
  }
}

/**
 * Refresh JWT access token using valid refresh token
 * - Validates refresh token from Authorization header
 * - Checks token exists, hasn't been revoked, and hasn't expired
 * - Generates new JWT access token with 1-hour expiration
 * - Returns new access token for continued API access
 * - Maintains security by not extending refresh token lifetime
 */
export async function handlerRefreshToken(req: Request, res: Response) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const tokenData = await getRefreshTokenByToken(token);

  if (!tokenData || tokenData.revokedAt || tokenData.expiresAt < new Date()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const newJWT = makeJWT(tokenData.userId, 3600, config.jwtSecret);

  res.status(200).json({ token: newJWT });
}

/**
 * Revoke a refresh token to prevent further use
 * - Validates refresh token from Authorization header
 * - Checks token exists and hasn't already been revoked
 * - Marks token as revoked in database with timestamp
 * - Prevents future refresh attempts with this token
 * - Returns 204 No Content on successful revocation
 */
export async function handlerRevokeToken(req: Request, res: Response) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const tokenData = await getRefreshTokenByToken(token);

  if (!tokenData || tokenData.revokedAt || tokenData.expiresAt < new Date()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  await revokeRefreshToken(token);

  res.status(204).send();
}

/**
 * Update authenticated user's profile information
 * - Requires valid JWT bearer token in Authorization header
 * - Allows updating email and/or password (at least one required)
 * - Re-hashes password using Argon2 if password is provided
 * - Updates user record in database with new information
 * - Returns updated user object (excluding password)
 * - Validates JWT token and extracts user ID for security
 */
export async function handlerUpdateUser(req: Request, res: Response) {
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

  const userId = decoded.sub!;

  const { email, password } = req.body;

  if (!email && !password) {
    res
      .status(400)
      .json({ error: 'At least one of email or password must be provided' });
    return;
  }

  const updatedFields: any = {};
  if (email) {
    updatedFields.email = email;
  }
  if (password) {
    updatedFields.hashedPassword = await hashPassword(password);
  }

  try {
    const updatedUser = await updateUser(userId, updatedFields);
    res.status(200).json({
      id: updatedUser.id,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      email: updatedUser.email,
      isChirpyRed: updatedUser.isChirpyRed,
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}
