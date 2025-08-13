'use client'

import { useEffect, useRef, useState } from 'react'

export function AmbientSpotlight() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gradientRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current || !gradientRef.current) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const normalizedX = (event.clientX - centerX) / (rect.width / 2)
      const normalizedY = (event.clientY - centerY) / (rect.height / 2)
      
      setMousePosition({ x: normalizedX, y: normalizedY })
    }

    const updateGradientPosition = () => {
      if (!gradientRef.current) return

      const translateX = mousePosition.x * 20 // Subtle movement
      const translateY = mousePosition.y * 20

      gradientRef.current.style.transform = `translate3d(${translateX}%, ${translateY}%, 0)`
      animationFrameRef.current = requestAnimationFrame(updateGradientPosition)
    }

    window.addEventListener('mousemove', handleMouseMove)
    updateGradientPosition()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [mousePosition, prefersReducedMotion])

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Static gradient for reduced motion */}
      {prefersReducedMotion && (
        <div 
          className="absolute inset-0 bg-gradient-radial from-goodish-teal/20 via-goodish-green/10 to-transparent blur-3xl opacity-40"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 175, 193, 0.2) 0%, rgba(0, 71, 62, 0.1) 50%, transparent 100%)'
          }}
        />
      )}

      {/* Interactive gradient for normal motion */}
      {!prefersReducedMotion && (
        <div
          ref={gradientRef}
          className="absolute inset-0 bg-gradient-radial from-goodish-teal/20 via-goodish-green/10 to-transparent blur-3xl opacity-40 will-change-transform"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 175, 193, 0.2) 0%, rgba(0, 71, 62, 0.1) 50%, transparent 100%)',
            transform: 'translate3d(0, 0, 0)',
            transition: 'transform 0.1s ease-out'
          }}
        />
      )}

      {/* Additional ambient layer */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-goodish-amber/5 to-transparent opacity-30"
        style={{
          animation: prefersReducedMotion ? 'none' : 'pulse 8s ease-in-out infinite'
        }}
      />
    </div>
  )
}
