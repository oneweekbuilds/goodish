import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

const navLink =
  'px-4 py-3 text-[20px] font-bold transition-all duration-200 hover:bg-gray-100/40 rounded-lg flex items-center'

export default function Navbar() {

  return (
    <header
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200"
      style={{ height: 'var(--navbar-height)' }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-10 md:px-12 h-full">
        <Link to="/" className="focus:outline-none flex items-center">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <NavLink to="/dashboard" className={navLink + ' focus:outline-none'}>Dashboard</NavLink>
            <NavLink to="/how-it-works" className={navLink + ' focus:outline-none'}>How It Works</NavLink>
            <NavLink to="/pricing" className={navLink + ' focus:outline-none'}>Pricing</NavLink>
            <NavLink to="/export" className={navLink + ' focus:outline-none'}>Export</NavLink>
            <NavLink to="/connected-sessions" className={navLink + ' focus:outline-none'}>Sessions</NavLink>
            <NavLink to="/dataset" className={navLink + ' focus:outline-none'}>Dataset</NavLink>
            <NavLink to="/privacy" className={navLink + ' focus:outline-none'}>Privacy & Terms</NavLink>
            <NavLink
              to="/signin"
              className="px-6 py-3 rounded-full text-[20px] font-bold hover:bg-gray-100/40 active:scale-[.98] transition-all duration-200 focus:outline-none flex items-center"
            >
              Get Started
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}
