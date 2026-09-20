'use client'

import { useState } from 'react'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { Transaction } from '@/types'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatIDR, formatRelativeTime, formatTime } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/useToast'
import TransactionDialog from './TransactionDialog'

export default function TransactionItem({ transaction, showTime = false }: { transaction: Transaction; showTime?: boolean }) {
  const { toast } = useToast()
  const { deleteTransaction, categories, isBalanceHidden } = useStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const category = categories.find(c => c.id === transaction.categoryId)

  const handleDelete = async () => {
    if (!confirm('Hapus transaksi ini?')) return
    try {
      setIsDeleting(true)
      deleteTransaction(transaction.id)
      toast({ title: 'Berhasil', description: 'Transaksi dihapus', variant: 'success' })
    } catch {
      toast({ title: 'Gagal', description: 'Gagal menghapus', variant: 'destructive' })
    } finally { setIsDeleting(false) }
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors group">
        <div className="flex items-start gap-3 flex-1">
          <div className={`flex items-center justify-center h-10 w-10 rounded-full ${transaction.type === 'income' ? 'bg-income-100 text-income-600' : 'bg-expense-100 text-expense-600'}`}>
            <span className="text-lg">{category?.icon || '📦'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div><h4 className="font-medium text-gray-900 dark:text-zinc-100 truncate">{category?.name || 'Lainnya'}</h4>{transaction.description && <p className="text-sm text-gray-500 truncate">{transaction.description}</p>}</div>
              <div className={`font-semibold ${transaction.type === 'income' ? 'text-income-600' : 'text-expense-600'}`}>{transaction.type === 'income' ? '+' : '-'}{formatIDR(transaction.amount, isBalanceHidden)}</div>
            </div>
            <div className="text-xs text-gray-500">{formatRelativeTime(new Date(transaction.date))}{showTime && ` • ${formatTime(new Date(transaction.date))}`}</div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEdit(true)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />{isDeleting ? 'Menghapus...' : 'Hapus'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TransactionDialog open={showEdit} onOpenChange={setShowEdit} transactionId={transaction.id} />
    </>
  )
}
