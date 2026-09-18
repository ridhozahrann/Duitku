import { Category } from '@/types'

export const defaultCategories: Category[] = [
  // Expense categories
  { id: 'food', name: 'Makanan', type: 'expense', icon: '🍔', color: 'red' },
  { id: 'transport', name: 'Transportasi', type: 'expense', icon: '🚗', color: 'blue' },
  { id: 'kos', name: 'Kos', type: 'expense', icon: '🏠', color: 'purple' },
  { id: 'bills', name: 'Tagihan', type: 'expense', icon: '📱', color: 'orange' },
  { id: 'education', name: 'Pendidikan', type: 'expense', icon: '📚', color: 'green' },
  { id: 'shopping', name: 'Belanja', type: 'expense', icon: '🛍️', color: 'pink' },
  { id: 'entertainment', name: 'Hiburan', type: 'expense', icon: '🎬', color: 'yellow' },
  { id: 'health', name: 'Kesehatan', type: 'expense', icon: '🏥', color: 'teal' },
  { id: 'other-expense', name: 'Lainnya', type: 'expense', icon: '📦', color: 'gray' },
  
  // Income categories
  { id: 'monthly-money', name: 'Uang Bulanan', type: 'income', icon: '💰', color: 'green' },
  { id: 'salary', name: 'Gaji', type: 'income', icon: '💼', color: 'blue' },
  { id: 'scholarship', name: 'Beasiswa', type: 'income', icon: '🎓', color: 'purple' },
  { id: 'transfer', name: 'Transfer', type: 'income', icon: '💸', color: 'orange' },
  { id: 'bonus', name: 'Bonus', type: 'income', icon: '🎁', color: 'yellow' },
  { id: 'other-income', name: 'Lainnya', type: 'income', icon: '📦', color: 'gray' },
]

export const demoTransactions = [
  {
    id: '1',
    type: 'income' as const,
    amount: 2000000,
    categoryId: 'monthly-money',
    description: 'Uang bulanan dari orang tua',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    type: 'expense' as const,
    amount: 25000,
    categoryId: 'food',
    description: 'Makan siang',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    type: 'expense' as const,
    amount: 15000,
    categoryId: 'transport',
    description: 'Gojek ke kampus',
    date: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '4',
    type: 'expense' as const,
    amount: 1000000,
    categoryId: 'kos',
    description: 'Bayar kos bulanan',
    date: new Date(Date.now() - 86400000 * 2),
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: '5',
    type: 'income' as const,
    amount: 500000,
    categoryId: 'scholarship',
    description: 'Beasiswa prestasi',
    date: new Date(Date.now() - 86400000 * 3),
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 3),
  },
]