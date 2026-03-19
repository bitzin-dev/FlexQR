# FlexQR Docker Deployment

## Overview

This folder contains a complete Docker-based deployment stack for FlexQR. It is designed to boot the full platform with:

- MongoDB
- FastAPI backend
- frontend build served by Nginx

The stack is intentionally simple so the project can be started with a single Docker Compose command while still keeping the services separated.

## Included Services

### `mongodb`

- Uses `mongo:8.0-noble`
- Stores persistent database files in a named Docker volume

### `backend`

- Builds the FastAPI application from `backend/`
- Installs Python dependencies inside the image
- Exposes the API on port `8000` by default

### `frontend`

- Builds the Vite app from `frontend/`
- Serves the compiled static build with Nginx
- Proxies `/api/*` requests to the backend container
- Exposes the web app on port `8080` by default

## Files

```text
deploy/
|-- .env.example
|-- backend.Dockerfile
|-- frontend.Dockerfile
|-- frontend-nginx.conf
|-- docker-compose.yml
|-- up.ps1
|-- down.ps1
|-- up.sh
|-- down.sh
`-- README.md
```

## First Run

### 1. Create the deployment environment file

From the `deploy/` folder:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 2. Review the main variables

At minimum, update:

- `JWT_SECRET_KEY`
- `VITE_PUBLIC_APP_URL`
- `FRONTEND_ORIGINS`
- `GOOGLE_CLIENT_ID` if Google login will be enabled

### 3. Start the stack

Linux or macOS:

```bash
./up.sh
```

Windows PowerShell:

```powershell
.\up.ps1
```

Or directly with Docker Compose:

```bash
docker compose up --build -d
```

## Access Points

After startup:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000/api/v1`
- Backend Swagger docs through backend port: `http://localhost:8000/docs`
- Backend Swagger docs through frontend proxy: `http://localhost:8080/docs`

## Important Configuration Notes

### Public QR code URL

`VITE_PUBLIC_APP_URL` defines the base URL embedded inside generated QR codes.

Examples:

- Local machine only:
  - `http://localhost:8080`
- Same LAN access from phones:
  - `http://192.168.0.25:8080`
- Public deployment:
  - `https://flexqr.example.com`

If this value is wrong, mobile devices may scan the QR code but will not be able to open the intended FlexQR short link correctly.

### Frontend origins for the backend

`FRONTEND_ORIGINS` must contain the public frontend URLs allowed by CORS.

Example:

```env
FRONTEND_ORIGINS=https://flexqr.example.com,http://localhost:8080
```

### Google Sign-In

If `GOOGLE_CLIENT_ID` is empty, Google login will not be available.

If it is enabled, the same client id is passed to:

- the backend for Google token validation
- the frontend build for Google Identity Services

## Common Operations

### Stop the stack

Linux or macOS:

```bash
./down.sh
```

Windows PowerShell:

```powershell
.\down.ps1
```

### Rebuild after code changes

```bash
docker compose up --build -d
```

### View logs

```bash
docker compose logs -f
```

### Remove containers and named volumes

```bash
docker compose down -v
```

## Deployment Model

This setup follows a pragmatic production-like model:

- MongoDB runs as an isolated service
- FastAPI runs independently from the frontend
- Nginx serves the frontend and proxies API traffic
- frontend and backend remain decoupled for future scaling

It is suitable for local deployment, VPS deployment, and as a base for a later CI/CD pipeline.
