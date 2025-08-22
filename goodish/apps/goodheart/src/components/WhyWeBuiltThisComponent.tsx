"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Compass, FlaskConical, Smile, Heart, TrendingDown, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Logo } from "../components/logo"
import SubscribeForm from "@/src/components/SubscribeForm"

// Enhanced Floating Label Input (reused from homepage)
const ProfessionalFloatingInput = ({ label, value, onChange, type = "text", ...props }) => {
  const [focused, setFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const hasValue = value && value.length > 0

  const handleSubmit = () => {
    if (value) {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    }
  }

  return (
    <form className="flex w-full max-w-md mx-auto">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        className="flex-grow px-4 py-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        style={{ fontFamily: "Inter, sans-serif" }}
        {...props}
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded-r-lg border border-yellow-400"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {submitted ? "You're in!" : "Join the List"}
      </button>
    </form>
  )
}

// Confusing Chart Graphic Component
const ConfusingDonationChart = () => {
  return (
    <div className="relative max-w-lg w-full mx-auto">
      <div
        className="bg-white rounded-xl p-8 border border-gray-200"
        style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}
      >
        {/* Chart Title */}
        <h4
          className="text-gray-700 font-semibold mb-6 text-center"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "16px" }}
        >
          Where Does Your $100 Actually Go?
        </h4>

        {/* Tangled Flow Visualization */}
        <div className="space-y-4">
          {/* Your Donation */}
          <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
            <span className="font-medium text-green-800" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
              Your $100 Donation
            </span>
            <span className="font-bold text-green-800">$100</span>
          </div>

          {/* Confusing Middle Section */}
          <div className="relative">
            {/* Tangled Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
              <path
                d="M50 20 Q200 60 350 40 Q200 100 50 80 Q200 140 350 120 Q200 180 50 160"
                stroke="#9CA3AF"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                opacity="0.6"
              />
              <path
                d="M50 40 Q150 20 250 80 Q300 120 350 100"
                stroke="#9CA3AF"
                strokeWidth="2"
                fill="none"
                strokeDasharray="3,3"
                opacity="0.4"
              />
            </svg>

            {/* Confusing Boxes */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs opacity-70">
                <span style={{ fontFamily: "Inter, sans-serif" }}>Administrative Costs</span>
                <span className="text-red-600">-$15?</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs opacity-70">
                <span style={{ fontFamily: "Inter, sans-serif" }}>Marketing & Fundraising</span>
                <span className="text-red-600">-$25?</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs opacity-70">
                <span style={{ fontFamily: "Inter, sans-serif" }}>Unknown Fees</span>
                <span className="text-red-600">-$??</span>
              </div>
            </div>
          </div>

          {/* Question Mark Result */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <span className="font-medium text-red-700" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
              Actual Impact
            </span>
            <span className="font-bold text-red-700 text-xl">?</span>
          </div>
        </div>

        {/* Confusion Indicator */}
        <div className="text-center mt-6">
          <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            It shouldn't be this complicated
          </p>
        </div>
      </div>
    </div>
  )
}

// Mobile Navigation (reused from homepage)
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
            href="/quiz-questions"
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Quiz
          </Link>
          <Link
            href="/why-we-built-this"
            className="text-left text-lg text-[#F4C500] font-medium"
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

// Decorative Sparkles Component
const DecorativeSparkles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <Sparkles className="absolute top-20 left-10 h-6 w-6 text-[#FFD95C] opacity-30 animate-pulse" />
      <Sparkles className="absolute top-32 right-16 h-4 w-4 text-[#F4C500] opacity-40 animate-pulse delay-1000" />
      <Sparkles className="absolute top-16 right-32 h-5 w-5 text-[#FFD95C] opacity-25 animate-pulse delay-2000" />
      <Sparkles className="absolute top-40 left-1/4 h-3 w-3 text-[#F4C500] opacity-35 animate-pulse delay-500" />
      <Sparkles className="absolute top-24 right-1/3 h-4 w-4 text-[#FFD95C] opacity-30 animate-pulse delay-1500" />
    </div>
  )
}

export default function WhyWeBuiltThisComponent() {
  const [email, setEmail] = useState("")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    // Enhanced fade in sections on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1"
            entry.target.style.transform = "translateY(0)"
          }
        })
      },
      { threshold: 0.1 },
    )

    const sections = document.querySelectorAll("section")
    sections.forEach((section) => {
      section.style.opacity = "0"
      section.style.transform = "translateY(20px)"
      section.style.transition = "opacity 0.8s ease, transform 0.8s ease"
      observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fdfaf4",
        color: "#111",
        scrollBehavior: "smooth",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Enhanced Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .container {
          max-width: 1140px;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        /* Enhanced button hover effects */
        .enhanced-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .enhanced-button:hover {
          transform: translateY(-1px) scale(1.02);
        }
        /* Smooth icon hover effects */
        .icon-hover {
          transition: transform 0.2s ease;
        }
        .icon-hover:hover {
          transform: scale(1.1);
        }
      `}</style>

      {/* Top Navigation - Reused from Homepage */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40 h-24 lg:h-28 shadow-sm">
        <div className="container mx-auto h-full">
          <div className="flex items-center justify-between h-full py-2">
            <Logo size="md" />
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-[#444] hover:text-[#111] transition-all duration-200 font-medium border-b-2 pb-1 border-transparent hover:border-[#FFD95C]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Home
              </Link>
              <Link
                href="/quiz-questions"
                className="text-[#444] hover:text-[#111] transition-all duration-200 font-medium border-b-2 pb-1 border-transparent hover:border-[#FFD95C]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Quiz
              </Link>
              <Link
                href="/why-we-built-this"
                className="text-[#F4C500] font-medium border-b-2 pb-1 border-[#FFD95C]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Why We Built This
              </Link>
              <Link
                href="/about"
                className="text-[#444] hover:text-[#111] transition-all duration-200 font-medium border-b-2 pb-1 border-transparent hover:border-[#FFD95C]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                About
              </Link>
            </div>
            <div className="md:hidden">
              <button onClick={() => setMobileNavOpen(true)} className="text-[#111] p-2">
                <Menu className="h-6 w-6" strokeWidth="2" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ProfessionalMobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Hero Section - Title + Statement */}
      <section className="relative py-24 bg-gradient-to-br from-[#FFD95C] to-[#F4C500] overflow-hidden">
        <DecorativeSparkles />
        <div className="container mx-auto text-center relative z-10">
          <h1
            className="font-bold text-gray-800 leading-tight mb-8"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "3.5rem",
              lineHeight: "1.1",
            }}
          >
            Why We Built This
          </h1>
          <p
            className="text-gray-700 mx-auto leading-relaxed"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "20px",
              lineHeight: "1.6",
              maxWidth: "600px",
            }}
          >
            We believe that everyone who wants to help deserves to know their generosity is making the biggest
            difference possible. GoodHeart bridges the gap between caring hearts and effective action.
          </p>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24" style={{ backgroundColor: "#fdfaf4" }}>
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Text */}
            <div>
              <h2
                className="font-bold text-[#111] mb-12"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "36px",
                  lineHeight: "1.3",
                }}
              >
                The Problem With Giving Today
              </h2>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-[#FFD95C] rounded-full mt-3 flex-shrink-0"></div>
                  <p
                    className="text-[#444]"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "18px",
                      lineHeight: "1.6",
                    }}
                  >
                    It's hard to know which charities are actually effective.
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-[#FFD95C] rounded-full mt-3 flex-shrink-0"></div>
                  <p
                    className="text-[#444]"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "18px",
                      lineHeight: "1.6",
                    }}
                  >
                    Giving often feels disconnected.
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-[#FFD95C] rounded-full mt-3 flex-shrink-0"></div>
                  <p
                    className="text-[#444]"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "18px",
                      lineHeight: "1.6",
                    }}
                  >
                    We rarely see the real impact of our donations.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Chart Graphic */}
            <div>
              <ConfusingDonationChart />
            </div>
          </div>
        </div>
      </section>

      {/* The GoodHeart Approach Section */}
      <section className="py-24 bg-gradient-to-br from-[#FFD95C]/10 to-[#F4C500]/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2
              className="font-bold text-[#111] mb-6"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "36px",
                lineHeight: "1.3",
              }}
            >
              GoodHeart Fixes That
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Built on Your Values */}
            <Card
              className="bg-white rounded-xl border border-gray-200 hover:border-[#FFD95C] hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 h-full"
              style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}
            >
              <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-[#FFD95C] rounded-xl flex items-center justify-center mx-auto mb-6 transition-all duration-200 group-hover:scale-110 icon-hover">
                    <Compass className="h-8 w-8 text-gray-800" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-bold text-[#111] mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", lineHeight: "1.5" }}
                  >
                    Built on Your Values
                  </h3>
                  <p
                    className="text-[#444]"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "1.5" }}
                  >
                    Our quiz matches you to the causes that mean the most to you.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Backed by Research */}
            <Card
              className="bg-white rounded-xl border border-gray-200 hover:border-[#FFD95C] hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 h-full"
              style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}
            >
              <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-[#FFD95C] rounded-xl flex items-center justify-center mx-auto mb-6 transition-all duration-200 group-hover:scale-110 icon-hover">
                    <FlaskConical className="h-8 w-8 text-gray-800" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-bold text-[#111] mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", lineHeight: "1.5" }}
                  >
                    Smart Giving
                  </h3>
                  <p
                    className="text-[#444]"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "1.5" }}
                  >
                    We surface effective nonprofits working on your causes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Simple & Joyful */}
            <Card
              className="bg-white rounded-xl border border-gray-200 hover:border-[#FFD95C] hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 h-full"
              style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}
            >
              <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-[#FFD95C] rounded-xl flex items-center justify-center mx-auto mb-6 transition-all duration-200 group-hover:scale-110 icon-hover">
                    <Smile className="h-8 w-8 text-gray-800" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-bold text-[#111] mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", lineHeight: "1.5" }}
                  >
                    Real Impact
                  </h3>
                  <p
                    className="text-[#444]"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "1.5" }}
                  >
                    See how your value-aligned giving makes a real difference.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Call to Action - Join the Movement */}
      <section className="bg-gradient-to-r from-[#FFD95C] to-[#F4C500] relative overflow-hidden py-24">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h2
                className="font-bold text-gray-800 mb-4"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "36px",
                  lineHeight: "1.5",
                }}
              >
                Ready to Give with Impact?
              </h2>
              <p
                className="text-gray-700"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  lineHeight: "1.5",
                }}
              >
                Join the list and get early access when we launch.
              </p>
            </div>

            <SubscribeForm 
              variant="wide" 
              formId="goodheart"
              showHeading={false}
              bgBlendClass="bg-[#FFE066]"
            />
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Logo size="lg" />
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-gray-500">
              <Link
                href="/"
                className="hover:text-[#111] transition-colors duration-200"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              >
                Home
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/quiz-questions"
                className="hover:text-[#111] transition-colors duration-200"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              >
                Quiz
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/why-we-built-this"
                className="hover:text-[#111] transition-colors duration-200"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              >
                Why We Built This
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/about"
                className="hover:text-[#111] transition-colors duration-200"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              >
                About
              </Link>
            </div>
          </div>

          <div className="text-center mt-8 text-gray-500">
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
              © 2025 GoodHeart. Made with care for givers everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
