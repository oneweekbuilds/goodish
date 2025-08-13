'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function HeroVisual() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)
  
  const rotateX = useTransform(springY, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-15deg", "15deg"])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const normalizedX = (event.clientX - centerX) / (rect.width / 2)
      const normalizedY = (event.clientY - centerY) / (rect.height / 2)
      
      mouseX.set(normalizedX)
      mouseY.set(normalizedY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Autonomous animated gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-goodish-teal/20 via-goodish-green/10 to-goodish-amber/20 blur-3xl opacity-40"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
        }}
      />
      
      {/* Mouse-follow spotlight */}
      <motion.div
        className="absolute w-96 h-96 bg-gradient-radial from-goodish-teal/30 via-goodish-green/20 to-transparent blur-2xl"
        style={{
          x: useTransform(springX, [-1, 1], ["-25%", "25%"]),
          y: useTransform(springY, [-1, 1], ["-25%", "25%"]),
        }}
      />
      
      {/* Additional ambient gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-goodish-teal/5 to-transparent"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}
