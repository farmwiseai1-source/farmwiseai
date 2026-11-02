# FarmWiseAI architecture

## Proposed architecture

- `apps/web`: Next.js App Router UI, server components, route handlers, and Supabase session integration.
- `backend/services`: framework-independent crop ranking, weather/AI adapters, and resource calculations.
- `backend/repositories`: server-side persistence modules; ownership checks complement PostgreSQL RLS.
- `backend/validators`: Zod request validation used at API boundaries.
- `packages/contracts`: shared schemas, API types, and error shapes.
- `supabase/migrations` and `supabase/seed.sql`: repeatable schema, policies, and crop catalog setup.
- `docs`: setup, architecture, API, and deployment notes.

Route handlers authenticate on the server, validate inputs, authorize farm ownership, call services and repositories, and return consistent JSON. External AI and weather providers sit behind adapters, so missing configuration is reported as unavailable rather than represented as live data. Supabase Auth and PostgreSQL RLS provide identity and data isolation; images use private Supabase Storage buckets.

## Initial file structure

```text
apps/web/src/app/                 Next.js App Router and global design tokens
backend/services/                 Business logic and provider adapters
backend/repositories/             Database access
backend/validators/               Server request schemas
backend/tests/                    Business and API tests
packages/contracts/               Shared API contracts
supabase/migrations/              Versioned schema and RLS
supabase/seed.sql                 Repeatable development seed data
docs/                             Setup, architecture, API and deployment
```

## Foundation acceptance criteria

- Next.js App Router builds with strict TypeScript and Tailwind CSS.
- The project is organized as the requested pnpm workspace monorepo.
- Shared agricultural color tokens and a responsive mobile-first shell are present.
- Environment variable names are documented without credentials.
- Setup and Supabase/Vercel integration guidance is reproducible.
- No live weather, AI, authentication, or farmer data is implied before those services are configured and implemented.

## Phase 2 frontend structure

- `apps/web/src/app`: public pages and App Router workspace routes. Protected-looking screens run in explicitly disclosed demo navigation until Supabase auth is added.
- `apps/web/src/components/app-shell.tsx`: responsive workspace navigation, farm and language selectors, user menu and reusable page header/data notice.
- `apps/web/src/components/dashboard-view.tsx`: demonstration dashboard and responsive Recharts visualizations.
- `apps/web/src/components/workspace-views.tsx`: frontend workflows for recommendations, image preview, irrigation, fertilizer, advisor, onboarding, farms, history, settings and auth.
- `apps/web/src/lib/farmwise-types.ts`: typed demonstration fixtures and product data.
- `apps/web/src/lib/demo-services.ts`: mock crop ranking, water/product calculations and mock advisor response adapter.
- `apps/web/src/lib/demo-repository.ts`: in-memory session repository used for farm entries and activity records; this is not durable storage.
- `apps/web/src/lib/demo-services.test.ts`: unit tests for mock ranking and the two calculation formulas.
- `apps/web/public/images`: locally served Pexels agricultural photos used by the landing page and cards.

The existing demonstration screens remain available for features not yet connected to providers. Phase 3 adds Supabase Auth, cookie-based session refresh, PostgreSQL persistence and ownership-based RLS. Weather and AI outputs remain explicitly demonstrational.

## Phase 3 persistence boundaries

- `apps/web/src/lib/supabase/config.ts` provides browser-safe clients and keeps service-role access server-only.
- `apps/web/src/lib/supabase/server.ts` provides the App Router server client with cookie refresh support.
- `apps/web/src/middleware.ts` refreshes sessions and protects workspace routes when Supabase is configured.
- `supabase/migrations/202610290001_phase3.sql` is the source of truth for schema, indexes, RLS and private storage policies.
- Until a Supabase project is configured, auth controls are disabled and do not claim that an account operation occurred.

## Phase 4 provider boundaries

- `apps/web/src/lib/weather.ts` normalizes Open-Meteo current and seven-day forecast data on the server.
- `apps/web/src/app/api/weather/route.ts` authorizes farm ownership, persists weather snapshots, validates coordinates, and serves authorized stale snapshots only when live fetches fail.
- `apps/web/src/lib/crop-engine.ts` contains deterministic explainable scoring; no LLM is involved in suitability decisions.
- `apps/web/src/app/api/recommendations/route.ts` loads the authorized farm and public crop catalog, incorporates weather only when available, persists a complete input/result/source snapshot, and returns warnings for missing data.
