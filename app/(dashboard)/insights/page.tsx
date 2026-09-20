'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/store/useStore'
import { formatIDR, isBillDue } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Wallet, Flame } from 'lucide-react'

export default function InsightsPage() {
  const { transactions, categories, budgets, bills, goals } = useStore()

  const insights = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysPassed = now.getDate()
    const remaining = daysInMonth - daysPassed

    const monthlyTx = transactions.filter(t => new Date(t.date) >= startOfMonth)
    const monthlyIncome = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthlyExpense = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // avg daily expense last 30 days
    const last30 = transactions.filter(t => new Date(t.date).getTime() >= Date.now() - 30 * 86400000 && t.type === 'expense')
    const avgDaily = last30.length ? last30.reduce((s, t) => s + t.amount, 0) / 30 : monthlyExpense / Math.max(1, daysPassed)

    const projected = Math.round(avgDaily * daysInMonth)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const prevExpense = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= prevMonthStart && new Date(t.date) <= prevMonthEnd).reduce((s, t) => s + t.amount, 0)
    const trendPct = prevExpense ? ((monthlyExpense - prevExpense) / prevExpense) * 100 : 0

    // biggest single expense
    const biggest = [...transactions].filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0]

    // top category this month
    const byCat: Record<string, number> = {}
    monthlyTx.filter(t => t.type === 'expense').forEach(t => { byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount })
    const topCatEntry = Object.entries(byCat).sort(([, a], [, b]) => b - a)[0]
    const topCat = topCatEntry ? { id: topCatEntry[0], amount: topCatEntry[1], name: categories.find(c => c.id === topCatEntry[0])?.name || topCatEntry[0] } : null

    // budget overruns
    const overBudgets = budgets.filter(b => (byCat[b.categoryId] || 0) > b.limit).map(b => ({
      ...b,
      spent: byCat[b.categoryId] || 0,
      name: categories.find(c => c.id === b.categoryId)?.name || b.categoryId,
    }))

    // bills due soon
    const unpaid = bills.filter(b => isBillDue(b)).length

    // runway
    const burnRate = avgDaily || 1
    const balance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
    const runway = burnRate > 0 ? Math.floor(balance / burnRate) : 999

    // goals progress
    const goalsProgress = goals.map(g => ({ ...g, pct: g.target ? (g.current / g.target) * 100 : 0 }))

    // recommendations
    const recs: string[] = []
    if (trendPct > 15) recs.push(`Pengeluaran naik ${trendPct.toFixed(0)}% dibanding bulan lalu. Cek kategori ${topCat?.name || 'terbesar'}.`)
    if (overBudgets.length) recs.push(`${overBudgets.length} budget jebol: ${overBudgets.map(b => b.name).join(', ')}. Evaluasi pengeluaran minggu ini.`)
    if (projected > monthlyIncome && monthlyIncome > 0) recs.push(`Proyeksi pengeluaran ${formatIDR(projected)} melebihi pemasukan bulan ini ${formatIDR(monthlyIncome)}. Potong 20% pengeluaran harian.`)
    if (unpaid) recs.push(`${unpaid} tagihan belum lunas. Lunasi sebelum jatuh tempo.`)
    if (!recs.length) recs.push('Keuangan stabil. Pertahankan catat harian dan sisihkan 10% untuk target nabung.')

    return { monthlyIncome, monthlyExpense, avgDaily, projected, trendPct, prevExpense, biggest, topCat, overBudgets, unpaid, runway, balance, remaining, recs, goalsProgress }
  }, [transactions, budgets, bills, goals])

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Insights</h1>
        <p className="text-gray-600 dark:text-zinc-400">Rangkuman analisis statistik dari data transaksi kamu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={insights.trendPct > 15 ? 'border-amber-300' : ''}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">Tren vs Bulan Lalu</CardTitle>{insights.trendPct > 0 ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-green-500" />}</CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${insights.trendPct > 0 ? 'text-red-600' : 'text-green-600'}`}>{insights.trendPct > 0 ? '+' : ''}{insights.trendPct.toFixed(1)}%</div>
            <p className="text-sm text-gray-500 mt-1">{formatIDR(insights.monthlyExpense)} vs {formatIDR(insights.prevExpense)} bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">Proyeksi Bulan Ini</CardTitle><Wallet className="h-4 w-4 text-primary-500" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(insights.projected)}</div>
            <p className="text-sm text-gray-500 mt-1">Avg harian {formatIDR(Math.round(insights.avgDaily))} × {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} hari</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">Runway</CardTitle><Flame className="h-4 w-4 text-orange-500" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.runway} hari</div>
            <p className="text-sm text-gray-500 mt-1">Saldo {formatIDR(insights.balance)} / burn {formatIDR(Math.round(insights.avgDaily))}/hari</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Sorotan</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Kategori terbesar bulan ini</span><span className="font-medium">{insights.topCat ? `${insights.topCat.name} • ${formatIDR(insights.topCat.amount)}` : '-'}</span></div>
            <div className="flex justify-between"><span>Transaksi terbesar</span><span className="font-medium">{insights.biggest ? `${formatIDR(insights.biggest.amount)} • ${categories.find(c=>c.id===insights.biggest.categoryId)?.name || insights.biggest.categoryId}` : '-'}</span></div>
            <div className="flex justify-between"><span>Budget jebol</span>{insights.overBudgets.length ? <Badge variant="destructive">{insights.overBudgets.length}</Badge> : <Badge variant="outline">0</Badge>}</div>
            <div className="flex justify-between"><span>Tagihan belum lunas</span><Badge variant={insights.unpaid ? 'destructive' : 'outline'}>{insights.unpaid}</Badge></div>
            {insights.goalsProgress.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="font-medium">Target nabung</div>
                {insights.goalsProgress.map(g => (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-xs"><span>{g.name}</span><span>{g.pct.toFixed(0)}%</span></div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-500" style={{ width: `${Math.min(100, g.pct)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={insights.overBudgets.length ? 'border-red-200' : ''}>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Perlu Perhatian</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {insights.overBudgets.length ? insights.overBudgets.map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <span>{b.name}: {formatIDR(b.spent)} / {formatIDR(b.limit)}</span><span className="font-bold text-red-600">+{formatIDR(b.spent - b.limit)}</span>
              </div>
            )) : <p className="text-sm text-gray-500">Tidak ada budget jebol bulan ini.</p>}
            <div className="text-sm text-gray-600 dark:text-zinc-400">Sisa hari bulan ini: {insights.remaining} hari</div>
            <div className="flex gap-2">
              <Link href="/budgets"><Button size="sm" variant="outline">Atur Budget</Button></Link>
              <Link href="/analytics"><Button size="sm" variant="outline">Lihat Grafik</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" />Rekomendasi</CardTitle><CardDescription>Saran berbasis statistik lokal.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {insights.recs.map((r, i) => (
            <div key={i} className="flex gap-2 text-sm p-3 bg-primary-50 dark:bg-zinc-800 rounded-lg"><span className="text-primary-600">•</span><span>{r}</span></div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
