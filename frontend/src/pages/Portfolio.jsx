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
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="animate-fade-up mb-8">
        <div className="inline-block mb-3 px-3 py-1 rounded-full border border-[#4f8ef7]/20 bg-[#4f8ef7]/5 text-[#4f8ef7] text-xs font-medium">
          Portfolio Tracker
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Your Portfolio</h1>
        <p className="text-sm text-gray-500 mt-2">View token holdings and total value for any wallet</p>
      </div>

      <form onSubmit={handleSearch} className="animate-fade-up stagger-1 flex gap-3 mb-8">
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="Enter Solana wallet address..."
          className="input-dark flex-1 rounded-xl px-5 py-3 text-sm font-mono"
        />
        <button
          type="submit"
          disabled={loading || !wallet.trim()}
          className="btn-teal px-6 py-3 rounded-xl text-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
              Loading...
            </span>
          ) : 'Search'}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 mb-6 animate-fade-up">
          {error}
        </div>
      )}

      {portfolio && (
        <div className="animate-fade-up">
          <PortfolioTable holdings={portfolio.holdings} totalValue={portfolio.total_value} />
        </div>
      )}
    </div>
  )
}
