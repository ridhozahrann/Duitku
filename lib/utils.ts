import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Bill } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isBillPaidThisCycle(bill: Bill, today = new Date()): boolean {
  if (bill.status === 'paid') return true
  if (bill.status === 'paused') return false
  if (!bill.recurrence || bill.recurrence === 'once') return false
  if (!bill.lastPaidAt) return false
  
  const lastPaid = new Date(bill.lastPaidAt)
  if (bill.recurrence === 'monthly') {
    return lastPaid.getMonth() === today.getMonth() && lastPaid.getFullYear() === today.getFullYear()
  }
  if (bill.recurrence === 'weekly') {
    const diffDays = (today.getTime() - lastPaid.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays < 7
  }
  if (bill.recurrence === 'yearly') {
    return lastPaid.getFullYear() === today.getFullYear()
  }
  return false
}

export function isBillDue(bill: Bill, today = new Date()): boolean {
  if (bill.status === 'paused' || bill.status === 'paid') return false
  if (!bill.recurrence || bill.recurrence === 'once') return true
  return !isBillPaidThisCycle(bill, today)
}

export function isBillDueForCurrentMonth(bill: Bill, today = new Date()): boolean {
  if (!isBillDue(bill, today)) return false
  const d = new Date(bill.dueDate)
  const isPastOrCurrentMonth = 
    d.getFullYear() < today.getFullYear() ||
    (d.getFullYear() === today.getFullYear() && d.getMonth() <= today.getMonth())
  return isPastOrCurrentMonth
}

export function formatIDR(amount: number, isHidden?: boolean): string {
  if (isHidden) return 'Rp •••••••'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatThousands(value: string | number): string {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}
export function parseThousands(value: string): number {
  const n = Number(String(value ?? '').replace(/\D/g, ''))
  return isNaN(n) ? 0 : n
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60 * 1000) return 'Baru saja'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} menit lalu`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} jam lalu`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} hari lalu`
  
  return formatDate(date)
}