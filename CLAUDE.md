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

Node 24 and pnpm 12 come from `flake.nix`, and `packageManager` in `package.json` pins the exact pnpm version (CI reads it). Use `nix develop`, or direnv (`.envrc` contains `use flake`). Use pnpm with `pnpm-lock.yaml`; npm and yarn are no longer used. pnpm's settings are in `pnpm-workspace.yaml`:

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
pnpm test                  # generate theme SCSS, then run every Vitest test once
pnpm test:watch            # the same, in watch mode
pnpm test:coverage         # run once with a v8 coverage report in coverage/ (no threshold)
```

`pnpm run build` type-checks the app (`strict`), test files included, before bundling; Vite itself doesn't type-check, and the build doesn't lint or run the tests.

Tests run on Vitest, configured in `vitest.config.mts` with two projects:

- `renderer`: `app/**/*.test.{ts,tsx}` in happy-dom. It merges `vite.config.mts`, so import aliases, the React plugin and Sass work as in the app. SCSS modules are compiled (that's why the scripts generate the theme SCSS first), so a test sees the classes a module really defines.
- `main`: `electron/**/*.test.js` and `scripts/**/*.test.mjs` in Node. Script tests get the same fake `electron` setup, and simply don't use it.

Conventions:

- A test file sits next to the code it tests (`timeAgo.test.ts` beside `timeAgo.ts`). Renderer tests are TypeScript and import `describe`, `it`, `expect` and `vi` from `vitest` (there are no globals). Main-process tests are plain JS, written as ES modules because Vitest can't be required. Script tests are `.mjs`, like the scripts.
- Hooks are tested with `renderHook` from `@testing-library/react`. There are no component tests yet.
- `app/test/setup.ts` installs a fake `window.tidder` (`app/test/fakeTidder.ts`) before each test: every method a `vi.fn()`, settings in memory, seeded from `app/config/settings.json`, and logged out. It's typed against `TidderBridge`, so it stops compiling when the bridge changes. Stub or check it through `tidder()`, e.g. `tidder().auth.refresh.mockResolvedValue(null)`. Each test's fake is copied into the objects already installed, since modules like `core/useSetting` keep a reference from import time. `localStorage` is cleared too. Limits of the fake:
  - Stub methods on the installed fake. Assigning a new `window.tidder` or `window.tidder.settings` orphans the object a module already holds, for the rest of the file.
  - Values copied out at import time don't follow the fake. `WindowControls` and `RootLayout` keep `window.tidder.platform` (always `'linux'` in the fake) as a string, so a `darwin` test sets the platform first, then imports the module with `vi.resetModules()` and `await import()`.
  - The fake's `settings.set` accepts any key and notifies watchers right away. The real store rejects unknown keys and notifies asynchronously, so a rejected write doesn't show up in renderer tests.
- Stub `fetch` with `stubFetch(...)` and `jsonResponse()` from `app/test/fetch.ts`: it uses `vi.stubGlobal`, answers with real `Response` objects in order, and rejects any extra request. The renderer project unstubs globals after each test. Don't add MSW or another request-mocking library.
- Modules with state at module level (`api/thingState`, `core/auth`) are isolated with `vi.resetModules()` and a fresh `await import()` in each test. Don't add reset functions or other test-only exports to production code.
- `electron/test/setup.js` gives each main-process test a fake `electron` (`electron/test/electron.js`, read with `electron()`): `app.getPath('userData')` points at a fresh temp directory that's removed afterwards (any other name throws), `safeStorage` is a reversible fake, and `net.fetch` rejects until a test stubs it. `vi.mock('electron')` doesn't work here: it can't reach the `require()` calls in `electron/`, so the fake goes into Node's `require.cache`, and the project's own files are dropped from that cache before each test. Load the module under test with `createRequire(import.meta.url)` inside the test: a `require` at the top of the file runs before the fake is installed, and gets the real `electron` package. The cache and the fake are shared by the whole file, so main-process tests stay sequential: no `it.concurrent` or `describe.concurrent`, and a `describe` whose tests share state passes `{ concurrent: false }`. One whose tests also depend on running in order passes `{ concurrent: false, shuffle: false }`: `concurrent: false` alone doesn't stop `--sequence.shuffle` from reordering them. Both options hold even when concurrency or shuffling is turned on for the whole run.
- `electron/test/` and `*.test.js` are left out of the packaged app (`build.files`).

Linting is configured in `eslint.config.mjs` and `stylelint.config.mjs`, and every enabled rule is an error. Stylelint does not extend a shareable preset.

- Stylistic formatting everywhere:
  - no semicolons, single quotes, 2-space indent, no trailing spaces;
  - 80 columns, with only lines containing a URL exempt. Split long strings into concatenations;
  - function parameters and imported names either all share one line, or each gets its own line (`exp-list-style`);
  - an import longer than 60 characters gets one imported name per line (`local/import-length`, a local rule in `eslint-rules/`);
  - once a JSX tag's attributes wrap, each attribute gets its own line, the first one included, and the closing `>` or `/>` goes on a line of its own, aligned with the tag (`jsx-max-props-per-line`, `jsx-first-prop-new-line`, `jsx-closing-bracket-location`).
- `app/`: `typescript-eslint` `recommendedTypeChecked` and `react-hooks` `recommended`, with React Compiler rules. `no-misused-promises` doesn't check JSX attributes, so async event handlers need no `void`.
- `electron/` (CommonJS), and `scripts/` and `eslint-rules/` (ESM): `@eslint/js` recommended with Node globals.
- A finding that can't be fixed without a refactor gets `// eslint-disable-next-line <rule>`, with the reason in a comment on the lines above it.
- SCSS is linted by Stylelint (`customSyntax` `postcss-scss`). There is no column limit. The only rules are:
  - `@stylistic/indentation`: 2;
  - `@stylistic/string-quotes`: single, with `avoidEscape`;
  - `@stylistic/declaration-block-trailing-semicolon`: always;
  - `block-no-empty`;
  - `declaration-block-no-duplicate-properties`;
  - `property-no-unknown`;
  - `unit-no-unknown`;
  - `color-no-invalid-hex`;
  - `scss/at-rule-no-unknown` (the SCSS variant; core `at-rule-no-unknown` is not enabled).
- `ignoreFiles` skips `app/styles/vendors/**` and the generated `app/styles/helpers/_themes.generated.scss`.
- These stay legal with no per-line disable, because no shipped rule flags them: `:global(...)`, Sass nesting, `!global`, `@if`, `lighten()`, `darken()`, and the color helpers.
- A Stylelint finding that isn't a behavior-equivalent autofix gets `/* stylelint-disable-next-line <rule> -- <reason> */`. A duplicate property with two different values stays, under that comment: autofix would drop one of them. `reportDescriptionlessDisables`, `reportUnscopedDisables`, `reportInvalidScopeDisables`, and `reportNeedlessDisables` are on.
- `pnpm lint` and `pnpm lint:fix` run ESLint and Stylelint, and fail if either fails. `pnpm run build` does not lint.

`pnpm install` sets up a husky pre-commit hook (the `prepare` script) that runs `eslint --fix` on staged TS/JS files and Stylelint on staged SCSS through lint-staged, and blocks the commit if errors remain. The hook runs `pnpm`, so commit from inside the nix/direnv shell. `.git-blame-ignore-revs` lists formatting-only commits; enable it with `git config blame.ignoreRevsFile .git-blame-ignore-revs`.

The repo is a bare clone with a worktree per branch, and it has no remote-tracking branches. So `gh pr create` can't tell which remote branch the worktree's branch is pushed to: after `git push -u origin <branch>`, pass it explicitly with `gh pr create --base master --head <branch>`.

## CI and releases

GitHub Actions, in `.github/workflows/`. Neither uses the Nix flake: they set up Node 24 with `actions/setup-node` and pnpm with `pnpm/action-setup` (from `packageManager`), and cache the pnpm store.

- `checks.yml` runs on pull requests to `master`, and is called by `release.yml`. On Ubuntu: `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm lint`, `pnpm test`.
- `release.yml` runs on pushes to `master` that change `app/`, `electron/`, `resources/`, `scripts/`, `package.json`, `pnpm-lock.yaml` or `vite.config.mts`, and manually from the Actions tab. It runs the checks, picks the version, packages on macOS, Windows and Linux (one job each, uploading the files as workflow artifacts), and then, only if every packaging job succeeded, publishes the release. That last job is the only one with `contents: write`. It tags a release commit: the built commit plus the `version` bump (or the built commit itself, when its `version` is already the release), so the tagged `package.json` shows the release. The tag is pushed just before `gh release create` and deleted again if that fails, so a failed run leaves no tag.
  - A manual run with `dry_run` packages and uploads the files, and skips the release. The release job also only runs on `master`.
  - Runs share one concurrency group and are never cancelled. GitHub keeps only one *pending* run per group, though: if a third run arrives while one runs and one waits, it replaces the waiting one, which then never releases.
  - After the release, the `bump` job brings `package.json`'s new `version` to `master`. If `master` is still at the built commit, it fast-forwards to the tagged release commit, so the tag sits on `master`'s history; otherwise it commits the bump on `master`'s head as `Release v<version> [skip ci]`. It pushes as a GitHub App (Contents: read and write, installed only on this repo), which is a bypass actor in `master`'s ruleset. That push is the only commit any workflow makes, and the only one allowed past the ruleset and the checks. The job refuses a diff touching anything but the `version` line. It needs the `RELEASE_APP_CLIENT_ID` variable and the `RELEASE_APP_PRIVATE_KEY` secret. If it fails, the release still stands; fix the cause, and the next run picks the right number from the tags anyway.

Versions: `package.json`'s `version` is the last version released, always a full version (`X.Y.Z` or `X.Y.Z-<word>.N`; electron-builder rejects anything else). `scripts/next-version.mjs` gives the next release the next number on its line, after the highest matching tag on `origin`: `1.0.0-beta.3` gives `1.0.0-beta.4`, and `1.1.2` gives `1.1.3`. A version with no tag yet is released as is, so moving to a new line is a manual edit to its first version (`1.1.0`, `1.0.0-rc.1`). The bump only moves `version` forward on the same line, so it never undoes such an edit. The workflow also passes the version to electron-builder with `-c.extraMetadata.version`, so the packaged app's `app.getVersion()` (and the User-Agent) report it. A version with a pre-release part is published as a pre-release; otherwise as a full release, marked latest. Release notes are GitHub's generated changes, after a fixed "Installing" section (the unsigned-app workarounds).

Artifacts are named `Tidder-<version>-<os>-<arch>[-portable|-setup].<ext>` (`artifactName` per target in `build`):

- `Tidder-1.0.0-beta.4-mac-arm64.zip`, `Tidder-1.0.0-beta.4-mac-x64.zip`
- `Tidder-1.0.0-beta.4-win-x64-portable.exe`, `Tidder-1.0.0-beta.4-win-x64-setup.exe` (NSIS)
- `Tidder-1.0.0-beta.4-linux-x64.AppImage`, `.deb`, `.rpm`

The Linux pattern spells `x64` out because electron-builder's `${arch}` is `x86_64` for AppImage and rpm, and `amd64` for deb.

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
  - Icons are `<Icon name="…" />` (`components/Icon`): SVGs in `components/Icon/icons/`, imported with SVGR (`?react`) and listed in the `icons` map, whose keys make the `IconName` union. They render as `<svg class="icon icon-<name>">`, 1em square and filled with `currentColor`, so `font-size` and `color` style them. Style them with the `icon` mixin (`@include icon { … }`, or `icon('<name>')` for one icon), which marks the classes global inside CSS Modules.
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
  - Component styles are SCSS Modules that start with `@import 'styles/helpers/component';`, which makes `themify` emit `:global(.theme-<name>)`. The component's outer element has a class named after the component in kebab-case (`PostCard` → `post-card`), not a shared name like `host`, since `bindStyles` also emits the plain name. An inner element that would otherwise share that class gets an `-inner` suffix (`post-card-inner`). Check new names against the global classes too, or the global styles will apply to the component.
  - Build class names with `bindStyles(styles)` (`utils/classNames.ts`): `cx('button', { 'is-active': x })` emits each class as written plus its hashed module name if the module defines it, so global classes (`button`, `icon-*`, grid) keep working.

## Agent skills

### Issue tracker

Issues live in Tidder's Team board within Linear, managed with Linear's MCP. See `docs/agents/issue-tracker.md`. Every PR has at most 700 changed lines, not counting generated files ("PR size" there says what counts and how to measure it). A ticket that needs more is split into several PRs, each with a sub-issue of its own ("Sub-issues" there) and announced on the ticket.

### Triage labels

The five default triage labels, used as-is (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
