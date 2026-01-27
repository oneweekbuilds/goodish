import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isRouteGated, comingSoonConfig } from '../config/comingSoon';

/**
 * RouteGuard Component
 *
 * Redirects users to homepage if they try to access gated routes
 * when Coming Soon mode is enabled.
 */
const RouteGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isRouteGated(location.pathname)) {
      // Show redirect message
      setShowMessage(true);

      // Redirect to homepage
      navigate('/', { replace: true });

      // Hide message after 5 seconds
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, navigate]);

  return (
    <>
      {showMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-primary-blue/10 border border-primary-blue/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <p className="text-sm text-text-main text-center font-medium">
              {comingSoonConfig.redirectMessage}
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default RouteGuard;
