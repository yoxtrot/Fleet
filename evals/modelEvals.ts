// Graded evals against a live model. Skipped unless ANTHROPIC_API_KEY is set, so the
// deterministic suite stays runnable in CI and on a laptop with no credentials.
//
// The graders are deliberately blunt. Scoring free text exactly is not the goal; catching
// the failures that matter is — an answer that ignores the vehicle's history, or one that
// mentions a vehicle the model was never shown.

import {
  buildConversationMessages,
  buildSystemBlocks,
} from '../supabase/functions/_shared/mechanicPrompt.ts'
import {
  renderVehicleContext,
  type VehicleContextSources,
} from '../supabase/functions/_shared/vehicleContext.ts'
import type { EvalResult } from './evalCases.ts'
import { OTHER_VEHICLE_MARKERS, runnerSources } from './fixtures.ts'

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

type GoldenCase = {
  name: string
  sources: VehicleContextSources
  question: string
  mustMentionAny: string[]
  mustNotMention: string[]
}

const goldenCases: GoldenCase[] = [
  {
    name: 'model/brake-pulsation-grounded',
    sources: runnerSources,
    question: 'The pedal pulses when I slow down from highway speed. What should I check?',
    mustMentionAny: ['rotor', 'pad', 'warp', 'runout'],
    mustNotMention: OTHER_VEHICLE_MARKERS,
  },
  {
    name: 'model/admits-missing-information',
    sources: runnerSources,
    question: 'What brand of transmission fluid did I last use?',
    mustMentionAny: ["don't", 'not', 'no record', 'unknown'],
    mustNotMention: OTHER_VEHICLE_MARKERS,
  },
]

export function hasModelCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

async function askModel(sources: VehicleContextSources, question: string) {
  const context = renderVehicleContext(sources, question)
  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-4-5',
      max_tokens: 700,
      system: buildSystemBlocks(context.text),
      messages: buildConversationMessages([{ role: 'user', content: question }]),
    }),
  })

  if (!response.ok) throw new Error(`Model request failed with ${response.status}`)

  const payload = await response.json()
  return (payload.content ?? [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('\n')
}

export async function runModelEvals(): Promise<EvalResult[]> {
  const results: EvalResult[] = []

  for (const goldenCase of goldenCases) {
    try {
      const answer = (await askModel(goldenCase.sources, goldenCase.question)).toLowerCase()
      const mentioned = goldenCase.mustMentionAny.some((phrase) => answer.includes(phrase.toLowerCase()))
      const leaked = goldenCase.mustNotMention.filter((phrase) =>
        answer.includes(phrase.toLowerCase()),
      )

      results.push({
        name: goldenCase.name,
        passed: mentioned && leaked.length === 0,
        detail: leaked.length > 0 ? `leaked: ${leaked.join(', ')}` : `expected phrase found: ${mentioned}`,
      })
    } catch (error) {
      results.push({
        name: goldenCase.name,
        passed: false,
        detail: error instanceof Error ? error.message : 'model call failed',
      })
    }
  }

  return results
}
