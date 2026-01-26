'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'

// Types
interface Product {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'archived'
  color: string
  metrics: {
    feedbackCount: number
    activeTests: number
    nps?: number
    lastActivity: string
  }
}

interface Feedback {
  id: string
  type: 'feature_request' | 'bug' | 'praise' | 'complaint'
  content: string
  source: string
  votes: number
  status: 'new' | 'reviewing' | 'planned' | 'shipped' | 'declined'
  createdAt: string
}

interface Insight {
  id: string
  title: string
  summary: string
  confidence: number
  sources: number
  tags: string[]
  createdAt: string
}

interface Test {
  id: string
  name: string
  type: 'ab_test' | 'feature_flag' | 'survey' | 'interview_batch'
  status: 'draft' | 'running' | 'paused' | 'complete'
  metric?: string
  variants?: { name: string; traffic: number; conversion?: number }[]
  responses?: number
  startDate?: string
  endDate?: string
}

interface Metric {
  id: string
  name: string
  value: number
  unit: string
  trend: number
  period: string
}

interface Interview {
  id: string
  name: string
  role: string
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled'
  date: string
  time?: string
  notes?: string
  keyQuotes?: string[]
  tags?: string[]
}

// Mock Data
const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Investor Updates',
    description: 'AI-powered investor update generator',
    status: 'active',
    color: 'orange',
    metrics: { feedbackCount: 24, activeTests: 2, nps: 42, lastActivity: '2 hours ago' }
  },
  {
    id: 'p2',
    name: 'Team Dashboard',
    description: 'Unified team & equity management',
    status: 'active',
    color: 'blue',
    metrics: { feedbackCount: 18, activeTests: 1, nps: 38, lastActivity: '1 day ago' }
  },
  {
    id: 'p3',
    name: 'Network CRM',
    description: 'Contact & relationship tracking',
    status: 'paused',
    color: 'green',
    metrics: { feedbackCount: 7, activeTests: 0, lastActivity: '1 week ago' }
  }
]

const mockFeedback: Record<string, Feedback[]> = {
  p1: [
    { id: 'f1', type: 'feature_request', content: 'Add ability to schedule updates in advance', source: 'Sarah Chen', votes: 12, status: 'planned', createdAt: '2025-01-23' },
    { id: 'f2', type: 'feature_request', content: 'Integration with Notion for pulling metrics', source: 'Marcus R.', votes: 8, status: 'reviewing', createdAt: '2025-01-22' },
    { id: 'f3', type: 'praise', content: 'Saved me 3 hours this week on updates alone', source: 'David P.', votes: 5, status: 'shipped', createdAt: '2025-01-21' },
    { id: 'f4', type: 'bug', content: 'PDF export cuts off long paragraphs', source: 'James K.', votes: 3, status: 'new', createdAt: '2025-01-20' },
    { id: 'f5', type: 'complaint', content: 'AI tone is too formal for my style', source: 'Alex R.', votes: 2, status: 'reviewing', createdAt: '2025-01-19' },
  ],
  p2: [
    { id: 'f6', type: 'feature_request', content: 'Vesting calculator with cliff dates', source: 'Maria L.', votes: 15, status: 'planned', createdAt: '2025-01-22' },
    { id: 'f7', type: 'feature_request', content: 'Export cap table to PDF', source: 'Chris T.', votes: 6, status: 'new', createdAt: '2025-01-21' },
  ],
  p3: []
}

const mockInsights: Record<string, Insight[]> = {
  p1: [
    { id: 'i1', title: 'Scheduling is the #1 requested feature', summary: '12 of 24 feedback items mention scheduling or automation', confidence: 85, sources: 12, tags: ['scheduling', 'automation'], createdAt: '2025-01-24' },
    { id: 'i2', title: 'Integration requests cluster around Notion', summary: 'Founders heavily use Notion for metrics, want direct sync', confidence: 72, sources: 6, tags: ['integrations', 'notion'], createdAt: '2025-01-23' },
    { id: 'i3', title: 'Tone customization is a retention risk', summary: '3 users mentioned considering alternatives due to AI tone', confidence: 65, sources: 3, tags: ['ai', 'churn'], createdAt: '2025-01-22' },
  ],
  p2: [
    { id: 'i4', title: 'Equity management confuses first-time founders', summary: 'New founders struggle with vesting concepts', confidence: 78, sources: 8, tags: ['ux', 'education'], createdAt: '2025-01-23' },
  ],
  p3: []
}

const mockTests: Record<string, Test[]> = {
  p1: [
    { id: 't1', name: 'Casual vs Professional Tone', type: 'ab_test', status: 'running', metric: 'User satisfaction', variants: [{ name: 'Professional', traffic: 50, conversion: 68 }, { name: 'Casual', traffic: 50, conversion: 74 }], startDate: '2025-01-20' },
    { id: 't2', name: 'Scheduling Feature Beta', type: 'feature_flag', status: 'running', metric: 'Adoption rate', variants: [{ name: 'Enabled', traffic: 20 }], startDate: '2025-01-22' },
    { id: 't3', name: 'Post-Update NPS', type: 'survey', status: 'complete', responses: 45, startDate: '2025-01-15', endDate: '2025-01-22' },
  ],
  p2: [
    { id: 't4', name: 'Onboarding Flow v2', type: 'ab_test', status: 'draft', metric: 'Completion rate', variants: [{ name: 'Current', traffic: 50 }, { name: 'Simplified', traffic: 50 }] },
  ],
  p3: []
}

const mockMetrics: Record<string, Metric[]> = {
  p1: [
    { id: 'm1', name: 'Weekly Active', value: 127, unit: '', trend: 12, period: 'vs last week' },
    { id: 'm2', name: 'Updates Sent', value: 89, unit: '', trend: 8, period: 'this week' },
    { id: 'm3', name: 'Time Saved', value: 2.4, unit: 'hrs', trend: 15, period: 'per user' },
    { id: 'm4', name: 'NPS', value: 42, unit: '', trend: 5, period: 'vs last month' },
  ],
  p2: [
    { id: 'm5', name: 'Teams', value: 34, unit: '', trend: 6, period: 'this month' },
    { id: 'm6', name: 'Entries', value: 156, unit: '', trend: 22, period: 'total' },
  ],
  p3: []
}

const mockInterviews: Record<string, Interview[]> = {
  p1: [
    { id: 'int1', name: 'Sarah Chen', role: 'Series A Founder', status: 'completed', date: '2025-01-22', time: '10:00 AM', notes: 'Heavy user of investor updates. Main pain point is scheduling updates in advance.', keyQuotes: ['I spend 2 hours every week just copying metrics into the template', 'If I could schedule updates like email campaigns, that would be game-changing'], tags: ['power-user', 'scheduling'] },
    { id: 'int2', name: 'Marcus Rivera', role: 'Pre-seed Founder', status: 'completed', date: '2025-01-21', time: '2:00 PM', notes: 'New to investor updates. Wants more guidance on what to include.', keyQuotes: ['I never know what metrics my investors actually care about'], tags: ['new-user', 'education'] },
    { id: 'int3', name: 'Emily Watson', role: 'Seed Founder', status: 'scheduled', date: '2025-01-28', time: '11:00 AM', tags: ['expansion'] },
    { id: 'int4', name: 'James Park', role: 'Series A Founder', status: 'scheduled', date: '2025-01-29', time: '3:30 PM', tags: ['enterprise'] },
    { id: 'int5', name: 'Lisa Thompson', role: 'Pre-seed Founder', status: 'no_show', date: '2025-01-20', time: '4:00 PM', tags: ['churned'] },
  ],
  p2: [
    { id: 'int6', name: 'David Kim', role: 'First-time Founder', status: 'completed', date: '2025-01-23', time: '9:00 AM', notes: 'Confused by equity terminology. Wants calculator tool.', keyQuotes: ['What even is a cliff? I had to Google everything'], tags: ['new-user', 'education'] },
    { id: 'int7', name: 'Rachel Green', role: 'Technical Founder', status: 'scheduled', date: '2025-01-30', time: '1:00 PM', tags: ['technical'] },
  ],
  p3: []
}

// Helper Components
function FeedbackTypeBadge({ type }: { type: Feedback['type'] }) {
  const styles = {
    feature_request: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    bug: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    praise: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    complaint: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
  }
  const labels = { feature_request: 'Feature', bug: 'Bug', praise: 'Praise', complaint: 'Complaint' }
  return <span className={`px-1.5 py-0.5 text-xs rounded ${styles[type]}`}>{labels[type]}</span>
}

function StatusBadge({ status }: { status: Feedback['status'] }) {
  const styles = {
    new: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    reviewing: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    planned: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
    shipped: 'bg-black dark:bg-white text-white dark:text-black',
    declined: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
  }
  return <span className={`px-1.5 py-0.5 text-xs rounded capitalize ${styles[status]}`}>{status}</span>
}

function TestStatusBadge({ status }: { status: Test['status'] }) {
  const styles = {
    draft: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    running: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    paused: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
    complete: 'bg-black dark:bg-white text-white dark:text-black',
  }
  return <span className={`px-1.5 py-0.5 text-xs rounded capitalize ${styles[status]}`}>{status}</span>
}

function TestTypeBadge({ type }: { type: Test['type'] }) {
  const labels = { ab_test: 'A/B', feature_flag: 'Flag', survey: 'Survey', interview_batch: 'Interviews' }
  return <span className="px-1.5 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{labels[type]}</span>
}

function InterviewStatusBadge({ status }: { status: Interview['status'] }) {
  const styles = {
    scheduled: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    completed: 'bg-black dark:bg-white text-white dark:text-black',
    no_show: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
    cancelled: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
  }
  const labels = { scheduled: 'Scheduled', completed: 'Completed', no_show: 'No Show', cancelled: 'Cancelled' }
  return <span className={`px-1.5 py-0.5 text-xs rounded ${styles[status]}`}>{labels[status]}</span>
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${confidence >= 50 ? 'bg-black dark:bg-white' : 'bg-zinc-400 dark:bg-zinc-600'}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 w-7">{confidence}%</span>
    </div>
  )
}

// Add Product Modal
function AddProductModal({ onClose, onSave }: { onClose: () => void; onSave: (product: Partial<Product>) => void }) {
  const [formData, setFormData] = useState({ name: '', description: '' })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black dark:text-white">New Product</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mobile App"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => formData.name && onSave(formData)}
            disabled={!formData.name}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Product Workspace Panel
function ProductWorkspace({ product }: { product: Product }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'insights' | 'tests' | 'discovery'>('overview')

  const feedback = mockFeedback[product.id] || []
  const insights = mockInsights[product.id] || []
  const tests = mockTests[product.id] || []
  const metrics = mockMetrics[product.id] || []
  const interviews = mockInterviews[product.id] || []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'feedback', label: 'Feedback', count: feedback.length },
    { id: 'insights', label: 'Insights', count: insights.length },
    { id: 'tests', label: 'Tests', count: tests.filter(t => t.status === 'running').length },
    { id: 'discovery', label: 'Discovery', count: interviews.filter(i => i.status === 'scheduled').length },
  ] as const

  return (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 flex-shrink-0">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-black dark:text-white">{product.name}</h2>
          <p className="text-xs text-zinc-500">{product.description}</p>
        </div>
        {product.status === 'paused' && (
          <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Paused</span>
        )}
      </div>

      {/* Tabs */}
      <div className="px-5 border-b border-zinc-200 dark:border-zinc-800 flex gap-1 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <motion.div layoutId="activeProductTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3">
                {metrics.map((m) => (
                  <div key={m.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">{m.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-black dark:text-white">{m.value}</span>
                      {m.unit && <span className="text-xs text-zinc-500">{m.unit}</span>}
                    </div>
                    <div className="text-xs mt-1 text-zinc-500">
                      {m.trend >= 0 ? '+' : ''}{m.trend}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Top Requests */}
                <div>
                  <h3 className="text-sm font-medium text-black dark:text-white mb-3">Top Requests</h3>
                  <div className="space-y-2">
                    {feedback.filter(f => f.type === 'feature_request').slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">{item.votes}</span>
                        <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">{item.content}</span>
                        <StatusBadge status={item.status} />
                      </div>
                    ))}
                    {feedback.filter(f => f.type === 'feature_request').length === 0 && <p className="text-xs text-zinc-500">No requests yet</p>}
                  </div>
                </div>

                {/* Active Tests */}
                <div>
                  <h3 className="text-sm font-medium text-black dark:text-white mb-3">Active Tests</h3>
                  <div className="space-y-2">
                    {tests.filter(t => t.status === 'running').map((test) => (
                      <div key={test.id} className="flex items-center gap-2 text-sm">
                        <TestTypeBadge type={test.type} />
                        <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">{test.name}</span>
                        {test.variants && test.variants.length === 2 && test.variants[0].conversion && (
                          <span className="text-xs text-zinc-500">{test.variants[0].conversion}% vs {test.variants[1].conversion}%</span>
                        )}
                      </div>
                    ))}
                    {tests.filter(t => t.status === 'running').length === 0 && <p className="text-xs text-zinc-500">No active tests</p>}
                  </div>
                </div>
              </div>

              {/* Recent Insights */}
              <div>
                <h3 className="text-sm font-medium text-black dark:text-white mb-3">Recent Insights</h3>
                <div className="space-y-2">
                  {insights.slice(0, 2).map((insight) => (
                    <div key={insight.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-black dark:text-white">{insight.title}</h4>
                        <p className="text-xs text-zinc-500 mt-1">{insight.summary}</p>
                      </div>
                      <div className="w-20"><ConfidenceBar confidence={insight.confidence} /></div>
                    </div>
                  ))}
                  {insights.length === 0 && <p className="text-xs text-zinc-500">No insights yet</p>}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {['All', 'Features', 'Bugs', 'Praise'].map((f) => (
                    <button key={f} className="px-2 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">{f}</button>
                  ))}
                </div>
                <button className="px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg">+ Add</button>
              </div>
              <div className="space-y-2">
                {feedback.map((item) => (
                  <div key={item.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-600 dark:text-zinc-400">{item.votes}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FeedbackTypeBadge type={item.type} />
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-black dark:text-white">{item.content}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                          <span>{item.source}</span>
                          <span>·</span>
                          <span>{item.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {feedback.length === 0 && (
                  <div className="text-center py-8 text-sm text-zinc-500">No feedback yet</div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">Auto-generated from feedback patterns</p>
                <button className="px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg">+ Add</button>
              </div>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-black dark:text-white mb-1">{insight.title}</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{insight.summary}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {insight.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-24 mb-1"><ConfidenceBar confidence={insight.confidence} /></div>
                        <span className="text-xs text-zinc-500">{insight.sources} sources</span>
                      </div>
                    </div>
                  </div>
                ))}
                {insights.length === 0 && <div className="text-center py-8 text-sm text-zinc-500">No insights yet</div>}
              </div>
            </motion.div>
          )}

          {activeTab === 'tests' && (
            <motion.div key="tests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {['All', 'Running', 'Draft', 'Complete'].map((f) => (
                    <button key={f} className="px-2 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">{f}</button>
                  ))}
                </div>
                <button className="px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg">+ New Test</button>
              </div>
              <div className="space-y-3">
                {tests.map((test) => (
                  <div key={test.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TestTypeBadge type={test.type} />
                          <TestStatusBadge status={test.status} />
                        </div>
                        <h4 className="text-sm font-medium text-black dark:text-white">{test.name}</h4>
                        {test.metric && <p className="text-xs text-zinc-500 mt-1">Measuring: {test.metric}</p>}
                        {test.type === 'ab_test' && test.variants && test.status === 'running' && (
                          <div className="mt-3 space-y-1.5">
                            {test.variants.map((v) => (
                              <div key={v.name} className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 w-20">{v.name}</span>
                                <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${v.conversion || 0}%` }} />
                                </div>
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 w-8">{v.conversion || 0}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {test.type === 'survey' && test.responses !== undefined && (
                          <p className="text-xs text-zinc-500 mt-2">{test.responses} responses</p>
                        )}
                        {test.type === 'feature_flag' && test.variants && (
                          <p className="text-xs text-zinc-500 mt-2">{test.variants[0].traffic}% rollout</p>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 text-right">
                        {test.startDate && <div>{test.startDate}</div>}
                      </div>
                    </div>
                  </div>
                ))}
                {tests.length === 0 && <div className="text-center py-8 text-sm text-zinc-500">No tests yet</div>}
              </div>
            </motion.div>
          )}

          {activeTab === 'discovery' && (
            <motion.div key="discovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Discovery Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Total Interviews</div>
                  <div className="text-xl font-semibold text-black dark:text-white">{interviews.length}</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Completed</div>
                  <div className="text-xl font-semibold text-black dark:text-white">{interviews.filter(i => i.status === 'completed').length}</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Scheduled</div>
                  <div className="text-xl font-semibold text-black dark:text-white">{interviews.filter(i => i.status === 'scheduled').length}</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Key Quotes</div>
                  <div className="text-xl font-semibold text-black dark:text-white">{interviews.reduce((acc, i) => acc + (i.keyQuotes?.length || 0), 0)}</div>
                </div>
              </div>

              {/* Interview Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {['All', 'Scheduled', 'Completed', 'No Show'].map((f) => (
                    <button key={f} className="px-2 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">{f}</button>
                  ))}
                </div>
                <button className="px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg">+ Schedule Interview</button>
              </div>

              {/* Interview List */}
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <div key={interview.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-600 dark:text-zinc-400 flex-shrink-0">
                        {interview.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-black dark:text-white">{interview.name}</span>
                          <InterviewStatusBadge status={interview.status} />
                        </div>
                        <div className="text-xs text-zinc-500 mb-2">{interview.role}</div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {interview.date}
                          </span>
                          {interview.time && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {interview.time}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {interview.notes && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{interview.notes}</p>
                        )}

                        {/* Key Quotes */}
                        {interview.keyQuotes && interview.keyQuotes.length > 0 && (
                          <div className="space-y-1.5 mb-2">
                            {interview.keyQuotes.map((quote, idx) => (
                              <div key={idx} className="flex gap-2 text-xs">
                                <span className="text-zinc-400">"</span>
                                <span className="italic text-zinc-600 dark:text-zinc-400">{quote}</span>
                                <span className="text-zinc-400">"</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {interview.tags && interview.tags.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            {interview.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-1">
                        {interview.status === 'scheduled' && (
                          <button className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {interviews.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-500">No interviews scheduled</p>
                    <button className="mt-2 text-xs font-medium text-black dark:text-white hover:underline">Schedule your first interview</button>
                  </div>
                )}
              </div>

              {/* Key Quotes Section - Aggregate view */}
              {interviews.some(i => i.keyQuotes && i.keyQuotes.length > 0) && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-black dark:text-white mb-3">All Key Quotes</h3>
                  <div className="space-y-2">
                    {interviews.filter(i => i.keyQuotes && i.keyQuotes.length > 0).flatMap(i =>
                      (i.keyQuotes || []).map((quote, idx) => (
                        <div key={`${i.id}-${idx}`} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400 flex-shrink-0">
                            {i.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm italic text-zinc-700 dark:text-zinc-300">"{quote}"</p>
                            <p className="text-xs text-zinc-500 mt-1">{i.name} · {i.role}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Main Page
export default function ProductTestingPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(mockProducts[0])
  const [showAddProduct, setShowAddProduct] = useState(false)

  const handleAddProduct = (data: Partial<Product>) => {
    const newProduct: Product = {
      id: `p${Date.now()}`,
      name: data.name || 'Untitled',
      description: data.description || '',
      status: 'active',
      color: 'orange',
      metrics: { feedbackCount: 0, activeTests: 0, lastActivity: 'Just created' }
    }
    setProducts([...products, newProduct])
    setSelectedProduct(newProduct)
    setShowAddProduct(false)
  }

  return (
    <AppLayout>
      <PageBackground>
        <div className="flex h-full">
          {/* Products Sidebar */}
          <div className="w-72 border-r border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0 bg-white/40 dark:bg-zinc-950/40">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h1 className="text-sm font-semibold text-black dark:text-white">Product & Testing</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {products.map((product) => {
                const isSelected = selectedProduct?.id === product.id
                return (
                  <motion.button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-lg'
                        : 'bg-white/60 dark:bg-zinc-950/60 border-zinc-200/50 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-black dark:text-white">
                        {product.name}
                      </span>
                      {product.status === 'paused' && (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Paused</span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 mb-3 line-clamp-1">{product.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div>
                        <div className="text-base font-semibold text-black dark:text-white">{product.metrics.feedbackCount}</div>
                        <div className="text-xs text-zinc-500">Feedback</div>
                      </div>
                      <div>
                        <div className="text-base font-semibold text-black dark:text-white">{product.metrics.activeTests}</div>
                        <div className="text-xs text-zinc-500">Tests</div>
                      </div>
                      <div>
                        <div className="text-base font-semibold text-black dark:text-white">{product.metrics.nps ?? '—'}</div>
                        <div className="text-xs text-zinc-500">NPS</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="text-xs text-zinc-400">{product.metrics.lastActivity}</span>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setShowAddProduct(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-500">Add Product</span>
              </button>
            </div>
          </div>

          {/* Workspace */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-zinc-950/60">
            <AnimatePresence mode="wait">
              {selectedProduct ? (
                <ProductWorkspace key={selectedProduct.id} product={selectedProduct} />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-500">Select a product to view</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </PageBackground>

      <AnimatePresence>
        {showAddProduct && (
          <AddProductModal onClose={() => setShowAddProduct(false)} onSave={handleAddProduct} />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
