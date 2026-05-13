# Calendar (Google-style MVP)

Full-stack calendar and task MVP: React + Vite frontend, Express + Prisma + PostgreSQL backend.

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) or any PostgreSQL instance

## Quick start

### 1. Database

From the repo root:

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET

npx prisma migrate deploy
npm install
npm run dev
```

API defaults to `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Ensure VITE_API_URL matches the API (e.g. http://localhost:3000)

npm install
npm run dev
```

Open `http://localhost:5173`, register or sign in, then use **Create** to add events.

## Scripts

| Location   | Command        | Purpose                    |
|-----------|----------------|----------------------------|
| `backend` | `npm run dev`  | API with hot reload (tsx) |
| `backend` | `npm run build`| Compile TypeScript → `dist` |
| `backend` | `npm start`    | Run compiled API            |
| `frontend`| `npm run dev`  | Vite dev server             |
| `frontend`| `npm run build`| Production bundle           |

## Project layout

```
calendar/
  docker-compose.yml   # Postgres 16
  backend/             # REST API, Prisma schema & migrations
  frontend/            # React UI
```

## API (summary)

- `POST /auth/register`, `POST /auth/login` — JWT
- `GET|POST|PATCH|DELETE /calendars` — user calendars (auth)
- `GET|POST|PATCH|DELETE /events` — events; `GET /events?from=&to=` with optional `calendarIds`
