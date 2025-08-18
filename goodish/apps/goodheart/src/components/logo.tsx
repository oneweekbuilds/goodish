"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "hero"
  className?: string
}

export const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: "h-8",
    md: "h-16 lg:h-20",
    lg: "h-12",
    hero: "h-20",
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <Link
      href="/"
      className={`flex items-center transition-transform duration-200 ease-in-out hover:scale-102 ${className}`}
      aria-label="Go to homepage"
    >
      {!imageError ? (
        <Image
          src="/images/goodheart-logo-bold-yellow.png"
          alt="GoodHeart logo"
          width={400}
          height={96}
          className={`${sizeClasses[size]} w-auto object-contain`}
          onError={handleImageError}
          priority
        />
      ) : (
        <span
          className="font-bold text-black text-lg sm:text-xl lg:text-2xl"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          GoodHeart
        </span>
      )}
    </Link>
  )
}
