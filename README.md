# FreeTime — productive leisure platform

Books, movies, English lessons (A1–C1), mind gym games, focus timer, podcasts, stars/ranks — with an Express + SQLite backend, Telegram bot, and a full visitor analytics admin panel.

## Stack

- Frontend: Vite 8 + React 19 (JSX), Tailwind CSS v4, MUI v9, lucide-react
- Backend: Express 4 (`server/`), SQLite via `node:sqlite` (Node 22.13+)
- Bot: node-telegram-bot-api style long-polling inside the Express process

## Local development

Node 22.13+ is required (uses `node:sqlite`).

```bash
# 1. API server (port 4000 by default)
cd server
npm install
cp -i ../.env.example .env
npm run dev

# 2. Frontend (in a second terminal)
npm install
npm run dev        # http://localhost:5173, proxies /api -> :4000
```

Default admin account (stats/logs in the Admin panel):

```
email:    admin@free.time
password: xojift15
```

Regular sign-up creates normal users. The admin account is seeded automatically on first server start when `ADMIN_EMAIL`/`ADMIN_PASSWORD` are not set in `.env`.

## Commands

```bash
npm run build   # production build -> dist (served by the Express server)
npm run lint    # oxlint
cd server && npm start
```

## Deployment

### GitHub
- `.gitignore` keeps `.env`, `node_modules`, `dist`, `.vercel`, and the SQLite DB files out of the repository.
- `.github/workflows/ci.yml` runs install + lint + build on every push/PR, so a broken build fails the check.

### Vercel
- `vercel.json` builds the frontend (`vite build` → `dist`) as a static site. Import the repo or run `vercel --prod`.
- Configure the secrets via Vercel's environment variables if you mirror `.env.example`.
- Note: on Vercel only the static frontend is served. The Express API (SQLite file storage + Telegram polling) cannot run in a serverless function, so `/api/*` endpoints need the Node server on a persistent host (e.g. Render, Railway, Fly.io, or a VPS) with the `VITE_API_URL`/proxy pointed at it.
- `vercel.json` rewrites `/api/*` to the backend host. After deploying the backend, update the `destination` URL if your service name/domain differs.

### Render (free Node host for the backend)
1. Push this repo to GitHub (or use `vercel` for the frontend, Render for the API).
2. In the Render dashboard click **New → Blueprint** and select the repo, or create a **Web Service** pointing at it with:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Add the env vars (same keys as `server/../.env`): `BOT_TOKEN`, `BOT_USERNAME`, `ADMIN_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `FRONTEND_URL` (your Vercel URL).
4. The service gets a URL like `https://freetime-server.onrender.com`. Make sure `vercel.json` rewrites `/api/*` to that host.
5. Health check: `GET /api/public/stats` should return JSON.
   - Note: the free plan uses an ephemeral filesystem — the SQLite DB resets on every deploy. Add a **Persistent Disk** (paid) mounted at the `server/` directory for permanent storage.

### Full stack on one host (recommended)
```bash
npm run build
cd server && npm start   # serves both the API and the built SPA
```