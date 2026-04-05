import { useState, useEffect } from 'react'
import { fetchProperties } from '../lib/api'
import PropertyCard from '../components/PropertyCard'
import { Link } from 'react-router-dom'

export default function Home() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/5 text-[#00d4aa] text-xs font-medium tracking-wide">
            Built on Solana
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Fractional Real Estate
            <br />
            <span className="gradient-text">Powered by Blockchain</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Invest in premium properties worldwide with as little as one token.
            Transparent, secure, and fully on-chain.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="#properties" className="btn-teal px-8 py-3 rounded-xl text-sm">
              Explore Properties
            </a>
            <Link to="/portfolio" className="btn-outline px-8 py-3 rounded-xl text-sm">
              View Portfolio
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16">
            <div>
              <p className="text-2xl font-bold text-white">$12M+</p>
              <p className="text-xs text-gray-500 mt-1">Total Value Locked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">1,200+</p>
              <p className="text-xs text-gray-500 mt-1">Token Holders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">15+</p>
              <p className="text-xs text-gray-500 mt-1">Properties Listed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Properties</h2>
            <p className="text-sm text-gray-500 mt-1">Tokenized real estate opportunities</p>
          </div>
          <div className="h-px flex-1 ml-8 bg-gradient-to-r from-[#00d4aa]/20 to-transparent" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 border-2 border-[#00d4aa] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-600 text-xs mt-2">Make sure the API server is running on localhost:8000</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#111827] border border-[#00d4aa]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No properties listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
