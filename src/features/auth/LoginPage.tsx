import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import { isSupabaseConfigured } from '../../lib/supabase'

export function LoginPage() {
  const { user, isLoadingSession, signInWithEmail, signUpWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <h1>Fleet</h1>
          <p className="form-error">Supabase is not configured yet.</p>
          <p className="muted">
            Copy <code>.env.example</code> to <code>.env.local</code>, add your project URL and anon key, then follow{' '}
            <code>docs/supabase-setup.md</code>.
          </p>
        </div>
      </div>
    )
  }

  if (isLoadingSession) {
    return <p className="page-status">Checking your session…</p>
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
    <div className="auth-page">
      <div className="auth-panel">
        <h1>Fleet</h1>
        <p className="muted">Sign in to manage your personal garage.</p>
        <form className="stack-form" onSubmit={handleSignIn}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>
          {formError ? <p className="form-error">{formError}</p> : null}
          {formMessage ? <p className="form-message">{formMessage}</p> : null}
          <div className="button-row">
            <button type="submit" disabled={isSubmitting}>
              Sign in
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={isSubmitting}
              onClick={() => void handleSignUp()}
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
