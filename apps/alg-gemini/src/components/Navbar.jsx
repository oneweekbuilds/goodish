import { Link } from 'react-router-dom';
import { useUserProfile } from '../context/UserProfileContext';
import Logo from './Logo';
import { isComingSoon } from '../config/comingSoon';

const Navbar = () => {
    const { userProfile } = useUserProfile();
    const comingSoonMode = isComingSoon();

    // Disabled nav link component for Coming Soon mode
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
    
    return (
        <nav className="fixed top-0 left-0 w-full z-50 h-14 md:h-16 px-4 md:px-6 lg:px-12 flex items-center justify-between bg-bg-page border-b border-transparent" aria-label="Main navigation">
            <div className="flex items-center gap-4 md:gap-8">
                <Link to="/" className="flex items-center">
                    <Logo variant="nav" />
                </Link>
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors" aria-label="Navigate to home page">
                        Home
                    </Link>
                    {comingSoonMode ? (
                        <>
                            <DisabledNavLink>Dashboard</DisabledNavLink>
                            <DisabledNavLink>Scan</DisabledNavLink>
                            <DisabledNavLink>History</DisabledNavLink>
                            <DisabledNavLink>Pricing</DisabledNavLink>
                        </>
                    ) : (
                        <>
                            <Link to="/dashboard" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors" aria-label="Navigate to dashboard">
                                Dashboard
                            </Link>
                            <Link to="/start" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors" aria-label="Start a new scan">
                                Scan
                            </Link>
                            <Link to="/history" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors" aria-label="View scan history">
                                History
                            </Link>
                            <Link to="/pricing" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors" aria-label="View pricing">
                                Pricing
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
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
                {comingSoonMode ? (
                    <DisabledNavLink>
                        <span className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold border border-text-muted/30 text-text-muted/40">
                            Sign In
                        </span>
                    </DisabledNavLink>
                ) : (
                    <button className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold border border-primary-blue text-primary-blue hover:bg-primary-blue/5 transition-colors" aria-label="Sign in to your account">
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
