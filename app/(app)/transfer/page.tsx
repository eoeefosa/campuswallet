'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { api, getStoredUser } from '@/lib/api'
import { formatNaira } from '@/lib/format'
import type { User } from '@/lib/types'

type Recipient = { id: string; name: string; school: string }
type Mode = 'receive' | 'scan'

export default function TransferPage() {
  const [user, setUser] = useState<User | null>(null)
  const [mode, setMode] = useState<Mode>('receive')

  // scan/pay flow state
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ name: string; amount: number } | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  async function handleScan(value: string) {
    if (recipient || !value) return // ignore once we've locked a recipient
    setError('')
    // QR encodes a bare user id (optionally as "campuswallet:<id>")
    const id = value.replace(/^campuswallet:/, '').trim()
    try {
      const r = await api.get<Recipient>(`/wallet/lookup/${id}`)
      setRecipient(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that code')
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!recipient) return
    const value = parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    setSending(true)
    try {
      await api.post('/wallet/transfer', { recipientId: recipient.id, amount: value })
      setDone({ name: recipient.name, amount: value })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setRecipient(null)
    setAmount('')
    setError('')
    setDone(null)
  }

  // QR payload — bare id is simplest for the lookup endpoint
  const qrValue = user?.id ?? ''

  return (
    <div className="p-4 md:p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transfer</h1>

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setMode('receive'); reset() }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'receive' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          Receive
        </button>
        <button
          onClick={() => { setMode('scan'); reset() }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'scan' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          Scan & Pay
        </button>
      </div>

      {/* ---------- RECEIVE: show my QR ---------- */}
      {mode === 'receive' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Show this code to receive money from another CampusWallet user.
          </p>
          <div className="flex justify-center mb-4">
            {qrValue ? (
              <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl">
                <QRCodeSVG value={qrValue} size={200} level="M" />
              </div>
            ) : (
              <div className="text-gray-400 text-sm py-16">Loading your code…</div>
            )}
          </div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.school}</p>
        </div>
      )}

      {/* ---------- SCAN & PAY ---------- */}
      {mode === 'scan' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          {/* success */}
          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sent!</h2>
              <p className="text-sm text-gray-500 mb-6">
                {formatNaira(done.amount)} sent to {done.name}.
              </p>
              <button
                onClick={reset}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
              >
                Done
              </button>
            </div>
          ) : !recipient ? (
            <>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Point your camera at the recipient&apos;s QR code.
              </p>
              <div className="rounded-xl overflow-hidden">
                <Scanner
                  onScan={(codes) => codes[0]?.rawValue && handleScan(codes[0].rawValue)}
                  onError={() => setError('Camera access denied or unavailable')}
                  components={{ finder: true }}
                  styles={{ container: { width: '100%' } }}
                />
              </div>
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </>
          ) : (
            /* confirm + amount */
            <form onSubmit={handleSend}>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-xl font-bold flex items-center justify-center mx-auto mb-2">
                  {recipient.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-gray-900">{recipient.name}</p>
                <p className="text-xs text-gray-400">{recipient.school}</p>
              </div>

              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₦)</label>
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                <input
                  type="number"
                  autoFocus
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !amount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg"
                >
                  {sending ? 'Sending…' : `Send ${amount ? formatNaira(parseFloat(amount) || 0) : ''}`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
