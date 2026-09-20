'use client'

import { useRef, useState } from 'react'
import { Download, Upload, Trash2, Database, FileJson, RefreshCw, User, LogOut, Layout, PanelLeft, PanelBottom, Tag, Palette, Check, Eye, EyeOff } from 'lucide-react'
import CategoryManager from '@/components/categories/CategoryManager'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/useToast'
import { formatIDR } from '@/lib/utils'
import { demoTransactions } from '@/lib/defaultData'
import { triggerCloudSync } from '@/hooks/useCloudSync'
import { useAuth } from '@/components/AuthProvider'

export default function SettingsPage() {
  const { transactions, wallets, bills, habits, habitLogs, budgets, goals, categories, restoreData, clearAll, navPosition, setNavPosition, accentColor, setAccentColor, isBalanceHidden, toggleBalanceHidden } = useStore()
  const { user, signOut } = useAuth()
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
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Akun Saya</CardTitle><CardDescription>Informasi akun dan sesi login</CardDescription></CardHeader>
        <CardContent>
          {user ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-zinc-100">{user.email}</div>
                <div className="text-xs text-gray-500">Tersambung ke cloud sync</div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
                <LogOut className="mr-2 h-4 w-4" />Keluar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Belum masuk ke akun</div>
              <Link href="/login"><Button size="sm">Masuk</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" />Tampilan Navigasi</CardTitle>
          <CardDescription>Pilih posisi menu navigasi aplikasi sesuai preferensi kamu</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setNavPosition('sidebar')}
            className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${
              navPosition === 'sidebar'
                ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300'
            }`}
          >
            <PanelLeft className={`h-6 w-6 mt-0.5 ${navPosition === 'sidebar' ? 'text-primary-600' : 'text-gray-400'}`} />
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-zinc-100">Navigasi Samping (Sidebar)</div>
              <div className="text-xs text-gray-500 mt-1">Menu di sebelah kiri (Desktop) dan bawah (Mobile)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setNavPosition('bottom')}
            className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${
              navPosition === 'bottom'
                ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300'
            }`}
          >
            <PanelBottom className={`h-6 w-6 mt-0.5 ${navPosition === 'bottom' ? 'text-primary-600' : 'text-gray-400'}`} />
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-zinc-100">Navigasi Bawah (Bottom Bar)</div>
              <div className="text-xs text-gray-500 mt-1">Menu di bawah layar untuk semua perangkat</div>
            </div>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Warna Aksen Tema</CardTitle>
          <CardDescription>Pilih warna tema utama untuk tombol, badge, dan elemen aktif</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
              { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
              { id: 'violet', label: 'Violet', bg: 'bg-violet-600' },
              { id: 'rose', label: 'Rose', bg: 'bg-rose-600' },
              { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
              { id: 'teal', label: 'Teal', bg: 'bg-teal-600' },
            ].map((c) => {
              const active = accentColor === c.id || (!accentColor && c.id === 'emerald')
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setAccentColor(c.id as any)
                    toast({ title: 'Tema diperbarui', description: `Warna aksen diubah ke ${c.label}`, variant: 'success' })
                  }}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    active ? 'border-primary-600 bg-primary-50/40 dark:bg-primary-950/20 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300'
                  }`}
                >
                  <div className={`h-7 w-7 rounded-full ${c.bg} flex items-center justify-center text-white shadow-sm`}>
                    {active && <Check className="h-4 w-4" />}
                  </div>
                  <span className="text-xs font-medium text-gray-800 dark:text-zinc-200">{c.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {!isBalanceHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5 text-amber-500" />} Penyamaran Saldo Global
          </CardTitle>
          <CardDescription>Sembunyikan nominal angka saldo dan uang di seluruh halaman</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-medium text-sm text-gray-900 dark:text-zinc-100">
              {isBalanceHidden ? 'Status: Tersembunyi (•••••••)' : 'Status: Tampil Publik'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Cocok saat menggunakan aplikasi di area umum atau keramaian
            </div>
          </div>
          <Button
            variant={isBalanceHidden ? 'default' : 'outline'}
            onClick={() => {
              toggleBalanceHidden()
              toast({
                title: !isBalanceHidden ? 'Saldo Tersembunyi' : 'Saldo Ditampilkan',
                description: !isBalanceHidden ? 'Semua angka saldo kini disamarkan' : 'Angka saldo ditampilkan kembali',
                variant: 'success'
              })
            }}
          >
            {!isBalanceHidden ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {!isBalanceHidden ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Kelola Kategori</CardTitle>
          <CardDescription>Tambah kategori baru secara manual atau hapus kategori yang tidak dibutuhkan</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager />
        </CardContent>
      </Card>

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
        <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />Sinkronisasi</CardTitle><CardDescription>Data tersinkron otomatis antar HP & PC saat login dengan akun yang sama.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={async () => { await triggerCloudSync(); toast({ title: 'Sinkron selesai', description: 'Data terbaru dari akun dimuat', variant: 'success' }) }} disabled={isSyncing}><RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />{isSyncing ? 'Menyinkron...' : 'Sinkron sekarang'}</Button>
          <p className="text-xs text-gray-500">Gagal sinkron? Pastikan sudah login dan koneksi internet aktif. Jika masih gagal, jalankan query supabase/schema.sql di Dashboard Supabase.</p>
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
