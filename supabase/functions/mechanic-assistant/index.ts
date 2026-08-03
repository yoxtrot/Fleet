import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  MAX_ASSISTANT_QUESTION_LENGTH,
  MAX_CONVERSATION_TURNS_SENT,
  type MechanicAssistantErrorCode,
  type MechanicAssistantMessage,
  type MechanicAssistantReply,
} from '../../../src/lib/aiContracts.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { latestUserQuestion, trimConversation } from '../_shared/conversationWindow.ts'
import {
  buildConversationMessages,
  buildSystemBlocks,
  MECHANIC_PROMPT_VERSION,
  MECHANIC_SYSTEM_PROMPT,
} from '../_shared/mechanicPrompt.ts'
import { costMicroUsdFor, MODEL_PRICING_VERSION } from '../_shared/modelPricing.ts'
import { renderVehicleContext } from '../_shared/vehicleContext.ts'
import { completeMechanicAnswer, configuredModel, hasModelCredentials } from './anthropicClient.ts'
import { callLimitReached, readDailyUsage, spendLimitReached } from './assistantQuota.ts'
import { loadVehicleContextSources } from './loadVehicleContext.ts'
import { readConversationCostMicroUsd, recordModelCall } from './modelCallRecorder.ts'

const FEATURE_NAME = 'mechanic-assistant'

function failure(code: MechanicAssistantErrorCode, message: string, status: number) {
  return jsonResponse({ code, message }, status)
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function readMessages(value: unknown): MechanicAssistantMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null

  const messages: MechanicAssistantMessage[] = []
  for (const entry of value) {
    const role = (entry as { role?: unknown }).role
    const content = (entry as { content?: unknown }).content
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof content !== 'string' || content.trim().length === 0) return null
    if (content.length > MAX_ASSISTANT_QUESTION_LENGTH) return null
    messages.push({ role, content })
  }
  return messages
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return failure('invalid_request', 'Use POST.', 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authorization = request.headers.get('Authorization') ?? ''

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return failure('assistant_unavailable', 'The assistant is not configured.', 503)
  }

  // The caller's token is forwarded so that every read below runs as that user and RLS
  // applies. Note that the anon key is itself a valid JWT and will satisfy the gateway,
  // so the token must be resolved to a real user before anything else happens.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })

  const { data: userResult } = await userClient.auth.getUser()
  const user = userResult?.user
  if (!user || user.role !== 'authenticated') {
    return failure('unauthenticated', 'Sign in to use the mechanic assistant.', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return failure('invalid_request', 'Expected a JSON body.', 400)
  }

  const { vehicleId, conversationId, messages: rawMessages } = (body ?? {}) as Record<string, unknown>
  if (!isUuid(vehicleId)) return failure('invalid_request', 'A vehicle id is required.', 400)
  if (!isUuid(conversationId)) return failure('invalid_request', 'A conversation id is required.', 400)

  const messages = readMessages(rawMessages)
  if (!messages) return failure('invalid_request', 'The conversation is malformed or too long.', 400)

  if (!hasModelCredentials()) {
    return failure('assistant_unavailable', 'The assistant is not configured.', 503)
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  const usageBeforeCall = await readDailyUsage(serviceClient, user.id)
  if (callLimitReached(usageBeforeCall)) {
    return failure('daily_call_limit_reached', 'Daily question limit reached. Try again tomorrow.', 429)
  }
  if (spendLimitReached(usageBeforeCall)) {
    return failure('daily_spend_limit_reached', 'Daily spend limit reached. Try again tomorrow.', 429)
  }

  const sources = await loadVehicleContextSources(userClient, vehicleId)
  if (!sources) return failure('vehicle_not_found', 'That vehicle is not in your garage.', 404)

  const trimmedMessages = trimConversation(messages, MAX_CONVERSATION_TURNS_SENT)
  const question = latestUserQuestion(trimmedMessages)
  const context = renderVehicleContext(sources, question)
  const systemBlocks = buildSystemBlocks(context.text)

  const model = configuredModel()
  const startedAt = Date.now()

  try {
    const completion = await completeMechanicAnswer(
      systemBlocks,
      buildConversationMessages(trimmedMessages),
    )
    const costMicroUsd = costMicroUsdFor(model, completion.tokens)

    await recordModelCall(
      serviceClient,
      {
        userId: user.id,
        traceId: conversationId,
        feature: FEATURE_NAME,
        model,
        promptVersion: MECHANIC_PROMPT_VERSION,
        pricingVersion: MODEL_PRICING_VERSION,
        status: 'succeeded',
        finishReason: completion.finishReason,
        errorMessage: null,
        tokens: completion.tokens,
        costMicroUsd,
        latencyMs: Date.now() - startedAt,
      },
      {
        systemPrompt: MECHANIC_SYSTEM_PROMPT,
        renderedContext: context.text,
        userMessage: question,
        responseText: completion.text,
      },
    )

    const reply: MechanicAssistantReply = {
      reply: completion.text,
      usage: { ...completion.tokens, costMicroUsd },
      conversationCostMicroUsd: await readConversationCostMicroUsd(serviceClient, conversationId),
      dailyCallsUsed: usageBeforeCall.callsUsed + 1,
      dailySpendMicroUsd: usageBeforeCall.spendMicroUsd + (costMicroUsd ?? 0),
    }
    return jsonResponse(reply)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown model error'

    await recordModelCall(
      serviceClient,
      {
        userId: user.id,
        traceId: conversationId,
        feature: FEATURE_NAME,
        model,
        promptVersion: MECHANIC_PROMPT_VERSION,
        pricingVersion: MODEL_PRICING_VERSION,
        status: 'failed',
        finishReason: null,
        errorMessage: errorMessage.slice(0, 500),
        tokens: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
        costMicroUsd: 0,
        latencyMs: Date.now() - startedAt,
      },
      {
        systemPrompt: MECHANIC_SYSTEM_PROMPT,
        renderedContext: context.text,
        userMessage: question,
        responseText: null,
      },
    ).catch(() => undefined)

    return failure('model_error', 'The assistant could not answer that. Try again.', 502)
  }
})
