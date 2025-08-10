'use client'

import React, { useState } from 'react';
import { Button } from './button';
import { cn } from '@goodish/lib';

interface EmailSignupProps {
  className?: string;
  title?: string;
  description?: string;
  variant?: 'inline' | 'card';
}

export function EmailSignup({ 
  className, 
  title = "Join the list", 
  description = "Get updates on new projects and how to build for good.",
  variant = 'inline'
}: EmailSignupProps) {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  };

  const formClasses = variant === 'card' 
    ? 'bg-white rounded-lg border border-goodish-gray p-6 shadow-sm'
    : '';

  return (
    <div className={cn('w-full max-w-md', formClasses, className)}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-goodish-charcoal mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="firstName"
            placeholder="First name (optional)"
            className="w-full h-11 px-3 border border-goodish-gray rounded-md focus:outline-none focus:ring-2 focus:ring-goodish-teal focus:border-transparent"
          />
        </div>
        
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email address *"
            required
            className="w-full h-11 px-3 border border-goodish-gray rounded-md focus:outline-none focus:ring-2 focus:ring-goodish-teal focus:border-transparent"
          />
        </div>
        
        <Button type="submit" className="w-full">
          Subscribe
        </Button>
      </form>

      {submitted && (
        <div className="mt-4 text-center text-sm text-green-700 bg-green-100 border border-green-200 rounded-md py-2">
          Thanks — you’re on the list (placeholder)
        </div>
      )}
    </div>
  );
}
