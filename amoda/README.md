# AMODA — Your Property Partner

A modern, production-grade real estate platform: property search and listings, bookings, favorites,
reviews, a role-based dashboard, and a payments architecture that supports Stripe, PayPal, and Somali
mobile money (Hormuud EVC Plus, Zaad, Sahal, Premier Wallet).

This is the **MVP core** of the full AMODA specification — a real, working foundation (not a mockup)
that the rest of the platform (full CMS, CRM, rental/lease management, AI features) builds on
incrementally. See [Roadmap](#roadmap) for what's scaffolded vs. what's next.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, TanStack Query, React Hook Form + Zod, Axios |
| Backend | NestJS 10, TypeScript, REST API, Swagger, class-validator |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT access/refresh tokens, Argon2 password hashing, email OTP verification, password reset, Google OAuth (Apple/Facebook wired, need credentials) |
| Storage | Cloudinary |
| Payments | Stripe, PayPal, WaafiPay-protocol mobile money (Hormuud EVC, Zaad, Sahal, Premier Wallet) |
| Notifications | Email (Nodemailer/SMTP), SMS/Push/WhatsApp provider interfaces |
| Infra | Docker, Docker Compose, GitHub Actions CI |

## Monorepo structure

```
amoda/
├── apps/
│   ├── api/                # NestJS backend
│   │   ├── prisma/         # schema.prisma, migrations, seed.ts
│   │   └── src/
│   │       ├── common/     # guards, decorators, filters, interceptors
│   │       ├── config/     # typed configuration
│   │       ├── prisma/     # PrismaService/PrismaModule
│   │       └── modules/    # auth, users, properties, bookings, payments, ...
│   └── web/                # Next.js frontend
│       └── src/
│           ├── app/        # App Router pages (public site, auth, dashboard)
│           ├── components/ # UI primitives + feature components
│           ├── lib/        # API clients, utils, types
│           └── store/      # Zustand auth store
├── packages/
│   └── shared/              # Shared Zod schemas, enums, types used by both apps
├── docker-compose.yml
└── .github/workflows/amoda-ci.yml (repo root)
```

## What's implemented

- **Auth**: register/login, JWT access + rotating refresh tokens, email OTP verification, forgot/reset
  password, Google OAuth, RBAC guards for all 15 platform roles, login/audit event logging.
- **Properties**: full CRUD, advanced search (type, listing type, price/area/bedroom ranges, amenities,
  city/district, map bounding box), pagination & sorting, image/media attachment, similar listings,
  view counting, featured/luxury flags.
- **Bookings**: schedule/confirm/cancel/reschedule/complete viewings with email confirmations.
- **Favorites, reviews, amenities, categories, agents directory, blog (CMS-lite), contact form** (creates
  a support ticket + confirmation email).
- **Payments**: a `PaymentGateway` strategy interface with a real Stripe integration (PaymentIntents +
  webhook handling) and a real PayPal integration (OAuth + Orders API), plus a shared WaafiPay-protocol
  adapter used by Hormuud EVC Plus, Zaad, Sahal, and Premier Wallet — each configured via its own
  merchant credentials in `.env`.
- **Notifications**: working email sending; SMS/push/WhatsApp behind provider interfaces ready to wire to
  a real gateway (Twilio/Africa's Talking, FCM/APNs, WhatsApp Cloud API).
- **Database**: a fully normalized Prisma schema covering users/roles, properties/media/amenities,
  agents/owners/tenants/developers, bookings, messaging, CRM leads/notes/tasks, offers/commissions,
  leases/maintenance requests, payments/invoices/subscriptions, notifications, support tickets, blog/SEO,
  audit logs, and file storage.
- **Security**: Argon2 hashing, Helmet, CORS, rate limiting (`@nestjs/throttler`), global validation
  pipe, structured error responses, audit logging table. Non-staff users cannot self-publish or
  self-approve a listing — any edit to a property they own resets it to `PENDING_REVIEW`.
- **CRM (leads)**: public "request information" capture from a property page, lead pipeline
  (new → contacted → qualified → negotiating → won/lost), assignment, notes, and follow-up tasks.
- **Rental management**: lease creation (owner ↔ tenant, auto-provisions a tenant account), rent
  invoice generation, lease termination, and tenant maintenance requests with status tracking.
- **Role-based dashboards** (`/dashboard`): a single dashboard shell whose navigation and data adapt to
  the signed-in role — admins get property moderation (approve/reject/feature), user management, and
  blog publishing; agents get their listings, assigned leads, offers, and appointment management; owners
  get their listings and lease/invoice tools; everyone gets favorites, saved searches, and booking
  history. A shared create/edit property form (with Cloudinary image upload) is used across all
  listing-capable roles.
- **Sales management (offers)**: buyers submit offers on a for-sale listing (no account required);
  agents/staff accept, reject, or mark countered — accepting an offer moves the property to
  `UNDER_OFFER` and auto-generates an agent commission record from their configured commission rate.
- **Compare properties & saved searches**: side-by-side spec comparison for up to 4 listings, and
  named saved searches that re-run a filter set from the dashboard.
- **Two-factor authentication (TOTP)**: QR-code enrollment compatible with Google Authenticator/Authy,
  a login-time challenge when enabled, and an enable/disable flow gated by a valid code.
- **Mortgage calculator**: amortization-based monthly payment estimate, standalone at
  `/mortgage-calculator` and embedded on for-sale property pages.
- **In-app notifications**: a header bell backed by the existing notifications API, with unread counts
  and mark-as-read.
- **DX**: Swagger docs at `/api/docs`, seed script with demo accounts and sample listings, unit + e2e
  tests, Dockerfiles for both apps, docker-compose for local full-stack + Postgres + Redis, CI workflow.

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16 (or use `docker compose up postgres`)

### 1. Install dependencies

```bash
cd amoda
npm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

At minimum, set `DATABASE_URL` in `apps/api/.env`. Everything else (OAuth, Cloudinary, Stripe, mobile
money credentials, SMTP) is optional for local development — the app degrades gracefully (e.g. emails
are logged instead of sent if SMTP isn't configured).

### 3. Set up the database

```bash
npm run prisma:migrate   # creates tables
npm run prisma:seed      # seeds demo users, amenities, and sample properties
```

Demo accounts (password: `Passw0rd!`):

| Email | Role |
| --- | --- |
| admin@amoda.app | SUPER_ADMIN |
| agent@amoda.app | AGENT |
| owner@amoda.app | OWNER |
| customer@amoda.app | CUSTOMER |

### 4. Run the apps

```bash
npm run dev:api   # http://localhost:4000/api/v1  (Swagger at /api/docs)
npm run dev:web   # http://localhost:3000
```

### Or run everything with Docker Compose

```bash
cp .env.example .env   # fill in secrets
docker compose up --build
```

This starts Postgres, Redis, the API, and the web app together.

## Testing

```bash
npm run test -w apps/api       # unit tests
npm run test:e2e -w apps/api   # e2e tests (requires DATABASE_URL)
```

## API documentation

Interactive Swagger docs are served at `GET /api/docs` once the API is running.

## Deployment notes

- **Frontend**: deploy `apps/web` to Vercel (or any Node host) — set `NEXT_PUBLIC_API_URL` to your API's
  public URL and put Cloudflare in front for caching/WAF.
- **Backend**: deploy `apps/api` to Railway, DigitalOcean App Platform, or any Docker host using
  `apps/api/Dockerfile`. Run `npx prisma migrate deploy` on release.
- **Database**: managed PostgreSQL (Railway, DigitalOcean Managed Postgres, RDS, etc.).
- **CI**: `.github/workflows/amoda-ci.yml` lints, typechecks, runs tests against a Postgres service
  container, and builds both apps on every push/PR that touches `amoda/**`.

## Roadmap

This MVP intentionally scopes down the full AMODA specification to a real, working core. Not yet built:

- CMS site-builder tooling (homepage/footer builder, theme settings, menus, media library UI, SEO
  fields UI) — the blog and property moderation dashboards exist; drag-and-drop page building doesn't
- Lease documents/e-signing, automated rent-collection reminders, tenant-facing lease portal beyond the
  dashboard list (lease creation, invoicing, and maintenance requests are built)
- CRM pipeline board view and call/email logging (lead list, notes, tasks, and status pipeline exist)
- Device/session management UI, Apple & Facebook OAuth (schema + config wired, need app credentials)
- AI features (description generation, price estimation, chat assistant, recommendations)
- Map-based polygon search, virtual tours/360° viewer, floor plan uploads UI
- Redis-backed caching and rate-limit store (currently in-memory throttling)
- Saved-search alert emails (the model and UI exist; no background job triggers them yet)
