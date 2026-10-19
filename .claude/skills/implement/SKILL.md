---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.

Keep each PR within the size limit in `docs/agents/issue-tracker.md` ("PR size"). Measure the diff with the command there before opening a PR. When the work is bigger, split it into PRs that each build and pass their tests on their own, create a sub-issue for each one (see "Sub-issues" there), and announce each one on the ticket.
