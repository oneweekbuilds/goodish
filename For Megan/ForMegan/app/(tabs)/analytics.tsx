import React from 'react';
import { SimplePlaceholder } from '../../src/screens/SimplePlaceholder';

export default function AnalyticsScreen() {
  return (
    <SimplePlaceholder
      title="Analytics"
      description="Track your progress with beautiful insights and achievements"
      emoji="📊"
      features={[
        "📈 Beautiful charts showing punctuality trends",
        "🏆 Achievement system with unlockable badges",
        "🔥 Habit streaks and completion analytics",
        "💡 AI-powered insights and recommendations"
      ]}
    />
  );
}