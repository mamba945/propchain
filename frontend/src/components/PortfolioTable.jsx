import { Link } from 'react-router-dom'

export default function PortfolioTable({ holdings, totalValue }) {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-[#111827] border border-[#00d4aa]/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No holdings found for this wallet.</p>
      </div>
    )
  }

  return (
    <div className="card-dark overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-[#00d4aa]/10 bg-[#0a0e1a]/50">
            <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Property</th>
            <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price/Token</th>
            <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.property_id} className="border-b border-white/[0.04] hover:bg-[#00d4aa]/[0.02] transition-colors">
              <td className="px-5 py-4">
                <Link to={`/property/${h.property_id}`} className="text-white hover:text-[#00d4aa] transition-colors font-medium">
                  {h.property_title}
                </Link>
                <p className="text-xs text-gray-600 mt-0.5">{h.property_address}</p>
              </td>
              <td className="px-5 py-4 text-right text-gray-300 font-mono">{h.token_amount.toLocaleString()}</td>
              <td className="px-5 py-4 text-right text-gray-500 font-mono">{Number(h.price_per_token).toFixed(2)}</td>
              <td className="px-5 py-4 text-right text-[#00d4aa] font-mono font-medium">{Number(h.holding_value).toFixed(2)} SOL</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[#0a0e1a]/50">
            <td colSpan={3} className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Portfolio Value</td>
            <td className="px-5 py-4 text-right text-[#00d4aa] font-mono font-bold text-base">{Number(totalValue).toFixed(2)} SOL</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
