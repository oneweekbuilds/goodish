import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 h-24 px-6 md:px-12 flex items-center justify-between bg-bg-page/90 backdrop-blur-none border-b border-transparent">
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center" style={{ padding: '0 12px' }}>
                    <img
                        src="/logo-full.png"
                        alt="AlgorithmLens"
                        style={{ width: '360px', height: 'auto' }}
                    />
                </Link>
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors">
                        Home
                    </Link>
                    <Link to="/pricing" className="text-sm font-medium text-text-main hover:text-primary-blue transition-colors">
                        Pricing
                    </Link>
                </div>
            </div>
            <button className="px-6 py-2.5 rounded-full text-sm font-semibold border border-primary-blue text-primary-blue hover:bg-primary-blue/5 transition-colors">
                Sign In
            </button>
        </nav>
    );
};

export default Navbar;
