# MAHAYSAA — Somalia's Local Marketplace & Delivery Platform

**"Ma haysaa?"** — Do you have it?

MAHAYSAA connects local shops, suppliers, and independent delivery drivers
(tuk-tuks, motorcycles, pickups) into one marketplace, in Somali (primary)
and English (secondary).

## What this is

The full product brief describes a mobile + web super-app: native Flutter
apps, a NestJS/GraphQL microservices backend, Kubernetes, live GPS tracking,
real payment gateway integrations (EVC Plus, Zaad, Stripe, ...), SMS/WhatsApp
notifications, and AI features. That is a multi-team, multi-quarter build.

This repo is a **working web MVP** of the same product: a single Next.js
app that implements the core end-to-end loop described in the brief —

```
search → find product/supplier → get referral code → place order
  → nearest driver accepts delivery → delivery completed
  → commission auto-calculated for supplier and driver → customer rates order
```

— plus registration/approval flows, role-based dashboards, and instant
Somali/English switching, so the business logic and data model are real and
testable, not mocked.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Prisma** ORM, SQLite for local dev (swap the `datasource` provider to
  `postgresql` for production — see note in `prisma/schema.prisma`)
- Custom JWT session auth (`jose` + `bcryptjs`, httpOnly cookie) — no
  external auth service required to run locally
- Zod for input validation at the API boundary

## What's implemented

- **Roles**: Customer, Supplier, Driver, Admin (+ Regional/Finance/Support
  admin roles modeled, not yet UI-differentiated)
- **Customer**: search products/suppliers by keyword, category, price,
  sort; product page; generate a `MH-XXXXXX` referral code per
  supplier/product; place an order (COD or listed mobile-money method);
  view orders and referral codes; rate delivered orders
- **Supplier**: registration form with the Supplier Agreement rendered
  in-app (Somali + English) and captured as an e-signature (typed name +
  timestamp + IP, stored in `SupplierAgreement`); pending-review gate;
  product CRUD; order list; revenue/commission/payout dashboard
- **Driver**: registration with vehicle details (tuk-tuk, motorcycle,
  pickup, mini truck, three-wheeler, small lorry); pending-review gate;
  availability toggle; open-jobs feed sorted by GPS distance from the
  driver (Haversine); claim/complete a delivery; income + commission
  dashboard
- **Admin**: platform stats, supplier/driver approval queue, category and
  per-category commission-rate management
- **Commission engine**: supplier commission % is configurable per
  category (seeded per the brief's category list) and applied automatically
  on order creation; driver commission defaults to 1.5% per delivery,
  applied on delivery completion
- **Referral code fraud prevention**: a code is bound to one
  customer+supplier(+product), can only be redeemed once, and is
  validated server-side against the order's supplier before it's accepted
- **i18n**: Somali (default) / English, instant client-side switch,
  persisted in `localStorage`
- **Branding**: primary blue `#0057B8`, secondary green `#0E9F6E`, accent
  orange `#F59E0B`, per the brief
- **Favorites**: heart-toggle on product cards, saved list in the
  customer dashboard
- **Saved addresses**: customers can save labeled delivery addresses and
  pick one at checkout instead of retyping it every order
- **Notifications**: bell icon with unread badge and mark-as-read,
  populated on order placement and supplier/driver approval
- **Supplier order workflow**: Confirmed → Preparing → Ready for Delivery
  (or Cancel), driven from the supplier dashboard
- **Product image upload**: suppliers can attach a photo when adding a
  product (saved to local disk under `public/uploads` — see note below)
- **Admin category management**: create new categories with their own
  commission rate, in addition to editing existing ones

## Explicitly out of scope for this pass (documented, not hidden)

These are called out in the brief but are large, separately-scoped
efforts. Building them for real requires infrastructure/vendor accounts
this environment doesn't have:

- **Native mobile apps** (Flutter) — this is a responsive web app instead;
  the API layer is already separate from the UI, so a Flutter/React
  Native client could be built against it later without backend changes
- **Real payment gateway integrations** (EVC Plus, Zaad, Sahal, eDahab,
  Stripe, PayPal, Flutterwave, ...) — the data model and order flow
  support any of these as a `paymentMethod`, but no gateway is actually
  wired up; all orders currently behave like COD
- **Real-time GPS map UI** (Google Maps / OSM tiles, live tracking) —
  distance/ETA math (Haversine) and nearest-driver sorting are real; there
  is no map widget
- **SMS / WhatsApp / push notifications** — an in-app `Notification` model
  exists and is populated on key events; no external delivery channel is
  connected
- **AI search / recommendations / chatbot / fraud detection** — the search
  endpoint does substring matching across name/description/category in
  both languages, which covers simple Somali/English queries, but there is
  no LLM or ML model in the loop
- **Microservices / Kubernetes / GraphQL** — this is a single Next.js
  service; the API routes are already isolated by concern
  (`/api/orders`, `/api/deliveries`, ...) if a future split is needed
- **2FA, OAuth, GDPR tooling, audit logs, fraud detection** — session auth
  is JWT + bcrypt only

## Known risks to address before any real deployment

- `next@14.2.x` has several disclosed advisories (mostly around Image
  Optimization `remotePatterns`, Middleware, and RSC caching — features this
  app doesn't use). `npm audit` will flag them. Before production, upgrade to
  a current Next.js major version; that wasn't done here because it's a
  breaking change out of scope for this pass.
- Product image uploads are written to the local filesystem
  (`public/uploads/products`). That only works for a single, persistent
  server process. On serverless/ephemeral hosting (Vercel, most container
  platforms) the filesystem resets on every deploy/cold start, so uploads
  would silently disappear — swap `src/app/api/uploads/route.ts` for a real
  object store (S3, Cloudflare R2) before deploying anywhere like that.

## Running locally

```bash
cd mahaysaa
npm install
cp .env.example .env        # already done in this repo; edit JWT_SECRET for real use
npx prisma db push          # creates prisma/dev.db
npm run seed                # seeds categories + 4 demo accounts
npm run dev                 # http://localhost:3000
```

Demo accounts (password for all: `Password123!`):

| Role     | Phone            |
|----------|------------------|
| Admin    | +252610000001    |
| Customer | +252610000002    |
| Supplier | +252610000003    |
| Driver   | +252610000004    |

## Project layout

```
prisma/schema.prisma   Data model (User, Supplier, SupplierAgreement,
                        Category, Product, Driver, Vehicle, Order,
                        OrderItem, ReferralCode, Delivery, Commission,
                        DriverEarning, Review, Notification, ...)
prisma/seed.ts          Categories from the brief + demo accounts/products
src/lib/                auth, db, i18n, commission, referral, geo, validation
src/app/api/            REST API routes (auth, products, suppliers, drivers,
                        orders, deliveries, referral, reviews, admin/*)
src/app/                Pages: home, search, product/[id], supplier/[id],
                        supplier/register, driver/register, auth/*,
                        dashboard/{customer,supplier,driver}, admin
```
