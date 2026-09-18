'use client'

import { useState } from 'react'
import { Plus, Wallet as WalletIcon, ArrowLeftRight, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { formatIDR, parseThousands } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useToast } from '@/hooks/useToast'

export default function WalletsPage() {
  const { wallets, addWallet, deleteWallet, transferWallet } = useStore()
  const { toast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

  const handleAdd = () => {
    if (!name.trim()) { toast({ title: 'Gagal', description: 'Nama kantong wajib diisi', variant: 'destructive' }); return }
    addWallet({ name: name.trim(), description: '', balance: parseThousands(balance) || 0, budgetLimit: budgetLimit ? parseThousands(budgetLimit) : undefined, icon: 'wallet', color: 'blue' })
    toast({ title: 'Berhasil', description: `Kantong "${name}" dibuat`, variant: 'success' })
    setName(''); setBalance(''); setBudgetLimit(''); setShowAdd(false)
  }

  const handleTransfer = () => {
    const amt = parseThousands(amount)
    if (!fromId || !toId) { toast({ title: 'Gagal', description: 'Pilih kantong asal & tujuan', variant: 'destructive' }); return }
    if (fromId === toId) { toast({ title: 'Gagal', description: 'Kantong asal & tujuan harus beda', variant: 'destructive' }); return }
    if (!amt || amt <= 0) { toast({ title: 'Gagal', description: 'Nominal tidak valid', variant: 'destructive' }); return }
    const from = wallets.find(w => w.id === fromId)
    if (from && from.balance < amt) { toast({ title: 'Gagal', description: 'Saldo kantong asal tidak cukup', variant: 'destructive' }); return }
    transferWallet(fromId, toId, amt)
    toast({ title: 'Berhasil', description: `Transfer ${formatIDR(amt)} berhasil`, variant: 'success' })
    setAmount(''); setShowTransfer(false)
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Kantong Uang</h1>
          <p className="text-gray-600 dark:text-zinc-400">Kelola uang berdasarkan kebutuhan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowTransfer(true)} disabled={wallets.length < 2}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />Transfer
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />Tambah Kantong
          </Button>
        </div>
      </div>

      <Card className="bg-primary-50 border-primary-100 dark:bg-zinc-900 dark:border-zinc-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 bg-primary-100 text-primary-600 rounded-full mb-4"><WalletIcon className="h-6 w-6" /></div>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Total Saldo Semua Kantong</p>
            <div className="text-3xl font-bold text-primary-700 dark:text-zinc-100">{formatIDR(totalBalance)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{wallet.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Hapus ${wallet.name}?`)) deleteWallet(wallet.id) }}>
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
              {wallet.description && <p className="text-sm text-gray-500">{wallet.description}</p>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{formatIDR(wallet.balance)}</div>
                  <p className="text-sm text-gray-500">Saldo saat ini</p>
                </div>
                {wallet.budgetLimit ? (
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Batas</span><span className="font-medium">{formatIDR(wallet.budgetLimit)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${wallet.balance >= wallet.budgetLimit ? 'bg-expense-500' : 'bg-primary-500'} rounded-full`} style={{ width: `${Math.min((wallet.balance / wallet.budgetLimit) * 100, 100)}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Tambah Kantong</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nama kantong</Label><Input placeholder="Misal: Tabungan Kos" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Saldo awal (Rp)</Label><CurrencyInput placeholder="0" value={balance} onValueChange={setBalance} /></div>
            <div className="space-y-2"><Label>Batas pengeluaran (opsional)</Label><CurrencyInput placeholder="0" value={budgetLimit} onValueChange={setBudgetLimit} /></div>
            <Button className="w-full" onClick={handleAdd}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Transfer Antar Kantong</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Dari</Label>
              <Select value={fromId} onValueChange={setFromId}><SelectTrigger><SelectValue placeholder="Pilih kantong asal" /></SelectTrigger><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name} — {formatIDR(w.balance)}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Ke</Label>
              <Select value={toId} onValueChange={setToId}><SelectTrigger><SelectValue placeholder="Pilih kantong tujuan" /></SelectTrigger><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Nominal</Label><CurrencyInput placeholder="0" value={amount} onValueChange={setAmount} /></div>
            <Button className="w-full" onClick={handleTransfer}>Transfer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
