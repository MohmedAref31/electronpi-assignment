# Project & Task Management API

A RESTful API for a Project & Task Management System built with Node.js, Express, TypeScript, TypeORM, and PostgreSQL.

> **Status:** Initial project scaffold. Feature implementation (auth, projects, tasks) is delivered incrementally.

---

## Tech Stack

| Category        | Technology                     |
| --------------- | ------------------------------ |
| Runtime         | Node.js v18+                   |
| Framework       | Express.js                     |
| Language        | TypeScript                     |
| Database        | PostgreSQL 16                  |
| ORM             | TypeORM                        |
| Authentication  | JWT (`jsonwebtoken`)           |
| Password hash   | bcrypt                         |
| Validation      | express-validator              |
| Security        | helmet, cors                   |
| Containerization| Docker + Docker Compose        |
| API Docs        | Postman collection             |

---

## Architecture

Layered architecture: **routes → controllers → services → models (entities)**.

```
src/
├── config/        # Environment & database configuration
├── entities/      # TypeORM entities (User, Project, Task)
├── middlewares/   # Auth, error handling, validation result
├── routes/        # Express route definitions
├── controllers/   # HTTP request/response handlers (per feature)
├── services/      # Business logic (per feature)
├── validators/    # express-validator schemas (per feature)
├── utils/         # Shared helpers (ApiError, logger)
├── migrations/    # TypeORM migration files
├── seeds/         # Seed data
├── data-source.ts # TypeORM DataSource (singleton + CLI config)
├── app.ts         # Express app configuration
└── server.ts      # Application entry point (bootstrap + graceful shutdown)
```

---

## Prerequisites

- **Node.js** v18 or newer
- **npm** (or yarn/fpn)
- **PostgreSQL** 16+ (local) **or** Docker + Docker Compose

---

## Getting Started

### Option A — Run with Docker Compose (recommended)

1. Copy the env example:
   ```bash
   cp .env.example .env
   ```
2. Start the stack (Postgres + API):
   ```bash
   docker compose up --build
   ```
3. The API will be available at `http://localhost:3000/api/v1`.
4. Run migrations inside the container (from another terminal):
   ```bash
   docker compose exec app npm run migration:run
   ```

### Option B — Run locally (development)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy and edit the env file:
   ```bash
   cp .env.example .env
   # adjust POSTGRES_HOST/PORT/DB/USER/PASSWORD to your local DB
   ```
3. Start a PostgreSQL instance (e.g. via Docker):
   ```bash
   docker run -d --name ptask_pg -p 5432:5432 \
     -e POSTGRES_DB=project_task_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     postgres:16-alpine
   ```
4. Run migrations:
   ```bash
   npm run migration:run
   ```
5. Start the dev server (hot reload):
   ```bash
   npm run dev
   ```
6. The API will be available at `http://localhost:3000/api/v1`.

### Build & run (production)

```bash
npm run build
npm start
```

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list and descriptions.

| Variable              | Default                | Description                          |
| --------------------- | ---------------------- | ------------------------------------ |
| `NODE_ENV`            | `development`          | Environment name                     |
| `PORT`                | `3000`                 | HTTP port                            |
| `CORS_ORIGIN`         | `*`                    | Allowed CORS origin(s) (comma sep.)  |
| `DEFAULT_LANGUAGE`    | `en`                   | Fallback language when none detected |
| `SUPPORTED_LANGUAGES` | `en,ar`                | Comma-separated enabled locales      |
| `JWT_SECRET`          | —                      | Secret used to sign JWT tokens       |
| `JWT_EXPIRES_IN`      | `1h`                   | JWT lifetime                         |
| `BCRYPT_SALT_ROUNDS`  | `10`                   | bcrypt cost factor                   |
| `POSTGRES_HOST`       | `localhost`            | DB host (`db` when using Compose)    |
| `POSTGRES_PORT`       | `5432`                 | DB port                              |
| `POSTGRES_DB`         | `project_task_db`      | Database name                        |
| `POSTGRES_USER`       | `postgres`             | DB username                          |
| `POSTGRES_PASSWORD`   | `postgres`             | DB password                          |
| `LOG_LEVEL`           | `debug`                | Log verbosity                        |

---

## NPM Scripts

| Script                    | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm run dev`             | Start dev server with hot reload              |
| `npm run build`           | Compile TypeScript to `dist/`                 |
| `npm start`               | Run compiled server from `dist/`              |
| `npm run migration:run`   | Apply pending database migrations             |
| `npm run migration:revert`| Revert the last applied migration             |
| `npm run migration:generate` | Generate a migration from entity changes   |
| `npm run seed`            | Run database seeders                          |
| `npm test`                | Run the test suite (Jest)                     |

---

## API Documentation

API documentation is provided as a **Postman collection**.

1. Import `docs/postman/project-task-api.postman_collection.json` into Postman.
2. Import `docs/postman/environment.example.json` as an environment.
3. Set the `baseUrl` variable to `http://localhost:3000/api/v1`.
4. After registering/logging in, the `token` variable is populated automatically for authenticated requests.

See [`docs/README.md`](./docs/README.md) for details.

---

## Health Check

```http
GET /api/v1/health
```

Returns service and database connectivity status. No authentication required.

---

## Localization (i18n)

The API supports **English (`en`)** and **Arabic (`ar`)**. Language is resolved per request, in priority order:

1. `?lang=ar` query parameter
2. `Accept-Language` header (e.g. `ar`, `ar,en;q=0.8`, `en-US`)
3. `DEFAULT_LANGUAGE` env var (default: `en`)

All error messages and the health endpoint are translated. Translation files live in `src/locales/<lang>/translation.json`.

```bash
curl http://localhost:3000/api/v1/health                       # English (default)
curl http://localhost:3000/api/v1/health?lang=ar               # Arabic
curl -H "Accept-Language: ar" http://localhost:3000/api/v1/health
```

---

## Project Structure Overview

```
.
├── src/
│   ├── config/        env.ts, i18n.ts
│   ├── entities/      User.ts, Project.ts, Task.ts, enums.ts
│   ├── locales/       en/translation.json, ar/translation.json
│   ├── middlewares/   errorHandler.ts, notFound.ts, validateRequest.ts, i18n.ts
│   ├── routes/        index.ts, health.routes.ts
│   ├── controllers/   (populated per feature)
│   ├── services/      (populated per feature)
│   ├── validators/    (populated per feature)
│   ├── utils/         ApiError.ts, logger.ts
│   ├── migrations/    (TypeORM migrations)
│   ├── seeds/         (seed scripts)
│   ├── data-source.ts
│   ├── app.ts
│   └── server.ts
├── docs/
│   └── postman/       collection + environment
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Implementation Notes

- **TypeORM migrations** are used exclusively for schema changes (`synchronize: false`).
- **Centralized error handling** with consistent JSON error envelopes.
- **Layered architecture** keeps route, controller, service, and data concerns separated.
- **Graceful shutdown** closes the HTTP server and DB connection on `SIGTERM`/`SIGINT`.
- **Security middleware** (`helmet`, `cors`) is applied at the app level.

---

## License

MIT
