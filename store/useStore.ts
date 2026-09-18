'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Transaction, Category, Wallet, Bill, Habit, HabitLog, Budget, SavingsGoal } from '@/types'
import { defaultCategories } from '@/lib/defaultData'

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
  clearAll: () => void
  getBalance: () => number
  getMonthlyIncome: () => number
  getMonthlyExpense: () => number
  getTransactionsByDate: (date: Date) => Transaction[]
  getTransactionsByCategory: (categoryId: string) => Transaction[]
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)
const toDate = (d: unknown) => d instanceof Date ? d : new Date(d as string)

const initialWallets: Wallet[] = [
  { id: 'default', name: 'Dompet Utama', description: 'Saldo utama', balance: 0, icon: 'wallet', color: 'blue', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
]

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

      addTransaction: (transaction) => {
        const id = generateId()
        const now = new Date()
        const newTransaction: Transaction = { ...transaction, id, createdAt: now, updatedAt: now }
        const wid = transaction.walletId || get().wallets[0]?.id
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
          wallets: state.wallets.map((w) => w.id === wid ? { ...w, balance: w.balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount), updatedAt: now } : w),
        }))
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
      },
      deleteTransaction: (id) => {
        const prev = get().transactions.find((t) => t.id === id)
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }))
        if (prev) {
          const wid = prev.walletId || get().wallets[0]?.id
          const delta = prev.type === 'income' ? prev.amount : -prev.amount
          set((s) => ({ wallets: s.wallets.map((w) => w.id === wid ? { ...w, balance: w.balance - delta, updatedAt: new Date() } : w) }))
        }
      },
      addWallet: (wallet) => {
        const id = generateId()
        const now = new Date()
        const newWallet: Wallet = { ...wallet, id, createdAt: now, updatedAt: now }
        set((state) => ({ wallets: [...state.wallets, newWallet] }))
        return id
      },
      updateWallet: (id, wallet) => {
        set((state) => ({ wallets: state.wallets.map((w) => w.id === id ? { ...w, ...wallet, updatedAt: new Date() } : w) }))
      },
      deleteWallet: (id) => {
        set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) }))
      },
      addCategory: (category) => { set((state) => ({ categories: [...state.categories, category] })) },
      updateCategory: (id, category) => { set((state) => ({ categories: state.categories.map((c) => c.id === id ? { ...c, ...category } : c) })) },
      deleteCategory: (id) => { set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })) },
      addBill: (bill) => {
        const id = generateId()
        const now = new Date()
        const newBill: Bill = { ...bill, id, createdAt: now, updatedAt: now }
        set((state) => ({ bills: [...state.bills, newBill] }))
        return id
      },
      updateBill: (id, bill) => { set((state) => ({ bills: state.bills.map((b) => b.id === id ? { ...b, ...bill, updatedAt: new Date() } : b) })) },
      deleteBill: (id) => { set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })) },
      transferWallet: (fromId, toId, amount) => {
        if (fromId === toId || amount <= 0) return
        set((state) => ({
          wallets: state.wallets.map((w) => {
            if (w.id === fromId) return { ...w, balance: w.balance - amount, updatedAt: new Date() }
            if (w.id === toId) return { ...w, balance: w.balance + amount, updatedAt: new Date() }
            return w
          }),
        }))
      },
      addHabit: (h) => { const id = generateId(); set((s) => ({ habits: [...s.habits, { ...h, id, createdAt: new Date() }] })); return id },
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id), habitLogs: s.habitLogs.filter((l) => l.habitId !== id) })),
      toggleHabitLog: (habitId, date) => set((s) => {
        const exists = s.habitLogs.find((l) => l.habitId === habitId && l.date === date)
        return exists ? { habitLogs: s.habitLogs.filter((l) => !(l.habitId === habitId && l.date === date)) } : { habitLogs: [...s.habitLogs, { habitId, date }] }
      }),
      addBudget: (b) => { const id = generateId(); set((s) => ({ budgets: [...s.budgets.filter((x) => x.categoryId !== b.categoryId), { ...b, id }] })); return id },
      updateBudget: (id, b) => set((s) => ({ budgets: s.budgets.map((x) => x.id === id ? { ...x, ...b } : x) })),
      deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((x) => x.id !== id) })),
      addGoal: (g) => { const id = generateId(); set((s) => ({ goals: [...s.goals, { ...g, id, createdAt: new Date() }] })); return id },
      updateGoal: (id, g) => set((s) => ({ goals: s.goals.map((x) => x.id === id ? { ...x, ...g } : x) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((x) => x.id !== id) })),
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
    }),
    {
      name: 'duit-mahasiswa-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ transactions: state.transactions, categories: state.categories, wallets: state.wallets, bills: state.bills, habits: state.habits, habitLogs: state.habitLogs, budgets: state.budgets, goals: state.goals }),
    }
  )
)
