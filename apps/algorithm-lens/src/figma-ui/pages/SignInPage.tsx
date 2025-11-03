import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';

interface SignInPageProps {
  onNavigate: (page: string) => void;
}

export function SignInPage({ onNavigate }: SignInPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('dashboard');
  };

  return (
    <div className="alg-fm min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Visual */}
      <div className="absolute inset-0 -z-10 opacity-40" style={{ background: 'var(--section-bg)' }} />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <button
            onClick={() => onNavigate('')}
            className="hover:opacity-80 transition-opacity"
          >
            <span className="font-semibold text-2xl" style={{ color: 'var(--brand-purple)' }}>AlgorithmLens</span>
          </button>
        </div>

        <Card className="p-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl tracking-tight mb-3" style={{ fontFamily: 'var(--font-headline)' }}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-lg" style={{ color: 'var(--foreground-secondary)' }}>
              {isSignUp
                ? 'Start understanding your algorithmic reality'
                : 'Sign in to view your insights'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--foreground-muted)' }}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-12 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--foreground-muted)' }}
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" style={{ borderColor: 'var(--border)' }} />
                  <span style={{ color: 'var(--foreground-muted)' }}>Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-lg" style={{ background: 'var(--brand-gradient)' }}>
              {isSignUp ? 'Create Account' : 'Sign In'}
              <ArrowRight className="ml-2" size={20} />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{ background: 'var(--card)', color: 'var(--foreground-muted)' }}>Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => onNavigate('dashboard')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span style={{ color: 'var(--foreground-muted)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </Card>

        <p className="text-center text-sm mt-8" style={{ color: 'var(--foreground-muted)' }}>
          By continuing, you agree to our{' '}
          <button className="hover:underline" style={{ color: 'var(--primary)' }} onClick={() => onNavigate('privacy-terms')}>Terms of Service</button>
          {' '}and{' '}
          <button className="hover:underline" style={{ color: 'var(--primary)' }} onClick={() => onNavigate('privacy-terms')}>Privacy Policy</button>
        </p>
      </motion.div>
    </div>
  );
}

