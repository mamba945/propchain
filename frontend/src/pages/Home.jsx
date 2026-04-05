import { useState, useEffect } from 'react'
import { fetchProperties } from '../lib/api'
import PropertyCard from '../components/PropertyCard'

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
        <p className="text-gray-600 text-xs mt-2">Make sure the API server is running on localhost:8000</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Properties</h1>
        <p className="text-sm text-gray-500 mt-1">Fractional real estate tokenized on Solana</p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 text-gray-600 text-sm">
          No properties listed yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  )
}
