import React from 'react';
import { QuizQuestion as QuizQuestionType } from '../types';
import { Button } from '@goodish/ui';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (optionId: string) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuizQuestion({ question, onAnswer, questionNumber, totalQuestions }: QuizQuestionProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-goodish-teal">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < questionNumber ? 'bg-goodish-teal' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-goodish-charcoal mb-8">
          {question.question}
        </h2>
      </div>

      <div className="space-y-4">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onAnswer(option.id)}
            className="w-full p-6 text-left bg-white border border-gray-200 rounded-2xl hover:border-goodish-teal hover:bg-goodish-teal/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-goodish-teal focus:ring-offset-2"
          >
            <span className="text-lg text-goodish-charcoal font-medium">
              {option.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}