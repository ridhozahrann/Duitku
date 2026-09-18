'use client'

import { ReactNode } from 'react'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import { useStore } from '@/store/useStore'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading } = useStore()

  return (
    <div className="h-full">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DesktopSidebar />
      </div>

      {/* Main content */}
      <main className="md:ml-64 h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
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