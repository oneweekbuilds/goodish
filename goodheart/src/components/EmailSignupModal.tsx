"use client"

import { useState } from "react"
import { X, Mail, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { eventLogger } from "@/src/utils/eventLogger"

interface EmailSignupModalProps {
  isOpen: boolean
  onClose: () => void
  superpower?: string
}

export function EmailSignupModal({ isOpen, onClose, superpower }: EmailSignupModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
  })
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: { email?: string } = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Log the signup
      eventLogger.logEmailSignup({
        firstName: formData.firstName,
        email: formData.email,
        superpower: superpower || '',
      })

      // Store in localStorage for now
      const signups = JSON.parse(localStorage.getItem('emailSignups') || '[]')
      signups.push({
        ...formData,
        superpower,
        timestamp: new Date().toISOString(),
      })
      localStorage.setItem('emailSignups', JSON.stringify(signups))

      console.log('Email signup saved:', {
        firstName: formData.firstName,
        email: formData.email,
        superpower,
      })

      setIsSubmitted(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setIsSubmitted(false)
        setFormData({
          firstName: "",
          email: "",
        })
      }, 2000)
    } catch (error) {
      console.error('Error saving email signup:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear relevant errors
    if (field === 'email' && errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#111] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
              Thanks for signing up!
            </h3>
            <p className="text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
              We'll send you personalized giving tips and updates.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFD95C] rounded-full w-10 h-10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-800" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111]" style={{ fontFamily: "Inter, sans-serif" }}>
                    Stay Connected
                  </h3>
                  <p className="text-sm text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
                    Get personalized giving tips
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-4 p-6">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="First name (optional)"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                placeholder="Email address"
                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              {errors.email && (
                <p className="text-sm text-red-500" style={{ fontFamily: "Inter, sans-serif" }}>
                  {errors.email}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-4 rounded-lg shadow-sm transition"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}