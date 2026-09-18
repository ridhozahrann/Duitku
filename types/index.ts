export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  walletId?: string
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  color: string
}

export interface Wallet {
  id: string
  name: string
  description?: string
  balance: number
  budgetLimit?: number
  icon: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface Bill {
  id: string
  name: string
  amount: number
  category: string
  dueDate: Date
  recurrence?: 'weekly' | 'monthly' | 'yearly'
  status: 'paid' | 'unpaid' | 'overdue'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Habit {
  id: string
  name: string
  icon: string
  targetPerWeek: number
  createdAt: Date
}

export interface HabitLog {
  habitId: string
  date: string // YYYY-MM-DD
}

export interface Budget {
  id: string
  categoryId: string
  limit: number
  period: 'monthly'
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  current: number
  deadline?: Date
  createdAt: Date
}

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  currentBalance: number
  remainingBalance: number
  todayTransactions: Transaction[]
  monthlyIncome: number
  monthlyExpense: number
  weeklyTrend: { date: string; income: number; expense: number }[]
  topCategories: { category: string; amount: number; percentage: number }[]
}