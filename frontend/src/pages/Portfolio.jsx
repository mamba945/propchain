import { useState } from 'react'
import { fetchPortfolio } from '../lib/api'
import PortfolioTable from '../components/PortfolioTable'

export default function Portfolio() {
  const [wallet, setWallet] = useState('')
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!wallet.trim()) return
    setError(null)
    setLoading(true)
    setPortfolio(null)
    try {
      const data = await fetchPortfolio(wallet.trim())
      setPortfolio(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Portfolio</h1>
        <p className="text-sm text-gray-500 mt-1">View token holdings for any wallet</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="Enter Solana wallet address..."
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors font-mono"
        />
        <button
          type="submit"
          disabled={loading || !wallet.trim()}
          className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {portfolio && (
        <PortfolioTable holdings={portfolio.holdings} totalValue={portfolio.total_value} />
      )}
    </div>
  )
}
