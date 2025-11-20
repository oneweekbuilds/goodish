import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

export function HeroComparison() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[1440px] mx-auto rounded-3xl overflow-hidden shadow-lg relative"
      style={{
        background: 'linear-gradient(90deg, #f9f9fb 0%, #ececf1 25%, #d1d6ff 50%, #cfe9f5 75%, #b3ecf7 100%)',
      }}
    >
      <div className="flex flex-col md:grid md:grid-cols-2 relative">
        {/* LEFT PANEL - Before AlgorithmLens */}
        <motion.div 
          className="relative flex flex-col items-center min-h-[640px]"
          style={{
            paddingTop: '80px',
            paddingBottom: '72px',
            paddingLeft: '60px',
            paddingRight: '60px',
          }}
          animate={isInView ? { opacity: 1 } : { opacity: 0.85 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <h2 
            className="text-center"
            style={{
              fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '22px',
              lineHeight: '28px',
              color: '#7b61ff',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            Before AlgorithmLens
          </h2>

          {/* Pills - 2×2 Grid */}
          <div className="flex flex-col items-center gap-7 mb-16">
            {/* Top Row */}
            <div className="flex gap-10">
              {/* Bias */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 0.9, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    width: '140px',
                    height: '48px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #e7e7e7 0%, #f3f3f3 100%)',
                  }}
                >
                  <span 
                    style={{
                      fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#555555',
                      textAlign: 'center',
                    }}
                  >
                    Bias
                  </span>
                </div>
              </motion.div>

              {/* Ads */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 0.9, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    width: '140px',
                    height: '48px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #e7e7e7 0%, #f3f3f3 100%)',
                  }}
                >
                  <span 
                    style={{
                      fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#555555',
                      textAlign: 'center',
                    }}
                  >
                    Ads
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="flex gap-10">
              {/* Mindless */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 0.9, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    width: '140px',
                    height: '48px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #e7e7e7 0%, #f3f3f3 100%)',
                  }}
                >
                  <span 
                    style={{
                      fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#555555',
                      textAlign: 'center',
                    }}
                  >
                    Mindless
                  </span>
                </div>
              </motion.div>

              {/* Opaque */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 0.9, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    width: '140px',
                    height: '48px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #e7e7e7 0%, #f3f3f3 100%)',
                  }}
                >
                  <span 
                    style={{
                      fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#555555',
                      textAlign: 'center',
                    }}
                  >
                    Opaque
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Text Block */}
          <div className="text-center space-y-3 max-w-[360px]">
            <h3 
              style={{
                fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '28px',
                lineHeight: '130%',
                color: '#1a1a1a',
              }}
            >
              You absorb what your feed feeds you.
            </h3>
            <p 
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '130%',
                color: '#555555',
              }}
            >
              You scroll, you absorb, you react — without realizing why.
            </p>
          </div>
        </motion.div>

        {/* RIGHT PANEL - With AlgorithmLens */}
        <motion.div 
          className="relative flex flex-col items-center min-h-[640px]"
          style={{
            paddingTop: '80px',
            paddingBottom: '72px',
            paddingLeft: '60px',
            paddingRight: '60px',
          }}
          animate={isInView ? { opacity: 1 } : { opacity: 0.9 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Header */}
          <h2 
            className="text-center relative z-10"
            style={{
              fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '22px',
              lineHeight: '28px',
              color: '#7b61ff',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            With AlgorithmLens
          </h2>

          {/* Pills */}
          <div className="flex flex-col items-center gap-7 mb-16 z-10">
            <div className="flex gap-10">
              {["Transparent","Mindful"].map((label, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx*0.1 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div 
                    className="flex items-center justify-center"
                    style={{ 
                      width: '140px',
                      height: '48px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #7b61ff 0%, #3ed6b2 100%)',
                      boxShadow: '0 0 5px rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <span 
                      style={{
                        fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                        fontWeight: 600,
                        fontSize: '18px',
                        color: 'white',
                        textAlign: 'center',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-10">
              {["Aware","Balanced"].map((label, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.5, delay: 0.4 + idx*0.1 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div 
                    className="flex items-center justify-center"
                    style={{ 
                      width: '140px',
                      height: '48px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #7b61ff 0%, #3ed6b2 100%)',
                      boxShadow: '0 0 5px rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <span 
                      style={{
                        fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                        fontWeight: 600,
                        fontSize: '18px',
                        color: 'white',
                        textAlign: 'center',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Text Block */}
          <div className="text-center space-y-3 max-w-[360px] relative z-10">
            <h3 
              style={{
                fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '28px',
                lineHeight: '130%',
                color: '#1a1a1a',
              }}
            >
              You see your feed with awareness.
            </h3>
            <p 
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '130%',
                color: '#555555',
              }}
            >
              You notice what you're shown, and decide what to believe.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}









