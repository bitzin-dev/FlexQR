<div align="center">
  <img src="./frontend/public/logo.svg" alt="FlexQR Logo" width="220" />

  # FlexQR

  **A free and open-source platform for creating, customizing, and managing dynamic QR Codes.**

  <p>
    FlexQR lets users create short-link based QR codes, edit destinations later, track scans, support PIX and WhatsApp flows, and manage everything from a clean dashboard.
  </p>

  <p>
    <a href="https://flexqr.exe.xyz"><strong>Live Platform</strong></a>
    |
    <a href="./backend/README.md"><strong>Backend Docs</strong></a>
    |
    <a href="./frontend/README.md"><strong>Frontend Docs</strong></a>
  </p>
</div>

---

## Overview

FlexQR was built to solve a practical problem: most QR code tools are either too limited, too expensive, or not truly open source.

This project provides a complete platform where users can:

- create dynamic QR codes
- update the destination without changing the printed QR code
- manage QR codes from a personal dashboard
- authenticate with email/password or Google
- customize QR design and download high-quality PNG files
- handle redirect and copy-based flows such as PIX
- track access events through short links
- use the platform in English or Brazilian Portuguese

The complete live version is available at:

- [flexqr.exe.dev](https://flexqr.exe.xyz)

## Why FlexQR Exists

One of the strongest motivations behind FlexQR is how unfair the current QR code market can be.

Many services charge recurring fees for something that should be simple, accessible, and inexpensive. That becomes a serious problem when the QR code is attached to something permanent or expensive to replace, such as:

- tattoos
- physical products
- packaging
- 3D printed objects
- signs, plaques, or business materials

In these cases, the user can become dependent on a third-party platform for months or even for life. If the provider raises prices, limits usage, or shuts the service down, the printed QR code may lose value or become unusable.

FlexQR was created to offer a different path:

- open source ownership instead of platform lock-in
- a self-hostable option instead of forced subscriptions
- a practical tool for urgent use cases where paying high fees makes no sense
- a simple and transparent solution for dynamic QR code management

The core idea is straightforward: a tool this useful should not become a long-term financial trap.

## Main Features

- Dynamic QR code creation with editable destinations
- Dashboard with listing, search, edit, delete, copy, and download actions
- Public short-code route support through `/q/:shortCode`
- QR actions for URL, WhatsApp, and PIX
- Authentication with local accounts and Google Sign-In
- Strong password validation for local registration
- High-resolution QR image export
- Clipboard QR image copy when supported by the browser
- MongoDB-backed persistence
- Layered FastAPI backend architecture
- React frontend with typed API integration
- Persistent language selection with automatic browser-language detection

## How It Was Built

FlexQR is split into two main applications:

- `backend/`
  - FastAPI application organized into APIs, services, repositories, models, schemas, middleware, and database helpers
- `frontend/`
  - React + TypeScript application with route-based pages, context providers, reusable UI components, i18n support, and centralized API helpers

There is also a `deploy/` folder with Docker-based deployment assets for teams that want a containerized setup.

## Technology Stack

<p align="center">
  <a href="https://skillicons.dev">
    <img
      src="https://skillicons.dev/icons?i=py,fastapi,mongodb,react,ts,nodejs,vite,tailwind,docker,nginx,git,linux&perline=6"
      alt="FlexQR technology stack"
    />
  </a>
</p>

Core technologies used in the project include Python, FastAPI, MongoDB, React, TypeScript, Node.js, Vite, Tailwind CSS, Docker, Nginx, Git, and Linux-based deployment environments.

## Project Structure

```text
flexqr/
|-- backend/   # FastAPI + MongoDB backend
|-- frontend/  # React + Vite frontend
|-- deploy/    # deployment assets and Docker stack
|-- GITHUB.md  # showcase version of the repository presentation
`-- README.md  # repository landing page for GitHub
```

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd flexqr
```

### 2. Start the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

Create `backend/.env` based on `backend/.env.example`, then run:

```bash
uvicorn app.main:app --reload
```

### 3. Start the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` based on `frontend/.env.example`, then run:

```bash
npm run dev
```

### 4. Open the app

- Frontend: `http://127.0.0.1:5173`
- Backend docs in development: `http://127.0.0.1:8000/docs`

## Configuration Notes

### Backend

Important backend settings include:

- `MONGO_URI`
- `MONGO_DATABASE`
- `JWT_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `FRONTEND_ORIGINS`
- `ENABLE_API_DOCS`

### Frontend

Important frontend settings include:

- `VITE_API_BASE_URL`
- `VITE_PUBLIC_APP_URL`
- `VITE_GOOGLE_CLIENT_ID`

`VITE_PUBLIC_APP_URL` is especially important because it defines the public URL embedded into generated QR codes.

## Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Deploy Guide](./deploy/README.md)

## Contact

Created by **bitzin-dev**.

If you want to get in touch, collaborate, or ask about the project:

- Email: [bitzindev@proton.me](mailto:bitzindev@proton.me)

## License

This project is presented as an open-source QR code management platform. Add your preferred license file to the repository root if you want to publish it formally under MIT, Apache-2.0, or another open-source license.
