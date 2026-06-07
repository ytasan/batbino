# Batbino (Google-style MVP)

Full-stack calendar and task MVP: React + Vite frontend, Express + Prisma + PostgreSQL backend.

## Terminology

In product and UI copy, calendar items are called **tasks**. The codebase still uses `Event`, `/events`, and `events` in the database and API — treat those names as the technical implementation of a task.

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) or any PostgreSQL instance

## Quick start

### 1. Database

From the repo root:

```bash
docker compose up -d
```

Postgres is mapped to **host port 5433** (not 5432) so it does not collide with a locally installed PostgreSQL. Use `localhost:5433` in `DATABASE_URL`.

If a previous run failed, run `docker compose down` then `docker compose up -d` again after fixing the port.

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

Open `http://localhost:5173`, register or sign in, then use **Create** to add tasks.

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
batbino/
  docker-compose.yml   # Postgres 16
  backend/             # REST API, Prisma schema & migrations
  frontend/            # React UI
```

## API (summary)

- `POST /auth/register`, `POST /auth/login` — JWT
- `GET|POST|PATCH|DELETE /calendars` — user calendars (auth)
- `GET|POST|PATCH|DELETE /events` — tasks (stored as `Event`); `GET /events?from=&to=` with optional `calendarIds`
