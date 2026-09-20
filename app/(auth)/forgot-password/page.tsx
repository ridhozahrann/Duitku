'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    const supabase = createClient()
    if (!supabase) { setErr('Layanan belum siap. Coba lagi nanti.'); setLoading(false); return }
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setMsg('Link reset terkirim. Cek inbox/spam. Klik link di email untuk atur password baru.')
  }

  return (
    <Card>
      <CardHeader><CardTitle>Lupa password</CardTitle><CardDescription>Masukkan email untuk terima link reset</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="kamu@kampus.ac.id" /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Mengirim...' : 'Kirim link reset'}</Button>
          <p className="text-sm text-center text-gray-500"><Link href="/login" className="text-primary-600 hover:underline">Kembali ke Masuk</Link></p>
        </form>
      </CardContent>
    </Card>
  )
}
