# PropChain Deployment Guide

Deploy the FastAPI backend to **Railway** and the React frontend to **Vercel**.

## 1. Railway — PostgreSQL

1. Go to https://railway.app → **New Project** → **Provision PostgreSQL**.
2. Open the Postgres service → **Variables** tab → copy `DATABASE_URL`.
3. Convert the URL scheme to async: replace `postgresql://` with `postgresql+asyncpg://`. Save this value for step 2.

## 2. Railway — FastAPI Backend

1. In the same Railway project → **New** → **GitHub Repo** → select this repository.
2. Set the **Root Directory** to `/` (project root, where `Procfile` + `requirements.txt` live).
3. Railway auto-detects Python via `runtime.txt` and starts with the `Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. **Variables** tab — add:
   - `DATABASE_URL` = `postgresql+asyncpg://...` (from step 1)
   - `SOLANA_RPC_URL` = `https://api.devnet.solana.com`
   - `PROGRAM_ID` = `73x5L22cQX2i8tTs9pv1pVpC3oGWxaAvBAbC9VFJyGKz`
   - `SOLANA_PRIVATE_KEY` = your devnet server keypair (base58 or JSON byte array)
5. **Settings** → **Networking** → **Generate Domain**. Copy the public URL (e.g. `https://propchain-api.up.railway.app`). You'll need it for Vercel.
6. Verify: open `https://<railway-domain>/health` — should return `{"status":"ok",...}`.

## 3. Vercel — React Frontend

1. Go to https://vercel.com → **Add New** → **Project** → import this repo.
2. **Root Directory**: `frontend`
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. **Environment Variables** — add:
   - `VITE_API_URL` = `https://<your-railway-domain>` (no trailing slash)
5. **Deploy**.
6. SPA routing is handled by `frontend/vercel.json` (all routes rewrite to `index.html`).

## Post-deploy

- Seed the database by running `python seed.py` locally against the Railway `DATABASE_URL`, or via Railway's one-off command shell.
- Test end-to-end: open the Vercel URL, browse properties, connect a Phantom devnet wallet, and buy tokens.
