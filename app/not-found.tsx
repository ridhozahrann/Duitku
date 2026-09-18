import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="text-gray-500">URL salah atau halaman dipindah.</p>
        <Link href="/"><Button>Kembali ke Dashboard</Button></Link>
      </div>
    </div>
  )
}
