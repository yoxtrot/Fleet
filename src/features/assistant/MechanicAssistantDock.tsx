import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import CloseIcon from '@mui/icons-material/Close'
import { useNavigate } from 'react-router-dom'
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
import { useVehicleScope, type VehicleScope } from './vehicleScope'

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

function AssistantDrawerHeader({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ p: 2, alignItems: 'flex-start', justifyContent: 'space-between' }}
    >
      <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
        {children}
      </Stack>
      <IconButton
        aria-label="Close mechanic assistant"
        onClick={onClose}
        edge="end"
        size="small"
        sx={{ mt: -0.5 }}
      >
        <CloseIcon />
      </IconButton>
    </Stack>
  )
}

function DemoMechanicAssistantPanel({
  scope,
  onClose,
  onSignIn,
}: {
  scope: VehicleScope | null
  onClose: () => void
  onSignIn: () => void
}) {
  return (
    <Stack sx={{ height: '100%' }}>
      <AssistantDrawerHeader onClose={onClose}>
        <Typography variant="h6">Mechanic assistant</Typography>
        <Chip label="Demo preview" size="small" color="primary" variant="outlined" />
      </AssistantDrawerHeader>
      <Divider />

      <Stack spacing={2} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <Typography variant="body1">
          This is Fleet&apos;s vehicle-scoped AI mechanic. It answers questions about the vehicle
          you are currently viewing — and only that vehicle.
        </Typography>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            What it uses as context
          </Typography>
          <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
            <Typography component="li" variant="body2">
              Year, make, and model of the open vehicle
            </Typography>
            <Typography component="li" variant="body2">
              Completed projects already performed on it
            </Typography>
            <Typography component="li" variant="body2">
              Open projects still planned or pending
            </Typography>
            <Typography component="li" variant="body2">
              Maintenance history and research notes for that vehicle
            </Typography>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            What you can ask when signed in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Symptoms to check next, whether a mod you already installed matters, what a maintenance
            interval implies for this specific machine, or what is still open on a project list.
          </Typography>
        </Box>

        {scope ? (
          <Alert severity="info">
            Right now you are viewing <strong>{scope.vehicleName}</strong>. In a signed-in garage,
            the assistant would load that vehicle&apos;s year/make/model, projects, and history
            before answering — without seeing any other vehicle.
          </Alert>
        ) : (
          <Alert severity="info">
            Open a vehicle in the demo garage to see which machine the assistant would scope to.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          Demo mode is read-only, so questions are disabled here. Sign in to use it against your
          own garage. Every answer is logged with token usage and cost, and daily limits keep spend
          bounded.
        </Typography>
      </Stack>

      <Divider />
      <Stack spacing={1} sx={{ p: 2 }}>
        <Button variant="contained" onClick={onSignIn}>
          Sign in to ask questions
        </Button>
        <Button variant="text" color="inherit" onClick={onClose}>
          Close
        </Button>
      </Stack>
    </Stack>
  )
}

export function MechanicAssistantDock() {
  const { session, isDemoMode, user, exitDemoMode } = useAuth()
  const { scope } = useVehicleScope()
  const navigate = useNavigate()
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
    if (!user || isDemoMode) return
    readAssistantUsageToday(user.id)
      .then(setUsageToday)
      .catch(() => setUsageToday(null))
  }, [user, isDemoMode])

  useEffect(() => {
    if (isOpen && !isDemoMode) refreshUsageToday()
  }, [isOpen, isDemoMode, refreshUsageToday])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  async function sendQuestion() {
    const trimmed = question.trim()
    if (!trimmed || !vehicleId || isSending || isDemoMode) return

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

  // Fully signed-out visitors still see nothing. Demo mode gets an explain-only panel so
  // the feature is discoverable without spending model tokens.
  if (!isDemoMode && !session) return null

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
        {isDemoMode ? (
          <DemoMechanicAssistantPanel
            scope={scope}
            onClose={() => setIsOpen(false)}
            onSignIn={() => {
              setIsOpen(false)
              exitDemoMode()
              navigate('/login')
            }}
          />
        ) : (
          <Stack sx={{ height: '100%' }}>
            <AssistantDrawerHeader onClose={() => setIsOpen(false)}>
              <Typography variant="h6">Mechanic assistant</Typography>
              {scope ? (
                <Chip
                  label={`Scoped to ${scope.vehicleName}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Open a vehicle to ask about it. The assistant only ever sees the vehicle you are
                  viewing.
                </Typography>
              )}
            </AssistantDrawerHeader>
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
        )}
      </Drawer>
    </>
  )
}
