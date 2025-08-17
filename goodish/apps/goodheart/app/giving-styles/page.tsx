"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "@/src/components/logo"
import { superpowers } from "@/src/data/superpowers"
import { ArrowRight, Heart, Users, Lightbulb, Globe, Shield, TreePine, GraduationCap, Menu, X, Zap, Leaf } from 'lucide-react'

// Mobile Navigation
const ProfessionalMobileNav = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in">
      <div className="bg-white w-full h-full pt-20 px-6 animate-slide-down">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-600 hover:text-gray-800">
          <X className="h-6 w-6" strokeWidth="2" />
        </button>
        <div className="flex flex-col space-y-8 pt-8">
          <Link
            href="/"
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Home
          </Link>
          <Link
            href="/quiz"
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Quiz
          </Link>
          <Link
            href="/giving-styles"
            className="text-left text-lg text-[#F4C500] font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Giving Styles
          </Link>
          <Link
            href="/matching-charities"
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Matching Charities
          </Link>
          <Link
            href="/why-we-built-this"
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Why We Built This
          </Link>
          <Link
            href="/about"
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            About
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function GivingStyles() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Map superpowers to icons and colors
  const iconMap = {
    "The Lifesaver": { icon: Heart, color: "#f8cc55" },
    "The Empowerer": { icon: Users, color: "#9333EA" },
    "The Nurturer": { icon: Shield, color: "#059669" },
    "The Health Defender": { icon: Globe, color: "#DC2626" },
    "The Animal Ally": { icon: Leaf, color: "#16A34A" },
    "The Earth Shielder": { icon: TreePine, color: "#2563EB" },
    "The Deep Feeler": { icon: Lightbulb, color: "#EA580C" },
    "The Future Builder": { icon: Zap, color: "#8B5CF6" },
    "The Food Reformer": { icon: GraduationCap, color: "#10B981" }
  }

  const givingStyles = superpowers.map(superpower => ({
    ...superpower,
    icon: iconMap[superpower.name]?.icon || Heart,
    color: iconMap[superpower.name]?.color || "#f8cc55",
    characteristics: [
      `Champions ${superpower.topCharity.name}`,
      `Also supports ${superpower.otherOption.name}`,
      "Evidence-based giving",
      "Maximum impact focus"
    ]
  }))

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fdfaf4",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .container {
          max-width: 1024px;
        }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40 h-20 lg:h-24">
        <div className="max-w-6xl mx-auto px-4 h-full">
          <div className="w-full px-2 py-3 flex items-center justify-between flex-wrap md:flex-nowrap overflow-hidden">
            <Logo size="md" />
            <div className="hidden md:flex items-center space-x-3 whitespace-nowrap">
              <Link
                href="/"
                className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-2 md:px-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Home
              </Link>
              <Link
                href="/quiz"
                className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-2 md:px-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Quiz
              </Link>
              <Link
                href="/giving-styles"
                className="text-sm md:text-base text-[#F4C500] font-medium border-b-2 pb-1 border-[#FFD95C] truncate px-2 md:px-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Giving Styles
              </Link>
              <Link
                href="/matching-charities"
                className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-2 md:px-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Matching Charities
              </Link>
              <Link
                href="/why-we-built-this"
                className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-2 md:px-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Why We Built This
              </Link>
              <Link
                href="/about"
                className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-2 md:px-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                About
              </Link>
              <Link
                href="/donate"
                className="ml-auto bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-4 rounded-xl shadow-sm transition whitespace-nowrap text-sm md:text-base"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Support GoodHeart
              </Link>
            </div>
            <div className="md:hidden">
              <button onClick={() => setMobileNavOpen(true)} className="text-gray-900 p-2">
                <Menu className="h-6 w-6" strokeWidth="2" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ProfessionalMobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1
              className="font-bold text-gray-900 leading-tight mb-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "3.5rem",
                lineHeight: "1.1",
              }}
            >
              Discover Your Giving Superpower
            </h1>
            <p
              className="text-gray-600 mb-12 max-w-2xl mx-auto"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "20px",
                lineHeight: "1.6",
              }}
            >
              Everyone gives differently. Here are the nine giving superpowers we help people discover through our quiz.
            </p>
          </div>

          {/* Giving Styles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {givingStyles.map((style, index) => {
              const IconComponent = style.icon
              return (
                <Card 
                  key={index} 
                  className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 h-full group"
                >
                  <CardContent className="p-6 md:p-8 h-full flex flex-col">
                    <div className="flex-1">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${style.color}20` }}
                      >
                        <IconComponent 
                          className="h-8 w-8" 
                          style={{ color: style.color }}
                          strokeWidth="2" 
                        />
                      </div>
                      <h3
                        className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 text-center"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {style.name}
                      </h3>
                      <p
                        className="text-base text-gray-600 leading-relaxed mb-6 text-center"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {style.tagline}
                      </p>
                      <div className="space-y-2">
                        {style.characteristics.map((char, charIndex) => (
                          <div key={charIndex} className="flex items-center gap-3">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: style.color }}
                            />
                            <span
                              className="text-gray-700 text-sm"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {char}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-6 md:mt-10">
            <h2
              className="font-bold text-gray-900 mb-6"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "28px",
                lineHeight: "1.3",
              }}
            >
              Ready to Discover Your Style?
            </h2>
            <p
              className="text-gray-600 mb-8 max-w-xl mx-auto"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "18px",
                lineHeight: "1.6",
              }}
            >
              Take our 2-minute quiz to find out which giving superpower matches your values and personality.
            </p>
            <Link href="/quiz-questions">
              <Button
                className="bg-[#FFD95C] hover:bg-[#F4C500] text-gray-800 py-4 px-8 text-lg font-semibold transition-all duration-200 hover:scale-105 rounded-xl"
                style={{
                  boxShadow: "0 4px 14px rgba(248, 204, 85, 0.25)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Take the Quiz
                <ArrowRight className="ml-3 h-5 w-5" strokeWidth="2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="flex flex-wrap justify-center gap-6 text-gray-500">
              <Link
                href="/why-we-built-this"
                className="hover:text-gray-700 transition-colors text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Why We Built This
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/about"
                className="hover:text-gray-700 transition-colors text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                About
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href="/privacy-policy"
                className="hover:text-gray-700 transition-colors text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

