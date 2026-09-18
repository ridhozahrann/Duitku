'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TransactionItem from '@/components/transactions/TransactionItem'
import { useStore } from '@/store/useStore'
import { formatRelativeTime } from '@/lib/utils'

export default function RecentTransactions() {
  const { transactions } = useStore()
  
  const recentTransactions = transactions.slice(0, 5)

  if (recentTransactions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaksi Terbaru</CardTitle>
        <Link href="/transactions">
          <Button variant="ghost" size="sm">
            Lihat Semua
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              showTime={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}