# Chirpy 🐦

A simple social media platform for sharing short messages (chirps) with built-in profanity filtering and content validation.

## Features

- 📝 **Chirp Validation**: Validate messages up to 140 characters
- 🔒 **Profanity Filter**: Automatically censors inappropriate content
- 📊 **Metrics Tracking**: Monitor file server hits and usage
- 🌐 **Web Interface**: Simple HTML interface for users
- 🔧 **Admin Panel**: Administrative tools for managing the platform

## API Endpoints

### Public Endpoints

- `GET /api/healthz` - Health check endpoint
- `POST /api/validate_chirp` - Validate and clean chirp content
- `GET /app/` - Static web interface

### Admin Endpoints

- `GET /admin/metrics` - View usage metrics and statistics
- `POST /admin/reset` - Reset file server hit counter

## API Usage

### Validate Chirp

Validates a chirp message and filters profanity.

```bash
POST /api/validate_chirp
Content-Type: application/json

{
  "body": "This is my chirp message!"
}
```

**Success Response (200):**

```json
{
  "cleanedBody": "This is my chirp message!"
}
```

**Error Responses:**

- `400` - Missing or invalid data field
- `400` - Chirp too long (max 140 characters)

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

- **Runtime**: Node.js 21.7.0
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: TypeScript Compiler (tsc)

## Getting Started

### Prerequisites

- Node.js 21.7.0 (specified in `.nvmrc`)
- npm (comes with Node.js)

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

The server will start on `http://localhost:8080`

### Project Structure

```
chirpy/
├── src/
│   ├── app/
│   │   ├── assets/        # Static assets
│   │   ├── index.html     # Main web interface
│   │   └── index.ts       # Express app configuration
│   ├── handler.ts         # Route handlers
│   ├── middleware.ts      # Custom middleware
│   └── config.ts          # Application configuration
├── dist/                  # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

The application uses a simple configuration system in `src/config.ts` for tracking metrics and managing application state.

## Profanity Filter

Chirpy includes a built-in profanity filter that censors the following words:

- kerfuffle
- sharbert
- fornax

Filtered words are replaced with `****` in the cleaned output.

## Middleware

- **Request Logging**: Logs non-200 HTTP responses
- **Metrics Tracking**: Counts file server hits for `/app/` requests
- **Error Handling**: Graceful error responses
- **JSON Parsing**: Handles JSON request bodies
