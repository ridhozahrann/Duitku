import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Duit Mahasiswa - Tracker Keuangan',
  description: 'Aplikasi personal finance tracker untuk mahasiswa',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
          <main className="h-full">{children}</main>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('duit-theme');var d=s? s==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.classList.toggle('dark',d)}catch(e){}})()` }} />
      </body>
    </html>
  )
}