// Token pricing and cost computation.
//
// Rates are per million tokens in USD and must be re-checked against the provider's
// pricing page whenever a model is added. Bump MODEL_PRICING_VERSION when any rate
// changes so historical rows stay attributable to the rates they were priced with.

export const MODEL_PRICING_VERSION = '2026-08-03'

export type ModelRates = {
  inputPerMillion: number
  outputPerMillion: number
  cacheReadPerMillion: number
  cacheWritePerMillion: number
}

export const MODEL_PRICING_PER_MILLION_TOKENS: Record<string, ModelRates> = {
  'claude-sonnet-4-5': {
    inputPerMillion: 3,
    outputPerMillion: 15,
    cacheReadPerMillion: 0.3,
    cacheWritePerMillion: 3.75,
  },
  'claude-haiku-4-5': {
    inputPerMillion: 1,
    outputPerMillion: 5,
    cacheReadPerMillion: 0.1,
    cacheWritePerMillion: 1.25,
  },
}

export type TokenCounts = {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

function ratesForModel(model: string) {
  const exactMatch = MODEL_PRICING_PER_MILLION_TOKENS[model]
  if (exactMatch) return exactMatch

  // Providers append dated suffixes such as "-20260401" to pinned model ids.
  const family = Object.keys(MODEL_PRICING_PER_MILLION_TOKENS).find((key) => model.startsWith(key))
  return family ? MODEL_PRICING_PER_MILLION_TOKENS[family] : null
}

/**
 * Returns cost in micro-USD, or null when the model has no known rates.
 *
 * Money is kept as an integer count of millionths of a dollar because a single call
 * can cost far less than a cent, and floating point sums drift once you aggregate.
 */
export function costMicroUsdFor(model: string, tokens: TokenCounts): number | null {
  const rates = ratesForModel(model)
  if (!rates) return null

  const dollars =
    (tokens.inputTokens * rates.inputPerMillion +
      tokens.outputTokens * rates.outputPerMillion +
      tokens.cacheReadTokens * rates.cacheReadPerMillion +
      tokens.cacheWriteTokens * rates.cacheWritePerMillion) /
    1_000_000

  return Math.round(dollars * 1_000_000)
}

type AnthropicUsage = {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

/**
 * Anthropic reports cache reads and cache writes as separate counters that are already
 * excluded from `input_tokens`, so the four values sum to the billable total. Providers
 * that nest cached tokens inside the prompt total need them subtracted here instead —
 * getting this backwards silently doubles reported spend on cache-heavy traffic.
 */
export function readAnthropicTokenCounts(usage: AnthropicUsage | undefined): TokenCounts {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    cacheWriteTokens: usage?.cache_creation_input_tokens ?? 0,
  }
}
