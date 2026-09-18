'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { formatIDR } from '@/lib/utils'
import { defaultCategories } from '@/lib/defaultData'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'

const COLORS = ['#3b82f6','#ef4444','#8b5cf6','#f59e0b','#10b981','#ec4899','#6366f1','#14b8a6']

export default function AnalyticsPage() {
  const { transactions, getMonthlyIncome, getMonthlyExpense } = useStore()
  const [range, setRange] = useState<'7d'|'30d'|'all'>('30d')

  const monthlyIncome = getMonthlyIncome()
  const monthlyExpense = getMonthlyExpense()
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome * 100) : 0

  const filtered = useMemo(() => {
    if (range === 'all') return transactions
    const days = range === '7d' ? 7 : 30
    const cutoff = Date.now() - days * 86400000
    return transactions.filter(t => new Date(t.date).getTime() >= cutoff)
  }, [transactions, range])

  const dailyData = useMemo(() => {
    const map: Record<string, { date: string, income: number, expense: number }> = {}
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 14
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().slice(0,10)
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      map[key] = { date: label, income: 0, expense: 0 }
    }
    filtered.forEach(t => {
      const key = new Date(t.date).toISOString().slice(0,10)
      if (map[key]) {
        if (t.type === 'income') map[key].income += t.amount
        else map[key].expense += t.amount
      }
    })
    return Object.values(map)
  }, [filtered, range])

  const categoryData = useMemo(() => {
    const acc: Record<string, number> = {}
    filtered.forEach(t => { if (t.type === 'expense') acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount })
    return Object.entries(acc).sort(([,a],[,b]) => b - a).slice(0, 6).map(([categoryId, amount]) => {
      const cat = defaultCategories.find(c => c.id === categoryId)
      return { name: cat?.name || categoryId, value: amount }
    })
  }, [filtered])

  const topCategories = useMemo(() => {
    const acc: Record<string, number> = {}
    filtered.filter(t=>t.type==='expense').forEach(t=> acc[t.categoryId]=(acc[t.categoryId]||0)+t.amount)
    const total = Object.values(acc).reduce((a,b)=>a+b,0)
    return Object.entries(acc).sort(([,a],[,b])=>b-a).slice(0,5).map(([id, amount])=>({ categoryId: id, amount, percentage: total? amount/total*100 : 0, name: defaultCategories.find(c=>c.id===id)?.name || id }))
  }, [filtered])

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Analisis Keuangan</h1><p className="text-gray-600 dark:text-zinc-400">Tren & pola pengeluaran</p></div>
        <div className="flex gap-2">
          {(['7d','30d','all'] as const).map(r => (
            <Button key={r} variant={range===r?'default':'outline'} size="sm" onClick={()=>setRange(r)}>{r==='7d'?'7 Hari':r==='30d'?'30 Hari':'Semua'}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle><TrendingUp className="h-4 w-4 text-income-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-income-600">{formatIDR(filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0))}</div><p className="text-sm text-gray-500 mt-1">{range==='all'?'Semua waktu':range}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle><TrendingDown className="h-4 w-4 text-expense-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-expense-600">{formatIDR(filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0))}</div><p className="text-sm text-gray-500 mt-1">{range==='all'?'Semua waktu':range}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Rasio Tabungan</CardTitle><div className="h-4 w-4">💰</div></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary-600">{savingsRate.toFixed(1)}%</div><p className="text-sm text-gray-500 mt-1">Bulan ini</p></CardContent></Card>
      </div>

      {/* Trend harian */}
      <Card>
        <CardHeader><CardTitle>Tren Harian</CardTitle><p className="text-sm text-gray-500">Pemasukan vs Pengeluaran</p></CardHeader>
        <CardContent className="h-[280px]">
          {dailyData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} tickFormatter={v=> `${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(v: number)=>formatIDR(v)} /><Legend /><Line type="monotone" dataKey="income" name="Pemasukan" stroke="#16a34a" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#dc2626" strokeWidth={2} dot={false} /></LineChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-500 py-12">Belum ada data</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar kategori */}
        <Card>
          <CardHeader><CardTitle>Pengeluaran per Kategori</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical"><XAxis type="number" tickFormatter={v=>`${(v/1000).toFixed(0)}k`} fontSize={12} /><YAxis dataKey="name" type="category" width={100} fontSize={12} /><Tooltip formatter={(v:number)=>formatIDR(v)} /><Bar dataKey="value" fill="#3b82f6" radius={[0,8,8,0]} /></BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 py-12">Belum ada pengeluaran</p>}
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader><CardTitle>Distribusi Pengeluaran</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name, percent})=> `${name} ${(percent*100).toFixed(0)}%`}>{categoryData.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip formatter={(v:number)=>formatIDR(v)} /></PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 py-12">Belum ada data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Top list tetap */}
      <Card>
        <CardHeader><CardTitle>Kategori Terbesar</CardTitle></CardHeader>
        <CardContent>
          {topCategories.length ? (
            <div className="space-y-4">
              {topCategories.map(item => (
                <div key={item.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between"><span className="font-medium">{item.name}</span><span className="font-semibold text-expense-600">{formatIDR(item.amount)}</span></div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-expense-500 rounded-full" style={{ width: `${Math.min(item.percentage,100)}%` }} /></div>
                  <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}% dari total pengeluaran</div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-500 py-8">Mulai catat pengeluaran untuk melihat analisis</p>}
        </CardContent>
      </Card>
    </div>
  )
}
