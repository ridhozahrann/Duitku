'use client'

import { useState } from 'react'
import { Plus, Trash2, Tag, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/useToast'

const EMOJI_PRESETS = [
  '🍔', '☕', '🚗', '🏠', '📱', '📚', '🛍️', '🎬', 
  '🏥', '💼', '🎓', '💸', '🎁', '📦', '💻', '🏋️', 
  '🎮', '🛵', '✈️', '🐾', '💊', '⚡', '🎨', '🛒',
  '💰', '📈', '💵', '💳', '🏦', '💎', '🚀', '⭐'
]

const COLOR_OPTIONS = [
  { id: 'red', label: 'Merah', bg: 'bg-red-500' },
  { id: 'blue', label: 'Biru', bg: 'bg-blue-500' },
  { id: 'green', label: 'Hijau', bg: 'bg-green-500' },
  { id: 'purple', label: 'Ungu', bg: 'bg-purple-500' },
  { id: 'orange', label: 'Oranye', bg: 'bg-orange-500' },
  { id: 'pink', label: 'Merah Muda', bg: 'bg-pink-500' },
  { id: 'yellow', label: 'Kuning', bg: 'bg-yellow-500' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-500' },
  { id: 'gray', label: 'Abu-abu', bg: 'bg-gray-500' },
]

export default function CategoryManager() {
  const { categories, addCategory, deleteCategory, transactions } = useStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState('gray')
  const [type, setType] = useState<'expense' | 'income'>('expense')

  const filteredCategories = categories.filter(c => c.type === activeTab)

  const resetForm = () => {
    setName('')
    setIcon('📦')
    setColor('gray')
    setType(activeTab)
  }

  const openAddDialog = () => {
    resetForm()
    setType(activeTab)
    setShowAdd(true)
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Gagal', description: 'Nama kategori wajib diisi', variant: 'destructive' })
      return
    }

    addCategory({
      id: `cat-${Date.now()}`,
      name: name.trim(),
      type,
      icon: icon.trim() || '📦',
      color,
    })

    toast({ title: 'Berhasil', description: `Kategori "${name}" ditambahkan`, variant: 'success' })
    setShowAdd(false)
    resetForm()
  }

  const handleDelete = (categoryId: string, categoryName: string) => {
    const usageCount = transactions.filter(t => t.categoryId === categoryId).length
    if (usageCount > 0) {
      if (!confirm(`Kategori "${categoryName}" digunakan dalam ${usageCount} transaksi. Hapus kategori ini?`)) {
        return
      }
    } else {
      if (!confirm(`Hapus kategori "${categoryName}"?`)) {
        return
      }
    }

    deleteCategory(categoryId)
    toast({ title: 'Dihapus', description: `Kategori "${categoryName}" berhasil dihapus`, variant: 'success' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={activeTab === 'expense' ? 'expense' : 'outline'}
            onClick={() => setActiveTab('expense')}
          >
            Pengeluaran ({categories.filter(c => c.type === 'expense').length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'income' ? 'income' : 'outline'}
            onClick={() => setActiveTab('income')}
          >
            Pemasukan ({categories.filter(c => c.type === 'income').length})
          </Button>
        </div>

        <Button size="sm" onClick={openAddDialog}>
          <Plus className="mr-1.5 h-4 w-4" />Tambah Kategori
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredCategories.map((c) => {
          const count = transactions.filter(t => t.categoryId === c.id).length
          return (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{c.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-zinc-100 truncate">
                    {c.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {count} transaksi
                  </div>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(c.id, c.name)}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tipe Kategori</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === 'expense' ? 'expense' : 'outline'}
                  onClick={() => setType('expense')}
                >
                  Pengeluaran
                </Button>
                <Button
                  type="button"
                  variant={type === 'income' ? 'income' : 'outline'}
                  onClick={() => setType('income')}
                >
                  Pemasukan
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Kategori</Label>
              <Input
                placeholder="Misal: Kopi & Nongkrong, Gym, Investasi"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Pilih Simbol / Icon Emoji</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="w-16 text-center text-xl"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  maxLength={4}
                />
                <div className="text-xs text-gray-500 flex-1">
                  Ketik emoji atau pilih dari preset di bawah
                </div>
              </div>

              <div className="grid grid-cols-8 gap-1.5 p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg max-h-32 overflow-y-auto">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`p-1.5 rounded text-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ${icon === e ? 'bg-primary-100 dark:bg-primary-900/50 ring-1 ring-primary-500' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warna Tema</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`h-7 w-7 rounded-full ${c.bg} flex items-center justify-center text-white transition-transform ${color === c.id ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {color === c.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full mt-4" onClick={handleSave}>
              Simpan Kategori
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
