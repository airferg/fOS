'use client'

import { useEffect, useState } from 'react'

interface PortfolioGenerationModalProps {
  onComplete: () => void
  onClose: () => void
}

const GENERATION_STEPS = [
  { label: 'Gathering company information' },
  { label: 'Aggregating team profiles' },
  { label: 'Compiling funding data' },
  { label: 'Calculating equity breakdown' },
  { label: 'Formatting document' },
]

export default function PortfolioGenerationModal({ onComplete, onClose }: PortfolioGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [generating, setGenerating] = useState(true)

  useEffect(() => {
    // Simulate generation steps
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= GENERATION_STEPS.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            setGenerating(false)
            onComplete()
          }, 500)
          return prev
        }
        return prev + 1
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-md w-full mx-4 p-8">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Startup Portfolio
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Generate a comprehensive portfolio document from your startup data
        </p>

        {generating && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <div className="w-5 h-5 border-2 border-zinc-300 border-t-black dark:border-zinc-600 dark:border-t-white rounded-full animate-spin"></div>
              <span className="text-sm">Generating portfolio...</span>
            </div>

            <div className="space-y-2 ml-8">
              {GENERATION_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 text-sm ${
                    idx < currentStep
                      ? 'text-black dark:text-white'
                      : idx === currentStep
                      ? 'text-black dark:text-white'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!generating && (
          <div className="text-center py-4">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Portfolio generated successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

