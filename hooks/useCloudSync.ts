'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useStore } from '@/store/useStore'
import { rowToWallet, rowToTx, rowToBill, rowToHabit, rowToBudget, rowToGoal } from '@/lib/supabase/mappers'
import { useToast } from '@/hooks/useToast'

let globalPull: (() => Promise<void>) | null = null
export function triggerCloudSync() { return globalPull?.() }

export function useCloudSync() {
  const { user, loading } = useAuth()
  const { hydrateCloud, setSyncing } = useStore()
  const didRef = useRef<string | null>(null)
  const { toast } = useToast()

  const pull = useCallback(async (opts?: { force?: boolean }) => {
    if (loading) return
    const supabase = createClient()
    if (!supabase) {
      toast({ title: 'Sinkron gagal', description: 'Layanan sinkron belum siap. Coba lagi nanti.', variant: 'destructive' })
      return
    }
    if (!user) return
    if (!opts?.force && didRef.current === user.id) return
    didRef.current = user.id

    setSyncing(true)
    try {
      const [walletsRes, txRes, billsRes, habitsRes, logsRes, budgetsRes, goalsRes] = await Promise.all([
        supabase.from('wallets').select('*').order('created_at'),
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(2000),
        supabase.from('bills').select('*').order('due_date'),
        supabase.from('habits').select('*').order('created_at'),
        supabase.from('habit_logs').select('*'),
        supabase.from('budgets').select('*'),
        supabase.from('savings_goals').select('*').order('created_at'),
      ])
      const firstErr = walletsRes.error || txRes.error || billsRes.error || habitsRes.error || logsRes.error || budgetsRes.error || goalsRes.error
      if (firstErr) {
        toast({ title: 'Sinkron gagal', description: firstErr.message, variant: 'destructive' })
        // jika tabel belum ada: beri petunjuk, jangan timpa state kosong
        if (firstErr.message.includes('schema cache') || (firstErr as any).code === 'PGRST205') {
          toast({ title: 'Tabel belum ada', description: 'Jalankan supabase/schema.sql di Supabase Dashboard > SQL Editor lalu reload.', variant: 'destructive' })
        }
        setSyncing(false)
        return
      }

      hydrateCloud({
        wallets: (walletsRes.data ?? []).map(rowToWallet),
        transactions: (txRes.data ?? []).map(rowToTx),
        bills: (billsRes.data ?? []).map(rowToBill),
        habits: (habitsRes.data ?? []).map(rowToHabit),
        habitLogs: (logsRes.data ?? []).map((r: any) => ({ habitId: r.habit_id, date: r.date })),
        budgets: (budgetsRes.data ?? []).map(rowToBudget),
        goals: (goalsRes.data ?? []).map(rowToGoal),
      })
    } catch (e: any) {
      toast({ title: 'Sinkron gagal', description: e?.message ?? String(e), variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }, [user, loading, hydrateCloud, setSyncing, toast])

  useEffect(() => {
    globalPull = () => pull({ force: true })
    return () => { if (globalPull === pull) globalPull = null }
  }, [pull])

  useEffect(() => {
    if (loading) return
    if (!user) { didRef.current = null; return }
    pull()
    const onFocus = () => pull({ force: true })
    const onVis = () => { if (document.visibilityState === 'visible') pull({ force: true }) }
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [pull, user, loading])
}
