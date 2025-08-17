'use client';

import React, { useState } from 'react';
import { Section } from '@goodish/ui';
import { QuizIntro } from './components/QuizIntro';
import { QuizQuestion } from './components/QuizQuestion';
import { QuizResult } from './components/QuizResult';
import { questions, results } from './quiz-data';
import { GivingProfile } from './types';

type QuizState = 'intro' | 'quiz' | 'result';

export function GoodHeartApp() {
  const [state, setState] = useState<QuizState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<GivingProfile | null>(null);

  const handleStart = () => {
    setState('quiz');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setProfile(null);
  };

  const handleAnswer = (optionId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate result
      const scores = { effective: 0, compassionate: 0, innovative: 0 };
      
      Object.entries(newAnswers).forEach(([questionId, optionId]) => {
        const question = questions.find(q => q.id === questionId);
        const option = question?.options.find(o => o.id === optionId);
        if (option) {
          Object.entries(option.scores).forEach(([type, score]) => {
            scores[type as keyof typeof scores] += score;
          });
        }
      });

      // Determine dominant giving type
      const dominantType = Object.entries(scores).reduce((a, b) => 
        scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
      )[0];

      setProfile({ type: dominantType, scores });
      setState('result');
    }
  };

  const handleRestart = () => {
    setState('intro');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setProfile(null);
  };

  return (
    <div>
      <Section className="min-h-screen bg-gradient-to-br from-goodish-green/5 to-goodish-teal/5">
        {state === 'intro' && (
          <QuizIntro onStart={handleStart} />
        )}
        
        {state === 'quiz' && (
          <QuizQuestion
            question={questions[currentQuestionIndex]}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />
        )}
        
        {state === 'result' && profile && (
          <QuizResult
            result={results[profile.type]}
            onRestart={handleRestart}
          />
        )}
      </Section>
    </div>
  );
}