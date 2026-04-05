import { Link } from 'react-router-dom'

export default function PortfolioTable({ holdings, totalValue }) {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        No holdings found for this wallet.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Token</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.property_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-4">
                <Link to={`/property/${h.property_id}`} className="text-white hover:text-indigo-400 transition-colors">
                  {h.property_title}
                </Link>
                <p className="text-xs text-gray-600 mt-0.5">{h.property_address}</p>
              </td>
              <td className="px-5 py-4 text-right text-gray-300 font-mono">{h.token_amount.toLocaleString()}</td>
              <td className="px-5 py-4 text-right text-gray-500 font-mono">{Number(h.price_per_token).toFixed(2)}</td>
              <td className="px-5 py-4 text-right text-white font-mono">{Number(h.holding_value).toFixed(2)} SOL</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-white/[0.02]">
            <td colSpan={3} className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</td>
            <td className="px-5 py-3 text-right text-white font-mono font-medium">{Number(totalValue).toFixed(2)} SOL</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
