"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/src/components/logo"
import { useQuiz } from "@/src/contexts/QuizContext"
import { calculateSuperpower, getSuperpowerSlug } from "@/src/utils/quizScoring"
import { eventLogger } from "@/src/utils/eventLogger"
import Link from "next/link"
import SubscribeForm from "@/src/components/SubscribeForm"

// Email Collection Modal Component
interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string) => void
}

const EmailModal = ({ isOpen, onClose, onSubmit }: EmailModalProps) => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) return

    setIsSubmitting(true)
    
    // Simulate brief loading
    setTimeout(() => {
      onSubmit(email)
      setIsSubmitting(false)
    }, 800)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">💛</div>
          <h2
            className="font-bold text-[#111] mb-3"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1.5rem",
              lineHeight: "1.3",
            }}
          >
            You're one step away from your Giving Superpower
          </h2>
          <p
            className="text-[#444]"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1rem",
              lineHeight: "1.5",
            }}
          >
            Add your email to see your results — no spam, just good vibes and impact!
          </p>
        </div>

        <div className="space-y-4">
          <SubscribeForm 
            variant="compact"
            formId="goodheart"
            showHeading={false}
            onSuccess={() => onSubmit("")}
            bgBlendClass="bg-white"
          />
        </div>
      </div>
    </div>
  )
}

// Quiz Questions Data
const quizQuestions = [
  {
    id: 1,
    question: "What motivates you most to give?",
    options: [
      { text: "I want to reduce suffering wherever it's greatest", value: "reduce-suffering" },
      { text: "I want to help people who've been treated unfairly", value: "help-unfairly" },
      { text: "I want to protect the planet and future generations", value: "protect-planet" },
      { text: "I want to support causes I've personally experienced", value: "personal-experience" },
      { text: "I want to give others opportunities they might not have", value: "give-opportunities" },
    ],
  },
  {
    id: 2,
    question: "Which of these headlines would most move you to donate?",
    options: [
      { text: '"Thousands of children lack access to clean water and basic vaccines"', value: "water-vaccines" },
      { text: '"Communities of color face widening health gaps in the U.S."', value: "health-gaps" },
      { text: '"Extreme heat is displacing families worldwide"', value: "extreme-heat" },
      { text: '"Millions of animals suffer silently in factory farms"', value: "animal-suffering" },
      { text: '"Youth mental health is in crisis — and underfunded"', value: "mental-health-crisis" },
    ],
  },
  {
    id: 3,
    question: "If you had $1,000 to donate right now, what would you want it to do?",
    options: [
      { text: "Save the most lives possible with proven methods", value: "save-lives" },
      { text: "Empower underserved communities over time", value: "empower-communities" },
      { text: "Protect wildlife or animal welfare", value: "protect-wildlife" },
      { text: "Slow climate change", value: "slow-climate" },
      { text: "Support mental health access or well-being", value: "mental-health-support" },
    ],
  },
  {
    id: 4,
    question: "What type of impact matters most to you?",
    options: [
      { text: "Long-term change for future generations", value: "long-term" },
      { text: "Helping the most people today", value: "help-most" },
      { text: "Improving quality of life and happiness", value: "quality-life" },
      { text: "Fixing systemic injustice", value: "systemic-injustice" },
      { text: "Protecting the voiceless (animals, ecosystems)", value: "protect-voiceless" },
    ],
  },
  {
    id: 5,
    question: "What feels most urgent to you right now?",
    options: [
      { text: "Climate change", value: "climate-change" },
      { text: "Global poverty and health", value: "global-poverty" },
      { text: "Racial or economic injustice", value: "racial-injustice" },
      { text: "Mental health", value: "mental-health" },
      { text: "Animal cruelty", value: "animal-cruelty" },
      { text: "I don't know — I just want to do good", value: "just-want-good" },
    ],
  },
  {
    id: 6,
    question: "Which of these feels most personal to you?",
    options: [
      { text: "I've seen loved ones struggle with health or mental illness", value: "health-struggles" },
      { text: "I care deeply about animals", value: "care-animals" },
      { text: "I've experienced systemic injustice", value: "experienced-injustice" },
      { text: "I worry about the future of our planet", value: "worry-planet" },
      { text: "I don't have a personal link — I just want to help", value: "no-personal-link" },
    ],
  },
]

export default function QuizQuestionsPage() {
  const { state, setAnswer, setCurrentQuestion, setComplete, setResult, setEmail } = useQuiz()
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showEmailModal) return // Don't handle when modal is open
      
      if (e.key === 'ArrowLeft' && state.currentQuestion > 0) {
        goToPrevious()
      }
      
      // Number keys 1-5 for answer selection
      const numKey = parseInt(e.key)
      if (numKey >= 1 && numKey <= 5) {
        const currentQ = quizQuestions[state.currentQuestion]
        if (currentQ && numKey <= currentQ.options.length) {
          const selectedOption = currentQ.options[numKey - 1]
          handleAnswer(currentQ.id, selectedOption.value)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [state.currentQuestion, showEmailModal, isTransitioning])

  // Log quiz start on component mount
  useEffect(() => {
    if (state.currentQuestion === 0 && Object.keys(state.answers).length === 0) {
      eventLogger.logQuizStarted()
    }
  }, [])

  const handleAnswer = (questionId: number, value: string) => {
    if (isTransitioning) return // Prevent double-clicks
    
    setAnswer(questionId, value)
    setIsTransitioning(true)
    
    // Log the answer
    eventLogger.logQuestionAnswered(questionId, value)

    // If this is the last question, show email modal
    if (state.currentQuestion === quizQuestions.length - 1) {
      setTimeout(() => {
        setShowEmailModal(true)
        setIsTransitioning(false)
      }, 300)
    } else {
      // Move to next question after brief delay
      setTimeout(() => {
        setCurrentQuestion(state.currentQuestion + 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleEmailSubmit = (email: string) => {
    // Calculate the result superpower
    const resultSuperpower = calculateSuperpower(state.answers)
    const superpowerSlug = getSuperpowerSlug(resultSuperpower)
    
    // Log events
    eventLogger.logQuizCompleted(resultSuperpower, quizQuestions.length)
    eventLogger.logEmailCollected(!!email)
    
    // Update state
    setEmail(email)
    setResult(resultSuperpower)
    setComplete(true)

    // Redirect to results with superpower slug
    window.location.href = `/quiz-results/${superpowerSlug}`
  }

  const goToPrevious = () => {
    if (state.currentQuestion > 0) {
      setCurrentQuestion(state.currentQuestion - 1)
    }
  }

  const currentQ = quizQuestions[state.currentQuestion]
  const progress = ((state.currentQuestion + 1) / quizQuestions.length) * 100

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fdfaf4",
        color: "#111",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Quiz-Only Navigation - Logo Only */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40 h-24 lg:h-28 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full py-2">
            <Logo size="md" />
            <div className="flex items-center space-x-3">
              <Link href="/donation-landing">
                <Button
                  className="bg-gradient-to-r from-[#FFD95C] to-[#F4C500] hover:from-[#F4C500] hover:to-[#E6B800] text-gray-800 px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-105 rounded-lg border-2 border-[#FFD95C]"
                  style={{
                    boxShadow: "0 4px 12px rgba(248, 204, 85, 0.3)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Donate to GoodHeart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Quiz Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
              Question {state.currentQuestion + 1} of {quizQuestions.length}
            </span>
            <span className="text-sm text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#FFD95C] h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card
          className="bg-white rounded-2xl border border-gray-200 shadow-lg mb-8"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <CardContent className="p-8 lg:p-12">
            <h1
              className="font-bold text-[#111] mb-8 text-center"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "2rem",
                lineHeight: "1.3",
              }}
            >
              {currentQ.question}
            </h1>

            <div className="space-y-4">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQ.id, option.value)}
                  disabled={isTransitioning}
                  className="w-full p-6 text-left bg-gray-50 hover:bg-[#FFD95C]/10 border border-gray-200 hover:border-[#FFD95C] rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FFD95C] focus:ring-opacity-50"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  aria-label={`Option ${index + 1}: ${option.text}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#111] font-medium text-lg">{option.text}</span>
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded font-mono">
                      {index + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={goToPrevious}
            disabled={state.currentQuestion === 0}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-gray-300 text-[#444] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth="2" />
            Previous
          </Button>
          <div className="text-center">
            <p className="text-[#444] text-sm mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
              Select an answer to continue
            </p>
            <p className="text-[#666] text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
              💡 Use number keys 1-{currentQ.options.length} or ← to navigate
            </p>
          </div>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Email Collection Modal */}
      <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSubmit={handleEmailSubmit} />
    </div>
  )
}