# SomaliKing College (SKC) Website

The official website and administration platform for **SomaliKing College (SKC)** — *"Building Skills for a Better Future"* — a career-focused, competency-based college in Garowe, Puntland, Somalia offering certificate and diploma pathways across five Schools: English & Communication, Information Technology, Engineering & Technical Studies, Social & Human Services, and Health Skills.

Built with **HTML5 + Tailwind CSS + vanilla JavaScript** on the frontend, and a **Cloudflare Worker + D1 (SQLite) + R2 (object storage)** backend covering admissions, contact messages, a role-based staff administration system, a Student Information System (enrollment/attendance/grades/ID cards), file/media management, and site-wide settings. Deployed as a single Cloudflare Worker (`skc-college`) serving both the static site and its API.

## Pages

| Page | File |
| --- | --- |
| Home | `public/index.html` |
| About | `public/about.html` |
| Admissions (application form) | `public/admissions.html` |
| Faculties / Schools | `public/faculties.html` |
| Programs (fetched from `/api/programs`) | `public/programs.html` |
| Student Portal (sign in / register) | `public/student-portal.html` |
| Student Dashboard (status, courses, grades) | `public/student-dashboard.html` |
| Student ID Card (printable) | `public/student-id-card.html` |
| Staff Portal (sign in) | `public/staff-portal.html` |
| Staff Dashboard (full admin CMS — see below) | `public/staff-dashboard.html` |
| News (fetched from `/api/news`) | `public/news.html` |
| Gallery (fetched from `/api/gallery`) | `public/gallery.html` |
| Contact (message form) | `public/contact.html` |
| 404 | `public/404.html` |

## Staff Dashboard (Admin CMS)

The Staff Dashboard is a full administration system with role-based access control. Tabs are shown/hidden per the signed-in staff member's role:

| Tab | Roles | Purpose |
| --- | --- | --- |
| Dashboard | all | Quick stats (applications, students, messages, content, staff) |
| Applications | Super Admin, Registrar | Review/accept/reject admissions applications |
| Students | Super Admin, Registrar | Directory, enrollment, courses, attendance, grades |
| Messages | Super Admin, Registrar, Staff | Contact form inbox |
| News / Programs / Gallery | Super Admin, Staff | Content management (Gallery supports real photo uploads) |
| Departments | Super Admin, Registrar | Manage the 5 Schools as real records |
| Media | Super Admin, Registrar, Staff | Browse/delete all uploaded files |
| Staff | Super Admin | Create/edit/deactivate staff accounts, reset passwords |
| Audit Log | Super Admin | Who did what, when — every admin action is logged |
| Settings | Super Admin | Site-wide contact info, tagline, social links, office hours |
| Account | all | Change your own password |

**Roles**: `super_admin` (everything), `registrar` (admissions/students/enrollment/departments), `staff` (content/messages), `finance` (reserved — no finance module exists yet; add one and gate it on this role when needed).

## Student Information System (SIS)

Students self-register and can be enrolled by a Registrar into any published Program. Once enrolled:
- Staff record **attendance** per course/date and **grades** per course.
- Students see their **enrollments, courses, and grades** on their dashboard (a lightweight transcript).
- Every student gets a unique **student number** (`SKC-<year>-<0000>`) and can view/print a **Student ID Card**, optionally with an uploaded photo. `GET /api/verify/:student_number` is a public endpoint for verifying a printed ID.

## File & Media Management

Uploads (gallery photos, student ID photos, general files) go to a Cloudflare **R2** bucket (`skc-media`, binding `MEDIA`). Files are served publicly via `GET /api/media/:id`; only PNG/JPEG/WebP/GIF/SVG up to 8MB are accepted. The Media tab lists everything uploaded across the site.

## Backend

- **`worker/index.js`** — thin router dispatching to the modules below
- **`worker/http.js`** — shared JSON/response helpers
- **`worker/auth.js`** — PBKDF2 password hashing + session cookie helpers (staff sessions are invalidated immediately on deactivation or logout)
- **`worker/rbac.js`** — role definitions and the `can(user, resource)` permission check
- **`worker/audit.js`** — writes to the `audit_logs` table
- **`worker/db.js`** — small D1 query helpers
- **`worker/routes/public.js`** — admissions, contact, auth, student self-service (`/api/me/*`), public content reads
- **`worker/routes/admin-content.js`** — applications, messages, News/Programs/Gallery CRUD
- **`worker/routes/admin-staff.js`** — staff/user management, departments, dashboard stats, audit log
- **`worker/routes/sis.js`** — students, courses, enrollments, attendance, grades
- **`worker/routes/media.js`** — R2 upload/serve/delete
- **`worker/routes/settings.js`** — site settings admin CRUD

### Migrations (run in order)

| File | Adds |
| --- | --- |
| `0001_init.sql` | Core schema: students, staff, sessions, applications, contact_messages, news_posts, programs, gallery_items |
| `0002_seed.sql` | Original News/Programs/Gallery content + one seeded staff/admin account |
| `0003_phase1_rbac.sql` | Staff roles/`active` flag, `departments`, `audit_logs` |
| `0004_phase2_sis.sql` | `student_number`, `courses`, `enrollments`, `attendance`, `grades` |
| `0005_phase3_media.sql` | `media_files`, gallery/student photo linkage |
| `0006_phase4_settings.sql` | `site_settings` (seeded with current contact info) |
| `0007_news_media.sql` | `news_posts.media_id` (real uploaded photo, falls back to gradient) |

Seeded staff/admin account — **change this password immediately after first deploy** (Staff Dashboard → Account tab):
- Email: `admin@somalikingcollege.edu.so`
- Temporary password: `SKCAdmin2026!`

### API summary

Public: `POST /api/admissions`, `POST /api/contact`, `POST /api/auth/student/register`, `POST /api/auth/student/login`, `POST /api/auth/staff/login`, `POST /api/auth/logout`, `GET /api/me`, `PATCH /api/me/password`, `GET /api/me/applications`, `GET /api/me/enrollments`, `GET /api/me/transcript`, `GET /api/me/id-card`, `POST /api/me/photo`, `GET /api/news`, `GET /api/programs`, `GET /api/gallery`, `GET /api/departments`, `GET /api/settings`, `GET /api/media/:id`, `GET /api/verify/:student_number`.

Staff-only (session cookie + role required, see the roles table above): `GET/PATCH /api/admin/applications[/:id]`, `GET/PATCH /api/admin/messages[/:id]`, `GET/POST/PUT/DELETE /api/admin/{news,programs,gallery}[/:id]`, `GET/POST/PUT/DELETE /api/admin/departments[/:id]`, `GET/POST/PUT/DELETE/PATCH /api/admin/staff[/:id]`, `GET /api/admin/stats`, `GET /api/admin/audit-logs`, `GET/POST/PUT/DELETE /api/admin/{students,courses,enrollments,attendance,grades}[/:id]`, `GET/POST/DELETE /api/admin/media[/:id]`, `GET/PATCH /api/admin/settings`.

Students self-register from the Student Portal. Staff accounts are **not** publicly self-serve — a Super Admin creates them from the Staff Dashboard (Staff tab), or you can seed one via a migration.

## Project Structure

```
├── public/                # Everything Cloudflare serves as static assets
│   ├── index.html, about.html, ...
│   ├── css/tailwind.css   # Compiled, minified Tailwind output (committed)
│   ├── js/main.js         # Shared site behaviour (nav, forms, filters, lightbox, settings hydration)
│   └── images/            # Crest, full logo lockup, OG image (SVG)
├── worker/                # Cloudflare Worker source (the API)
│   ├── index.js, http.js, auth.js, rbac.js, audit.js, db.js
│   └── routes/            # public.js, admin-content.js, admin-staff.js, sis.js, media.js, settings.js
├── migrations/            # D1 schema SQL, run in numeric order
├── src/input.css          # Tailwind source (@tailwind directives + component classes)
├── tailwind.config.js
├── wrangler.jsonc         # Worker + D1 + R2 + custom domain configuration
└── package.json
```

`public/` is intentionally separate from `worker/`, `migrations/`, and `node_modules/` — Cloudflare's asset bundler and Wrangler's local dev file-watcher both treat the `assets.directory` as their scan root, so keeping it isolated avoids bundling `node_modules` into the deployment and avoids an infinite reload loop in local dev.

## Local Development

Requires Node.js 18+.

```bash
npm install
npm run build        # compiles src/input.css -> public/css/tailwind.css (minified)
npm run watch         # rebuilds CSS on change while you edit HTML
```

To run the full site **with the API, database, and file storage**:

```bash
npx wrangler d1 create skc_db
# copy the printed database_id into wrangler.jsonc (d1_databases[0].database_id)

npx wrangler d1 execute skc_db --local --file=migrations/0001_init.sql
npx wrangler d1 execute skc_db --local --file=migrations/0002_seed.sql
npx wrangler d1 execute skc_db --local --file=migrations/0003_phase1_rbac.sql
npx wrangler d1 execute skc_db --local --file=migrations/0004_phase2_sis.sql
npx wrangler d1 execute skc_db --local --file=migrations/0005_phase3_media.sql
npx wrangler d1 execute skc_db --local --file=migrations/0006_phase4_settings.sql
npx wrangler d1 execute skc_db --local --file=migrations/0007_news_media.sql

npm run dev           # same as: npx wrangler dev --local
```

Then open `http://localhost:8787`. R2 is simulated locally by Wrangler automatically — no extra setup needed for local dev.

## Deploying to Cloudflare

1. Create the D1 database (once, if you haven't already): `npx wrangler d1 create skc_db`, then put the returned `database_id` into `wrangler.jsonc`.
2. Create the R2 bucket (once): `npx wrangler r2 bucket create skc-media`.
3. Run all migrations against the **remote** database, in order:
   ```bash
   npx wrangler d1 execute skc_db --remote --file=migrations/0001_init.sql
   npx wrangler d1 execute skc_db --remote --file=migrations/0002_seed.sql
   npx wrangler d1 execute skc_db --remote --file=migrations/0003_phase1_rbac.sql
   npx wrangler d1 execute skc_db --remote --file=migrations/0004_phase2_sis.sql
   npx wrangler d1 execute skc_db --remote --file=migrations/0005_phase3_media.sql
   npx wrangler d1 execute skc_db --remote --file=migrations/0006_phase4_settings.sql
   npx wrangler d1 execute skc_db --remote --file=migrations/0007_news_media.sql
   ```
   (If your database already has earlier migrations applied from a previous deploy, just run whichever numbered files are new.)
4. Deploy: `npx wrangler deploy`
5. If you haven't already, register a `workers.dev` subdomain (Wrangler will prompt on first deploy) and/or attach your custom domain in the Cloudflare dashboard under the Worker's **Domains** tab — `wrangler.jsonc` already declares `skc.college` and `www.skc.college` as custom domain routes, provided that domain's zone has no conflicting DNS records at the root/`www` hostnames.

Re-run `npm run build` (and redeploy) any time you change Tailwind classes or `src/input.css` — `public/css/tailwind.css` is committed so no build step is required on Cloudflare's side.

## Before Going Live

- **Change the seeded staff password** immediately after first deploy (Staff Dashboard → Account tab).
- Replace the placeholder domain `https://www.somalikingcollege.edu.so` in `sitemap.xml`, canonical tags, and JSON-LD with the real live domain.
- Review/update contact details and social links from the Staff Dashboard's **Settings** tab (phone and email propagate site-wide automatically; other fields are available via `/api/settings` for future use).
- Consider adding a "Forgot password" flow (currently links to the Contact page) and email notifications for new applications/messages — both are natural next steps on top of the current schema.
- The `finance` role exists in the schema but has no dedicated screens yet — build a fees/billing module and gate it on that role when needed.
