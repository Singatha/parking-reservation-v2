# Parkwise

A secure parking-reservation application implemented as a modular monolith. It keeps
authentication, vehicles, parking spaces, and reservations in one deployable API
while preserving clear module boundaries.

## What is included

- User registration and login
- Password hashing with bcrypt
- JWT-protected API routes
- Rate limiting for authentication endpoints
- User-owned vehicle management
- Parking-space listing and administrator-only creation
- Transactional reservations with overlap protection
- Reservation history and cancellation
- MySQL migrations, health checks, structured logs, and graceful shutdown
- Responsive React interface
- Docker images that run as non-root users

No credentials are committed. The example environment file contains placeholders
only.

## Architecture

```text
Browser (React/Vite)
        |
        v
Express API
  ├── auth
  ├── vehicles
  ├── spaces
  └── reservations
        |
        v
      MySQL
```

## Run with Docker

```bash
docker compose up --build
```

The web application is available at `http://localhost:5173`, the API at
`http://localhost:3000`, and its health check at `http://localhost:3000/health`.

To stop it:

```bash
docker compose down
```

Add `-v` only when you intentionally want to remove local database data.

## Run locally

Requirements: Node.js 20 or newer and MySQL 8.

```bash
npm install
cp .env.example .env
```

Update `.env`, create the configured database and user, then run:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

The frontend reads `VITE_API_URL` at build time and defaults to
`http://localhost:3000/api/v1`.

The seed command is safe to run repeatedly. It creates or refreshes five sample
parking spaces identified by their unique space codes.

## Create the first administrator

Registration intentionally creates customer accounts only. After registering the
account that will administer parking spaces, promote it directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Sign in again after promotion so the new token includes the administrator role.

Create a parking space using that token:

```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "A-01",
    "type": "standard",
    "buildingName": "Central Parkade",
    "address": "1 Main Road",
    "hourlyPrice": 20
  }'
```

## Quality checks

```bash
npm test
npm run lint
npm run build
docker compose config --quiet
npm audit --omit=dev
```

## Security notes

- Use a randomly generated `JWT_SECRET` of at least 32 characters outside local
  Docker development.
- Do not commit `.env` files or production credentials.
- Terminate TLS at the ingress or reverse proxy in production.
- Rotate any credential that was previously committed in another repository; a new
  repository does not make an already exposed credential safe.
