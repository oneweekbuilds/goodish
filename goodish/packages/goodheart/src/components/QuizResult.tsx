import React from 'react';
import { QuizResult as QuizResultType } from '../types';
import { Button } from '@goodish/ui';

interface QuizResultProps {
  result: QuizResultType;
  onRestart: () => void;
}

export function QuizResult({ result, onRestart }: QuizResultProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-goodish-teal/10 rounded-full mb-6">
          <span className="text-3xl">💝</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-goodish-charcoal mb-4">
          {result.title}
        </h2>
        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          {result.description}
        </p>
      </div>

      <div className="mb-12">
        <h3 className="text-2xl font-semibold text-goodish-charcoal mb-8 text-center">
          Recommended Charities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.charities.map((charity, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-goodish-teal/10 text-goodish-teal border-goodish-teal/20 mb-3">
                  {charity.focus}
                </span>
                <h4 className="text-xl font-semibold text-goodish-charcoal mb-2">
                  {charity.name}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {charity.description}
                </p>
              </div>
              <a
                href={charity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-goodish-teal hover:text-goodish-green transition-colors text-sm font-medium"
              >
                Learn more →
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Button onClick={onRestart} variant="secondary" size="lg">
          Take Quiz Again
        </Button>
      </div>
    </div>
  );
}