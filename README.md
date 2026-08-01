# CinePass — Movie Ticket Booking Platform

Production-ready **full-stack Next.js 15** cinema booking SaaS inspired by Netflix + BookMyShow.

Frontend and backend live in **one Next.js project** (App Router UI + `/api/v1` Route Handlers).

## Stack

| Layer | Tech |
|--------|------|
| UI | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Radix/ShadCN patterns, Framer Motion |
| State | Zustand, TanStack Query, React Hook Form + Zod |
| API | Next.js Route Handlers (REST v1), OpenAPI at `/api/docs` |
| Data | MongoDB + Mongoose (Repository → Service) |
| Cache / locks | Redis (ioredis) with in-memory fallback |
| Auth | JWT access + refresh rotation, RBAC, OTP, guest, httpOnly cookies |
| Payments | Stripe + demo mode (Razorpay/Wallet/UPI ready) |
| Ops | Docker Compose, Nginx, PM2, GitHub Actions |

## Quick start

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env

# 3. Run (works without Mongo — seed movies are embedded)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Book → QR → PDF (works offline)

1. Open any movie → **Book tickets**
2. Pick theatre, date, seats → pay (**PayU** or demo UPI/Card/Wallet)
3. You land on **`/bookings/[id]`** with a real scannable QR
4. Click **Download PDF** (QR embedded in the PDF)

Without `PAYU_MERCHANT_KEY` / `PAYU_MERCHANT_SALT`, PayU falls back to instant confirmation and still issues a QR ticket.

### PayU Money

```env
PAYU_MERCHANT_KEY=your_key
PAYU_MERCHANT_SALT=your_salt
PAYU_MODE=test
```

Success/failure callbacks: `/api/v1/payments/payu/success` · `/api/v1/payments/payu/failure`

### With MongoDB + seed

```bash
# Start Mongo (or use Docker Compose)
docker compose up -d mongo redis

# Seed users, movies, theatre, shows, coupons
npm run seed

npm run dev
```

### Seed accounts

| Email | Password | Role |
|--------|----------|------|
| `super@cinepass.app` | `Password1` | Super Admin |
| `admin@cinepass.app` | `Password1` | Admin |
| `owner@cinepass.app` | `Password1` | Theatre Owner |
| `customer@cinepass.app` | `Password1` | Customer |

## Architecture

```
src/
  app/                 # App Router pages + API routes
    (public)/          # Landing, movies, booking
    (auth)/            # Login, register, forgot password
    (customer)/        # Customer dashboard
    (admin)/           # Admin panel
    (theatre)/         # Theatre partner portal
    (super-admin)/     # Multi-tenant SaaS control plane
    api/v1/            # Versioned REST API
  components/          # UI + feature components
  constants/           # Roles, permissions, config
  data/                # Seed movie catalogue (offline-capable)
  lib/                 # DB, Redis, JWT, email, payments, validators
  models/              # Mongoose schemas
  repositories/        # Data access (Repository pattern)
  services/            # Business logic (Service pattern)
  stores/              # Zustand client stores
  types/               # Shared TypeScript types
  middleware.ts        # Security headers + optional auth gate
```

**Patterns:** Clean Architecture layers, Repository + Service, RBAC permission matrix, DI-friendly singletons (`movieService`, `authService`, …).

## Features

- Landing: hero, trending / now showing / upcoming, cities, offers, genres, theatres, testimonials, FAQ, app CTA, dark/light mode
- Auth: register, login, guest, OTP, forgot password, refresh rotation, remember me, roles
- Booking: theatre → date → live seat map → coupon → pay → confirmation
- Customer: bookings, wallet, wishlist, profile, rewards
- Admin / Theatre / Super Admin dashboards
- Seat locking via Redis TTL
- QR + PDF ticket generation utilities
- SEO: metadata, sitemap, robots, JSON-LD
- PWA manifest

## API

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/health` | Health |
| GET | `/api/docs` | OpenAPI JSON |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Rotate tokens |
| POST | `/api/v1/auth/otp` | OTP send/verify |
| GET | `/api/v1/movies` | Catalogue + filters |
| GET | `/api/v1/movies/:slug` | Detail |
| GET | `/api/v1/search?q=` | Search |
| POST | `/api/v1/bookings/lock` | Lock seats |
| POST | `/api/v1/bookings` | Create booking |
| POST | `/api/v1/coupons/validate` | Coupons |
| GET | `/api/v1/admin/stats` | Admin stats |

Demo coupons: `CINEPASS50`, `STUDENT20`, `WALLET150`

## Docker

```bash
docker compose up --build
```

Production profile with Nginx:

```bash
docker compose --profile production up --build
```

## Deploy (AWS EC2 + PM2)

1. Provision EC2, install Node 20, Nginx, PM2  
2. Clone repo, copy `.env` with production secrets  
3. Point `MONGODB_URI` to Atlas, `REDIS_URL` to ElastiCache  
4. Run `bash scripts/deploy.sh`  
5. Put CloudFront in front of Nginx / S3 assets  

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run seed` | Seed database |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Security

- JWT access (15m) + refresh rotation  
- bcrypt password hashing  
- Rate limiting on auth / booking / OTP  
- Helmet-style headers via middleware  
- Zod validation on inputs  
- RBAC permission checks on protected routes  
- Audit log model for sensitive actions  

## License

Proprietary — built for demonstration and production extension.
