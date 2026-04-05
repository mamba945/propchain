import { useState, useEffect, useRef } from 'react'
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
  const [progressVisible, setProgressVisible] = useState(false)
  const progressRef = useRef(null)

  useEffect(() => {
    fetchProperty(id)
      .then(setProperty)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Trigger progress bar animation when it enters view
  useEffect(() => {
    if (!property) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setProgressVisible(true) },
      { threshold: 0.3 }
    )
    if (progressRef.current) observer.observe(progressRef.current)
    return () => observer.disconnect()
  }, [property])

  function handleBuySuccess(result) {
    setTxResult(result)
    setShowBuy(false)
    fetchProperty(id).then(setProperty)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="skeleton h-4 w-32 mb-8 rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="skeleton h-3 w-24 rounded-full mb-3" />
              <div className="skeleton h-9 w-3/4 mb-3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-16 w-full" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
            <div className="skeleton h-14 w-full rounded-2xl" />
          </div>
          <div className="card-accent p-6 h-fit space-y-5">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-12 w-32" />
            <div className="skeleton h-px w-full" />
            <div className="space-y-3">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
            </div>
            <div className="skeleton h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-32 animate-fade-up">
        <p className="text-red-400 text-sm">{error}</p>
        <Link to="/" className="text-[#00d4aa] text-sm mt-3 inline-block hover:underline">&larr; Back to properties</Link>
      </div>
    )
  }

  const progress = property.total_tokens > 0
    ? ((property.total_tokens - property.tokens_available) / property.total_tokens) * 100
    : 0

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to="/" className="animate-fade-up inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4aa] transition-colors mb-8">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All properties
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="animate-fade-up stagger-1">
            <div className="inline-block mb-3 px-3 py-1 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/5 text-[#00d4aa] text-xs font-medium">
              Active Offering
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{property.title}</h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {property.address}
            </p>
          </div>

          {property.description && (
            <p className="animate-fade-up stagger-2 text-sm text-gray-400 leading-relaxed">{property.description}</p>
          )}

          <div className="animate-fade-up stagger-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Price/Token" value={`${Number(property.price_per_token).toFixed(2)} SOL`} highlight />
            <Stat label="Total Supply" value={property.total_tokens.toLocaleString()} />
            <Stat label="Available" value={property.tokens_available.toLocaleString()} />
            <Stat label="Funded" value={`${progress.toFixed(0)}%`} highlight />
          </div>

          <div ref={progressRef} className="animate-fade-up stagger-3 card-dark p-5">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{property.tokens_available.toLocaleString()} tokens remaining</span>
              <span className="text-[#00d4aa]">{progress.toFixed(1)}% funded</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#1a2332] overflow-hidden">
              <div
                className={`progress-teal h-full ${progressVisible ? 'progress-animate' : ''}`}
                style={{ width: progressVisible ? `${Math.min(progress, 100)}%` : '0%' }}
              />
            </div>
          </div>

          {property.mint_address && (
            <div className="animate-fade-up stagger-4 text-xs text-gray-600 flex items-center gap-2">
              <span className="text-gray-500">Mint Address:</span>
              <code className="font-mono text-[#4f8ef7] bg-[#4f8ef7]/5 px-2 py-0.5 rounded">{property.mint_address}</code>
            </div>
          )}
        </div>

        {/* Buy Panel */}
        <div className="animate-fade-up stagger-2 card-accent p-6 h-fit space-y-5">
          <h2 className="text-lg font-semibold text-white">Invest Now</h2>
          <div>
            <div className="text-4xl font-mono font-bold text-white">
              {Number(property.price_per_token).toFixed(2)}
              <span className="text-lg text-gray-500 ml-2">SOL</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">per token</p>
          </div>
          <div className="h-px bg-gradient-to-r from-[#00d4aa]/20 via-[#00d4aa]/5 to-transparent" />
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Tokens Available</span>
              <span className="text-white font-mono">{property.tokens_available.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Market Cap</span>
              <span className="text-white font-mono">{(property.total_tokens * Number(property.price_per_token)).toFixed(0)} SOL</span>
            </div>
          </div>
          <button
            onClick={() => setShowBuy(true)}
            disabled={property.tokens_available === 0}
            className="btn-teal btn-teal-pulse w-full px-4 py-3 rounded-xl text-sm"
          >
            {property.tokens_available === 0 ? 'Sold Out' : 'Buy Tokens'}
          </button>
        </div>
      </div>

      {/* Transaction Result */}
      {txResult && (
        <div className="mt-8 card-dark p-5 border-[#00d4aa]/20 animate-fade-up">
          <h3 className="text-sm font-semibold text-[#00d4aa] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Purchase Successful
          </h3>
          <div className="text-xs text-gray-400 space-y-1.5">
            <p>Purchased <span className="text-white font-mono">{txResult.amount_purchased}</span> tokens</p>
            <p>Total cost: <span className="text-white font-mono">{Number(txResult.total_cost).toFixed(4)} SOL</span></p>
            {txResult.tx_signature && (
              <p>TX: <code className="font-mono text-[#4f8ef7] break-all">{txResult.tx_signature}</code></p>
            )}
            {txResult.mock && (
              <p className="text-yellow-500/70 mt-2">Mock transaction (Solana devnet not configured)</p>
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

function Stat({ label, value, highlight }) {
  return (
    <div className="stat-card px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-mono font-semibold ${highlight ? 'text-[#00d4aa]' : 'text-white'}`}>{value}</p>
    </div>
  )
}
