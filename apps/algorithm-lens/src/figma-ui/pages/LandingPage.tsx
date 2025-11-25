import { motion } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../../components/homepage/Hero';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface LandingPageProps {
  onNavigate?: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const navigate = useNavigate();
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="alg-fm min-h-screen">
      {/* Hero Section */}
      <Hero onNavigate={onNavigate} />

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="container-content mt-12 pt-16"
        style={{
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

            <div
              style={{
                width: '48px',
                height: '4px',
                background: 'var(--primary)',
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
                background: 'var(--border)',
                opacity: 1,
              }}
            />

            {[{
              step: '1', title: 'Data', description: 'Connect your social feeds securely',
              icon: (<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect x="6" y="22" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2.5" />
                <rect x="6" y="13" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2.5" />
                <rect x="6" y="4" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2.5" />
              </svg>)
            }, {
              step: '2', title: 'Algorithm Analysis', description: 'AI identifies patterns and biases',
              icon: (<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="2.5" />
                <path d="M 25 25 L 31 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="18" cy="18" r="3" fill="currentColor" />
              </svg>)
            }, {
              step: '3', title: 'Insights', description: 'Clear visualizations reveal patterns',
              icon: (<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M 18 6 L 22 16 L 32 16 L 24 22 L 28 32 L 18 26 L 8 32 L 12 22 L 4 16 L 14 16 Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <rect x="14" y="10" width="8" height="3" fill="currentColor" opacity="0.5" />
              </svg>)
            }, {
              step: '4', title: 'Reflection', description: 'Understand and reshape your feed',
              icon: (<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="14" r="8" stroke="currentColor" strokeWidth="2.5" />
                <path d="M 10 22 Q 10 30 18 30 Q 26 30 26 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="12" cy="6" rx="6" ry="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <path d="M 14 8 Q 16 10 14 12" stroke="currentColor" strokeWidth="2.5" fill="none" />
              </svg>)
            }].map((step, i) => (
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
                    if (iconChip) iconChip.style.filter = 'brightness(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    const iconChip = e.currentTarget.querySelector('.icon-chip') as HTMLElement;
                    if (iconChip) iconChip.style.filter = 'brightness(1)';
                  }}
                >
                  {/* Subtle diagonal pattern background */}
                  <div
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      opacity: 0.02,
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--brand-purple) 10px, var(--brand-purple) 11px)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Number badge */}
                  <div
                    className="inline-flex items-center justify-center"
                    style={{
                      width: '28px', height: '28px', borderRadius: '14px',
                      background: '#EEF2FF', fontSize: '12px', fontWeight: 600,
                      color: 'var(--brand-purple)', marginBottom: 'var(--spacing-md)',
                      position: 'relative', zIndex: 1,
                    }}
                  >
                    {step.step}
                  </div>

                  {/* Icon chip */}
                  <div
                    className="icon-chip flex items-center justify-center mx-auto"
                    style={{
                      width: '56px', height: '56px', marginBottom: 'var(--spacing-md)',
                      borderRadius: '50%', background: 'var(--primary)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)', color: 'white',
                      transition: 'var(--transition-hover)', position: 'relative', zIndex: 1,
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
                      fontSize: '24px', lineHeight: '34px', fontWeight: 600,
                      fontFamily: 'var(--font-headline)', color: 'var(--foreground)',
                      position: 'relative', zIndex: 1,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-center"
                    style={{
                      fontSize: '18px', lineHeight: '28px', color: 'var(--foreground-secondary)',
                      maxWidth: '280px', margin: '0 auto', position: 'relative', zIndex: 1,
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 text-lg h-14 px-10"
              style={{
                boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
              }}
              onClick={() => navigate('/dashboard')}
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




