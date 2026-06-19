'use client'

import { useEffect, useState } from 'react'
import { api, getStoredUser } from '@/lib/api'
import { WalletTransaction } from '@/lib/types'
import { formatNaira, formatDate } from '@/lib/format'

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [funding, setFunding] = useState(false)
  const [fundError, setFundError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [balRes, txRes] = await Promise.allSettled([
          api.get<{ balance: number }>('/api/wallet/balance'),
          api.get<WalletTransaction[]>('/api/wallet/transactions'),
        ])
        if (balRes.status === 'fulfilled') setBalance(balRes.value.balance)
        if (txRes.status === 'fulfilled') setTransactions(txRes.value)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleFund(e: React.FormEvent) {
    e.preventDefault()
    setFundError('')
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 100) {
      setFundError('Minimum top-up is ₦100')
      return
    }
    setFunding(true)
    try {
      const user = getStoredUser()
      const res = await api.post<{ authorization_url: string; reference: string }>(
        '/api/payments/initiate',
        { amount: amountNum, email: user?.email }
      )
      window.location.href = res.authorization_url
    } catch (err) {
      setFundError(err instanceof Error ? err.message : 'Payment initiation failed')
      setFunding(false)
    }
  }

  const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white mb-6">
        <p className="text-green-100 text-sm mb-1">Available Balance</p>
        <p className="text-4xl font-bold mb-4">
          {loading ? '…' : balance !== null ? formatNaira(balance) : '—'}
        </p>
        <div className="flex items-center gap-2 text-green-200 text-xs">
          <span>🔒</span>
          <span>Secured by Paystack</span>
        </div>
      </div>

      {/* Fund wallet */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Fund Wallet</h2>

        {fundError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
            {fundError}
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                amount === String(a)
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600'
              }`}
            >
              {formatNaira(a)}
            </button>
          ))}
        </div>

        <form onSubmit={handleFund} className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
            <input
              type="number"
              min="100"
              step="50"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={funding || !amount}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {funding ? 'Redirecting…' : 'Pay with Paystack'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-3">
          You will be redirected to Paystack to complete your payment securely.
        </p>
      </div>

      {/* Transaction history */}
      <div className="bg-white border border-gray-200 rounded-2xl">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map(tx => (
              <div key={tx.id ?? tx._id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.type === 'credit' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
