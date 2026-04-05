import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchProperty } from '../lib/api'
import BuyTokensModal from '../components/BuyTokensModal'

export default function PropertyDetail() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBuy, setShowBuy] = useState(false)
  const [txResult, setTxResult] = useState(null)

  useEffect(() => {
    fetchProperty(id)
      .then(setProperty)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleBuySuccess(result) {
    setTxResult(result)
    setShowBuy(false)
    // Refresh property data
    fetchProperty(id).then(setProperty)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-32">
        <p className="text-red-400 text-sm">{error}</p>
        <Link to="/" className="text-indigo-400 text-sm mt-2 inline-block hover:underline">&larr; Back to properties</Link>
      </div>
    )
  }

  const progress = property.total_tokens > 0
    ? ((property.total_tokens - property.tokens_available) / property.total_tokens) * 100
    : 0

  return (
    <div>
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">&larr; All properties</Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">{property.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{property.address}</p>
          </div>

          {property.description && (
            <p className="text-sm text-gray-400 leading-relaxed">{property.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Price/Token" value={`${Number(property.price_per_token).toFixed(2)} SOL`} />
            <Stat label="Total Supply" value={property.total_tokens.toLocaleString()} />
            <Stat label="Available" value={property.tokens_available.toLocaleString()} />
            <Stat label="Sold" value={`${progress.toFixed(0)}%`} />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{property.tokens_available.toLocaleString()} tokens remaining</span>
              <span>{progress.toFixed(1)}% sold</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {property.mint_address && (
            <div className="text-xs text-gray-600">
              Mint: <span className="font-mono text-gray-500">{property.mint_address}</span>
            </div>
          )}
        </div>

        {/* Buy Panel */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 h-fit space-y-4">
          <h2 className="text-base font-medium text-white">Invest</h2>
          <div className="text-3xl font-mono font-semibold text-white">
            {Number(property.price_per_token).toFixed(2)} <span className="text-lg text-gray-500">SOL</span>
          </div>
          <p className="text-xs text-gray-500">per token</p>
          <button
            onClick={() => setShowBuy(true)}
            disabled={property.tokens_available === 0}
            className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {property.tokens_available === 0 ? 'Sold Out' : 'Buy Tokens'}
          </button>
        </div>
      </div>

      {/* Transaction Result */}
      {txResult && (
        <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/5 p-5">
          <h3 className="text-sm font-medium text-green-400 mb-2">Purchase Successful</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Purchased <span className="text-white font-mono">{txResult.amount_purchased}</span> tokens</p>
            <p>Total cost: <span className="text-white font-mono">{Number(txResult.total_cost).toFixed(4)} SOL</span></p>
            {txResult.tx_signature && (
              <p>TX: <span className="font-mono text-gray-500 break-all">{txResult.tx_signature}</span></p>
            )}
            {txResult.mock && (
              <p className="text-yellow-500/70 mt-1">Mock transaction (Solana devnet not configured)</p>
            )}
          </div>
        </div>
      )}

      {showBuy && (
        <BuyTokensModal
          property={property}
          onClose={() => setShowBuy(false)}
          onSuccess={handleBuySuccess}
        />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-mono font-medium text-white">{value}</p>
    </div>
  )
}
