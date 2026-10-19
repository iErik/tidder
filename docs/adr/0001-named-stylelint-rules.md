# Named Stylelint rules instead of the standard SCSS preset

Tidder lints SCSS with a short list of named Stylelint rules, each an error, and does not extend stylelint-config-standard-scss. The preset flags patterns this codebase treats as legal (`:global`, `!global`, `@if`, `lighten` / `darken`, and the color helpers in `_mixins.scss`). Disabling those hits would invent a style guide. The named list matches the conventions already in CLAUDE.md and leaves those patterns unflagged.

## Considered options

- Extend stylelint-config-standard-scss and disable whatever the current SCSS fails. Rejected: the disables would become the style guide.
- Extend that preset and change the SCSS until it complies. Rejected: that is the restyle TDR-14 puts out of scope.
