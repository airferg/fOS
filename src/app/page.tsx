'use client'

import Link from 'next/link'
import HydraLogo from '@/components/HydraLogo'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-6">
          <HydraLogo size="xl" showText animate />
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
          An AI-powered operating system for startup founders
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-12 max-w-xl mx-auto leading-relaxed">
          Leverage what you already have. Skills, network, funds, and experience.
          Build your startup using the Bird-in-Hand principle.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-xs font-medium rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-3 gap-12 text-left">
          <div>
            <h3 className="text-xs font-medium text-black dark:text-white mb-2">AI Assistant</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Get actionable suggestions based on your unique situation
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-black dark:text-white mb-2">Real Actions</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Send emails, schedule calls, create documents automatically
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-black dark:text-white mb-2">Smart Roadmap</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              AI-generated plan tailored to your time and resources
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
