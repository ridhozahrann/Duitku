'use client'

import { useRef, useState } from 'react'
import { Download, Upload, Trash2, Database, FileJson, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/useToast'
import { formatIDR } from '@/lib/utils'
import { demoTransactions } from '@/lib/defaultData'
import { triggerCloudSync } from '@/hooks/useCloudSync'

export default function SettingsPage() {
  const { transactions, wallets, bills, habits, habitLogs, budgets, goals, categories, restoreData, clearAll } = useStore()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const { isSyncing } = useStore()

  const handleExport = () => {
    const data = { transactions, wallets, bills, habits, habitLogs, budgets, goals, categories, exportedAt: new Date().toISOString(), version: 2 }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `duitku-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Berhasil', description: 'Backup JSON ter-download', variant: 'success' })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.transactions && !data.wallets && !data.bills && !data.habits && !data.budgets && !data.goals) throw new Error('Format tidak valid')
      const count = `${data.transactions?.length || 0} trx, ${data.wallets?.length || 0} kantong, ${data.bills?.length || 0} tagihan, ${data.budgets?.length || 0} budget, ${data.goals?.length || 0} goal`
      if (!confirm(`Import ${count}? Data lama akan terganti.`)) return
      restoreData(data)
      toast({ title: 'Berhasil', description: 'Data berhasil di-restore', variant: 'success' })
    } catch {
      toast({ title: 'Gagal', description: 'File backup tidak valid', variant: 'destructive' })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleClear = () => {
    if (!confirm('Hapus SEMUA data? Tidak bisa dibatalkan.')) return
    if (!confirm('Yakin? Semua transaksi, tagihan, budget, goal, habit hilang.')) return
    clearAll()
    toast({ title: 'Dihapus', description: 'Semua data dihapus', variant: 'success' })
  }

  const handleLoadDemo = () => {
    if (transactions.length > 0 && !confirm('Timpa dengan data demo?')) return
    restoreData({ transactions: demoTransactions as any })
    toast({ title: 'Demo dimuat', description: `${demoTransactions.length} transaksi demo`, variant: 'success' })
  }

  const totalBalance = transactions.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0)

  return (
    <div className="py-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Pengaturan</h1>
        <p className="text-gray-600 dark:text-zinc-400">Backup, restore, dan kelola data</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Ringkasan Data</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div><div className="text-2xl font-bold">{transactions.length}</div><div className="text-sm text-gray-500">Transaksi</div></div>
          <div><div className="text-2xl font-bold">{wallets.length}</div><div className="text-sm text-gray-500">Kantong</div></div>
          <div><div className="text-2xl font-bold">{bills.length}</div><div className="text-sm text-gray-500">Tagihan</div></div>
          <div><div className="text-2xl font-bold">{formatIDR(totalBalance)}</div><div className="text-sm text-gray-500">Saldo</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5" />Backup & Restore</CardTitle><CardDescription>Simpan data ke file cadangan, restore kapan saja.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Backup (.json)</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}><Upload className="mr-2 h-4 w-4" />{importing ? 'Mengimport...' : 'Import Backup'}</Button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
          </div>
          <p className="text-xs text-gray-500">Tip: export rutin sebelum ganti HP. Import akan mengganti transaksi/kantong/tagihan dengan isi file.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />Sinkronisasi</CardTitle><CardDescription>Data mengikuti akun — HP & PC otomatis sama. Login dengan akun yang sama untuk melihat data yang sama.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={async () => { await triggerCloudSync(); toast({ title: 'Sinkron selesai', description: 'Data terbaru dari akun dimuat', variant: 'success' }) }} disabled={isSyncing}><RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />{isSyncing ? 'Menyinkron...' : 'Sinkron sekarang'}</Button>
          <p className="text-xs text-gray-500">Gagal sinkron? Pastikan sudah login dan koneksi internet aktif. Jika masih gagal, data tabel belum dibuat — jalankan file supabase/schema.sql di dashboard.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Data Demo</CardTitle><CardDescription>Coba aplikasi dengan data contoh</CardDescription></CardHeader>
        <CardContent><Button variant="outline" onClick={handleLoadDemo}>Muat {demoTransactions.length} transaksi demo</Button></CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-600">Zona Bahaya</CardTitle></CardHeader>
        <CardContent><Button variant="destructive" onClick={handleClear}><Trash2 className="mr-2 h-4 w-4" />Hapus Semua Data</Button></CardContent>
      </Card>
    </div>
  )
}
