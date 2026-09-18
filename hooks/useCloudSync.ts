'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useStore } from '@/store/useStore'
import { rowToWallet, rowToTx, rowToBill, rowToHabit, rowToBudget, rowToGoal } from '@/lib/supabase/mappers'

export function useCloudSync() {
  const { user, loading } = useAuth()
  const { hydrateCloud, setSyncing } = useStore()
  const didRef = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return
    const supabase = createClient()
    if (!supabase || !user) return
    if (didRef.current === user.id) return
    didRef.current = user.id

    let cancelled = false
    async function pull() {
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
        if (cancelled) return
        const hasCloud = (walletsRes.data?.length || 0) + (txRes.data?.length || 0) > 0
        const local = useStore.getState()
        const hasLocal = local.transactions.length + local.wallets.filter(w=>w.id!=='default').length > 0
        if (!hasCloud && hasLocal && user) {
          const { createClient: cc } = await import('@/lib/supabase/client')
          const { walletToRow, txToRow, billToRow, habitToRow, budgetToRow, goalToRow } = await import('@/lib/supabase/mappers')
          const c = cc(); if (c) {
            const uid = user.id
            if (local.wallets.length) await c.from('wallets').upsert(local.wallets.map(w=>walletToRow(w, uid)))
            if (local.transactions.length) await c.from('transactions').upsert(local.transactions.map(t=>txToRow(t, uid)))
            if (local.bills.length) await c.from('bills').upsert(local.bills.map(b=>billToRow(b, uid)))
            if (local.habits.length) await c.from('habits').upsert(local.habits.map(h=>habitToRow(h, uid)))
            if (local.habitLogs.length) await c.from('habit_logs').upsert(local.habitLogs.map(l=>({ habit_id: l.habitId, user_id: uid, date: l.date })))
            if (local.budgets.length) await c.from('budgets').upsert(local.budgets.map(b=>budgetToRow(b, uid)))
            if (local.goals.length) await c.from('savings_goals').upsert(local.goals.map(g=>goalToRow(g, uid)))
          }
          return pull()
        }

        hydrateCloud({
          wallets: (walletsRes.data ?? []).map(rowToWallet),
          transactions: (txRes.data ?? []).map(rowToTx),
          bills: (billsRes.data ?? []).map(rowToBill),
          habits: (habitsRes.data ?? []).map(rowToHabit),
          habitLogs: (logsRes.data ?? []).map((r:any)=>({ habitId: r.habit_id, date: r.date })),
          budgets: (budgetsRes.data ?? []).map(rowToBudget),
          goals: (goalsRes.data ?? []).map(rowToGoal),
        })
      } catch {}
      finally { if (!cancelled) setSyncing(false) }
    }
    pull()
    return () => { cancelled = true }
  }, [user, loading, hydrateCloud, setSyncing])
}
