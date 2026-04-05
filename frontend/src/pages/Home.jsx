import { useState, useEffect, useRef } from 'react'
import { fetchProperties } from '../lib/api'
import PropertyCard from '../components/PropertyCard'
import { Link } from 'react-router-dom'

function AnimatedCounter({ end, prefix = '', suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="card-accent p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="skeleton h-4 w-3/4 mb-2" />
          <div className="skeleton h-3 w-1/2" />
        </div>
        <div className="skeleton h-7 w-20 rounded-lg" />
      </div>
      <div className="mt-5">
        <div className="flex justify-between mb-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-16" />
        </div>
        <div className="skeleton h-1.5 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/5">
        <div><div className="skeleton h-2 w-10 mb-1.5" /><div className="skeleton h-3 w-12" /></div>
        <div><div className="skeleton h-2 w-10 mb-1.5" /><div className="skeleton h-3 w-12" /></div>
        <div><div className="skeleton h-2 w-10 mb-1.5" /><div className="skeleton h-3 w-14" /></div>
      </div>
    </div>
  )
}

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
          <div className="animate-fade-up inline-block mb-6 px-4 py-1.5 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/5 text-[#00d4aa] text-xs font-medium tracking-wide">
            Built on Solana
          </div>
          <h1 className="animate-fade-up stagger-1 text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Fractional Real Estate
            <br />
            <span className="gradient-text">Powered by Blockchain</span>
          </h1>
          <p className="animate-fade-up stagger-2 text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Invest in premium properties worldwide with as little as one token.
            Transparent, secure, and fully on-chain.
          </p>
          <div className="animate-fade-up stagger-3 flex items-center justify-center gap-4">
            <a href="#properties" className="btn-teal px-8 py-3 rounded-xl text-sm">
              Explore Properties
            </a>
            <Link to="/portfolio" className="btn-outline px-8 py-3 rounded-xl text-sm">
              View Portfolio
            </Link>
          </div>

          {/* Stats row with animated counters */}
          <div className="animate-fade-up stagger-4 grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16">
            <div>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter end={12} prefix="$" suffix="M+" />
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Value Locked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter end={1200} suffix="+" />
              </p>
              <p className="text-xs text-gray-500 mt-1">Token Holders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter end={15} suffix="+" />
              </p>
              <p className="text-xs text-gray-500 mt-1">Properties Listed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="animate-fade-up flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Properties</h2>
            <p className="text-sm text-gray-500 mt-1">Tokenized real estate opportunities</p>
          </div>
          <div className="h-px flex-1 ml-8 bg-gradient-to-r from-[#00d4aa]/20 to-transparent" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="text-center py-32 animate-fade-up">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-600 text-xs mt-2">Make sure the API server is running on localhost:8000</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-[#111827] border border-[#00d4aa]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No properties listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p, i) => (
              <div key={p.id} className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}>
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
