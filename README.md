# FarmWiseAI

AI-based smart crop recommendation, proactive pest detection and resource optimization.

## Prerequisites

- Node.js 20.9 or newer (Node 22 LTS recommended)
- Corepack (included with Node.js); pnpm 10 is pinned by this project
- A Supabase project for authentication and persistence (not required to run the foundation page)

## Local setup

```powershell
corepack enable
corepack prepare pnpm@10.12.1 --activate
corepack pnpm install
Copy-Item .env.example .env.local
corepack pnpm dev
```

The app runs at `http://localhost:3000`. Run `corepack pnpm build`, `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm test` for the available checks.

## Environment variables

Copy `.env.example` to `.env.local` and add `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase project settings. `SUPABASE_SERVICE_ROLE_KEY` is optional and server-only; never expose it with a `NEXT_PUBLIC_` prefix. Open-Meteo can be used without a key, and the Phase 4 weather integration is implemented behind the server-side weather route.

## Supabase and deployment

Phase 3 adds Supabase Auth, PostgreSQL persistence, session refresh middleware, RLS, and private crop image storage. Phase 4 adds server-side Open-Meteo weather normalization and deterministic, source-traceable crop suitability rules. Pest inference and AI provider sections remain explicitly demonstrational and are not integrated.

Apply the database with `supabase link --project-ref <project-ref>` followed by `supabase db push`. Use `supabase db reset` only for an isolated local database. Configure Supabase Auth URL settings with `http://localhost:3000/**`, your Vercel preview URL, and production URL. Set email confirmation and password recovery templates to use Supabase's confirmation/recovery URL variables, with `/reset-password` as the application recovery route. Deploy `apps/web` as the Vercel root directory and configure public variables separately for preview and production.

The migration enables RLS for every user-owned table. Profiles, farms, fields, history records, conversations, messages and notifications are restricted by `auth.uid()` and parent ownership. The `crop-images` bucket is private; object paths must begin with the authenticated user's UUID. Crop catalog rows are public read-only demonstration data.

## Phase 4 weather and crop rules

Weather uses the server-side Open-Meteo Forecast API. It requires farm latitude/longitude, validates provider responses, caches successful requests for ten minutes, stores snapshots, and serves the latest authorized snapshot as stale data when the provider is unavailable. No provider key is required for the configured Open-Meteo endpoint.

Crop recommendations use deterministic rules stored in `crop_catalog.rule_data`, versioned as `phase4-rules-v1`, with supporting/limiting reasons and missing-data warnings. Scores are suitability heuristics, not yield probabilities or guarantees. The initial catalog rules are provisional interpretations based on ICAR Kharif advisories and TNAU cropping/practice references; local agronomic confirmation remains required.

See [docs/architecture.md](./docs/architecture.md) for the proposed system boundaries and Phase 1 acceptance criteria.

The pest-model replacement gate is documented in [docs/pest-model-readiness.md](./docs/pest-model-readiness.md). The current pest screen remains demonstrational until the dataset, rejection, evaluation, and deployment gates are met.
# farmwiseai
