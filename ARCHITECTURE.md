# Sushi Counter Architecture

## Frontend
Single-page React app.

### State split
- **Local state / localStorage**
  - `clientId`
  - `displayName`
  - `activeTableCode`
- **Convex state**
  - table metadata
  - live leaderboard
  - player counts
  - event history
  - personal session history

## Backend (Convex)

### Tables
#### `tables`
- `name`
- `code`
- `createdByClientId`
- `caloriesPerPiece`
- `status`
- `createdAt`
- `updatedAt`

Indexes:
- `by_code`
- `by_status`

#### `players`
- `tableId`
- `clientId`
- `name`
- `pieces`
- `calories`
- `joinedAt`
- `updatedAt`
- `lastActionAt`

Indexes:
- `by_table`
- `by_table_client`
- `by_client`

#### `events`
- `tableId`
- `playerId`
- `clientId`
- `playerName`
- `delta`
- `resultingPieces`
- `caloriesDelta`
- `createdAt`

Indexes:
- `by_table`
- `by_client`

## Server functions
### Queries
- `tables.getTableState(code, clientId)`
- `tables.getPersonalStats(clientId)`

### Mutations
- `tables.createTable(...)`
- `tables.joinTable(...)`
- `tables.changeCount(...)`

## Deployment
### Frontend
- Build static Vite output.
- Serve with nginx in Docker.
- CapRover app env includes `VITE_CONVEX_URL`.

### Backend
- Convex cloud deployment.
- `.env.local` contains deployment selection and deploy key locally.

## Security / identity
- No auth in v1.
- Identity is browser-local via `clientId`.
- This is lightweight and intentionally social/casual.
- Tradeoff: same person on another device appears as a different player/history profile.

## Future extensions
- avatar emoji per player
- archived tables view
- session export/share card
- restaurant-specific calorie presets
- bill splitting
