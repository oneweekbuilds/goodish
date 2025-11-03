import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

interface PrivacyTermsPageProps {
  onNavigate: (page: string) => void;
}

export function PrivacyTermsPage({ onNavigate }: PrivacyTermsPageProps) {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="alg-fm min-h-screen" style={{ background: 'var(--background)' }}>
      <div 
        className="mx-auto"
        style={{ 
          maxWidth: '720px',
          paddingTop: 'calc(var(--navbar-height) + var(--spacing-3xl))',
          paddingBottom: 'var(--spacing-3xl)',
          paddingLeft: 'var(--spacing-lg)',
          paddingRight: 'var(--spacing-lg)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <h1 
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '48px',
              lineHeight: '60px',
              fontWeight: 700,
              color: 'var(--foreground)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Privacy & Terms
          </h1>
          
          <p 
            style={{
              fontSize: '14px',
              lineHeight: '22px',
              color: 'var(--foreground-muted)',
              marginBottom: 'var(--spacing-2xl)',
            }}
          >
            Last updated: {today}
          </p>

          {/* Summary */}
          <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '36px',
                lineHeight: '46px',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              Summary
            </h2>
            <p 
              style={{
                fontSize: '18px',
                lineHeight: '28px',
                color: 'var(--foreground-secondary)',
              }}
            >
              AlgorithmLens helps you understand what your feeds show you. We keep it simple: your data stays on your device unless you explicitly choose to share it.
            </p>
          </section>

          {/* Privacy */}
          <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '36px',
                lineHeight: '46px',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              Privacy
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {[
                { title: 'Local processing', desc: 'By default, analysis happens on your device or in your browser.' },
                { title: 'Minimal data', desc: 'If any data is sent to our servers (e.g., for optional features you enable), we limit it to what\'s required to provide that feature.' },
                { title: 'No selling data', desc: 'We never sell your personal data.' },
                { title: 'No third-party ads', desc: 'We do not run targeted third-party advertising based on your data.' },
                { title: 'Retention', desc: 'If you create an account, we store only what\'s needed for your account and billing. You can request deletion at any time.' },
                { title: 'Security', desc: 'We use industry-standard security practices. No method is perfect, but we actively work to protect your data.' },
                { title: 'Your choices', desc: 'You can export or delete your data from settings. Some features may stop working after deletion.' },
              ].map((item, i) => (
                <div key={i}>
                  <h3 
                    style={{
                      fontFamily: 'var(--font-headline)',
                      fontSize: '24px',
                      lineHeight: '34px',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    style={{
                      fontSize: '18px',
                      lineHeight: '28px',
                      color: 'var(--foreground-secondary)',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Terms of Use */}
          <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '36px',
                lineHeight: '46px',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              Terms of Use
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {[
                { title: 'Purpose', desc: 'AlgorithmLens provides analytics and educational insights about your content feeds.' },
                { title: 'No guarantees', desc: 'We try to be accurate, but insights are estimates and may not be complete. Use your own judgment.' },
                { title: 'Acceptable use', desc: 'Don\'t misuse the service, violate laws, or attempt to access other users\' data.' },
                { title: 'Account', desc: 'You\'re responsible for your account and keeping your credentials secure.' },
                { title: 'Changes', desc: 'We may update the service or these terms. We\'ll post updates here and update the date above.' },
                { title: 'Liability', desc: 'To the maximum extent allowed by law, AlgorithmLens isn\'t liable for indirect or consequential damages.' },
                { title: 'Contact', desc: 'Reach us at support@algorithmlens.com for questions about privacy or terms.' },
              ].map((item, i) => (
                <div key={i}>
                  <h3 
                    style={{
                      fontFamily: 'var(--font-headline)',
                      fontSize: '24px',
                      lineHeight: '34px',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      marginBottom: 'var(--spacing-xs)',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    style={{
                      fontSize: '18px',
                      lineHeight: '28px',
                      color: 'var(--foreground-secondary)',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Button */}
          <div style={{ marginTop: 'var(--spacing-3xl)', textAlign: 'center' }}>
            <Button
              onClick={() => onNavigate('')}
              style={{
                height: '56px',
                padding: '0 var(--spacing-lg)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--brand-gradient)',
                fontSize: '16px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
              }}
              className="group"
            >
              <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={18} />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

