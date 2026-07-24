# Parkwise

- Transactional reservations with overlap protection
Parkwise is a modern full-stack parking reservation platform. Customers can manage
vehicles, reserve available spaces, complete mock payments, and download PDF
invoices. Administrators can manage the parking inventory through protected
role-based workflows.

The application is implemented as a modular monolith: authentication, profiles,
vehicles, spaces, reservations, billing, and invoices share one deployable API
while retaining clear module boundaries.

## Demo workflow

1. Register a customer account.
2. Add a vehicle from the Vehicles page.
3. Choose an available parking space and reservation period.
4. Approve the simulated payment.
5. Open the generated invoice or download it as a PDF.

The payment flow is intentionally simulated. It does not collect or transfer real
money.

## Features

### Customers

- Register, sign in, restore a session after refresh, and securely sign out
- Edit profile details and change a password
- Add and remove owned vehicles
- Browse available parking spaces
- Create reservations with overlap protection and 15-minute payment holds
- Approve or decline simulated payments
- Review reservation history and cancel eligible reservations
- View, search, and download immutable PDF invoices
- Choose a persistent light, dark, or system theme

### Administrators

- Create and edit parking spaces
- Activate or deactivate spaces
- Safely remove unused spaces
- Access role-protected management routes and controls

### Platform

- Responsive, accessible React interface
- MySQL migrations and repeatable development seed data
- Health checks, structured logging, and graceful shutdown
- Non-root production Docker images
- Unit, integration, and Playwright browser tests

No credentials are committed. The example environment file contains placeholders
only.

## Screenshots

The interface includes dedicated parking, vehicle, reservation, invoice, profile,
and administrator views in both light and dark themes. Repository screenshots can
be added under `docs/screenshots/` when a stable public demo dataset is available,
then embedded here without exposing local account information.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS |
| UI | Radix UI, Lucide, shadcn-style components |
| Routing and data presentation | React Router, TanStack Table |
| PDF generation | jsPDF |
| Backend | Node.js, Express |
| Database | MySQL 8 |
| Authentication | Opaque HTTP-only cookie sessions and CSRF protection |
| Testing | Vitest, Playwright |
| Infrastructure | Docker, Nginx |

## Architecture

```text
Browser (React/Vite)
        |
        v
Express API
  ├── auth
  ├── profiles
  ├── vehicles
  ├── spaces
  ├── reservations
  └── billing and invoices
        |
        v
      MySQL
```

## Frontend design system

The interface uses Tailwind CSS for design tokens and responsive layouts,
shadcn-style reusable components, Radix UI for accessible menus, Lucide icons,
React Router for page-level workflows, and TanStack Table for invoice data. Forms
for vehicles, reservations, and parking spaces live on dedicated routes, while
profile, theme, administrator controls, and sign out are grouped in the navigation
profile menu.

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
mock payment, invoice viewing, cancellation, profile editing, dark-mode persistence,
logout, administrator promotion, and the parking-space management interface. Test
records use unique identifiers and are removed after the suite.

## Mock billing

Reservations begin in `pending_payment` and hold a space for 15 minutes. The UI can
simulate an approved or declined payment:

- Approval confirms the reservation and creates an immutable invoice snapshot.
- Decline cancels the reservation and releases the space.
- Reusing an idempotency key returns the original payment instead of charging twice.

This gateway does not move real money and must not be represented as a real payment.
The payment service boundary is intended to support a future Stripe adapter and
verified webhook flow without changing reservations or invoices.

Invoices default to a zero tax rate. Configure `INVOICE_TAX_RATE` only after obtaining
appropriate accounting guidance for the deployment jurisdiction.

## Security notes

- Passwords are hashed with bcrypt.
- Authentication endpoints are rate limited.
- Every authenticated state change requires CSRF validation.
- Transactional reservation checks prevent overlapping bookings.
- Set `COOKIE_SECURE=true` whenever the application is served over HTTPS.
- Session and CSRF tokens are generated cryptographically; only their SHA-256 hashes
  are stored in MySQL.
- Do not commit `.env` files or production credentials.
- Terminate TLS at the ingress or reverse proxy in production.
- Rotate any credential that was previously committed in another repository; a new
  repository does not make an already exposed credential safe.

## Current limitations

- Payments are simulated and do not move real money.
- PDF invoices are generated in the browser rather than archived by the API.
- Email and push notifications are not enabled.
- Tax defaults to zero and is not a substitute for jurisdiction-specific accounting
  advice.
- Production hosting, monitoring, backups, and disaster recovery are not configured
  by this repository.

## Roadmap

Future work is intentionally parked while the current product is stabilized.
Possible next steps include a verified Stripe payment adapter, email notifications,
server-generated invoice archives, production observability, database backups, and
deployment automation.

## Contributing

1. Create a branch from the default branch.
2. Keep changes focused and include tests for new behavior.
3. Run the quality checks documented above.
4. Open a pull request describing the change, validation performed, and any database
   or environment updates.

Please do not commit `.env` files, credentials, generated test artifacts, or customer
data.

## License

No open-source license has been selected yet. Until a license file is added, the
repository remains protected by default copyright rules and should not be treated
as granting permission to copy, modify, or redistribute the code.
