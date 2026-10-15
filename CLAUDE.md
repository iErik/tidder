# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style
- No semicolons at the end of lines in TS/JS. SCSS still
needs them
- Single quotes and 2-space indentation
- Try to keep lines 60 characters long or shorter as much as
possible. 80 is the hard limit
- When a call's arguments have to wrap, break right after
the opening parenthesis, put the arguments on the lines
below, and close the call on a line of its own (not
enforced by lint):

  ```tsx
  {subRules.map((rule) => radio(
    { rule_reason: rule.violation_reason },
    rule.short_name, rule.short_name
  ))
  }
  ```
- `pnpm lint` enforces the rest (see below)

## Project status

Tidder is an Electron + React Reddit desktop client, originally written in Angular in 2018 and archived after Reddit's 2023 API changes. It was modernized in 2026 (Electron 44, TypeScript 6), and its renderer was then rewritten from Angular to React 19. Reddit rejects unauthenticated `www.reddit.com/*.json` requests with 403, so the app requires login: while logged out, `RootLayout` shows `LoginScreen` (`layouts/root-layout/LoginScreen`) instead of the sidebar and routes, and every API request goes to `oauth.reddit.com`.

## Environment and commands

Node 24 and pnpm 12 come from `flake.nix`. Use `nix develop`, or direnv (`.envrc` contains `use flake`). Use pnpm with `pnpm-lock.yaml`; npm and yarn are no longer used. pnpm's settings are in `pnpm-workspace.yaml`:

- `nodeLinker: hoisted` gives a flat `node_modules`, which electron-builder needs to package the app.
- pnpm fails the install when a dependency has an unapproved build script. `allowBuilds` lists each one explicitly, and none are allowed (Vite 8 bundles with Rolldown, so there's no esbuild postinstall). Add new ones with `pnpm approve-builds`.

Electron downloads its binary lazily on first run.

```bash
pnpm run dev               # generate theme SCSS, Vite dev server on :4200, then Electron with TIDDER_DEV_URL
pnpm run build             # generate theme SCSS + `tsc --noEmit` + `vite build` -> dist/renderer/browser
pnpm start                 # build, then run Electron against the built files
pnpm run build:pack        # build + electron-builder for this platform -> release/
pnpm run build:pack:mac    # x64 + arm64 zips, ad-hoc signed (mac.identity "-")
pnpm lint                  # ESLint over app/, electron/, scripts/, eslint-rules/ and root configs
pnpm lint:fix              # the same, fixing what it can (formatting)
```

There is no test suite. `pnpm run build` type-checks the app (`strict`) before bundling; Vite itself doesn't type-check, and the build doesn't lint.

Linting is configured in `eslint.config.mjs`, and every rule is an error:

- Stylistic formatting everywhere:
  - no semicolons, single quotes, 2-space indent, no trailing spaces;
  - 80 columns, with only lines containing a URL exempt. Split long strings into concatenations;
  - function parameters and imported names either all share one line, or each gets its own line (`exp-list-style`);
  - an import longer than 60 characters gets one imported name per line (`local/import-length`, a local rule in `eslint-rules/`);
  - once a JSX tag's attributes wrap, each attribute gets its own line, the first one included, and the closing `>` or `/>` goes on a line of its own, aligned with the tag (`jsx-max-props-per-line`, `jsx-first-prop-new-line`, `jsx-closing-bracket-location`).
- `app/`: `typescript-eslint` `recommendedTypeChecked` and `react-hooks` `recommended`, with React Compiler rules. `no-misused-promises` doesn't check JSX attributes, so async event handlers need no `void`.
- `electron/` (CommonJS), and `scripts/` and `eslint-rules/` (ESM): `@eslint/js` recommended with Node globals.
- A finding that can't be fixed without a refactor gets `// eslint-disable-next-line <rule>`, with the reason in a comment on the lines above it.

`pnpm install` sets up a husky pre-commit hook (the `prepare` script) that runs `eslint --fix` on staged TS/JS files through lint-staged, and blocks the commit if errors remain. The hook runs `pnpm`, so commit from inside the nix/direnv shell. `.git-blame-ignore-revs` lists formatting-only commits; enable it with `git config blame.ignoreRevsFile .git-blame-ignore-revs`.

## Architecture

- **Main process (`electron/`)**: plain CommonJS, not bundled.
  - `main.js` creates the frameless window with `contextIsolation`, `sandbox` and no `nodeIntegration`, and registers IPC handlers.
  - `settings.js` is a JSON store at `userData/Settings`, the same file the old `electron-settings` used, seeded from `app/config/settings.json`.
  - `preload.js` exposes `window.tidder`, typed in `app/types/tidder.d.ts`. It provides platform, window controls, `openExternal`, `openPopup`, `login`, and `settings.get/set/watch`.
  - The renderer has no Node or `require`, so new native features have to go through this bridge.
  - The packaged app only contains the `build.files` listed in `package.json`. The main process also requires `app/config/authConfig.json` and `settings.json`, so keep those listed.
- **Renderer (`app/`)**: React 19 + TypeScript, built by Vite (`vite.config.mts`, `root: app`, output `dist/renderer/browser`).
  - `main.tsx` calls `setup()` from `core/auth.ts`, then renders `QueryClientProvider` > `HashRouter` > `RootLayout` in StrictMode.
  - In `pnpm run dev` only, the TanStack Query devtools are available from the button in the bottom-left corner. Feed and comment queries use `gcTime: 0`, so they vanish from the devtools as soon as nothing uses them.
  - `index.html` has a strict CSP (`script-src 'self'`). The dev server needs an inline script for React Fast Refresh, so `vite.config.mts` adds `'unsafe-inline'` to `script-src` in serve mode only.
- **Import aliases**: bare aliases rooted at `app/` (`api/`, `components/`, `config/`, `core/`, `hooks/`, `layouts/`, `pages/`, `utils/`) are defined in both `tsconfig.json` `paths` and `vite.config.mts` `resolve.alias`; keep them in sync. SCSS imports resolve from `app/` (`@import 'styles/helpers/module'`) via Sass `loadPaths`.
- **App structure**:
  - `RootLayout` has a single `<Route path="*">` rendering `FeedPage` (`pages/FeedPage`), so the page stays mounted between feeds (the open post and sort mode survive navigation). `FeedPage` maps the path to a feed source (`home`, `saved`, `r/<name>`, `/user/<u>/m/<multi>/`).
  - `FeedContext` (a reducer provided by `FeedPage`) holds the source, sort mode and search query. Starting a search switches the sort to `relevance`; clearing it goes back to `hot`.
  - `api/` has the Reddit client: `client.ts` (`redditFetch`, which adds the bearer token, `raw_json=1` and `api_type=json`, and sends non-GET params as a form body), plain async functions per area (`posts.ts`, `subreddits.ts`, `multis.ts`), and TanStack Query hooks in `queries.ts`. `useFeed` is an infinite query keyed on the settled feed params (search and sort changes are debounced 300ms in `PostFeed`).
  - `api/thingState.ts` holds the user's votes, saves, reports and subscriptions, keyed by fullname, applied optimistically and reverted on failure. Components read Reddit data through `useThing()` so every copy of a post (feed card, viewer) shows the same state. Don't mutate Reddit objects in place.
  - `components/<Name>/<Name>.tsx` with a `<Name>.module.scss` next to it. `SafeHtml` renders Reddit HTML (post text, embeds, comments) sanitized with DOMPurify, and opens links with `window.tidder.openExternal`; don't use `dangerouslySetInnerHTML` elsewhere.
- **Auth**: Reddit's authorization-code flow for installed apps, in the system browser. It's configured in `app/config/authConfig.json`.
  - The `redirectUri` there (`http://127.0.0.1:65010/callback`) must exactly match the one registered at reddit.com/prefs/apps.
  - `electron/auth/`, in the main process, does the login. `browser-login.js` has the flow; `parseCallback()` is the pure decision logic for a request, and a `LoginAttempt` holds one login in progress. `tokens.js` has the token requests and refresh-token storage. It:
    - starts an HTTP server on the redirect URI's address, then opens the authorize URL with `shell.openExternal`
    - checks `state` on the callback, then exchanges the code (Basic auth `client_id:` with an empty secret, via `net.fetch`)
    - closes the server afterwards
  - The refresh token (`duration=permanent`) never reaches the renderer. It's stored encrypted with `safeStorage` in `userData/Auth`.
  - The renderer uses `window.tidder.auth.login/cancel/refresh/logout`. `core/auth.ts` is an external store (read with `useAuth()`); `core/session.ts` keeps only the access token and `expires_at` in `localStorage`. `loggedIn` means there's a session, not that the token is still valid.
    - It refreshes 5 minutes before expiry.
    - On startup with an expired token, it tries a silent refresh before showing the login screen.
  - A 401 from any API request triggers a refresh (concurrent ones share it). `getIdentity()` fetches `/api/v1/me`; a 401/403 there calls `logout()`, which revokes the token, clears the query cache and brings back the login screen.
  - `main.js` adds a `desktop:org.isidore.tidder:v<version> (by /u/<developer>)` User-Agent to `oauth.reddit.com` requests.
- **Theming**:
  - `app/config/themes.json` is the single source of truth.
  - `scripts/generate-theme-scss.mjs` turns it into `app/styles/helpers/_themes.generated.scss` (gitignored, regenerated by `dev`/`build`) as `$appThemes`.
  - Components use the `themify` mixin (`styles/helpers/_mixins.scss`) against a `.theme-<name>` class that the root layout sets from the `appTheme` setting (read with `useSetting()`).
  - Component styles are SCSS Modules that start with `@import 'styles/helpers/component';`, which makes `themify` emit `:global(.theme-<name>)`. The component's outer element has the `host` class (what `:host` was in Angular).
  - Build class names with `bindStyles(styles)` (`utils/classNames.ts`): `cx('button', { 'is-active': x })` emits each class as written plus its hashed module name if the module defines it, so global classes (`button`, `icn-*`, grid) keep working.

## Agent skills

### Issue tracker

Issues live in Tidder's Team board within Linear, managed with Linear's MCP. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels, used as-is (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
