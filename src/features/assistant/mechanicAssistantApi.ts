import { supabase } from '../../lib/supabase'
import {
  MECHANIC_ASSISTANT_FUNCTION_NAME,
  type MechanicAssistantErrorBody,
  type MechanicAssistantErrorCode,
  type MechanicAssistantMessage,
  type MechanicAssistantReply,
} from '../../lib/aiContracts'
import type { AiModelCall } from '../../lib/database.types'

export class MechanicAssistantError extends Error {
  readonly code: MechanicAssistantErrorCode

  constructor(code: MechanicAssistantErrorCode, message: string) {
    super(message)
    this.name = 'MechanicAssistantError'
    this.code = code
  }
}

async function readErrorBody(error: unknown): Promise<MechanicAssistantErrorBody> {
  const response = (error as { context?: Response }).context
  if (response && typeof response.json === 'function') {
    try {
      const body = (await response.json()) as Partial<MechanicAssistantErrorBody>
      if (body?.code && body?.message) return { code: body.code, message: body.message }
    } catch {
      // Fall through to the generic message below.
    }
  }
  return { code: 'model_error', message: 'The assistant is unavailable right now.' }
}

export async function askMechanicAssistant(request: {
  vehicleId: string
  conversationId: string
  messages: MechanicAssistantMessage[]
}): Promise<MechanicAssistantReply> {
  // The Edge Function is the authority on this, but checking here avoids spending a
  // network round trip — and an anon-key request would reach the gateway looking valid.
  const { data: sessionResult } = await supabase.auth.getSession()
  if (!sessionResult.session) {
    throw new MechanicAssistantError('unauthenticated', 'Sign in to use the mechanic assistant.')
  }

  const { data, error } = await supabase.functions.invoke<MechanicAssistantReply>(
    MECHANIC_ASSISTANT_FUNCTION_NAME,
    { body: request },
  )

  if (error) {
    const body = await readErrorBody(error)
    throw new MechanicAssistantError(body.code, body.message)
  }
  if (!data) {
    throw new MechanicAssistantError('model_error', 'The assistant returned an empty response.')
  }
  return data
}

export type AssistantUsageToday = {
  callsUsed: number
  spendMicroUsd: number
}

export async function readAssistantUsageToday(userId: string): Promise<AssistantUsageToday> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('ai_model_calls')
    .select('cost_micro_usd')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())

  if (error) throw error

  const rows = (data ?? []) as Pick<AiModelCall, 'cost_micro_usd'>[]
  return {
    callsUsed: rows.length,
    spendMicroUsd: rows.reduce((total, row) => total + (row.cost_micro_usd ?? 0), 0),
  }
}
