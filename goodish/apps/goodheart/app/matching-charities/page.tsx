"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/src/components/logo"
import { charityData } from "@/src/data/charities"
import { superpowers } from "@/src/data/superpowers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, ChevronDown, Menu, X } from "lucide-react"

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
            className="text-left text-lg text-[#F4C500] font-medium"
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

export default function MatchingCharities() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Get all 18 charities from the charity data with superpower mapping
  const allCharitiesWithStyle = Object.entries(charityData).flatMap(([superpowerKey, charities]) => {
    // Match the key to superpower by converting both to comparable format
    const keyNormalized = superpowerKey.replace('the-', '').replace(/-/g, ' ')
    const superpower = superpowers.find(s => 
      s.name.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ') === keyNormalized
    )
    const superpowerName = superpower ? superpower.name : superpowerKey
    
    return [
      { ...charities.topCharity, superpower: superpowerName, type: 'top' },
      { ...charities.otherOption, superpower: superpowerName, type: 'other' }
    ]
  })

  // Filter charities based on selected style
  const filteredCharities = selectedStyle === "all" ? allCharitiesWithStyle : 
    allCharitiesWithStyle.filter(charity => charity.superpower === selectedStyle)

  const superpowerOptions = [
    { value: "all", label: "All Giving Styles" },
    ...superpowers.map(sp => ({ value: sp.name, label: sp.name }))
  ]

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
                className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors font-medium truncate px-2 md:px-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Giving Styles
              </Link>
              <Link
                href="/matching-charities"
                className="text-sm md:text-base text-[#F4C500] font-medium border-b-2 pb-1 border-[#FFD95C] truncate px-2 md:px-3"
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
              Matching Charities
            </h1>
            <p
              className="text-gray-600 mb-12 max-w-2xl mx-auto"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "20px",
                lineHeight: "1.6",
              }}
            >
              Discover vetted organizations that align with different giving superpowers and create meaningful impact worldwide.
            </p>
          </div>

          {/* Filter Dropdown */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`bg-white border rounded-xl px-6 py-3 flex items-center gap-3 transition-colors min-w-64 ${
                  selectedStyle === "all" ? 'border-gray-300 hover:border-yellow-400' : 'border-yellow-400 bg-yellow-50'
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <span className="text-gray-700">
                  {superpowerOptions.find(opt => opt.value === selectedStyle)?.label}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                  {superpowerOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedStyle(option.value)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-yellow-100 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        selectedStyle === option.value ? 'bg-yellow-200 text-black font-semibold' : 'text-gray-700 hover:bg-yellow-100'
                      }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Charities Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {filteredCharities.map((charity, index) => (
              <Card key={index} className="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#f8cc55] uppercase tracking-wide">
                          {charity.superpower}
                        </span>
                        <span className="text-xs text-gray-500">
                          {charity.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "Inter, sans-serif" }}>
                        {charity.name}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                      {charity.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto">
                    <Button
                      asChild
                      className="bg-[#f8cc55] hover:bg-[#f0c043] text-gray-800 text-sm px-4 py-2 rounded-lg font-semibold w-full"
                    >
                      <a 
                        href={charity.donationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        Donate via Every.org
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="text-center">
            <p className="text-gray-600 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Showing {filteredCharities.length} of {allCharitiesWithStyle.length} vetted charitable organizations
            </p>
            <Link href="/quiz-questions">
              <Button
                className="bg-[#f8cc55] hover:bg-[#f0c043] text-gray-800 py-3 px-6 rounded-xl font-semibold"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Take Quiz to Find Your Match
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

