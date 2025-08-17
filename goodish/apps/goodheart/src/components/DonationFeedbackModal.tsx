"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Heart } from "lucide-react"
import { eventLogger } from "@/src/utils/eventLogger"

interface DonationFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  charityName: string
  charities: Array<{ name: string; category: string }>
}

export function DonationFeedbackModal({ isOpen, onClose, charityName, charities }: DonationFeedbackModalProps) {
  const [selectedCharity, setSelectedCharity] = useState(charityName)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [email, setEmail] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThanks, setShowThanks] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (donated: boolean) => {
    setIsSubmitting(true)
    
    if (donated) {
      eventLogger.logDonationSelfReported(
        selectedCharity,
        amount ? parseFloat(amount) : undefined,
        reason || undefined,
        isAnonymous
      )
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setShowThanks(true)
    setTimeout(() => {
      onClose()
      setShowThanks(false)
      setIsSubmitting(false)
    }, 2000)
  }

  if (showThanks) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="bg-white rounded-2xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🙏</div>
            <h2 className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
              Thank you!
            </h2>
            <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
              Your feedback helps us understand what's working.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                Did you end up donating?
              </h2>
              <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                Your feedback helps us understand what's working — completely optional!
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Charity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                Which charity did you donate to?
              </label>
              <select
                value={selectedCharity}
                onChange={(e) => setSelectedCharity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD95C] focus:border-[#FFD95C]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {charities.map((charity, index) => (
                  <option key={index} value={charity.name}>
                    {charity.name}
                  </option>
                ))}
                <option value="other">Other charity</option>
                <option value="none">I didn't donate</option>
              </select>
            </div>

            {selectedCharity !== "none" && (
              <>
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    How much did you donate? (optional)
                  </label>
                  <Input
                    type="number"
                    placeholder="$"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="focus:ring-2 focus:ring-[#FFD95C] focus:border-[#FFD95C]"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Why did you choose this cause? (optional)
                  </label>
                  <textarea
                    placeholder="Share what motivated your decision..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD95C] focus:border-[#FFD95C] resize-none"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Email (optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-[#FFD95C] focus:border-[#FFD95C]"
                  />
                </div>

                {/* Anonymous checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 text-[#FFD95C] focus:ring-[#FFD95C] border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700" style={{ fontFamily: "Inter, sans-serif" }}>
                    Submit anonymously
                  </label>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => handleSubmit(selectedCharity !== "none")}
                disabled={isSubmitting}
                className="flex-1 bg-[#FFD95C] hover:bg-[#F4C500] text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 min-h-[44px]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
                <Heart className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50 min-h-[44px]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Skip
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}