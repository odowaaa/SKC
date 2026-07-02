# SomaliKing College (SKC) Website

The official marketing and information website for **SomaliKing College (SKC)** — *"Building Skills for a Better Future"* — a career-focused, competency-based college in Garowe, Puntland, Somalia offering certificate and diploma pathways across five Schools: English & Communication, Information Technology, Engineering & Technical Studies, Social & Human Services, and Health Skills.

Built with **HTML5**, **Tailwind CSS**, and vanilla **JavaScript**. Fully static, responsive, SEO-optimized, and ready to deploy on **Cloudflare Pages**.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| About | `about.html` |
| Admissions | `admissions.html` |
| Faculties / Schools | `faculties.html` |
| Programs | `programs.html` |
| Student Portal | `student-portal.html` |
| Staff Portal | `staff-portal.html` |
| News | `news.html` |
| Gallery | `gallery.html` |
| Contact | `contact.html` |
| 404 | `404.html` |

## Features

- Responsive, mobile-first layout with an accessible sticky nav, dropdowns, and mobile menu
- Light/dark mode toggle (persisted via `localStorage`)
- Scroll-reveal animations, animated stat counters, and a testimonial/quote carousel
- Filterable Programs, News, and Gallery grids with a lightbox
- FAQ accordions, client-side form validation, and demo Student/Staff portal sign-in forms
- SEO: per-page titles/descriptions, canonical URLs, Open Graph & Twitter cards, `CollegeOrUniversity` JSON-LD, `sitemap.xml`, `robots.txt`
- Custom SVG crest/logo, favicon, and social-preview image — no external image dependencies

## Project Structure

```
├── index.html, about.html, ...      # Static pages (generated from templates, see below)
├── css/tailwind.css                 # Compiled, minified Tailwind output (committed)
├── js/main.js                       # Shared site behaviour
├── images/                          # Crest, full logo lockup, OG image (SVG)
├── src/input.css                    # Tailwind source (@tailwind directives + component classes)
├── tailwind.config.js               # Design tokens: colors, fonts, animations
├── robots.txt, sitemap.xml, site.webmanifest
├── _headers                         # Cloudflare Pages security & caching headers
└── package.json
```

## Local Development

Requires Node.js 18+.

```bash
npm install
npm run build   # compiles src/input.css -> css/tailwind.css (minified)
npm run watch   # rebuilds on change while you edit HTML/CSS
```

Then open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```

> **Note:** The HTML pages share a common header/footer that were assembled from templates during development. If you add new pages or change the nav/footer, keep the markup consistent across all `.html` files (there is no server-side templating at runtime — everything ships as plain static HTML).

## Deploying to Cloudflare Pages

1. Push this repository to GitHub/GitLab and connect it to a new Cloudflare Pages project.
2. Build settings:
   - **Build command:** `npm install && npm run build`
   - **Build output directory:** `/` (repository root)
3. Deploy. Cloudflare Pages will automatically serve `404.html` for unmatched routes.

Since `css/tailwind.css` is already committed, Cloudflare Pages can also be configured with **no build command** and output directory `/` for a pure static deploy — only re-run `npm run build` locally if you change Tailwind classes or `src/input.css`.

## Before Going Live

- Replace the placeholder domain `https://www.somalikingcollege.edu.so` in `sitemap.xml`, canonical tags, and JSON-LD with your real domain once available.
- Replace placeholder contact details (phone, email, address, map coordinates) in the header/footer of every page and on `contact.html` with SKC's confirmed details.
- Connect the Student/Staff Portal forms and the contact/newsletter forms to a real backend (e.g. a Cloudflare Pages Function, Formspree, or your student information system) — they currently show a client-side confirmation only.
- Swap the SVG crest/illustration placeholders for real campus photography if/when available.
