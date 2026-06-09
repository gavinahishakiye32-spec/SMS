# SMS - Backend

School Management System API built with Node.js, Express, and MongoDB.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcryptjs
- **File Uploads:** Cloudinary / Multer
- **PDF Generation:** PDFKit

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Copy `.env` and configure:

| Variable          | Description            |
| ----------------- | ---------------------- |
| `PORT`            | Server port (default 5000) |
| `MONGO_URI`       | MongoDB connection string |
| `JWT_SECRET`      | JWT signing secret      |
| `CLOUDINARY_*`    | Cloudinary credentials  |

## Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm start`         | Start production server  |
| `npm run dev`       | Start with nodemon       |
| `npm run seed`      | Seed database            |

## Default Credentials

Run `npm run seed` to create initial admin users:

| Role          | Email               | Password   |
| ------------- | ------------------- | ---------- |
| Super Admin   | super@admin.com     | admin123   |
| School Admin  | school@admin.com    | admin123   |

## API Endpoints

- `POST /api/auth` — Login
- `/api/users`, `/api/students`, `/api/teachers`, `/api/parents` — CRUD
- `/api/classes`, `/api/sections`, `/api/subjects` — Academic structure
- `/api/marks` — Student marks
- `/api/academic-years`, `/api/terms` — Academic periods
- `/api/reports` — Report generation (PDF)
- `/api/analytics` — Analytics data
- `/api/suggestions` — Suggestions
