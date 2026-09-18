'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, BarChart3, Wallet, PlusCircle, Menu, X, Bell, PiggyBank, Target, Calendar, TrendingUp, Settings, LogOut } from 'lucide-react'
import TransactionDialog from '@/components/transactions/TransactionDialog'
import { useAuth } from '@/components/AuthProvider'

const mainItems = [
  { name: 'Beranda', href: '/', icon: Home },
  { name: 'Transaksi', href: '/transactions', icon: List },
  { name: 'Grafik', href: '/analytics', icon: BarChart3 },
  { name: 'Kantong', href: '/wallets', icon: Wallet },
]

const moreItems = [
  { name: 'Tagihan', href: '/bills', icon: Bell },
  { name: 'Budget', href: '/budgets', icon: PiggyBank },
  { name: 'Target', href: '/goals', icon: Target },
  { name: 'Kebiasaan', href: '/habits', icon: Calendar },
  { name: 'Insights', href: '/insights', icon: TrendingUp },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [showTx, setShowTx] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const { user, signOut } = useAuth()

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 z-40">
        <div className="flex justify-between items-center px-2 py-2">
          {mainItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href} className={`flex flex-col items-center justify-center p-2 rounded-lg ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                <Icon className="h-5 w-5" /><span className="text-[11px] mt-1">{item.name}</span>
              </Link>
            )
          })}
          <button onClick={() => setShowMore(!showMore)} className={`flex flex-col items-center justify-center p-2 rounded-lg ${showMore ? 'text-primary-600' : 'text-gray-500'}`}>
            {showMore ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}<span className="text-[11px] mt-1">Lainnya</span>
          </button>
          <button onClick={() => setShowTx(true)} className="flex flex-col items-center justify-center p-2 -mt-8 relative">
            <div className="absolute -top-6 bg-primary-600 rounded-full p-3 shadow-lg"><PlusCircle className="h-7 w-7 text-white" /></div>
            <span className="text-[11px] mt-10 text-primary-600">Tambah</span>
          </button>
        </div>
        {showMore && (
          <div className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
            <div className="grid grid-cols-3 gap-2 p-3">
              {moreItems.map(item => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${active ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'}`}>
                    <Icon className="h-5 w-5" /><span className="text-xs font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
            <div className="px-3 pb-3">
              <div className="rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{user?.email ?? 'Belum login'}</div>
                  <div className="text-[10px] text-gray-500">{user ? 'Akun' : 'Masuk untuk sinkron HP & PC'}</div>
                </div>
                {user ? (
                  <button onClick={signOut} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50"><LogOut className="h-3.5 w-3.5" />Keluar</button>
                ) : (
                  <Link href="/login" onClick={() => setShowMore(false)} className="inline-flex items-center text-xs font-medium bg-primary-600 text-white rounded-full px-3 py-1.5">Masuk</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="pb-20" />
      <TransactionDialog open={showTx} onOpenChange={setShowTx} />
    </>
  )
}
