# FlexQR Frontend

## Overview

This frontend is the web client for **FlexQR**, an open-source platform for creating, customizing, and managing dynamic QR codes.

It is responsible for:

- account registration and login
- Google-based sign-in
- authenticated QR code management
- QR code creation, editing, download, and clipboard export
- public short-link resolution through `/q/:shortCode`
- multilingual UI with persistent language selection

The application is built with **React + TypeScript + Vite** and talks directly to the FastAPI backend.

## What Problem This Frontend Solves

The FlexQR backend exposes the business rules and persistence layer, but users still need a clean interface to:

- authenticate and restore sessions
- manage their QR codes without manual API calls
- customize QR design visually
- access mobile-friendly redirect and PIX copy flows
- switch between English and Brazilian Portuguese

This frontend provides that user-facing layer while keeping API access centralized and predictable.

## Tech Stack

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `i18next` + `react-i18next`
- `react-qrcode-logo`
- `date-fns`
- `sonner`
- `lucide-react`

## Architecture

The source code is organized by responsibility:

```text
src/
|-- components/
|   |-- auth/
|   `-- ui/
|-- context/
|-- i18n/
|-- layouts/
|-- lib/
|-- pages/
|-- types/
`-- utils/
```

### Main areas

- `pages/`
  - route-level screens such as login, register, dashboard, QR editor, and redirect handling
- `context/`
  - application state providers for authentication and QR code data
- `lib/`
  - API client, environment parsing, session persistence, QR export helpers, Google helpers, and validation helpers
- `layouts/`
  - shared authenticated and public page shells
- `i18n/`
  - translation resources and language persistence logic
- `components/ui/`
  - reusable UI primitives used across the app

### Public routes

- `/login`
- `/register`
- `/q/:shortCode`

### Protected routes

- `/dashboard`
- `/dashboard/home`
- `/dashboard/create`
- `/dashboard/edit/:id`
- `/dashboard/notifications`
- `/dashboard/plans`
- `/dashboard/settings`

The root path redirects automatically depending on whether a valid session exists.

## Authentication Flow

Authentication is managed through [AuthContext.tsx].

### Local auth

- register with full name, email, and strong password
- login with email and password
- persist the backend access token in local storage
- restore the user session on reload via `/users/me`

### Google auth

- Google Identity Services provides an ID token on the client
- the frontend sends that token to `POST /auth/google`
- the backend returns the FlexQR access token and user payload

## QR Code Management Flow

QR code state is managed through [QRCodeContext.tsx].

The frontend supports:

- listing user QR codes
- creating QR codes
- editing QR codes
- deleting QR codes
- copying QR configuration data for duplication
- downloading high-resolution QR PNG files
- copying QR PNG images to the clipboard when supported

The QR editor page uses a live preview and design controls powered by `react-qrcode-logo`.

## Public Redirect Flow

The route `/q/:shortCode` is handled by [Redirect.tsx].

When a public QR is scanned:

1. the frontend calls `POST /qrcodes/shortcodes/{shortCode}/access`
2. the backend registers the click and returns the next action
3. the frontend either:
   - redirects to a target URL
   - shows a PIX copy interface for copy-based actions

This keeps access tracking and action resolution server-driven.

## Internationalization

Language support is configured in [config.ts].

Currently supported languages:

- English
- Portuguese (Brazil)

### Language behavior

- the app detects the browser language on first load
- if a supported language is found, it becomes the initial language
- once the user changes language, the choice is persisted
- the selected language is restored after refresh
- the `lang` attribute on the HTML document is updated automatically

## Environment Variables

Create `frontend/.env` based on `frontend/.env.example`.

Available variables:

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL used by the frontend |
| `VITE_PUBLIC_APP_URL` | Public frontend base URL embedded into generated QR codes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id used by the Google sign-in button |

### Example

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_PUBLIC_APP_URL=http://127.0.0.1:5173
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Running Locally

### Prerequisites

- Node.js 20+ or 22+
- npm
- the FlexQR backend running locally

### Install dependencies

```bash
npm install
```

### Configure the environment

```bash
cp .env.example .env
```

Then adjust the values if needed.

### Start the development server

```bash
npm run dev
```

By default, Vite serves the app on:

```text
http://127.0.0.1:5173
```

## Available Scripts

- `npm run dev`
  - starts the Vite development server
- `npm run build`
  - creates a production build in `dist/`
- `npm run preview`
  - serves the production build locally
- `npm run lint`
  - runs TypeScript type-checking with `tsc --noEmit`

## Frontend Validation Rules

The registration screen currently enforces:

- full name is required
- full name maximum length is 120 characters
- email must pass backend and frontend email handling
- password must be strong enough to pass the backend rules

Password strength feedback is displayed live in a monochrome strength panel during registration.

## API Integration Strategy

The HTTP layer is centralized in [api.ts].

Key characteristics:

- one shared request wrapper
- consistent JSON parsing
- centralized backend error normalization
- automatic bearer token injection for protected requests
- explicit unauthenticated handling for public endpoints

This keeps API consumption predictable and avoids duplicating fetch logic across pages.

## Design Notes

The UI intentionally keeps a restrained visual language:

- mostly monochrome interface styling
- simple composable UI primitives
- dashboard-focused layout
- strong contrast for QR management screens

This makes the product feel lightweight and utility-driven rather than marketing-heavy.

## Build and Deployment Notes

For production:

- build the app with `npm run build`
- serve the generated `dist/` folder through Nginx or another static server
- point `VITE_API_BASE_URL` at the backend proxy path or public API URL
- set `VITE_PUBLIC_APP_URL` to the real public domain used in generated QR codes

If `VITE_PUBLIC_APP_URL` is incorrect, exported QR codes may still scan, but they will not point to the intended public FlexQR short link.

## Current Scope

The frontend currently integrates the functional areas backed by the API:

- authentication
- QR code CRUD
- QR access handling
- language persistence

Some secondary pages such as notifications, settings, and plans remain lightweight interface pages until matching backend features are expanded.

## Summary

This frontend was built as the operational UI for FlexQR, not as a disconnected demo. The structure emphasizes:

- clean separation of responsibilities
- direct backend integration
- reusable client-side state management
- predictable configuration
- practical QR code workflows for real users

It is designed to be easy to extend as the FlexQR platform grows.
