'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'

// Types
interface Lead {
  id: string
  name: string
  company: string
  title: string
  email: string
  stage: 'cold' | 'contacted' | 'replied' | 'call-scheduled' | 'demo' | 'negotiating' | 'won' | 'lost'
  source: string
  lastTouch: string
  nextAction?: string
  value?: number
  notes?: string
}

interface Channel {
  id: string
  name: string
  icon: string
  leads: number
  conversion: number
  cac: number
  status: 'active' | 'paused' | 'testing'
}

interface OutreachTemplate {
  id: string
  name: string
  type: 'email' | 'linkedin' | 'twitter'
  subject?: string
  content: string
  useCount: number
}

interface Experiment {
  id: string
  name: string
  hypothesis: string
  channel: string
  status: 'running' | 'completed' | 'paused'
  result?: 'success' | 'failure' | 'inconclusive'
  metric: string
  startDate: string
}

// Mock Data
const mockLeads: Lead[] = [
  { id: 'l1', name: 'Sarah Chen', company: 'TechVentures', title: 'Head of Product', email: 'sarah@techventures.com', stage: 'demo', source: 'LinkedIn', lastTouch: '2026-01-23', nextAction: 'Send proposal', value: 12000 },
  { id: 'l2', name: 'Mike Rodriguez', company: 'StartupCo', title: 'CEO', email: 'mike@startupco.io', stage: 'call-scheduled', source: 'Cold Email', lastTouch: '2026-01-24', nextAction: 'Call at 3pm today', value: 8000 },
  { id: 'l3', name: 'Emily Watson', company: 'GrowthLabs', title: 'COO', email: 'emily@growthlabs.com', stage: 'replied', source: 'Referral', lastTouch: '2026-01-22', nextAction: 'Schedule intro call' },
  { id: 'l4', name: 'David Kim', company: 'InnovateTech', title: 'Founder', email: 'david@innovatetech.co', stage: 'contacted', source: 'LinkedIn', lastTouch: '2026-01-20', nextAction: 'Follow up' },
  { id: 'l5', name: 'Lisa Park', company: 'ScaleUp Inc', title: 'VP Operations', email: 'lisa@scaleup.io', stage: 'cold', source: 'Conference', lastTouch: '2026-01-18' },
  { id: 'l6', name: 'James Wilson', company: 'FutureFund', title: 'Partner', email: 'james@futurefund.vc', stage: 'negotiating', source: 'Intro', lastTouch: '2026-01-24', nextAction: 'Review terms', value: 25000 },
  { id: 'l7', name: 'Anna Martinez', company: 'CloudFirst', title: 'CTO', email: 'anna@cloudfirst.dev', stage: 'won', source: 'Content', lastTouch: '2026-01-15', value: 15000 },
  { id: 'l8', name: 'Tom Brown', company: 'DataDriven', title: 'Head of Growth', email: 'tom@datadriven.ai', stage: 'lost', source: 'LinkedIn', lastTouch: '2026-01-10', notes: 'Budget constraints' },
]

const mockChannels: Channel[] = [
  { id: 'ch1', name: 'LinkedIn Outreach', icon: '💼', leads: 23, conversion: 12, cac: 45, status: 'active' },
  { id: 'ch2', name: 'Cold Email', icon: '📧', leads: 18, conversion: 8, cac: 32, status: 'active' },
  { id: 'ch3', name: 'Content/SEO', icon: '📝', leads: 12, conversion: 22, cac: 18, status: 'active' },
  { id: 'ch4', name: 'Referrals', icon: '🤝', leads: 8, conversion: 45, cac: 0, status: 'active' },
  { id: 'ch5', name: 'Paid Ads', icon: '📢', leads: 5, conversion: 6, cac: 120, status: 'paused' },
  { id: 'ch6', name: 'Twitter/X', icon: '🐦', leads: 3, conversion: 15, cac: 25, status: 'testing' },
]

const mockTemplates: OutreachTemplate[] = [
  { id: 't1', name: 'Cold Intro - Problem Aware', type: 'email', subject: 'Quick question about [pain point]', content: 'Hi {name},\n\nI noticed {company} is scaling fast. Most teams at your stage struggle with [pain point].\n\nWe help companies like yours [benefit]. Would you be open to a quick 15-min chat?\n\nBest,\n{sender}', useCount: 45 },
  { id: 't2', name: 'LinkedIn Connection Request', type: 'linkedin', content: 'Hi {name} - I see you\'re leading {role} at {company}. I work with similar companies on [problem]. Would love to connect and share some ideas.', useCount: 120 },
  { id: 't3', name: 'Follow-up After No Reply', type: 'email', subject: 'Re: Quick question', content: 'Hi {name},\n\nJust floating this back to the top of your inbox. I know you\'re busy.\n\nWould next Tuesday or Thursday work for a brief call?\n\nBest,\n{sender}', useCount: 32 },
  { id: 't4', name: 'Post-Demo Follow Up', type: 'email', subject: 'Next steps from our call', content: 'Hi {name},\n\nGreat chatting today! As discussed:\n\n- [Key point 1]\n- [Key point 2]\n- [Key point 3]\n\nI\'ll send over the proposal by EOD. Any questions, just reply here.\n\nBest,\n{sender}', useCount: 18 },
]

const mockExperiments: Experiment[] = [
  { id: 'e1', name: 'Pain-focused subject lines', hypothesis: 'Subject lines that mention specific pain points will increase open rates', channel: 'Cold Email', status: 'running', metric: 'Open rate: 32% → ?', startDate: '2026-01-15' },
  { id: 'e2', name: 'Video in LinkedIn DMs', hypothesis: 'Personalized Loom videos in LinkedIn messages will increase reply rates', channel: 'LinkedIn', status: 'completed', result: 'success', metric: 'Reply rate: 8% → 18%', startDate: '2026-01-01' },
  { id: 'e3', name: 'SEO long-form content', hypothesis: 'Publishing in-depth guides will generate more organic leads', channel: 'Content', status: 'running', metric: 'Organic leads: 5/mo → ?', startDate: '2026-01-10' },
]

// Helper Components
const stageColors: Record<Lead['stage'], string> = {
  'cold': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  'contacted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'replied': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'call-scheduled': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'demo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'negotiating': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'won': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'lost': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const stageLabels: Record<Lead['stage'], string> = {
  'cold': 'Cold',
  'contacted': 'Contacted',
  'replied': 'Replied',
  'call-scheduled': 'Call Scheduled',
  'demo': 'Demo',
  'negotiating': 'Negotiating',
  'won': 'Won',
  'lost': 'Lost',
}

function StageBadge({ stage }: { stage: Lead['stage'] }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${stageColors[stage]}`}>
      {stageLabels[stage]}
    </span>
  )
}

function getDaysAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days ago`
}

export default function GTMPage() {
  const [selectedStage, setSelectedStage] = useState<Lead['stage'] | 'all'>('all')
  const [showAddLead, setShowAddLead] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Pipeline stats
  const pipelineStages = ['cold', 'contacted', 'replied', 'call-scheduled', 'demo', 'negotiating'] as const
  const activeLeads = mockLeads.filter(l => !['won', 'lost'].includes(l.stage))
  const wonLeads = mockLeads.filter(l => l.stage === 'won')
  const todayActions = mockLeads.filter(l => l.nextAction && l.stage !== 'won' && l.stage !== 'lost')
  const pipelineValue = activeLeads.reduce((acc, l) => acc + (l.value || 0), 0)
  const wonValue = wonLeads.reduce((acc, l) => acc + (l.value || 0), 0)

  // Filter leads
  const filteredLeads = selectedStage === 'all' 
    ? mockLeads 
    : mockLeads.filter(l => l.stage === selectedStage)

  const handleAiQuery = async (query: string) => {
    setAiLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    
    if (query === 'suggestions') {
      setAiResponse(
        `**This Week's Focus:**\n\n` +
        `1. **Follow up with Emily Watson** (GrowthLabs) - She replied 2 days ago. Strike while hot.\n\n` +
        `2. **Prepare for Mike's call** at 3pm - Review his company's recent funding news.\n\n` +
        `3. **Re-engage cold leads** - 3 leads haven't been touched in 5+ days. Consider a different angle.\n\n` +
        `**Channel Insight:**\n` +
        `Referrals have 45% conversion vs 8% for cold email. Ask your won customers for intros.`
      )
    } else if (query === 'bottleneck') {
      setAiResponse(
        `**Biggest Drop-off:** Contacted → Replied (only 35% reply rate)\n\n` +
        `**Possible Causes:**\n` +
        `• Subject lines may not be compelling enough\n` +
        `• Sending at wrong times (most opens happen 8-10am)\n` +
        `• Message too long or too salesy\n\n` +
        `**Experiment Idea:**\n` +
        `Try shorter, curiosity-driven subject lines. Your "Pain-focused" experiment is testing this.`
      )
    }
    setAiLoading(false)
  }

  return (
    <AppLayout>
      <PageBackground>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between"
          >
            <div>
              <h1 className="text-xl font-semibold text-black dark:text-white">Go-To-Market</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Track leads, run outreach, close deals
              </p>
            </div>
            <button
              onClick={() => setShowAddLead(true)}
              className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              + Add Lead
            </button>
          </motion.div>

          {/* Pipeline Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-black dark:text-white">Pipeline Overview</h2>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-zinc-500">Pipeline Value:</span>
                  <span className="ml-1 font-semibold text-black dark:text-white">${pipelineValue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Won (MTD):</span>
                  <span className="ml-1 font-semibold text-green-600 dark:text-green-400">${wonValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="flex items-center gap-2">
              {pipelineStages.map((stage, idx) => {
                const count = mockLeads.filter(l => l.stage === stage).length
                const maxCount = Math.max(...pipelineStages.map(s => mockLeads.filter(l => l.stage === s).length))
                const width = maxCount > 0 ? Math.max(20, (count / maxCount) * 100) : 20
                return (
                  <div key={stage} className="flex-1">
                    <div className="text-center mb-1">
                      <span className="text-lg font-semibold text-black dark:text-white">{count}</span>
                    </div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`h-2 rounded-full ${
                        stage === 'cold' ? 'bg-zinc-300 dark:bg-zinc-600' :
                        stage === 'contacted' ? 'bg-blue-400' :
                        stage === 'replied' ? 'bg-purple-400' :
                        stage === 'call-scheduled' ? 'bg-yellow-400' :
                        stage === 'demo' ? 'bg-orange-400' :
                        'bg-pink-400'
                      }`}
                      style={{ width: `${width}%`, margin: '0 auto' }}
                    />
                    <p className="text-xs text-zinc-500 text-center mt-1">{stageLabels[stage]}</p>
                  </div>
                )
              })}
              <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-700 mx-2" />
              <div className="text-center">
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">{wonLeads.length}</span>
                <div className="h-2 w-12 rounded-full bg-green-400 mx-auto" />
                <p className="text-xs text-zinc-500 mt-1">Won</p>
              </div>
            </div>

            {/* Today's Actions */}
            {todayActions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">📌 Today's Actions</p>
                <div className="flex flex-wrap gap-2">
                  {todayActions.slice(0, 4).map(lead => (
                    <div key={lead.id} className="flex items-center gap-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      <span className="text-xs font-medium text-black dark:text-white">{lead.name}</span>
                      <span className="text-xs text-zinc-500">→ {lead.nextAction}</span>
                    </div>
                  ))}
                  {todayActions.length > 4 && (
                    <span className="text-xs text-zinc-500 px-2 py-1">+{todayActions.length - 4} more</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Leads */}
            <div className="col-span-2 space-y-6">
              {/* Lead List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-black dark:text-white">Leads</h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedStage('all')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedStage === 'all' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      All
                    </button>
                    {(['contacted', 'replied', 'demo', 'negotiating'] as const).map(stage => (
                      <button
                        key={stage}
                        onClick={() => setSelectedStage(stage)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedStage === stage ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {stageLabels[stage]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredLeads.map((lead, idx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-medium">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-black dark:text-white">{lead.name}</p>
                              <StageBadge stage={lead.stage} />
                            </div>
                            <p className="text-xs text-zinc-500">{lead.title} at {lead.company}</p>
                            {lead.nextAction && lead.stage !== 'won' && lead.stage !== 'lost' && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                <span>→</span> {lead.nextAction}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-400">{getDaysAgo(lead.lastTouch)}</p>
                          {lead.value && (
                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-1">
                              ${lead.value.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-zinc-400 mt-1">{lead.source}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Channel Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="text-sm font-semibold text-black dark:text-white">Channel Performance</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Channel</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Leads</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Conv %</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">CAC</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {mockChannels.map(channel => (
                        <tr key={channel.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{channel.icon}</span>
                              <span className="text-sm text-black dark:text-white">{channel.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-black dark:text-white">{channel.leads}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm ${channel.conversion >= 20 ? 'text-green-600 dark:text-green-400' : channel.conversion >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                              {channel.conversion}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                            {channel.cac === 0 ? 'Free' : `$${channel.cac}`}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              channel.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              channel.status === 'testing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {channel.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Experiments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-black dark:text-white">Experiments</h2>
                  <button className="text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                    + New Experiment
                  </button>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {mockExperiments.map(exp => (
                    <div key={exp.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-black dark:text-white">{exp.name}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              exp.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              exp.status === 'completed' && exp.result === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {exp.status === 'completed' ? `✓ ${exp.result}` : exp.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">{exp.hypothesis}</p>
                        </div>
                        <span className="text-xs text-zinc-400">{exp.channel}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-zinc-500">📊 {exp.metric}</span>
                        <span className="text-zinc-400">Started {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Outreach Templates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                    <span>📝</span> Outreach Templates
                  </h2>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {showTemplates ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {mockTemplates.map(template => (
                    <div key={template.id}>
                      <button
                        onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                        className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{template.type === 'email' ? '📧' : template.type === 'linkedin' ? '💼' : '🐦'}</span>
                            <span className="text-sm font-medium text-black dark:text-white">{template.name}</span>
                          </div>
                          <span className="text-xs text-zinc-400">{template.useCount} uses</span>
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedTemplate === template.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                          >
                            {template.subject && (
                              <p className="text-xs text-zinc-500 mb-2">
                                <span className="font-medium">Subject:</span> {template.subject}
                              </p>
                            )}
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{template.content}</p>
                            <button className="mt-2 text-xs text-orange-600 dark:text-orange-400 hover:underline">
                              Copy template
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI GTM Assistant */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl border border-orange-200 dark:border-orange-800"
              >
                <div className="px-4 py-3 border-b border-orange-200 dark:border-orange-800 flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-orange-500"
                  />
                  <h2 className="text-sm font-semibold text-black dark:text-white">GTM Assistant</h2>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => handleAiQuery('suggestions')}
                    disabled={aiLoading}
                    className="w-full text-left p-3 bg-white dark:bg-zinc-900 rounded-lg border border-orange-200 dark:border-orange-700 hover:border-orange-400 transition-colors text-xs"
                  >
                    <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <span>🎯</span> What should I focus on today?
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleAiQuery('bottleneck')}
                    disabled={aiLoading}
                    className="w-full text-left p-3 bg-white dark:bg-zinc-900 rounded-lg border border-orange-200 dark:border-orange-700 hover:border-orange-400 transition-colors text-xs"
                  >
                    <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <span>📉</span> Where's my biggest bottleneck?
                    </span>
                  </button>

                  <AnimatePresence>
                    {aiLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 p-3"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"
                        />
                        <span className="text-xs text-zinc-500">Analyzing your pipeline...</span>
                      </motion.div>
                    )}
                    {aiResponse && !aiLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-orange-200 dark:border-orange-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">AI Suggestions</span>
                          <button onClick={() => setAiResponse(null)} className="text-zinc-400 hover:text-zinc-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                          {aiResponse.split('\n').map((line, i) => {
                            if (line.startsWith('**') && line.includes(':**')) {
                              const parts = line.split(':**')
                              return <p key={i} className="mt-2 first:mt-0"><strong>{parts[0].replace(/\*\*/g, '')}:</strong>{parts[1]}</p>
                            }
                            if (line.startsWith('**')) {
                              return <p key={i} className="font-semibold mt-2 first:mt-0">{line.replace(/\*\*/g, '')}</p>
                            }
                            return <p key={i}>{line}</p>
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <h2 className="text-sm font-semibold text-black dark:text-white mb-3">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Leads this month</span>
                    <span className="text-sm font-medium text-black dark:text-white">{mockLeads.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Active conversations</span>
                    <span className="text-sm font-medium text-black dark:text-white">{activeLeads.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Win rate</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {Math.round((wonLeads.length / (wonLeads.length + mockLeads.filter(l => l.stage === 'lost').length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Avg deal size</span>
                    <span className="text-sm font-medium text-black dark:text-white">
                      ${Math.round(pipelineValue / (activeLeads.filter(l => l.value).length || 1)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Add Lead Modal */}
        <AnimatePresence>
          {showAddLead && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddLead(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-black dark:text-white">Add New Lead</h2>
                  <button onClick={() => setShowAddLead(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name *</label>
                    <input type="text" placeholder="John Doe" className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Company *</label>
                      <input type="text" placeholder="Acme Inc" className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                      <input type="text" placeholder="CEO" className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                    <input type="email" placeholder="john@acme.com" className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Source</label>
                    <select className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                      <option>LinkedIn</option>
                      <option>Cold Email</option>
                      <option>Referral</option>
                      <option>Content</option>
                      <option>Conference</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Notes</label>
                    <textarea placeholder="How did you meet? Any context?" className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white h-20 resize-none" />
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                  <button onClick={() => setShowAddLead(false)} className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                    Add Lead
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageBackground>
    </AppLayout>
  )
}
