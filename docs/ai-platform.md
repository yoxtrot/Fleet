# AI platform: the mechanic assistant

Fleet has one AI feature: an assistant scoped to the vehicle you are currently viewing.
It exists as much to exercise AI platform practice — context engineering, observability,
evals, and cost control — as to answer questions about a truck.

This document explains what was built, why each piece is there, and what was deliberately
left out.

## Architecture, and why there is a server now

Fleet was a browser-only SPA. It cannot stay that way once a model is involved: a provider
API key shipped to the browser is a key you have given away. So the model call lives in a
Supabase Edge Function, which is the only place in this stack that can hold a secret.

```
Browser (anon key, user JWT)
  └── supabase.functions.invoke('mechanic-assistant')
        └── Edge Function (Deno)
              ├── user-scoped Supabase client  → reads vehicle data under RLS
              ├── Anthropic Messages API       → the model call
              └── service-role client          → writes the spend log
```

Two different Supabase clients inside the function is the important detail. Reads use the
caller's JWT so row level security decides what is visible. Writes to the observability
tables use the service role, so users cannot forge or edit their own spend history.

| File | Role |
| --- | --- |
| `supabase/functions/mechanic-assistant/index.ts` | Request handling, auth, quota checks, orchestration |
| `supabase/functions/mechanic-assistant/loadVehicleContext.ts` | Scoped reads for one vehicle |
| `supabase/functions/_shared/vehicleContext.ts` | Context assembly, budgeting, relevance ranking |
| `supabase/functions/_shared/mechanicPrompt.ts` | System prompt, cacheable block ordering |
| `supabase/functions/_shared/conversationWindow.ts` | History trimming |
| `supabase/functions/_shared/modelPricing.ts` | Rates and cost computation |
| `supabase/functions/mechanic-assistant/modelCallRecorder.ts` | Writes `ai_model_calls` and `ai_prompt_logs` |
| `supabase/functions/mechanic-assistant/assistantQuota.ts` | Daily caps read back off the log |
| `src/features/assistant/` | Dock UI, vehicle scope detection, client helper |
| `evals/` | Deterministic and graded evals with a regression baseline |

## Access control

The assistant is restricted to signed-in users, enforced in three places.

The dock renders nothing for demo or signed-out visitors. The client helper checks for a
session before spending a network round trip. Neither of those is security — both run in
the browser — so the Edge Function repeats the check authoritatively.

The subtle part is that `verify_jwt = true` on the function is **not sufficient on its
own**. Supabase's anon key is itself a valid JWT, so a request carrying only the anon key
passes the gateway. The function therefore resolves the token to a real user and requires
`role === 'authenticated'`:

```ts
const { data: userResult } = await userClient.auth.getUser()
const user = userResult?.user
if (!user || user.role !== 'authenticated') {
  return failure('unauthenticated', 'Sign in to use the mechanic assistant.', 401)
}
```

Demo mode is exactly the case this catches: it fabricates a user object client-side but has
no session, so its requests carry the anon key and are rejected.

## Context engineering

The model is stateless. Everything it knows about your garage is rebuilt on every call, and
the context window is a budget being allocated rather than a bucket being filled.

**Scoping is enforced by the database, not the prompt.** Asking a model to ignore other
vehicles is a request, not a guarantee. Instead every query filters by vehicle id and runs
under the user's own JWT, so RLS independently confirms ownership. Data about another
vehicle never enters the window in the first place.

**Every collection is bounded.** Twelve maintenance records, six projects, six research
notes, 400 characters per free-text field, 160 per title, and a 12,000 character cap on the
whole thing as a backstop. The per-field limits are what should do the work; the global cap
only exists so a pathological row cannot blow the budget.

**Retrieval is lexical, not vector.** `selectRelevantResearchNotes` scores notes by keyword
overlap with the question and keeps the best few. For a garage-sized corpus that is enough,
and it avoids standing up an embedding pipeline for a few dozen rows. Swapping in pgvector
would only change that one function — which is the point of isolating it.

**Block order is chosen for cache hits.** Prompt caching keys on a shared prefix, so the
stable content goes first and the volatile content last:

1. System instructions (stable across every call, marked cacheable)
2. Vehicle context (stable across a conversation, marked cacheable)
3. Conversation turns (changes every message)

Every follow-up question in a conversation therefore re-reads the instructions and vehicle
history from cache at roughly a tenth of the input price instead of paying full rate.

**Conversation history is trimmed.** Each turn re-sends the whole history, so an untrimmed
chat grows quadratically in cost. `trimConversation` keeps the most recent twelve turns and
guarantees the window still starts with a user message, since slicing mid-exchange can
otherwise strand an assistant reply at the front and the provider rejects it.

## Observability

`ai_model_calls` holds one narrow row per call: token counts split four ways, computed cost,
latency, model, prompt version, pricing version, finish reason, and status. `ai_prompt_logs`
holds the payloads — system prompt, rendered context, user message, response — in a separate
table so that spend queries never scan large text and retention can be trimmed independently.

Failed calls are recorded too. A model outage that leaves no trace is indistinguishable from
nobody using the feature.

### The cost math

Tokens are not fungible. Output typically costs several times input, cache reads are around
a tenth of input, and cache writes cost *more* than input. So cost is a sum of separately
priced components, not `total_tokens × one_rate`:

```ts
const dollars =
  (tokens.inputTokens * rates.inputPerMillion +
    tokens.outputTokens * rates.outputPerMillion +
    tokens.cacheReadTokens * rates.cacheReadPerMillion +
    tokens.cacheWriteTokens * rates.cacheWritePerMillion) /
  1_000_000
```

Three decisions worth knowing, because each one is a trap:

**Whether cached tokens are already inside the input count is provider-specific.** Anthropic
reports cache reads and writes as separate counters *excluded* from `input_tokens`, so the
four values sum to the billable total. Providers that nest cached tokens inside the prompt
total need them subtracted instead. Getting this backwards silently doubles reported spend
on cache-heavy traffic, and nothing will alert you.

**Money is an integer count of micro-USD.** A single call costs a small fraction of a cent,
and floating point sums drift once you aggregate them.

**An unpriced model records `null`, never `0`.** If a model is missing from the pricing
table, recording zero would silently understate spend. A null is a visible gap.

Rates live in `modelPricing.ts` keyed by model family, with dated model ids resolving to
their family prefix. `MODEL_PRICING_VERSION` is stored on every row, so historical costs
stay attributable to the rates they were computed with.

### Quotas fall out of the log

Because spend is recorded with attribution, the daily caps are derived from it rather than
from a separate counter that could drift from reality:

```ts
const usage = await readDailyUsage(serviceClient, user.id)
if (callLimitReached(usage)) return failure('daily_call_limit_reached', …, 429)
if (spendLimitReached(usage)) return failure('daily_spend_limit_reached', …, 429)
```

Limits live in `src/lib/aiContracts.ts`: 50 questions and $0.50 per user per UTC day. The
dock shows the running total, so the limit is visible before you hit it.

## Evals

`npm run evals` runs the suite. There are two layers.

**Deterministic evals** need no API key and no network, which is what makes them useful in
CI. They cover the properties actually worth guarding: that context built for one vehicle
contains no trace of another (in both directions), that budgets hold under a 400-record
history and under a 50,000-character title, that relevance ranking surfaces the right note,
that conversation trimming produces a valid window, that the cacheable prefix is ordered
correctly, and that cost math handles cache discounts, dated model ids, and unpriced models.

**Graded model evals** run only when `ANTHROPIC_API_KEY` is set. They ask golden questions
and grade the free-text answer bluntly — did it mention a plausible cause, did it admit
missing information when the history does not contain the answer, and did it avoid
mentioning a vehicle it was never shown.

**The baseline is what makes this a regression check.** `evals/baseline.json` records which
cases passed. Any case that previously passed and now fails exits non-zero, so a prompt or
context change cannot quietly degrade behaviour that already worked. Accept new results with
`npm run evals -- --update-baseline`, and read that diff rather than rubber-stamping it.

Writing these paid for itself immediately: the oversized-title case failed on first run and
exposed that titles were never truncated.

## Setup

1. Apply the migration: `npm run db:push`
2. Set the model key as a function secret — never a `VITE_` variable:

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5   # optional, this is the default
```

3. Deploy the function: `npx supabase functions deploy mechanic-assistant`

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected into Edge
Functions automatically.

Verify the pricing table against current provider rates before trusting any cost number, and
reconcile the recorded total against the provider invoice. If they disagree by more than a
percent or two, the instrumentation has a hole — usually an uninstrumented path, uncounted
retries, or a stale rate.

## Deliberately not built

Being clear about the edges matters more than pretending they are covered.

- **Vector RAG.** Retrieval is keyword overlap. Correct at this corpus size, and pgvector
  would replace one function.
- **Conversation compaction.** History is trimmed, not summarised, so a long conversation
  forgets its early turns rather than carrying a summary forward.
- **Streaming.** Answers arrive whole. Streaming would require handling usage in the final
  chunk, which is easy to drop and would leave cost data silently empty.
- **OpenTelemetry export.** Rows land in Postgres only. Emitting GenAI semantic conventions
  would let standard tooling read them without a custom dashboard.
- **Retention and redaction.** `ai_prompt_logs` grows without bound and stores prompts in
  clear text. It is separated from the metrics table so retention *can* be added, but it has
  not been.
- **Cost regression gating in CI.** Evals gate quality, not spend. Failing a build when a
  prompt change raises cost per answer by 40% is the obvious next step.
