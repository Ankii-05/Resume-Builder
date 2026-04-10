# ResumeXpert — AI Resume Builder & ATS Checker

A full-stack **MERN** application for building professional resumes in the browser, running **ATS (Applicant Tracking System)–style checks** on uploaded résumés, and exporting to **PDF**. Users can sign up with email/password or **Google OAuth**. An **admin dashboard** provides usage stats, user/resume management, and ATS log inspection.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Admin access & troubleshooting](#admin-access--troubleshooting)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Google OAuth & port conflicts](#google-oauth--port-conflicts)
- [API overview](#api-overview-high-level)
- [Deployment](#deployment-example-render--vercel)
- [Limitations & roadmap](#limitations--roadmap-ideas)
- [Admin panel (file map)](#admin-panel-file-map)
- [License & author](#license)

---

## Features

### Resume builder

- **Multi-section editor** — Profile, contact, work experience, education, skills, projects, certifications, languages, and interests.
- **Three visual templates** — Template One / Two / Three with theme and color options stored per resume.
- **Live preview** while editing.
- **Image uploads** — Thumbnail and profile preview (stored under `backend/uploads/`).
- **PDF export** — Client-side **html2pdf.js** + **jsPDF**; after a successful download the app calls `PATCH /api/resume/:id/download` to increment **`downloadCount`**.
- **Dashboard** — List, open, and manage saved resumes.

### ATS checker

- **Upload** — PDF or Word (`.docx`); server-side parsing via **pdf-parse** and **mammoth**.
- **Domain targeting** — Job domain or custom label; domain keyword packs drive scoring.
- **Heuristic scoring** — Overall score, label, category breakdown, matched/missing keywords, suggestions.
- **Logged checks** — Results saved to **`AtsLog`**; if the client sends a **Bearer token** (logged-in user on the ATS page), the log is tied to **`userId`**.

### Authentication & security

- **Email/password** — bcrypt-hashed passwords.
- **Google OAuth 2.0** — Passport + session for OAuth; successful sign-in issues a **JWT** for API calls.
- **Protected routes** — JWT middleware on resume and profile endpoints; **admin** routes require `role: "admin"`.
- **Rate limiting** — `/api/auth` and `/google`; stricter limits on `/api/admin/*`.
- **Helmet** — Security headers in production; relaxed CSP in development for OAuth popups.

### Data

- **MongoDB / Mongoose** — **`User`** (`role`: `user` | `admin`), **`Resume`** (`downloadCount`, `isCompleted`), **`AtsLog`** (ATS run history).
- **JWT** — Stored in `localStorage`; sent as `Authorization: Bearer <token>`.

### Admin dashboard

- **URL** — `/admin/login` (public), then `/admin/dashboard`, `/admin/users`, `/admin/users/:id`, `/admin/resumes`, `/admin/resumes/:id`, `/admin/ats-logs` (JWT + admin role).
- **Stats** — Users, resumes, downloads, ATS check counts, 30-day user growth chart (**Recharts**).
- **Management** — Paginated users/resumes/ATS logs; search and filters where applicable.
- **API** — See [API overview](#api-overview-high-level) and `backend/routes/admin.js`.

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React 19, Vite 6, React Router 7, Tailwind CSS 4, Axios, react-hot-toast, **Recharts** (admin charts) |
| **Backend** | Node.js, Express 5, Mongoose 8, Passport (Google OAuth), express-session, JWT, Multer, express-rate-limit |
| **Parsing** | pdf-parse (PDF), mammoth (DOCX) |
| **Deploy (examples)** | [Render](https://render.com) (API), [Vercel](https://vercel.com) (static frontend) |

---

## Repository layout

```
├── backend/
│   ├── config/              # db.js, passport.js
│   ├── controllers/         # authController, resumeController, uploadImages, adminController, atsController
│   ├── middlewares/         # authMiddleware (JWT, optionalAuth), googleAuthHandlers, isAdmin, upload
│   ├── models/              # User, Resume, AtsLog
│   ├── routes/              # authRoutes, resumeRoutes, atsRoutes, admin.js
│   ├── utils/               # jwt, ATS scorer, resume parser, Google OAuth config, seedAdmin, authHelpers
│   ├── data/                # Domain keyword packs (ATS)
│   ├── tests/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Forms, templates, ATS UI, AdminLayout, AdminRoute, …
│   │   ├── pages/           # Landing, Dashboard, ATS, Auth callback, AdminLogin
│   │   ├── pages/admin/     # AdminDashboard, AdminUsers, AdminUserDetail, AdminResumes, AdminResumeDetail, AdminAtsLogs
│   │   ├── context/
│   │   └── utils/           # apiPaths, axiosInstance, domainKeys
│   └── vercel.json          # SPA rewrites (Vercel)
├── docs/
│   └── render-deploy.txt
├── render.yaml
├── PHASE1_AUDIT_REPORT.js   # Architecture / route audit (reference)
└── README.md
```

---

## Admin access & troubleshooting

### Default credentials

After **MongoDB connects**, the API runs **`seedAdmin`** (`backend/utils/seedAdmin.js` on startup).

| Field | Value |
|--------|--------|
| **Login URL** | `/admin/login` (not `/login`) |
| **Email** | `admin@resumexpert.com` |
| **Password** | `Admin@123` |
| **Role** | `admin` |

**Change the password in production** and do not rely on defaults on public deployments.

### Seed behavior

- If **no user** exists with that email → creates the admin account.
- If a user **already exists** with that email but **`role` is not `admin`** (e.g. they registered first as a normal user) → they are **promoted to admin** and the password is set to **`Admin@123`** so admin login works.
- If the account is **admin** but **Google-only / no password** → a **local password** is set so email/password login works.
- If the account is already **admin with a local password** → seed does **not** overwrite the password on each restart.

### If admin login still fails

1. **Restart the backend** so `seedAdmin` runs (watch the console for `[Admin] …` messages).
2. Confirm **`MONGODB_URI`** is set and logs show **`DB CONNECTED`** — without MongoDB, no user is created.
3. Use the **exact** email/password above after a promotion (password may have been reset to `Admin@123`).
4. Open **`/admin/login`** — the main app **`/login`** is for regular users only.
5. **CORS / API URL** — Ensure `VITE_API_URL` in the frontend points at your running API (see [Environment variables](#environment-variables)).

---

## Prerequisites

- **Node.js** 18+ recommended  
- **MongoDB** — Atlas or local URI  
- **Google Cloud** (optional) — OAuth 2.0 Web client for Google sign-in  

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/Ankii-05/Resume-Builder.git
cd Resume-Builder

cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` (at minimum `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`). Create **`frontend/.env.development`** with `VITE_API_URL` pointing at your API (e.g. `http://127.0.0.1:8080/`). **Do not commit** real `.env` files.

### 3. Run

**Terminal 1 — API**

```bash
cd backend
npm run dev
```

**Terminal 2 — UI**

```bash
cd frontend
npm run dev
```

- API: `http://127.0.0.1:<PORT>` (default often `8080` via `.env`)  
- Frontend (Vite): `http://localhost:5173`  

**Health check:** `http://127.0.0.1:<PORT>/health` should return JSON `{"status":"ok",...}` from Node (not an HTML page from another process on the same port).

### Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `backend` | `npm run dev` | API with nodemon |
| `backend` | `npm start` | Production: `node server.js` |
| `backend` | `npm test` | Unit tests |
| `frontend` | `npm run dev` | Vite dev server |
| `frontend` | `npm run build` | Production build → `dist/` |
| `frontend` | `npm run preview` | Preview production build locally |

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (e.g. `8080`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Optional token lifetime (default `7d`) |
| `SESSION_SECRET` | Express session secret (OAuth) |
| `CLIENT_URL` | Frontend origin(s), comma-separated in production — **first** URL is used for Google OAuth redirect |
| `CORS_ORIGINS` | Optional; overrides CORS list if different from `CLIENT_URL` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth Web client |
| `GOOGLE_REDIRECT_URI` | Must match your API callback, e.g. `http://127.0.0.1:8080/google/callback` or `https://<api-host>/google/callback` |
| `GOOGLE_VERIFY_SSL` | `false` only in dev if needed (not for production) |
| `UPLOADS_CORS_ORIGIN` | Optional; default `*` for public thumbnail loads |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/.env.development` | Local API base, e.g. `VITE_API_URL=http://127.0.0.1:8080/` |
| `frontend/.env.production` | Used by `vite build` — set `VITE_API_URL` to your deployed API URL (with trailing slash) |

Only variables prefixed with **`VITE_`** are exposed to the client.

---

## Google OAuth & port conflicts

If **port 8000** is taken (e.g. `php artisan serve`), Node may not serve your API and OAuth can hit the wrong app.

1. Set **`PORT=8080`** in `backend/.env`.  
2. Set **`GOOGLE_REDIRECT_URI`** to match (e.g. `http://127.0.0.1:8080/google/callback`) and register it in **Google Cloud → OAuth client → Authorized redirect URIs**.  
3. Set **`VITE_API_URL=http://127.0.0.1:8080/`** in `frontend/.env.development`.  
4. Add **Authorized JavaScript origins** for your frontend (e.g. `http://localhost:5173`).

---

## API overview (high level)

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`, `GET /api/auth/verify`, `POST /api/auth/logout` — Google: `GET /api/auth/google`, `GET /api/auth/google/callback` (also `/google`, `/google/callback`).  
- **Resumes (JWT):** `POST/GET /api/resume`, `GET/PUT/DELETE /api/resume/:id`, `PUT /api/resume/:id/upload-images`.  
- **Resumes (public):** `PATCH /api/resume/:id/download` — increments `downloadCount` (PDF export tracking).  
- **ATS:** `POST /api/ats/check` — multipart `file`, `domain`, optional `customDomain`; optional `Authorization` Bearer to attach `userId` in `AtsLog`.  
- **Admin (JWT + `role: admin`):** `GET /api/admin/stats`, `GET/PUT/DELETE /api/admin/users/...`, `GET/DELETE /api/admin/resumes/...`, `GET /api/admin/ats-logs` — see `backend/routes/admin.js`.  
- **Ops:** `GET /health`, `GET /` (`API WORKING` text).

---

## Deployment (example: Render + Vercel)

The repo includes **`render.yaml`** and **`docs/render-deploy.txt`** with step-by-step notes.

1. **Backend** — Set `CLIENT_URL`, `GOOGLE_REDIRECT_URI`, secrets, and `MONGODB_URI`.  
2. **Frontend** (e.g. Vercel) — Set **Root Directory** to `frontend` if needed; set **`VITE_API_URL`** to your API with a trailing slash; redeploy after env changes.  
3. **Google Cloud** — Production **JavaScript origins** and **redirect URI** for your API host.

Production builds can use committed **`frontend/.env.production`** or host env vars. Uploaded files on free tiers may be **ephemeral** unless you add persistent disk or object storage.

---

## Limitations & roadmap ideas

- Resume **templates** are React components, not a DB-driven template library.  
- ATS **scoring rules** live in code + static keyword packs; **runs** are stored in **`AtsLog`**.  
- **No refresh tokens** — JWT expires per `JWT_EXPIRES_IN`; sign in again when expired.  
- Reference audit: **`PHASE1_AUDIT_REPORT.js`**.

---

## Admin panel (file map)

| Area | Location |
|------|----------|
| Seed script | `backend/utils/seedAdmin.js` |
| Admin API | `backend/routes/admin.js`, `backend/controllers/adminController.js` |
| Admin middleware | `backend/middlewares/isAdmin.js` |
| ATS persistence | `backend/models/AtsLog.js`, `backend/controllers/atsController.js` |
| Admin UI | `frontend/src/pages/AdminLogin.jsx`, `frontend/src/components/AdminLayout.jsx`, `frontend/src/components/AdminRoute.jsx`, `frontend/src/pages/admin/*` |

---

## License

ISC (see `backend/package.json`). Adjust if you adopt a different license for the whole project.

---

## Author

Repository: **[Ankii-05/Resume-Builder](https://github.com/Ankii-05/Resume-Builder)**  

Deploy and OAuth notes: **`docs/render-deploy.txt`** and your cloud dashboards.
