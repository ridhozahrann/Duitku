'use client'

import { useState } from 'react'
import { Plus, Bell, Calendar, CheckCircle, AlertCircle, Clock, Trash2, PauseCircle, PlayCircle, Edit3, CalendarIcon, CheckCircle2 } from 'lucide-react'
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
import { Bill } from '@/types'

function getNextDueDate(currentDate: Date, recurrence: 'weekly' | 'monthly' | 'yearly'): Date {
  const d = new Date(currentDate)
  if (recurrence === 'weekly') {
    d.setDate(d.getDate() + 7)
  } else if (recurrence === 'monthly') {
    d.setMonth(d.getMonth() + 1)
  } else if (recurrence === 'yearly') {
    d.setFullYear(d.getFullYear() + 1)
  }
  return d
}

function getPrevDueDate(currentDate: Date, recurrence: 'weekly' | 'monthly' | 'yearly'): Date {
  const d = new Date(currentDate)
  if (recurrence === 'weekly') {
    d.setDate(d.getDate() - 7)
  } else if (recurrence === 'monthly') {
    d.setMonth(d.getMonth() - 1)
  } else if (recurrence === 'yearly') {
    d.setFullYear(d.getFullYear() - 1)
  }
  return d
}

export default function BillsPage() {
  const { bills, addBill, updateBill, deleteBill, addTransaction, wallets } = useStore()
  const { toast } = useToast()

  const [showAdd, setShowAdd] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Tagihan')
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [recurrence, setRecurrence] = useState<string>('monthly')

  const isOverdue = (d: Date) => {
    const target = new Date(d)
    const today = new Date()
    target.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return target.getTime() < today.getTime()
  }

  // Tagihan yang di-pause
  const pausedBills = bills.filter(b => b.status === 'paused')

  // Tagihan sekali bayar yang sudah lunas
  const paidOnceBills = bills.filter(b => b.status === 'paid')

  // Tagihan berulang yang tanggal jatuh temponya masih di MASA DEPAN (berarti siklus bulan ini sudah lunas)
  const paidThisCycleBills = bills.filter(b => {
    if (b.status === 'paused' || b.status === 'paid') return false
    if (!b.recurrence || b.recurrence === 'once') return false
    const d = new Date(b.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d.getTime() > today.getTime()
  })

  // Tagihan yang perlu dibayar sekarang (jatuh tempo hari ini atau sudah lewat)
  const dueBills = bills.filter(b => {
    if (b.status === 'paused' || b.status === 'paid') return false
    if (!b.recurrence || b.recurrence === 'once') return true
    const d = new Date(b.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d.getTime() <= today.getTime()
  })

  const overdueBills = dueBills.filter(b => isOverdue(b.dueDate))
  const totalActiveDue = dueBills.reduce((s, b) => s + b.amount, 0)

  const resetForm = () => {
    setName('')
    setAmount('')
    setCategory('Tagihan')
    setDueDate(new Date())
    setRecurrence('monthly')
    setEditingBill(null)
  }

  const openAddDialog = () => {
    resetForm()
    setShowAdd(true)
  }

  const openEditDialog = (bill: Bill) => {
    setEditingBill(bill)
    setName(bill.name)
    setAmount(String(bill.amount))
    setCategory(bill.category || 'Tagihan')
    setDueDate(new Date(bill.dueDate))
    setRecurrence(bill.recurrence || 'monthly')
    setShowAdd(true)
  }

  const handleSave = () => {
    const amt = parseThousands(amount)
    if (!name.trim() || !amt || amt <= 0) {
      toast({ title: 'Gagal', description: 'Nama & nominal wajib diisi dengan benar', variant: 'destructive' })
      return
    }

    const rec = recurrence === 'none' ? undefined : (recurrence as 'once' | 'weekly' | 'monthly' | 'yearly')
    const calculatedStatus = isOverdue(dueDate) ? 'overdue' : 'unpaid'

    if (editingBill) {
      updateBill(editingBill.id, {
        name: name.trim(),
        amount: amt,
        category,
        dueDate,
        recurrence: rec,
        status: editingBill.status === 'paused' ? 'paused' : calculatedStatus,
      })
      toast({ title: 'Berhasil', description: `Tagihan "${name}" diperbarui`, variant: 'success' })
    } else {
      addBill({
        name: name.trim(),
        amount: amt,
        category,
        dueDate,
        recurrence: rec,
        status: calculatedStatus,
        notes: '',
      })
      toast({ title: 'Berhasil', description: `Tagihan "${name}" ditambahkan`, variant: 'success' })
    }

    resetForm()
    setShowAdd(false)
  }

  const handleMarkPaid = (bill: Bill) => {
    const defaultWalletId = wallets[0]?.id

    // Catat transaksi pengeluaran otomatis di store
    addTransaction({
      type: 'expense',
      amount: bill.amount,
      categoryId: 'bills',
      walletId: defaultWalletId,
      description: `Bayar tagihan: ${bill.name}`,
      date: new Date(),
    })

    if (bill.recurrence && bill.recurrence !== 'once') {
      const nextDate = getNextDueDate(new Date(bill.dueDate), bill.recurrence)

      updateBill(bill.id, {
        dueDate: nextDate,
        status: 'unpaid',
      })

      toast({
        title: 'Lunas & Dicatat ke Transaksi',
        description: `${bill.name} lunas bulan ini. Pembayaran selanjutnya: ${formatDate(nextDate)}`,
        variant: 'success',
      })
    } else {
      updateBill(bill.id, { status: 'paid' })
      toast({
        title: 'Lunas & Dicatat ke Transaksi',
        description: `Tagihan ${bill.name} ditandai lunas`,
        variant: 'success',
      })
    }
  }

  const handleUndoPaid = (bill: Bill) => {
    if (bill.recurrence && bill.recurrence !== 'once') {
      const prevDate = getPrevDueDate(new Date(bill.dueDate), bill.recurrence)
      updateBill(bill.id, {
        dueDate: prevDate,
        status: isOverdue(prevDate) ? 'overdue' : 'unpaid',
      })
      toast({ title: 'Status Di-reset', description: `Tagihan ${bill.name} kembali ke jatuh tempo ${formatDate(prevDate)}` })
    } else {
      updateBill(bill.id, { status: 'unpaid' })
      toast({ title: 'Batal Lunas', description: `Tagihan ${bill.name} kembali belum lunas` })
    }
  }

  const handleTogglePause = (bill: Bill) => {
    if (bill.status === 'paused') {
      const newStatus = isOverdue(new Date(bill.dueDate)) ? 'overdue' : 'unpaid'
      updateBill(bill.id, { status: newStatus })
      toast({ title: 'Tagihan Diaktifkan', description: `${bill.name} aktif kembali.`, variant: 'success' })
    } else {
      updateBill(bill.id, { status: 'paused' })
      toast({ title: 'Tagihan Di-pause', description: `${bill.name} di-pause (libur semester).`, variant: 'default' })
    }
  }

  const getRecurrenceLabel = (rec?: string) => {
    switch (rec) {
      case 'weekly': return 'Mingguan'
      case 'monthly': return 'Bulanan'
      case 'yearly': return 'Tahunan'
      case 'once': return 'Sekali Bayar'
      default: return 'Sekali Bayar'
    }
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Pengingat Tagihan</h1>
          <p className="text-gray-600 dark:text-zinc-400">
            {dueBills.length} perlu dibayar • Total: {formatIDR(totalActiveDue)}
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />Tambah Tagihan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={overdueBills.length ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perlu Dibayar</CardTitle>
            <AlertCircle className={`h-4 w-4 ${overdueBills.length ? 'text-red-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueBills.length ? 'text-red-600' : ''}`}>{dueBills.length}</div>
            <p className="text-xs text-gray-500 mt-1">Jatuh tempo / Terlambat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lunas Bulan Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidThisCycleBills.length}</div>
            <p className="text-xs text-gray-500 mt-1">Pembayaran berikutnya terjadwal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Di-pause (Libur)</CardTitle>
            <PauseCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pausedBills.length}</div>
            <p className="text-xs text-gray-500 mt-1">Diberhentikan sementara</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Perlu Dibayar</CardTitle>
            <Bell className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">{formatIDR(totalActiveDue)}</div>
            <p className="text-xs text-gray-500 mt-1">Tagihan aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* 1. Tagihan Perlu Dibayar Sekarang */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-500" /> Perlu Dibayar Sekarang ({dueBills.length})
        </h2>
        {dueBills.length ? (
          <div className="space-y-4">
            {dueBills.map(bill => {
              const overdueFlag = isOverdue(new Date(bill.dueDate))
              const days = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / 86400000)

              return (
                <Card key={bill.id} className={overdueFlag ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{bill.name}</h3>
                          <Badge variant={overdueFlag ? 'destructive' : 'outline'}>
                            {overdueFlag ? 'Terlambat' : 'Belum Dibayar'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getRecurrenceLabel(bill.recurrence)}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                          {formatIDR(bill.amount)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-4 w-4" /> Jatuh Tempo: {formatDate(new Date(bill.dueDate))}
                          </span>
                          <span className={overdueFlag ? 'text-red-600 font-semibold' : 'text-blue-600 font-medium'}>
                            {overdueFlag ? 'Lewat tanggal jatuh tempo' : days > 0 ? `${days} hari lagi` : days === 0 ? 'Hari ini!' : 'Terlambat'}
                          </span>
                          <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{bill.category}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <Button size="sm" onClick={() => handleMarkPaid(bill)} className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="mr-2 h-4 w-4" />Bayar Bulan Ini
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleTogglePause(bill)} className="flex-1 sm:flex-initial text-amber-600 hover:text-amber-700">
                          <PauseCircle className="mr-2 h-4 w-4" />Jeda (Libur)
                        </Button>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(bill)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Hapus tagihan "${bill.name}"?`)) deleteBill(bill.id) }} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card><CardContent className="pt-6 text-center py-8 text-gray-500">Semua tagihan periode ini sudah lunas</CardContent></Card>
        )}
      </div>

      {/* 2. Lunas Bulan Ini & Jadwal Pembayaran Selanjutnya */}
      {paidThisCycleBills.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Lunas Bulan Ini & Pembayaran Selanjutnya ({paidThisCycleBills.length})
          </h2>
          <div className="space-y-3">
            {paidThisCycleBills.map(bill => {
              const nextDate = new Date(bill.dueDate)
              const daysLeft = Math.ceil((nextDate.getTime() - Date.now()) / 86400000)

              return (
                <Card key={bill.id} className="border-green-200 bg-green-50/40 dark:bg-green-950/10">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-zinc-100">{bill.name}</h3>
                          <Badge className="bg-green-600 text-white hover:bg-green-700">
                            Lunas Bulan Ini
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getRecurrenceLabel(bill.recurrence)}
                          </Badge>
                        </div>

                        <div className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                          {formatIDR(bill.amount)}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300 font-medium">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span>Pembayaran selanjutnya: <strong>{formatDate(nextDate)}</strong></span>
                          <span className="text-xs text-gray-500 font-normal">({daysLeft} hari lagi • tiap tgl {nextDate.getDate()})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => handleTogglePause(bill)} className="text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
                          <PauseCircle className="mr-1 h-3.5 w-3.5" />Jeda (Libur)
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleUndoPaid(bill)} className="text-xs text-gray-500 hover:text-gray-900">
                          Batal lunas
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(bill)} className="text-xs">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Tagihan Di-pause (Libur Semester) */}
      {pausedBills.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <PauseCircle className="h-5 w-5" /> Di-pause / Libur Semester ({pausedBills.length})
          </h2>
          <div className="space-y-3">
            {pausedBills.map(bill => (
              <Card key={bill.id} className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/10">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-zinc-100">{bill.name}</h4>
                        <Badge variant="outline" className="text-amber-700 border-amber-300">Di-pause</Badge>
                        <Badge variant="secondary" className="text-xs">{getRecurrenceLabel(bill.recurrence)}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{formatIDR(bill.amount)} • Terakhir jatuh tempo: {formatDate(new Date(bill.dueDate))}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleTogglePause(bill)} className="text-green-600 border-green-200 hover:bg-green-50">
                        <PlayCircle className="mr-1 h-4 w-4" />Aktifkan Kembali
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm('Hapus tagihan ini?')) deleteBill(bill.id) }} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 4. Riwayat Tagihan Sekali Bayar yang Lunas */}
      {paidOnceBills.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Riwayat Lunas ({paidOnceBills.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {paidOnceBills.map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0 dark:border-zinc-800">
                <div>
                  <span className="font-medium">{b.name}</span> • <span className="text-gray-500">{formatIDR(b.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => updateBill(b.id, { status: 'unpaid' })} className="text-xs">
                    Batal lunas
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteBill(b.id)} className="text-xs text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialog Add / Edit */}
      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editingBill ? 'Edit Tagihan' : 'Tambah Tagihan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Tagihan</Label>
              <Input placeholder="Misal: WiFi Kos / Listrik" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <CurrencyInput placeholder="150.000" value={amount} onValueChange={setAmount} />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input placeholder="Tagihan" value={category} onChange={e => setCategory(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Periode Berulang</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan (Tiap Bulan)</SelectItem>
                  <SelectItem value="weekly">Mingguan (Tiap Minggu)</SelectItem>
                  <SelectItem value="yearly">Tahunan (Tiap Tahun)</SelectItem>
                  <SelectItem value="none">Sekali Bayar (Tidak Berulang)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jatuh Tempo Pembayaran</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />{format(dueDate, 'PPP', { locale: id })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={dueDate} onSelect={d => d && setDueDate(d)} />
                </PopoverContent>
              </Popover>
            </div>

            <Button className="w-full" onClick={handleSave}>
              {editingBill ? 'Simpan Perubahan' : 'Simpan Tagihan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
