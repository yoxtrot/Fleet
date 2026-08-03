// Deterministic evals for the assistant's context and cost layers.
//
// These need no API key and no network, which is the point: the properties worth
// guarding — that one vehicle's context never leaks another's data, that the context
// stays inside its budget, and that cost is computed correctly — are all decidable
// without asking a model anything.

import { trimConversation } from '../supabase/functions/_shared/conversationWindow.ts'
import {
  buildSystemBlocks,
  MECHANIC_SYSTEM_PROMPT,
} from '../supabase/functions/_shared/mechanicPrompt.ts'
import { costMicroUsdFor } from '../supabase/functions/_shared/modelPricing.ts'
import {
  MAX_CONTEXT_CHARACTERS,
  MAX_MAINTENANCE_RECORDS,
  renderVehicleContext,
} from '../supabase/functions/_shared/vehicleContext.ts'
import type { MechanicAssistantMessage } from '../src/lib/aiContracts.ts'
import {
  OTHER_VEHICLE_MARKERS,
  runnerSources,
  sourcesWithLongHistory,
  sourcesWithPathologicalTitle,
  trailBikeSources,
} from './fixtures.ts'

export type EvalResult = {
  name: string
  passed: boolean
  detail: string
}

type EvalCase = {
  name: string
  run: () => EvalResult
}

function result(name: string, passed: boolean, detail: string): EvalResult {
  return { name, passed, detail }
}

const scopeIsolation: EvalCase = {
  name: 'context/scope-isolation',
  run: () => {
    const context = renderVehicleContext(runnerSources, 'why does the brake pedal pulse?')
    const leaked = OTHER_VEHICLE_MARKERS.filter((marker) =>
      context.text.toLowerCase().includes(marker.toLowerCase()),
    )
    return result(
      'context/scope-isolation',
      leaked.length === 0,
      leaked.length === 0 ? 'no other-vehicle markers present' : `leaked: ${leaked.join(', ')}`,
    )
  },
}

const scopeIsolationReverse: EvalCase = {
  name: 'context/scope-isolation-reverse',
  run: () => {
    const context = renderVehicleContext(trailBikeSources, 'the dropper post sinks')
    const leaked = ['4Runner', 'Radiator replacement', 'Runner'].filter((marker) =>
      context.text.includes(marker),
    )
    return result(
      'context/scope-isolation-reverse',
      leaked.length === 0,
      leaked.length === 0 ? 'no car data in bike context' : `leaked: ${leaked.join(', ')}`,
    )
  },
}

const contextBudget: EvalCase = {
  name: 'context/stays-within-budget',
  run: () => {
    const context = renderVehicleContext(sourcesWithLongHistory(400), 'general check up')
    const withinCharacters = context.characterCount <= MAX_CONTEXT_CHARACTERS + 64
    const withinRecords = context.includedMaintenanceRecords === MAX_MAINTENANCE_RECORDS
    return result(
      'context/stays-within-budget',
      withinCharacters && withinRecords,
      `${context.characterCount} chars, ${context.includedMaintenanceRecords} records`,
    )
  },
}

const oversizedFieldBudget: EvalCase = {
  name: 'context/oversized-field-truncated',
  run: () => {
    const context = renderVehicleContext(sourcesWithPathologicalTitle(), 'general check up')
    // Per-field limits must do the work. Falling back to the whole-context cap would
    // still bound the budget, but it would silently drop the end of the history.
    const neededEmergencyCap = context.text.includes('[context truncated')
    const passed = !neededEmergencyCap && context.characterCount <= MAX_CONTEXT_CHARACTERS / 2
    return result(
      'context/oversized-field-truncated',
      passed,
      `${context.characterCount} chars, hit whole-context cap: ${neededEmergencyCap}`,
    )
  },
}

const retrievalRelevance: EvalCase = {
  name: 'context/retrieves-relevant-note',
  run: () => {
    const context = renderVehicleContext(runnerSources, 'pedal pulsation when braking downhill')
    const foundBrakeNote = context.text.includes('Brake pedal pulsation under light braking')
    return result(
      'context/retrieves-relevant-note',
      foundBrakeNote,
      foundBrakeNote ? 'brake note ranked into context' : 'relevant note missing from context',
    )
  },
}

const conversationTrimming: EvalCase = {
  name: 'context/conversation-trimmed',
  run: () => {
    const messages: MechanicAssistantMessage[] = Array.from({ length: 30 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `turn ${index}`,
    }))
    const trimmed = trimConversation(messages, 12)
    const startsWithUser = trimmed[0]?.role === 'user'
    const withinLimit = trimmed.length <= 12
    return result(
      'context/conversation-trimmed',
      startsWithUser && withinLimit,
      `${trimmed.length} turns, first role ${trimmed[0]?.role}`,
    )
  },
}

const cachePrefixOrdering: EvalCase = {
  name: 'context/cacheable-prefix',
  run: () => {
    const blocks = buildSystemBlocks('rendered context')
    const instructionsFirst = blocks[0]?.text === MECHANIC_SYSTEM_PROMPT
    const allCacheable = blocks.every((block) => block.cache_control?.type === 'ephemeral')
    return result(
      'context/cacheable-prefix',
      instructionsFirst && allCacheable,
      `${blocks.length} blocks, instructions first: ${instructionsFirst}`,
    )
  },
}

const costKnownModel: EvalCase = {
  name: 'cost/known-model-priced',
  run: () => {
    const cost = costMicroUsdFor('claude-haiku-4-5', {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
    return result('cost/known-model-priced', cost === 1_000_000, `one million input tokens = ${cost} micro-USD`)
  },
}

const costCacheDiscount: EvalCase = {
  name: 'cost/cache-reads-cheaper',
  run: () => {
    const uncached = costMicroUsdFor('claude-haiku-4-5', {
      inputTokens: 10_000,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
    const cached = costMicroUsdFor('claude-haiku-4-5', {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 10_000,
      cacheWriteTokens: 0,
    })
    const cheaper = cached !== null && uncached !== null && cached < uncached
    return result('cost/cache-reads-cheaper', cheaper, `cached ${cached} vs uncached ${uncached}`)
  },
}

const costDatedModelId: EvalCase = {
  name: 'cost/dated-model-id-resolves',
  run: () => {
    const cost = costMicroUsdFor('claude-haiku-4-5-20260101', {
      inputTokens: 1_000,
      outputTokens: 1_000,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
    return result('cost/dated-model-id-resolves', cost !== null, `dated id priced at ${cost}`)
  },
}

const costUnknownModel: EvalCase = {
  name: 'cost/unknown-model-is-null-not-zero',
  run: () => {
    const cost = costMicroUsdFor('some-unlisted-model', {
      inputTokens: 5_000,
      outputTokens: 5_000,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
    return result(
      'cost/unknown-model-is-null-not-zero',
      cost === null,
      `unlisted model returned ${cost === null ? 'null' : cost}`,
    )
  },
}

export const deterministicEvalCases: EvalCase[] = [
  scopeIsolation,
  scopeIsolationReverse,
  contextBudget,
  oversizedFieldBudget,
  retrievalRelevance,
  conversationTrimming,
  cachePrefixOrdering,
  costKnownModel,
  costCacheDiscount,
  costDatedModelId,
  costUnknownModel,
]

export function runDeterministicEvals() {
  return deterministicEvalCases.map((evalCase) => evalCase.run())
}
