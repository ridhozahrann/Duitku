'use client'
import * as React from 'react'

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

export function useToast() {
  const toast = (p: ToastProps) => {
    console.log(`[Toast ${p.variant ?? 'default'}] ${p.title}: ${p.description ?? ''}`)
    if (typeof window !== 'undefined') alert(`${p.title}\n${p.description ?? ''}`)
  }
  const Toaster = () => null
  return { toast, Toaster }
}
