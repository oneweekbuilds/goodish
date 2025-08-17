import React from 'react';
import { Button } from '@goodish/ui';

interface QuizIntroProps {
  onStart: () => void;
}

export function QuizIntro({ onStart }: QuizIntroProps) {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-goodish-teal/10 rounded-full mb-6">
          <span className="text-4xl">💚</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-goodish-charcoal mb-6">
          GoodHeart
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
          Discover your giving superpower and get matched with high-impact charities
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-semibold text-goodish-charcoal mb-6">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-goodish-teal rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
              1
            </div>
            <div>
              <h3 className="font-semibold text-goodish-charcoal mb-2">Answer Questions</h3>
              <p className="text-gray-600 text-sm">
                Take our 5-minute quiz about your values and giving preferences
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-goodish-teal rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
              2
            </div>
            <div>
              <h3 className="font-semibold text-goodish-charcoal mb-2">Get Matched</h3>
              <p className="text-gray-600 text-sm">
                Discover your giving personality and matched charity recommendations
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-goodish-teal rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
              3
            </div>
            <div>
              <h3 className="font-semibold text-goodish-charcoal mb-2">Make Impact</h3>
              <p className="text-gray-600 text-sm">
                Support vetted, high-impact organizations aligned with your values
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={onStart} size="lg">
        Start Quiz
      </Button>

      <p className="text-sm text-gray-500 mt-4">
        5 questions • Takes about 3 minutes
      </p>
    </div>
  );
}