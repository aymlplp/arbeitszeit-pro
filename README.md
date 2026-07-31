# Arbeitszeit Pro ⏱

A professional time-tracking web application for workers and freelancers. Built with React 18 + Vite on the frontend and Node.js + Express 5 + TypeScript on the backend, backed by PostgreSQL via Prisma. Supports German, English, and Arabic (with full RTL layout).

---

## Screenshots & Features at a Glance

| Screen | Description |
|--------|-------------|
| **Time Tracking** | Weekly calendar view — log start/end times, work areas, activities, driving and break times |
| **Reports** | Weekly / monthly / yearly HTML print reports with signature block |
| **Salary** | Automatic gross/net salary calculation based on logged hours |
| **Settings** | Company info, work areas (with default times), activities, signature pad, account |
| **Archive** | Browse and restore data from previous years |

---

## Tech Stack

### Frontend
| Library | Version | Role |
|---------|---------|------|
| React | 18.3 | UI framework |
| Vite | 5.4 | Build tool & dev server |
| Tailwind CSS | 3.4 | Styling (dark mode: `class`) |
| Zustand | 4.5 | Global state management |
| Framer Motion | 11 | Page transitions & animations |
| TanStack Query | 5 | Server state & data fetching |
| React Hot Toast | 2.4 | Toast notifications |
| qrcode.react | 4.2 | QR code generation (mobile signing) |
| Axios | 1.16 | HTTP client |

### Backend
| Library | Version | Role |
|---------|---------|------|
| Express | 5.2 | HTTP server |
| TypeScript | 5.9 | Language |
| Prisma | 5.22 | ORM / PostgreSQL client |
| bcryptjs | 3.0 | Password hashing |
| jsonwebtoken | 9.0 | JWT access + refresh tokens |
| Resend | 6.12 | Transactional email |
| Zod | 4 | Input validation schemas |
| Helmet | 8 | HTTP security headers |
| express-rate-limit | 8 | Rate limiting |

---

## Project Structure

```
/
├── arbeitszeit-react/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   └── AuthFlow.jsx          # Login / Register (glassmorphism UI)
│   │   │   ├── Week/
│   │   │   │   ├── WeekView.jsx          # Weekly time-tracking view + Wochenübersicht summary
│   │   │   │   └── EntryTable.jsx        # Daily entry table (area, activity, start, end, drive, break)
│   │   │   ├── Reports/
│   │   │   │   └── ReportsView.jsx       # Reports + HTML print engine
│   │   │   ├── Salary/
│   │   │   │   └── SalaryView.jsx        # Gross/net salary calculator
│   │   │   ├── Settings/
│   │   │   │   ├── SettingsView.jsx      # Panel-based settings (Company, Areas, Activities, Signature, Account)
│   │   │   │   └── MobileSignView.jsx    # Signature via QR code on mobile device
│   │   │   ├── Archive/
│   │   │   │   └── ArchiveView.jsx       # Year archive browser
│   │   │   ├── UI/
│   │   │   │   └── index.jsx             # Shared components: Button, SumBox, Pill, NavCircle, SectionHeader...
│   │   │   └── Header.jsx                # App header with language switcher, menu
│   │   ├── lib/
│   │   │   ├── api.js                    # Axios instance → proxied to :3001
│   │   │   ├── auth.js                   # Login / logout / token refresh / JWT helpers
│   │   │   ├── i18n.js                   # Translations DE / EN / AR + day/month names
│   │   │   └── utils.js                  # Time math, ISO keys, KW, formatting helpers
│   │   ├── store/
│   │   │   └── useAppStore.js            # Zustand store — data, settings, cloud sync
│   │   ├── styles/
│   │   │   └── global.css                # Tailwind base + glassmorphism + CSS variables
│   │   ├── App.jsx                       # Root — auth gate, tab routing, nav bar
│   │   └── main.jsx                      # Entry point
│   ├── vite.config.js                    # Port 5000, /api proxy → :3001, allowed hosts
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                        # Backend (Node.js + Express 5 + TypeScript)
    ├── src/
    │   ├── server.ts                     # Entry — connects DB, starts Express
    │   ├── app.ts                        # Express setup, middleware, rate limiters, routes
    │   ├── config/
    │   │   └── db.ts                     # Prisma client singleton
    │   ├── controllers/
    │   │   ├── auth.controller.ts        # Register, login, refresh, logout, change/reset password
    │   │   ├── data.controller.ts        # Save & load YearData (time entries + settings)
    │   │   └── signSession.controller.ts # QR signing sessions
    │   ├── routes/
    │   │   ├── auth.routes.ts
    │   │   ├── data.routes.ts
    │   │   └── signSession.routes.ts
    │   ├── middlewares/
    │   │   ├── auth.middleware.ts        # JWT verification
    │   │   ├── error.middleware.ts       # Global error handler
    │   │   └── validate.middleware.ts    # Zod schema validation
    │   └── utils/
    │       ├── email.utils.ts            # Send emails via Resend API
    │       ├── token.utils.ts            # Generate JWT access + refresh tokens
    │       ├── tokenBlacklist.ts         # In-memory logout token blacklist
    │       └── validators.ts             # Zod input schemas
    ├── prisma/
    │   └── schema.prisma                 # Database models
    ├── dist/                             # Compiled TypeScript output (do not edit)
    ├── tsconfig.json
    └── package.json
```

---

## Database Schema

```prisma
model User {
  id           String     @id @default(uuid())
  email        String     @unique
  passwordHash String
  role         Role       @default(USER)   // USER | ADMIN
  plan         Plan       @default(FREE)   // FREE | PRO
  yearData     YearData[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model YearData {
  id       String @id @default(uuid())
  userId   String
  year     Int
  data     Json   @default("{}")      // daily time entries keyed by ISO date
  settings Json   @default("{}")      // user settings, areas, activities, signature
  @@unique([userId, year])
}
```

---

## API Routes

### Auth — `/api/auth`
| Method | Path | Description | Rate limit |
|--------|------|-------------|------------|
| POST | `/register` | Create account | 15 / 15 min |
| POST | `/login` | Login (email or phone) | 15 / 15 min |
| POST | `/refresh` | Renew access token | — |
| POST | `/logout` | Logout + blacklist token | — |
| POST | `/change-password` | Change password (authenticated) | — |
| POST | `/forgot-password` | Request password reset email | 5 / 15 min |
| POST | `/reset-password` | Reset password via token | 5 / 15 min |

### Data — `/api/data` *(JWT required)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:year` | Load year data (entries + settings) |
| POST | `/:year` | Save year data |

### Sign Sessions — `/api/sign-session` *(JWT required)*
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create signing session |
| GET | `/:id` | Load session (used by mobile) |
| POST | `/:id` | Submit signature from mobile |


---

## Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/arbeitszeit"

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5000

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
```

---

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/aymlplp/arbeitszeit-pro.git
cd arbeitszeit-pro

# 2. Install frontend dependencies
cd arbeitszeit-react
npm install
cd ..

# 3. Install backend dependencies
cd backend
npm install

# 4. Create .env (see section above)

# 5. Apply database schema
npx prisma db push
npx prisma generate

# 6. Compile TypeScript
npx tsc
cd ..
```

### Run in Development

Open two terminals:

```bash
# Terminal 1 — Backend API
cd backend && node dist/server.js

# Terminal 2 — Frontend
cd arbeitszeit-react && npm run dev
```

Then open: **http://localhost:5000**

### Build for Production

```bash
# Build frontend
cd arbeitszeit-react && npm run build

# Build backend
cd backend && npx tsc

# Run (backend also serves the frontend from dist/)
cd backend && NODE_ENV=production node dist/server.js
```

---

## Ports

| Service | Port | Notes |
|---------|------|-------|
| Frontend (Vite dev) | **5000** | Proxies `/api/*` → `:3001` |
| Backend API | **3001** | Internal only in production |

---

## Key Design Decisions

### Offline-First
Data lives in Zustand + localStorage. Cloud sync happens on login and on window focus. The app is fully usable without a network connection.

### Authentication
- Accounts activate immediately on registration — no email verification step
- Login accepts **email or phone number**
- Access token: 15 min / Refresh token: 7 days
- Logged-out tokens are blacklisted in memory

### Work Areas (Standorte)
Areas are stored as objects `{ name, start, end }` supporting optional default start/end times that pre-fill the entry table when a user selects that area.

### Print Reports
Reports are rendered as a self-contained HTML document opened in a new tab. Empty work areas (no time data entered) are automatically excluded from the printed output.

### Mobile Signing
A QR code is generated containing a temporary signed URL. Scanning it on a mobile device opens a signature pad. On save the signature is synced back to the user's account via the sign session API.

### Rate Limiting
- General API: 100 requests / 15 min
- Login + Register: 15 requests / 15 min
- Password reset + verify: 5 requests / 15 min

---

## Multilingual Support

Three fully supported languages with complete translations, day/month names, and RTL layout for Arabic:

| Language | Code | Direction |
|----------|------|-----------|
| Deutsch | `de` | LTR |
| English | `en` | LTR |
| العربية | `ar` | RTL |

Language is stored in Zustand and persisted in localStorage. Switching language updates `document.documentElement.dir` automatically.

---


## Changelog

### v2.0 — Current Stable
- Panel-based Settings UI (Company / Areas / Activities / Signature / Account tabs)
- Work areas support default start & end times (auto-fill entry table)
- +/− stepper buttons for driving and break time (0.5 h steps)
- Empty work areas excluded from print reports
- Signature canvas: retina (devicePixelRatio) scaling, deferred init, QR mobile signing with refresh button
- Bottom navigation bar visible on all screen sizes
- Entry deletion bug fixed — entries only deleted when area AND start AND end are all empty
- Time inputs in settings narrowed to 68 px to keep delete button visible
- Wochenübersicht summary box made compact (SumBox smaller)
- Welcome email sent in background via Resend API
- Rate limiting added to all auth endpoints
- Full multilingual coverage (DE / EN / AR) across all views

### v1.0 — Initial Release
- Weekly time-tracking view
- Basic reports (weekly / monthly)
- Salary calculator
- Settings (company info, areas, activities, signature)
- JWT authentication with refresh tokens
- PostgreSQL + Prisma data persistence
- Offline-first with cloud sync

---

## Planned Features

- **Employer role** — see all employee reports, manage team members, separate pricing tier
- Feature gating for FREE vs PRO plan
- Annual report export

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
