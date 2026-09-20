'use client'
import * as React from 'react'

type ToastVariant = 'default' | 'destructive' | 'success'

export type ToastItem = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

// Global toast state — singleton agar bisa dipanggil dari mana saja tanpa context
let listeners: Array<() => void> = []
let toasts: ToastItem[] = []

function emit() { listeners.forEach(fn => fn()) }

function addToast(t: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toasts = [{ ...t, id }, ...toasts]
  emit()
  // auto-dismiss 4s
  setTimeout(() => dismissToast(id), 4000)
}

function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

/** Stable toast function — identity never changes */
const stableToast = (p: Omit<ToastItem, 'id'>) => addToast(p)

export function useToast() {
  // subscribe to toast changes for Toaster component
  const subscribe = React.useCallback((cb: () => void) => {
    listeners = [...listeners, cb]
    return () => { listeners = listeners.filter(l => l !== cb) }
  }, [])
  const getSnapshot = React.useCallback(() => toasts, [])
  const items = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return { toast: stableToast, toasts: items, dismiss: dismissToast }
}
