# Life-OS

A personal productivity hub that unifies your Google Calendar, Gmail, Gradescope assignments, and Spotify into a single beautifully designed dashboard.

**Live demo:** https://drive.google.com/file/d/1oc6Vwbcy0Jqy5NVclNmhzeveKOb5GDr_/view?usp=sharing

---

## What it does

Life OS pulls together everything you need to stay on top of your life as a student:

- **Calendar** — syncs your Google Calendar events and displays them in a full interactive daily/weekly/monthly view. Events can be dragged, resized, and created directly on the calendar.
- **Task management** — aggregates tasks from Google Calendar, Gmail (starred/action emails), and Gradescope assignments into a unified quest log with filtering by source.
- **Gradescope integration** — automatically scrapes your upcoming assignments and deadlines.
- **Spotify player** — shows your currently playing track with playback controls (play, pause, skip, previous) directly in the dashboard.
- **Focus mode** — a Pomodoro-style focus timer with animated visual effects that sync to your music's BPM.
- **Two themes** — Night mode and Day mode, with smooth transitions.

---

## Features I'm most proud of

**Unified sync engine** — a single "Invoke Sync" button pulls from three different sources and APIs (Google Calendar, Gmail, Gradescope) simultaneously. It was challenging to figure out the authentication logic for each one and to find out how to work the APIs. 

**Interactive calendar** — built with FullCalendar, supporting drag-to-create, drag-to-reschedule, and resize. I am proud of how smooth the calendar functionality ended up being and it works exactly like how a real gcal would act. 

**Spotify ambient mode** — the dashboard extracts the dominant color from your album art and uses it to tint the UI accent color in real time, so the whole interface pulses with your music. The pulse also depends on the BPM of the music. 

**Focus mode** — a full-screen Pomodoro timer with animated background with snow and flying dragons that pulses at the BPM of your currently playing track. Smooth transitions between focus mode and calendar mode. 

**Timezone-correct event display** — all datetimes are stored as UTC in the database and converted correctly to local time on the frontend, ensuring a 9am meeting doesn't show as 2pm.

---

## How to run locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials
- A Spotify Developer app

### Backend

```bash
cd life-os/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `life-os/backend/`:

```env
DATABASE_URL=sqlite:///./lifeos.db
SECRET_KEY=your-random-secret-key
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/callback
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/auth/spotify/callback
GRADESCOPE_EMAIL=your-gradescope-email
GRADESCOPE_PASSWORD=your-gradescope-password
CORS_ORIGINS=http://localhost:5173
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. You can explore the auto-generated docs at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd life-os/frontend
npm install
```

Create a `.env` file in `life-os/frontend/`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## How secrets are handled

**Local development** — all secrets are stored in `.env` files which are listed in `.gitignore` and never committed to the repository.

**Production (Render)** — all environment variables are configured directly in the Render dashboard under the service's Environment tab. They are never hardcoded in source code or committed to the repository.

---

## Tech stack

**Frontend** — React + TypeScript + Vite, FullCalendar, Axios, deployed on GitHub Pages

**Backend** — FastAPI (Python), SQLAlchemy, PostgreSQL, deployed on Render

**Auth** — Google OAuth 2.0 via Authlib, JWT tokens stored in localStorage

**Integrations** — Google Calendar API, Gmail API, Spotify Web API, Gradescope (scraped via gradescopeapi)
