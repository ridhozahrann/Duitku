'use client'

import { useState } from 'react'
import { Plus, Bell, Calendar, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { formatIDR, formatDate, parseThousands } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

export default function BillsPage() {
  const { bills, addBill, updateBill, deleteBill } = useStore()
  const { toast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Tagihan')
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [recurrence, setRecurrence] = useState<string>('monthly')

  const unpaid = bills.filter(b => b.status !== 'paid')
  const overdue = bills.filter(b => b.status === 'overdue')
  const upcoming = bills.filter(b => b.status === 'unpaid')
  const totalDue = unpaid.reduce((s, b) => s + b.amount, 0)

  // auto-mark overdue
  const isOverdue = (d: Date) => new Date(d).getTime() < Date.now() && new Date(d).toDateString() !== new Date().toDateString()

  const handleAdd = () => {
    const amt = parseThousands(amount)
    if (!name.trim() || !amt) { toast({ title: 'Gagal', description: 'Nama & nominal wajib diisi', variant: 'destructive' }); return }
    addBill({ name: name.trim(), amount: amt, category, dueDate, recurrence: recurrence as any, status: isOverdue(dueDate) ? 'overdue' : 'unpaid', notes: '' })
    toast({ title: 'Berhasil', description: `Tagihan "${name}" ditambah`, variant: 'success' })
    setName(''); setAmount(''); setShowAdd(false)
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Pengingat Tagihan</h1>
          <p className="text-gray-600 dark:text-zinc-400">{unpaid.length} belum dibayar • Total: {formatIDR(totalDue)}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Tambah Tagihan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={overdue.length ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Terlambat</CardTitle><AlertCircle className={`h-4 w-4 ${overdue.length ? 'text-red-600' : 'text-gray-400'}`} /></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${overdue.length ? 'text-red-600' : ''}`}>{overdue.length}</div><p className="text-sm text-gray-500 mt-1">Perlu segera dibayar</p></CardContent>
        </Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Mendatang</CardTitle><Clock className="h-4 w-4 text-blue-600" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{upcoming.length}</div><p className="text-sm text-gray-500 mt-1">Akan jatuh tempo</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Tagihan</CardTitle><Bell className="h-4 w-4 text-primary-600" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary-600">{formatIDR(totalDue)}</div><p className="text-sm text-gray-500 mt-1">Belum dibayar</p></CardContent></Card>
      </div>

      {unpaid.length ? (
        <div className="space-y-4">
          {unpaid.map(bill => {
            const overdueFlag = bill.status === 'overdue'
            const days = Math.floor((new Date(bill.dueDate).getTime() - Date.now()) / 86400000)
            return (
              <Card key={bill.id} className={overdueFlag ? 'border-red-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-medium">{bill.name}</h3>
                        <Badge variant={overdueFlag ? 'destructive' : 'outline'}>{overdueFlag ? 'Terlambat' : 'Belum Dibayar'}</Badge>
                        {bill.recurrence && <Badge variant="secondary" className="text-xs">{bill.recurrence === 'monthly' ? 'Bulanan' : bill.recurrence === 'weekly' ? 'Mingguan' : 'Tahunan'}</Badge>}
                      </div>
                      <div className="text-2xl font-bold mb-1">{formatIDR(bill.amount)}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(new Date(bill.dueDate))}</span>
                        <span className={overdueFlag ? 'text-red-600' : ''}>{overdueFlag ? 'Sudah lewat' : days > 0 ? `${days} hari lagi` : days === 0 ? 'Hari ini' : 'Terlambat'}</span>
                        <span className="text-xs">{bill.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => { updateBill(bill.id, { status: 'paid' }); toast({ title: 'Lunas', description: `${bill.name} ditandai lunas`, variant: 'success' }) }}><CheckCircle className="mr-2 h-4 w-4" />Lunas</Button>
                      <Button size="sm" variant="outline" onClick={() => { if (confirm('Hapus tagihan?')) deleteBill(bill.id) }}><Trash2 className="mr-2 h-4 w-4" />Hapus</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><CardContent className="pt-6"><div className="text-center py-12">
          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-6 w-6" /></div>
          <h3 className="text-lg font-medium mb-2">Semua tagihan lunas</h3><p className="text-gray-500 mb-6">Tidak ada tagihan belum dibayar</p>
          <Button onClick={() => setShowAdd(true)}>+ Tambah Tagihan Baru</Button>
        </div></CardContent></Card>
      )}

      {/* history paid */}
      {bills.filter(b => b.status === 'paid').length > 0 && (
        <Card><CardHeader><CardTitle>Riwayat Lunas ({bills.filter(b => b.status === 'paid').length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {bills.filter(b => b.status === 'paid').map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <span>{b.name} • {formatIDR(b.amount)}</span>
                <Button size="sm" variant="ghost" onClick={() => updateBill(b.id, { status: 'unpaid' })}>Batal lunas</Button>
              </div>
            ))}
          </CardContent></Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Tambah Tagihan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nama</Label><Input placeholder="Internet Kos" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Nominal (Rp)</Label><CurrencyInput placeholder="0" value={amount} onValueChange={setAmount} /></div>
            <div className="space-y-2"><Label>Kategori</Label><Input placeholder="Tagihan" value={category} onChange={e => setCategory(e.target.value)} /></div>
            <div className="space-y-2"><Label>Periode</Label>
              <Select value={recurrence} onValueChange={setRecurrence}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="weekly">Mingguan</SelectItem><SelectItem value="monthly">Bulanan</SelectItem><SelectItem value="yearly">Tahunan</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Jatuh tempo</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(dueDate, 'PPP', { locale: id })}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={dueDate} onSelect={d => d && setDueDate(d)} /></PopoverContent></Popover>
            </div>
            <Button className="w-full" onClick={handleAdd}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
