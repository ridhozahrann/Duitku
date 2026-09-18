'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useStore } from '@/store/useStore'
import { rowToWallet, rowToTx, rowToBill, rowToHabit, rowToBudget, rowToGoal, walletToRow, txToRow, billToRow, habitToRow, budgetToRow, goalToRow } from '@/lib/supabase/mappers'
import { useToast } from '@/hooks/useToast'

let globalPull: (() => Promise<void>) | null = null
export function triggerCloudSync() { return globalPull?.() }

export function useCloudSync() {
  const { user, loading } = useAuth()
  const { mergeCloud, setSyncing } = useStore()
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
        // lanjut merge data yang ada; jangan return
      }

      const cloud = {
        wallets: (walletsRes.data ?? []).map(rowToWallet),
        transactions: (txRes.data ?? []).map(rowToTx),
        bills: (billsRes.data ?? []).map(rowToBill),
        habits: (habitsRes.data ?? []).map(rowToHabit),
        habitLogs: (logsRes.data ?? []).map((r: any) => ({ habitId: r.habit_id, date: r.date })),
        budgets: (budgetsRes.data ?? []).map(rowToBudget),
        goals: (goalsRes.data ?? []).map(rowToGoal),
      }

      const before = useStore.getState()
      const cloudIds = {
        wallets: new Set(cloud.wallets.map((w: any) => w.id)),
        transactions: new Set(cloud.transactions.map((t: any) => t.id)),
        bills: new Set(cloud.bills.map((b: any) => b.id)),
        habits: new Set(cloud.habits.map((h: any) => h.id)),
        habitLogs: new Set(cloud.habitLogs.map((l: any) => `${l.habitId}|${l.date}`)),
        budgets: new Set(cloud.budgets.map((b: any) => b.id)),
        goals: new Set(cloud.goals.map((g: any) => g.id)),
      }

      mergeCloud(cloud)

      const uid = user.id
      const tasks: Promise<any>[] = []
      const wMiss = before.wallets.filter(w => !cloudIds.wallets.has(w.id))
      if (wMiss.length) tasks.push(supabase.from('wallets').upsert(wMiss.map(w => walletToRow(w, uid))))
      const tMiss = before.transactions.filter(t => !cloudIds.transactions.has((t as any).id))
      if (tMiss.length) tasks.push(supabase.from('transactions').upsert(tMiss.map(t => txToRow(t, uid))))
      const bMiss = before.bills.filter(b => !cloudIds.bills.has(b.id))
      if (bMiss.length) tasks.push(supabase.from('bills').upsert(bMiss.map(b => billToRow(b, uid))))
      const hMiss = before.habits.filter(h => !cloudIds.habits.has(h.id))
      if (hMiss.length) tasks.push(supabase.from('habits').upsert(hMiss.map(h => habitToRow(h, uid))))
      const hlMiss = before.habitLogs.filter(l => !cloudIds.habitLogs.has(`${l.habitId}|${l.date}`))
      if (hlMiss.length) tasks.push(supabase.from('habit_logs').upsert(hlMiss.map(l => ({ habit_id: l.habitId, user_id: uid, date: l.date }))))
      const buMiss = before.budgets.filter(b => !cloudIds.budgets.has(b.id))
      if (buMiss.length) tasks.push(supabase.from('budgets').upsert(buMiss.map(b => budgetToRow(b, uid))))
      const gMiss = before.goals.filter(g => !cloudIds.goals.has(g.id))
      if (gMiss.length) tasks.push(supabase.from('savings_goals').upsert(gMiss.map(g => goalToRow(g, uid))))

      if (tasks.length) {
        const results = await Promise.all(tasks)
        const pushErr = results.find((r: any) => r.error)
        if (pushErr?.error) toast({ title: 'Sinkron gagal', description: pushErr.error.message, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Sinkron gagal', description: e?.message ?? String(e), variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }, [user, loading, mergeCloud, setSyncing, toast])

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
