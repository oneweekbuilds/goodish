import React from 'react';
import { SimplePlaceholder } from '../../src/screens/SimplePlaceholder';

export default function RoutineScreen() {
  return (
    <SimplePlaceholder
      title="Routine Builder"
      description="Build your perfect morning routine with drag & drop simplicity"
      emoji="📝"
      features={[
        "🎯 Pre-built templates (Minimal, Self-Care, Gym Day)",
        "⏰ Smart time estimation that learns from you",
        "🎨 Drag & drop to reorder tasks easily",
        "📊 Track completion times and build streaks"
      ]}
    />
  );
}