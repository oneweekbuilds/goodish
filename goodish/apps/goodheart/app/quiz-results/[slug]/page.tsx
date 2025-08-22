"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, ArrowRight, ExternalLink, Heart, Copy, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/src/components/logo"
import { useQuiz } from "@/src/contexts/QuizContext"
import { getSuperpowerFromSlug, calculateSuperpower } from "@/src/utils/quizScoring"
import { charityData, generateDonationUrl, getCharitiesForSuperpower } from "@/src/data/charities"
import { eventLogger } from "@/src/utils/eventLogger"
import { DonationFeedbackModal } from "@/src/components/DonationFeedbackModal"
import SubscribeForm from "@/src/components/SubscribeForm"

interface ResultPageProps {
  params: { slug: string }
}

// Superpower results data with enhanced details
const superpowerResults = {
  "the-lifesaver": {
    title: "The Lifesaver",
    subtitle: "I want to save lives where it matters most.",
    description: "You're driven by the urgent need to prevent suffering and save lives. Your giving style focuses on interventions that have the most direct impact on mortality and health outcomes.",
    icon: "🩺",
  },
  "the-empowerer": {
    title: "The Empowerer", 
    subtitle: "I believe in dignity — and giving people the power to change their own lives.",
    description: "You believe in human dignity and agency. Your giving style focuses on empowering people to improve their own circumstances rather than creating dependency.",
    icon: "✊",
  },
  "the-nurturer": {
    title: "The Nurturer",
    subtitle: "I want children to grow up safe, healthy, and free to thrive.", 
    description: "You're passionate about protecting children and giving them the best possible start in life. Your giving style focuses on interventions that help children develop and flourish.",
    icon: "👶",
  },
  "the-health-defender": {
    title: "The Health Defender",
    subtitle: "I want to stop diseases before they start.",
    description: "You believe prevention is better than cure. Your giving style focuses on public health interventions that prevent disease outbreaks and protect community health.",
    icon: "🛡️",
  },
  "the-animal-ally": {
    title: "The Animal Ally",
    subtitle: "I care deeply about protecting animals from harm.",
    description: "You speak for those who cannot speak for themselves. Your giving style focuses on reducing animal suffering and improving welfare standards.",
    icon: "🐾",
  },
  "the-earth-shielder": {
    title: "The Earth Shielder",
    subtitle: "I want to fight climate change and protect our planet's future.",
    description: "You're motivated by the urgent need to address climate change and environmental destruction. Your giving style focuses on solutions that protect our planet for future generations.",
    icon: "🌍",
  },
  "the-deep-feeler": {
    title: "The Deep Feeler",
    subtitle: "I care about beings most people overlook — no life is too small.",
    description: "You have deep empathy for all sentient beings, including those often overlooked. Your giving style focuses on helping the most neglected creatures.",
    icon: "🦐",
  },
  "the-future-builder": {
    title: "The Future Builder",
    subtitle: "I want to protect future generations from catastrophic threats.",
    description: "You think about long-term risks and want to ensure humanity has a bright future. Your giving style focuses on preventing existential and catastrophic risks.",
    icon: "🔮",
  },
  "the-food-reformer": {  
    title: "The Food Reformer",
    subtitle: "I want to fix our broken food systems.",
    description: "You see the problems in our current food system and want to create better alternatives. Your giving style focuses on transforming how we produce and consume food.",
    icon: "🌱",
  },
}

export default function QuizResultPage({ params }: ResultPageProps) {
  const { state, setResult } = useQuiz()
  const [userSuperpower, setUserSuperpower] = useState<string | null>(null)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showEmailSignup, setShowEmailSignup] = useState(false)

  useEffect(() => {
    const { slug } = params
    const superpowerType = getSuperpowerFromSlug(slug)
    
    if (superpowerType) {
      setUserSuperpower(superpowerType)
      setResult(superpowerType)
      setIsLoading(false)
      // Log result view
      eventLogger.logResultViewed(superpowerType, Object.keys(state.answers).length > 0 ? 'quiz_completion' : 'direct_link')
      
      // Show email signup modal if user completed the quiz (has answers)
      if (Object.keys(state.answers).length > 0) {
        setTimeout(() => {
          setShowEmailSignup(true)
        }, 2000) // Show email modal 2 seconds after result loads
      }
    } else {
      // Invalid slug - check if we have quiz state to calculate result
      if (Object.keys(state.answers).length > 0) {
        const calculatedResult = calculateSuperpower(state.answers)
        setUserSuperpower(calculatedResult)
        setResult(calculatedResult)
        // Redirect to correct URL
        window.history.replaceState(null, '', `/quiz-results/${calculatedResult}`)
        setIsLoading(false)
        eventLogger.logResultViewed(calculatedResult, 'quiz_completion')
        
        // Show email signup modal for quiz completions
        setTimeout(() => {
          setShowEmailSignup(true)
        }, 2000)
      } else {
        // No quiz state - still show result page but don't show email modal
        setUserSuperpower(null)
        setIsLoading(false)
      }
    }
  }, [params, state.answers, setResult])

  const handleDonationClick = (charityName: string, donationType: 'top' | 'other') => {
    if (!userSuperpower) return
    
    const charities = getCharitiesForSuperpower(userSuperpower)
    if (!charities) return
    
    const charity = donationType === 'top' ? charities.topCharity : charities.otherOption
    const donationUrl = generateDonationUrl(charity.donationUrl, userSuperpower, charityName, donationType)
    
    // Log the donation click
    eventLogger.logDonationClicked(charityName, userSuperpower, donationType, donationUrl)
    
    // Open in new tab
    window.open(donationUrl, '_blank', 'noopener,noreferrer')
    
    // Set up modal to appear after 1.5 seconds
    setSelectedCharity(charityName)
    setTimeout(() => {
      setShowDonationModal(true)
    }, 1500)
  }

  const handleTwitterShare = () => {
    if (!userSuperpower) return
    
    const result = superpowerResults[userSuperpower as keyof typeof superpowerResults]
    const tweetText = `I just found my Giving Superpower — I'm ${result?.title}! Find yours: ${window.location.origin}/quiz #GivingSuperpower #EffectiveGiving`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
    eventLogger.logSocialShare('twitter', userSuperpower)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      eventLogger.logSocialShare('copy_link', userSuperpower || '')
    })
  }

  const handleSeeMatchingCharities = () => {
    if (!userSuperpower) return
    window.location.href = `/matching-charities?filter=${encodeURIComponent(userSuperpower)}`
  }

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ backgroundColor: "#fdfaf4" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD95C] mx-auto mb-4"></div>
          <p style={{ fontFamily: "Inter, sans-serif" }}>Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!userSuperpower) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ backgroundColor: "#fdfaf4" }}
      >
        <div className="text-center">
          <p style={{ fontFamily: "Inter, sans-serif" }}>Superpower not found. Redirecting...</p>
        </div>
      </div>
    )
  }

  const result = superpowerResults[userSuperpower as keyof typeof superpowerResults]

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#fdfaf4",
        color: "#111",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Navigation */}
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

      {/* Results Content */}
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        {/* Results Card */}
        <Card
          className="bg-white rounded-2xl border border-gray-200 shadow-lg mb-8 text-center"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <CardContent className="p-8 lg:p-12">
            <div className="bg-[#FFD95C] text-xs font-semibold text-gray-800 px-3 py-1 rounded-xl inline-block mb-6">
              YOUR GIVING SUPERPOWER
            </div>

            <div className="bg-gradient-to-r from-[#FFD95C] to-[#F4C500] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 text-4xl">
              {result.icon}
            </div>

            <h1
              className="font-bold text-[#111] mb-4"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "2.5rem",
                lineHeight: "1.2",
              }}
            >
              {result.title}
            </h1>

            <p
              className="font-regular text-[#444] mb-6 text-xl"
              style={{
                fontFamily: "Inter, sans-serif",
                lineHeight: "1.5",
              }}
            >
              {result.subtitle}
            </p>

            <p
              className="text-[#444] mb-8 leading-relaxed max-w-2xl mx-auto"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "1.125rem",
                lineHeight: "1.6",
              }}
            >
              {result.description}
            </p>

            {/* Charity Recommendations */}
            {(() => {
              const charities = getCharitiesForSuperpower(userSuperpower)
              if (!charities) return null
              
              return (
                <div className="space-y-6 mb-8 max-w-2xl mx-auto">
                  {/* Top Charity */}
                  <div className="bg-gradient-to-br from-[#FFD95C]/10 to-[#F4C500]/5 rounded-2xl p-6 border border-[#FFD95C]/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="bg-[#FFD95C] text-xs font-bold text-gray-800 px-3 py-1 rounded-full inline-block mb-3">
                          TOP MATCH
                        </div>
                        <h3 className="font-bold text-[#111] text-xl mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                          {charities.topCharity.name}
                        </h3>
                        <p className="text-[#444] mb-4" style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.5" }}>
                          {charities.topCharity.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDonationClick(charities.topCharity.name, 'top')}
                      className="w-full bg-[#FFD95C] hover:bg-[#F4C500] text-gray-800 py-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "1.125rem",
                        boxShadow: "0 4px 14px rgba(248, 204, 85, 0.25)",
                      }}
                    >
                      <Heart className="h-5 w-5" strokeWidth="2" />
                      Donate to {charities.topCharity.name}
                    </Button>
                  </div>

                  {/* Alternative Charity */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="bg-gray-100 text-xs font-semibold text-gray-600 px-3 py-1 rounded-full inline-block mb-3">
                          ALSO GREAT
                        </div>
                        <h3 className="font-semibold text-[#111] text-lg mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                          {charities.otherOption.name}
                        </h3>
                        <p className="text-[#444] mb-4" style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.5" }}>
                          {charities.otherOption.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDonationClick(charities.otherOption.name, 'other')}
                      variant="outline"
                      className="w-full border-[#FFD95C] text-[#111] hover:bg-[#FFD95C]/10 py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 bg-transparent"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "1rem",
                      }}
                    >
                      <Heart className="h-4 w-4" strokeWidth="2" />
                      Donate to {charities.otherOption.name}
                    </Button>
                  </div>

                  {/* Browse More */}
                  <div className="text-center">
                    <Button
                      onClick={handleSeeMatchingCharities}
                      variant="outline"
                      className="border-gray-300 text-[#444] hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto bg-transparent"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Browse More Charities
                      <ArrowRight className="h-4 w-4" strokeWidth="2" />
                    </Button>
                  </div>
                </div>
              )
            })()}

            {/* Social Sharing */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold text-[#111] mb-4 text-center" style={{ fontFamily: "Inter, sans-serif" }}>
                Share Your Result
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="border-gray-300 text-[#444] hover:bg-gray-50 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 bg-transparent"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Copy className="h-4 w-4" strokeWidth="2" />
                  {copySuccess ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  onClick={handleTwitterShare}
                  className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth="2" />
                  Tweet Result
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="text-center">
          <p
            className="text-[#444] mb-6"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1.125rem",
              lineHeight: "1.5",
            }}
          >
            Want to explore other giving styles?
          </p>
          <Link href="/giving-styles">
            <Button
              variant="outline"
              className="border-gray-300 text-[#444] hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 bg-transparent"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Browse All Giving Styles
            </Button>
          </Link>
        </div>
      </div>

      {/* Donation Feedback Modal */}
      {showDonationModal && selectedCharity && (() => {
        const charities = getCharitiesForSuperpower(userSuperpower)
        if (!charities) return null
        
        const charityList = [
          { name: charities.topCharity.name, category: charities.topCharity.category },
          { name: charities.otherOption.name, category: charities.otherOption.category }
        ]
        
        return (
          <DonationFeedbackModal
            isOpen={showDonationModal}
            onClose={() => setShowDonationModal(false)}
            charityName={selectedCharity}
            charities={charityList}
          />
        )
      })()}

      {/* Email Signup Section */}
      {showEmailSignup && (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">
            <h3 className="text-2xl font-semibold text-[#111] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Stay Connected
            </h3>
            <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              Get personalized giving tips and updates about new effective giving opportunities.
            </p>
            <SubscribeForm 
              variant="wide" 
              formId="goodheart"
              showHeading={false}
              bgBlendClass="bg-white"
            />
            <button
              onClick={() => setShowEmailSignup(false)}
              className="mt-4 text-sm text-[#444] hover:text-[#111] transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              No thanks
            </button>
          </div>
        </div>
      )}
    </div>
  )
}