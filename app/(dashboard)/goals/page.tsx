'use client'

import { useState } from 'react'
import { Target, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { formatIDR, parseThousands } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useToast } from '@/hooks/useToast'

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore()
  const { toast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [topUpId, setTopUpId] = useState<string | null>(null)
  const [topUpAmt, setTopUpAmt] = useState('')

  const handleAdd = () => {
    if (!name.trim()) { toast({ title: 'Gagal', description: 'Nama wajib diisi', variant: 'destructive' }); return }
    const t = parseThousands(target)
    if (!t || t <= 0) { toast({ title: 'Gagal', description: 'Target tidak valid', variant: 'destructive' }); return }
    addGoal({ name: name.trim(), target: t, current: 0 })
    toast({ title: 'Berhasil', description: `Goal "${name}" dibuat`, variant: 'success' })
    setName(''); setTarget(''); setShowAdd(false)
  }

  const handleTopUp = (id: string) => {
    const amt = parseThousands(topUpAmt)
    if (!amt || amt <= 0) { toast({ title: 'Gagal', description: 'Nominal tidak valid', variant: 'destructive' }); return }
    const g = goals.find(x => x.id === id)
    if (!g) return
    updateGoal(id, { current: g.current + amt })
    toast({ title: 'Berhasil', description: `Tambah ${formatIDR(amt)} ke ${g.name}`, variant: 'success' })
    setTopUpAmt(''); setTopUpId(null)
  }

  const totalTarget = goals.reduce((s,g)=>s+g.target,0)
  const totalCurrent = goals.reduce((s,g)=>s+g.current,0)

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Target Nabung</h1><p className="text-gray-600 dark:text-zinc-400">{formatIDR(totalCurrent)} / {formatIDR(totalTarget)} terkumpul</p></div>
        <Button onClick={()=>setShowAdd(true)}>+ Buat Target</Button>
      </div>

      {goals.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = g.target ? Math.min(100, (g.current / g.target) * 100) : 0
            const done = g.current >= g.target
            return (
              <Card key={g.id} className={done ? 'border-green-300 bg-green-50 dark:bg-green-950/20' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{g.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={()=>{ if(confirm(`Hapus "${g.name}"?`)) deleteGoal(g.id)}}>Hapus</Button>
                  </div>
                  <CardDescription>{formatIDR(g.current)} / {formatIDR(g.target)} • {pct.toFixed(0)}%</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden"><div className={`h-full ${done?'bg-green-500':'bg-primary-500'}`} style={{width:`${pct}%`}} /></div>
                  {done ? <p className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Tercapai!</p> : <p className="text-sm text-gray-500">Sisa {formatIDR(g.target - g.current)}</p>}
                  <div className="flex gap-2">
                    {topUpId===g.id ? (
                      <>
                        <CurrencyInput placeholder="Nominal" value={topUpAmt} onValueChange={setTopUpAmt} className="flex-1" />
                        <Button size="sm" onClick={()=>handleTopUp(g.id)}>Simpan</Button>
                        <Button size="sm" variant="ghost" onClick={()=>setTopUpId(null)}>Batal</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={()=>setTopUpId(g.id)}>+ Nabung</Button>
                        <Button size="sm" variant="ghost" onClick={()=>{ const v = prompt('Kurangi nominal?','0'); const n = Number(v); if(n>0) updateGoal(g.id,{ current: Math.max(0,g.current-n)})}}>Kurangi</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><CardContent className="pt-6 text-center py-12">
          <Target className="h-10 w-10 text-primary-500 mx-auto mb-3" /><h3 className="font-medium mb-2">Belum ada target</h3><p className="text-gray-500 mb-4 text-sm">Buat target nabung: HP baru, liburan, dana darurat</p>
          <Button onClick={()=>setShowAdd(true)}>+ Buat Target Pertama</Button>
        </CardContent></Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>Buat Target Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nama target</Label><Input placeholder="Misal: Laptop baru" value={name} onChange={e=>setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Target (Rp)</Label><CurrencyInput placeholder="5.000.000" value={target} onValueChange={setTarget} /></div>
            <Button className="w-full" onClick={handleAdd}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
