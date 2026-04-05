import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  const linkClass = (path) =>
    `text-sm transition-colors ${
      pathname === path
        ? 'text-white'
        : 'text-gray-500 hover:text-gray-300'
    }`

  return (
    <nav className="border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-semibold tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold">
            P
          </div>
          PropChain
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className={linkClass('/')}>Properties</Link>
          <Link to="/portfolio" className={linkClass('/portfolio')}>Portfolio</Link>
        </div>
      </div>
    </nav>
  )
}
