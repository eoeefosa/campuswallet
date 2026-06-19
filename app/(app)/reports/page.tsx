'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { SpendingBreakdown, MonthlyTrend } from '@/lib/types'
import { formatNaira, CATEGORY_COLORS } from '@/lib/format'

const THIS_MONTH = new Date().toISOString().slice(0, 7)

export default function ReportsPage() {
  const [month, setMonth] = useState(THIS_MONTH)
  const [breakdown, setBreakdown] = useState<SpendingBreakdown[]>([])
  const [trends, setTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [bdRes, trRes] = await Promise.allSettled([
          api.get<SpendingBreakdown[]>(`/api/reports/breakdown?month=${month}`),
          api.get<MonthlyTrend[]>('/api/expenses/trends'),
        ])
        if (bdRes.status === 'fulfilled') setBreakdown(bdRes.value)
        if (trRes.status === 'fulfilled') setTrends(trRes.value)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [month])

  const totalSpend = breakdown.reduce((s, b) => s + b.amount, 0)
  const maxTrend = Math.max(...trends.map(t => t.total), 1)

  async function handleExport() {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/reports/export?month=${month}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleExport}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Spending breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Spending Breakdown</h2>
              <span className="text-sm text-gray-500 font-medium">{formatNaira(totalSpend)}</span>
            </div>

            {breakdown.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No spending data for this month</p>
            ) : (
              <>
                {/* Bar chart */}
                <div className="space-y-3 mb-6">
                  {breakdown.map(b => (
                    <div key={b.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{b.category}</span>
                        <span className="text-gray-500">
                          {formatNaira(b.amount)}{' '}
                          <span className="text-gray-400">({b.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CATEGORY_COLORS[b.category] ?? 'bg-gray-400'}`}
                          style={{ width: `${b.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend dots */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                  {breakdown.map(b => (
                    <div key={b.category} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[b.category] ?? 'bg-gray-400'}`} />
                      {b.category}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Monthly trend */}
          {trends.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Monthly Trend</h2>
              <div className="flex items-end gap-2 h-32">
                {trends.map(t => {
                  const heightPct = (t.total / maxTrend) * 100
                  const isCurrentMonth = t.month === month
                  return (
                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {formatNaira(t.total)}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isCurrentMonth ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                        style={{ height: `${heightPct}%`, minHeight: '4px' }}
                      />
                      <span className={`text-xs font-medium ${isCurrentMonth ? 'text-green-700' : 'text-gray-400'}`}>
                        {t.month.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
