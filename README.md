# Nexa Clinic — Mini Clinic Information System

A web-based clinic information system for managing patients, registrations, queues, and SOAP-based medical examinations, with JWT authentication and three user roles.

Built as a technical assignment: **React** frontend, **Node.js / Express** REST API, and **PostgreSQL**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone](#1-clone-the-repository)
  - [2. Database (migration)](#2-database-setup-migration)
  - [3. Backend](#3-backend-setup)
  - [4. Frontend](#4-frontend-setup)
- [Demo Accounts](#demo-accounts)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Notes & Assumptions](#notes--assumptions)

---

## Tech Stack

| Layer     | Technology                                              |
| --------- | ------------------------------------------------------- |
| Frontend  | React 18, Vite, React Router v6, Tailwind CSS, Axios    |
| Backend   | Node.js, Express, JSON Web Token (JWT), bcryptjs        |
| Database  | PostgreSQL                                              |
| Validation| express-validator                                       |

---

## Features

- **Authentication & Authorization** — login / logout with JWT; three roles (Administrator, Dokter, Petugas Pendaftaran) with route-level access control.
- **Master Data Pasien** — full CRUD with auto-generated medical record number (`RM000001`…), unique 16-digit NIK, search, and pagination.
- **Pendaftaran** — register a patient visit to a poli and doctor, with payment type and initial complaint.
- **Antrean (Queue)** — auto-generated queue number per poli per day, call next, and status changes (menunggu → dipanggil → dilayani → selesai / dilewati).
- **Pemeriksaan (SOAP)** — Subjective, Objective (vitals), Assessment, Plan, plus medical actions and drug prescriptions, with per-patient examination history.
- **Dashboard** — daily summary: total patients, today's patients, today's queue, waiting, and completed.

---

## Project Structure

```
nexa-clinic-system/
├── backend/
│   ├── src/
│   │   ├── config/         # database pool
│   │   ├── controllers/    # auth, patient, registration, queue,
│   │   │                   # medicalRecord, prescription, dashboard, master
│   │   ├── middleware/     # auth (JWT + roles), validate, response, errorHandler
│   │   ├── routes/         # one router per resource + index
│   │   ├── validators/     # express-validator rule sets
│   │   ├── utils/          # asyncHandler, ApiError
│   │   └── index.js        # app entry (mounts everything under /api)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # axios client (attaches JWT, handles 401)
│   │   ├── context/        # AuthContext
│   │   ├── components/     # Layout, Modal, Pagination, ProtectedRoute, etc.
│   │   ├── lib/            # constants (roles, statuses, nav)
│   │   ├── pages/          # Login, Dashboard, Patients, Registrations, Queue, Examination
│   │   ├── App.jsx         # routes
│   │   └── main.jsx        # entry
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── ERD.md              # entity-relationship diagram (Mermaid)
│   └── erd.png
├── database.sql            # schema + seed data
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or newer
- **PostgreSQL** v14 or newer
- **npm** (bundled with Node.js)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/suadda/mini-clinic-system.git
cd mini-clinic-system
```

### 2. Database setup (migration)

Create the database, then import the schema and seed data from `database.sql`. This single file contains all tables, constraints, indexes, and seed records — no separate migration tool is required.

**Option A — using `psql` (command line):**

```bash
# create the database
createdb clinic_db

# import schema + seed data
psql -U postgres -d clinic_db -f database.sql
```

**Option B — using a GUI (DBeaver / pgAdmin):**

1. Create a new database named `clinic_db`.
2. Open a SQL editor **connected to `clinic_db`** (not the default `postgres` database).
3. Open `database.sql` and execute the whole script.

The script is safe to re-run: it drops and recreates all objects (`DROP ... IF EXISTS`).

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `.env` and set your PostgreSQL password (and any other values). Then start the server:

```bash
npm run dev                 # development (nodemon)
# or
npm start                   # production
```

The API runs at **http://localhost:5000**. All endpoints are served under the `/api` prefix (e.g. `http://localhost:5000/api/login`).

### 4. Frontend setup

Open a **second terminal** (keep the backend running):

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```

The app runs at **http://localhost:5173**. Open it in your browser and log in with one of the demo accounts below.

---

## Demo Accounts

All seeded accounts use the password **`password123`**.

| Role                 | Email               | Access                                             |
| -------------------- | ------------------- | -------------------------------------------------- |
| Administrator        | `admin@clinic.com`  | Full access to all modules                         |
| Dokter               | `dokter@clinic.com` | Queue + Examination (SOAP, actions, prescriptions) |
| Petugas Pendaftaran  | `petugas@clinic.com`| Patients, Registrations, Queue                     |

---

## Environment Variables

**Backend** (`backend/.env`)

| Variable         | Description                          | Example              |
| ---------------- | ------------------------------------ | -------------------- |
| `PORT`           | Port the API listens on              | `5000`               |
| `DB_HOST`        | PostgreSQL host                      | `localhost`          |
| `DB_PORT`        | PostgreSQL port                      | `5432`               |
| `DB_USER`        | PostgreSQL user                      | `postgres`           |
| `DB_PASSWORD`    | PostgreSQL password                  | `your_password`      |
| `DB_NAME`        | Database name                        | `clinic_db`          |
| `JWT_SECRET`     | Secret used to sign JWTs             | `change_this_secret` |
| `JWT_EXPIRES_IN` | Token lifetime                       | `1d`                 |

**Frontend** (`frontend/.env`)

| Variable        | Description                        | Example                 |
| --------------- | ---------------------------------- | ----------------------- |
| `VITE_API_URL`  | Base URL of the backend (no `/api`)| `http://localhost:5000` |

> No secrets are hard-coded anywhere in the source. Both `.env` files are git-ignored; only the `.env.example` templates are committed.

---

## API Reference

Base URL: **`http://localhost:5000/api`**

All endpoints except `POST /login` require an `Authorization: Bearer <token>` header.

| Method | Endpoint                      | Description                                   | Roles                          |
| ------ | ----------------------------- | --------------------------------------------- | ------------------------------ |
| POST   | `/login`                      | Authenticate, returns JWT                     | Public                         |
| POST   | `/logout`                     | Log out                                       | Authenticated                  |
| GET    | `/patients`                   | List patients (search, paginate)              | Administrator, Petugas         |
| POST   | `/patients`                   | Create patient                                | Administrator, Petugas         |
| PUT    | `/patients/:id`               | Update patient                                | Administrator, Petugas         |
| DELETE | `/patients/:id`               | Delete patient                                | Administrator                  |
| GET    | `/registrations`              | List registrations                            | Administrator, Petugas, Dokter |
| POST   | `/registrations`              | Create registration                           | Administrator, Petugas         |
| PUT    | `/registrations/:id`          | Update registration                           | Administrator, Petugas         |
| GET    | `/queues`                     | List today's queue                            | All                            |
| POST   | `/queues`                     | Create queue number                           | Administrator, Petugas         |
| PUT    | `/queues/:id/call`            | Call the queue                                | All                            |
| PUT    | `/queues/:id/status`          | Change queue status                           | All                            |
| POST   | `/medical-records`            | Create SOAP record (+ actions, prescription)  | Administrator, Dokter          |
| GET    | `/medical-records/:patientId` | Patient examination history                   | Administrator, Dokter          |
| POST   | `/prescriptions`              | Create prescription                           | Administrator, Dokter          |
| GET    | `/prescriptions/:id`          | Get prescription                              | Administrator, Dokter          |
| GET    | `/dashboard`                  | Dashboard summary counts                      | All                            |
| GET    | `/poli`                       | List poli (for dropdowns)                     | Authenticated                  |
| GET    | `/doctors`                    | List doctors (for dropdowns)                  | Authenticated                  |
| GET    | `/medications`                | List medications (for dropdowns)              | Authenticated                  |

### Response format

Every response follows a consistent envelope.

**Success**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": { }
}
```

**Error**

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": { "nik": "NIK harus 16 digit angka" }
}
```

---

## Roles & Permissions

| Module                | Administrator | Dokter | Petugas Pendaftaran |
| --------------------- | :-----------: | :----: | :-----------------: |
| Dashboard             | ✓             | ✓      | ✓                   |
| Data Pasien (CRUD)    | ✓             | –      | ✓                   |
| Pendaftaran           | ✓             | –      | ✓                   |
| Antrean               | ✓             | ✓      | ✓                   |
| Pemeriksaan (SOAP)    | ✓             | ✓      | –                   |

---

## Notes & Assumptions

- All API routes are mounted under the **`/api`** prefix. When testing with Postman, use `http://localhost:5000/api` as the base URL.
- Medical record numbers are generated automatically by the database (`RM` + zero-padded sequence).
- Queue numbers are generated per poli per day, formatted as the poli code plus a padded counter (e.g. `A001`).
- Passwords are hashed with bcrypt; the seeded demo password is `password123`.
- The JWT is stored in the browser's `localStorage` and attached to every request by an Axios interceptor; a `401` response clears the session and redirects to the login page.
- `database.sql` doubles as the migration file — it is idempotent and includes seed data for immediate testing.