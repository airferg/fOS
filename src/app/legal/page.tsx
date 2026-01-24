'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'

// Types
interface CompanyFormation {
  incorporated: boolean
  entityType: string
  state: string
  country: string
  incorporationDate: string
  ein: string
  registeredAgent: string
}

interface ChecklistItem {
  id: string
  name: string
  description: string
  stage: 'Pre-seed' | 'Seed' | 'Series A'
  status: 'complete' | 'incomplete' | 'in-progress' | 'not-applicable'
  importance: 'critical' | 'important' | 'recommended'
  whyItMatters: string
}

interface LegalDocument {
  id: string
  name: string
  type: 'incorporation' | 'safe' | 'contract' | 'ip' | 'equity' | 'other'
  status: 'uploaded' | 'missing' | 'expired' | 'needs-review'
  source: 'Google Drive' | 'DocuSign' | 'Manual Upload' | 'Stripe Atlas'
  lastUpdated?: string
  expirationDate?: string
}

interface RiskAlert {
  id: string
  type: 'warning' | 'info' | 'action-required'
  title: string
  description: string
  impact: string
  relatedItems: string[]
}

// Mock Data
const mockCompanyFormation: CompanyFormation = {
  incorporated: true,
  entityType: 'Delaware C-Corp',
  state: 'Delaware',
  country: 'USA',
  incorporationDate: '2024-06-15',
  ein: '12-3456789',
  registeredAgent: 'Registered Agents Inc.'
}

const mockChecklist: ChecklistItem[] = [
  {
    id: 'c1',
    name: 'Company Incorporation',
    description: 'Form your legal entity (LLC or C-Corp)',
    stage: 'Pre-seed',
    status: 'complete',
    importance: 'critical',
    whyItMatters: 'Required before you can raise money, hire employees, or sign contracts as a company.'
  },
  {
    id: 'c2',
    name: 'Founder Equity Agreements',
    description: 'Define founder ownership splits and vesting schedules',
    stage: 'Pre-seed',
    status: 'complete',
    importance: 'critical',
    whyItMatters: 'Investors require clear equity structure. Prevents disputes and ensures alignment between founders.'
  },
  {
    id: 'c3',
    name: 'IP Assignment Agreement',
    description: 'Transfer all IP created by founders to the company',
    stage: 'Pre-seed',
    status: 'incomplete',
    importance: 'critical',
    whyItMatters: 'Without this, investors may refuse to invest as the company doesn\'t own its core assets.'
  },
  {
    id: 'c4',
    name: '83(b) Election',
    description: 'File IRS 83(b) election within 30 days of equity grant',
    stage: 'Pre-seed',
    status: 'complete',
    importance: 'critical',
    whyItMatters: 'Failure to file can result in significant tax burden when shares vest at higher valuations.'
  },
  {
    id: 'c5',
    name: 'SAFE/Convertible Notes',
    description: 'Standard fundraising instruments for early stage',
    stage: 'Pre-seed',
    status: 'in-progress',
    importance: 'important',
    whyItMatters: 'Needed for accepting investment. Track outstanding SAFEs for cap table accuracy.'
  },
  {
    id: 'c6',
    name: 'Option Pool Creation',
    description: 'Set aside equity for future employee grants',
    stage: 'Seed',
    status: 'incomplete',
    importance: 'important',
    whyItMatters: 'Investors expect 10-20% option pool. Needed before you can grant equity to employees.'
  },
  {
    id: 'c7',
    name: 'Board Consent Documentation',
    description: 'Formal approval for major company decisions',
    stage: 'Seed',
    status: 'incomplete',
    importance: 'important',
    whyItMatters: 'Required for issuing equity, approving fundraising, and major corporate actions.'
  },
  {
    id: 'c8',
    name: 'Employee Handbook',
    description: 'Basic policies for employees',
    stage: 'Seed',
    status: 'incomplete',
    importance: 'recommended',
    whyItMatters: 'Protects company legally and sets clear expectations. Required in some states.'
  },
  {
    id: 'c9',
    name: 'Privacy Policy & Terms of Service',
    description: 'Legal pages for your product/website',
    stage: 'Pre-seed',
    status: 'complete',
    importance: 'important',
    whyItMatters: 'Required for most products, especially those handling user data. Legal protection.'
  },
  {
    id: 'c10',
    name: 'Contractor Agreements',
    description: 'Standard agreements for contractors/freelancers',
    stage: 'Pre-seed',
    status: 'complete',
    importance: 'important',
    whyItMatters: 'Ensures IP ownership and defines working relationship to avoid misclassification.'
  }
]

const mockDocuments: LegalDocument[] = [
  {
    id: 'd1',
    name: 'Certificate of Incorporation',
    type: 'incorporation',
    status: 'uploaded',
    source: 'Stripe Atlas',
    lastUpdated: '2024-06-15'
  },
  {
    id: 'd2',
    name: 'Bylaws',
    type: 'incorporation',
    status: 'uploaded',
    source: 'Stripe Atlas',
    lastUpdated: '2024-06-15'
  },
  {
    id: 'd3',
    name: 'Action by Incorporator',
    type: 'incorporation',
    status: 'uploaded',
    source: 'Stripe Atlas',
    lastUpdated: '2024-06-15'
  },
  {
    id: 'd4',
    name: 'Founder Stock Purchase Agreement - Sarah',
    type: 'equity',
    status: 'uploaded',
    source: 'DocuSign',
    lastUpdated: '2024-06-20'
  },
  {
    id: 'd5',
    name: 'Founder Stock Purchase Agreement - Alex',
    type: 'equity',
    status: 'uploaded',
    source: 'DocuSign',
    lastUpdated: '2024-06-20'
  },
  {
    id: 'd6',
    name: 'IP Assignment Agreement',
    type: 'ip',
    status: 'missing',
    source: 'Manual Upload'
  },
  {
    id: 'd7',
    name: 'SAFE - Sequoia Scout',
    type: 'safe',
    status: 'uploaded',
    source: 'DocuSign',
    lastUpdated: '2024-09-10'
  },
  {
    id: 'd8',
    name: 'SAFE - Angel Investor (John Chen)',
    type: 'safe',
    status: 'uploaded',
    source: 'Google Drive',
    lastUpdated: '2024-11-05'
  },
  {
    id: 'd9',
    name: 'NDA Template',
    type: 'contract',
    status: 'uploaded',
    source: 'Manual Upload',
    lastUpdated: '2024-07-01'
  },
  {
    id: 'd10',
    name: 'Contractor Agreement Template',
    type: 'contract',
    status: 'uploaded',
    source: 'Manual Upload',
    lastUpdated: '2024-07-15'
  }
]

const mockRiskAlerts: RiskAlert[] = [
  {
    id: 'r1',
    type: 'action-required',
    title: 'Missing IP Assignment Agreement',
    description: 'No IP assignment on file. All intellectual property created by founders should be formally assigned to the company.',
    impact: 'May block or delay fundraising. Investors require clean IP ownership before investing.',
    relatedItems: ['c3', 'd6']
  },
  {
    id: 'r2',
    type: 'warning',
    title: 'Outstanding SAFEs Affect Cap Table',
    description: 'You have 2 SAFEs totaling $350K that will convert at next priced round.',
    impact: 'Plan for dilution. At $5M post-money valuation, this represents ~7% dilution.',
    relatedItems: ['d7', 'd8']
  },
  {
    id: 'r3',
    type: 'info',
    title: 'Option Pool Needed Before Hiring',
    description: 'No formal option pool has been created yet. This is typically done before or during a priced round.',
    impact: 'Cannot grant equity to new hires until option pool is established.',
    relatedItems: ['c6']
  }
]

// Components
function CompanyDetailsModal({
  formation,
  onClose
}: {
  formation: CompanyFormation
  onClose: () => void
}) {
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
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Company Formation Details
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
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Entity Type</label>
              <p className="text-sm font-medium text-black dark:text-white">{formation.entityType}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">State</label>
              <p className="text-sm font-medium text-black dark:text-white">{formation.state}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Country</label>
              <p className="text-sm font-medium text-black dark:text-white">{formation.country}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Incorporation Date</label>
              <p className="text-sm font-medium text-black dark:text-white">
                {new Date(formation.incorporationDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">EIN</label>
              <p className="text-sm font-medium text-black dark:text-white">{formation.ein}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Registered Agent</label>
              <p className="text-sm font-medium text-black dark:text-white">{formation.registeredAgent}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Data imported from Stripe Atlas</span>
            </div>
          </div>
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

function DocumentUploadModal({
  onClose,
  onUpload
}: {
  onClose: () => void
  onUpload: (doc: Partial<LegalDocument>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'contract' as LegalDocument['type'],
    source: 'Manual Upload' as LegalDocument['source']
  })
  const [isDragging, setIsDragging] = useState(false)

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
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Upload Document
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
              Document Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., IP Assignment Agreement"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Document Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as LegalDocument['type'] })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="incorporation">Incorporation</option>
              <option value="equity">Equity Agreement</option>
              <option value="safe">SAFE/Convertible</option>
              <option value="ip">IP Assignment</option>
              <option value="contract">Contract</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              // Handle file drop (mock)
            }}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-orange-500 bg-orange-500/5'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
            }`}
          >
            <svg className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Drag & drop your file here, or
            </p>
            <button className="text-xs text-orange-600 dark:text-orange-400 hover:underline">
              browse to upload
            </button>
            <p className="text-xs text-zinc-400 mt-2">PDF, DOC, or DOCX up to 10MB</p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <button className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white">
              Or link from Google Drive / DocuSign
            </button>
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
            onClick={() => {
              onUpload({
                name: formData.name,
                type: formData.type,
                source: formData.source,
                status: 'uploaded'
              })
            }}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Upload
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Status Components
function FormationStatus({ incorporated }: { incorporated: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {incorporated ? (
        <>
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">Incorporated</span>
        </>
      ) : (
        <>
          <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Not Incorporated</span>
        </>
      )}
    </div>
  )
}

function ChecklistStatus({ status }: { status: ChecklistItem['status'] }) {
  switch (status) {
    case 'complete':
      return (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    case 'in-progress':
      return (
        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
        </div>
      )
    case 'incomplete':
      return (
        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />
      )
    case 'not-applicable':
      return (
        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-zinc-500">—</span>
        </div>
      )
  }
}

function DocumentStatus({ status }: { status: LegalDocument['status'] }) {
  switch (status) {
    case 'uploaded':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          Uploaded
        </span>
      )
    case 'missing':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          Missing
        </span>
      )
    case 'expired':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
          Expired
        </span>
      )
    case 'needs-review':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
          Needs Review
        </span>
      )
  }
}

function RiskAlertBadge({ type }: { type: RiskAlert['type'] }) {
  switch (type) {
    case 'action-required':
      return (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs font-medium">Action Required</span>
        </div>
      )
    case 'warning':
      return (
        <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Warning</span>
        </div>
      )
    case 'info':
      return (
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Info</span>
        </div>
      )
  }
}

function getDocTypeIcon(type: LegalDocument['type']) {
  switch (type) {
    case 'incorporation':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    case 'equity':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    case 'safe':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'ip':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    case 'contract':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
  }
}

export default function LegalPage() {
  // State
  const [checklist, setChecklist] = useState<ChecklistItem[]>(mockChecklist)
  const [documents, setDocuments] = useState<LegalDocument[]>(mockDocuments)
  const [selectedStage, setSelectedStage] = useState<'all' | 'Pre-seed' | 'Seed' | 'Series A'>('all')
  const [expandedTooltip, setExpandedTooltip] = useState<string | null>(null)

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // AI state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Stats
  const completedItems = checklist.filter(i => i.status === 'complete').length
  const criticalIncomplete = checklist.filter(i => i.importance === 'critical' && i.status !== 'complete').length
  const uploadedDocs = documents.filter(d => d.status === 'uploaded').length
  const missingDocs = documents.filter(d => d.status === 'missing').length

  // Handlers
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const newStatus = item.status === 'complete' ? 'incomplete' : 'complete'
        return { ...item, status: newStatus }
      }
      return item
    }))
  }

  const handleDocumentUpload = (doc: Partial<LegalDocument>) => {
    const newDoc: LegalDocument = {
      id: `d${Date.now()}`,
      name: doc.name || 'Untitled Document',
      type: doc.type || 'other',
      status: 'uploaded',
      source: doc.source || 'Manual Upload',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
    setDocuments(prev => [newDoc, ...prev])
    setShowUploadModal(false)
  }

  const handleAiAssist = async (prompt: string) => {
    setAiLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (prompt === 'stage') {
      setAiSuggestion(
        `At the Pre-seed/Seed stage, here's what matters most:\n\n` +
        `1. **IP Assignment** (Critical) - Your investors will require this. Get it done now.\n\n` +
        `2. **Option Pool** (Important for hiring) - 10-15% is standard. Set this up before making offers.\n\n` +
        `3. **Board Consents** (Important) - Document major decisions formally, especially equity grants.\n\n` +
        `Lower priority for now: Employee handbook (can wait until 5+ employees).`
      )
    } else if (prompt === 'fundraising') {
      setAiSuggestion(
        `For your next fundraising round, address these items:\n\n` +
        `**Blockers:**\n` +
        `• Missing IP Assignment - Most investors won't close without this\n\n` +
        `**Dilution Impact:**\n` +
        `• Outstanding SAFEs: $350K → ~7% dilution at $5M valuation\n` +
        `• Expected option pool: 10-15% (often negotiated in term sheet)\n\n` +
        `**Recommended:** Complete IP assignment before starting fundraise conversations.`
      )
    }
    setAiLoading(false)
  }

  // Filter checklist by stage
  const filteredChecklist = selectedStage === 'all'
    ? checklist
    : checklist.filter(item => item.stage === selectedStage)

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
              Legal & Compliance
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Track your legal status, documents, and compliance requirements
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
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Checklist Progress</div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {completedItems}
                <span className="text-sm font-normal text-zinc-500 ml-1">/ {checklist.length}</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Critical Items</div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {criticalIncomplete}
                <span className="text-sm font-normal text-zinc-500 ml-1">incomplete</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Documents</div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {uploadedDocs}
                <span className="text-sm font-normal text-zinc-500 ml-1">uploaded</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`backdrop-blur-md rounded-xl p-4 border shadow-lg shadow-black/5 ${
                missingDocs > 0
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-white/60 dark:bg-zinc-950/60 border-zinc-200/50 dark:border-zinc-800/50'
              }`}
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Missing Docs</div>
              <div className={`text-2xl font-semibold ${missingDocs > 0 ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'}`}>
                {missingDocs}
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* Company Formation Status */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Company Formation Status
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    View Details →
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <FormationStatus incorporated={mockCompanyFormation.incorporated} />
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Type:</span>
                          <span className="ml-2 font-medium text-black dark:text-white">{mockCompanyFormation.entityType}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">State:</span>
                          <span className="ml-2 font-medium text-black dark:text-white">{mockCompanyFormation.state}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Since:</span>
                          <span className="ml-2 font-medium text-black dark:text-white">
                            {new Date(mockCompanyFormation.incorporationDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                      via Stripe Atlas
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Legal Checklist */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Legal Checklist
                  </h3>
                  <div className="flex items-center gap-2">
                    {(['all', 'Pre-seed', 'Seed', 'Series A'] as const).map((stage) => (
                      <button
                        key={stage}
                        onClick={() => setSelectedStage(stage)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedStage === stage
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {stage === 'all' ? 'All' : stage}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredChecklist.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleChecklistItem(item.id)}
                          className="mt-0.5"
                        >
                          <ChecklistStatus status={item.status} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-medium text-sm ${
                              item.status === 'complete'
                                ? 'text-zinc-500 line-through'
                                : 'text-black dark:text-white'
                            }`}>
                              {item.name}
                            </span>
                            {item.importance === 'critical' && item.status !== 'complete' && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                                Critical
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                              {item.stage}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {item.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setExpandedTooltip(expandedTooltip === item.id ? null : item.id)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          title="Why it matters"
                        >
                          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      <AnimatePresence>
                        {expandedTooltip === item.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 ml-8"
                          >
                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Why it matters
                              </div>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                {item.whyItMatters}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Documents Repository */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Documents Repository
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                      + Upload
                    </button>
                    <button className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                      Link Document
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {documents.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          doc.status === 'missing'
                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            doc.status === 'missing'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {getDocTypeIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-black dark:text-white truncate">
                                {doc.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DocumentStatus status={doc.status} />
                              <span className="text-xs text-zinc-500">
                                {doc.source}
                              </span>
                            </div>
                            {doc.lastUpdated && (
                              <p className="text-xs text-zinc-400 mt-1">
                                Updated {new Date(doc.lastUpdated).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Risk & Impact Indicators */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Risk & Impact Indicators
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {mockRiskAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`p-3 rounded-lg border ${
                        alert.type === 'action-required'
                          ? 'bg-red-500/5 border-red-500/20'
                          : alert.type === 'warning'
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-blue-500/5 border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <RiskAlertBadge type={alert.type} />
                      </div>
                      <h4 className="font-medium text-sm text-black dark:text-white mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                        {alert.description}
                      </p>
                      <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                        <span className="font-medium">Impact:</span> {alert.impact}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* AI Assist Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 dark:from-orange-500/10 dark:to-orange-500/5 backdrop-blur-md rounded-xl border border-orange-500/20 shadow-lg shadow-black/5"
              >
                <div className="px-4 py-3 border-b border-orange-500/20 flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-orange-500"
                  />
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    AI Legal Assistant
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                    Note: AI provides explanations only, not legal advice. Consult a lawyer for specific decisions.
                  </p>

                  <button
                    onClick={() => handleAiAssist('stage')}
                    disabled={aiLoading}
                    className="w-full text-left px-3 py-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      What legal items matter at my stage?
                    </span>
                  </button>

                  <button
                    onClick={() => handleAiAssist('fundraising')}
                    disabled={aiLoading}
                    className="w-full text-left px-3 py-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Does this affect fundraising?
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
                        <span className="text-xs text-zinc-500">Analyzing your legal status...</span>
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
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">AI Explanation</span>
                          <button
                            onClick={() => setAiSuggestion(null)}
                            className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          >
                            <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed prose prose-sm dark:prose-invert">
                          {aiSuggestion.split('\n').map((line, i) => {
                            if (line.startsWith('**') && line.endsWith('**')) {
                              return <p key={i} className="font-semibold mt-2 first:mt-0">{line.replace(/\*\*/g, '')}</p>
                            }
                            if (line.startsWith('•')) {
                              return <p key={i} className="ml-2">{line}</p>
                            }
                            return <p key={i}>{line}</p>
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 p-4"
              >
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download IP Assignment Template
                  </button>
                  <button className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Legal Review
                  </button>
                  <button className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Connect Google Drive
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageBackground>

      {/* Modals */}
      <AnimatePresence>
        {showDetailsModal && (
          <CompanyDetailsModal
            formation={mockCompanyFormation}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
        {showUploadModal && (
          <DocumentUploadModal
            onClose={() => setShowUploadModal(false)}
            onUpload={handleDocumentUpload}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
