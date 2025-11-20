import { motion } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/input';
import { HeroComparison } from './HeroComparison';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [email, setEmail] = useState('');

  const scrollToDashboard = () => {
    onNavigate('dashboard');
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onNavigate('signin');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative overflow-visible flex items-center"
        style={{ 
          minHeight: '100vh',
          paddingTop: 'var(--navbar-height)',
          paddingBottom: 'var(--spacing-4xl)',
          paddingLeft: 'var(--grid-margin)',
          paddingRight: 'var(--grid-margin)',
          background: 'linear-gradient(180deg, #FAFBFF 0%, rgba(240, 253, 250, 0.85) 40%, rgba(250, 245, 255, 0.85) 100%)',
        }}
      >
        {/* Subtle radial gradient behind H1 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-[0.06]" style={{
          background: 'var(--brand-bg-gradient)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--brand-purple) 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }} />

        <div className="w-full max-w-[1280px] mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline - H1 */}
            <motion.h1
              className="text-h1"
              style={{ 
                fontSize: '48px',
                lineHeight: '60px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                fontFamily: 'var(--font-headline)',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--foreground)',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              See your algorithm.{' '}
              <span className="block" style={{ marginTop: 'var(--spacing-xs)' }}>Understand your feed.</span>
            </motion.h1>

            {/* BUILT AT MIT - Below H1 */}
            <motion.p
              style={{ 
                fontSize: '16px',
                lineHeight: '22px',
                color: 'var(--foreground-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: 'var(--spacing-sm)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              BUILT AT MIT
            </motion.p>

            {/* Gradient bar beneath BUILT AT MIT label */}
            <motion.div
              style={{
                width: '48px',
                height: '4px',
                background: 'var(--brand-gradient)',
                borderRadius: '2px',
                margin: '0 auto var(--spacing-sm)',
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />

            {/* Descriptive subhead */}
            <motion.p
              className="text-body-large"
              style={{ 
                color: 'var(--foreground-secondary)',
                maxWidth: '600px',
                margin: '0 auto var(--spacing-xl)',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Algorithms quietly learn what you like — and feed it back to you.
              With AlgorithmLens, you can finally see what they see in you — and decide for yourself what to believe.
            </motion.p>

            {/* Email Capture Form - 480px input + 16px gap + 240px CTA = 736px total width */}
            <motion.form
              onSubmit={handleEmailSubmit}
              style={{
                maxWidth: '736px',
                width: '100%',
                margin: '0 auto var(--spacing-sm)',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row" style={{ gap: '16px' }}>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    height: '56px',
                    padding: '16px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E4E7EC',
                    flex: '1',
                    minWidth: '320px',
                    background: 'var(--card-bg)',
                  }}
                  className="focus:outline-none focus:ring-1 focus:ring-[var(--brand-purple)]"
                />
                <Button 
                  type="submit"
                  style={{
                    height: '56px',
                    width: '240px',
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    borderRadius: '8px',
                    background: 'var(--brand-gradient)',
                    transition: 'var(--transition-hover)',
                    whiteSpace: 'nowrap',
                    gap: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="group"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--brand-gradient-reverse)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--brand-gradient)';
                  }}
                >
                  Get Your Free Analysis
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                </Button>
              </div>
            </motion.form>

            {/* Trust copy */}
            <motion.p
              className="text-small"
              style={{ 
                color: 'var(--foreground-tertiary)',
                marginBottom: 'var(--spacing-md)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Takes under 60 seconds. No setup. Just insight.
            </motion.p>

            {/* Secondary link */}
            <motion.button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center hover:underline group"
              style={{ 
                color: 'var(--brand-teal)',
                fontSize: '16px',
                gap: 'var(--spacing-xs)',
                marginBottom: 'var(--spacing-2xl)',
                transition: 'var(--transition-fast)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Learn how it works
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" style={{ transition: 'var(--transition-base)' }} />
            </motion.button>

            {/* Hero Comparison Visual */}
            <motion.div
              style={{ marginTop: 'var(--spacing-3xl)' }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <HeroComparison />
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
              className="text-center"
              style={{ marginTop: 'var(--spacing-3xl)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              <p className="text-body" style={{ color: 'var(--foreground-secondary)', marginBottom: 'var(--spacing-md)' }}>
                See what your algorithm sees in you. It starts here.
              </p>
              <Button
                onClick={scrollToDashboard}
                style={{
                  height: '56px',
                  padding: '0 var(--spacing-lg)',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--brand-gradient)',
                  transition: 'var(--transition-hover)',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
                className="group"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--brand-gradient-reverse)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--brand-gradient)';
                }}
              >
                Try it free
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} style={{ marginLeft: 'var(--spacing-xs)' }} />
              </Button>
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              className="inline-flex flex-col items-center gap-2 cursor-pointer mt-16"
              onClick={scrollToHowItWorks}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <span className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)', fontWeight: 600 }}>
                Learn More
              </span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown size={24} style={{ color: 'var(--foreground-muted)' }} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className="container-content section-spacing"
        style={{ 
          paddingTop: 'var(--spacing-section)',
          paddingBottom: '72px',
          background: 'var(--section-bg)',
        }}
      >
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            className="text-center mx-auto"
            style={{ maxWidth: '600px', marginBottom: 'var(--spacing-3xl)' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 
              className="text-h2"
              style={{ 
                marginBottom: 'var(--spacing-md)',
                color: 'var(--foreground)',
              }}
            >
              Your feed is an invisible mirror
            </h2>
            
            {/* Gradient bar beneath H2 */}
            <div
              style={{
                width: '48px',
                height: '4px',
                background: 'var(--brand-gradient)',
                borderRadius: '2px',
                margin: '0 auto var(--spacing-md)',
              }}
            />
            
            <p className="text-body-large" style={{ color: 'var(--foreground-secondary)' }}>
              AlgorithmLens helps you finally see the reflection — built by MIT students passionate about ethical AI.
            </p>
          </motion.div>

          {/* Four-step flow */}
          <div className="grid md:grid-cols-4 relative" style={{ gap: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-3xl)' }}>
            {/* Connector line */}
            <div 
              className="hidden md:block absolute left-0 right-0 -z-10" 
              style={{
                top: '80px',
                height: '2px',
                background: 'var(--brand-gradient)',
                opacity: 0.2,
              }}
            />
            
            {[
              {
                step: '1',
                title: 'Data',
                description: 'Connect your social feeds securely',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <rect x="6" y="22" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2.5" />
                    <rect x="6" y="13" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2.5" />
                    <rect x="6" y="4" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                ),
              },
              {
                step: '2',
                title: 'Algorithm Analysis',
                description: 'AI identifies patterns and biases',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M 25 25 L 31 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="3" fill="currentColor" />
                  </svg>
                ),
              },
              {
                step: '3',
                title: 'Insights',
                description: 'Clear visualizations reveal patterns',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M 18 6 L 22 16 L 32 16 L 24 22 L 28 32 L 18 26 L 8 32 L 12 22 L 4 16 L 14 16 Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
                    <rect x="14" y="10" width="8" height="3" fill="currentColor" opacity="0.5" />
                  </svg>
                ),
              },
              {
                step: '4',
                title: 'Reflection',
                description: 'Understand and reshape your feed',
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="14" r="8" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M 10 22 Q 10 30 18 30 Q 26 30 26 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <ellipse cx="12" cy="6" rx="6" ry="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                    <path d="M 14 8 Q 16 10 14 12" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="relative z-10"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.24 }}
              >
                <Card 
                  className="h-full transition-all group relative"
                  style={{ 
                    borderRadius: '20px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
                    padding: '32px',
                    background: 'var(--card-bg)',
                    transition: 'var(--transition-hover)',
                    cursor: 'default',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    const iconChip = e.currentTarget.querySelector('.icon-chip') as HTMLElement;
                    if (iconChip) {
                      iconChip.style.filter = 'brightness(1.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    const iconChip = e.currentTarget.querySelector('.icon-chip') as HTMLElement;
                    if (iconChip) {
                      iconChip.style.filter = 'brightness(1)';
                    }
                  }}
                >
                  {/* Subtle diagonal pattern background */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0.02,
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--brand-purple) 10px, var(--brand-purple) 11px)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Number badge - top-left */}
                  <div 
                    className="inline-flex items-center justify-center"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '14px',
                      background: '#EEF2FF',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--brand-purple)',
                      marginBottom: 'var(--spacing-md)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {step.step}
                  </div>
                  
                  {/* Icon chip - 56x56 circular with gradient and elevation shadow */}
                  <div 
                    className="icon-chip flex items-center justify-center mx-auto"
                    style={{ 
                      width: '56px',
                      height: '56px',
                      marginBottom: 'var(--spacing-md)',
                      borderRadius: '50%',
                      background: 'var(--brand-gradient)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                      color: 'white',
                      transition: 'var(--transition-hover)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <div style={{ width: '36px', height: '36px' }}>
                      {step.icon}
                    </div>
                  </div>
                  
                  <h3 
                    className="text-center" 
                    style={{ 
                      marginBottom: 'var(--spacing-sm)',
                      fontSize: '24px',
                      lineHeight: '34px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-headline)',
                      color: 'var(--foreground)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="text-center" 
                    style={{ 
                      fontSize: '18px',
                      lineHeight: '28px',
                      color: 'var(--foreground-secondary)',
                      maxWidth: '280px',
                      margin: '0 auto',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Button
              size="lg"
              className="text-lg h-14 px-10 transition-all duration-300"
              style={{
                background: 'var(--brand-gradient)',
                color: '#FFFFFF',
                boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
              }}
              onClick={scrollToDashboard}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--brand-gradient-reverse)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--brand-gradient)';
              }}
            >
              Try the Dashboard
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
