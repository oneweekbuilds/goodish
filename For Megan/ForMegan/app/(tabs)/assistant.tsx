import React from 'react';
import { SimplePlaceholder } from '../../src/screens/SimplePlaceholder';

export default function AssistantScreen() {
  return (
    <SimplePlaceholder
      title="Morning Assistant"
      description="Your live coaching companion for perfect morning routines"
      emoji="🎯"
      features={[
        "⏰ Live task timers with smart notifications",
        "💪 Motivational coaching and encouragement",
        "🔥 Real-time progress tracking and streaks",
        "🎨 Beautiful animations and haptic feedback"
      ]}
    />
  );
}