# FlexQR Backend

## Overview

This backend was designed for **FlexQR**, a free and open-source QR code management platform. Its responsibility is to give the frontend a reliable API for:

- account registration and login
- Google-based authentication
- QR code creation, editing, listing, and deletion
- public QR code access by short code
- click tracking by IP address

The implementation uses **FastAPI + MongoDB** and follows a layered architecture so that validation, business rules, persistence, and HTTP transport stay separated.

## Problem This Backend Solves

FlexQR needs more than a simple CRUD API. A real QR code management platform must guarantee that:

- only the owner can edit or delete a QR code
- free-plan accounts cannot create unlimited QR codes
- clients cannot spam edits indefinitely
- public scans are recorded for analytics
- authentication works consistently for both password login and Google login

This backend solves these concerns with clear layers, dedicated services, and explicit business rules.

## Architectural Decisions

### 1. Layered structure

The project is split into clear layers:

- `api/`: FastAPI routes and dependency wiring
- `middleware/`: authentication resolution before protected endpoints
- `services/`: business logic and application rules
- `repositories/`: MongoDB access only
- `models/`: internal domain entities
- `schemas/`: request and response contracts exposed by the API
- `core/`: settings, security helpers, exceptions, and constants
- `db/`: MongoDB bootstrap and index creation
- `utils/`: small reusable helpers

This separation makes the code easier to test, extend, and maintain.

### 2. Unified authentication strategy

The backend supports:

- local authentication with email and password
- Google authentication through a Google ID token

After a successful login, the API returns a **FlexQR JWT access token**. In addition, the authentication middleware is able to resolve already linked Google ID tokens too, which keeps the system flexible for future frontend strategies.

### 3. MongoDB as a simple document store

MongoDB fits this project well because:

- user and QR code documents are straightforward and flexible
- QR code design settings are naturally embedded JSON-like data
- scan logs can be stored independently in an analytics collection

The application automatically creates indexes during startup.

## Business Rules Implemented

- Each account can own **up to 10 QR codes**
- Each QR code can be edited **up to 5 times per minute**
- Update and delete operations validate **resource ownership**
- Public access registration stores the **scanner IP address** and **user agent**

## Project Structure

```text
backend/
|-- app/
|   |-- api/
|   |-- core/
|   |-- db/
|   |-- middleware/
|   |-- models/
|   |-- repositories/
|   |-- schemas/
|   |-- services/
|   `-- utils/
|-- .env.example
|-- pyproject.toml
`-- README.md
```

## API Summary

Base prefix: `/api/v1`

### Authentication

- `POST /auth/register`
  - Register with `name`, `email`, and `password`
- `POST /auth/login`
  - Login with `email` and `password`
- `POST /auth/google`
  - Login or register with a Google `idToken`

### Users

- `GET /users/me`
  - Return the authenticated user profile

### QR Codes

- `GET /qrcodes`
  - List all QR codes owned by the authenticated user
- `GET /qrcodes/{qrCodeId}`
  - Return one owned QR code by id
- `POST /qrcodes`
  - Create a new QR code
- `PUT /qrcodes/{qrCodeId}`
  - Update one owned QR code
- `DELETE /qrcodes/{qrCodeId}`
  - Delete one owned QR code
- `GET /qrcodes/shortcodes/{shortCode}`
  - Return public QR code information by short code
- `POST /qrcodes/shortcodes/{shortCode}/access`
  - Register a scan/click and return the action the frontend should take

### Health

- `GET /health`
  - Simple service health check

## QR Code Types Supported

The backend currently supports three destination types:

- `url`
  - redirects to an HTTP or HTTPS destination
- `whatsapp`
  - builds a `wa.me` link from phone and message
- `pix`
  - returns a copy action so the frontend can present the Pix code in a friendly UI

## MongoDB Collections

### `users`

Stores account data:

- name
- email
- providers
- password hash
- Google subject id
- timestamps

### `qr_codes`

Stores managed QR codes:

- owner id
- name
- type
- content
- short code
- visual design
- click count
- edit timestamps
- timestamps

### `qr_code_accesses`

Stores public access events:

- QR code id
- short code
- IP address
- user agent
- action type
- timestamp

## Environment Variables

Create `backend/.env` from `backend/.env.example`.

| Variable | Description |
| --- | --- |
| `ENVIRONMENT` | application environment name |
| `PROJECT_NAME` | FastAPI application title |
| `API_V1_PREFIX` | versioned API prefix |
| `ENABLE_API_DOCS` | enables or disables `/docs`, `/redoc`, and `/openapi.json` |
| `MONGO_URI` | MongoDB connection string |
| `MONGO_DATABASE` | database name |
| `JWT_SECRET_KEY` | secret used to sign FlexQR JWT tokens |
| `JWT_ALGORITHM` | JWT algorithm, default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | token duration in minutes |
| `GOOGLE_CLIENT_ID` | Google OAuth client id used to verify ID tokens |
| `FRONTEND_ORIGINS` | comma-separated list of allowed CORS origins |

## Running Locally

### 1. Start MongoDB

Make sure MongoDB is running locally, for example:

```bash
mongod
```

### 2. Install dependencies

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

### 3. Configure the environment

Create `backend/.env` and fill the values based on `.env.example`.

For production, set:

```env
ENABLE_API_DOCS=false
```

This disables the interactive FastAPI documentation endpoints.

### 4. Start the API

```bash
uvicorn app.main:app --reload
```

### 5. Open Swagger UI

```text
http://127.0.0.1:8000/docs
```

## How Authentication Works

### Local login

1. The frontend sends email and password to `/api/v1/auth/login`
2. The backend validates the password hash
3. The backend returns a signed JWT token
4. The frontend sends `Authorization: Bearer <token>` on protected requests

### Google login

1. The frontend obtains a Google ID token
2. The frontend sends that token to `/api/v1/auth/google`
3. The backend validates the token with Google
4. The backend links or creates the user
5. The backend returns a FlexQR JWT token for normal API usage

## Notes For Frontend Integration

- The current frontend already models `name`, `email`, `shortCode`, `design`, and QR code types in a way that matches this backend well.
- The redirect page can call `POST /api/v1/qrcodes/shortcodes/{shortCode}/access` to both register the click and receive the next action.
- For Pix QR codes, the frontend should render a copy experience using the returned `copyValue`.

## Extension Ideas

This structure was intentionally built so future features can be added without rewriting the API foundation:

- refresh tokens
- role-based permissions
- QR code analytics dashboards
- pagination and filters
- background jobs
- file upload support for logos
- plan-based billing or quotas

## Final Notes

The main goal of this backend is not only to expose endpoints, but to provide a clean foundation for an open-source QR management product. The project is organized to make it easier for future contributors to understand where each concern belongs and to keep FlexQR maintainable as it grows.
