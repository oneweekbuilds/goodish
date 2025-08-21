"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Logo } from "@/src/components/logo"
import { EmailSignupModal } from "@/src/components/EmailSignupModal"
import { ArrowRight, Heart, Users, Lightbulb, Globe, Shield, TreePine, GraduationCap, Menu, X, ChevronDown, Plus, Minus } from 'lucide-react'

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
            className="text-left text-lg text-[#F4C500] font-medium"
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
          <Link
            href="/contact"
            className="text-left text-lg text-[#111] hover:text-[#F4C500] transition-colors font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

// Interactive Quiz Mockup - Using Real Superpowers
const RotatingSuperpowerExamples = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [progress, setProgress] = useState(0)
  
  const realSuperpowers = [
    {
      name: "The Lifesaver",
      tagline: "I want to save lives where it matters most.",
      icon: Heart,
      color: "#f8cc55"
    },
    {
      name: "The Empowerer", 
      tagline: "I believe in dignity — and giving people the power to change their own lives.",
      icon: Users,
      color: "#9333EA"
    },
    {
      name: "The Nurturer",
      tagline: "I want children to grow up safe, healthy, and free to thrive.",
      icon: Shield,
      color: "#059669"
    },
    {
      name: "The Health Defender",
      tagline: "I want to stop diseases before they start.",
      icon: Globe,
      color: "#DC2626"
    },
    {
      name: "The Animal Ally",
      tagline: "I care deeply about protecting animals from harm.",
      icon: Heart,
      color: "#16A34A"
    },
    {
      name: "The Earth Shielder",
      tagline: "I want to fight climate change and protect our planet's future.",
      icon: TreePine,
      color: "#2563EB"
    },
    {
      name: "The Deep Feeler",
      tagline: "I care about beings most people overlook — no life is too small.",
      icon: Lightbulb,
      color: "#EA580C"
    },
    {
      name: "The Future Builder",
      tagline: "I want to protect future generations from catastrophic threats.",
      icon: GraduationCap,
      color: "#8B5CF6"
    },
    {
      name: "The Food Reformer",
      tagline: "I want to fix our broken food systems.",
      icon: Globe,
      color: "#10B981"
    }
  ]

  const mockQuestions = [
    {
      question: "What causes inspire you most?",
      options: ["Saving Lives", "Empowering People", "Protecting Animals", "Climate Action"],
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
      setCurrentIndex((prev) => (prev + 1) % mockQuestions.length)
      setSelectedOption(null)
      setProgress(((currentIndex + 1) / mockQuestions.length) * 100)
    }, 3500)

    return () => clearInterval(questionInterval)
  }, [currentIndex])

  const currentQ = mockQuestions[currentIndex]

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
            Step {currentIndex + 1} of {mockQuestions.length}
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
                key={`${currentIndex}-${index}`}
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

// FAQ Component
const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null)

  const faqs = [
    {
      question: "How does the quiz work?",
      answer: "Our 2-minute quiz asks about your values, interests, and giving preferences. Based on your answers, we match you with causes and charities that align with your personal giving style."
    },
    {
      question: "Are the charities vetted?",
      answer: "Yes! All charities in our system have been researched for effectiveness, transparency, and impact. We work with trusted charity evaluators to ensure quality recommendations."
    },
    {
      question: "Is GoodHeart free to use?",
      answer: "Absolutely! GoodHeart is completely free for donors. We believe everyone should have access to tools that make giving more joyful and effective."
    },
    {
      question: "Can I change my results?",
      answer: "Of course! You can retake the quiz anytime or explore different giving styles. Your preferences may evolve, and we're here to support that journey."
    },
    {
      question: "How do I know my donation will make an impact?",
      answer: "We only recommend charities with proven track records of effectiveness. Each recommendation includes information about the organization's impact and how they use donations."
    }
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index} className="bg-white border border-gray-200 rounded-xl">
            <CardContent className="p-0">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full text-left p-6 hover:bg-gray-50 transition-colors rounded-xl"
              >
                <div className="flex justify-between items-center">
                  <h3
                    className="font-semibold text-gray-900"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    {faq.question}
                  </h3>
                  {openFAQ === index ? (
                    <Minus className="h-5 w-5 text-[#FFD95C] flex-shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-[#FFD95C] flex-shrink-0" />
                  )}
                </div>
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-6">
                  <p
                    className="text-gray-600"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "1.6" }}
                  >
                    {faq.answer}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
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
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
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
            <div className="hidden md:flex items-center space-x-2 whitespace-nowrap">
              <Link
                href="/"
                className="text-xs md:text-sm text-[#F4C500] font-medium border-b-2 pb-1 border-[#FFD95C] truncate px-1 md:px-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Home
              </Link>
              <Link
                href="/quiz"
                className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-1 md:px-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Quiz
              </Link>
              <Link
                href="/giving-styles"
                className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-1 md:px-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Giving Styles
              </Link>
              <Link
                href="/matching-charities"
                className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-1 md:px-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Matching Charities
              </Link>
              <Link
                href="/why-we-built-this"
                className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-1 md:px-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Why We Built This
              </Link>
              <Link
                href="/about"
                className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-1 md:px-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-1 md:px-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Contact Us
              </Link>
              <Link
                href="/donate"
                className="ml-auto bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-4 rounded-xl shadow-sm transition whitespace-nowrap text-xs md:text-sm"
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

      {/* Hero Section */}
      <main className="flex-1">
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
                  Find Your Giving Superpower
                </h1>

                <p
                  className="text-gray-600 mb-12"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    lineHeight: "1.6",
                  }}
                >
                  Take our 2-minute quiz to discover your perfect charity match and give with joy, knowing your values are making a real difference.
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

              {/* Brand Benefit Line */}
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

            {/* Right Column - Interactive Quiz Mockup */}
            <div className="order-1 lg:order-2">
              <RotatingSuperpowerExamples />
            </div>
          </div>
        </div>

        {/* About Section */}
        <section className="py-12 md:py-20 bg-yellow-50">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center text-center">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto text-center">
                GoodHeart helps you discover your unique giving superpower — the way you most naturally like to help others — and matches you with a top-rated charity that fits your values.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24">
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
                Frequently Asked Questions
              </h2>
              <p
                className="text-gray-600 max-w-2xl mx-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  lineHeight: "1.6",
                }}
              >
                Everything you need to know about giving with GoodHeart.
              </p>
            </div>
            
            <FAQSection />
          </div>
        </section>

        {/* Email Signup Section */}
        <section className="py-24 bg-gradient-to-r from-[#FFD95C] to-[#F4C500]">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2
                className="font-bold text-gray-800 mb-4"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "36px",
                  lineHeight: "1.3",
                }}
              >
                Ready to Give with Impact?
              </h2>
              <p
                className="text-gray-700 mb-8"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  lineHeight: "1.5",
                }}
              >
                Join thousands finding their perfect charity match. Start with our quiz today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Link href="/quiz-questions" className="flex-1">
                  <Button
                    className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold w-full"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Take the Quiz
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setShowEmailModal(true)}
                  className="bg-white/90 hover:bg-white border-white text-gray-800 py-3 px-6 rounded-xl font-semibold"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Get Updates
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
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
            <div className="flex items-center gap-4">
              <Link href="/donate">
                <Button
                  variant="outline"
                  className="border-[#f8cc55] text-[#f8cc55] hover:bg-[#f8cc55] hover:text-gray-800 text-sm px-4 py-2 rounded-lg font-semibold"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Support GoodHeart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <EmailSignupModal 
        isOpen={showEmailModal} 
        onClose={() => setShowEmailModal(false)} 
      />
    </div>
  )
}

