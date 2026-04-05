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
      className="group block rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-medium text-white group-hover:text-indigo-400 transition-colors">
            {property.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{property.address}</p>
        </div>
        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">
          {Number(property.price_per_token).toFixed(2)} SOL
        </span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{available.toLocaleString()} tokens left</span>
          <span>{progress.toFixed(0)}% sold</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
