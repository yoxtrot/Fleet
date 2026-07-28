# Linear setup for Fleet

Use Linear as the project board for Fleet sprints (cycles). Cursor talks to Linear through MCP so you can say things like “help me plan a sprint” or “add a task to the current sprint”.

## 1. Create / open Linear

1. Go to [https://linear.app](https://linear.app) and sign in (GitHub is fine).
2. Create a workspace if you do not have one yet (personal workspace is enough).

## 2. Create the Fleet project board

In Linear:

1. Create a **Team** if prompted (name example: `Fleet` or your personal default team).
2. Create a **Project** named **Fleet** with description: `Personal garage management app`.
3. Use a simple board workflow, for example:
   - Todo
   - In Progress
   - Done
4. Enable **Cycles** for the team (Settings → Team → Cycles):
   - Cycle length: **1 week** or **2 weeks** (pick one and stick to it)
   - Auto-add upcoming cycle if available
5. Start/create the first cycle, named like `Sprint 1` or `Sprint 2026-07-28`.

Optional starter issues (create later via the agent or manually):

- Improve empty states on vehicles and research lists
- Add maintenance cost summary on vehicle detail
- Harden auth (disable public signups after first account)
- Document MUI theme tokens for future UI work

## 3. Connect Linear MCP in Cursor

This repo already includes [`.cursor/mcp.json`](../.cursor/mcp.json) pointing at Linear’s hosted MCP.

1. Open **Cursor Settings → MCP**
2. Confirm **Linear** appears
3. Enable it and complete the **OAuth** browser login when prompted
4. If it fails, try Linear’s one-click install: [Install Linear MCP in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=Linear&config=eyJ1cmwiOiJodHRwczovL21jcC5saW5lYXIuYXBwL21jcCJ9)
5. Reload the window if tools do not show up

You can also add Linear from Cursor’s MCP directory / marketplace if the project config does not pick up automatically.

## 4. Verify

In chat, ask:

> Using Linear, list my teams and projects

Then:

> Help me plan a sprint for Fleet

That should load the `fleet-sprint` skill and use Linear tools.

## Skill

Project skill: `.cursor/skills/fleet-sprint/SKILL.md`

Trigger phrases:

- help me plan a sprint
- plan a sprint
- add a task to the current sprint
- what's in the current sprint
