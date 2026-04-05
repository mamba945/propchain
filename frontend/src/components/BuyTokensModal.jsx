import { useState, useEffect } from 'react'
import { buyTokens } from '../lib/api'

export default function BuyTokensModal({ property, onClose, onSuccess }) {
  const [wallet, setWallet] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [closing, setClosing] = useState(false)

  const totalCost = amount ? (Number(amount) * Number(property.price_per_token)).toFixed(4) : '0'

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 200)
  }

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm ${closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-md card-accent p-6 shadow-2xl shadow-black/50 ${closing ? 'modal-content-exit' : 'modal-content-enter'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Buy Tokens</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-[#00d4aa] text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#00d4aa]/10"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          {property.title} &middot; <span className="text-[#00d4aa] font-mono">{Number(property.price_per_token).toFixed(2)} SOL</span> per token
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Wallet Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Your Solana wallet address"
              required
              minLength={32}
              maxLength={44}
              className="input-dark w-full rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Number of Tokens</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              min={1}
              max={property.tokens_available}
              className="input-dark w-full rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#0a0e1a] border border-[#00d4aa]/10 px-5 py-4 transition-all duration-300">
            <span className="text-sm text-gray-500">Total Cost</span>
            <span className="text-xl font-mono font-bold text-[#00d4aa]">{totalCost} SOL</span>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || !wallet}
            className="btn-teal btn-teal-pulse w-full px-4 py-3 rounded-xl text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : 'Confirm Purchase'}
          </button>
        </form>
      </div>
    </div>
  )
}
