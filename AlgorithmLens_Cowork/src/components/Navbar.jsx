import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, LayoutDashboard, ScanLine, Clock, Star, Settings } from 'lucide-react';
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
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Track scroll for frosted glass shadow
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close sign-in modal on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && showSignInModal) {
                setShowSignInModal(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showSignInModal]);

    // Lock body scroll for sign-in modal
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
    // (Audit 8 L2) Added aria-description for screen reader context
    const DisabledNavLink = ({ children }) => (
        <span
            className="text-sm font-medium text-text-muted/40 cursor-not-allowed relative group"
            aria-disabled="true"
            aria-description="Coming soon"
            tabIndex="0"
            role="link"
        >
            {children}
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-bg-page border border-primary-blue/30 rounded text-xs text-text-main whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none shadow-lg" aria-hidden="true">
                Coming soon
            </span>
        </span>
    );

    // Icon map for bottom tab bar
    const iconMap = {
        '/': Home,
        '/dashboard': LayoutDashboard,
        '/start': ScanLine,
        '/history': Clock,
        '/plus': Star,
        '/settings': Settings,
    };

    // Bottom tab bar link for mobile
    const TabBarLink = ({ to, label }) => {
        const Icon = iconMap[to] || Home;
        const active = isActive(to);
        return (
            <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 min-w-0 transition-colors ${
                    active
                        ? 'text-primary-blue'
                        : 'text-text-muted hover:text-primary-blue'
                }`}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
            >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none truncate">{label}</span>
            </Link>
        );
    };

    const navItems = [
        { to: '/', label: 'Home', ariaLabel: 'Navigate to home page' },
        { to: '/dashboard', label: 'Dashboard', ariaLabel: 'Navigate to dashboard' },
        { to: '/start', label: 'Scan', ariaLabel: 'Start a new scan' },
        { to: '/history', label: 'History', ariaLabel: 'View scan history' },
        { to: '/plus', label: 'Plus', ariaLabel: 'View Plus plans' },
        { to: '/settings', label: 'Settings', ariaLabel: 'Account settings' },
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
                                <DisabledNavLink>Settings</DisabledNavLink>
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
                    {/* User greeting (desktop only) - only show when user has a name */}
                    {!comingSoonMode && userProfile?.name && (
                        <span className="text-sm text-text-muted hidden md:block">
                            Hi, {userProfile.name}
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

                </div>
            </nav>

            {/* Mobile persistent bottom tab bar (replaces hamburger menu per design system) */}
            <nav
                className="fixed bottom-0 left-0 w-full z-40 md:hidden bg-white/90 backdrop-blur-lg border-t border-border-light safe-area-inset-bottom"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Mobile navigation"
            >
                <div className="grid grid-cols-6 items-center h-14">
                    {comingSoonMode ? (
                        <>
                            <TabBarLink to="/" label="Home" />
                            {['Dashboard', 'Scan', 'History', 'Plus', 'Settings'].map(label => (
                                <span key={label} className="flex flex-col items-center justify-center gap-0.5 py-1.5 text-text-muted/30 cursor-not-allowed" aria-disabled="true">
                                    {(() => { const Icon = iconMap[navItems.find(i => i.label === label)?.to] || Home; return <Icon size={20} strokeWidth={2} />; })()}
                                    <span className="text-[10px] font-medium leading-none">{label}</span>
                                </span>
                            ))}
                        </>
                    ) : (
                        navItems.map(item => (
                            <TabBarLink key={item.to} to={item.to} label={item.label} />
                        ))
                    )}
                </div>
            </nav>

            {/* Sign In Modal (#2: Wire Sign In button) */}
            {showSignInModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sign in">
                    <div
                        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
                        onClick={() => setShowSignInModal(false)}
                        aria-hidden="true"
                    />
                    <div className="relative bg-white rounded-2xl shadow-strong max-w-md w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowSignInModal(false)}
                            className="absolute top-4 right-4 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-main hover:bg-primary-blue/5 transition-colors"
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
