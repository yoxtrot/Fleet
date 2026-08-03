// Keeps a growing conversation inside a fixed budget.
//
// Every turn re-sends the whole history, so an untrimmed chat grows quadratically in
// cost. Trimming to the most recent turns is the simplest bounded strategy; summarising
// the dropped prefix would be the next step if conversations ran long enough to need it.

import type { MechanicAssistantMessage } from '../../../src/lib/aiContracts.ts'

export function trimConversation(
  messages: MechanicAssistantMessage[],
  maxTurns: number,
): MechanicAssistantMessage[] {
  const recent = messages.slice(-maxTurns)

  // The provider requires the first message to come from the user, and trimming can
  // slice mid-exchange and leave an assistant reply stranded at the front.
  const firstUserIndex = recent.findIndex((message) => message.role === 'user')
  return firstUserIndex <= 0 ? recent : recent.slice(firstUserIndex)
}

export function latestUserQuestion(messages: MechanicAssistantMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') return messages[index].content
  }
  return ''
}
