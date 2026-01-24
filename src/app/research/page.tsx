'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'

// Types
interface Interview {
  id: string
  date: string
  customerType: string
  source: string
  notesSummary: string
  status: 'Scheduled' | 'Completed' | 'No-Show'
  dataSource: 'Imported from Notion' | 'Manual entry' | 'Linked from Google Drive'
  linkedHypotheses?: string[]
}

interface Hypothesis {
  id: string
  believe: string
  because: string
  knowIfTrue: string
  status: 'Untested' | 'In Progress' | 'Validated' | 'Invalidated'
  linkedInterviews?: string[]
  linkedExperiments?: string[]
  createdAt: string
}

interface Experiment {
  id: string
  hypothesisId: string
  description: string
  channel: string
  outcome: string
  decision: string
  status: 'Planning' | 'Running' | 'Analyzing' | 'Complete'
  createdAt: string
}

interface Decision {
  id: string
  whatChanged: string
  why: string
  evidence: string
  createdAt: string
  relatedItems: string[]
}

// Mock Data
const mockInterviews: Interview[] = [
  {
    id: '1',
    date: '2025-01-20',
    customerType: 'Early-stage Founder',
    source: 'YC Network',
    notesSummary: 'Founder validated need for unified dashboard. Main pain: context-switching between 8+ tools daily.',
    status: 'Completed',
    dataSource: 'Imported from Notion',
    linkedHypotheses: ['h1']
  },
  {
    id: '2',
    date: '2025-01-18',
    customerType: 'Series A Founder',
    source: 'LinkedIn Outreach',
    notesSummary: 'Investor relations is biggest time sink. Wants automated updates but personal touch.',
    status: 'Completed',
    dataSource: 'Manual entry',
    linkedHypotheses: ['h2']
  },
  {
    id: '3',
    date: '2025-01-23',
    customerType: 'Pre-seed Founder',
    source: 'Referral - John Chen',
    notesSummary: 'Upcoming call to discuss legal/compliance pain points.',
    status: 'Scheduled',
    dataSource: 'Manual entry'
  },
  {
    id: '4',
    date: '2025-01-15',
    customerType: 'Technical Co-founder',
    source: 'HN Community',
    notesSummary: 'Did not join the call after confirmation. Will reschedule.',
    status: 'No-Show',
    dataSource: 'Linked from Google Drive'
  }
]

const mockHypotheses: Hypothesis[] = [
  {
    id: 'h1',
    believe: 'early-stage founders spend 40%+ of their time on operational tasks',
    because: 'they lack dedicated ops/admin support and use fragmented tools',
    knowIfTrue: 'interviews confirm time tracking data and founders express desire for consolidation',
    status: 'Validated',
    linkedInterviews: ['1', '2'],
    linkedExperiments: ['e1'],
    createdAt: '2025-01-10'
  },
  {
    id: 'h2',
    believe: 'founders will pay for AI-assisted investor updates',
    because: 'writing updates is time-consuming but critical for relationships',
    knowIfTrue: 'we see >50% engagement with AI draft feature in prototype',
    status: 'In Progress',
    linkedInterviews: ['2'],
    linkedExperiments: ['e2'],
    createdAt: '2025-01-12'
  },
  {
    id: 'h3',
    believe: 'legal compliance tracking is a top-3 pain point for pre-seed founders',
    because: 'they lack legal counsel and miss critical deadlines',
    knowIfTrue: 'interview data shows >60% mention legal as major concern',
    status: 'Untested',
    linkedInterviews: [],
    createdAt: '2025-01-20'
  }
]

const mockExperiments: Experiment[] = [
  {
    id: 'e1',
    hypothesisId: 'h1',
    description: 'Dashboard prototype usability test with 10 founders',
    channel: 'User interviews + Figma prototype',
    outcome: '8/10 completed core workflows without guidance. Avg. time savings estimated at 2hrs/week.',
    decision: 'Proceed with dashboard MVP development',
    status: 'Complete',
    createdAt: '2025-01-08'
  },
  {
    id: 'e2',
    hypothesisId: 'h2',
    description: 'AI investor update draft A/B test',
    channel: 'In-app feature flag (beta users)',
    outcome: 'Collecting data - 45% engagement so far, target is 50%',
    decision: 'Pending results',
    status: 'Running',
    createdAt: '2025-01-15'
  }
]

const mockDecisions: Decision[] = [
  {
    id: 'd1',
    whatChanged: 'Prioritized investor relations module over marketing tools',
    why: 'Higher willingness to pay and clearer differentiation',
    evidence: 'Interview #2 feedback, competitive analysis showing gap',
    createdAt: '2025-01-19',
    relatedItems: ['h2', '2']
  },
  {
    id: 'd2',
    whatChanged: 'Narrowed ICP to pre-seed/seed founders (previously included Series A)',
    why: 'Series A founders have ops support; pre-seed has acute pain',
    evidence: 'Interview patterns, conversion data from landing page',
    createdAt: '2025-01-17',
    relatedItems: ['h1', '1']
  }
]

// Components
function InterviewModal({
  interview,
  onClose,
  onSave,
  isNew = false
}: {
  interview?: Interview
  onClose: () => void
  onSave: (interview: Partial<Interview>) => void
  isNew?: boolean
}) {
  const [formData, setFormData] = useState({
    date: interview?.date || new Date().toISOString().split('T')[0],
    customerType: interview?.customerType || '',
    source: interview?.source || '',
    notesSummary: interview?.notesSummary || '',
    status: interview?.status || 'Scheduled' as Interview['status'],
    dataSource: interview?.dataSource || 'Manual entry' as Interview['dataSource']
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            {isNew ? 'Add Interview' : 'Edit Interview'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Interview['status'] })}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="No-Show">No-Show</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Customer Type *
            </label>
            <input
              type="text"
              value={formData.customerType}
              onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              placeholder="e.g., Early-stage Founder, Technical Co-founder"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Source
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., YC Network, LinkedIn, Referral"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Notes Summary
            </label>
            <textarea
              value={formData.notesSummary}
              onChange={(e) => setFormData({ ...formData, notesSummary: e.target.value })}
              placeholder="Key takeaways from the interview..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Data Source
            </label>
            <select
              value={formData.dataSource}
              onChange={(e) => setFormData({ ...formData, dataSource: e.target.value as Interview['dataSource'] })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="Manual entry">Manual entry</option>
              <option value="Imported from Notion">Imported from Notion</option>
              <option value="Linked from Google Drive">Linked from Google Drive</option>
            </select>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            {isNew ? 'Add Interview' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function HypothesisModal({
  hypothesis,
  onClose,
  onSave,
  isNew = false
}: {
  hypothesis?: Hypothesis
  onClose: () => void
  onSave: (hypothesis: Partial<Hypothesis>) => void
  isNew?: boolean
}) {
  const [formData, setFormData] = useState({
    believe: hypothesis?.believe || '',
    because: hypothesis?.because || '',
    knowIfTrue: hypothesis?.knowIfTrue || '',
    status: hypothesis?.status || 'Untested' as Hypothesis['status']
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            {isNew ? 'Create Hypothesis' : 'Edit Hypothesis'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
              "We believe [X] because [Y]. We'll know this is true if [Z]."
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              We believe... *
            </label>
            <textarea
              value={formData.believe}
              onChange={(e) => setFormData({ ...formData, believe: e.target.value })}
              placeholder="What do you believe to be true?"
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Because... *
            </label>
            <textarea
              value={formData.because}
              onChange={(e) => setFormData({ ...formData, because: e.target.value })}
              placeholder="Why do you believe this?"
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              We'll know this is true if... *
            </label>
            <textarea
              value={formData.knowIfTrue}
              onChange={(e) => setFormData({ ...formData, knowIfTrue: e.target.value })}
              placeholder="What evidence would confirm this?"
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Hypothesis['status'] })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="Untested">Untested</option>
              <option value="In Progress">In Progress</option>
              <option value="Validated">Validated</option>
              <option value="Invalidated">Invalidated</option>
            </select>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            {isNew ? 'Create Hypothesis' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DecisionModal({
  onClose,
  onSave
}: {
  onClose: () => void
  onSave: (decision: Partial<Decision>) => void
}) {
  const [formData, setFormData] = useState({
    whatChanged: '',
    why: '',
    evidence: ''
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Log Decision
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              What changed? *
            </label>
            <textarea
              value={formData.whatChanged}
              onChange={(e) => setFormData({ ...formData, whatChanged: e.target.value })}
              placeholder="Describe the decision or change made..."
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Why? *
            </label>
            <textarea
              value={formData.why}
              onChange={(e) => setFormData({ ...formData, why: e.target.value })}
              placeholder="Reasoning behind this decision..."
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Evidence Referenced
            </label>
            <textarea
              value={formData.evidence}
              onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
              placeholder="Interviews, experiments, or data that informed this..."
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Log Decision
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ViewNotesModal({ interview, onClose }: { interview: Interview; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-black dark:text-white">
              Interview Notes
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {interview.customerType} • {new Date(interview.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Summary</div>
            <p className="text-sm text-black dark:text-white leading-relaxed">
              {interview.notesSummary || 'No notes recorded yet.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">Source:</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
              {interview.dataSource}
            </span>
          </div>

          {interview.linkedHypotheses && interview.linkedHypotheses.length > 0 && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Linked Hypotheses
              </div>
              <div className="flex flex-wrap gap-2">
                {interview.linkedHypotheses.map((hId) => (
                  <span key={hId} className="text-xs px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">
                    Hypothesis #{hId.replace('h', '')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Status Badge Component
function StatusBadge({ status, type }: { status: string; type: 'interview' | 'hypothesis' | 'experiment' }) {
  const getColors = () => {
    if (type === 'interview') {
      switch (status) {
        case 'Completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        case 'Scheduled': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        case 'No-Show': return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
        default: return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      }
    }
    if (type === 'hypothesis') {
      switch (status) {
        case 'Validated': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        case 'In Progress': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
        case 'Invalidated': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        case 'Untested': return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
        default: return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      }
    }
    if (type === 'experiment') {
      switch (status) {
        case 'Complete': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        case 'Running': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
        case 'Analyzing': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        case 'Planning': return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
        default: return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      }
    }
    return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
  }

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getColors()}`}>
      {status}
    </span>
  )
}

export default function ResearchPage() {
  // State
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews)
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(mockHypotheses)
  const [experiments] = useState<Experiment[]>(mockExperiments)
  const [decisions, setDecisions] = useState<Decision[]>(mockDecisions)

  // Modal states
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showHypothesisModal, setShowHypothesisModal] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [viewingNotes, setViewingNotes] = useState<Interview | null>(null)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [editingHypothesis, setEditingHypothesis] = useState<Hypothesis | null>(null)

  // AI suggestions state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Handlers
  const handleSaveInterview = (data: Partial<Interview>) => {
    if (editingInterview) {
      setInterviews(prev => prev.map(i => i.id === editingInterview.id ? { ...i, ...data } : i))
    } else {
      const newInterview: Interview = {
        id: Date.now().toString(),
        date: data.date || new Date().toISOString().split('T')[0],
        customerType: data.customerType || '',
        source: data.source || '',
        notesSummary: data.notesSummary || '',
        status: data.status || 'Scheduled',
        dataSource: data.dataSource || 'Manual entry'
      }
      setInterviews(prev => [newInterview, ...prev])
    }
    setShowInterviewModal(false)
    setEditingInterview(null)
  }

  const handleSaveHypothesis = (data: Partial<Hypothesis>) => {
    if (editingHypothesis) {
      setHypotheses(prev => prev.map(h => h.id === editingHypothesis.id ? { ...h, ...data } : h))
    } else {
      const newHypothesis: Hypothesis = {
        id: `h${Date.now()}`,
        believe: data.believe || '',
        because: data.because || '',
        knowIfTrue: data.knowIfTrue || '',
        status: data.status || 'Untested',
        linkedInterviews: [],
        linkedExperiments: [],
        createdAt: new Date().toISOString()
      }
      setHypotheses(prev => [newHypothesis, ...prev])
    }
    setShowHypothesisModal(false)
    setEditingHypothesis(null)
  }

  const handleSaveDecision = (data: Partial<Decision>) => {
    const newDecision: Decision = {
      id: `d${Date.now()}`,
      whatChanged: data.whatChanged || '',
      why: data.why || '',
      evidence: data.evidence || '',
      createdAt: new Date().toISOString(),
      relatedItems: []
    }
    setDecisions(prev => [newDecision, ...prev])
    setShowDecisionModal(false)
  }

  const handleAiAssist = async (prompt: string) => {
    setAiLoading(true)
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (prompt === 'summarize') {
      setAiSuggestion(
        `Based on ${interviews.filter(i => i.status === 'Completed').length} completed interviews:\n\n` +
        `• Main theme: Operational fragmentation is the #1 pain point\n` +
        `• 75% of founders mention context-switching as productivity killer\n` +
        `• Investor relations and legal compliance emerged as underserved needs\n` +
        `• Suggested focus: Unified workspace with AI-assisted communication`
      )
    } else if (prompt === 'untested') {
      const untested = hypotheses.filter(h => h.status === 'Untested')
      setAiSuggestion(
        `You have ${untested.length} untested hypothesis${untested.length !== 1 ? 'es' : ''}:\n\n` +
        untested.map((h, i) => `${i + 1}. "${h.believe}"\n   → Consider: Interview pre-seed founders specifically about legal pain points`).join('\n\n')
      )
    }
    setAiLoading(false)
  }

  // Stats
  const completedInterviews = interviews.filter(i => i.status === 'Completed').length
  const validatedHypotheses = hypotheses.filter(h => h.status === 'Validated').length
  const activeExperiments = experiments.filter(e => e.status === 'Running').length

  return (
    <AppLayout>
      <PageBackground>
        <div className="p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-xl font-semibold text-black dark:text-white leading-tight">
              Product Research & Testing
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Track customer discovery, hypotheses, experiments, and learnings
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-4 gap-4 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Interviews</div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {completedInterviews}
                <span className="text-sm font-normal text-zinc-500 ml-1">completed</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Hypotheses</div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {validatedHypotheses}
                <span className="text-sm font-normal text-zinc-500 ml-1">/ {hypotheses.length} validated</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Experiments</div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {activeExperiments}
                <span className="text-sm font-normal text-zinc-500 ml-1">running</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Decisions Logged</div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {decisions.length}
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Interviews & Hypotheses */}
            <div className="col-span-2 space-y-6">
              {/* Customer Interviews Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Customer Interviews
                  </h3>
                  <button
                    onClick={() => setShowInterviewModal(true)}
                    className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                  >
                    + Add Interview
                  </button>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {interviews.map((interview, index) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-black dark:text-white text-sm">
                              {interview.customerType}
                            </span>
                            <StatusBadge status={interview.status} type="interview" />
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                            {interview.notesSummary || 'No notes yet'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span>{new Date(interview.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{interview.source}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                              {interview.dataSource}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingNotes(interview)}
                            className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          >
                            View Notes
                          </button>
                          <button
                            onClick={() => {
                              setEditingInterview(interview)
                              setShowInterviewModal(true)
                            }}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {interviews.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">No interviews yet</p>
                      <p className="text-xs text-zinc-500">Start by adding your first customer interview</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Hypotheses & Assumptions Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Hypotheses & Assumptions
                  </h3>
                  <button
                    onClick={() => setShowHypothesisModal(true)}
                    className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                  >
                    + Create Hypothesis
                  </button>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {hypotheses.map((hypothesis, index) => (
                    <motion.div
                      key={hypothesis.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={hypothesis.status} type="hypothesis" />
                            {hypothesis.linkedInterviews && hypothesis.linkedInterviews.length > 0 && (
                              <span className="text-xs text-zinc-500">
                                {hypothesis.linkedInterviews.length} interview{hypothesis.linkedInterviews.length !== 1 ? 's' : ''} linked
                              </span>
                            )}
                          </div>
                          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-sm text-black dark:text-white leading-relaxed">
                              <span className="text-zinc-500">We believe </span>
                              <span className="font-medium">{hypothesis.believe}</span>
                              <span className="text-zinc-500"> because </span>
                              <span>{hypothesis.because}</span>
                              <span className="text-zinc-500">. We'll know this is true if </span>
                              <span>{hypothesis.knowIfTrue}</span>
                              <span className="text-zinc-500">.</span>
                            </p>
                          </div>
                          {hypothesis.linkedExperiments && hypothesis.linkedExperiments.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              <span className="text-xs text-orange-600 dark:text-orange-400">
                                {hypothesis.linkedExperiments.length} experiment{hypothesis.linkedExperiments.length !== 1 ? 's' : ''} testing this
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingHypothesis(hypothesis)
                            setShowHypothesisModal(true)
                          }}
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Experiments / Tests Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Experiments & Tests
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {experiments.map((experiment, index) => {
                    const linkedHypothesis = hypotheses.find(h => h.id === experiment.hypothesisId)
                    const steps = ['Planning', 'Running', 'Analyzing', 'Complete']
                    const currentStep = steps.indexOf(experiment.status)

                    return (
                      <motion.div
                        key={experiment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-black dark:text-white text-sm mb-1">
                              {experiment.description}
                            </h4>
                            {linkedHypothesis && (
                              <p className="text-xs text-zinc-500">
                                Testing: "{linkedHypothesis.believe.substring(0, 50)}..."
                              </p>
                            )}
                          </div>
                          <StatusBadge status={experiment.status} type="experiment" />
                        </div>

                        {/* Experiment Stepper */}
                        <div className="flex items-center gap-1 mb-4">
                          {steps.map((step, idx) => (
                            <div key={step} className="flex items-center flex-1">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                  idx <= currentStep
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
                                }`}
                              >
                                {idx < currentStep ? (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              {idx < steps.length - 1 && (
                                <div
                                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                                    idx < currentStep
                                      ? 'bg-orange-500'
                                      : 'bg-zinc-200 dark:bg-zinc-700'
                                  }`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500 mb-4 px-1">
                          {steps.map((step) => (
                            <span key={step}>{step}</span>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-zinc-500">Channel:</span>
                            <p className="text-black dark:text-white mt-0.5">{experiment.channel}</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">Outcome:</span>
                            <p className="text-black dark:text-white mt-0.5">{experiment.outcome}</p>
                          </div>
                        </div>

                        {experiment.decision && experiment.status === 'Complete' && (
                          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                            <span className="text-xs text-zinc-500">Decision:</span>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                              {experiment.decision}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}

                  {experiments.length === 0 && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">No experiments yet</p>
                      <p className="text-xs text-zinc-500">Create a hypothesis first, then design an experiment to test it</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Decisions & AI */}
            <div className="space-y-6">
              {/* AI Assist Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 dark:from-orange-500/10 dark:to-orange-500/5 backdrop-blur-md rounded-xl border border-orange-500/20 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-orange-500/20 flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-orange-500"
                  />
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    AI Research Assistant
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => handleAiAssist('summarize')}
                    disabled={aiLoading}
                    className="w-full text-left px-3 py-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Summarize interview themes
                    </span>
                  </button>
                  <button
                    onClick={() => handleAiAssist('untested')}
                    disabled={aiLoading}
                    className="w-full text-left px-3 py-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      What hypotheses are still untested?
                    </span>
                  </button>

                  <AnimatePresence>
                    {aiLoading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"
                        />
                        <span className="text-xs text-zinc-500">Analyzing...</span>
                      </motion.div>
                    )}

                    {aiSuggestion && !aiLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">AI Suggestion</span>
                          <button
                            onClick={() => setAiSuggestion(null)}
                            className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          >
                            <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                          {aiSuggestion}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Decisions & Learnings Timeline */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Decisions & Learnings
                  </h3>
                  <button
                    onClick={() => setShowDecisionModal(true)}
                    className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                  >
                    + Log Decision
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500 via-orange-500/50 to-zinc-200 dark:to-zinc-800" />

                    <div className="space-y-4">
                      {decisions.map((decision, index) => (
                        <motion.div
                          key={decision.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-8"
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>

                          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">
                              {new Date(decision.createdAt).toLocaleDateString()}
                            </div>
                            <h4 className="font-medium text-black dark:text-white text-sm mb-1">
                              {decision.whatChanged}
                            </h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                              {decision.why}
                            </p>
                            <div className="text-xs text-zinc-500">
                              <span className="font-medium">Evidence:</span> {decision.evidence}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {decisions.length === 0 && (
                        <div className="pl-8 text-center py-4">
                          <p className="text-xs text-zinc-500">No decisions logged yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageBackground>

      {/* Modals */}
      <AnimatePresence>
        {(showInterviewModal || editingInterview) && (
          <InterviewModal
            interview={editingInterview || undefined}
            onClose={() => {
              setShowInterviewModal(false)
              setEditingInterview(null)
            }}
            onSave={handleSaveInterview}
            isNew={!editingInterview}
          />
        )}
        {(showHypothesisModal || editingHypothesis) && (
          <HypothesisModal
            hypothesis={editingHypothesis || undefined}
            onClose={() => {
              setShowHypothesisModal(false)
              setEditingHypothesis(null)
            }}
            onSave={handleSaveHypothesis}
            isNew={!editingHypothesis}
          />
        )}
        {showDecisionModal && (
          <DecisionModal
            onClose={() => setShowDecisionModal(false)}
            onSave={handleSaveDecision}
          />
        )}
        {viewingNotes && (
          <ViewNotesModal
            interview={viewingNotes}
            onClose={() => setViewingNotes(null)}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
