import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = (path) =>
    `text-sm font-medium transition-all duration-300 ${
      pathname === path
        ? 'text-[#00d4aa] drop-shadow-[0_0_8px_rgba(0,212,170,0.5)]'
        : 'text-gray-400 hover:text-[#00d4aa]'
    }`

  return (
    <nav
      className="nav-glass sticky top-0 z-50 transition-all duration-300 animate-fade-up"
      style={{
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(0,212,170,0.08)' : 'none',
        background: scrolled
          ? 'rgba(10, 14, 26, 0.95)'
          : 'rgba(10, 14, 26, 0.85)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#4f8ef7] flex items-center justify-center text-xs font-bold text-[#0a0e1a] shadow-[0_0_15px_rgba(0,212,170,0.3)] group-hover:shadow-[0_0_25px_rgba(0,212,170,0.5)] transition-shadow duration-300">
            P
          </div>
          <span className="text-white font-bold tracking-tight text-lg">
            Prop<span className="text-[#00d4aa]">Chain</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={linkClass('/')}>Properties</Link>
          <Link to="/portfolio" className={linkClass('/portfolio')}>Portfolio</Link>
          <button className="btn-teal text-xs px-4 py-2 rounded-lg">
            Connect Wallet
          </button>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-300 hover:text-[#00d4aa] transition-colors p-2"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0e1a]/95 backdrop-blur">
          <div className="px-4 py-4 flex flex-col gap-4">
            <Link to="/" className={linkClass('/')}>Properties</Link>
            <Link to="/portfolio" className={linkClass('/portfolio')}>Portfolio</Link>
            <button className="btn-teal text-xs px-4 py-2 rounded-lg w-full">
              Connect Wallet
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
