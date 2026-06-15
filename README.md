# School Management System (SMS)

Full-stack school management platform with student/teacher/parent management, academic tracking, reporting, and analytics.

## Architecture

```
frontend/   — React + Vite (deployed on Vercel)
backend/    — Node.js + Express + MongoDB API (deployed on Render)
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env    # fill in real values
npm install
npm run dev             # http://localhost:5000
npm test                # 196 tests — all passing
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

## Test Status

**196/196 tests passing** — runs via GitHub Actions on every push/PR.

| File                | Tests | Status |
| ------------------- | ----- | ------ |
| auth.test.js        | 36    | ✅     |
| core-crud.test.js   | 43    | ✅     |
| people-crud.test.js | 35    | ✅     |
| academic-crud.test.js| 55   | ✅     |
| filters.test.js     | 20    | ✅     |
| edge-cases.test.js  | 7     | ✅     |

## Default Credentials (after `npm run seed`)

| Role          | Email               | Password |
| ------------- | ------------------- | -------- |
| Super Admin   | super@admin.com     | admin123 |
| School Admin  | school@admin.com    | admin123 |

## API Overview

| Endpoint              | Description                       |
| --------------------- | --------------------------------- |
| `/api/auth`           | Login, password reset, profile    |
| `/api/users`          | Admin user management             |
| `/api/students`       | Student CRUD, ranking, reports    |
| `/api/teachers`       | Teacher CRUD, subject assignment  |
| `/api/parents`        | Parent CRUD                       |
| `/api/classes`        | Classes (S1-S6), performance      |
| `/api/sections`       | Sections within classes           |
| `/api/subjects`       | Subjects, teacher assignment      |
| `/api/marks`          | Student marks entry & retrieval   |
| `/api/academic-years` | Academic year management          |
| `/api/terms`          | Term management                   |
| `/api/reports`        | Report generation (PDF)           |
| `/api/analytics`      | School/class/subject analytics    |
| `/api/suggestions`    | Suggestions & comments            |
| `/api/settings`       | School settings                   |

## Deployment

- **Backend**: Render (`render.yaml` at repo root). Set `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*` as environment secrets.
- **Frontend**: Vercel (`vercel.json` at `/frontend`). Builds automatically.

## Known Issues

- None.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to `main`:
- Backend: `npm ci` → `npm test`
- Frontend: `npm ci` → `npm run build`
