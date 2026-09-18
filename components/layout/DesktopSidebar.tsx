'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  List, 
  BarChart3, 
  Wallet, 
  Bell,
  Calendar,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  PiggyBank,
  Target
} from 'lucide-react'
import TransactionDialog from '@/components/transactions/TransactionDialog'
import { ThemeToggle } from '@/components/ThemeToggle'

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Transaksi', href: '/transactions', icon: List },
  { name: 'Kantong Uang', href: '/wallets', icon: Wallet },
  { name: 'Grafik', href: '/analytics', icon: BarChart3 },
  { name: 'Pengingat Tagihan', href: '/bills', icon: Bell },
  { name: 'Budget', href: '/budgets', icon: PiggyBank },
  { name: 'Target Nabung', href: '/goals', icon: Target },
  { name: 'Kebiasaan', href: '/habits', icon: Calendar },
  { name: 'Insights', href: '/insights', icon: TrendingUp },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
]

export default function DesktopSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)

  return (
    <>
      <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <div className="flex-1" />
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-primary-600">Duit Mahasiswa</h1>
                <p className="text-sm text-gray-500">Keuangan Mahasiswa</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Quick add button */}
        {!collapsed && (
          <div className="p-4">
            <button
              onClick={() => setShowTransactionDialog(true)}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-5 w-5" />
              Tambah Transaksi
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[60vh]">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapsed add button */}
        {collapsed && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={() => setShowTransactionDialog(true)}
              className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
            >
              <PlusCircle className="h-6 w-6" />
            </button>
          </div>
        )}
      </aside>

      <TransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
      />
    </>
  )
}