# Sushi Counter PRD

## Product
Sushi Counter is a mobile-first shared table counter for sushi nights. One person creates a table, shares a short code, everyone joins from their phones, and each person tracks how many pieces they ate. The app shows a live leaderboard, personal calories, and a lightweight history of past sushi sessions.

## Core user story
- I open the site on my phone.
- I either create a new table or join one with a code.
- I enter my name once.
- I tap + when I eat sushi and - if I mis-tapped.
- I can see my count, my calories, the table total, and the leaderboard.
- When I come back later, the app remembers me locally and shows my past totals/sessions.

## Goals
- Extremely fast to use with one hand on mobile.
- No signup/auth required.
- Shared real-time table state.
- Fun but clean design.
- Easy to deploy and cheap to run.

## Non-goals (v1)
- Full restaurant POS features.
- Payments/bills.
- Push notifications.
- Advanced analytics.
- Cross-device identity beyond local browser storage.

## Primary flows

### Create table
- User enters display name.
- User enters table name.
- Optional calories-per-piece field defaults to 42.
- App creates table and auto-joins creator.
- App shows shareable table code prominently.

### Join table
- User enters display name.
- User enters table code.
- App joins existing active table.
- If the same browser/client rejoins, restore their existing player record for that table.

### Count sushi
- Large +1 button.
- Smaller -1 button.
- Count cannot go below 0.
- Calories update live.
- Leaderboard updates live.

### View stats
- Current table leaderboard.
- Personal current-table count and calories.
- Lifetime count/calories across all past joined tables for this browser profile.
- Previous sessions list with table name, date, and pieces.

## Data model
- `tables`: table metadata and share code.
- `players`: one record per browser client per table.
- `events`: append-only counter activity log.

## Persistence model
- Browser localStorage stores:
  - client id
  - preferred display name
  - last active table code
- Convex stores shared table data and history.

## UX notes
- Mobile first.
- One-screen primary interaction.
- Bottom sticky action bar for +/-.
- Share code visible at all times while in a table.
- Clear rank/leaderboard styling.
- Dark, modern sushi-bar inspired visuals.

## Tech choices
- Frontend: Vite + React + TypeScript
- Styling: Tailwind CSS v4 + shadcn-style component primitives
- Backend/data sync: Convex
- Deployment: CapRover (frontend) + Convex cloud backend

## v1 success criteria
- Create/join table works.
- Shared live leaderboard works.
- Increment/decrement works.
- Local identity persists across refreshes.
- Personal historical totals render.
- Deployed and usable from phone.
