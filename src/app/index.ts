// ============================================================================
// CHIRPY SERVER MAIN APPLICATION
// ============================================================================
// Express.js server for the Chirpy social media platform
// Handles chirp creation, user management, and admin functionality

import express from 'express';
import {
  handlerCreateUser,
  handlerMetrics,
  handlerReadiness,
  handlerReset,
  handlerChirp,
  handlerGetAllChirps,
  handlerGetChirpById,
} from '../handler.js';
import {
  middlewareErrorHandler,
  middlewareLogResponse,
  middlewareMetricsInc,
} from '../middleware.js';

// ============================================================================
// APPLICATION SETUP
// ============================================================================

const app = express();
const PORT = 8080;

// Parse JSON request bodies
app.use(express.json());

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Log all responses (non-200 status codes)
app.use(middlewareLogResponse);

// Serve static files with metrics tracking
app.use('/app', middlewareMetricsInc, express.static('./src/app'));

// ============================================================================
// HEALTH & MONITORING ROUTES
// ============================================================================

/**
 * GET /api/healthz - Health check endpoint
 * Returns: 200 OK - Service is healthy and ready
 */
app.get('/api/healthz', (req, res, next) => {
  Promise.resolve(handlerReadiness(req, res)).catch(next);
});

/**
 * GET /admin/metrics - Usage metrics dashboard
 * Returns: HTML page with file server statistics
 */
app.get('/admin/metrics', (req, res, next) => {
  Promise.resolve(handlerMetrics(req, res)).catch(next);
});

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * POST /admin/reset - Reset application state (development only)
 * Resets hit counters and clears all users
 * Returns: 200 OK with confirmation message
 */
app.post('/admin/reset', (req, res, next) => {
  Promise.resolve(handlerReset(req, res)).catch(next);
});

// ============================================================================
// CHIRP API ROUTES
// ============================================================================

/**
 * GET /api/chirps - Retrieve all chirps
 * Returns: JSON array of all chirp objects
 */
app.get('/api/chirps', (req, res, next) => {
  Promise.resolve(handlerGetAllChirps(req, res)).catch(next);
});

/**
 * GET /api/chirps/:id - Retrieve a specific chirp by ID
 * Params: { id: string } - UUID of the chirp to retrieve
 * Returns: 200 OK with chirp object, or 404 if not found
 */
app.get('/api/chirps/:id', (req, res, next) => {
  Promise.resolve(handlerGetChirpById(req, res)).catch(next);
});

/**
 * POST /api/chirps - Create a new chirp
 * Body: { body: string, userId: string }
 * Returns: 201 Created with chirp object (includes profanity filtering)
 */
app.post('/api/chirps', (req, res, next) => {
  Promise.resolve(handlerChirp(req, res)).catch(next);
});

// ============================================================================
// USER API ROUTES
// ============================================================================

/**
 * POST /api/users - Create a new user account
 * Body: { email: string }
 * Returns: 201 Created with user object
 */
app.post('/api/users', (req, res, next) => {
  Promise.resolve(handlerCreateUser(req, res)).catch(next);
});

// ============================================================================
// ERROR HANDLING & SERVER STARTUP
// ============================================================================

// Global error handler (must be last middleware)
app.use(middlewareErrorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
