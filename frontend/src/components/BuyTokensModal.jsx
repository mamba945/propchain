import { useState } from 'react'
import { buyTokens } from '../lib/api'

export default function BuyTokensModal({ property, onClose, onSuccess }) {
  const [wallet, setWallet] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const totalCost = amount ? (Number(amount) * Number(property.price_per_token)).toFixed(4) : '0'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await buyTokens(property.id, wallet, Number(amount))
      onSuccess(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#111113] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium text-white">Buy Tokens</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          {property.title} &middot; {Number(property.price_per_token).toFixed(2)} SOL per token
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Wallet Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Your Solana wallet address"
              required
              minLength={32}
              maxLength={44}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Number of Tokens</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              min={1}
              max={property.tokens_available}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
            <span className="text-sm text-gray-500">Total Cost</span>
            <span className="text-lg font-mono font-medium text-white">{totalCost} SOL</span>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || !wallet}
            className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Buy Tokens'}
          </button>
        </form>
      </div>
    </div>
  )
}
