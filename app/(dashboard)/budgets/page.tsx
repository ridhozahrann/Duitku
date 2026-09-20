'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { formatIDR, parseThousands } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useToast } from '@/hooks/useToast'

export default function BudgetsPage() {
  const { budgets, transactions, categories, addBudget, deleteBudget } = useStore()
  const { toast } = useToast()
  const [catId, setCatId] = useState('')
  const [limit, setLimit] = useState('')

  const startOfMonth = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) }, [])
  const spentByCat = useMemo(() => {
    const m: Record<string, number> = {}
    transactions.forEach(t => { if (t.type === 'expense' && new Date(t.date) >= startOfMonth) m[t.categoryId] = (m[t.categoryId] || 0) + t.amount })
    return m
  }, [transactions, startOfMonth])

  const handleAdd = () => {
    if (!catId) { toast({ title: 'Gagal', description: 'Pilih kategori', variant: 'destructive' }); return }
    const lim = parseThousands(limit)
    if (!lim || lim <= 0) { toast({ title: 'Gagal', description: 'Limit tidak valid', variant: 'destructive' }); return }
    addBudget({ categoryId: catId, limit: lim, period: 'monthly' })
    toast({ title: 'Berhasil', description: 'Budget disimpan', variant: 'success' })
    setLimit('')
  }

  return (
    <div className="py-6 space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Budget Bulanan</h1><p className="text-gray-600 dark:text-zinc-400">Batas pengeluaran per kategori — reset tiap bulan</p></div>

      <Card>
        <CardHeader><CardTitle>Atur Budget</CardTitle><CardDescription>Pilih kategori + nominal batas</CardDescription></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-2"><Label>Kategori</Label>
            <Select value={catId} onValueChange={setCatId}><SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>{categories.filter(c=>c.type==='expense').map(c=> <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="flex-1 space-y-2"><Label>Batas (Rp)</Label><CurrencyInput placeholder="500.000" value={limit} onValueChange={setLimit} /></div>
          <div className="flex items-end"><Button onClick={handleAdd} className="w-full sm:w-auto">Simpan</Button></div>
        </CardContent>
      </Card>

      {budgets.length ? (
        <div className="grid gap-4">
          {budgets.map(b => {
            const cat = categories.find(c=>c.id===b.categoryId)
            const spent = spentByCat[b.categoryId] || 0
            const pct = Math.min(150, (spent / b.limit) * 100)
            const over = spent > b.limit
            const warn = pct >= 80 && !over
            return (
              <Card key={b.id} className={over ? 'border-red-300' : warn ? 'border-amber-300' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{cat?.icon} {cat?.name || b.categoryId}</div>
                    <Button variant="ghost" size="sm" onClick={()=>deleteBudget(b.id)}>Hapus</Button>
                  </div>
                  <div className="flex justify-between text-sm mt-2"><span className={over?'text-red-600 font-semibold':''}>{formatIDR(spent)} / {formatIDR(b.limit)}</span><span>{pct.toFixed(0)}%</span></div>
                  <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${over?'bg-red-500':warn?'bg-amber-500':'bg-green-500'}`} style={{ width: `${Math.min(100,pct)}%` }} />
                  </div>
                  {over && <p className="text-xs text-red-600 mt-1">Melebihi budget {formatIDR(spent - b.limit)}</p>}
                  {warn && <p className="text-xs text-amber-600 mt-1">Hampir habis — sisa {formatIDR(b.limit - spent)}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : <Card><CardContent className="pt-6 text-center text-gray-500 py-8">Belum ada budget. Atur di atas.</CardContent></Card>}
    </div>
  )
}
