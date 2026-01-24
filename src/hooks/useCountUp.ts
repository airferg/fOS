import { useState, useEffect, useRef } from 'react'

export function useCountUp(targetValue: number, duration: number = 1000) {
  const [currentValue, setCurrentValue] = useState(targetValue)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // If target is 0, set immediately
    if (targetValue === 0) {
      setCurrentValue(0)
      return
    }

    const startValue = currentValue
    const difference = targetValue - startValue
    
    // If no change, don't animate
    if (Math.abs(difference) < 0.01) {
      return
    }

    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation (ease-out cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const newValue = startValue + difference * easeOutCubic
      
      setCurrentValue(newValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setCurrentValue(targetValue)
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [targetValue, duration])

  return currentValue
}
