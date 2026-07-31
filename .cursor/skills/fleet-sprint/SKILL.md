---
name: fleet-sprint
description: >-
  Plans Fleet sprints and manages Linear cycle work for the Fleet garage app.
  Use when the user says "help me plan a sprint", "plan a sprint", "add a task
  to the current sprint", "add to the sprint", "what's in the current sprint",
  or asks to create/prioritize Linear issues for the active cycle.
---

# Fleet sprint

Manage Fleet work in Linear: cycles (sprints), issues, and priorities.

## Prerequisites

1. Linear MCP must be connected and authenticated (see `docs/linear-setup.md`).
2. Prefer the Fleet team / project named in that doc once created.
3. If Linear tools are unavailable, stop and tell the user to finish Linear MCP auth before continuing.

## Phrases that should trigger this skill

Treat these (and close variants) as explicit requests to use this workflow:

- "help me plan a sprint"
- "plan a sprint"
- "add a task to the current sprint"
- "add to the current sprint"
- "what's in the current sprint"

## Workspace conventions

- **Product**: Fleet personal garage app (vehicles, maintenance, research, auth/Supabase, MUI UI)
- **Issue titles**: short, actionable (`Add maintenance date filter`, not `Stuff`)
- **Descriptions**: problem, goal, and acceptance checks when useful
- **Labels / tags** (create if missing): `frontend`, `backend`, `auth`, `docs`, `chore`, `bug`
- **Priority**: only set when the user is clear; otherwise leave default
- **Estimate**: optional; ask once if planning a full sprint and estimates would help

## Find the current sprint

1. Use Linear MCP to list teams/projects and find Fleet.
2. Find the **active cycle** (current sprint) for the Fleet team.
3. If there is no active cycle, say so and offer to create/start one with a name like `Sprint YYYY-MM-DD` and a 1–2 week window.

## Workflow: plan a sprint

When the user asks to plan a sprint:

1. Read current Fleet context (open Linear issues, active cycle, recent repo priorities if helpful).
2. Propose a short sprint plan before writing anything:
   - Sprint goal (one sentence)
   - Candidate issues (title + why)
   - Suggested order / priority
   - What is explicitly out of scope
3. Wait for user approval (or clear edits).
4. Create/update Linear issues and add them to the **current cycle**.
5. Summarize what was added with Linear issue IDs/links.

Do not invent large backlogs. Prefer 3–8 concrete issues for a personal sprint.

Good default themes for Fleet if the user is open-ended:

- Polish auth/onboarding docs and empty states
- Vehicle / maintenance UX improvements
- Fix research search/filter improvements
- Supabase hardening (signup lock, email confirm, RLS checks)
- Agent/docs/skills improvements

## Workflow: add a task to the current sprint

When the user asks to add a task to the current sprint:

1. Resolve the active cycle.
2. Clarify the task in one sentence if ambiguous; otherwise draft from their words.
3. Create the Linear issue on the Fleet team/project.
4. Add it to the current cycle.
5. Confirm with title, ID/link, and cycle name.

If they give a rough idea ("reminders for oil changes"), turn it into a concrete issue title + short description before creating.

## Workflow: report current sprint

When asked what is in the current sprint:

1. Fetch active-cycle issues.
2. Group by status (Todo / In Progress / Done if available).
3. Keep the summary short and actionable.

## Safety

- Never create dozens of speculative issues without approval.
- Never delete Linear work unless the user explicitly asks.
- Prefer updating an existing similar issue over duplicating it.
