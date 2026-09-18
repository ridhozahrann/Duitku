// This script can be used to initialize demo data
import { demoTransactions } from '@/lib/defaultData'

console.log('Demo transactions available:')
console.log(demoTransactions.map(t => ({
  type: t.type,
  amount: t.amount,
  category: t.categoryId,
  description: t.description
})))

console.log('\nTo use demo data:')
console.log('1. Open the application')
console.log('2. Go to dashboard')
console.log('3. Start adding your own transactions')
console.log('\nDefault categories are already loaded.')