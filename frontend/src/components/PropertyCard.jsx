import { Link } from 'react-router-dom'

export default function PropertyCard({ property }) {
  const sold = property.tokens_sold ?? 0
  const available = property.tokens_available ?? (property.total_tokens - sold)
  const progress = property.total_tokens > 0
    ? ((property.total_tokens - available) / property.total_tokens) * 100
    : 0

  return (
    <Link
      to={`/property/${property.id}`}
      className="card-accent block p-6 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white group-hover:text-[#00d4aa] transition-colors">
            {property.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.address}
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-[#00d4aa] bg-[#00d4aa]/10 px-2.5 py-1 rounded-lg border border-[#00d4aa]/20">
          {Number(property.price_per_token).toFixed(2)} SOL
        </span>
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{available.toLocaleString()} tokens left</span>
          <span className="text-[#00d4aa]/80">{progress.toFixed(0)}% funded</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1a2332] overflow-hidden">
          <div
            className="progress-teal h-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600">Supply</p>
          <p className="text-xs font-mono text-gray-300 mt-0.5">{property.total_tokens.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600">Available</p>
          <p className="text-xs font-mono text-gray-300 mt-0.5">{available.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600">Market Cap</p>
          <p className="text-xs font-mono text-gray-300 mt-0.5">{(property.total_tokens * Number(property.price_per_token)).toFixed(0)} SOL</p>
        </div>
      </div>
    </Link>
  )
}
