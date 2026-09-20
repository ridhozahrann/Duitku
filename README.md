# Duit Mahasiswa - Finance Tracker

Aplikasi pencatat keuangan harian mahasiswa Indonesia. Mendukung sinkronisasi cloud multi-perangkat (HP & PC), manajemen kantong uang, pengingat tagihan berulang, budget bulanan, dan analisis keuangan.

## Fitur Utama

- **Cloud Sync & Akun**
  - Autentikasi Supabase (login, register dengan konfirmasi password, reset password via email).
  - Data tersimpan di Supabase PostgreSQL dengan Row Level Security (RLS) per akun.
  - Sinkron otomatis antara HP dan PC saat terhubung internet.

- **Manajemen Transaksi**
  - Catat pemasukan dan pengeluaran.
  - Filter berdasarkan bulan, tipe, dan kategori.
  - Pencarian cepat berdasarkan deskripsi, kategori, atau nominal.
  - Pagination 50 transaksi per halaman.
  - Export data ke format CSV.

- **Kantong Uang (Multi-Wallet)**
  - Kelola beberapa sumber uang (Dompet Utama, Tabungan Kos, Rekening, dll).
  - Batas pengeluaran (budget limit) per kantong.
  - Transfer saldo antar kantong.

- **Pengingat Tagihan Berulang**
  - Dukungan periode tagihan: Bulanan, Mingguan, Tahunan, atau Sekali Bayar.
  - **Otomatisasi Lunas**: Saat tagihan berulang di-mark lunas, tanggal jatuh tempo otomatis bergeser ke periode berikutnya dan transaksi pengeluaran tercatat otomatis.
  - **Fitur Jeda (Libur Semester)**: Nonaktifkan sementara tagihan rutin (misal WiFi kos) saat libur semester tanpa menghapus data.

- **Budget Bulanan & Target Nabung**
  - **Budget**: Batas pengeluaran per kategori dengan indikator warna (aman, peringatan 80%, jebol).
  - **Target Nabung**: Set target tabungan (laptop, liburan, dll) dengan fitur simpan/kurangi nominal.

- **Kebiasaan Keuangan (Habit Tracker)**
  - Tracker 7 hari untuk membangun kebiasaan catat keuangan.
  - Perhitungan streak harian berturut-turut.

- **Analisis & Insights**
  - Grafik tren harian pemasukan vs pengeluaran (`Recharts`).
  - Diagram lingkaran distribusi pengeluaran per kategori.
  - Proyeksi pengeluaran bulanan, burn rate harian, dan daya tahan saldo (runway).
  - Rekomendasi otomatis berdasarkan rule lokal.

- **Backup & Restore**
  - Export & import data backup dalam format `.json`.
  - Opsi memuat data demo untuk uji coba.

- **Tampilan & Preferensi Navigasi**
  - Preferensi Posisi Navigasi: Opsi pilihan **Sidebar (Samping)** atau **Bottom Bar (Bawah)** di halaman Pengaturan.
  - Mode Gelap (Dark Mode) & Mode Terang (Light Mode).
  - Service Worker (PWA) untuk navigasi cepat.

## Stack Teknologi

- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database & Auth**: Supabase (PostgreSQL, `@supabase/ssr`, RLS)
- **UI Components**: Radix UI, Lucide Icons
- **Grafik**: Recharts
- **Form & Validasi**: React Hook Form + Zod

## Cara Menjalankan Lokal

1. **Clone repository dan install dependensi**:
   ```bash
   git clone https://github.com/ridhozahrann/Duitku.git
   cd Duitku
   npm install
   ```

2. **Konfigurasi Environment Variables**:
   Buat file `.env.local` di root project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Setup Database Supabase**:
   Jalankan query yang ada di file `supabase/schema.sql` pada SQL Editor di Dashboard Supabase.

4. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Project

```
├── app/
│   ├── (auth)/        # Route halaman auth (login, register, forgot-password, reset-password)
│   ├── (dashboard)/   # Route utama (dashboard, transactions, wallets, bills, budgets, goals, habits, analytics, insights, settings)
│   └── auth/callback/ # Supabase OAuth / Recovery callback route
├── components/        # Component UI (Toaster, TransactionDialog, Layout, Chart, dll)
├── hooks/             # Custom React Hooks (useCloudSync, useToast)
├── lib/               # Utility, default data, Supabase client configuration
├── store/             # Zustand store (useStore.ts)
├── supabase/          # SQL Schema & RLS Policies (schema.sql)
└── types/             # TypeScript interface definitions
```
