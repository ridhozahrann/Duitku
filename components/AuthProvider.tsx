'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

type AuthCtx = { user: User | null; session: Session | null; loading: boolean; signOut: () => Promise<void> }
const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} })

export function useAuth() { return useContext(Ctx) }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: string, s: Session | null) => {
      setSession(s); setUser(s?.user ?? null); setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    location.href = '/login'
  }

  return <Ctx.Provider value={{ user, session, loading, signOut }}>{children}</Ctx.Provider>
}
