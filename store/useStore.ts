'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Transaction, Category, Wallet, Bill, Habit, HabitLog, Budget, SavingsGoal } from '@/types'
import { defaultCategories } from '@/lib/defaultData'
import { createClient } from '@/lib/supabase/client'
import { walletToRow, txToRow, billToRow, habitToRow, budgetToRow, goalToRow } from '@/lib/supabase/mappers'

interface Store {
  transactions: Transaction[]
  categories: Category[]
  wallets: Wallet[]
  bills: Bill[]
  habits: Habit[]
  habitLogs: HabitLog[]
  budgets: Budget[]
  goals: SavingsGoal[]
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTransaction: (id: string, t: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addWallet: (w: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateWallet: (id: string, w: Partial<Wallet>) => void
  deleteWallet: (id: string) => void
  addCategory: (c: Category) => void
  updateCategory: (id: string, c: Partial<Category>) => void
  deleteCategory: (id: string) => void
  addBill: (b: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateBill: (id: string, b: Partial<Bill>) => void
  deleteBill: (id: string) => void
  transferWallet: (fromId: string, toId: string, amount: number) => void
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => string
  deleteHabit: (id: string) => void
  toggleHabitLog: (habitId: string, date: string) => void
  addBudget: (b: Omit<Budget, 'id'>) => string
  updateBudget: (id: string, b: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  addGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => string
  updateGoal: (id: string, g: Partial<SavingsGoal>) => void
  deleteGoal: (id: string) => void
  restoreData: (data: { transactions?: Transaction[]; wallets?: Wallet[]; bills?: Bill[]; categories?: Category[]; habits?: Habit[]; habitLogs?: HabitLog[]; budgets?: Budget[]; goals?: SavingsGoal[] }) => void
  hydrateCloud: (data: { transactions: Transaction[]; wallets: Wallet[]; bills: Bill[]; habits: Habit[]; habitLogs: HabitLog[]; budgets: Budget[]; goals: SavingsGoal[] }) => void
  mergeCloud: (data: { transactions: Transaction[]; wallets: Wallet[]; bills: Bill[]; habits: Habit[]; habitLogs: HabitLog[]; budgets: Budget[]; goals: SavingsGoal[] }) => void
  clearAll: () => void
  getBalance: () => number
  getMonthlyIncome: () => number
  getMonthlyExpense: () => number
  getTransactionsByDate: (date: Date) => Transaction[]
  getTransactionsByCategory: (categoryId: string) => Transaction[]
  isLoading: boolean
  isSyncing: boolean
  setLoading: (loading: boolean) => void
  setSyncing: (v: boolean) => void
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)
const toDate = (d: unknown) => d instanceof Date ? d : new Date(d as string)

const initialWallets: Wallet[] = [
  { id: 'default', name: 'Dompet Utama', description: 'Saldo utama', balance: 0, icon: 'wallet', color: 'blue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
]

// ponytail: cloud sync is best-effort, optimistic local-first; offline queue not persisted
// upgrade: Workbox background sync + outbox table when offline reliability needed
async function getCloud() {
  try {
    const supabase = createClient()
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return { supabase, userId: user.id }
  } catch { return null }
}
function cloudUpsert(table: string, row: any) {
  void getCloud().then(c => { if (!c) return; c.supabase.from(table).upsert(row).then(()=>{} ) })
}
function cloudDelete(table: string, id: string) {
  void getCloud().then(c => { if (!c) return; c.supabase.from(table).delete().eq('id', id).eq('user_id', c.userId).then(()=>{} ) })
}
function cloudDeleteHabitLog(habitId: string, date: string) {
  void getCloud().then(c => { if (!c) return; c.supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', date).eq('user_id', c.userId).then(()=>{} ) })
}
function cloudInsertHabitLog(habitId: string, date: string) {
  void getCloud().then(c => { if (!c) return; c.supabase.from('habit_logs').insert({ habit_id: habitId, user_id: c.userId, date }).then(()=>{} ) })
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: defaultCategories,
      wallets: initialWallets,
      bills: [],
      habits: [
        { id: 'h1', name: 'Catat pengeluaran', icon: '📝', targetPerWeek: 7, createdAt: new Date('2026-01-01') },
        { id: 'h2', name: 'Tidak jajan berlebihan', icon: '🍔', targetPerWeek: 5, createdAt: new Date('2026-01-01') },
      ],
      habitLogs: [],
      budgets: [],
      goals: [],
      isLoading: false,
      isSyncing: false,

      addTransaction: (transaction) => {
        const id = generateId()
        const now = new Date()
        const newTransaction: Transaction = { ...transaction, id, createdAt: now, updatedAt: now }
        const wid = transaction.walletId || get().wallets[0]?.id
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
          wallets: state.wallets.map((w) => w.id === wid ? { ...w, balance: w.balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount), updatedAt: now } : w),
        }))
        // cloud: tx + wallet balance
        void getCloud().then(c => {
          if (!c) return
          c.supabase.from('transactions').insert(txToRow(newTransaction, c.userId)).then(()=>{})
          const w = get().wallets.find(x=>x.id===wid)
          if (w) c.supabase.from('wallets').upsert(walletToRow(w, c.userId)).then(()=>{})
        })
        return id
      },
      updateTransaction: (id, transaction) => {
        const prev = get().transactions.find((t) => t.id === id)
        set((state) => ({ transactions: state.transactions.map((t) => t.id === id ? { ...t, ...transaction, updatedAt: new Date() } : t) }))
        if (prev) {
          const oldWid = prev.walletId || get().wallets[0]?.id
          const newWid = (transaction.walletId as string) || oldWid
          const oldDelta = prev.type === 'income' ? prev.amount : -prev.amount
          const newAmount = transaction.amount ?? prev.amount
          const newType = (transaction.type as Transaction['type']) || prev.type
          const newDelta = newType === 'income' ? newAmount : -newAmount
          if (oldWid === newWid) {
            const diff = newDelta - oldDelta
            if (diff !== 0) set((s) => ({ wallets: s.wallets.map((w) => w.id === oldWid ? { ...w, balance: w.balance + diff, updatedAt: new Date() } : w) }))
          } else {
            set((s) => ({
              wallets: s.wallets.map((w) => {
                if (w.id === oldWid) return { ...w, balance: w.balance - oldDelta, updatedAt: new Date() }
                if (w.id === newWid) return { ...w, balance: w.balance + newDelta, updatedAt: new Date() }
                return w
              }),
            }))
          }
        }
        void getCloud().then(c=>{
          if(!c) return
          const cur = get().transactions.find(t=>t.id===id)
          if(cur) c.supabase.from('transactions').upsert(txToRow(cur, c.userId)).then(()=>{})
          // sync affected wallets
          const wallets = get().wallets
          wallets.forEach(w=> c.supabase.from('wallets').upsert(walletToRow(w, c.userId)).then(()=>{}))
        })
      },
      deleteTransaction: (id) => {
        const prev = get().transactions.find((t) => t.id === id)
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }))
        if (prev) {
          const wid = prev.walletId || get().wallets[0]?.id
          const delta = prev.type === 'income' ? prev.amount : -prev.amount
          set((s) => ({ wallets: s.wallets.map((w) => w.id === wid ? { ...w, balance: w.balance - delta, updatedAt: new Date() } : w) }))
        }
        cloudDelete('transactions', id)
        void getCloud().then(c=>{
          if(!c) return
          get().wallets.forEach(w=> c.supabase.from('wallets').upsert(walletToRow(w, c.userId)).then(()=>{}))
        })
      },
      addWallet: (wallet) => {
        const id = generateId()
        const now = new Date()
        const newWallet: Wallet = { ...wallet, id, createdAt: now, updatedAt: now }
        set((state) => ({ wallets: [...state.wallets, newWallet] }))
        void getCloud().then(c=>{ if(!c) return; c.supabase.from('wallets').insert(walletToRow(newWallet, c.userId)).then(()=>{}) })
        return id
      },
      updateWallet: (id, wallet) => {
        set((state) => ({ wallets: state.wallets.map((w) => w.id === id ? { ...w, ...wallet, updatedAt: new Date() } : w) }))
        void getCloud().then(c=>{ if(!c) return; const cur=get().wallets.find(w=>w.id===id); if(cur) c.supabase.from('wallets').upsert(walletToRow(cur, c.userId)).then(()=>{}) })
      },
      deleteWallet: (id) => {
        set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) }))
        cloudDelete('wallets', id)
      },
      addCategory: (category) => { set((state) => ({ categories: [...state.categories, category] })) },
      updateCategory: (id, category) => { set((state) => ({ categories: state.categories.map((c) => c.id === id ? { ...c, ...category } : c) })) },
      deleteCategory: (id) => { set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })) },
      addBill: (bill) => {
        const id = generateId()
        const now = new Date()
        const newBill: Bill = { ...bill, id, createdAt: now, updatedAt: now }
        set((state) => ({ bills: [...state.bills, newBill] }))
        void getCloud().then(c=>{ if(!c) return; c.supabase.from('bills').insert(billToRow(newBill, c.userId)).then(()=>{}) })
        return id
      },
      updateBill: (id, bill) => { 
        set((state) => ({ bills: state.bills.map((b) => b.id === id ? { ...b, ...bill, updatedAt: new Date() } : b) }))
        void getCloud().then(c=>{ if(!c) return; const cur=get().bills.find(b=>b.id===id); if(cur) c.supabase.from('bills').upsert(billToRow(cur, c.userId)).then(()=>{}) })
      },
      deleteBill: (id) => { set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })); cloudDelete('bills', id) },
      transferWallet: (fromId, toId, amount) => {
        if (fromId === toId || amount <= 0) return
        set((state) => ({
          wallets: state.wallets.map((w) => {
            if (w.id === fromId) return { ...w, balance: w.balance - amount, updatedAt: new Date() }
            if (w.id === toId) return { ...w, balance: w.balance + amount, updatedAt: new Date() }
            return w
          }),
        }))
        void getCloud().then(c=>{
          if(!c) return
          const wallets=get().wallets
          const f=wallets.find(w=>w.id===fromId); const t=wallets.find(w=>w.id===toId)
          if(f) c.supabase.from('wallets').upsert(walletToRow(f, c.userId)).then(()=>{})
          if(t) c.supabase.from('wallets').upsert(walletToRow(t, c.userId)).then(()=>{})
        })
      },
      addHabit: (h) => { const id = generateId(); const nh={...h, id, createdAt: new Date()} as Habit; set((s) => ({ habits: [...s.habits, nh] })); void getCloud().then(c=>{ if(!c) return; c.supabase.from('habits').insert(habitToRow(nh, c.userId)).then(()=>{}) }); return id },
      deleteHabit: (id) => { set((s) => ({ habits: s.habits.filter((h) => h.id !== id), habitLogs: s.habitLogs.filter((l) => l.habitId !== id) })); cloudDelete('habits', id) },
      toggleHabitLog: (habitId, date) => set((s) => {
        const exists = s.habitLogs.find((l) => l.habitId === habitId && l.date === date)
        if (exists) { cloudDeleteHabitLog(habitId, date); return { habitLogs: s.habitLogs.filter((l) => !(l.habitId === habitId && l.date === date)) } }
        else { cloudInsertHabitLog(habitId, date); return { habitLogs: [...s.habitLogs, { habitId, date }] } }
      }),
      addBudget: (b) => { const id = generateId(); const nb={...b, id} as Budget; set((s) => ({ budgets: [...s.budgets.filter((x) => x.categoryId !== b.categoryId), nb] })); void getCloud().then(c=>{ if(!c) return; c.supabase.from('budgets').upsert(budgetToRow(nb, c.userId)).then(()=>{}) }); return id },
      updateBudget: (id, b) => { set((s) => ({ budgets: s.budgets.map((x) => x.id === id ? { ...x, ...b } : x) })); void getCloud().then(c=>{ if(!c) return; const cur=get().budgets.find(x=>x.id===id); if(cur) c.supabase.from('budgets').upsert(budgetToRow(cur, c.userId)).then(()=>{}) }) },
      deleteBudget: (id) => { set((s) => ({ budgets: s.budgets.filter((x) => x.id !== id) })); cloudDelete('budgets', id) },
      addGoal: (g) => { const id = generateId(); const ng={...g, id, createdAt: new Date()} as SavingsGoal; set((s) => ({ goals: [...s.goals, ng] })); void getCloud().then(c=>{ if(!c) return; c.supabase.from('savings_goals').insert(goalToRow(ng, c.userId)).then(()=>{}) }); return id },
      updateGoal: (id, g) => { set((s) => ({ goals: s.goals.map((x) => x.id === id ? { ...x, ...g } : x) })); void getCloud().then(c=>{ if(!c) return; const cur=get().goals.find(x=>x.id===id); if(cur) c.supabase.from('savings_goals').upsert(goalToRow(cur, c.userId)).then(()=>{}) }) },
      deleteGoal: (id) => { set((s) => ({ goals: s.goals.filter((x) => x.id !== id) })); cloudDelete('savings_goals', id) },
      restoreData: (data) => {
        const reviveTx = (t: Transaction) => ({ ...t, date: toDate(t.date), createdAt: toDate(t.createdAt), updatedAt: toDate(t.updatedAt) })
        const reviveBill = (b: Bill) => ({ ...b, dueDate: toDate(b.dueDate), createdAt: toDate(b.createdAt), updatedAt: toDate(b.updatedAt) })
        const reviveWallet = (w: Wallet) => ({ ...w, createdAt: toDate(w.createdAt), updatedAt: toDate(w.updatedAt) })
        const reviveHabit = (h: Habit) => ({ ...h, createdAt: toDate(h.createdAt) })
        const reviveGoal = (g: SavingsGoal) => ({ ...g, deadline: g.deadline ? toDate(g.deadline) : undefined, createdAt: toDate(g.createdAt) })
        set({
          transactions: data.transactions ? data.transactions.map(reviveTx) : get().transactions,
          wallets: data.wallets ? data.wallets.map(reviveWallet) : get().wallets,
          bills: data.bills ? data.bills.map(reviveBill) : get().bills,
          categories: data.categories || get().categories,
          habits: data.habits ? data.habits.map(reviveHabit) : get().habits,
          habitLogs: data.habitLogs || get().habitLogs,
          budgets: data.budgets || get().budgets,
          goals: data.goals ? data.goals.map(reviveGoal) : get().goals,
        })
      },
      hydrateCloud: (data) => {
        const reviveTx = (t: Transaction) => ({ ...t, date: toDate(t.date), createdAt: toDate(t.createdAt), updatedAt: toDate(t.updatedAt) })
        const reviveBill = (b: Bill) => ({ ...b, dueDate: toDate(b.dueDate), createdAt: toDate(b.createdAt), updatedAt: toDate(b.updatedAt) })
        const reviveWallet = (w: Wallet) => ({ ...w, createdAt: toDate(w.createdAt), updatedAt: toDate(w.updatedAt) })
        const reviveHabit = (h: Habit) => ({ ...h, createdAt: toDate(h.createdAt) })
        const reviveGoal = (g: SavingsGoal) => ({ ...g, deadline: g.deadline ? toDate(g.deadline) : undefined, createdAt: toDate(g.createdAt) })
        set({
          transactions: data.transactions.map(reviveTx),
          wallets: data.wallets.length ? data.wallets.map(reviveWallet) : initialWallets,
          bills: data.bills.map(reviveBill),
          habits: data.habits.map(reviveHabit),
          habitLogs: data.habitLogs,
          budgets: data.budgets,
          goals: data.goals.map(reviveGoal),
        })
      },
      mergeCloud: (data) => {
        // ponytail: merge tanpa tombstone, delete tidak propagate antar device
        // upgrade: simpan deletedIds + sync outbox ketika butuh delete sync
        const reviveTx = (t: Transaction) => ({ ...t, date: toDate(t.date), createdAt: toDate(t.createdAt), updatedAt: toDate(t.updatedAt) })
        const reviveBill = (b: Bill) => ({ ...b, dueDate: toDate(b.dueDate), createdAt: toDate(b.createdAt), updatedAt: toDate(b.updatedAt) })
        const reviveWallet = (w: Wallet) => ({ ...w, createdAt: toDate(w.createdAt), updatedAt: toDate(w.updatedAt) })
        const reviveHabit = (h: Habit) => ({ ...h, createdAt: toDate(h.createdAt) })
        const reviveGoal = (g: SavingsGoal) => ({ ...g, deadline: g.deadline ? toDate(g.deadline) : undefined, createdAt: toDate(g.createdAt) })
        const toMs = (d: unknown) => { try { const v = d instanceof Date ? d : new Date(d as string); return isNaN(v.getTime()) ? 0 : v.getTime() } catch { return 0 } }
        const pickNewer = (a: any, b: any) => toMs(b.updatedAt ?? b.createdAt) >= toMs(a.updatedAt ?? a.createdAt) ? b : a
        const s = get()
        const cloudTx = data.transactions.map(reviveTx)
        const cloudWallets = data.wallets.map(reviveWallet)
        const cloudBills = data.bills.map(reviveBill)
        const cloudHabits = data.habits.map(reviveHabit)
        const cloudGoals = data.goals.map(reviveGoal)
        const mergeById = <T extends { id: string }>(local: T[], cloud: T[], pick:(a:T,b:T)=>T) => {
          const m = new Map(local.map(x=>[x.id, x] as const))
          for (const c of cloud) { const l=m.get(c.id); m.set(c.id, l ? pick(l,c) : c) }
          return Array.from(m.values())
        }
        const mergedTx = mergeById(s.transactions, cloudTx, pickNewer)
        const mergedWallets = (()=>{ const m=mergeById(s.wallets, cloudWallets, pickNewer); return m.length ? m : initialWallets })()
        const mergedBills = mergeById(s.bills, cloudBills, pickNewer)
        const mergedHabits = mergeById(s.habits, cloudHabits, pickNewer)
        const mergedGoals = mergeById(s.goals, cloudGoals, pickNewer)
        // habitLogs union by habitId|date
        const logKey = (l: HabitLog)=>`${l.habitId}|${l.date}`
        const logMap = new Map(s.habitLogs.map(l=>[logKey(l), l] as const))
        for (const l of data.habitLogs) if(!logMap.has(logKey(l))) logMap.set(logKey(l), l)
        const mergedLogs = Array.from(logMap.values())
        // budgets: union by id then dedupe by categoryId (cloud wins on conflict)
        const budgetByCat = new Map<string, Budget>()
        for (const b of [...s.budgets, ...data.budgets]) budgetByCat.set(b.categoryId, b)
        const mergedBudgets = Array.from(budgetByCat.values())
        set({ transactions: mergedTx, wallets: mergedWallets, bills: mergedBills, habits: mergedHabits, habitLogs: mergedLogs, budgets: mergedBudgets, goals: mergedGoals })
      },
      clearAll: () => set({ transactions: [], bills: [], wallets: initialWallets, habitLogs: [], budgets: [], goals: [] }),

      getBalance: () => get().transactions.reduce((bal, t) => t.type === 'income' ? bal + t.amount : bal - t.amount, 0),
      getMonthlyIncome: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        return get().transactions.filter((t) => t.type === 'income' && toDate(t.date) >= start).reduce((s, t) => s + t.amount, 0)
      },
      getMonthlyExpense: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        return get().transactions.filter((t) => t.type === 'expense' && toDate(t.date) >= start).reduce((s, t) => s + t.amount, 0)
      },
      getTransactionsByDate: (date) => {
        const target = new Date(date); target.setHours(0, 0, 0, 0)
        return get().transactions.filter((t) => { const d = toDate(t.date); d.setHours(0, 0, 0, 0); return d.getTime() === target.getTime() })
      },
      getTransactionsByCategory: (categoryId) => get().transactions.filter((t) => t.categoryId === categoryId),
      setLoading: (loading) => { set({ isLoading: loading }) },
      setSyncing: (v) => set({ isSyncing: v }),
    }),
    {
      name: 'duit-mahasiswa-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ transactions: state.transactions, categories: state.categories, wallets: state.wallets, bills: state.bills, habits: state.habits, habitLogs: state.habitLogs, budgets: state.budgets, goals: state.goals }),
    }
  )
)
