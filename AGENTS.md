# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds all frontend code: `components/` for reusable UI, `pages/` for routed views, `contexts/` and `hooks/` for shared state, `lib/` for integrations (Supabase, Plaid, charts), and `types/` for shared TypeScript shapes. Entry lives in `main.tsx` and global styles in `index.css`.
- `public/` serves static assets; `dist/` is build output (ignored from linting).
- Supabase assets sit in `supabase/functions/` (Edge Functions) and `supabase/migrations/` (SQL). Deployment settings are in `netlify.toml`, styling tokens in `tailwind.config.js`.

## Setup & Environment
- Use Node 18+ with npm. Install dependencies via `npm install`.
- Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. All frontend env vars must stay `VITE_*`.
- Run locally with `npm run dev` (defaults to http://localhost:5173).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Production bundle for `dist/`.
- `npm run preview`: Serve the production bundle locally.
- `npm run lint`: ESLint across the repo; fix warnings before pushing.

## Coding Style & Naming Conventions
- TypeScript + React 18 functional components. Use hooks for side effects and follow React Hooks linting (enabled).
- Prefer PascalCase for components (`Dashboard.tsx`), camelCase for functions/variables, and kebab-case routes/paths.
- TailwindCSS drives styling; keep class lists readable and favor utility extraction into small components over long class chains when possible.
- Keep imports relative within `src/` and colocate component-specific types next to their usage or in `types/` if shared.

## Testing Guidelines
- No automated tests are present; rely on linting and manual QA. When adding tests, align file names with the subject component (e.g., `Dashboard.test.tsx`) and place them near the source.
- Validate flows: auth (login/signup/reset), dashboard summaries, uploads (transactions/categories/budgets), and Plaid linking. Capture regressions in PR notes.

## Commit & Pull Request Guidelines
- Follow existing history: concise, imperative-style summaries (e.g., “Fix timezone bug causing incorrect budgets”). Group related changes in one commit.
- PRs should include: short description of scope, screenshots/GIFs for UI changes, notes on env vars or migrations, and links to issues/tasks. Mention impacted routes (e.g., `/dashboard`, `/transactions`) and any manual QA performed.

## Security & Configuration Tips
- Never commit `.env` or Supabase keys. Keep secrets in local `.env` and provider dashboards (Netlify/Vercel).
- Run pending SQL in `supabase/migrations/` before testing auth/queries. Keep Plaid keys in provider settings; mock/link test accounts in development.
