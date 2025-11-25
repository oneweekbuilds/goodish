import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative text-[15px] font-medium transition-all duration-200 font-heading tracking-wide",
      "hover:text-primary",
      isActive
        ? "text-primary font-semibold"
        : "text-muted-foreground"
    );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm h-20"
          : "bg-transparent h-24"
      )}
      style={{ minHeight: isScrolled ? '80px' : '96px' }}
    >
      <div className="h-full max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo-new.png"
            alt="AlgorithmLens"
            className="h-10 w-auto object-contain transition-all duration-300 mix-blend-multiply"
          />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-12">
          <NavLink to="/" className={navLinkClasses} end>
            Home
          </NavLink>
          <NavLink to="/how-it-works" className={navLinkClasses}>
            How It Works
          </NavLink>
          <NavLink to="/pricing" className={navLinkClasses}>
            Pricing
          </NavLink>
        </nav>

        {/* Right Auth Buttons */}
        <div className="flex items-center gap-8">
          <Link
            to="/signin"
            className="hidden md:block text-[15px] font-semibold text-muted-foreground hover:text-primary transition-colors font-heading"
          >
            Sign In
          </Link>
          <Link to="/signin">
            <Button
              variant="default"
              size="sm"
              className="rounded-lg px-6 py-2.5 h-10 text-[14px] font-bold bg-primary hover:bg-primary/90 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
