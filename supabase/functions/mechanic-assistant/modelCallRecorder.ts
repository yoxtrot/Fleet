// Writes the observability rows for one model call.
//
// This runs with the service role so users cannot forge or edit their own spend history;
// their RLS policies grant select only. Failed calls are recorded too, because a model
// outage that leaves no trace looks identical to nobody using the feature.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { TokenCounts } from '../_shared/modelPricing.ts'

export type ModelCallRecord = {
  userId: string
  traceId: string
  feature: string
  model: string
  promptVersion: string
  pricingVersion: string
  status: 'succeeded' | 'failed'
  finishReason: string | null
  errorMessage: string | null
  tokens: TokenCounts
  costMicroUsd: number | null
  latencyMs: number
}

export type PromptPayload = {
  systemPrompt: string
  renderedContext: string
  userMessage: string
  responseText: string | null
}

export async function recordModelCall(
  serviceClient: SupabaseClient,
  record: ModelCallRecord,
  payload: PromptPayload,
) {
  const { data, error } = await serviceClient
    .from('ai_model_calls')
    .insert({
      user_id: record.userId,
      trace_id: record.traceId,
      feature: record.feature,
      model: record.model,
      prompt_version: record.promptVersion,
      pricing_version: record.pricingVersion,
      status: record.status,
      finish_reason: record.finishReason,
      error_message: record.errorMessage,
      input_tokens: record.tokens.inputTokens,
      output_tokens: record.tokens.outputTokens,
      cache_read_tokens: record.tokens.cacheReadTokens,
      cache_write_tokens: record.tokens.cacheWriteTokens,
      cost_micro_usd: record.costMicroUsd,
      latency_ms: record.latencyMs,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to record model call: ${error.message}`)

  const { error: payloadError } = await serviceClient.from('ai_prompt_logs').insert({
    model_call_id: data.id,
    user_id: record.userId,
    system_prompt: payload.systemPrompt,
    rendered_context: payload.renderedContext,
    user_message: payload.userMessage,
    response_text: payload.responseText,
  })

  if (payloadError) throw new Error(`Failed to record prompt log: ${payloadError.message}`)

  return data.id as string
}

export async function readConversationCostMicroUsd(
  serviceClient: SupabaseClient,
  traceId: string,
) {
  const { data, error } = await serviceClient
    .from('ai_model_calls')
    .select('cost_micro_usd')
    .eq('trace_id', traceId)

  if (error) throw new Error(error.message)
  return (data ?? []).reduce(
    (total: number, row: { cost_micro_usd: number | null }) => total + (row.cost_micro_usd ?? 0),
    0,
  )
}
