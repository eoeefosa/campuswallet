'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Budget, Expense, WalletTransaction } from '@/lib/types'
import { formatNaira, formatDate } from '@/lib/format'

interface DashboardData {
  balance: number
  totalSpentThisMonth: number
  expenseCount: number
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [walletRes, budgetsRes, expensesRes, summaryRes] = await Promise.allSettled([
          api.get<{ balance: number }>('/api/wallet/balance'),
          api.get<Budget[]>('/api/budgets'),
          api.get<Expense[]>('/api/expenses?limit=5'),
          api.get<DashboardData>('/api/reports/monthly'),
        ])

        if (walletRes.status === 'fulfilled') setBalance(walletRes.value.balance)
        if (budgetsRes.status === 'fulfilled') setBudgets(budgetsRes.value)
        if (expensesRes.status === 'fulfilled') setRecentExpenses(expensesRes.value)
        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const alertedBudgets = budgets.filter(
    b => b.limit > 0 && b.spent / b.limit >= 0.8
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-600 text-white rounded-2xl p-5">
          <p className="text-green-100 text-xs font-medium uppercase tracking-wide mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold">{balance !== null ? formatNaira(balance) : '—'}</p>
          <Link href="/wallet" className="text-green-200 text-xs mt-2 inline-block hover:text-white">
            Fund wallet →
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Spent This Month</p>
          <p className="text-3xl font-bold text-gray-900">
            {summary ? formatNaira(summary.totalSpentThisMonth) : '—'}
          </p>
          <Link href="/expenses" className="text-green-600 text-xs mt-2 inline-block hover:underline">
            View expenses →
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Transactions</p>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.expenseCount ?? '—'}
          </p>
          <Link href="/reports" className="text-green-600 text-xs mt-2 inline-block hover:underline">
            View reports →
          </Link>
        </div>
      </div>

      {/* Budget alerts */}
      {alertedBudgets.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">
            ⚠️ Budget Alerts ({alertedBudgets.length})
          </h2>
          <div className="space-y-3">
            {alertedBudgets.map(b => {
              const pct = Math.min(100, Math.round((b.spent / b.limit) * 100))
              const isOver = b.spent >= b.limit
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{b.category}</span>
                    <span className={isOver ? 'text-red-600 font-semibold' : 'text-amber-700'}>
                      {formatNaira(b.spent)} / {formatNaira(b.limit)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <Link href="/budgets" className="text-amber-700 text-xs mt-3 inline-block hover:underline font-medium">
            Manage budgets →
          </Link>
        </div>
      )}

      {/* Recent expenses */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Expenses</h2>
          <Link href="/expenses" className="text-green-600 text-sm hover:underline">See all</Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">No expenses logged yet</p>
            <Link
              href="/expenses"
              className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Log your first expense
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentExpenses.map(exp => (
              <div key={exp.id ?? exp._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{exp.category}</p>
                  {exp.note && <p className="text-xs text-gray-500">{exp.note}</p>}
                  <p className="text-xs text-gray-400">{formatDate(exp.date)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  -{formatNaira(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
