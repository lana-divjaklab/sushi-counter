# Sushi Counter

Mobile-first live sushi leaderboard app.

## Stack
- React + Vite + TypeScript
- Tailwind CSS v4
- Convex
- CapRover deploy via Docker/nginx

## Local dev
1. Configure Convex for this project:
   - `npx convex dev`
2. Put the resulting values in `.env.local`:
   - `CONVEX_DEPLOYMENT=...`
   - `VITE_CONVEX_URL=...`
3. Run:
   - `npm install`
   - `npm run dev`

## Checks
- `npm run lint`
- `npm run build`

## Deploy
Frontend is prepared for CapRover with:
- `Dockerfile`
- `nginx.conf`
- `captain-definition`

CapRover app name:
- `sushi-counter`

## Current status
Frontend/UI skeleton is built and passing lint/build.
Live deployment still needs Convex project auth/config before the frontend can connect to a real backend.
