'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={`Ganti ke ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
