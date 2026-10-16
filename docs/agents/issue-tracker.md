## Working from Linear tickets

Work in this repo is organized as Linear tickets (team prefix: `TDR`). Use the Linear MCP tools to read and update them. A ticket is the source of truth for what to build; this file is the source of truth for how.

### Picking up a ticket

1. Read the full ticket: description, acceptance criteria, comments, linked documents, sub-issues, and relations.
2. Check that every "blocked by" issue is Done. If not, stop and tell me.
3. Only start a ticket that is in **Ready**, or one I explicitly name in my prompt.
4. If the ticket is ambiguous, has no checkable acceptance criteria, or contradicts the code, do not guess. Post your questions as a comment on the ticket, leave its status as it is, set its triage label back to `needs-info`, and stop.
5. For anything beyond a small fix, post a short plan as a comment (files you'll touch, approach, risks) and wait for my go-ahead before writing code.

### Branches and scope

- One ticket = one worktree. A ticket can need several PRs to stay within the size limit (see [PR size](#pr-size)), and each PR gets its own branch:
  - the first uses the branch name Linear generates for the issue (it contains the ticket ID, which the GitHub integration relies on);
  - later ones add `-part-2`, `-part-3`, and so on.
- When starting new work, always create a new worktree, the worktree directory name must be the ticket's ID (e.g. TDR-123), if the current directory belongs to another ticket's worktree, simply move to the correct worktree or create it if it doesn't exist yet.
- Stay inside the ticket's scope. Respect its "Out of scope" section.
- If a ticket has a "Dont's" or "Don't do" section, make sure to absolutely not do any of the things listed in that section.
- If you find unrelated bugs, refactors, or follow-up work, do not fix them in this PR. Create a new ticket in **Backlog** (or comment, if unsure) with what you found and where, and let me know.
- Do not edit a ticket's title, description, or acceptance criteria, unless explicitly told to. Add comments instead.

### Status changes

| When | Move to |
|---|---|
| You start working | **In Progress** |
| PR is open and checks pass | **In Review** |
| You start the ticket's next PR | **In Progress** |
| You need input or are blocked | Comment explaining why; leave status as is |

**Never move a ticket to Done or Canceled.** I do that after reviewing and merging.

### Before moving to In Review

- [ ] Every acceptance criterion is met, and you can say how you verified each one
- [ ] Tests added or updated for the change
- [ ] `pnpm lint` passes
- [ ] `<typecheck command>` passes
- [ ] `pnpm test` passes
- [ ] No unrelated changes in the diff
- [ ] The PR is within the [size limit](#pr-size)

### Commits and PRs

- Commit messages and the PR title start with the ticket ID: `APP-12: Add retry to GraphQL client`.
- PR description includes: link to the ticket, a short summary of the change, how it was verified, and any deviations from the ticket or decisions I should look at.

### PR size

A PR has **at most 700 changed lines**, counted as additions plus deletions, leaving out generated files.

- **Generated files** are ones a tool produces rather than someone writing them by hand. Today that means:
  - `pnpm-lock.yaml`;
  - the icon SVGs in `app/components/Icon/icons/`, extracted from a font;
  - test snapshots (`__snapshots__/`).

  Binary files add no lines anyway. If a PR adds a new kind of generated file, add it here and to the command below.
- **Measure it** before opening the PR, and again before asking for review:

  ```bash
  git fetch origin master
  git diff --shortstat FETCH_HEAD...HEAD -- . \
    ':(exclude)pnpm-lock.yaml' \
    ':(exclude)app/components/Icon/icons/**' \
    ':(exclude)**/__snapshots__/**'
  ```

  The insertions plus deletions it reports must be 700 or fewer. The repo is a bare clone without remote-tracking branches, so there's no `origin/master` to compare against: `FETCH_HEAD` is the `master` just fetched.
- **Plan the split up front.** When a ticket needs more than that, the plan comment lists the PRs and what each one covers. Split along seams that each stand on their own. Every PR builds, lints and passes its tests by itself, and can be reviewed and merged on its own.
- **Order the parts.** A part that depends on an earlier one waits until that one is merged, then branches from `master`. Independent parts can be open at the same time.
- **Announce each PR on the ticket** when it opens: a comment with the link, "part N of M", what it covers, and what's left for the remaining parts. Also say so in the PR description.
- **The limit wins over the ticket's plan.** If a ticket or its brief plans fewer PRs than the work needs to stay within the limit, split it further anyway, and list that among the departures from the ticket.
- **Review fixes count too.** If they push a PR over the limit, move them into the next part instead.

### When you finish

Comment on the ticket with each PR's link (with "part N of M" if there's more than one), a two or three line summary, and anything the reviewer should check first.

### Project commands

- Install: `<install command>`
- Dev server: `<dev command>`
- Lint: `pnpm lint`
- Typecheck: `<typecheck command>`
- Test: `pnpm test`

## When a skill says "publish to the issue tracker"

Create a new Linear issue.

## When a skill says "fetch the relevant ticket"

Use Linear's MCP to fetch information from the ticket

