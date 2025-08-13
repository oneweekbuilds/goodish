'use client'

import { useState } from 'react'
import { cn } from '@goodish/lib'
import { Button } from './button'

interface InlineSignupProps {
  title?: string
  description?: string
  className?: string
  buttonText?: string
}

export function InlineSignup({ 
  title = "Follow along as new projects ship",
  description = "See examples in action—subscribing helps these projects grow.",
  className,
  buttonText = "Get updates"
}: InlineSignupProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const firstName = formData.get('firstName') as string

    // Basic validation
    const newErrors: { [key: string]: string } = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSuccess(true)
      e.currentTarget.reset()
    } catch (error) {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn('text-center bg-goodish-green/10 border border-goodish-green/20 rounded-2xl p-6', className)}>
        <div className="w-12 h-12 bg-goodish-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-goodish-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-goodish-charcoal mb-2">Successfully subscribed!</h3>
        <p className="text-gray-600 mb-4">You'll receive updates as new projects ship.</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsSuccess(false)}
          className="text-goodish-teal hover:text-goodish-teal/80"
        >
          Subscribe another email
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('bg-white/80 backdrop-blur border border-goodish-gray/50 rounded-2xl p-6 shadow-sm', className)}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-goodish-charcoal mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="firstName" className="sr-only">First name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              placeholder="First name (optional)"
              className="w-full h-11 px-4 border border-goodish-gray/70 rounded-xl bg-white text-goodish-charcoal placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-goodish-teal focus:border-transparent transition-colors text-sm"
            />
          </div>
          
          <div className="flex-1">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              className="w-full h-11 px-4 border border-goodish-gray/70 rounded-xl bg-white text-goodish-charcoal placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-goodish-teal focus:border-transparent transition-colors text-sm"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
            />
          </div>
        </div>

        {errors.email && (
          <p id="email-error" className="text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}

        {errors.submit && (
          <p className="text-sm text-red-600 text-center" role="alert">
            {errors.submit}
          </p>
        )}

        <Button
          type="submit"
          size="md"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Subscribing...
            </div>
          ) : (
            buttonText
          )}
        </Button>
      </form>
    </div>
  )
}