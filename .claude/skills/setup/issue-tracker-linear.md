## Working from Linear tickets

Work in this repo is organized as Linear tickets (team prefix: `<PREFIX>`). Use the Linear MCP tools to read and update them. A ticket is the source of truth for what to build; this file is the source of truth for how.

### Picking up a ticket

1. Read the full ticket: description, acceptance criteria, comments, linked documents, sub-issues, and relations.
2. Check that every "blocked by" issue is Done. If not, stop and tell me.
3. Only start a ticket that is in **To Do**, or one I explicitly name in my prompt.
4. If the ticket is ambiguous, has no checkable acceptance criteria, or contradicts the code, do not guess. Post your questions as a comment on the ticket, move it to **Needs Spec**, and stop.
5. For anything beyond a small fix, post a short plan as a comment (files you'll touch, approach, risks) and wait for my go-ahead before writing code.

### Branches and scope

- One ticket = one branch = one PR = one worktree. Use the branch name Linear generates for the issue (it contains the ticket ID, which the GitHub integration relies on).
- When starting new work, always create a new worktree, the worktree directory name must be the ticket's ID (e.g. TDR-123), if the current directory belongs to another ticket's worktree, simply move to the correct worktree or create it if it doesn't exist yet.
- Stay inside the ticket's scope. Respect its "Out of scope" section.
- If a ticket has a "Dont's" or "Don't do" section, make sure to absolutely not do any of the things listed in that section.
- If you find unrelated bugs, refactors, or follow-up work, do not fix them in this PR. Create a new ticket in **Backlog** (or comment, if unsure) with what you found and where, and let me know.
- Do not edit a ticket's title, description, or acceptance criteria, unless explicitly told to. Add comments instead.

### Status changes

| When | Move to |
|---|---|
| You start working | **In Progress** |
| PR is open and checks pass | **Code Review** |
| You need input or are blocked | Comment explaining why; leave status as is |

**Never move a ticket to Done or Canceled.** I do that after reviewing and merging.

### Before moving to Code Review

- [ ] Every acceptance criterion is met, and you can say how you verified each one
- [ ] Tests added or updated for the change
- [ ] `<lint command>` passes
- [ ] `<typecheck command>` passes
- [ ] `<test command>` passes
- [ ] No unrelated changes in the diff

### Commits and PRs

- Commit messages and the PR title start with the ticket ID: `APP-12: Add retry to GraphQL client`.
- PR description includes: link to the ticket, a short summary of the change, how it was verified, and any deviations from the ticket or decisions I should look at.
- Keep diffs small and reviewable. If the work is growing beyond one reviewable PR, stop and propose splitting the ticket into sub-issues.

### When you finish

Comment on the ticket with the PR link, a two or three line summary, and anything the reviewer should check first.

### Project commands

- Install: `<install command>`
- Dev server: `<dev command>`
- Lint: `<lint command>`
- Typecheck: `<typecheck command>`
- Test: `<test command>`
