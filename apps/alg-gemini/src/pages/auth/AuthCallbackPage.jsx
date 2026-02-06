import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { exchangeCodeForSession } from '../../lib/auth/authSession';

/**
 * AuthCallbackPage - Handles magic link callback
 *
 * Behavior:
 * - Shows loading state while processing session
 * - Supabase automatically exchanges code for session
 * - Redirects to /dashboard on success
 * - Shows error state on failure
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session (Supabase v2 automatically handles the exchange)
        const { data: { session }, error: sessionError } = await exchangeCodeForSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session) {
          // Session established, redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // No session found
          setError('No session found. Please try signing in again.');
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate]);

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
