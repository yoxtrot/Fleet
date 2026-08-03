-- AI observability: one row per model call, plus the prompt/response payload behind it.
--
-- Rows are written only by Edge Functions using the service role, so users cannot
-- fabricate or edit their own spend history. Users get select-only access to their rows.

create table if not exists public.ai_model_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trace_id uuid not null,
  feature text not null,
  model text not null,
  prompt_version text not null,
  status text not null check (status in ('succeeded', 'failed')),
  finish_reason text,
  error_message text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  -- Null means "this model was missing from the pricing table". Recording zero would
  -- silently understate spend, which is worse than an obvious gap.
  cost_micro_usd bigint,
  pricing_version text not null,
  latency_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_model_calls_user_id_idx on public.ai_model_calls (user_id);
create index if not exists ai_model_calls_trace_id_idx on public.ai_model_calls (trace_id);
create index if not exists ai_model_calls_created_at_idx on public.ai_model_calls (created_at desc);

alter table public.ai_model_calls enable row level security;

drop policy if exists "Users can select own ai model calls" on public.ai_model_calls;

create policy "Users can select own ai model calls"
  on public.ai_model_calls for select
  using (auth.uid() = user_id);

-- Payloads live in their own table so that spend queries never have to scan large text,
-- and so retention can be trimmed independently of the metrics history.
create table if not exists public.ai_prompt_logs (
  id uuid primary key default gen_random_uuid(),
  model_call_id uuid not null references public.ai_model_calls (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  system_prompt text not null,
  rendered_context text not null,
  user_message text not null,
  response_text text,
  created_at timestamptz not null default now()
);

create index if not exists ai_prompt_logs_model_call_id_idx on public.ai_prompt_logs (model_call_id);
create index if not exists ai_prompt_logs_user_id_idx on public.ai_prompt_logs (user_id);

alter table public.ai_prompt_logs enable row level security;

drop policy if exists "Users can select own ai prompt logs" on public.ai_prompt_logs;

create policy "Users can select own ai prompt logs"
  on public.ai_prompt_logs for select
  using (auth.uid() = user_id);
