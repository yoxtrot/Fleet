// Wire contract between the browser and the mechanic-assistant Edge Function.
//
// This module must stay import-free: Vite compiles it as part of `src`, and the Deno
// Edge Function imports the same file directly so both sides cannot drift.

export const MECHANIC_ASSISTANT_FUNCTION_NAME = 'mechanic-assistant'

export const ASSISTANT_DAILY_CALL_LIMIT = 50
export const ASSISTANT_DAILY_SPEND_LIMIT_MICRO_USD = 500_000

export const MAX_ASSISTANT_QUESTION_LENGTH = 2_000
export const MAX_CONVERSATION_TURNS_SENT = 12

export type MechanicAssistantRole = 'user' | 'assistant'

export type MechanicAssistantMessage = {
  role: MechanicAssistantRole
  content: string
}

export type MechanicAssistantRequest = {
  vehicleId: string
  conversationId: string
  messages: MechanicAssistantMessage[]
}

export type ModelCallUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  /** Null when the model is missing from the pricing table, so gaps stay visible. */
  costMicroUsd: number | null
}

export type MechanicAssistantReply = {
  reply: string
  usage: ModelCallUsage
  conversationCostMicroUsd: number
  dailyCallsUsed: number
  dailySpendMicroUsd: number
}

export type MechanicAssistantErrorCode =
  | 'unauthenticated'
  | 'invalid_request'
  | 'vehicle_not_found'
  | 'daily_call_limit_reached'
  | 'daily_spend_limit_reached'
  | 'assistant_unavailable'
  | 'model_error'

export type MechanicAssistantErrorBody = {
  code: MechanicAssistantErrorCode
  message: string
}

export function formatMicroUsd(microUsd: number | null) {
  if (microUsd === null) return 'unpriced'
  if (microUsd === 0) return '$0.00'
  if (microUsd < 10_000) return `$${(microUsd / 1_000_000).toFixed(4)}`
  return `$${(microUsd / 1_000_000).toFixed(2)}`
}
