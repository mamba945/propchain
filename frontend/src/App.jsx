import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PropertyDetail from './pages/PropertyDetail'
import Portfolio from './pages/Portfolio'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb w-[500px] h-[500px] bg-[#00d4aa] top-[-200px] left-[-100px] fixed" />
      <div className="bg-orb w-[400px] h-[400px] bg-[#4f8ef7] bottom-[-150px] right-[-100px] fixed" style={{ animationDelay: '4s' }} />
      <div className="bg-orb w-[300px] h-[300px] bg-[#00b894] top-[50%] left-[50%] fixed" style={{ animationDelay: '2s' }} />

      <div className="relative z-10">
        <Navbar />
        <main key={location.pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
