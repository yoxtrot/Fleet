import type { AnthropicMessage, AnthropicTextBlock } from '../_shared/mechanicPrompt.ts'
import { readAnthropicTokenCounts, type TokenCounts } from '../_shared/modelPricing.ts'

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// Haiku is the default because this assistant answers short, well-grounded questions and
// the cost ceiling matters more than the last increment of reasoning quality.
const DEFAULT_MODEL = 'claude-haiku-4-5'
const MAX_OUTPUT_TOKENS = 700

export type ModelCompletion = {
  text: string
  tokens: TokenCounts
  finishReason: string | null
}

export function configuredModel() {
  return Deno.env.get('ANTHROPIC_MODEL')?.trim() || DEFAULT_MODEL
}

export function hasModelCredentials() {
  return Boolean(Deno.env.get('ANTHROPIC_API_KEY')?.trim())
}

export async function completeMechanicAnswer(
  systemBlocks: AnthropicTextBlock[],
  messages: AnthropicMessage[],
): Promise<ModelCompletion> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')?.trim()
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: configuredModel(),
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemBlocks,
      messages,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Model request failed with ${response.status}: ${detail.slice(0, 500)}`)
  }

  const payload = await response.json()
  const text = (payload.content ?? [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('\n')
    .trim()

  return {
    text,
    tokens: readAnthropicTokenCounts(payload.usage),
    finishReason: payload.stop_reason ?? null,
  }
}
