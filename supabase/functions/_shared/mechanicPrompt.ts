// System prompt and message assembly for the mechanic assistant.
//
// Block order is deliberate: stable instructions first, then the vehicle context, then
// the conversation. Prompt caching keys on a shared prefix, so keeping the volatile
// turns last means every follow-up question in a conversation re-reads the instructions
// and vehicle history from cache instead of paying full input price for them.

import type { MechanicAssistantMessage } from '../../../src/lib/aiContracts.ts'

export const MECHANIC_PROMPT_VERSION = '2026-08-03.1'

export const MECHANIC_SYSTEM_PROMPT = `You are the mechanic assistant inside Fleet, a personal garage app.

You are advising on exactly one vehicle. Its details, maintenance history, open projects, and the owner's prior research notes are provided below. That context is the entire record you have.

How to answer:
- Ground every claim in the supplied history. When you reference it, name the specific record so the owner can check you.
- If the history does not contain what you need, say so plainly and name the one piece of information that would most change your answer.
- Never invent maintenance records, mileages, dates, or parts that are not in the context.
- Order possible causes by likelihood for this specific vehicle, given its type, age, and mileage.
- Be concrete about next diagnostic steps, and note which ones need tools or a lift.
- For brakes, steering, suspension, fuel, or structural work, state the safety risk directly and recommend professional inspection when the failure mode could be dangerous.
- Keep answers short and scannable. The owner is usually standing in a garage holding a phone.

You cannot look anything up, browse, or see other vehicles in the garage.`

export type AnthropicTextBlock = {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

export type AnthropicMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function buildSystemBlocks(renderedContext: string): AnthropicTextBlock[] {
  return [
    { type: 'text', text: MECHANIC_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `Context for the vehicle currently being viewed:\n\n${renderedContext}`,
      cache_control: { type: 'ephemeral' },
    },
  ]
}

export function buildConversationMessages(
  messages: MechanicAssistantMessage[],
): AnthropicMessage[] {
  return messages.map((message) => ({ role: message.role, content: message.content }))
}
