"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "@/src/components/logo"
import { ArrowRight, Heart, Users, Target, Compass, Menu, X } from 'lucide-react'

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
            className="text-left text-lg text-[#F4C500] font-medium"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            About
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function About() {
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
                className="text-[#F4C500] font-medium border-b-2 pb-1 border-[#FFD95C]"
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
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1
              className="font-bold text-gray-900 leading-tight mb-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "3.5rem",
                lineHeight: "1.1",
              }}
            >
              About GoodHeart
            </h1>
            <p
              className="text-gray-600 mb-12 max-w-2xl mx-auto"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "20px",
                lineHeight: "1.6",
              }}
            >
              We're on a mission to make charitable giving joyful, intentional, and deeply human.
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-24">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2
                  className="font-bold text-gray-900 mb-6"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "32px",
                    lineHeight: "1.3",
                  }}
                >
                  Our Mission
                </h2>
                <p
                  className="text-gray-600 mb-6"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "18px",
                    lineHeight: "1.6",
                  }}
                >
                  We believe everyone who wants to help deserves to know their generosity is making the biggest difference possible. Too often, giving feels disconnected, overwhelming, or uncertain.
                </p>
                <p
                  className="text-gray-600"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "18px",
                    lineHeight: "1.6",
                  }}
                >
                  GoodHeart bridges that gap by connecting your personal values with effective organizations, making charitable giving both meaningful and impactful.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#FFD95C]/20 to-[#F4C500]/10 rounded-2xl p-8 text-center">
                <Heart className="h-16 w-16 text-[#FFD95C] mx-auto mb-6" strokeWidth="1.5" />
                <blockquote
                  className="text-gray-700 italic text-lg"
                  style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.6" }}
                >
                  "Giving should feel as good as it does good."
                </blockquote>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2
                className="font-bold text-gray-900 mb-6"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "32px",
                  lineHeight: "1.3",
                }}
              >
                Our Values
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 h-full">
                <CardContent className="p-8 text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-[#FFD95C] rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-8 w-8 text-gray-800" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-bold text-gray-900 mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    Human-Centered
                  </h3>
                  <p
                    className="text-gray-600 text-sm flex-1"
                    style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.5" }}
                  >
                    We put people and their values at the center of every decision.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 h-full">
                <CardContent className="p-8 text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-[#9333EA] rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Target className="h-8 w-8 text-white" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-bold text-gray-900 mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    Impact-Driven
                  </h3>
                  <p
                    className="text-gray-600 text-sm flex-1"
                    style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.5" }}
                  >
                    We only recommend organizations with proven track records of effectiveness.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 h-full">
                <CardContent className="p-8 text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-[#059669] rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-white" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-bold text-gray-900 mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    Inclusive
                  </h3>
                  <p
                    className="text-gray-600 text-sm flex-1"
                    style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.5" }}
                  >
                    Every giving style is valid. We celebrate all forms of generosity.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 h-full">
                <CardContent className="p-8 text-center h-full flex flex-col">
                  <div className="w-16 h-16 bg-[#DC2626] rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Compass className="h-8 w-8 text-white" strokeWidth="2" />
                  </div>
                  <h3
                    className="font-bold text-gray-900 mb-4"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "18px" }}
                  >
                    Transparent
                  </h3>
                  <p
                    className="text-gray-600 text-sm flex-1"
                    style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.5" }}
                  >
                    We're open about our methods, recommendations, and motivations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How We Work Section */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2
                className="font-bold text-gray-900 mb-6"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "32px",
                  lineHeight: "1.3",
                }}
              >
                How We Work
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#FFD95C] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-gray-800 font-bold text-lg">1</span>
                </div>
                <h3
                  className="font-bold text-gray-900 mb-4"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "20px" }}
                >
                  Understand You
                </h3>
                <p
                  className="text-gray-600"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "1.5" }}
                >
                  Our quiz identifies your unique values, interests, and giving preferences through thoughtful questions.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#FFD95C] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-gray-800 font-bold text-lg">2</span>
                </div>
                <h3
                  className="font-bold text-gray-900 mb-4"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "20px" }}
                >
                  Research Organizations
                </h3>
                <p
                  className="text-gray-600"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "1.5" }}
                >
                  We evaluate charities for effectiveness, transparency, and impact using trusted evaluation methods.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#FFD95C] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-gray-800 font-bold text-lg">3</span>
                </div>
                <h3
                  className="font-bold text-gray-900 mb-4"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "20px" }}
                >
                  Make the Match
                </h3>
                <p
                  className="text-gray-600"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "1.5" }}
                >
                  We connect you with organizations that align with your values and create meaningful impact.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-[#FFD95C]/10 to-[#F4C500]/5 rounded-2xl p-12">
            <h2
              className="font-bold text-gray-900 mb-6"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "28px",
                lineHeight: "1.3",
              }}
            >
              Ready to Find Your Perfect Match?
            </h2>
            <p
              className="text-gray-600 mb-8 max-w-xl mx-auto"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "18px",
                lineHeight: "1.6",
              }}
            >
              Join thousands of people who have discovered their giving superpower and are making a difference in causes they truly care about.
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
          </section>
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

