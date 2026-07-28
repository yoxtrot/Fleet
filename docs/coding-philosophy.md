# Coding Philosophy

Fleet code should be readable by humans without leaning on comments.

## Naming over comments

Prefer clear names for variables, functions, types, and components so intent is obvious from the code itself.

- Good: `getOverdueMaintenanceForVehicle`
- Avoid: `gom` plus a comment explaining what it does

Use garage-domain language consistently:

- `Vehicle`
- `MaintenanceRecord`
- `FixResearchNote`

## When comments are allowed

Comments are for non-obvious **why** — constraints, tradeoffs, or workarounds that the code cannot express.

Do not write comments that restate what the next line does. If a block needs a comment to be understood, rename or extract a function instead.

## Structure

- Keep functions and components small and single-purpose.
- Match existing project patterns; avoid drive-by refactors of unrelated code.
- Prefer meaningful types over vague names like `data`, `info`, or `handler` when a domain name fits.
