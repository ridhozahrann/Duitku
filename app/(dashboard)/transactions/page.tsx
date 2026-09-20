'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TransactionItem from '@/components/transactions/TransactionItem'
import TransactionDialog from '@/components/transactions/TransactionDialog'
import { useStore } from '@/store/useStore'
import { formatIDR } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 50

function getMonthOptions(transactions: { date: Date }[]) {
  const set = new Set<string>()
  transactions.forEach(t => {
    const d = new Date(t.date)
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  })
  return Array.from(set).sort().reverse()
}

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1)
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const { transactions, categories } = useStore()
  const { toast } = useToast()

  const monthOptions = useMemo(() => getMonthOptions(transactions), [transactions])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (catFilter !== 'all' && t.categoryId !== catFilter) return false
      if (monthFilter !== 'all') {
        const d = new Date(t.date)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (ym !== monthFilter) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const cat = categories.find(c=>c.id===t.categoryId)?.name.toLowerCase() || t.categoryId.toLowerCase()
        if (!cat.includes(q) && !(t.description||'').toLowerCase().includes(q) && !String(t.amount).includes(q)) return false
      }
      return true
    })
  }, [transactions, categories, search, typeFilter, catFilter, monthFilter])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, typeFilter, catFilter, monthFilter])

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleExport = () => {
    if (!filtered.length) { toast({ title: 'Kosong', description: 'Tidak ada data untuk di-export', variant: 'destructive' }); return }
    const header = 'Tanggal,Tipe,Kategori,Nominal,Catatan\n'
    const rows = filtered.map(t => {
      const cat = categories.find(c=>c.id===t.categoryId)?.name || t.categoryId
      const date = new Date(t.date).toLocaleDateString('id-ID')
      return `${date},${t.type},${cat},${t.amount},"${(t.description||'').replace(/"/g,'""')}"`
    }).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `duitku-${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Berhasil', description: 'CSV ter-download', variant: 'success' })
  }

  const hasFilter = typeFilter !== 'all' || catFilter !== 'all' || monthFilter !== 'all' || !!search
  const resetFilters = () => { setSearch(''); setTypeFilter('all'); setCatFilter('all'); setMonthFilter('all') }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Semua Transaksi</h1>
          <p className="text-gray-600 dark:text-zinc-400 text-sm">
            {filtered.length}/{transactions.length} transaksi • Pemasukan: {formatIDR(totalIncome)} • Pengeluaran: {formatIDR(totalExpense)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV"><Download className="h-4 w-4" /></Button>
          <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" />Tambah</Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari kategori, catatan, nominal..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-10" />
          {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-gray-400" /></button>}
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Bulan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua bulan</SelectItem>
            {monthOptions.map(ym => <SelectItem key={ym} value={ym}>{formatMonthLabel(ym)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Tipe" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua tipe</SelectItem><SelectItem value="income">Pemasukan</SelectItem><SelectItem value="expense">Pengeluaran</SelectItem></SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilter && <Button variant="ghost" onClick={resetFilters}>Reset</Button>}
      </div>

      {paged.length ? (
        <>
          <Card><CardContent className="p-0"><div className="divide-y divide-gray-100 dark:divide-zinc-800">{paged.map(t => <TransactionItem key={t.id} transaction={t} showTime />)}</div></CardContent></Card>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Hal {page + 1} / {totalPages} ({filtered.length} transaksi)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card><CardContent className="pt-6"><div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{hasFilter ? 'Tidak ditemukan' : 'Belum ada transaksi'}</h3>
          <p className="text-gray-500 mb-6">{hasFilter ? `Tidak ada yang cocok dengan filter.` : 'Mulai catat pengeluaran atau pemasukan pertamamu!'}</p>
          {!hasFilter && <Button onClick={()=>setShowDialog(true)}>+ Tambah Transaksi Pertama</Button>}
        </div></CardContent></Card>
      )}

      <TransactionDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  )
}
