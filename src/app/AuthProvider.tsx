import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const DEMO_STORAGE_KEY = 'fleet.demoMode'
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID?.trim() || ''
const DEMO_USER_EMAIL = 'yoxtrot@gmail.com'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoadingSession: boolean
  isDemoMode: boolean
  enterDemoMode: () => void
  exitDemoMode: () => void
  signInWithEmail: (email: string, password: string) => Promise<string | null>
  signUpWithEmail: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function createDemoUser(userId: string): User {
  return {
    id: userId,
    email: DEMO_USER_EMAIL,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
  } as User
}

export function isDemoModeAvailable() {
  return Boolean(DEMO_USER_ID)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoadingSession(false)
      return
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      if (data.session) {
        setSession(data.session)
        setIsDemoMode(false)
        sessionStorage.removeItem(DEMO_STORAGE_KEY)
      } else if (DEMO_USER_ID && sessionStorage.getItem(DEMO_STORAGE_KEY) === '1') {
        setIsDemoMode(true)
      }
      setIsLoadingSession(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        setIsDemoMode(false)
        sessionStorage.removeItem(DEMO_STORAGE_KEY)
      }
      setIsLoadingSession(false)
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const enterDemoMode = useCallback(() => {
    if (!DEMO_USER_ID) return
    sessionStorage.setItem(DEMO_STORAGE_KEY, '1')
    setIsDemoMode(true)
  }, [])

  const exitDemoMode = useCallback(() => {
    sessionStorage.removeItem(DEMO_STORAGE_KEY)
    setIsDemoMode(false)
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    exitDemoMode()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [exitDemoMode])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    exitDemoMode()
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }, [exitDemoMode])

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      exitDemoMode()
      return
    }
    await supabase.auth.signOut()
  }, [exitDemoMode, isDemoMode])

  const demoUser = useMemo(() => {
    if (!isDemoMode || !DEMO_USER_ID) return null
    return createDemoUser(DEMO_USER_ID)
  }, [isDemoMode])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? demoUser,
      isLoadingSession,
      isDemoMode,
      enterDemoMode,
      exitDemoMode,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [
      session,
      demoUser,
      isLoadingSession,
      isDemoMode,
      enterDemoMode,
      exitDemoMode,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

type StorybookAuthProviderProps = {
  children: ReactNode
  user?: User | null
  isLoadingSession?: boolean
  isDemoMode?: boolean
}

export function StorybookAuthProvider({
  children,
  user = null,
  isLoadingSession = false,
  isDemoMode = false,
}: StorybookAuthProviderProps) {
  const value = useMemo<AuthContextValue>(
    () => ({
      session: null,
      user,
      isLoadingSession,
      isDemoMode,
      enterDemoMode: () => undefined,
      exitDemoMode: () => undefined,
      signInWithEmail: async () => null,
      signUpWithEmail: async () => null,
      signOut: async () => undefined,
    }),
    [user, isLoadingSession, isDemoMode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
