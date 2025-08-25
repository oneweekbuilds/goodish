"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/src/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
// Email signup handled via Beehiiv embed
import SubscribeForm from "@/src/components/SubscribeForm"
import { ArrowRight, Heart, Menu, X } from 'lucide-react'

// Professional Floating Label Input
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
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
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

export default function DonatePage() {
  const [email, setEmail] = useState("")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
        <div className="max-w-6xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full py-2">
            <Logo size="md" />
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Home
              </Link>
              <Link
                href="/quiz"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Quiz
              </Link>
              <Link
                href="/giving-styles"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Giving Styles
              </Link>
              <Link
                href="/matching-charities"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Matching Charities
              </Link>
              <Link
                href="/why-we-built-this"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Why We Built This
              </Link>
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                About
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
        <div className="container mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-12">
              <Heart className="h-16 w-16 text-[#f8cc55] mx-auto mb-8" strokeWidth="1.5" />
              <h1
                className="font-bold text-gray-900 leading-tight mb-8"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "3.5rem",
                  lineHeight: "1.1",
                }}
              >
                Donate to GoodHeart
              </h1>
              <p
                className="text-gray-600 mb-12 max-w-2xl mx-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "20px",
                  lineHeight: "1.6",
                }}
              >
                We don't accept donations yet — but we appreciate your support!
              </p>
            </div>

            {/* Message Card */}
            <Card className="bg-white/80 border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 mb-12">
              <CardContent className="p-12 text-center">
                <h2
                  className="font-bold text-gray-900 mb-6"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "28px",
                    lineHeight: "1.3",
                  }}
                >
                  Your Support Means Everything
                </h2>
                <p
                  className="text-gray-600 mb-8"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "18px",
                    lineHeight: "1.6",
                  }}
                >
                  Right now, we're focused on building the best possible charity matching experience. 
                  While we're not accepting donations to GoodHeart itself, the most meaningful way 
                  you can support our mission is by using our quiz to find amazing charities and 
                  giving directly to them.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-center gap-3">
                    <Heart className="h-5 w-5 text-[#f8cc55]" />
                    <span className="text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>
                      Take our quiz to find your perfect charity match
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Heart className="h-5 w-5 text-[#f8cc55]" />
                    <span className="text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>
                      Share GoodHeart with friends who care about giving
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Heart className="h-5 w-5 text-[#f8cc55]" />
                    <span className="text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>
                      Sign up for updates about our progress
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Link href="/quiz-questions" className="flex-1">
                    <Button
                      className="bg-[#f8cc55] hover:bg-[#f0c043] text-gray-800 py-3 px-6 rounded-xl font-semibold w-full"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Take the Quiz
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#updates" className="flex-1">
                    <Button
                      variant="outline"
                      className="bg-white hover:bg-gray-50 border-gray-300 text-gray-800 py-3 px-6 rounded-xl font-semibold w-full"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Get Updates
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Email Signup Section */}
            <div id="updates" className="bg-gradient-to-r from-[#f8cc55]/10 to-[#f0c043]/5 rounded-2xl p-12">
              <h3
                className="font-bold text-gray-900 mb-6"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "24px",
                  lineHeight: "1.3",
                }}
              >
                Stay Updated on Our Journey
              </h3>
              <p
                className="text-gray-600 mb-8 max-w-xl mx-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              >
                Be the first to know when we launch new features, add more charities, and share stories of impact from our community.
              </p>
              
              <SubscribeForm 
                variant="wide" 
                formId="goodheart"
                showHeading={false}
                bgBlendClass="bg-[#FFE066]"
              />
            </div>
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

      {/* Email signup handled via Beehiiv embed */}
    </div>
  )
}