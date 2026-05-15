# Timesheet App
[![License](https://img.shields.io/badge/License-Apache_2.0-yellowgreen.svg)](https://opensource.org/licenses/Apache-2.0)
[![Pipeline status](https://gitlab.fit.cvut.cz/werenvoj/timesheet-app/badges/main/pipeline.svg)](https://gitlab.fit.cvut.cz/werenvoj/timesheet-app/-/commits/main)
[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

A simple Time Tracking and Timesheet Approval application.

## Tech Stack

- **Backend:** .NET 9 (ASP.NET Core Web API)
- **Frontend:** React 18, TypeScript, Vite
- **Database:** PostgreSQL 15

## Quick Start

### 1. Environment Setup

Clone the repo and create your environment file:

```bash
git clone https://github.com/Werenyckyj/timesheet-app.git
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
