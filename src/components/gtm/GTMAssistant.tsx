'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Suggestion {
  id: string
  type: 'summary' | 'experiment' | 'bottleneck'
  content: string
}

const mockSuggestions: Record<string, Suggestion> = {
  summary: {
    id: '1',
    type: 'summary',
    content: `**This Week's Learnings:**

• LinkedIn founder stories outperformed product posts 2.3x
• Cold email video intros increased response rate from 4% to 12%
• SEO content has low traffic but high conversion (40% signup rate)
• Biggest funnel drop-off: Leads → Signups (90% drop)

**Key Insight:** Personal storytelling resonates more than product features. Consider doubling down on founder narrative across channels.`
  },
  experiment: {
    id: '2',
    type: 'experiment',
    content: `**Suggested Next Experiment:**

**Hypothesis:** Adding founder story to cold email subject lines increases open rates

**Why:** Your LinkedIn founder stories got 2.3x engagement. Apply same narrative to email.

**Test:** 
- A: Control (product-focused subject)
- B: Founder story subject line

**Success Metric:** Open rate >25% (current: 18%)

**Effort:** Low (just subject line change)
**Timeline:** 1 week, 200 emails per variant`
  },
  bottleneck: {
    id: '3',
    type: 'bottleneck',
    content: `**Biggest Bottleneck Identified:**

**Stage:** Leads → Signups
**Drop-off:** 90% (500 leads → 50 signups)

**Root Cause Analysis:**
• High intent leads (from LinkedIn) but low conversion
• Possible friction points:
  - Signup form too long?
  - Missing social proof?
  - Value prop unclear at signup?

**Recommended Experiments:**
1. A/B test shorter signup form (3 fields vs 7)
2. Add testimonials on signup page
3. Test different value props in signup CTA

**Potential Impact:** Improving 5% → 10% conversion = 25 more signups/week`
  }
}

export default function GTMAssistant() {
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSuggestion = async (type: 'summary' | 'experiment' | 'bottleneck') => {
    setIsLoading(true)
    setActiveSuggestion(null)
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    setActiveSuggestion(type)
    setIsLoading(false)
  }

  const currentSuggestion = activeSuggestion ? mockSuggestions[activeSuggestion] : null

  return (
    <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-black dark:text-white">Assistant (Suggestions)</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">AI-powered insights</p>
      </div>

      <div className="p-4 space-y-2">
        <button
          onClick={() => handleSuggestion('summary')}
          disabled={isLoading}
          className="w-full px-3 py-2 text-left text-xs bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span className="text-black dark:text-white">Summarize this week's learnings</span>
          {isLoading && activeSuggestion === null && (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        <button
          onClick={() => handleSuggestion('experiment')}
          disabled={isLoading}
          className="w-full px-3 py-2 text-left text-xs bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span className="text-black dark:text-white">Suggest next experiment</span>
          {isLoading && activeSuggestion === null && (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        <button
          onClick={() => handleSuggestion('bottleneck')}
          disabled={isLoading}
          className="w-full px-3 py-2 text-left text-xs bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span className="text-black dark:text-white">Find our biggest bottleneck</span>
          {isLoading && activeSuggestion === null && (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {currentSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-800"
          >
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {currentSuggestion.type === 'summary' && 'Weekly Summary'}
                  {currentSuggestion.type === 'experiment' && 'Experiment Suggestion'}
                  {currentSuggestion.type === 'bottleneck' && 'Bottleneck Analysis'}
                </span>
                <button
                  onClick={() => setActiveSuggestion(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-black dark:text-white whitespace-pre-line leading-relaxed">
                {currentSuggestion.content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
