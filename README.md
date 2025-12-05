# Chirpy 🐦

A full-featured social media platform for sharing short messages (chirps) with comprehensive user management, JWT authentication, and advanced social features.

## Features

### 🔐 **Authentication & Security**

- **JWT Authentication**: Secure token-based authentication with 1-hour expiration
- **Refresh Tokens**: Long-lived tokens (60 days) with revocation capability
- **Password Security**: Argon2 password hashing for maximum security
- **Bearer Token Auth**: Standard Authorization header authentication

### 👤 **User Management**

- **User Registration**: Create accounts with email and secure passwords
- **Profile Updates**: Modify email and password with JWT authentication
- **Chirpy Red Premium**: Webhook-based user upgrades for premium features
- **User Authentication**: Secure login with token generation

### 🐦 **Chirp Operations**

- **Create Chirps**: Post messages with JWT authentication (max 140 characters)
- **Read Chirps**: Browse all chirps with sorting (newest/oldest first)
- **Filter by Author**: View chirps from specific users
- **Delete Chirps**: Remove your own chirps with ownership validation
- **Profanity Filter**: Automatic content moderation

### 🛡️ **Security Features**

- **Ownership Validation**: Users can only modify their own content
- **Token Revocation**: Invalidate refresh tokens for security
- **Rate Limiting**: Protection through middleware
- **Input Validation**: Comprehensive request validation

### 📊 **Admin & Monitoring**

- **Health Checks**: Service availability monitoring
- **Usage Metrics**: Track API usage and statistics
- **Development Tools**: Reset functionality for development
- **Error Handling**: Comprehensive error responses

## API Endpoints

### 🔐 **Authentication Endpoints**

- `POST /api/login` - User login with JWT and refresh token generation
- `POST /api/refresh` - Refresh JWT access token using refresh token
- `POST /api/revoke` - Revoke a refresh token

### 👤 **User Management**

- `POST /api/users` - Create new user account
- `PUT /api/users` - Update user profile (requires JWT)

### 🐦 **Chirp Operations**

- `GET /api/chirps` - Get all chirps (supports `?sort=asc|desc&authorId=uuid`)
- `GET /api/chirps/:id` - Get specific chirp by ID
- `POST /api/chirps` - Create new chirp (requires JWT)
- `DELETE /api/chirps/:id` - Delete chirp (requires JWT + ownership)

### 🔗 **Webhook Endpoints**

- `POST /api/polka/webhooks` - Process user upgrade webhooks (requires API key)

### 🏥 **System & Monitoring**

- `GET /api/healthz` - Health check endpoint
- `GET /admin/metrics` - Usage metrics dashboard
- `POST /admin/reset` - Reset system state (development only)

## API Usage

### 🔐 **Authentication Flow**

#### 1. Create Account

```bash
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (201):**

```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "isChirpyRed": false,
  "createdAt": "2025-12-05T12:00:00Z",
  "updatedAt": "2025-12-05T12:00:00Z"
}
```

#### 2. Login

```bash
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "expiresInSeconds": 3600
}
```

**Success Response (200):**

```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "isChirpyRed": false,
  "token": "jwt-access-token-here",
  "refreshToken": "refresh-token-here",
  "createdAt": "2025-12-05T12:00:00Z",
  "updatedAt": "2025-12-05T12:00:00Z"
}
```

### 🐦 **Chirp Operations**

#### Create Chirp (Requires JWT)

```bash
POST /api/chirps
Authorization: Bearer your-jwt-token-here
Content-Type: application/json

{
  "body": "Hello Chirpy world! This is my first chirp."
}
```

**Success Response (201):**

```json
{
  "id": "chirp-uuid-here",
  "body": "Hello Chirpy world! This is my first chirp.",
  "userId": "user-uuid-here",
  "createdAt": "2025-12-05T12:00:00Z",
  "updatedAt": "2025-12-05T12:00:00Z"
}
```

#### Get All Chirps

```bash
GET /api/chirps?sort=desc&authorId=user-uuid-here
```

**Response (200):**

```json
[
  {
    "id": "chirp-uuid-here",
    "body": "Hello Chirpy world!",
    "userId": "user-uuid-here",
    "createdAt": "2025-12-05T12:00:00Z",
    "updatedAt": "2025-12-05T12:00:00Z"
  }
]
```

### 🔄 **Token Management**

#### Refresh Token

```bash
POST /api/refresh
Authorization: Bearer your-refresh-token-here
```

**Success Response (200):**

```json
{
  "token": "new-jwt-access-token-here"
}
```

#### Revoke Token

```bash
POST /api/revoke
Authorization: Bearer your-refresh-token-here
```

**Success Response (204):** No content

### 📊 **Common Error Responses**

- `400` - Bad Request (missing required fields, validation errors)
- `401` - Unauthorized (invalid/expired tokens, authentication required)
- `403` - Forbidden (insufficient permissions, ownership validation failed)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Health Check

```bash
GET /api/healthz
```

**Response (200):**

```
OK
```

### Admin Metrics

```bash
GET /admin/metrics
```

**Response (200):**

```html
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited 42 times!</p>
  </body>
</html>
```

## Technology Stack

### 🚀 **Core Technologies**

- **Runtime**: Node.js 21.7.0
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: TypeScript Compiler (tsc)

### 🗄️ **Database & ORM**

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Database schema versioning

### 🔐 **Authentication & Security**

- **Password Hashing**: Argon2 (industry standard)
- **JWT Tokens**: jsonwebtoken library
- **Token Management**: Refresh tokens with revocation
- **Input Validation**: Comprehensive request validation

### 🧪 **Testing & Development**

- **Testing Framework**: Vitest
- **Test Coverage**: Comprehensive authentication and handler tests
- **Development Tools**: Hot reload, TypeScript compilation

## Getting Started

### Prerequisites

- **Node.js 21.7.0** (specified in `.nvmrc`)
- **PostgreSQL** database server
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/cyberdeeb/chirpy.git
   cd chirpy
   ```

2. **Install Node.js version (if using nvm):**

   ```bash
   nvm install
   nvm use
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up environment variables:**

   Create a `.env` file in the root directory:

   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/chirpy"
   JWT_SECRET="your-super-secret-jwt-key-here"
   POLKA_KEY="your-webhook-api-key-here"
   ```

5. **Set up the database:**

   ```bash
   # Run database migrations
   npm run db:migrate

   # Optional: Seed database with test data
   npm run db:seed
   ```

### Development

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

3. **Development mode (build + start):**

   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test              # Run all tests
   npm run test:watch    # Run tests in watch mode
   npm run test:coverage # Run tests with coverage report
   ```

The server will start on `http://localhost:8080`

### 🧪 **Testing**

Chirpy includes comprehensive test coverage:

- **Authentication Tests**: Password hashing, JWT creation/validation, token management
- **Handler Tests**: All API endpoint functionality
- **Integration Tests**: Complete request/response flows
- **Security Tests**: Authorization and ownership validation

Run `npm test` to execute the full test suite (23 tests covering all core functionality).

### Project Structure

```
chirpy/
├── src/
│   ├── app/
│   │   ├── assets/            # Static assets and images
│   │   ├── index.html         # Main web interface
│   │   └── index.ts           # Express app setup and routes
│   ├── auth/
│   │   ├── auth.ts            # JWT & password utilities
│   │   └── auth.test.ts       # Authentication test suite
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   ├── schema.ts          # Database schema definitions
│   │   └── queries/           # Database query functions
│   │       ├── users.ts       # User CRUD operations
│   │       ├── chirps.ts      # Chirp CRUD operations
│   │       └── refreshToken.ts # Token management
│   ├── handler.ts             # HTTP request handlers (13 handlers)
│   ├── middleware.ts          # Custom Express middleware
│   └── config.ts              # Application configuration
├── dist/                      # Compiled JavaScript output
├── migrations/                # Database migration files
├── .env                       # Environment variables (not in git)
├── package.json
├── tsconfig.json
├── vitest.config.js           # Test configuration
└── README.md
```

## 🔧 **Configuration**

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing (keep secure!)
- `POLKA_KEY`: API key for webhook authentication

### Application Config

The application uses `src/config.ts` for:

- JWT secret management
- API metrics tracking
- Platform environment detection (development/production)

## 🤬 **Profanity Filter**

Chirpy includes built-in content moderation that automatically censors inappropriate words:

- **Filtered words**: kerfuffle, sharbert, fornax
- **Replacement**: Filtered words become `****`
- **Processing**: Applied during chirp creation
- **Case-insensitive**: Handles all capitalization variations

## 🛡️ **Security Considerations**

### Authentication Security

- **Password Hashing**: Argon2 with salt (industry standard)
- **JWT Tokens**: Short-lived access tokens (1 hour max)
- **Refresh Tokens**: Long-lived with revocation capability (60 days)
- **Token Storage**: Refresh tokens stored securely in database

### API Security

- **Ownership Validation**: Users can only modify their own content
- **Input Sanitization**: All request data is validated
- **Error Handling**: Secure error messages prevent information leakage
- **CORS**: Configured for cross-origin requests

### Development vs Production

- **Admin Endpoints**: Reset functionality only available in development
- **Environment Detection**: Automatic platform detection
- **Database Migrations**: Safe schema updates

## 🚀 **Middleware Stack**

- **JSON Parsing**: Handles request body parsing
- **Error Handling**: Global error handler with proper HTTP status codes
- **Request Logging**: Logs non-200 responses for debugging
- **Metrics Tracking**: API usage statistics for monitoring
- **Static File Serving**: Handles `/app/` route with hit counting
- **CORS Support**: Cross-origin request handling
