'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) { setErr('Supabase belum dikonfigurasi.'); return }
    // verify recovery session exists (link sudah di-exchange oleh /auth/callback atau implicit)
    supabase.auth.getUser().then(({ data:{ user }, error }: any) => {
      if (error || !user) setErr('Link tidak valid/expired. Minta link baru di Lupa password.')
      else setReady(true)
    })
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    const supabase = createClient()
    if (!supabase) { setErr('Supabase belum dikonfigurasi.'); setLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setMsg('Password diperbarui. Mengarahkan ke login...')
    setTimeout(()=>router.push('/login'), 1500)
  }

  return (
    <Card>
      <CardHeader><CardTitle>Atur password baru</CardTitle><CardDescription>Masukkan password baru minimal 6 karakter</CardDescription></CardHeader>
      <CardContent>
        {!ready && !err && <p className="text-sm text-gray-400">Memverifikasi link...</p>}
        {err && <><p className="text-sm text-red-600 mb-4">{err}</p><Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">Kirim ulang link</Link></>}
        {ready && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="password">Password baru</Label><Input id="password" type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} /></div>
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan password'}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
