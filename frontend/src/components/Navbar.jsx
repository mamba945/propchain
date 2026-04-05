import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  const linkClass = (path) =>
    `text-sm font-medium transition-all duration-300 ${
      pathname === path
        ? 'text-[#00d4aa] drop-shadow-[0_0_8px_rgba(0,212,170,0.5)]'
        : 'text-gray-400 hover:text-[#00d4aa]'
    }`

  return (
    <nav className="nav-glass sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#4f8ef7] flex items-center justify-center text-xs font-bold text-[#0a0e1a] shadow-[0_0_15px_rgba(0,212,170,0.3)] group-hover:shadow-[0_0_25px_rgba(0,212,170,0.5)] transition-shadow">
            P
          </div>
          <span className="text-white font-bold tracking-tight text-lg">
            Prop<span className="text-[#00d4aa]">Chain</span>
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/" className={linkClass('/')}>Properties</Link>
          <Link to="/portfolio" className={linkClass('/portfolio')}>Portfolio</Link>
          <button className="btn-teal text-xs px-4 py-2 rounded-lg">
            Connect Wallet
          </button>
        </div>
      </div>
    </nav>
  )
}
