interface EventData {
  [key: string]: string | number | boolean | null | undefined
}

interface LoggedEvent {
  eventName: string
  timestamp: string
  context: string
  data?: EventData
  sessionId: string
}

class EventLogger {
  private events: LoggedEvent[] = []
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.logEvent('session_started', 'system')
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  logEvent(eventName: string, context: string, data?: EventData): void {
    const event: LoggedEvent = {
      eventName,
      timestamp: new Date().toISOString(),
      context,
      data,
      sessionId: this.sessionId
    }

    this.events.push(event)
    
    // Console log with clear formatting
    console.group(`🎯 Event: ${eventName}`)
    console.log(`Context: ${context}`)
    console.log(`Time: ${event.timestamp}`)
    if (data && Object.keys(data).length > 0) {
      console.log('Data:', data)
    }
    console.log(`Session: ${this.sessionId}`)
    console.groupEnd()
  }

  getEvents(): LoggedEvent[] {
    return [...this.events]
  }

  getEventsByName(eventName: string): LoggedEvent[] {
    return this.events.filter(event => event.eventName === eventName)
  }

  clearEvents(): void {
    this.events = []
    console.log('🗑️ Event log cleared')
  }

  // Specific event helpers
  logQuizStarted(): void {
    this.logEvent('quiz_started', 'quiz_flow')
  }

  logQuestionAnswered(questionId: number, answer: string): void {
    this.logEvent('question_answered', 'quiz_flow', {
      questionId,
      answer
    })
  }

  logQuizCompleted(superpower: string, totalQuestions: number): void {
    this.logEvent('quiz_completed', 'quiz_flow', {
      superpower,
      totalQuestions,
      completionTime: Date.now()
    })
  }

  logEmailCollected(hasEmail: boolean): void {
    this.logEvent('email_collected', 'user_engagement', {
      hasEmail
    })
  }

  logEmailSignup(data: {
    firstName: string
    email: string
    preferences: {
      superpowerTips: boolean
      monthlyRoundup: boolean
    }
    superpower: string
  }): void {
    this.logEvent('email_signup', 'conversion', {
      firstName: data.firstName,
      email: data.email,
      superpowerTips: data.preferences.superpowerTips,
      monthlyRoundup: data.preferences.monthlyRoundup,
      superpower: data.superpower
    })
  }

  logDonationClicked(charityName: string, superpower: string, donationType: 'top' | 'other', donationUrl: string): void {
    this.logEvent('donation_clicked', 'conversion', {
      charityName,
      superpower,
      donationType,
      donationUrl,
      timestamp: Date.now()
    })
  }

  logDonationSelfReported(charityName: string, amount?: number, reason?: string, isAnonymous?: boolean): void {
    this.logEvent('donation_self_reported', 'conversion_feedback', {
      charityName,
      amount,
      reason,
      isAnonymous
    })
  }

  logSocialShare(platform: string, superpower: string): void {
    this.logEvent('social_share', 'engagement', {
      platform,
      superpower
    })
  }

  logResultViewed(superpower: string, source: 'quiz_completion' | 'direct_link'): void {
    this.logEvent('result_viewed', 'page_view', {
      superpower,
      source
    })
  }

  // Export for future analytics integration
  exportForAnalytics(): LoggedEvent[] {
    return this.getEvents().map(event => ({
      ...event,
      // Add any additional formatting needed for external analytics
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    }))
  }
}

// Singleton instance for global use
export const eventLogger = new EventLogger()

// Type exports for use in components
export type { EventData, LoggedEvent }