import { Link } from 'react-router-dom';
import { useUserProfile } from '../context/UserProfileContext';

const Navbar = () => {
    const { userProfile } = useUserProfile();
    
    return (
        <nav className="fixed top-0 left-0 w-full z-50 h-20 md:h-24 px-4 md:px-6 lg:px-12 flex items-center justify-between bg-bg-page/90 backdrop-blur-none border-b border-transparent" aria-label="Main navigation">
            <div className="flex items-center gap-4 md:gap-8">
                <Link to="/" className="flex items-center">
                    <img
                        src="/logo-full.png"
                        alt="AlgorithmLens"
                        className="h-8 md:h-10 w-auto max-w-[200px] md:max-w-[360px]"
                    />
                </Link>
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors" aria-label="Navigate to home page">
                        Home
                    </Link>
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
                </div>
            </div>
            <div className="flex items-center gap-4">
                {userProfile?.name && (
                    <span className="text-sm text-text-muted hidden md:block">
                        Hi, {userProfile.name}
                    </span>
                )}
                {!userProfile?.name && (
                    <span className="text-sm text-text-muted hidden md:block">
                        Hi there
                    </span>
                )}
                <button className="px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold border border-primary-blue text-primary-blue hover:bg-primary-blue/5 transition-colors" aria-label="Sign in to your account">
                    Sign In
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
