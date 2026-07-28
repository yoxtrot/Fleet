# Fleet

Personal garage management: vehicles, maintenance history, and fix research notes.

## Stack

- React + Vite + TypeScript
- Supabase Auth + Postgres + Row Level Security

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Set up Supabase (one-time). Follow **[docs/supabase-setup.md](docs/supabase-setup.md)** step by step, then create `.env.local` from `.env.example`.

3. Run the app:

```bash
npm run dev
```

Open `http://localhost:5173`.

4. Run Storybook (component gallery):

```bash
npm run storybook
```

Open `http://localhost:6006`.

## Coding philosophy

Readable names over comments. See [docs/coding-philosophy.md](docs/coding-philosophy.md).

## Agent guidance

See [AGENTS.md](AGENTS.md) for project skills, rules, and how to practice subagent workflows in this repo.
