# ContentMaster 2.0 — CLAUDE.md

Social media content management platform for scheduling and publishing to Meta (Facebook/Instagram).

## Tech Stack

- **Frontend:** React 19, TypeScript 5.9, Tailwind CSS 4, React Router 7, Vite 7
- **Backend:** Firebase Cloud Functions v6, Node.js 22, TypeScript 5.7
- **Database:** Firestore (NoSQL)
- **Auth:** Firebase Authentication (Email/Password)
- **API:** Meta Graph API v21.0
- **Hosting:** Firebase Hosting

## Dev Commands

```bash
npm run dev        # Vite dev server
npm run build      # TypeScript check + Vite build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint
```

Firebase functions are in `functions/` — separate `npm install` and build there.

## Project Structure

```
src/
  app.tsx / main.tsx         # Entry points
  router/
    routes.ts                # Route definitions
    index.tsx                # BrowserRouter setup
  pages/                     # Dashboard, CreatePost, Planner, Accounts, Settings, Login, Register, NotFound
  components/
    layout/                  # MainLayout, Header, Sidebar
    calendar/                # CalendarGrid, CalendarDay, PostCard
    ui/                      # Button, CaptionInput, PlatformSelector, LoadingSpinner, ProtectedRoute
  contexts/
    AuthContext.tsx           # Auth state (currentUser, signIn, signUp, logout)
  hooks/
    useAuth.ts               # Access AuthContext
  services/
    auth.service.ts          # Stub — auth lives in AuthContext
    posts.service.ts         # TODO: Firestore CRUD
    accounts.service.ts      # TODO: Meta account management
  lib/
    firebase.ts              # Firebase client SDK init
    constants.ts             # App constants
  types/
    index.ts, user.ts, post.ts, meta-account.ts, scheduled-job.ts

functions/src/
  index.ts                   # Exports all Cloud Functions
  functions/
    auth.functions.ts        # onUserCreated trigger → creates user doc
    api.functions.ts         # Callable HTTPS: getAccounts, publishNow, getPosts
    meta-oauth.functions.ts  # Meta OAuth callback → stores tokens
    publish.functions.ts     # Scheduled publisher (processes scheduledJobs)
  services/
    meta-auth.service.ts     # Token management
    meta-publish.service.ts  # Meta Graph API publishing
    scheduler.service.ts     # Job scheduling & retry
  config/
    firebase.ts              # Admin SDK init
    meta.ts                  # Meta API config
```

## Auth Flow

- `AuthContext` wraps the app, `onAuthStateChanged` persists state
- `ProtectedRoute` redirects unauthenticated users to `/login`
- Layout: `ProtectedRoute → MainLayout → Outlet`
- User docs auto-created in Firestore by `onUserCreated` Cloud Function

## Firestore Schema

**users/** — `uid, email, displayName, photoURL, metaAccountIds[], createdAt, updatedAt`

**posts/** — `userId, metaAccountId, postType (feed_post|story|reel), platforms (facebook|instagram)[], status (draft|scheduled|publishing|published|failed), caption, media[], hashtags[], scheduledAt, publishedAt, metaPostIds, errorMessage`

**metaAccounts/** — `userId, metaUserId, type (facebook_page|instagram_business), name, pageId, instagramBusinessAccountId, tokenExpiresAt, isActive`

**scheduledJobs/** — `postId, userId, scheduledAt, status (pending|processing|completed|failed), attempts, maxAttempts`

**metaTokens/** — Admin SDK only, no client access

## Security Rules Summary

- All collections are user-scoped (`userId === request.auth.uid`)
- `scheduledJobs` — users read-only, Cloud Functions write only
- `metaTokens` — completely locked down

## Environment Variables

Frontend (`.env`):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_META_APP_ID
```
Meta app secret stays backend-only (never in frontend env).

## Path Aliases

`@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`)

## Design System

CSS custom properties in `src/index.css`:
- `--color-meta-blue: #1877F2` — primary actions
- `--color-meta-bg: #F0F2F5` — background
- `--color-meta-surface: #FFFFFF` — cards
- `--color-meta-green: #42B72A` — success
- `--color-meta-red: #FA3E3E` — error

Button component: variants `primary | secondary | ghost`, sizes `sm | md | lg`

## Conventions

- Components: PascalCase files matching component name
- Services: `feature.service.ts` lowercase
- Types: PascalCase interfaces in `src/types/`
- Constants: UPPER_SNAKE_CASE
- No Context API for non-auth state (use local `useState` or add services)

## What's Done vs TODO

**Done:** Auth (login/register/logout), layout/navigation, all page UIs (Dashboard, CreatePost, Planner, Accounts, Settings), Cloud Functions backend structure, Firestore rules

**TODO:** `posts.service.ts` Firestore CRUD, `accounts.service.ts` Meta integration, media upload, real data binding in pages, error handling improvements, Settings implementation
