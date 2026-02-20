# Monorepo boundaries

- `packages/ui` is presentational only.
- No API calls from `packages/ui`.
- Data fetching belongs in `apps/*/src/data` or `apps/*/src/hooks`.
