'use client'

import { Fragment, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/useToast'

function toISO(d: Date) { return d.toISOString().slice(0, 10) }

export default function HabitsPage() {
  const { habits, habitLogs, toggleHabitLog, addHabit, deleteHabit, transactions } = useStore()
  const { toast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⭐')

  const days = useMemo(() => {
    const arr: { date: string; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      arr.push({ date: toISO(d), label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }) })
    }
    return arr
  }, [])

  // streak: count consecutive logged days ending today
  const streak = useMemo(() => {
    const set = new Set(habitLogs.map(l => l.date))
    // if no logs, streak 0; check today backwards
    let s = 0
    for (let i = 0; i < 30; i++) {
      const d = toISO(new Date(Date.now() - i * 86400000))
      if (set.has(d)) s++
      else if (i === 0) break
      else if (s > 0) break
    }
    return s
  }, [habitLogs])

  // weekly completion: logs in last 7 days
  const weeklyLogs = useMemo(() => habitLogs.filter(l => days.some(d => d.date === l.date)).length, [habitLogs, days])
  // auto habit: catat transaksi harian counts as log
  const txDays = useMemo(() => new Set(transactions.map(t => toISO(new Date(t.date)))), [transactions])

  const handleAdd = () => {
    if (!name.trim()) { toast({ title: 'Gagal', description: 'Nama wajib diisi', variant: 'destructive' }); return }
    addHabit({ name: name.trim(), icon: icon.trim() || '⭐', targetPerWeek: 7 })
    toast({ title: 'Berhasil', description: `Kebiasaan "${name}" ditambah`, variant: 'success' })
    setName(''); setIcon('⭐'); setShowAdd(false)
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Kebiasaan Harian</h1><p className="text-gray-600 dark:text-zinc-400">Bangun kebiasaan keuangan sehat</p></div>
        <Button onClick={() => setShowAdd(true)}>+ Tambah Kebiasaan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Streak</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">🔥 {streak} hari</div><p className="text-sm text-gray-500">Hari berturut catat kebiasaan</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Minggu Ini</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{weeklyLogs} cek</div><p className="text-sm text-gray-500">Total cek 7 hari terakhir</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Catat Transaksi</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{txDays.size} hari</div><p className="text-sm text-gray-500">Hari berbeda ada transaksi</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tracker 7 Hari</CardTitle><CardDescription>Tap kotak untuk tandai selesai. Data tersimpan lokal.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="grid gap-2" style={{ gridTemplateColumns: `180px repeat(7, 1fr)` }}>
              <div className="text-sm font-medium text-gray-500 py-2">Kebiasaan</div>
              {days.map(d => <div key={d.date} className="text-center text-xs font-medium py-2">{d.label}<br /><span className="text-gray-400">{d.date.slice(5)}</span></div>)}
              {habits.map(h => (
                <Fragment key={h.id}>
                  <div className="flex items-center gap-2 py-2 text-sm font-medium">
                    <span>{h.icon}</span><span className="truncate">{h.name}</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 px-1 text-xs" onClick={() => { if (confirm(`Hapus "${h.name}"?`)) deleteHabit(h.id) }}>✕</Button>
                  </div>
                  {days.map(d => {
                    const checked = habitLogs.some(l => l.habitId === h.id && l.date === d.date)
                    return (
                      <button key={`${h.id}-${d.date}`} onClick={() => toggleHabitLog(h.id, d.date)}
                        className={`h-10 rounded-lg border flex items-center justify-center text-lg transition ${checked ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-green-300'}`}>
                        {checked ? '✓' : ''}
                      </button>
                    )
                  })}
                </Fragment>
              ))}
            </div>
            {habits.length === 0 && <p className="text-center text-gray-500 py-8">Belum ada kebiasaan. Tambah di atas.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Progress Mingguan</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {habits.map(h => {
            const count = habitLogs.filter(l => l.habitId === h.id && days.some(d => d.date === l.date)).length
            const pct = Math.min(100, (count / h.targetPerWeek) * 100)
            return (
              <div key={h.id} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{h.icon} {h.name}</span><span>{count}/{h.targetPerWeek}</span></div>
                <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${pct}%` }} /></div>
              </div>
            )
          })}
          {habits.length === 0 && <p className="text-sm text-gray-500">Tambah kebiasaan untuk lihat progress.</p>}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>Tambah Kebiasaan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nama</Label><Input placeholder="Misal: Catat pengeluaran" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Icon (emoji)</Label><Input placeholder="⭐" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2} /></div>
            <Button className="w-full" onClick={handleAdd}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
