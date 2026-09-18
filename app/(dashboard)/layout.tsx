'use client'

import { ReactNode } from 'react'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import { useStore } from '@/store/useStore'
import { useCloudSync } from '@/hooks/useCloudSync'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isSyncing } = useStore()
  useCloudSync()

  return (
    <div className="h-full">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DesktopSidebar />
      </div>

      {/* Main content */}
      <main className="md:ml-64 h-full">
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

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  )
}