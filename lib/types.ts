export interface User {
  id: string
  name: string
  email: string
  school: string
}

export interface Expense {
  id: string
  amount: number
  category: string
  note: string
  date: string
}

export interface Budget {
  id: string
  category: string
  limit: number
  spent: number
  month: string
}

export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string
  reference?: string
}

export interface SpendingBreakdown {
  category: string
  amount: number
  percentage: number
}

export interface MonthlyTrend {
  month: string
  total: number
}
