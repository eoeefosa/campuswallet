'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatNaira, CATEGORY_COLORS } from '@/lib/format'

type Allocation = { category: string; amount: number; note?: string }
type Plan = {
  period: 'week' | 'month'
  total: number
  allocated: number
  allocations: Allocation[]
  advice: string
}

const QUICK = [20000, 40000, 60000, 100000]

export default function PlanPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'week' | 'month'>('month')
  const [context, setContext] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    const total = parseFloat(amount)
    if (isNaN(total) || total <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    setApplied(false)
    setPlan(null)
    setLoading(true)
    try {
      const res = await api.post<Plan>('/ai/plan', { amount: total, period, context })
      setPlan(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a plan')
    } finally {
      setLoading(false)
    }
  }

  async function apply() {
    if (!plan) return
    setApplying(true)
    setError('')
    try {
      await api.post('/ai/plan/apply', { allocations: plan.allocations, period: plan.period })
      setApplied(true)
      setTimeout(() => router.push('/budgets'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply the plan')
    } finally {
      setApplying(false)
    }
  }

  const maxAlloc = plan ? Math.max(...plan.allocations.map((a) => a.amount), 1) : 1

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <span>🧮</span> Budget Planner
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Tell me your budget and I&apos;ll split it across categories.
      </p>

      <form onSubmit={generate} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <div className="flex gap-2 mb-3 flex-wrap">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                amount === String(q)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
              }`}
            >
              {formatNaira(q)}
            </button>
          ))}
        </div>

        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
          <input
            type="number"
            min="1"
            placeholder="Enter your total budget"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                period === p ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              per {p}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Optional: e.g. I live off-campus, no rent"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Planning…' : '✨ Suggest allocation'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-6">
          {error}
        </div>
      )}

      {plan && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">
              Suggested plan · per {plan.period}
            </h2>
            <span className="text-sm text-gray-500">{formatNaira(plan.total)}</span>
          </div>
          {plan.allocated !== plan.total && (
            <p className="text-xs text-amber-600 mb-2">
              Allocated {formatNaira(plan.allocated)} of {formatNaira(plan.total)}
            </p>
          )}

          <div className="space-y-3 my-4">
            {plan.allocations.map((a) => (
              <div key={a.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-800 font-medium">{a.category}</span>
                  <span className="text-gray-600">{formatNaira(a.amount)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[a.category] ?? 'bg-blue-500'}`}
                    style={{ width: `${(a.amount / maxAlloc) * 100}%` }}
                  />
                </div>
                {a.note && <p className="text-xs text-gray-400 mt-0.5">{a.note}</p>}
              </div>
            ))}
          </div>

          {plan.advice && (
            <div className="bg-blue-50 text-blue-800 text-sm rounded-lg px-3 py-2 mb-4">
              💡 {plan.advice}
            </div>
          )}

          {plan.period === 'week' && (
            <p className="text-xs text-gray-400 mb-3">
              Applying creates monthly budgets (weekly amounts × 4).
            </p>
          )}

          {applied ? (
            <div className="text-center text-green-600 text-sm font-medium py-2">
              ✅ Budgets created — taking you there…
            </div>
          ) : (
            <button
              onClick={apply}
              disabled={applying || plan.allocations.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {applying ? 'Creating budgets…' : 'Apply as my budgets'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
