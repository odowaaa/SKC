# Deploying AMODA

This covers taking AMODA from "runs locally" to "live on the internet." It assumes the
recommended stack: **Vercel** (web) + **Railway** (API + Postgres). DigitalOcean App Platform
or any other Docker host works too — see [Alternative hosts](#alternative-hosts).

Two ways to trigger deploys, pick one:

- **Native integration (recommended, zero extra CI code)**: connect the repo directly in the
  Vercel and Railway dashboards. Both platforms auto-deploy on push once configured. This is
  what the step-by-step below assumes.
- **Actions-driven** (`.github/workflows/amoda-deploy.yml`, already in this repo): deploys via
  the Vercel/Railway CLIs, gated on `AMODA CI` passing. Useful if you want an explicit approval
  gate or don't want to grant either platform direct repo access. Each job no-ops until you add
  its secrets (`VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` or `RAILWAY_TOKEN`), so it's
  safe to leave the workflow file in place even if you go with native integration instead.

## 1. Accounts you'll need

| Purpose | Provider | Required for launch? |
| --- | --- | --- |
| Web hosting | [Vercel](https://vercel.com) | Yes |
| API hosting + Postgres | [Railway](https://railway.app) (or DigitalOcean App Platform) | Yes |
| Image/media storage | [Cloudinary](https://cloudinary.com) | Yes — property photos won't upload without it |
| Transactional email | Any SMTP provider (Postmark, SES, Resend, etc.) | Yes — OTP/password-reset/notification emails |
| Card payments | [Stripe](https://stripe.com) | Only if selling/renting takes card payments |
| PayPal | [PayPal Developer](https://developer.paypal.com) | Only if you want PayPal as a payment option |
| Somali mobile money | WaafiPay merchant onboarding (covers Hormuud EVC Plus, Zaad, Sahal, Premier Wallet) | Only if you want mobile money payments |
| Google login | [Google Cloud Console](https://console.cloud.google.com) OAuth client | Only if you want "Sign in with Google" |
| Domain | Any registrar | Recommended, not strictly required (platforms give you a free subdomain) |

Nothing above is required just to get a **staging** deploy live — only `DATABASE_URL`,
`JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are truly mandatory for the API to boot. Everything
else degrades gracefully (e.g. emails log an error instead of sending) until you add real
credentials.

## 2. Database

Railway can provision Postgres directly in the same project as the API:

1. Create a new Railway project.
2. **New → Database → PostgreSQL.** Railway generates `DATABASE_URL` automatically and exposes
   it as a variable reference (`${{Postgres.DATABASE_URL}}`) you can hand to the API service.
3. Note the connection string — you'll wire it into the API service's env vars in the next step.

## 3. Deploy the API (Railway)

1. **New → Deploy from GitHub repo**, pick this repo.
2. Set **Root Directory** to `amoda`. Railway will detect `railway.json` (already committed) and
   build `apps/api/Dockerfile` — no build command needed.
3. Add environment variables (Settings → Variables). At minimum:
   - `DATABASE_URL` → reference the Postgres service's variable (`${{Postgres.DATABASE_URL}}`)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → generate with `openssl rand -hex 32` each
   - `CLIENT_URL` → your web app's URL once you know it (comma-separate if you have both a
     staging and production web URL), used for CORS and email links
   - `PORT` → `4000` (Railway sets `PORT` itself in most cases; the app reads `process.env.PORT`)
   - Any of the optional integrations from the table above (Cloudinary, Stripe, SMTP, ...) — see
     `apps/api/.env.example` for the full list of names
4. Deploy. `railway.json`'s `startCommand` runs `prisma migrate deploy` before booting the
   server, so schema migrations apply automatically on every deploy.
5. Once live, confirm `GET https://<your-api-domain>/api/v1/health` returns
   `{"success":true,"data":{"status":"ok"}}`.
6. Seed data is **not** run automatically (you don't want demo accounts in production by
   default). If you want sample listings for a staging environment, run
   `railway run --service api npm run prisma:seed` once, from `apps/api`.

## 4. Deploy the web app (Vercel)

1. **Add New → Project**, import this repo.
2. Set **Root Directory** to `amoda`. Vercel will pick up `vercel.json` (already committed),
   which builds `packages/shared` before `apps/web` and points at `apps/web/.next` as the output.
   Framework preset: Next.js (auto-detected).
3. Add environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` → `https://<your-api-domain>/api/v1`
   - `NEXT_PUBLIC_SITE_URL` → your Vercel URL (or custom domain once attached)
   - Optional: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
     `NEXT_PUBLIC_PAYPAL_CLIENT_ID` — see `apps/web/.env.example`
4. Deploy. Vercel builds directly from source (it does not use `apps/web/Dockerfile` — that
   file is only for self-hosting the web app via Docker, e.g. on DigitalOcean).
5. Once both are live, go back to the Railway API service and set `CLIENT_URL` to the real
   Vercel URL, then redeploy the API so CORS allows requests from it.

## 5. Domain & DNS

- Point your domain's `www`/apex at Vercel (Vercel's dashboard gives you the exact CNAME/A
  records once you add the domain to the project).
- Point an `api.` subdomain at Railway (Railway's dashboard gives you a CNAME target under
  Settings → Networking → Custom Domain).
- Update `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and `CLIENT_URL` to the real domain names
  and redeploy both services.

## 6. Full environment variable reference

See `apps/api/.env.example` and `apps/web/.env.example` in this repo for the complete list with
inline comments — this doc only calls out what's required vs. optional. Don't commit real
secrets; set them directly in the Vercel/Railway dashboards (or as GitHub Actions secrets if
using the Actions-driven deploy path).

## 7. Pre-launch checklist

Do this before pointing real users at it:

- [ ] Generate fresh `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` for production (don't reuse
      anything from local `.env` files or this doc's examples)
- [ ] Do **not** run `prisma:seed` against the production database — it creates demo accounts
      with a known password (`Passw0rd!`). If you already ran it, delete those accounts
      (`admin@amoda.app`, `agent@amoda.app`, `owner@amoda.app`, `customer@amoda.app`) and create
      real admin accounts instead
- [ ] Set `CLIENT_URL` on the API to your real web domain(s) only — this is what CORS uses
- [ ] Confirm the API is served over HTTPS (Railway/Vercel do this by default; if self-hosting,
      put a TLS-terminating proxy in front)
- [ ] Wire up real SMTP so OTP/password-reset/notification emails actually send
- [ ] Add error monitoring (e.g. Sentry) to both apps — not wired up yet
- [ ] Set up automated Postgres backups (Railway offers this; for self-managed Postgres, use
      `pg_dump` on a schedule)
- [ ] Review `apps/api/README.md`'s Roadmap section in the root `README.md` for known gaps
      (no CD-triggered saved-search alert emails, no CMS page builder, etc.) so you know what's
      genuinely not built yet vs. what's just unconfigured

## Alternative hosts

- **DigitalOcean App Platform** instead of Railway: it also builds directly from
  `apps/api/Dockerfile` given `amoda` as the source directory — the same Dockerfile and
  `startCommand` pattern apply, just configured through DO's App Spec instead of `railway.json`.
- **Self-hosted Docker** (any VPS): use `docker-compose.yml` at the `amoda/` root, which runs
  Postgres, Redis, the API, and the web app together. Fill in `amoda/.env` from `.env.example`
  first, then `docker compose up --build -d`.
