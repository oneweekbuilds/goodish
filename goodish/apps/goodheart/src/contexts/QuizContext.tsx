"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'

export interface QuizAnswer {
  questionId: number
  value: string
}

export interface QuizState {
  answers: { [questionId: number]: string }
  currentQuestion: number
  isComplete: boolean
  result: string | null
  userEmail: string | null
}

type QuizAction =
  | { type: 'SET_ANSWER'; payload: { questionId: number; value: string } }
  | { type: 'SET_CURRENT_QUESTION'; payload: number }
  | { type: 'SET_COMPLETE'; payload: boolean }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'RESET_QUIZ' }
  | { type: 'LOAD_FROM_STORAGE'; payload: QuizState }

const initialState: QuizState = {
  answers: {},
  currentQuestion: 0,
  isComplete: false,
  result: null,
  userEmail: null,
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.value,
        },
      }
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
      }
    case 'SET_COMPLETE':
      return {
        ...state,
        isComplete: action.payload,
      }
    case 'SET_RESULT':
      return {
        ...state,
        result: action.payload,
      }
    case 'SET_EMAIL':
      return {
        ...state,
        userEmail: action.payload,
      }
    case 'RESET_QUIZ':
      return initialState
    case 'LOAD_FROM_STORAGE':
      return action.payload
    default:
      return state
  }
}

interface QuizContextType {
  state: QuizState
  setAnswer: (questionId: number, value: string) => void
  setCurrentQuestion: (question: number) => void
  setComplete: (complete: boolean) => void
  setResult: (result: string) => void
  setEmail: (email: string) => void
  resetQuiz: () => void
  saveToStorage: () => void
  loadFromStorage: () => void
  getTotalQuestions: () => number
  getProgress: () => number
  isAnswered: (questionId: number) => boolean
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goodheart_quiz_state', JSON.stringify(state))
    }
  }, [state])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('goodheart_quiz_state')
      if (saved) {
        try {
          const parsedState = JSON.parse(saved)
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState })
        } catch (error) {
          console.error('Failed to load quiz state from storage:', error)
        }
      }
    }
  }, [])

  const setAnswer = (questionId: number, value: string) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, value } })
  }

  const setCurrentQuestion = (question: number) => {
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: question })
  }

  const setComplete = (complete: boolean) => {
    dispatch({ type: 'SET_COMPLETE', payload: complete })
  }

  const setResult = (result: string) => {
    dispatch({ type: 'SET_RESULT', payload: result })
  }

  const setEmail = (email: string) => {
    dispatch({ type: 'SET_EMAIL', payload: email })
  }

  const resetQuiz = () => {
    dispatch({ type: 'RESET_QUIZ' })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('goodheart_quiz_state')
    }
  }

  const saveToStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goodheart_quiz_state', JSON.stringify(state))
    }
  }

  const loadFromStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('goodheart_quiz_state')
      if (saved) {
        try {
          const parsedState = JSON.parse(saved)
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState })
        } catch (error) {
          console.error('Failed to load quiz state from storage:', error)
        }
      }
    }
  }

  const getTotalQuestions = () => 6 // Based on the quiz questions data

  const getProgress = () => {
    return ((state.currentQuestion + 1) / getTotalQuestions()) * 100
  }

  const isAnswered = (questionId: number) => {
    return questionId in state.answers
  }

  const value: QuizContextType = {
    state,
    setAnswer,
    setCurrentQuestion,
    setComplete,
    setResult,
    setEmail,
    resetQuiz,
    saveToStorage,
    loadFromStorage,
    getTotalQuestions,
    getProgress,
    isAnswered,
  }

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider')
  }
  return context
}