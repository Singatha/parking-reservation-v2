# Parkwise

A secure parking-reservation application implemented as a modular monolith. It keeps
authentication, vehicles, parking spaces, and reservations in one deployable API
while preserving clear module boundaries.

## What is included

- User registration and login
- Password hashing with bcrypt
- Opaque HTTP-only cookie sessions stored as hashes
- CSRF protection for every authenticated state change
- Session restoration after page refresh and server-side logout revocation
- Rate limiting for authentication endpoints
- User-owned vehicle management
- Parking-space listing and complete administrator management
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

Sign out and sign in again after promotion so the restored session includes the
administrator role.

For local API access, sign in and save the returned cookies:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YOUR_PASSWORD"}'
```

Read the `parking_csrf` value from `cookies.txt`, then create a parking space:

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/v1/spaces \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_VALUE" \
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
npm run test:integration
npm run test:e2e
npm run lint
npm run build
docker compose config --quiet
npm audit --omit=dev
```

Integration tests create and destroy only a database whose name ends in `_test`.
They cover registration, cookie-based login, session restoration, CSRF enforcement,
authorization, vehicle creation, administrator space creation, reservation conflict
detection, editing, activation, deactivation, safe removal, listing, cancellation,
logout, and server-side session revocation. The same checks run automatically in
GitHub Actions for pushes and pull requests.

Playwright browser tests exercise the real React interface in Chromium. They cover
customer registration, refresh-safe sessions, vehicle creation, reservation and
cancellation, logout, administrator promotion, and the parking-space management
interface. Test records use unique identifiers and are removed after the suite.

## Security notes

- Set `COOKIE_SECURE=true` whenever the application is served over HTTPS.
- Session and CSRF tokens are generated cryptographically; only their SHA-256 hashes
  are stored in MySQL.
- Do not commit `.env` files or production credentials.
- Terminate TLS at the ingress or reverse proxy in production.
- Rotate any credential that was previously committed in another repository; a new
  repository does not make an already exposed credential safe.
