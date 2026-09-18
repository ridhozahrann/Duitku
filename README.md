# Duit Mahasiswa - Personal Finance Tracker

Aplikasi web personal finance tracker untuk mahasiswa Indonesia — mobile-first, offline (localStorage), Rupiah.

## Fitur

### Phase 1 — MVP ✅
- Dashboard (saldo, income/expense bulanan, sisa saldo, hide/show)
- Transaksi CRUD (kategori, tanggal, catatan, edit/hapus)
- Kantong default + localStorage persist
- Bahasa Indonesia & `formatIDR`

### Phase 2 — DONE ✅ (dulu Coming Soon)
- **Kantong Uang** — tambah/hapus/transfer antar kantong, saldo sinkron transaksi, `budgetLimit` bar
- **Grafik** (`recharts`) — Line tren harian, Bar per kategori, Pie distribusi, filter 7d/30d/all
- **Filter & Search transaksi** — search kategori/catatan/nominal, filter tipe & kategori, Export CSV
- **Pengingat Tagihan** — persist `store.bills`, overdue auto, lunas/batal, riwayat
- **Backup & Restore** — export/import JSON (trx/wallet/bill/habit/budget/goal), muat demo, hapus semua

### Phase 3 — DONE ✅
- **Budget Bulanan** (`/budgets`) — batas per kategori, bar 80%/100% warna, jebol indicator
- **Target Nabung** (`/goals`) — tambah/topup/kurangi, progress bar, tercapai confetti
- **Kebiasaan Harian** (`/habits`) — tracker 7 hari tap-to-check, streak, mingguan progress
- **Insights** (`/insights`) — tren vs bulan lalu, proyeksi, runway, budget jebol, rekomendasi rule-based (tanpa AI)
- **Dashboard widgets** — budget warning, tagihan, top goal, streak (link ke halaman)

## Teknologi
Next.js 15 (App Router) · TypeScript · Tailwind · Zustand persist · React Hook Form + Zod · Radix UI · Recharts · date-fns

## Cara Menjalankan
```bash
npm install
npm run dev # http://localhost:3000
npm run build # 14 routes, 0 error
```

## Struktur
```
/app/(dashboard)  dashboard, transactions, wallets, analytics, bills, budgets, goals, habits, insights, settings
/components       ui, layout (DesktopSidebar + MobileBottomNav + More), transactions, dashboard
/store            useStore.ts (persist duit-mahasiswa-storage, revive Date)
/types            Transaction, Category, Wallet, Bill, Habit, HabitLog, Budget, SavingsGoal
/lib              defaultData.ts (kategori + demoTransactions), utils.ts (formatIDR)
```

## Data Model
Saldo = total income − total expense. Saldo kantong sinkron otomatis (add/update/delete transaksi + transfer). Persist `localStorage` key `duit-mahasiswa-storage`.

Demo: Uang bulanan Rp2jt, makan 25k, transport 15k, kos 1jt, beasiswa 500k → saldo Rp1.460.000.

## Catatan
- Semua halaman client (`'use client'`) karena Zustand + localStorage.
- Tidak ada backend — file backup JSON bawa sendiri kalau ganti HP.
- Insights rule lokal, bukan nasihat finansial.
