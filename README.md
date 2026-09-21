# StockRoom

Interactive **inventory & order desk** built as an application under test (AUT) for Playwright UI automation and REST API automation. Includes login/auth, catalog, cart, checkout, orders, and admin product CRUD.

## Features

- **Auth**: JWT session cookie + Bearer token; seeded users including a locked account
- **Catalog**: search, category filter, sort, product detail, stock states
- **Cart / checkout / orders**: full purchase path with stock checks
- **Admin**: create / update / delete products (admin role only)
- **API**: REST endpoints mirroring UI behaviour + OpenAPI at `/api/openapi`
- **Reset**: `POST /api/test/reset` restores seed data between test suites
- **Selectors**: stable `data-testid` attributes throughout the UI

## Quick start

```bash
npm install
npm run dev
```

App: [http://127.0.0.1:43124](http://127.0.0.1:43124)

```bash
npm run build && npm start
```

## Seeded users

| Username   | Password      | Role  | Notes                          |
|------------|---------------|-------|--------------------------------|
| `standard` | `password123` | user  | Catalog, cart, orders          |
| `admin`    | `admin123`    | admin | Plus product CRUD              |
| `locked`   | `password123` | user  | Login always rejected (403)    |

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | no | Health check |
| GET | `/api/openapi` | no | OpenAPI 3 document |
| POST | `/api/auth` | no | Login → `{ user, token }` + sets cookie |
| GET | `/api/auth` | yes | Current user |
| DELETE | `/api/auth` | yes | Logout |
| GET/POST | `/api/products` | yes / admin | List / create |
| GET/PATCH/DELETE | `/api/products/:id` | yes / admin | Read / update / delete |
| GET/PUT/DELETE | `/api/cart` | yes | Get / upsert line / clear |
| GET/POST | `/api/orders` | yes | List / place order |
| POST | `/api/test/reset` | no | Reset seed data |

Authenticate API calls with the session cookie or `Authorization: Bearer <token>` from login.

### Example (API)

```bash
# Reset
curl -X POST http://127.0.0.1:43124/api/test/reset

# Login
TOKEN=$(curl -s -X POST http://127.0.0.1:43124/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"username":"standard","password":"password123"}' | jq -r .token)

# List products
curl -s http://127.0.0.1:43124/api/products -H "Authorization: Bearer $TOKEN" | jq
```

## Playwright

Sample tests live in `tests/`.

```bash
npx playwright install chromium
npm run test:e2e
```

## Hosting

**Live demo:** [https://ashishraj-tyagi.github.io/StockRoom/](https://ashishraj-tyagi.github.io/StockRoom/)

GitHub Pages can only serve a static site, so the public demo runs the UI in the browser (catalog, cart, checkout, admin) with data stored in `localStorage`. REST APIs used by Playwright and Postman still require `npm run dev` or `npm start` locally.

Each visitor gets their own seeded demo data in the browser. Use **Reset** by signing out and clearing site data, or call `POST /api/test/reset` against a local server.

Optional env:

```
STOCKROOM_SESSION_SECRET=change-me-in-production
```

## Project layout

```
src/app/          UI pages + Route Handlers
src/components/   Shared UI
src/lib/          Auth, store, seed data
tests/            Playwright examples
data/             Runtime store.json (generated)
```
