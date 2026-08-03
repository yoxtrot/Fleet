import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Fab,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import { useAuth } from '../../app/AuthProvider'
import {
  ASSISTANT_DAILY_CALL_LIMIT,
  formatMicroUsd,
  MAX_ASSISTANT_QUESTION_LENGTH,
  type MechanicAssistantMessage,
  type ModelCallUsage,
} from '../../lib/aiContracts'
import {
  askMechanicAssistant,
  readAssistantUsageToday,
  type AssistantUsageToday,
} from './mechanicAssistantApi'
import { useVehicleScope } from './vehicleScope'

function MessageBubble({ message }: { message: MechanicAssistantMessage }) {
  const isUser = message.role === 'user'
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '90%',
        bgcolor: isUser ? 'primary.main' : 'background.default',
        color: isUser ? 'primary.contrastText' : 'text.primary',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {message.content}
      </Typography>
    </Paper>
  )
}

function UsageFooter({
  lastUsage,
  conversationCostMicroUsd,
  usageToday,
}: {
  lastUsage: ModelCallUsage | null
  conversationCostMicroUsd: number
  usageToday: AssistantUsageToday | null
}) {
  return (
    <Stack spacing={0.25} sx={{ px: 2, py: 1.5 }}>
      {lastUsage ? (
        <Typography variant="caption" color="text.secondary">
          Last answer: {lastUsage.inputTokens} in / {lastUsage.outputTokens} out
          {lastUsage.cacheReadTokens > 0 ? ` / ${lastUsage.cacheReadTokens} cached` : ''} ·{' '}
          {formatMicroUsd(lastUsage.costMicroUsd)}
        </Typography>
      ) : null}
      <Typography variant="caption" color="text.secondary">
        This conversation: {formatMicroUsd(conversationCostMicroUsd)}
      </Typography>
      {usageToday ? (
        <Typography variant="caption" color="text.secondary">
          Today: {usageToday.callsUsed}/{ASSISTANT_DAILY_CALL_LIMIT} questions ·{' '}
          {formatMicroUsd(usageToday.spendMicroUsd)}
        </Typography>
      ) : null}
    </Stack>
  )
}

export function MechanicAssistantDock() {
  const { session, isDemoMode, user } = useAuth()
  const { scope } = useVehicleScope()
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState<MechanicAssistantMessage[]>([])
  const [question, setQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastUsage, setLastUsage] = useState<ModelCallUsage | null>(null)
  const [conversationCostMicroUsd, setConversationCostMicroUsd] = useState(0)
  const [usageToday, setUsageToday] = useState<AssistantUsageToday | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  const vehicleId = scope?.vehicleId ?? null

  // A conversation is only ever about one vehicle, so switching vehicles starts a new
  // trace rather than carrying another vehicle's history into the next answer.
  useEffect(() => {
    setConversationId(crypto.randomUUID())
    setMessages([])
    setLastUsage(null)
    setConversationCostMicroUsd(0)
    setErrorMessage(null)
  }, [vehicleId])

  const refreshUsageToday = useCallback(() => {
    if (!user) return
    readAssistantUsageToday(user.id)
      .then(setUsageToday)
      .catch(() => setUsageToday(null))
  }, [user])

  useEffect(() => {
    if (isOpen) refreshUsageToday()
  }, [isOpen, refreshUsageToday])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  async function sendQuestion() {
    const trimmed = question.trim()
    if (!trimmed || !vehicleId || isSending) return

    const nextMessages: MechanicAssistantMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ]
    setMessages(nextMessages)
    setQuestion('')
    setErrorMessage(null)
    setIsSending(true)

    try {
      const result = await askMechanicAssistant({
        vehicleId,
        conversationId,
        messages: nextMessages,
      })
      setMessages([...nextMessages, { role: 'assistant', content: result.reply }])
      setLastUsage(result.usage)
      setConversationCostMicroUsd(result.conversationCostMicroUsd)
      setUsageToday({
        callsUsed: result.dailyCallsUsed,
        spendMicroUsd: result.dailySpendMicroUsd,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The assistant failed to answer.')
      setMessages(messages)
      setQuestion(trimmed)
    } finally {
      setIsSending(false)
    }
  }

  // Signed-out and demo visitors never see the entry point. The Edge Function rejects
  // them independently; hiding the control just keeps the limit from being discoverable.
  if (isDemoMode || !session) return null

  return (
    <>
      <Fab
        color="primary"
        aria-label="Open mechanic assistant"
        onClick={() => setIsOpen(true)}
        sx={{ position: 'fixed', right: 24, bottom: 24 }}
      >
        <BuildIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 420 } } } }}
      >
        <Stack sx={{ height: '100%' }}>
          <Stack spacing={1} sx={{ p: 2 }}>
            <Typography variant="h6">Mechanic assistant</Typography>
            {scope ? (
              <Chip label={`Scoped to ${scope.vehicleName}`} size="small" color="primary" variant="outlined" />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Open a vehicle to ask about it. The assistant only ever sees the vehicle you are
                viewing.
              </Typography>
            )}
          </Stack>
          <Divider />

          <Stack spacing={1.5} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            {messages.length === 0 && scope ? (
              <Typography variant="body2" color="text.secondary">
                Ask about a symptom, a maintenance interval, or what to check next on{' '}
                {scope.vehicleName}.
              </Typography>
            ) : null}
            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}
            {isSending ? (
              <Typography variant="body2" color="text.secondary">
                Thinking…
              </Typography>
            ) : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <Box ref={transcriptEndRef} />
          </Stack>

          <Divider />
          <UsageFooter
            lastUsage={lastUsage}
            conversationCostMicroUsd={conversationCostMicroUsd}
            usageToday={usageToday}
          />
          <Divider />

          <Stack direction="row" spacing={1} sx={{ p: 2, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              size="small"
              multiline
              maxRows={4}
              placeholder={scope ? `Ask about ${scope.vehicleName}…` : 'Open a vehicle first'}
              disabled={!scope || isSending}
              value={question}
              slotProps={{ htmlInput: { maxLength: MAX_ASSISTANT_QUESTION_LENGTH } }}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void sendQuestion()
                }
              }}
            />
            <Button
              variant="contained"
              disabled={!scope || isSending || question.trim().length === 0}
              onClick={() => void sendQuestion()}
            >
              Ask
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </>
  )
}
