import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from '../context/UserProfileContext';
import { useAuth } from '../lib/auth/useAuth';
import Logo from './Logo';
import { isComingSoon } from '../config/comingSoon';
import SignInPrompt from './auth/SignInPrompt';

const Navbar = () => {
    const { userProfile } = useUserProfile();
    const { session, authReady } = useAuth();
    const isSignedIn = authReady && !!session;
    const comingSoonMode = isComingSoon();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const mobileMenuRef = useRef(null);
    const menuButtonRef = useRef(null);

    // Track scroll for frosted glass shadow
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Close mobile menu on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (showSignInModal) {
                    setShowSignInModal(false);
                } else if (mobileMenuOpen) {
                    setMobileMenuOpen(false);
                    menuButtonRef.current?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [mobileMenuOpen, showSignInModal]);

    // Focus trap for sign-in modal
    useEffect(() => {
        if (showSignInModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showSignInModal]);

    // Check if a path is the current route
    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    // Nav link with active state (#7: Active route highlighting)
    const NavLink = ({ to, label, ariaLabel }) => (
        <Link
            to={to}
            className={`text-sm font-medium transition-colors ${
                isActive(to)
                    ? 'text-primary-blue'
                    : 'text-text-main hover:text-primary-blue'
            }`}
            aria-label={ariaLabel}
            aria-current={isActive(to) ? 'page' : undefined}
        >
            {label}
            {isActive(to) && (
                <span className="block h-[3px] bg-primary-blue rounded-full mt-0.5" />
            )}
        </Link>
    );

    // Disabled nav link for Coming Soon mode
    const DisabledNavLink = ({ children }) => (
        <span
            className="text-sm font-medium text-text-muted/40 cursor-not-allowed relative group"
            aria-disabled="true"
            tabIndex="0"
            role="link"
        >
            {children}
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-bg-page border border-primary-blue/30 rounded text-xs text-text-main whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none shadow-lg">
                Coming soon
            </span>
        </span>
    );

    // Mobile nav link with active state
    const MobileNavLink = ({ to, label }) => (
        <Link
            to={to}
            className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive(to)
                    ? 'text-primary-blue bg-primary-blue/5'
                    : 'text-text-main hover:bg-primary-blue/5 hover:text-primary-blue'
            }`}
            aria-current={isActive(to) ? 'page' : undefined}
            onClick={() => setMobileMenuOpen(false)}
        >
            {label}
        </Link>
    );

    // Mobile disabled link for Coming Soon mode
    const MobileDisabledLink = ({ label }) => (
        <span className="block px-4 py-3 text-base font-medium text-text-muted/40 cursor-not-allowed">
            {label}
            <span className="text-xs ml-2 text-text-muted/30">(Coming soon)</span>
        </span>
    );

    const navItems = [
        { to: '/', label: 'Home', ariaLabel: 'Navigate to home page' },
        { to: '/dashboard', label: 'Dashboard', ariaLabel: 'Navigate to dashboard' },
        { to: '/start', label: 'Scan', ariaLabel: 'Start a new scan' },
        { to: '/history', label: 'History', ariaLabel: 'View scan history' },
        { to: '/plus', label: 'Plus', ariaLabel: 'View Plus plans' },
    ];

    return (
        <>
            <nav
                className={`fixed top-0 left-0 w-full z-50 h-16 md:h-[72px] px-4 md:px-6 lg:px-12 flex items-center justify-between border-b border-border-light/50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-bg-page/80 backdrop-blur-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                        : 'bg-bg-page/80 backdrop-blur-lg'
                }`}
                aria-label="Main navigation"
            >
                <div className="flex items-center gap-4 md:gap-8">
                    <Link to="/" className="flex items-center">
                        <Logo variant="nav" />
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {comingSoonMode ? (
                            <>
                                <NavLink to="/" label="Home" ariaLabel="Navigate to home page" />
                                <DisabledNavLink>Dashboard</DisabledNavLink>
                                <DisabledNavLink>Scan</DisabledNavLink>
                                <DisabledNavLink>History</DisabledNavLink>
                                <DisabledNavLink>Plus</DisabledNavLink>
                            </>
                        ) : (
                            navItems.map(item => (
                                <NavLink key={item.to} {...item} />
                            ))
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* User greeting (desktop only) */}
                    {!comingSoonMode && userProfile?.name && (
                        <span className="text-sm text-text-muted hidden md:block">
                            Hi, {userProfile.name}
                        </span>
                    )}
                    {!comingSoonMode && !userProfile?.name && (
                        <span className="text-sm text-text-muted hidden md:block">
                            Hi there
                        </span>
                    )}

                    {/* Sign In button (#2: Wire Sign In to auth) - hidden when user is signed in */}
                    {!isSignedIn && (
                        comingSoonMode ? (
                            <DisabledNavLink>
                                <span className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold border border-text-muted/30 text-text-muted/40">
                                    Sign In
                                </span>
                            </DisabledNavLink>
                        ) : (
                            <button
                                onClick={() => setShowSignInModal(true)}
                                className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold border border-primary-blue text-primary-blue hover:bg-primary-blue/5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
                                aria-label="Sign in to your account"
                            >
                                Sign In
                            </button>
                        )
                    )}

                    {/* Mobile hamburger button (#1: Mobile menu) */}
                    <button
                        ref={menuButtonRef}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-text-main hover:bg-primary-blue/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-nav-menu"
                    >
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </nav>

            {/* Mobile slide-in menu (#1: Mobile hamburger menu) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Menu panel */}
                        <motion.div
                            ref={mobileMenuRef}
                            id="mobile-nav-menu"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute top-16 right-0 w-72 max-h-[calc(100vh-4rem)] bg-white border-l border-border-light shadow-strong overflow-y-auto pb-8 safe-area-inset-bottom"
                            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
                        >
                            {/* User greeting */}
                            {!comingSoonMode && (
                                <div className="px-4 py-3 border-b border-border-light">
                                    <p className="text-sm text-text-muted">
                                        {userProfile?.name ? `Hi, ${userProfile.name}` : 'Hi there'}
                                    </p>
                                </div>
                            )}

                            {/* Nav links */}
                            <div className="py-2 px-2">
                                {comingSoonMode ? (
                                    <>
                                        <MobileNavLink to="/" label="Home" />
                                        <MobileDisabledLink label="Dashboard" />
                                        <MobileDisabledLink label="Scan" />
                                        <MobileDisabledLink label="History" />
                                        <MobileDisabledLink label="Plus" />
                                    </>
                                ) : (
                                    navItems.map(item => (
                                        <MobileNavLink key={item.to} to={item.to} label={item.label} />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sign In Modal (#2: Wire Sign In button) */}
            {showSignInModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sign in">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowSignInModal(false)}
                        aria-hidden="true"
                    />
                    <div className="relative bg-white rounded-2xl shadow-strong max-w-md w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowSignInModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-primary-blue/5 transition-colors"
                            aria-label="Close sign in dialog"
                        >
                            <X size={20} />
                        </button>
                        <SignInPrompt
                            title="Sign in to AlgorithmLens"
                            body="Access your scans, dashboard, and personalized insights."
                            source="navbar_signin"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
