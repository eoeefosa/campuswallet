'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Budget } from '@/lib/types'
import { formatNaira, CATEGORIES } from '@/lib/format'

const THIS_MONTH = new Date().toISOString().slice(0, 7)
const EMPTY_FORM = { category: CATEGORIES[0], limit: '', month: THIS_MONTH }

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchBudgets() {
    try {
      const data = await api.get<Budget[]>('/api/budgets')
      setBudgets(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBudgets() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/api/budgets', { ...form, limit: parseFloat(form.limit) })
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchBudgets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this budget?')) return
    await api.del(`/api/budgets/${id}`)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  function statusColor(pct: number) {
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 80) return 'bg-amber-400'
    return 'bg-green-500'
  }

  function statusLabel(pct: number) {
    if (pct >= 100) return { text: 'Over budget', cls: 'bg-red-100 text-red-700' }
    if (pct >= 80) return { text: 'Near limit', cls: 'bg-amber-100 text-amber-700' }
    return { text: 'On track', cls: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Budget'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Set Budget</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Limit (₦)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 20000"
                value={form.limit}
                onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Saving…' : 'Save Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl text-center py-12">
          <p className="text-gray-400 text-sm mb-3">No budgets set yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Set your first budget
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => {
            const pct = b.limit > 0 ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : 0
            const remaining = b.limit - b.spent
            const { text, cls } = statusLabel(pct)
            return (
              <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{b.category}</h3>
                    <span className="text-xs text-gray-500">{b.month}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${statusColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Spent: <span className="font-medium text-gray-900">{formatNaira(b.spent)}</span>
                  </span>
                  <span className="text-gray-500">
                    {remaining >= 0
                      ? <><span className="font-medium text-green-600">{formatNaira(remaining)}</span> left</>
                      : <span className="font-medium text-red-600">{formatNaira(Math.abs(remaining))} over</span>
                    }
                    {' '}of {formatNaira(b.limit)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
