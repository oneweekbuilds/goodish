import React from 'react';
import { SimplePlaceholder } from '../../src/screens/SimplePlaceholder';

export default function TripScreen() {
  return (
    <SimplePlaceholder
      title="Trip Planner"
      description="Never be late again with AI-powered departure timing"
      emoji="🚗"
      features={[
        "📍 Smart destination search with Google Places",
        "⏱️ Real-time traffic and travel time calculation", 
        "🗓️ Calendar integration for automatic planning",
        "📱 Live departure notifications and updates"
      ]}
    />
  );
}