'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const next = useSearchParams().get('next') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    const supabase = createClient()
    if (!supabase) { setErr('Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_* di Vercel.'); setLoading(false); return }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setErr(error.message); return }
    router.push(next); router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="kamu@kampus.ac.id" /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Memproses...' : 'Masuk'}</Button>
      <p className="text-sm text-center"><Link href="/forgot-password" className="text-gray-500 hover:text-primary-600 hover:underline">Lupa password?</Link></p>
      <p className="text-sm text-center text-gray-500">Belum punya akun? <Link href="/register" className="text-primary-600 hover:underline">Daftar</Link></p>
      <p className="text-xs text-gray-400 text-center">Tanpa env Supabase, app tetap jalan localStorage-only.</p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Masuk</CardTitle><CardDescription>Login ke Duit Mahasiswa (Supabase Auth)</CardDescription></CardHeader>
      <CardContent>
        <Suspense fallback={<div className="text-sm text-gray-400">Memuat...</div>}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
