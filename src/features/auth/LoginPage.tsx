import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../app/AuthProvider'
import { isSupabaseConfigured } from '../../lib/supabase'
import { PageLoadingState } from '../../shared/PageLoadingState'
import { PagePanel } from '../../shared/PagePanel'

export function LoginPage() {
  const { user, isLoadingSession, signInWithEmail, signUpWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
        <PagePanel sx={{ maxWidth: 420 }}>
          <Typography variant="h1" gutterBottom>
            Fleet
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            Supabase is not configured yet.
          </Alert>
          <Typography color="text.secondary">
            Copy <code>.env.example</code> to <code>.env.local</code>, add your project URL and anon key, then follow{' '}
            <code>docs/supabase-setup.md</code>.
          </Typography>
        </PagePanel>
      </Box>
    )
  }

  if (isLoadingSession) {
    return <PageLoadingState label="Checking your session…" />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFormMessage(null)
    setIsSubmitting(true)
    const errorMessage = await signInWithEmail(email, password)
    setIsSubmitting(false)
    if (errorMessage) setFormError(errorMessage)
  }

  async function handleSignUp() {
    setFormError(null)
    setFormMessage(null)
    setIsSubmitting(true)
    const errorMessage = await signUpWithEmail(email, password)
    setIsSubmitting(false)
    if (errorMessage) {
      setFormError(errorMessage)
      return
    }
    setFormMessage(
      'Account created. If email confirmation is enabled, check your inbox before signing in.',
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <PagePanel sx={{ maxWidth: 420 }}>
        <Typography variant="h1" gutterBottom>
          Fleet
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Sign in to manage your personal garage.
        </Typography>
        <Box component="form" onSubmit={handleSignIn}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              slotProps={{ htmlInput: { minLength: 6 } }}
            />
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {formMessage ? <Alert severity="success">{formMessage}</Alert> : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button type="submit" disabled={isSubmitting} fullWidth>
                Sign in
              </Button>
              <Button
                type="button"
                variant="outlined"
                disabled={isSubmitting}
                onClick={() => void handleSignUp()}
                fullWidth
              >
                Create account
              </Button>
            </Stack>
          </Stack>
        </Box>
      </PagePanel>
    </Box>
  )
}
