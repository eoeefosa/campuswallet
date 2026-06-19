'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Expense } from '@/lib/types'
import { formatNaira, formatDate, CATEGORIES } from '@/lib/format'

const EMPTY_FORM = { amount: '', category: CATEGORIES[0], note: '', date: '' }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  async function fetchExpenses() {
    try {
      const q = filterCategory ? `?category=${encodeURIComponent(filterCategory)}` : ''
      const data = await api.get<Expense[]>(`/api/expenses${q}`)
      setExpenses(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExpenses() }, [filterCategory]) // eslint-disable-line

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/api/expenses', {
        ...form,
        amount: parseFloat(form.amount),
        date: form.date || new Date().toISOString(),
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    await api.del(`/api/expenses/${id}`)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Expense'}
        </button>
      </div>

      {/* Add expense form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">New Expense</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. Lunch at cafeteria"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Saving…' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + total */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-900">{formatNaira(total)}</span>
        </span>
      </div>

      {/* Expense list */}
      <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No expenses found</div>
        ) : (
          expenses.map(exp => (
            <div key={exp.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{exp.category}</span>
                </div>
                {exp.note && <p className="text-xs text-gray-500">{exp.note}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(exp.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">
                  -{formatNaira(exp.amount)}
                </span>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-red-400 hover:text-red-600 text-xs transition-colors"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
