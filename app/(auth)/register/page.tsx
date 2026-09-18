'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    const supabase = createClient()
    if (!supabase) { setErr('Layanan daftar belum siap. Coba lagi nanti.'); setLoading(false); return }
    // ponytail: tanpa emailRedirectTo biar tidak butuh whitelist redirect di Supabase
    // upgrade: set emailRedirectTo setelah Site URL + Additional Redirects dikonfigurasi
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setMsg('Akun dibuat. Silakan login.')
    setTimeout(()=>router.push('/login'), 1000)
  }

  return (
    <Card>
      <CardHeader><CardTitle>Daftar</CardTitle><CardDescription>Buat akun Duit Mahasiswa — data hanya bisa diakses akun kamu</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="kamu@kampus.ac.id" /></div>
          <div className="space-y-2"><Label htmlFor="password">Password (min 6)</Label><Input id="password" type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Memproses...' : 'Daftar'}</Button>
          <p className="text-sm text-center text-gray-500">Sudah punya akun? <Link href="/login" className="text-primary-600 hover:underline">Masuk</Link></p>
        </form>
      </CardContent>
    </Card>
  )
}
