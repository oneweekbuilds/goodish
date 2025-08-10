"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QuizResults() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/quiz')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fdfaf4" }}>
      <p>Redirecting to quiz...</p>
    </div>
  )
}