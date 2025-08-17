'use client'

import { useState } from 'react'
import { Button, Section } from '@goodish/ui'
import { ArrowRight, Heart } from 'lucide-react'

export default function GoodHeartPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')

  const questions = [
    {
      id: 1,
      question: "What causes inspire you most?",
      options: [
        "Helping people in extreme poverty",
        "Protecting animals from suffering", 
        "Fighting climate change",
        "Supporting education and opportunity",
        "Advancing health and preventing disease"
      ]
    },
    {
      id: 2,
      question: "How do you prefer to create change?",
      options: [
        "Direct service and support",
        "Research and innovation",
        "Advocacy and policy change", 
        "Community organizing",
        "Emergency response"
      ]
    }
  ]

  const currentQ = questions[currentQuestion]

  const handleNext = () => {
    if (selectedAnswer && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer('')
    } else if (selectedAnswer) {
      // Quiz complete - could redirect to results
      alert('Quiz complete! Your giving superpower will be calculated.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <Section>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">GoodHeart Quiz</h1>
            </div>
            <p className="text-gray-600">Discover your giving superpower</p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
              {currentQ.question}
            </h2>
            
            <div className="space-y-4">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    selectedAnswer === option
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-900'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswer === option 
                        ? 'border-yellow-500 bg-yellow-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswer === option && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Next button */}
          <div className="text-center">
            <Button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={`bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-semibold transition-all ${
                selectedAnswer ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
              }`}
            >
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'Get My Results'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
