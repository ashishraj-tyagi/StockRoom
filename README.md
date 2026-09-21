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

Against the protected Vercel AUT (requires `VERCEL_AUTOMATION_BYPASS_SECRET` in `.env`):

```bash
npm run test:e2e:vercel
```

## Hosting

**Static UI demo:** [https://ashishraj-tyagi.github.io/StockRoom/](https://ashishraj-tyagi.github.io/StockRoom/) (GitHub Pages, no REST APIs)

**Dynamic AUT:** [https://stock-room-ashishraj-tyagi.vercel.app](https://stock-room-ashishraj-tyagi.vercel.app)

The Vercel app is behind **Vercel Authentication** so browsers without a team login cannot use it. Playwright, Postman, and RestAssured send `x-vercel-protection-bypass` with a project secret (Protection Bypass for Automation). Humans still sign in through Vercel; tools do not.

1. In the Vercel project: **Settings → Deployment Protection**
2. Keep **Require Log In** on
3. Under **Protection Bypass for Automation**, add a secret and copy it
4. Put it in a local `.env` (never commit the value):

```
PLAYWRIGHT_BASE_URL=https://stock-room-ashishraj-tyagi.vercel.app
VERCEL_AUTOMATION_BYPASS_SECRET=your-secret
```

### curl / RestAssured / Postman

```bash
curl -s https://stock-room-ashishraj-tyagi.vercel.app/api/health \
  -H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET"
```

Postman: import `postman/StockRoom.postman_collection.json`, set `baseUrl` to the Vercel origin and `vercelBypassSecret` to the same value. A collection pre-request script adds the header when that variable is set.

RestAssured: send the same header from a request spec when the env var is set:

```java
String bypass = System.getenv("VERCEL_AUTOMATION_BYPASS_SECRET");
if (bypass != null && !bypass.isBlank()) {
    RestAssured.given()
        .header("x-vercel-protection-bypass", bypass)
        .get("/api/health");
}
```

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
