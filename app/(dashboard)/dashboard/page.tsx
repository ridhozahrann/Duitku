'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, Calendar, AlertTriangle, Target, Flame, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TransactionDialog from '@/components/transactions/TransactionDialog'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useStore } from '@/store/useStore'
import { formatIDR } from '@/lib/utils'
import { defaultCategories } from '@/lib/defaultData'

export default function DashboardPage() {
  const [showTx, setShowTx] = useState(false)
  const [defaultTxType, setDefaultTxType] = useState<'income' | 'expense'>('expense')
  const [balanceVisible, setBalanceVisible] = useState(true)
  const { transactions, getBalance, getMonthlyIncome, getMonthlyExpense, budgets, bills, goals, habits, habitLogs } = useStore()

  const balance = getBalance()
  const monthlyIncome = getMonthlyIncome()
  const monthlyExpense = getMonthlyExpense()
  const remaining = monthlyIncome - monthlyExpense

  // budget warnings
  const startOfMonth = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) }, [])
  const spentByCat = useMemo(() => {
    const m: Record<string, number> = {}
    transactions.forEach(t => { if (t.type === 'expense' && new Date(t.date) >= startOfMonth) m[t.categoryId] = (m[t.categoryId] || 0) + t.amount })
    return m
  }, [transactions, startOfMonth])
  const budgetAlerts = budgets.filter(b => (spentByCat[b.categoryId] || 0) >= b.limit * 0.8).slice(0, 2)
  const unpaidBills = bills.filter(b => b.status !== 'paid').length
  const nextBill = bills.filter(b => b.status !== 'paid').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
  const topGoal = goals.slice().sort((a, b) => (b.current / b.target) - (a.current / a.target))[0]
  const streak = useMemo(() => {
    const set = new Set(habitLogs.map(l => l.date))
    let s = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (set.has(d)) s++
      else if (i === 0) break
      else if (s > 0) break
    }
    return s
  }, [habitLogs])

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Selamat datang 👋</h1>
          <p className="text-gray-600 dark:text-zinc-400">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-zinc-400">Saldo Saat Ini</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{balanceVisible ? formatIDR(balance) : '•••••••'}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setBalanceVisible(!balanceVisible)}>{balanceVisible ? '👁️' : '👁️‍🗨️'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="expense" size="lg" onClick={() => { setDefaultTxType('expense'); setShowTx(true) }} className="h-16 text-lg">Tambah Pengeluaran</Button>
        <Button variant="income" size="lg" onClick={() => { setDefaultTxType('income'); setShowTx(true) }} className="h-16 text-lg">Tambah Pemasukan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle><TrendingUp className="h-4 w-4 text-income-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-income-600">{formatIDR(monthlyIncome)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle><TrendingDown className="h-4 w-4 text-expense-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-expense-600">{formatIDR(monthlyExpense)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sisa Saldo</CardTitle><Wallet className="h-4 w-4 text-primary-500" /></CardHeader><CardContent><div className={`text-2xl font-bold ${remaining >= 0 ? 'text-primary-600' : 'text-expense-600'}`}>{formatIDR(remaining)}</div></CardContent></Card>
      </div>

      {/* Phase 3 widgets */}
      {(budgetAlerts.length > 0 || unpaidBills > 0 || topGoal || habits.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {budgetAlerts.length > 0 && (
            <Link href="/budgets"><Card className="border-amber-200 hover:shadow-md transition cursor-pointer h-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm flex items-center gap-2"><PiggyBank className="h-4 w-4" />Budget Hampir Habis</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader>
              <CardContent className="space-y-2">
                {budgetAlerts.map(b => {
                  const cat = defaultCategories.find(c => c.id === b.categoryId)
                  const spent = spentByCat[b.categoryId] || 0
                  const pct = Math.min(100, (spent / b.limit) * 100)
                  return <div key={b.id} className="text-sm flex justify-between"><span>{cat?.name}</span><span className={spent > b.limit ? 'text-red-600 font-bold' : 'text-amber-600'}>{pct.toFixed(0)}%</span></div>
                })}
              </CardContent>
            </Card></Link>
          )}
          {unpaidBills > 0 && (
            <Link href="/bills"><Card className="border-red-200 hover:shadow-md transition cursor-pointer h-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">Tagihan Belum Lunas</CardTitle><Calendar className="h-4 w-4 text-red-500" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{unpaidBills}</div>
                <p className="text-xs text-gray-500 truncate">{nextBill ? `${nextBill.name} • ${formatIDR(nextBill.amount)}` : ''}</p>
              </CardContent>
            </Card></Link>
          )}
          {topGoal && (
            <Link href="/goals"><Card className="hover:shadow-md transition cursor-pointer h-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" />Target Nabung</CardTitle></CardHeader>
              <CardContent>
                <div className="font-medium truncate">{topGoal.name}</div>
                <div className="text-sm text-gray-500">{formatIDR(topGoal.current)} / {formatIDR(topGoal.target)}</div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2"><div className="h-full bg-primary-500" style={{ width: `${Math.min(100, (topGoal.current / topGoal.target) * 100)}%` }} /></div>
              </CardContent>
            </Card></Link>
          )}
          {habits.length > 0 && (
            <Link href="/habits"><Card className="hover:shadow-md transition cursor-pointer h-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" />Streak Kebiasaan</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">🔥 {streak} hari</div><p className="text-xs text-gray-500">{habits.length} kebiasaan aktif</p></CardContent>
            </Card></Link>
          )}
        </div>
      )}

      <RecentTransactions />

      {transactions.length === 0 && (
        <Card><CardContent className="pt-6"><div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Belum ada transaksi</h3>
          <p className="text-gray-500 mb-6">Yuk mulai catat pemasukan atau pengeluaran pertamamu!</p>
          <Button onClick={() => setShowTx(true)}>+ Tambah Transaksi Pertama</Button>
        </div></CardContent></Card>
      )}

      <TransactionDialog open={showTx} onOpenChange={setShowTx} defaultType={defaultTxType} />
    </div>
  )
}
