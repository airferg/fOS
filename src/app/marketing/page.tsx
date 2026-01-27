'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'

// Types for GTM primitives
interface IcpSegment {
  id: string
  name: string
  description: string
  attributes: string[]
  winRate: number
  avgDealSize: number
  retention: number
  tier: 1 | 2 | 3
  accountCount: number
}

interface Deal {
  id: string
  name: string
  company: string
  amount: number
  stage: string
  daysInStage: number
  lastActivity: string
  nextStep?: string
  riskLevel: 'low' | 'medium' | 'high'
  contacts: { name: string; role: string }[]
  source: string
}

interface OutboundSequence {
  id: string
  name: string
  status: 'active' | 'paused' | 'draft'
  icpTarget: string
  prospectsEnrolled: number
  openRate: number
  replyRate: number
  meetingsBooked: number
  steps: { type: string; subject?: string; content: string }[]
}

interface ActivationCohort {
  id: string
  name: string
  signups: number
  activated: number
  upgraded: number
  topDropoff: string
  avgTimeToActivation: number
}

interface GtmExperiment {
  id: string
  name: string
  hypothesis: string
  channel: string
  status: 'running' | 'completed' | 'paused'
  startDate: string
  metric: string
  baseline: number
  current: number
  result?: 'win' | 'lose' | 'inconclusive'
}

interface SupportTheme {
  id: string
  theme: string
  ticketCount: number
  avgSentiment: number
  topPhrases: string[]
  suggestedAction?: string
}

interface ExecutionStep {
  id: string
  message: string
  status: 'pending' | 'running' | 'complete'
}

// Mock data
const mockSegments: IcpSegment[] = [
  { id: 's1', name: 'Mid-Market SaaS', description: 'B2B SaaS companies, 50-200 employees, Series A-B', attributes: ['SaaS', '50-200 emp', 'Series A-B', 'NA/EU'], winRate: 42, avgDealSize: 18000, retention: 94, tier: 1, accountCount: 45 },
  { id: 's2', name: 'Enterprise Tech', description: 'Large tech companies with innovation budgets', attributes: ['Tech', '500+ emp', 'Enterprise'], winRate: 28, avgDealSize: 45000, retention: 88, tier: 2, accountCount: 12 },
  { id: 's3', name: 'SMB Agencies', description: 'Digital agencies and consultancies', attributes: ['Agency', '10-50 emp', 'Services'], winRate: 35, avgDealSize: 6000, retention: 72, tier: 3, accountCount: 89 },
]

const mockDeals: Deal[] = [
  { id: 'd1', name: 'Acme Corp Expansion', company: 'Acme Corp', amount: 24000, stage: 'Negotiation', daysInStage: 12, lastActivity: '2 days ago', nextStep: 'Send revised proposal', riskLevel: 'low', contacts: [{ name: 'Sarah Chen', role: 'VP Ops' }], source: 'Outbound' },
  { id: 'd2', name: 'TechStart Initial', company: 'TechStart', amount: 8500, stage: 'Demo', daysInStage: 8, lastActivity: '5 days ago', riskLevel: 'high', contacts: [{ name: 'Mike Johnson', role: 'Founder' }], source: 'Inbound' },
  { id: 'd3', name: 'GlobalCo Pilot', company: 'GlobalCo', amount: 36000, stage: 'Proposal', daysInStage: 3, lastActivity: '1 day ago', nextStep: 'Champion call scheduled', riskLevel: 'medium', contacts: [{ name: 'Lisa Park', role: 'Director' }, { name: 'Tom Wilson', role: 'CTO' }], source: 'Referral' },
  { id: 'd4', name: 'StartupX Deal', company: 'StartupX', amount: 12000, stage: 'Discovery', daysInStage: 18, lastActivity: '9 days ago', riskLevel: 'high', contacts: [{ name: 'Alex Rivera', role: 'CEO' }], source: 'Outbound' },
]

const mockSequences: OutboundSequence[] = [
  { id: 'seq1', name: 'Mid-Market SaaS Intro', status: 'active', icpTarget: 'Mid-Market SaaS', prospectsEnrolled: 245, openRate: 52, replyRate: 8.2, meetingsBooked: 12, steps: [{ type: 'email', subject: 'Quick question about {{company}}', content: 'Hi {{firstName}}, I noticed {{company}} recently...' }, { type: 'email', subject: 'Re: Quick question', content: 'Following up on my previous note...' }] },
  { id: 'seq2', name: 'Enterprise Warm Outreach', status: 'active', icpTarget: 'Enterprise Tech', prospectsEnrolled: 89, openRate: 41, replyRate: 4.5, meetingsBooked: 3, steps: [{ type: 'email', subject: 'Intro from {{mutualConnection}}', content: 'Hi {{firstName}}...' }] },
  { id: 'seq3', name: 'Agency Reactivation', status: 'paused', icpTarget: 'SMB Agencies', prospectsEnrolled: 156, openRate: 38, replyRate: 2.1, meetingsBooked: 2, steps: [{ type: 'email', subject: 'Been a while...', content: 'Hi {{firstName}}...' }] },
]

const mockCohorts: ActivationCohort[] = [
  { id: 'c1', name: 'Jan 2026 Signups', signups: 342, activated: 156, upgraded: 28, topDropoff: 'First integration connect', avgTimeToActivation: 2.4 },
  { id: 'c2', name: 'Dec 2025 Signups', signups: 289, activated: 133, upgraded: 32, topDropoff: 'Team invite step', avgTimeToActivation: 3.1 },
]

const mockExperiments: GtmExperiment[] = [
  { id: 'e1', name: 'LinkedIn DM vs Email', hypothesis: 'LinkedIn DMs get higher reply rates for enterprise', channel: 'LinkedIn', status: 'running', startDate: '2026-01-10', metric: 'Reply Rate', baseline: 4.5, current: 7.2 },
  { id: 'e2', name: 'Product-led landing page', hypothesis: 'Interactive demo increases signup rate', channel: 'Website', status: 'completed', startDate: '2025-12-01', metric: 'Signup Rate', baseline: 2.1, current: 3.8, result: 'win' },
  { id: 'e3', name: 'Shorter onboarding flow', hypothesis: 'Fewer steps = higher activation', channel: 'Product', status: 'running', startDate: '2026-01-15', metric: 'Activation Rate', baseline: 45, current: 52 },
]

const mockThemes: SupportTheme[] = [
  { id: 't1', theme: 'Integration setup confusion', ticketCount: 23, avgSentiment: 0.4, topPhrases: ['how do I connect', 'integration not working', 'OAuth error'], suggestedAction: 'Add integration setup wizard' },
  { id: 't2', theme: 'Pricing questions', ticketCount: 18, avgSentiment: 0.6, topPhrases: ['what plan do I need', 'enterprise pricing', 'annual discount'], suggestedAction: 'Create pricing comparison page' },
  { id: 't3', theme: 'Feature requests - reporting', ticketCount: 15, avgSentiment: 0.7, topPhrases: ['custom reports', 'export data', 'dashboard'], suggestedAction: 'Prioritize reporting roadmap' },
]

export default function GTMPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Data state
  const [segments, setSegments] = useState<IcpSegment[]>(mockSegments)
  const [deals, setDeals] = useState<Deal[]>(mockDeals)
  const [sequences, setSequences] = useState<OutboundSequence[]>(mockSequences)
  const [cohorts] = useState<ActivationCohort[]>(mockCohorts)
  const [experiments, setExperiments] = useState<GtmExperiment[]>(mockExperiments)
  const [themes] = useState<SupportTheme[]>(mockThemes)
  
  // UI state
  const [activeSection, setActiveSection] = useState<string>('pipeline')
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set())
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null)
  const [expandedSequence, setExpandedSequence] = useState<string | null>(null)
  const [expandedExperiment, setExpandedExperiment] = useState<string | null>(null)
  const [editingIcp, setEditingIcp] = useState<string | null>(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  
  // AI/Execution state
  const [aiSuggestion, setAiSuggestion] = useState<{ dealId: string; suggestion: string; draft?: string } | null>(null)
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Execute action with visual feedback
  const executeAction = async (actionId: string, steps: { message: string }[], onComplete: () => void) => {
    setExecutingAction(actionId)
    setExecutionSteps(steps.map((s, i) => ({ id: `step-${i}`, message: s.message, status: 'pending' })))

    for (let i = 0; i < steps.length; i++) {
      setExecutionSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s))
      await new Promise(r => setTimeout(r, 500 + Math.random() * 300))
      setExecutionSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'complete' } : s))
    }

    await new Promise(r => setTimeout(r, 300))
    onComplete()
    setExecutingAction(null)
    setExecutionSteps([])
  }

  // Generate AI suggestion for a deal
  const generateDealSuggestion = (deal: Deal) => {
    const suggestions: Record<string, { suggestion: string; draft: string }> = {
      'd1': {
        suggestion: 'Deal is in negotiation for 12 days. Recommend sending a "value recap" email highlighting ROI and asking for timeline clarity.',
        draft: `Hi Sarah,\n\nWanted to follow up on our conversation about the Acme expansion. Based on what you shared about your Q2 goals, here's a quick recap of how we can help:\n\n• 40% reduction in manual ops time\n• Integration with your existing stack\n• Dedicated onboarding support\n\nWhat's the best path to get this wrapped up this month?\n\nBest,\n[Your name]`
      },
      'd2': {
        suggestion: 'High risk: No activity in 5 days post-demo. Recommend a "checking in" message with a specific value prop or case study.',
        draft: `Hi Mike,\n\nWanted to share a quick case study from another founder in your space who saw 3x improvement in their workflow after implementing our solution.\n\n[Case study link]\n\nWould love to hear your thoughts and answer any questions from the demo.\n\nBest,\n[Your name]`
      },
      'd3': {
        suggestion: 'Champion call scheduled. Prepare a mutual action plan (MAP) document to align on next steps and close timeline.',
        draft: `# Mutual Action Plan - GlobalCo\n\n**Goal:** Go live by Feb 28\n\n**Week 1:** Champion call + technical review\n**Week 2:** Security/legal review\n**Week 3:** Final approval + signature\n**Week 4:** Kickoff + onboarding\n\n**Open items:**\n- [ ] Technical requirements doc\n- [ ] Pricing approval from Lisa\n- [ ] Legal review timeline`
      },
      'd4': {
        suggestion: 'Stale deal: 18 days in discovery with no recent activity. Recommend a "break up" email to re-engage or qualify out.',
        draft: `Hi Alex,\n\nI haven't heard back in a while, so I wanted to check if priorities have shifted at StartupX.\n\nNo worries if now isn't the right time—just let me know either way and I'll update my notes accordingly.\n\nIf things have changed and you'd like to pick back up, I'm happy to reconnect.\n\nBest,\n[Your name]`
      }
    }
    
    setAiSuggestion({ dealId: deal.id, ...suggestions[deal.id] || { suggestion: 'Analyzing deal...', draft: '' } })
  }

  // Handle command palette actions
  const handleCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()
    
    if (lowerCommand.includes('draft') && lowerCommand.includes('email')) {
      if (selectedDeals.size > 0) {
        const dealId = Array.from(selectedDeals)[0]
        const deal = deals.find(d => d.id === dealId)
        if (deal) generateDealSuggestion(deal)
      }
    } else if (lowerCommand.includes('pause') && lowerCommand.includes('sequence')) {
      // Would pause sequences
    } else if (lowerCommand.includes('create') && lowerCommand.includes('experiment')) {
      setActiveSection('experiments')
    }
    
    setShowCommandPalette(false)
    setCommandInput('')
  }

  // Toggle deal selection
  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dealId)) {
        newSet.delete(dealId)
      } else {
        newSet.add(dealId)
      }
      return newSet
    })
  }

  // Batch actions for selected deals
  const handleBatchAction = (action: string) => {
    if (action === 'draft-followups') {
      executeAction('batch-draft', [
        { message: `Analyzing ${selectedDeals.size} selected deals...` },
        { message: 'Generating personalized follow-ups...' },
        { message: 'Creating drafts in HubSpot...' },
        { message: `${selectedDeals.size} email drafts created` },
      ], () => {
        setSelectedDeals(new Set())
      })
    } else if (action === 'create-tasks') {
      executeAction('batch-tasks', [
        { message: 'Creating next-step tasks...' },
        { message: 'Syncing with HubSpot...' },
        { message: 'Tasks created' },
      ], () => {
        setSelectedDeals(new Set())
      })
    }
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Quick stats
  const totalPipeline = deals.reduce((sum, d) => sum + d.amount, 0)
  const atRiskDeals = deals.filter(d => d.riskLevel === 'high').length
  const avgActivation = cohorts.length > 0 ? Math.round(cohorts.reduce((sum, c) => sum + (c.activated / c.signups * 100), 0) / cohorts.length) : 0

  return (
    <AppLayout user={user}>
      <PageBackground>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-1">GTM Command Center</h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Orchestrate your pipeline, outbound, and activation across tools
                </p>
              </div>
              <button
                onClick={() => setShowCommandPalette(true)}
                className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
                <span className="text-zinc-400 dark:text-zinc-600 text-[10px]">⌘K</span>
              </button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="text-xs text-zinc-500 mb-1">Pipeline Value</div>
              <div className="text-2xl font-semibold text-black dark:text-white">${(totalPipeline / 1000).toFixed(0)}K</div>
              <div className="text-xs text-zinc-400">{deals.length} active deals</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="text-xs text-zinc-500 mb-1">At-Risk Deals</div>
              <div className="text-2xl font-semibold text-black dark:text-white">{atRiskDeals}</div>
              <div className="text-xs text-zinc-400">need attention</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="text-xs text-zinc-500 mb-1">Activation Rate</div>
              <div className="text-2xl font-semibold text-black dark:text-white">{avgActivation}%</div>
              <div className="text-xs text-zinc-400">signup → activated</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="text-xs text-zinc-500 mb-1">Meetings Booked</div>
              <div className="text-2xl font-semibold text-black dark:text-white">{sequences.reduce((sum, s) => sum + s.meetingsBooked, 0)}</div>
              <div className="text-xs text-zinc-400">from sequences</div>
            </motion.div>
          </div>

          {/* Section Navigation */}
          <div className="flex items-center gap-1 mb-4 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            {[
              { id: 'pipeline', label: 'Pipeline' },
              { id: 'icp', label: 'ICP & Segments' },
              { id: 'outbound', label: 'Outbound' },
              { id: 'activation', label: 'Activation' },
              { id: 'experiments', label: 'Experiments' },
              { id: 'support', label: 'Support Insights' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeSection === section.id
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Section Content */}
          <AnimatePresence mode="wait">
            {/* Pipeline Section */}
            {activeSection === 'pipeline' && (
              <motion.div
                key="pipeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Batch Actions Bar */}
                <AnimatePresence>
                  {selectedDeals.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg p-3 flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{selectedDeals.size} deals selected</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBatchAction('draft-followups')}
                          className="px-3 py-1.5 bg-white/20 dark:bg-black/20 rounded text-xs font-medium hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
                        >
                          Draft Follow-ups
                        </button>
                        <button
                          onClick={() => handleBatchAction('create-tasks')}
                          className="px-3 py-1.5 bg-white/20 dark:bg-black/20 rounded text-xs font-medium hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
                        >
                          Create Tasks
                        </button>
                        <button
                          onClick={() => setSelectedDeals(new Set())}
                          className="px-2 py-1.5 text-xs hover:bg-white/10 dark:hover:bg-black/10 rounded transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Deals List */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-black dark:text-white">Pipeline Health</h3>
                      <p className="text-xs text-zinc-500">Click a deal to see AI recommendations</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>Data from HubSpot</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {deals.map((deal) => (
                      <div key={deal.id}>
                        <div
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedDeals.has(deal.id) ? 'bg-zinc-100 dark:bg-zinc-900' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Selection checkbox */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleDealSelection(deal.id) }}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                selectedDeals.has(deal.id)
                                  ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'
                                  : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
                              }`}
                            >
                              {selectedDeals.has(deal.id) && (
                                <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            
                            {/* Deal info */}
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => { setExpandedDeal(expandedDeal === deal.id ? null : deal.id); generateDealSuggestion(deal) }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-black dark:text-white truncate">{deal.name}</p>
                                <span className={`px-1.5 py-0.5 text-xs rounded ${
                                  deal.riskLevel === 'high' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium' :
                                  deal.riskLevel === 'medium' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' :
                                  'bg-zinc-50 dark:bg-zinc-900 text-zinc-500'
                                }`}>
                                  {deal.riskLevel === 'high' ? 'At Risk' : deal.riskLevel === 'medium' ? 'Monitor' : 'On Track'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <span>{deal.company}</span>
                                <span>${deal.amount.toLocaleString()}</span>
                                <span>{deal.stage}</span>
                                <span>{deal.daysInStage}d in stage</span>
                                <span>Last: {deal.lastActivity}</span>
                              </div>
                            </div>

                            {/* Expand indicator */}
                            <svg
                              className={`w-4 h-4 text-zinc-400 transition-transform ${expandedDeal === deal.id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded Deal View with AI */}
                        <AnimatePresence>
                          {expandedDeal === deal.id && aiSuggestion?.dealId === deal.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                            >
                              <div className="p-4 space-y-4">
                                {/* AI Recommendation */}
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3.5 h-3.5 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">AI Recommendation</p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{aiSuggestion.suggestion}</p>
                                  </div>
                                </div>

                                {/* Editable Draft */}
                                {aiSuggestion.draft && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Draft (edit before sending)</p>
                                    <textarea
                                      defaultValue={aiSuggestion.draft}
                                      className="w-full h-40 p-3 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-black dark:text-white"
                                    />
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span>Will send via HubSpot to {deal.contacts[0]?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                                          Save as Draft
                                        </button>
                                        <button
                                          onClick={() => {
                                            executeAction(`send-${deal.id}`, [
                                              { message: 'Preparing email...' },
                                              { message: 'Creating draft in HubSpot...' },
                                              { message: 'Email queued for sending' },
                                            ], () => setExpandedDeal(null))
                                          }}
                                          className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                        >
                                          Send via HubSpot
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                  <button
                                    onClick={() => {
                                      executeAction(`task-${deal.id}`, [
                                        { message: 'Creating task in HubSpot...' },
                                        { message: 'Task created' },
                                      ], () => {})
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                  >
                                    Create Follow-up Task
                                  </button>
                                  <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                                    Schedule Meeting
                                  </button>
                                  <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                                    View in HubSpot
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ICP & Segments Section */}
            {activeSection === 'icp' && (
              <motion.div
                key="icp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-black dark:text-white">ICP Performance</h3>
                    <p className="text-xs text-zinc-500">Click a segment to edit or see recommendations</p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {segments.map((segment) => (
                      <div key={segment.id} className="p-4">
                        <div
                          className="cursor-pointer"
                          onClick={() => setEditingIcp(editingIcp === segment.id ? null : segment.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                segment.tier === 1 ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' :
                                segment.tier === 2 ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' :
                                'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                              }`}>
                                Tier {segment.tier}
                              </span>
                              <h4 className="text-sm font-medium text-black dark:text-white">{segment.name}</h4>
                            </div>
                            <span className="text-xs text-zinc-500">{segment.accountCount} accounts</span>
                          </div>
                          <p className="text-xs text-zinc-500 mb-3">{segment.description}</p>
                          <div className="flex items-center gap-6 text-xs">
                            <div>
                              <span className="text-zinc-400">Win Rate</span>
                              <span className="ml-2 font-medium text-black dark:text-white">{segment.winRate}%</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Avg Deal</span>
                              <span className="ml-2 font-medium text-black dark:text-white">${segment.avgDealSize.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Retention</span>
                              <span className="ml-2 font-medium text-black dark:text-white">{segment.retention}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Edit View */}
                        <AnimatePresence>
                          {editingIcp === segment.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800"
                            >
                              <div className="space-y-4">
                                {/* Attributes */}
                                <div>
                                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Defining Attributes</p>
                                  <div className="flex flex-wrap gap-2">
                                    {segment.attributes.map((attr, i) => (
                                      <span key={i} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded flex items-center gap-1">
                                        {attr}
                                        <button className="hover:text-black dark:hover:text-white">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </span>
                                    ))}
                                    <button className="px-2 py-1 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 text-xs rounded hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                                      + Add
                                    </button>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      executeAction(`tag-${segment.id}`, [
                                        { message: 'Scanning HubSpot companies...' },
                                        { message: `Found ${segment.accountCount + 12} matching accounts...` },
                                        { message: 'Applying ICP tags...' },
                                        { message: 'Tags applied in HubSpot' },
                                      ], () => setEditingIcp(null))
                                    }}
                                    className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                  >
                                    Auto-tag in HubSpot
                                  </button>
                                  <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                                    Generate Messaging
                                  </button>
                                  <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                                    Create Sequence
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Outbound Section */}
            {activeSection === 'outbound' && (
              <motion.div
                key="outbound"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-black dark:text-white">Sequence Performance</h3>
                      <p className="text-xs text-zinc-500">Data from Apollo</p>
                    </div>
                    <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                      Create Sequence
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {sequences.map((seq) => (
                      <div key={seq.id}>
                        <div
                          className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                          onClick={() => setExpandedSequence(expandedSequence === seq.id ? null : seq.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-black dark:text-white">{seq.name}</h4>
                              <span className={`px-1.5 py-0.5 text-xs rounded ${
                                seq.status === 'active' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' :
                                seq.status === 'paused' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' :
                                'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                              }`}>
                                {seq.status}
                              </span>
                            </div>
                            <svg
                              className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSequence === seq.id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-6 text-xs">
                            <div>
                              <span className="text-zinc-400">Target</span>
                              <span className="ml-2 text-zinc-600 dark:text-zinc-400">{seq.icpTarget}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Enrolled</span>
                              <span className="ml-2 font-medium text-black dark:text-white">{seq.prospectsEnrolled}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Open</span>
                              <span className="ml-2 font-medium text-black dark:text-white">{seq.openRate}%</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Reply</span>
                              <span className="ml-2 font-medium text-black dark:text-white">{seq.replyRate}%</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Meetings</span>
                              <span className="ml-2 font-medium text-black dark:text-white">{seq.meetingsBooked}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Sequence View */}
                        <AnimatePresence>
                          {expandedSequence === seq.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4"
                            >
                              <div className="space-y-4">
                                {/* Sequence Steps */}
                                <div>
                                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Sequence Steps</p>
                                  <div className="space-y-2">
                                    {seq.steps.map((step, i) => (
                                      <div key={i} className="p-3 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-zinc-500">Step {i + 1}: {step.type}</span>
                                          <button className="text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                            Edit
                                          </button>
                                        </div>
                                        {step.subject && <p className="text-sm font-medium text-black dark:text-white mb-1">{step.subject}</p>}
                                        <p className="text-xs text-zinc-500 truncate">{step.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                  {seq.status === 'active' ? (
                                    <button
                                      onClick={() => {
                                        executeAction(`pause-${seq.id}`, [
                                          { message: 'Pausing sequence in Apollo...' },
                                          { message: 'Sequence paused' },
                                        ], () => {
                                          setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, status: 'paused' } : s))
                                        })
                                      }}
                                      className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                    >
                                      Pause Sequence
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        executeAction(`resume-${seq.id}`, [
                                          { message: 'Resuming sequence in Apollo...' },
                                          { message: 'Sequence active' },
                                        ], () => {
                                          setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, status: 'active' } : s))
                                        })
                                      }}
                                      className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                    >
                                      Resume Sequence
                                    </button>
                                  )}
                                  <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                                    Generate Variant
                                  </button>
                                  <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                                    View in Apollo
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Activation Section */}
            {activeSection === 'activation' && (
              <motion.div
                key="activation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Activation Funnel */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Activation Funnel</h3>
                    <span className="text-xs text-zinc-400">Last 30 days</span>
                  </div>
                  
                  {/* Funnel Stages */}
                  <div className="space-y-2">
                    {[
                      { stage: 'Signup', value: 342, color: 'bg-zinc-900 dark:bg-white' },
                      { stage: 'First Action', value: 246, color: 'bg-zinc-700 dark:bg-zinc-300' },
                      { stage: 'Activated', value: 156, color: 'bg-zinc-500 dark:bg-zinc-500' },
                      { stage: 'Upgraded', value: 28, color: 'bg-zinc-300 dark:bg-zinc-700' },
                    ].map((item, i, arr) => {
                      const maxValue = arr[0].value
                      const percentage = Math.round((item.value / maxValue) * 100)
                      const conversionFromPrev = i > 0 ? Math.round((item.value / arr[i-1].value) * 100) : 100
                      
                      return (
                        <div key={item.stage} className="group">
                          <div className="flex items-center gap-3">
                            {/* Stage info */}
                            <div className="w-24 flex-shrink-0">
                              <p className="text-xs font-medium text-black dark:text-white">{item.stage}</p>
                              <p className="text-lg font-semibold text-black dark:text-white">{item.value.toLocaleString()}</p>
                            </div>
                            
                            {/* Bar */}
                            <div className="flex-1 relative">
                              <div className="h-10 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg overflow-hidden">
                                <motion.div
                                  className={`h-full ${item.color} rounded-lg transition-all group-hover:opacity-80`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.1 }}
                                />
                              </div>
                              {/* Percentage label inside bar */}
                              <div className="absolute inset-y-0 left-3 flex items-center">
                                <span className={`text-xs font-medium ${percentage > 30 ? 'text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                            
                            {/* Conversion rate */}
                            <div className="w-16 text-right flex-shrink-0">
                              {i > 0 && (
                                <div className="flex items-center justify-end gap-1">
                                  <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                  <span className="text-xs text-zinc-500">{conversionFromPrev}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Summary */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-zinc-500">Overall Conversion</p>
                        <p className="text-sm font-semibold text-black dark:text-white">8.2%</p>
                      </div>
                      <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                      <div>
                        <p className="text-xs text-zinc-500">Top Drop-off</p>
                        <p className="text-sm font-medium text-black dark:text-white">Activated → Upgraded</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                      View Details
                    </button>
                  </div>
                </div>

                {/* Cohort Performance */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Cohort Performance</h3>
                    <p className="text-xs text-zinc-500">Data from PostHog + Intercom</p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {cohorts.map((cohort) => {
                      const activationRate = Math.round((cohort.activated / cohort.signups) * 100)
                      const upgradeRate = Math.round((cohort.upgraded / cohort.signups) * 100)
                      
                      return (
                        <div key={cohort.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-sm font-medium text-black dark:text-white">{cohort.name}</h4>
                              <p className="text-xs text-zinc-500">{cohort.signups} signups</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-black dark:text-white">{activationRate}% activated</p>
                              <p className="text-xs text-zinc-500">{upgradeRate}% upgraded</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${activationRate}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">Drop-off: {cohort.topDropoff}</span>
                              <button
                                onClick={() => {
                                  executeAction(`rescue-${cohort.id}`, [
                                    { message: 'Identifying non-activated users...' },
                                    { message: 'Generating personalized outreach...' },
                                    { message: 'Creating Intercom campaign...' },
                                    { message: 'Rescue campaign launched' },
                                  ], () => {})
                                }}
                                className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                              >
                                Launch Rescue
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Experiments Section */}
            {activeSection === 'experiments' && (
              <motion.div
                key="experiments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-black dark:text-white">GTM Experiments</h3>
                      <p className="text-xs text-zinc-500">Track what's working across channels</p>
                    </div>
                    <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                      New Experiment
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {experiments.map((exp) => {
                      const change = exp.current - exp.baseline
                      const changePercent = Math.round((change / exp.baseline) * 100)
                      
                      return (
                        <div key={exp.id}>
                          <div
                            className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                            onClick={() => setExpandedExperiment(expandedExperiment === exp.id ? null : exp.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-black dark:text-white">{exp.name}</h4>
                                <span className={`px-1.5 py-0.5 text-xs rounded ${
                                  exp.status === 'running' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' :
                                  exp.result === 'win' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' :
                                  'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                                }`}>
                                  {exp.status === 'running' ? 'Running' : exp.result === 'win' ? 'Winner' : exp.result}
                                </span>
                              </div>
                              <span className="text-xs text-zinc-500">{exp.channel}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-2">{exp.hypothesis}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <div>
                                <span className="text-zinc-400">{exp.metric}</span>
                                <span className="ml-2 font-medium text-black dark:text-white">
                                  {exp.baseline}% → {exp.current}%
                                </span>
                                <span className={`ml-2 ${changePercent > 0 ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'}`}>
                                  ({changePercent > 0 ? '+' : ''}{changePercent}%)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Experiment View */}
                          <AnimatePresence>
                            {expandedExperiment === exp.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4"
                              >
                                <div className="space-y-4">
                                  {/* Results */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                                      <p className="text-xs text-zinc-500 mb-1">Baseline</p>
                                      <p className="text-lg font-medium text-black dark:text-white">{exp.baseline}%</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                                      <p className="text-xs text-zinc-500 mb-1">Current</p>
                                      <p className="text-lg font-medium text-black dark:text-white">{exp.current}%</p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                                      <p className="text-xs text-zinc-500 mb-1">Lift</p>
                                      <p className="text-lg font-medium text-black dark:text-white">
                                        {changePercent > 0 ? '+' : ''}{changePercent}%
                                      </p>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    {exp.status === 'running' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, status: 'completed', result: 'win' } : e))
                                            setExpandedExperiment(null)
                                          }}
                                          className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                        >
                                          Mark as Winner
                                        </button>
                                        <button
                                          onClick={() => {
                                            setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, status: 'completed', result: 'lose' } : e))
                                            setExpandedExperiment(null)
                                          }}
                                          className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                        >
                                          Mark as Loss
                                        </button>
                                      </>
                                    )}
                                    {exp.result === 'win' && (
                                      <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                                        Scale This
                                      </button>
                                    )}
                                    <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                                      Document Learnings
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Support Insights Section */}
            {activeSection === 'support' && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Support Themes</h3>
                    <p className="text-xs text-zinc-500">Patterns from Zendesk + Intercom</p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {themes.map((theme) => (
                      <div key={theme.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-black dark:text-white">{theme.theme}</h4>
                            <p className="text-xs text-zinc-500">{theme.ticketCount} tickets this month</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-500">Sentiment</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i <= Math.round(theme.avgSentiment * 5) ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {theme.topPhrases.map((phrase, i) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded">
                              "{phrase}"
                            </span>
                          ))}
                        </div>
                        {theme.suggestedAction && (
                          <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              Suggested: {theme.suggestedAction}
                            </span>
                            <button className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                              Create Task
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Command Palette */}
        <AnimatePresence>
          {showCommandPalette && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-32 z-50"
              onClick={() => setShowCommandPalette(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(commandInput)}
                    placeholder="Type a command... (e.g., 'draft email for selected deals')"
                    className="flex-1 bg-transparent text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  <p className="px-2 py-1 text-xs text-zinc-400">Quick actions</p>
                  {[
                    { label: 'Draft follow-up emails for at-risk deals', action: 'draft-atrisk' },
                    { label: 'Create tasks for stale deals', action: 'tasks-stale' },
                    { label: 'Pause underperforming sequences', action: 'pause-low' },
                    { label: 'Launch rescue campaign for non-activated users', action: 'rescue-all' },
                    { label: 'Generate ICP messaging variants', action: 'icp-messaging' },
                  ].map((cmd) => (
                    <button
                      key={cmd.action}
                      onClick={() => handleCommand(cmd.label)}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Execution Overlay */}
        <AnimatePresence>
          {executingAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6"
              >
                <div className="space-y-3">
                  {executionSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      {step.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                      )}
                      {step.status === 'running' && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 rounded-full border-2 border-zinc-900 dark:border-white border-t-transparent"
                        />
                      )}
                      {step.status === 'complete' && (
                        <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center">
                          <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <span className={`text-sm ${
                        step.status === 'complete' ? 'text-zinc-500' :
                        step.status === 'running' ? 'text-black dark:text-white' : 'text-zinc-400'
                      }`}>
                        {step.message}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageBackground>
    </AppLayout>
  )
}
