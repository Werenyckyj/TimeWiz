# Timesheet App

A simple Time Tracking and Timesheet Approval application.

## Tech Stack

- **Backend:** .NET 9 (ASP.NET Core Web API)
- **Frontend:** React 18, TypeScript, Vite
- **Database:** PostgreSQL 15

## Quick Start

### 1. Environment Setup

Clone the repo and create your environment file:

```bash
git clone https://github.com/your-username/timesheet-app.git
cd timesheet-app/Timesheet.Api
cp .env.example .env
```

(Edit the `.env` file to set your database password, JWT secret, etc.)

### 2. Local Development (Hot-Reload)

The default `docker-compose.yml` is configured for development. It mounts your local code into the containers, enabling instant updates via dotnet watch and Vite HMR.

```bash
cd ..
docker compose --env-file ./Timesheet.Api/.env up --build
```

Frontend UI: http://localhost:5173

Backend Swagger API: http://localhost:5000/swagger

### 3. Production Deployment

For production, use the `docker-compose.prod.yml` file. This builds optimized, lightweight images, serves the frontend via fast Nginx, and runs the backend in Production mode.

```bash
docker compose -f docker-compose.prod.yml --env-file ./Timesheet.Api/.env up --build -d
```

Frontend UI: http://localhost (Exposed directly on port 80)

Backend API: http://localhost:5000/api

---

Note: On the very first run, database migrations will apply automatically and seed an initial `admin` user with the credentials `admin@gmail.com` and password `Admin123!`.
