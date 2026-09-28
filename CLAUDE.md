# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Tidder is an Electron + Angular Reddit desktop client, originally written in 2018 and archived after Reddit's 2023 API changes. It was modernized in 2026 to Angular 22, Electron 44, TypeScript 6 and rxjs 7. Reddit rejects unauthenticated `www.reddit.com/*.json` requests with 403, so the app requires login: while logged out, `RootLayout` shows `LoginScreenComponent` (`layouts/root-layout/components/login-screen`) instead of the sidebar and router outlet, and every service's `apiRootURL` is `oauth.reddit.com`.

## Environment and commands

Node 24 comes from `flake.nix`. Use `nix develop`, or direnv (`.envrc` contains `use flake`). Use npm with `package-lock.json`; yarn is no longer used. npm 11 blocks dependency install scripts: `allowScripts` in `package.json` approves only `esbuild`. Electron downloads its binary lazily on first run.

```bash
npm run dev               # generate theme SCSS, `ng serve` on :4200, then Electron with TIDDER_DEV_URL
npm run build             # generate theme SCSS + `ng build` -> dist/renderer/browser
npm start                 # build, then run Electron against the built files
npm run build:pack        # build + electron-builder for this platform -> release/
npm run build:pack:mac    # x64 + arm64 zips, ad-hoc signed (mac.identity "-")
```

There is no test suite and no linter. `ng build` type-checks the app and its templates.

## Architecture

- **Main process (`electron/`)**: plain CommonJS, not bundled.
  - `main.js` creates the frameless window with `contextIsolation`, `sandbox` and no `nodeIntegration`, and registers IPC handlers.
  - `settings.js` is a JSON store at `userData/Settings`, the same file the old `electron-settings` used, seeded from `app/config/settings.json`.
  - `preload.js` exposes `window.tidder`, typed in `app/types/tidder.d.ts`. It provides platform, window controls, `openExternal`, `openPopup`, `login`, and `settings.get/set/watch`.
  - The renderer has no Node or `require`, so new native features have to go through this bridge.
  - The packaged app only contains the `build.files` listed in `package.json`. The main process also requires `app/config/authConfig.json` and `settings.json`, so keep those listed.
- **Renderer (`app/`)**: built by the Angular CLI (`@angular/build:application`, esbuild).
  - NgModule-based. Every component declares `standalone: false`, and uses `changeDetection: ChangeDetectionStrategy.Eager` because Angular 22 defaults to OnPush (a few components deliberately use OnPush).
  - Zone-based change detection is kept via `provideZoneChangeDetection()` in `core/app.module.ts`.
  - Hash routing uses a custom `RouteReuseStrategy`.
- **Import aliases**: bare aliases rooted at `app/` (`core/`, `services/`, `components/`, `utils/`, `config/`, and so on) are defined in `tsconfig.json` `paths`. SCSS imports resolve from `app/` (`@import 'styles/helpers/module'`) via `stylePreprocessorOptions.includePaths`.
- **App structure**:
  - `FeedPage` serves every route.
  - `FeedService` is provided per page and acts as a BehaviorSubject bus (feed source, sort mode, search query).
  - The singleton Reddit API services in `services/` use `HttpClient`.
  - `components/` is one `ComponentsModule`.
- **Auth**: Reddit's authorization-code flow for installed apps, in the system browser. It's configured in `app/config/authConfig.json`.
  - The `redirectUri` there (`http://127.0.0.1:65010/callback`) must exactly match the one registered at reddit.com/prefs/apps.
  - `electron/auth/`, in the main process, does the login. `browser-login.js` has the flow; `parseCallback()` is the pure decision logic for a request, and a `LoginAttempt` holds one login in progress. `tokens.js` has the token requests and refresh-token storage. It:
    - starts an HTTP server on the redirect URI's address, then opens the authorize URL with `shell.openExternal`
    - checks `state` on the callback, then exchanges the code (Basic auth `client_id:` with an empty secret, via `net.fetch`)
    - closes the server afterwards
  - The refresh token (`duration=permanent`) never reaches the renderer. It's stored encrypted with `safeStorage` in `userData/Auth`.
  - The renderer uses `window.tidder.auth.login/cancel/refresh/logout`. `UserService` keeps only the access token and `expires_at` in `localStorage` (`isAuthenticated()` checks it).
    - It refreshes 5 minutes before expiry.
    - On startup with an expired token, it tries a silent refresh before showing the login screen.
  - `getIdentity()` fetches `/api/v1/me`. A 401/403 there calls `logout()`, which revokes the token and brings back the login screen.
  - `main.js` adds a `desktop:org.isidore.tidder:v<version> (by /u/<developer>)` User-Agent to `oauth.reddit.com` requests.
- **Theming**:
  - `app/config/themes.json` is the single source of truth.
  - `scripts/generate-theme-scss.mjs` turns it into `app/styles/helpers/_themes.generated.scss` (gitignored, regenerated by `dev`/`build`) as `$appThemes`.
  - Components use the `themify` mixin (`styles/helpers/_mixins.scss`) against a `.theme-<name>` class that the root layout sets from the `appTheme` setting.
