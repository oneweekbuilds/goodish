'use client'

import { useState } from 'react'
import { cn } from '@goodish/lib'
import { Button } from './button'

interface EmailSignupProps {
  title: string
  description: string
  variant?: 'inline' | 'card'
}

export function EmailSignup({ title, description, variant = 'inline' }: EmailSignupProps) {
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

  const formClasses = variant === 'card'
    ? 'bg-white/90 backdrop-blur rounded-2xl border border-goodish-gray p-8 shadow-sm'
    : ''

  if (isSuccess) {
    return (
      <div className={cn('text-center', formClasses)}>
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
    <div className={cn('w-full', formClasses)}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-goodish-charcoal mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-4">
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className="w-full h-11 rounded-xl bg-white/90 backdrop-blur text-neutral-900 placeholder:text-neutral-500 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)]"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
          />
          <Button
            type="submit"
            className="h-11 px-5 rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Getting...
              </div>
            ) : (
              'Get updates'
            )}
          </Button>
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
      </form>
    </div>
  )
}
