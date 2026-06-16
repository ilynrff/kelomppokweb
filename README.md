Padel Court Booking System built with Next.js (App Router), Prisma, PostgreSQL, and NextAuth (Credentials).

## Getting Started

### 1) Environment

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="replace-with-a-long-random-string"
```

### 2) Database (Prisma)

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 3) Run dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

- `GET /api/courts`
- `GET /api/courts/availability?courtId=...&date=YYYY-MM-DD`
- `POST /api/bookings`
- `GET /api/bookings`
- `POST /api/payments`

## Notes

- Booking creation is server-side source of truth: pricing, validation, and double-booking prevention happen in the API.
- Pending bookings auto-expire after ~15 minutes (to release slots).
