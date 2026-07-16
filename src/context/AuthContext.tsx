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
import type { Profile } from '../types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error(error.message)
      setProfile(null)
      return
    }

    let nextProfile = data as Profile | null

    const isExpiredPremium =
      nextProfile?.subscription === 'premium' &&
      nextProfile.premium_expires_at != null &&
      new Date(nextProfile.premium_expires_at).getTime() < Date.now()

    if (isExpiredPremium && nextProfile) {
      const { error: downgradeError } = await supabase
        .from('profiles')
        .update({ subscription: 'free', premium_expires_at: null })
        .eq('id', userId)

      if (downgradeError) {
        console.error(downgradeError.message)
      } else {
        nextProfile = { ...nextProfile, subscription: 'free', premium_expires_at: null }
      }
    }

    setProfile(nextProfile)
  }, [])

  const syncSession = useCallback(
    async (session: Session | null) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        await fetchProfile(nextUser.id)
      } else {
        setProfile(null)
      }
    },
    [fetchProfile],
  )

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [fetchProfile, user])

  useEffect(() => {
    let isMounted = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return
      await syncSession(session)
      if (isMounted) setLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [syncSession])

  const value = useMemo(
    () => ({ user, profile, loading, refreshProfile }),
    [loading, profile, refreshProfile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
