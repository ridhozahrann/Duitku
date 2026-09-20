import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <Search className="h-12 w-12 text-gray-400 mx-auto" />
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="text-gray-500">URL salah atau halaman dipindah.</p>
        <Link href="/dashboard"><Button>Kembali ke Dashboard</Button></Link>
      </div>
    </div>
  )
}
