import { motion } from 'motion/react';
import { Database, Brain, Eye, Lightbulb, ArrowRight, Shield, Heart, Users } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="alg-fm min-h-screen px-6 bg-background" style={{ paddingTop: '140px', paddingBottom: '64px' }}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-sm mb-4 uppercase tracking-wider" style={{ color: 'var(--foreground-muted)', fontWeight: 600 }}>
            Built at MIT
          </p>
          <h1 
            className="mb-6 tracking-tight" 
            style={{ 
              fontSize: 'clamp(40px, 6vw, 64px)', 
              fontWeight: 800,
              lineHeight: '1.1',
              fontFamily: 'var(--font-headline)',
            }}
          >
            How It Works
          </h1>
          <p className="text-xl leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            Built at MIT by students passionate about ethical AI and digital transparency.
          </p>
        </motion.div>

        {/* Process Flow */}
        <div className="mb-20">
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Flow Arrow Background */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 -translate-y-1/2 z-0" />
            
            {[
              {
                step: '1',
                icon: <Database size={32} />,
                title: 'Data',
                description: 'Connect your social accounts for read-only analysis. We collect only the minimal post metadata (topics, timing, engagement signals) needed to compute patterns. Content is processed locally whenever possible.',
                color: 'from-teal-500 to-cyan-500',
              },
              {
                step: '2',
                icon: <Brain size={32} />,
                title: 'Analysis',
                description: 'We cluster topics, detect sentiment and framing, and identify ads or sponsored content. Models are tuned for transparency and can show you the factors behind each insight.',
                color: 'from-violet-500 to-purple-500',
              },
              {
                step: '3',
                icon: <Eye size={32} />,
                title: 'Insight',
                description: 'See what dominates your feed, how it shifts over time, and where ads and opinions appear. Compare to the average user to spot what is uniquely amplified for you.',
                color: 'from-rose-500 to-pink-500',
              },
              {
                step: '4',
                icon: <Lightbulb size={32} />,
                title: 'Reflection',
                description: 'Turn insight into action. Mute topics, set goals (e.g., more diverse viewpoints), and track progress with weekly summaries.',
                color: 'from-amber-500 to-orange-500',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="relative z-10"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.7 }}
              >
                <Card 
                  className="h-full transition-all duration-300 bg-white group"
                  style={{ 
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    padding: '32px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.10)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  {/* Icon chip with gradient */}
                  <div 
                    className="rounded-full flex items-center justify-center text-white mb-6"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'var(--brand-gradient)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    {step.icon}
                  </div>
                  <h3 
                    className="mb-3" 
                    style={{ 
                      fontSize: '24px',
                      lineHeight: '34px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-headline)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="mb-4"
                    style={{ 
                      fontSize: '18px',
                      lineHeight: '28px',
                      color: 'var(--foreground-secondary)',
                    }}
                  >
                    {step.description}
                  </p>
                  <a 
                    href="#"
                    className="inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{
                      fontSize: '16px',
                      color: 'var(--brand-teal)',
                      fontWeight: 500,
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    Learn more →
                  </a>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>



        {/* Mission & Values - Enhanced */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: <Shield size={28} />,
              title: 'Privacy First',
              description: 'Your data stays yours. We analyze patterns, not personal content. Local processing is the default; if a cloud feature is enabled, you will see exactly what is sent and why.',
            },
            {
              icon: <Heart size={28} />,
              title: 'Human-Centered',
              description: 'Insights are designed to inform and empower — not judge. You control goals, filters, and notifications, and you can always export or delete your data.',
            },
            {
              icon: <Users size={28} />,
              title: 'Open Research',
              description: 'Built on transparent methods and peer-reviewed work. We publish methodology notes and validation results so that anyone can inspect how insights are produced.',
            },
          ].map((value, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
            >
              <Card 
                className="h-full transition-all duration-300 relative overflow-hidden"
                style={{ 
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  padding: '32px',
                  borderTop: '4px solid',
                  borderImage: 'var(--brand-gradient) 1',
                  background: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Subtle pattern overlay */}
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
                
                {/* Icon chip */}
                <div 
                  className="rounded-full flex items-center justify-center mb-4 relative z-10"
                  style={{
                    width: '56px',
                    height: '56px',
                    background: 'var(--brand-gradient)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                    color: 'white',
                  }}
                >
                  {value.icon}
                </div>
                <h3 
                  className="mb-3 relative z-10" 
                  style={{ 
                    fontSize: '24px',
                    lineHeight: '34px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-headline)',
                    color: 'var(--foreground)',
                  }}
                >
                  {value.title}
                </h3>
                <p 
                  className="relative z-10"
                  style={{ 
                    fontSize: '18px',
                    lineHeight: '28px',
                    color: 'var(--foreground-secondary)',
                    maxWidth: '340px',
                  }}
                >
                  {value.description}
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
          <h2 
            className="mb-4"
            style={{ 
              fontSize: '40px', 
              fontWeight: 700,
              fontFamily: 'var(--font-headline)',
            }}
          >
            Ready to understand your feed?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--foreground-secondary)' }}>
            Start exploring your algorithmic reality
          </p>
          <Button
            size="lg"
            className="text-lg h-14 px-10 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #8b5cf6 100%)',
            }}
            onClick={() => onNavigate('dashboard')}
          >
            Try the Dashboard
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

