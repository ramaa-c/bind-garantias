# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BIND Garantías — a React SPA (Vite) frontend for a SGR (guarantee/surety company) platform. It's multi-tenant: different "cadenas de valor" (value chains) each get a branded portal at `/:cadenaSlug/...`, plus a separate global admin area at `/admin/...`.

## Commands

```bash
npm run dev       # start Vite dev server (proxies /proxy-backend to a backend at 192.168.2.103:9988, see vite.config.js)
npm run build     # production build
npm run lint      # eslint over the whole repo
npm run preview   # preview a production build
```

There is no test runner configured (no `test` script, no test framework in devDependencies). `test_parser.js` at the repo root is an ad-hoc script, not part of a suite.

## Architecture

### Layering: services → adapters → hooks → pages/components

- **`src/services/*Service.js`** — raw API calls via the shared axios instance (`src/api/axios.js`). One service per backend resource (e.g. `sociosService`, `cadenaValorService`). Services call adapters to shape outgoing payloads and return `response.data` as-is (already key-normalized, see below).
- **`src/adapters/*Adapter.js`** — pure functions that convert between the app's internal data shape and the exact PascalCase payload shape the backend expects (e.g. `sociosAdapter.adaptarPayload1`). They lean on `src/utils/normalizarClaves.js` to read incoming fields case-insensitively, because the same logical field can arrive as `socioid`, `SocioID`, `SocioId`, etc. depending on which backend endpoint answered.
- **`src/hooks/*.js`** — TanStack Query wrappers (`useQuery`/`useMutation`) around services. This is the layer pages/components actually consume. Query keys follow a `["resource", "kind", ...params]` convention (e.g. `["socios", "lista", params]`, `["socios", "detalle", socioId]`) so mutations can invalidate precisely.
- **`src/pages/**`** and **`src/components/**`** — UI. Pages are organized by audience: `pages/cliente/*` (tenant-facing), `pages/admin/*` (global admin), `pages/legacy/*` (legacy screens being phased out), `pages/shared/*`.

When adding a new backend-backed feature, follow this same four-layer pattern rather than calling axios directly from a component.

### API layer specifics (`src/api/axios.js`)

- The response interceptor **lowercases every key** in every response body recursively (`transformKeysToLowercase`), except inside `FormData`/`Blob`/`File`. This is why adapters/hooks/components generally read `data.socioid` rather than `data.SocioID` — but raw backend key casing is inconsistent between endpoints, so defensive `a.foo || a.Foo || a.FOO`-style reads still show up in guards/hooks reading pre-adapter data.
- Automatic retry (up to `MAX_RETRIES = 2`, backoff `RETRY_DELAY_MS * attempt`) applies to network errors and 5xx, *except* when the error text matches `POOL_EXHAUSTION_PATTERN` (FireDAC/Delphi backend connection-pool exhaustion) — retrying that would add load to an already-saturated backend. Pass `{ noRetry: true }` in a request config to opt out of retries for a specific call (used for slow external calls like AFIP/LUFE/Nosis lookups).
- Vite dev server proxies `/proxy-backend` and rewrites some path segments (`byencrypt`/`pornombre`, and `status|password|login` action suffixes) to match quirks of the Delphi/FireDAC backend's routing — see `vite.config.js` if adding new proxied routes.

### Multi-tenancy (`TenantLayout`, `ChannelContext`)

- Every tenant-facing route lives under `/:cadenaSlug` (`src/App.jsx`). `TenantLayout` (`src/components/layout/TenantLayout`) resolves `cadenaSlug` (a numeric `cadenaValorId`) via `useObtenerPorCadenaValorIdWeb`, and redirects to `/not-found` if invalid/missing or `/cadena-inactiva` if the chain is disabled (`activa === "0"`).
- On success, `TenantLayout` populates `ChannelContext` (`src/context/ChannelContext.jsx`) with branding info (`channelInfo.id`, `nombre`, `logo`, colors) that the rest of the tenant UI reads via `useChannel()`. `channelInfo.id` defaults to `"default"` until resolved.
- The global admin area (`/admin/...`) is *not* nested under `TenantLayout` and has its own layout/guard.

### Auth & routing guards

- `useAuthStore` (Zustand + `persist`, `src/store/useAuthStore.js`) holds `user`, `isAuthenticated`, `activeSocioId` (the currently selected company/socio for multi-company users), and `isSolicitudesEnabled`. `setUser` strips `hashseguridad` before persisting. `clearAuth` also purges `sessionStorage` and any `localStorage` keys prefixed `draft_` (form drafts, see `useFormPersist`).
- `OnboardingGuard` (`src/components/guards/OnboardingGuard`) wraps most tenant client routes. It resolves the logged-in user's DB id, their linked *socios* (companies), and their chain memberships, then routes them through onboarding (`terminos` → `alta-datos-empresa`/`seleccionar-empresa` → `legajo`) or straight into the app depending on state. It also detects "vendor" users (users tied to multiple chains) via `useVendor` and enforces they only access chains they're authorized for, redirecting/clearing auth otherwise. There's a hardcoded vendor mock (`vendorbind@yopmail.com`) that bypasses the real socio list for testing.
- `AdminGuard` (`src/components/guards/AdminGuard`) protects `/admin/*`. A user is admin either by `role === "admin"` / hardcoded email, or by having linked "cadenas" (chain admin). `useAdminRestrictions` can further restrict a chain-admin to only the dashboard.
- Both guards independently re-derive `usuarioWebId` from `useObtenerPorNombreOEmail` and re-check chain membership — this duplication is intentional (each guard needs its own redirect targets), not a shared component.

### Forms

- Validation schemas live in `src/schemas/*Schema.js` and pair with `react-hook-form` + `@hookform/resolvers` (zod resolvers).
- `useFormPersist` (`src/hooks/useFormPersist.js`) autosaves form drafts to `localStorage` under `draft_*` keys; these are cleared on logout (see `clearAuth` above).

### External integrations

Several hooks/services wrap third-party/government data sources used during onboarding and legajo enrichment: AFIP (`useAfip`/`afipService`), Nosis (`useNosis`/`nosisService`), LUFE (endpoints inside `sociosService`, e.g. `obtenerAutoridadesLufe`/`obtenerDocumentosLufe`/`obtenerEntidadLufe`), and SGR+ Core (`useSgrPlusCore`/`sgrPlusCoreService`). These calls tend to be slow/unreliable, hence `noRetry: true` and longer explicit `timeout`s.

### Naming conventions

The codebase is bilingual: identifiers, comments, and UI copy are predominantly in Spanish (`sociosService`, `cadenaValorId`, `legajo`, `solicitudes`), matching the domain (Argentine SGR/guarantee business terms: CUIT, AFIP, BCRA, SGR+, socio, cadena de valor). Match this convention for new domain code.
