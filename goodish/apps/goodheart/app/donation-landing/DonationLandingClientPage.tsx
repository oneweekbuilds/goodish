"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/src/components/logo"
import Link from "next/link"

export default function DonationLandingClientPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fdfaf4",
        color: "#111",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <Logo size="hero" />
          </div>

          <h1
            className="font-bold text-[#111] mb-8"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "2.5rem",
              lineHeight: "1.2",
            }}
          >
            We're Just Getting Started at GoodHeart!
          </h1>

          <div className="max-w-2xl mx-auto mb-8">
            <p
              className="text-[#444] mb-6 leading-relaxed"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "1.125rem",
                lineHeight: "1.6",
              }}
            >
              We're still setting up our platform to accept direct donations. In the meantime, we'd love for you to take
              the GoodHeart quiz and donate to one of the high-impact charities that best matches your values.
            </p>

            <p
              className="text-[#444] mb-8 leading-relaxed"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "1.125rem",
                lineHeight: "1.6",
              }}
            >
              Every gift makes a difference — and we're here to help you give with purpose.
            </p>
          </div>

          <div className="mb-4">
            <Link href="/quiz-questions">
              <Button
                size="lg"
                className="bg-[#FFD95C] hover:bg-[#F4C500] text-gray-800 px-8 py-4 text-lg font-semibold transition-all duration-200 hover:scale-105 rounded-xl"
                style={{
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Take the GoodHeart Quiz
              </Button>
            </Link>
          </div>

          <p
            className="text-[#888] text-sm"
            style={{
              fontFamily: "Inter, sans-serif",
            }}
          >
            We'll be accepting direct donations soon.
          </p>
        </div>
      </div>
    </div>
  )
}