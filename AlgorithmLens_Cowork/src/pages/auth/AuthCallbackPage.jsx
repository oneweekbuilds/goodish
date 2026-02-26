import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth/useAuth';

/**
 * AuthCallbackPage - Handles magic link callback
 *
 * Behavior:
 * - Shows loading state while processing session
 * - Waits for AuthProvider to process session from URL
 * - Waits for AuthProvider to sync plan tier
 * - Redirects to /dashboard on success
 * - Shows error state on failure
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { session, authReady } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // [AUTH DEBUG] Log callback page state on every render
    const timestamp = new Date().toISOString();

    const params = new URLSearchParams(window.location.search);
    const paramKeys = Array.from(params.keys());
    const redactedParams = {};
    paramKeys.forEach(key => {
      if (key === 'code' || key === 'access_token' || key === 'refresh_token') {
        redactedParams[key] = 'REDACTED';
      } else {
        redactedParams[key] = params.get(key);
      }
    });

    // Wait for AuthProvider to finish initial auth check
    if (!authReady) {
      return;
    }

    // Check for error in URL params
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    if (session) {
      // Session established, redirect to dashboard
      navigate('/dashboard', { replace: true });
      return;
    }

    // No session yet - wait for Supabase to process the auth code
    // Set a timeout to show error if session doesn't arrive
    const timeoutId = setTimeout(() => {
      setError('Authentication timed out. Please try signing in again.');
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [authReady, session, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg-page pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 text-center mb-3">
            Sign-in failed
          </h1>

          <p className="text-slate-600 text-center mb-6 leading-relaxed">
            {error}
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-6 bg-primary-blue text-white rounded-full font-semibold text-base hover:bg-blue-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pt-28 pb-16 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-slate-600 text-lg">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
