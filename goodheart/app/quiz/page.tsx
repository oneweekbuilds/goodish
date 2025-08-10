"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ArrowRight, Lightbulb, Home, HelpCircle } from 'lucide-react'
import { Logo } from "@/src/components/logo"

// Professional Interactive Quiz Mockup Illustration
const ProfessionalQuizMockup = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [progress, setProgress] = useState(0)

  const mockQuestions = [
    {
      question: "What causes inspire you most?",
      options: ["Education", "Animal Welfare", "Climate", "Health"],
    },
    {
      question: "How do you prefer to create change?",
      options: ["Direct Support", "Advocacy", "Research", "Community"],
    },
    {
      question: "What motivates your giving?",
      options: ["Local Impact", "Global Reach", "Innovation", "Tradition"],
    },
  ]

  useEffect(() => {
    const questionInterval = setInterval(() => {
      setCurrentQuestion((prev) => (prev + 1) % mockQuestions.length)
      setSelectedOption(null)
      setProgress(((currentQuestion + 1) / mockQuestions.length) * 100)
    }, 3500)

    return () => clearInterval(questionInterval)
  }, [currentQuestion])

  const currentQ = mockQuestions[currentQuestion]

  return (
    <div className="relative max-w-lg w-full mx-auto lg:mx-0">
      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-1000"
        style={{
          background: "linear-gradient(135deg, rgba(248, 204, 85, 0.08) 0%, rgba(248, 204, 85, 0.03) 100%)",
          boxShadow: "0 8px 32px rgba(248, 204, 85, 0.12)",
        }}
      />

      {/* Main mockup container */}
      <div
        className="relative bg-white rounded-2xl p-8 transform rotate-1 hover:rotate-0 transition-all duration-500"
        style={{
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        {/* Clean header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span
              className="font-medium text-gray-600 ml-2"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
            >
              Quiz
            </span>
          </div>
          <div className="text-xs text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
            Step {currentQuestion + 1} of {mockQuestions.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#f8cc55] h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question content */}
        <div className="space-y-6">
          <h3
            className="text-xl font-semibold text-gray-900 transition-all duration-500"
            style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.4" }}
          >
            {currentQ.question}
          </h3>

          {/* Clean options */}
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <div
                key={`${currentQuestion}-${index}`}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  selectedOption === index
                    ? "border-[#f8cc55] bg-[#f8cc55]/5"
                    : "border-gray-200 hover:border-[#f8cc55]/50 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedOption(index)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      selectedOption === index ? "border-[#f8cc55] bg-[#f8cc55]" : "border-gray-300"
                    }`}
                  >
                    {selectedOption === index && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                  </div>
                  <span
                    className="font-medium text-gray-700"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "16px" }}
                  >
                    {option}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Next button */}
          <div className="flex justify-end pt-4">
            <Button
              className={`bg-[#f8cc55] hover:bg-[#f0c043] text-gray-800 px-6 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                selectedOption !== null ? "opacity-100 scale-100" : "opacity-60 scale-95"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Professional Navigation Component
const ProfessionalNavigation = () => {
  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40 h-20 lg:h-24">
      <div className="max-w-6xl mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full py-2">
          <Logo size="md" />
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center gap-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/why-we-built-this"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center gap-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <HelpCircle className="h-4 w-4" />
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
        </div>
      </div>
    </nav>
  )
}

// Clean Footer Component
const CleanFooter = () => {
  return (
    <footer className="bg-white/50 py-12 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <div className="flex flex-wrap justify-center gap-6 text-gray-500">
            <Link
              href="/terms"
              className="hover:text-gray-700 transition-colors text-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Terms of Service
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/privacy"
              className="hover:text-gray-700 transition-colors text-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function QuizStartPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

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
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .container {
          max-width: 1024px;
        }
      `}</style>

      <ProfessionalNavigation />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-24">
          <div className={`grid lg:grid-cols-2 gap-16 items-center ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}>
            {/* Left Column - Content */}
            <div className="order-2 lg:order-1 max-w-xl">
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-8">
                  <Lightbulb className="h-6 w-6 text-[#f8cc55]" strokeWidth="2" />
                  <span
                    className="text-[#f8cc55] font-semibold text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Discover Your Superpower
                  </span>
                </div>

                <h1
                  className="font-bold text-gray-900 leading-tight mb-8"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "3.25rem",
                    lineHeight: "1.1",
                  }}
                >
                  Let's Match You With the Right Cause
                </h1>

                <p
                  className="text-gray-600 mb-12"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    lineHeight: "1.6",
                  }}
                >
                  Your values shape how you want to give. Take this quick quiz to discover the issue that matters most to you—and the charities making the biggest impact in that space.
                </p>
              </div>

              {/* Primary CTA */}
              <div className="mb-8">
                <Link href="/quiz-questions" className="block w-full sm:w-auto">
                  <Button
                    className="bg-[#f8cc55] hover:bg-[#f0c043] text-gray-800 py-4 px-8 text-lg font-semibold transition-all duration-200 hover:scale-105 rounded-xl w-full sm:w-auto"
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

              {/* Brand Benefit Line - Left Aligned */}
              <p
                className="text-gray-600"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  lineHeight: "1.5",
                }}
              >
                Your values, made actionable.
              </p>
            </div>

            {/* Right Column - Interactive Illustration */}
            <div className="order-1 lg:order-2">
              <ProfessionalQuizMockup />
            </div>
          </div>
        </div>

        {/* White Space Between Sections */}
        <div className="py-16"></div>

        {/* Trust Indicators Section */}
        <section className="py-24 bg-white/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2
                className="font-bold text-gray-900 mb-6"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "36px",
                  lineHeight: "1.3",
                }}
              >
                Join thousands finding their perfect cause match
              </h2>
              <p
                className="text-gray-600 max-w-2xl mx-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  lineHeight: "1.6",
                }}
              >
                Our research-backed approach connects your personal values with organizations creating measurable
                change.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white/80 rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#f8cc55]/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-[#f8cc55]">2</span>
                  </div>
                  <h3
                    className="font-semibold text-gray-900 mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    Minutes to complete
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                    Quick, thoughtful questions designed to understand what matters most to you
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#f8cc55]/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-8 w-8 text-[#f8cc55]" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-semibold text-gray-900 mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    Values-based matching
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                    Connect with causes that align with your personal beliefs and passions
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#f8cc55]/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 bg-[#f8cc55] rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <h3
                    className="font-semibold text-gray-900 mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    Evidence-driven results
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                    Discover organizations with proven track records of creating real change
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <CleanFooter />
    </div>
  )
}
