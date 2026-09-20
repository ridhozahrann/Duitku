'use client'

import { ReactNode, useEffect } from 'react'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import { useStore } from '@/store/useStore'
import { useCloudSync } from '@/hooks/useCloudSync'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isSyncing, navPosition, setNavPosition, setAccentColor, setBalanceHidden } = useStore()
  useCloudSync()

  useEffect(() => {
    const saved = localStorage.getItem('duitku_nav_position') as 'sidebar' | 'bottom' | null
    if (saved && (saved === 'sidebar' || saved === 'bottom')) {
      setNavPosition(saved)
    }

    const savedColor = localStorage.getItem('duitku_accent_color') as any
    if (savedColor) {
      setAccentColor(savedColor)
      document.documentElement.setAttribute('data-theme', savedColor)
    }

    const savedHidden = localStorage.getItem('duitku_balance_hidden')
    if (savedHidden !== null) {
      setBalanceHidden(savedHidden === 'true')
    }
  }, [setNavPosition, setAccentColor, setBalanceHidden])

  const isSidebar = navPosition === 'sidebar'

  return (
    <div className="h-full">
      {/* Desktop sidebar */}
      {isSidebar && (
        <div className="hidden lg:block">
          <DesktopSidebar />
        </div>
      )}

      {/* Main content */}
      <main className={`${isSidebar ? 'lg:ml-64' : 'ml-0'} h-full pb-24 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          {isSyncing && <div className="py-2 text-xs text-center text-gray-400">Menyinkronkan data...</div>}
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Navigation: bottom bar */}
      <div className={isSidebar ? 'lg:hidden' : 'block'}>
        <MobileBottomNav />
      </div>
    </div>
  )
}