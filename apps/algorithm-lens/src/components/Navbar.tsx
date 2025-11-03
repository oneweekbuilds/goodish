import { Link, NavLink, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'

const navLink =
  'px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent/30'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <header
      className="sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b"
      style={{ height: 'var(--navbar-height)' }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-6 h-full">
        <Link to="/" className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <span className="font-semibold">AlgorithmLens</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/dashboard" className={navLink + (pathname === '/dashboard' ? ' bg-accent/40' : '')}>Dashboard</NavLink>
          <NavLink to="/how-it-works" className={navLink + (pathname === '/how-it-works' ? ' bg-accent/40' : '')}>How It Works</NavLink>
          <NavLink to="/pricing" className={navLink + (pathname === '/pricing' ? ' bg-accent/40' : '')}>Pricing</NavLink>
          <NavLink to="/export" className={navLink + (pathname === '/export' ? ' bg-accent/40' : '')}>Export</NavLink>
          <NavLink to="/privacy" className={navLink + (pathname === '/privacy' ? ' bg-accent/40' : '')}>Privacy & Terms</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <NavLink
            to="/signin"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-foreground/80 text-background hover:opacity-90 transition"
          >
            Get Started
          </NavLink>
        </div>
      </div>
    </header>
  )
}
