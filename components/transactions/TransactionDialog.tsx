'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Wallet, Tag, FileText, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { formatThousands, parseThousands } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { useStore } from '@/store/useStore'
import { defaultCategories } from '@/lib/defaultData'
import { formatIDR } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(1, 'Nominal harus lebih dari 0'),
  categoryId: z.string().min(1, 'Pilih kategori'),
  walletId: z.string().optional(),
  description: z.string().optional(),
  date: z.date(),
})

type FormData = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId?: string
  defaultType?: 'income' | 'expense'
}

export default function TransactionDialog({ open, onOpenChange, transactionId, defaultType = 'expense' }: Props) {
  const { toast } = useToast()
  const { addTransaction, updateTransaction, transactions, wallets } = useStore()
  const editing = transactions.find(t => t.id === transactionId)

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'expense', amount: undefined, categoryId: '', walletId: wallets[0]?.id || '', description: '', date: new Date() },
  })

  useEffect(() => {
    if (open && editing) {
      reset({ type: editing.type, amount: editing.amount, categoryId: editing.categoryId, walletId: editing.walletId || wallets[0]?.id, description: editing.description, date: new Date(editing.date) })
    } else if (open && !editing) {
      reset({ type: defaultType, amount: undefined, categoryId: '', walletId: wallets[0]?.id || '', description: '', date: new Date() })
    }
  }, [open, editing, wallets, reset, defaultType])

  const selectedType = watch('type')
  const amount = watch('amount')
  const categories = defaultCategories.filter(cat => cat.type === selectedType)

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        updateTransaction(editing.id, { ...data, description: data.description || '' })
        toast({ title: 'Berhasil!', description: 'Transaksi diperbarui', variant: 'success' })
      } else {
        addTransaction({ ...data, description: data.description || '' })
        toast({ title: 'Berhasil!', description: `Transaksi ${data.type === 'income' ? 'pemasukan' : 'pengeluaran'} ditambahkan`, variant: 'success' })
      }
      reset()
      onOpenChange(false)
    } catch {
      toast({ title: 'Gagal', description: 'Gagal menyimpan transaksi', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={selectedType === 'expense' ? 'expense' : 'outline'} onClick={() => { setValue('type', 'expense'); setValue('categoryId', '') }} className="py-3">Pengeluaran</Button>
            <Button type="button" variant={selectedType === 'income' ? 'income' : 'outline'} onClick={() => { setValue('type', 'income'); setValue('categoryId', '') }} className="py-3">Pemasukan</Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Nominal ({selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'})</Label>
            <div className="relative">
              <CurrencyInput id="amount" placeholder="0" value={String(amount ?? '').replace(/\D/g,'')} onValueChange={v => setValue('amount', parseThousands(v) || (undefined as any), { shouldValidate: true })} className="text-2xl font-bold pl-12" />
              <input type="hidden" {...register('amount')} />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</div>
            </div>
            {amount ? <div className="text-sm text-gray-600">Ditulis: {formatIDR(Number(String(amount).replace(/\D/g,'')) || amount as number)} • Ketik: {formatThousands(String(amount))}</div> : null}
            {errors.amount && <div className="text-sm text-red-600">{errors.amount.message}</div>}
          </div>

          <div className="space-y-2">
            <Label><Tag className="inline h-4 w-4 mr-2" />Kategori</Label>
            <Select value={watch('categoryId')} onValueChange={(value) => setValue('categoryId', value)}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
            </Select>
            {errors.categoryId && <div className="text-sm text-red-600">{errors.categoryId.message}</div>}
          </div>

          <div className="space-y-2">
            <Label><Wallet className="inline h-4 w-4 mr-2" />Kantong Uang</Label>
            <Select value={watch('walletId')} onValueChange={(value) => setValue('walletId', value)}>
              <SelectTrigger><SelectValue placeholder="Pilih kantong" /></SelectTrigger>
              <SelectContent>{wallets.map((w) => <SelectItem key={w.id} value={w.id}><span>{w.name} — {formatIDR(w.balance)}</span></SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label><Calendar className="inline h-4 w-4 mr-2" />Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{watch('date') ? format(watch('date'), 'PPP', { locale: id }) : 'Pilih tanggal'}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={watch('date')} onSelect={(date) => date && setValue('date', date)} /></PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description"><FileText className="inline h-4 w-4 mr-2" />Catatan (opsional)</Label>
            <Textarea id="description" placeholder="Tambahkan catatan..." {...register('description')} className="resize-none" rows={3} />
          </div>

          <Button type="submit" className="w-full py-3 text-lg">{editing ? 'Simpan Perubahan' : 'Simpan Transaksi'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
