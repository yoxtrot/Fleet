// Per-user daily caps, enforced from the same spend log the dashboard reads.
//
// This is the payoff for logging cost: the budget is derived from recorded usage rather
// than a separate counter that can drift away from what was actually billed.

import {
  ASSISTANT_DAILY_CALL_LIMIT,
  ASSISTANT_DAILY_SPEND_LIMIT_MICRO_USD,
} from '../../../src/lib/aiContracts.ts'

type SpendRow = { cost_micro_usd: number | null }

type QuotaClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        gte: (
          column: string,
          value: string,
        ) => PromiseLike<{ data: SpendRow[] | null; error: { message: string } | null }>
      }
    }
  }
}

export type DailyUsage = {
  callsUsed: number
  spendMicroUsd: number
}

export function startOfUtcDay(now = new Date()) {
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

export async function readDailyUsage(client: QuotaClient, userId: string): Promise<DailyUsage> {
  const { data, error } = await client
    .from('ai_model_calls')
    .select('cost_micro_usd')
    .eq('user_id', userId)
    .gte('created_at', startOfUtcDay().toISOString())

  if (error) throw new Error(error.message)

  const rows = data ?? []
  return {
    callsUsed: rows.length,
    spendMicroUsd: rows.reduce((total, row) => total + (row.cost_micro_usd ?? 0), 0),
  }
}

export function callLimitReached(usage: DailyUsage) {
  return usage.callsUsed >= ASSISTANT_DAILY_CALL_LIMIT
}

export function spendLimitReached(usage: DailyUsage) {
  return usage.spendMicroUsd >= ASSISTANT_DAILY_SPEND_LIMIT_MICRO_USD
}
