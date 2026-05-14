# Arbeitszeit Pro — React + Vite Frontend

## Stack
- **React 18** + **Vite 5** (HMR, lightning fast)
- **Tailwind CSS 3** (purple gradient design system)
- **Zustand** (global state + localStorage persist)
- **Framer Motion** (page transitions + card animations)
- **React Hot Toast** (notifications)
- **TanStack Query** (ready for API data fetching)

## Project Structure
```
src/
├── components/
│   ├── UI/index.jsx         ← Button, Input, Modal, Badge …
│   ├── Header.jsx           ← Company/employee inputs + lang toggle
│   ├── Week/
│   │   ├── WeekView.jsx     ← Day grid + day detail + summary card
│   │   └── EntryTable.jsx   ← Time entry rows
│   ├── Reports/
│   │   └── ReportsView.jsx  ← Printable weekly/monthly reports
│   ├── Salary/
│   │   └── SalaryView.jsx   ← Salary calculator + print
│   ├── Settings/
│   │   └── SettingsView.jsx ← Personal data + signature + areas
│   ├── Archive/
│   │   └── ArchiveView.jsx  ← Year archive + JSON backup
│   └── Auth/
│       └── AuthFlow.jsx     ← Login / Register / Verify / Forgot
├── lib/
│   ├── auth.js              ← JWT API client (auto-refresh)
│   ├── i18n.js              ← DE / EN / AR translations
│   └── utils.js             ← Date, time, calculation utilities
├── store/
│   └── useAppStore.js       ← Zustand store (persist to localStorage)
├── styles/
│   └── global.css           ← Tailwind + design tokens
├── App.jsx                  ← Root component with tab routing
└── main.jsx                 ← React DOM entry
```

## Quick Start

```bash
# 1. Install
cd arbeitszeit-react
npm install

# 2. Configure (optional — offline mode works without backend)
cp .env.example .env.local
# Edit VITE_API_URL if you have the backend running

# 3. Dev server
npm run dev
# → http://localhost:5173

# 4. Build for production
npm run build
# → dist/ folder ready for Vercel / Netlify
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variable in Vercel dashboard:
# VITE_API_URL = https://api.arbeitszeit.pro/api
```

## Offline Mode
If `VITE_API_URL` is not set, the app works **fully offline** using `localStorage`. 
Data persists between sessions via Zustand's persist middleware.

## Features
- ✅ Purple gradient glass morphism UI (matches screenshots)
- ✅ 7-day week grid with day detail cards  
- ✅ Time entry table (area / start / end / break / drive)
- ✅ Weekly summary card (dark navy)
- ✅ Reports with print functionality
- ✅ Salary calculator + printable sheet
- ✅ Settings: personal data, signature canvas, sites, activities
- ✅ Archive: year archiving + JSON export/import
- ✅ Auth: login, register, email verify, forgot password
- ✅ 3 languages: DE / EN / AR (RTL support)
- ✅ Cloud save (backend) with offline fallback
- ✅ Smooth Framer Motion transitions
- ✅ Mobile responsive
