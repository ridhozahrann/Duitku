import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Duit Mahasiswa - Tracker Keuangan',
  description: 'Catat keuangan harian mahasiswa — sinkron otomatis HP & PC',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Duitku' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full`}>
        <ThemeProvider>
          <AuthProvider>
            <main className="h-full">{children}</main>
          </AuthProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('duit-theme');var d=s? s==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.classList.toggle('dark',d)}catch(e){}})()` }} />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}` }} />
      </body>
    </html>
  )
}