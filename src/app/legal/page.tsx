'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'

// Types
interface Document {
  id: string
  name: string
  type: 'safe' | 'ip-assignment' | 'employment' | 'contractor' | 'nda' | 'incorporation' | 'compliance' | 'other'
  status: 'draft' | 'pending-signature' | 'signed' | 'expired'
  relatedTo?: string // person or entity name
  uploadedAt: string
  signedAt?: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  ipAssignment: 'signed' | 'pending' | 'none'
  employmentAgreement: 'signed' | 'pending' | 'none'
}

interface Investor {
  id: string
  name: string
  firm?: string
  safeStatus: 'signed' | 'pending' | 'none'
  safeAmount?: number
}

interface Filing {
  id: string
  name: string
  status: 'completed' | 'due' | 'overdue'
  dueDate?: string
  completedDate?: string
}

interface ExecutionStep {
  id: string
  message: string
  status: 'pending' | 'running' | 'complete'
}

// Mock Data
const mockDocuments: Document[] = [
  { id: 'd1', name: 'Certificate of Incorporation', type: 'incorporation', status: 'signed', uploadedAt: '2024-06-15', signedAt: '2024-06-15' },
  { id: 'd2', name: 'Bylaws', type: 'incorporation', status: 'signed', uploadedAt: '2024-06-15', signedAt: '2024-06-15' },
  { id: 'd3', name: 'SAFE Agreement', type: 'safe', status: 'signed', relatedTo: 'Sequoia Scout', uploadedAt: '2024-09-10', signedAt: '2024-09-12' },
  { id: 'd4', name: 'SAFE Agreement', type: 'safe', status: 'pending-signature', relatedTo: 'Angel Fund', uploadedAt: '2024-11-20' },
  { id: 'd5', name: 'IP Assignment', type: 'ip-assignment', status: 'signed', relatedTo: 'Alex Chen', uploadedAt: '2024-06-20', signedAt: '2024-06-22' },
  { id: 'd6', name: 'Privacy Policy', type: 'compliance', status: 'signed', uploadedAt: '2024-06-30' },
  { id: 'd7', name: 'Terms of Service', type: 'compliance', status: 'signed', uploadedAt: '2024-06-30' },
]

const mockTeam: TeamMember[] = [
  { id: 't1', name: 'Alex Chen', role: 'CEO & Co-founder', email: 'alex@company.com', ipAssignment: 'signed', employmentAgreement: 'signed' },
  { id: 't2', name: 'Sarah Kim', role: 'CTO & Co-founder', email: 'sarah@company.com', ipAssignment: 'pending', employmentAgreement: 'signed' },
  { id: 't3', name: 'Mike Johnson', role: 'Lead Developer', email: 'mike@company.com', ipAssignment: 'none', employmentAgreement: 'pending' },
]

const mockInvestors: Investor[] = [
  { id: 'i1', name: 'Sequoia Scout', firm: 'Sequoia Capital', safeStatus: 'signed', safeAmount: 150000 },
  { id: 'i2', name: 'Angel Fund', safeStatus: 'pending', safeAmount: 100000 },
  { id: 'i3', name: 'John Chen', safeStatus: 'none', safeAmount: 50000 },
]

const mockFilings: Filing[] = [
  { id: 'f1', name: 'Delaware Franchise Tax', status: 'due', dueDate: '2026-03-01' },
  { id: 'f2', name: 'Annual Report', status: 'due', dueDate: '2026-03-01' },
  { id: 'f3', name: 'Entity Formation', status: 'completed', completedDate: '2024-06-15' },
  { id: 'f4', name: 'EIN Registration', status: 'completed', completedDate: '2024-06-20' },
]

export default function LegalPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [team, setTeam] = useState<TeamMember[]>(mockTeam)
  const [investors, setInvestors] = useState<Investor[]>(mockInvestors)
  const [filings, setFilings] = useState<Filing[]>(mockFilings)
  
  // Execution state
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadContext, setUploadContext] = useState<{ type: string; relatedTo?: string } | null>(null)

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
      setExecutionSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'running' } : s
      ))
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400))
      setExecutionSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'complete' } : s
      ))
    }

    await new Promise(r => setTimeout(r, 500))
    onComplete()
    setExecutingAction(null)
    setExecutionSteps([])
  }

  // Action handlers
  const handleSendForSignature = (docName: string, recipientName: string, recipientEmail: string) => {
    executeAction(
      `sign-${docName}`,
      [
        { message: `Preparing ${docName} for signature...` },
        { message: `Sending to ${recipientName} via DocuSign...` },
        { message: 'Signature request sent successfully' },
      ],
      () => {
        // Update state to reflect pending signature
      }
    )
  }

  const handleSendReminder = (recipientName: string) => {
    executeAction(
      `reminder-${recipientName}`,
      [
        { message: `Composing reminder for ${recipientName}...` },
        { message: 'Sending reminder email...' },
        { message: 'Reminder sent' },
      ],
      () => {}
    )
  }

  const handleShareToSlack = (docName: string, channel: string) => {
    executeAction(
      `slack-${docName}`,
      [
        { message: `Preparing ${docName}...` },
        { message: `Posting to #${channel}...` },
        { message: `Shared to #${channel}` },
      ],
      () => {}
    )
  }

  const handleEmailDocument = (docName: string, recipientName: string) => {
    executeAction(
      `email-${docName}`,
      [
        { message: `Attaching ${docName}...` },
        { message: `Sending to ${recipientName}...` },
        { message: 'Email sent' },
      ],
      () => {}
    )
  }

  const handleFileFranchiseTax = () => {
    executeAction(
      'file-franchise-tax',
      [
        { message: 'Preparing Delaware Franchise Tax filing...' },
        { message: 'Calculating tax amount ($225)...' },
        { message: 'Submitting to Delaware Division of Corporations...' },
        { message: 'Filing submitted successfully' },
      ],
      () => {
        setFilings(prev => prev.map(f => 
          f.id === 'f1' ? { ...f, status: 'completed', completedDate: new Date().toISOString().split('T')[0] } : f
        ))
      }
    )
  }

  const handleRequestIPAssignment = (member: TeamMember) => {
    executeAction(
      `ip-${member.id}`,
      [
        { message: `Generating IP Assignment Agreement for ${member.name}...` },
        { message: `Sending to ${member.email} via DocuSign...` },
        { message: 'Signature request sent' },
      ],
      () => {
        setTeam(prev => prev.map(t => 
          t.id === member.id ? { ...t, ipAssignment: 'pending' } : t
        ))
      }
    )
  }

  // Stats
  const pendingSignatures = documents.filter(d => d.status === 'pending-signature').length + 
    team.filter(t => t.ipAssignment === 'pending' || t.employmentAgreement === 'pending').length +
    investors.filter(i => i.safeStatus === 'pending').length
  const missingAgreements = team.filter(t => t.ipAssignment === 'none').length
  const upcomingFilings = filings.filter(f => f.status === 'due' || f.status === 'overdue').length

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <AppLayout user={user}>
      <PageBackground>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-1">Legal & Compliance</h1>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Manage agreements, signatures, and filings
              </p>
            </div>
            <button
              onClick={() => {
                setUploadContext({ type: 'other' })
                setShowUploadModal(true)
              }}
              className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Document
            </button>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">Pending Signatures</div>
              <div className="text-3xl font-medium text-black dark:text-white">{pendingSignatures}</div>
              {pendingSignatures > 0 && (
                <div className="text-xs text-zinc-500 mt-1.5">Awaiting response</div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`bg-white dark:bg-zinc-950 rounded-lg border p-4 ${
                missingAgreements > 0 ? 'border-red-200 dark:border-red-800' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">Missing Agreements</div>
              <div className={`text-3xl font-medium ${missingAgreements > 0 ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'}`}>
                {missingAgreements}
              </div>
              {missingAgreements > 0 && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1.5">Team members without IP assignment</div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`bg-white dark:bg-zinc-950 rounded-lg border p-4 ${
                upcomingFilings > 0 ? 'border-yellow-200 dark:border-yellow-800' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">Upcoming Filings</div>
              <div className={`text-3xl font-medium ${upcomingFilings > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-black dark:text-white'}`}>
                {upcomingFilings}
              </div>
              {upcomingFilings > 0 && (
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1.5">Due this quarter</div>
              )}
            </motion.div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Team Agreements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">Team Agreements</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">IP assignments and employment contracts</p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {team.map((member) => (
                    <div key={member.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-medium">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black dark:text-white">{member.name}</p>
                            <p className="text-xs text-zinc-500">{member.role}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 ml-13 space-y-2">
                        {/* IP Assignment Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">IP Assignment</span>
                          </div>
                          {member.ipAssignment === 'signed' ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Signed</span>
                          ) : member.ipAssignment === 'pending' ? (
                            <button
                              onClick={() => handleSendReminder(member.name)}
                              disabled={executingAction !== null}
                              className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                            >
                              Pending - Send Reminder
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRequestIPAssignment(member)}
                              disabled={executingAction !== null}
                              className="text-xs text-zinc-900 dark:text-white font-medium hover:underline"
                            >
                              Request Signature
                            </button>
                          )}
                        </div>

                        {/* Employment Agreement Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">Employment Agreement</span>
                          </div>
                          {member.employmentAgreement === 'signed' ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Signed</span>
                          ) : member.employmentAgreement === 'pending' ? (
                            <button
                              onClick={() => handleSendReminder(member.name)}
                              disabled={executingAction !== null}
                              className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                            >
                              Pending - Send Reminder
                            </button>
                          ) : (
                            <button
                              disabled={executingAction !== null}
                              className="text-xs text-zinc-900 dark:text-white font-medium hover:underline"
                            >
                              Request Signature
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Investor Documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">Investor Documents</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">SAFEs, term sheets, and agreements</p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {investors.map((investor) => (
                    <div key={investor.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-medium">
                            {getInitials(investor.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black dark:text-white">{investor.name}</p>
                            {investor.firm && (
                              <p className="text-xs text-zinc-500">{investor.firm}</p>
                            )}
                            {investor.safeAmount && (
                              <p className="text-xs text-zinc-400 mt-0.5">${investor.safeAmount.toLocaleString()} SAFE</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {investor.safeStatus === 'signed' ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              Signed
                            </span>
                          ) : investor.safeStatus === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                                Awaiting Signature
                              </span>
                              <button
                                onClick={() => handleSendReminder(investor.name)}
                                disabled={executingAction !== null}
                                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                              >
                                Remind
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSendForSignature('SAFE Agreement', investor.name, '')}
                              disabled={executingAction !== null}
                              className="px-2 py-1 text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-black rounded hover:bg-zinc-800 dark:hover:bg-zinc-100"
                            >
                              Send SAFE
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {investor.safeStatus === 'signed' && (
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => handleShareToSlack('SAFE Agreement', 'legal')}
                            disabled={executingAction !== null}
                            className="text-xs text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share to Slack
                          </button>
                          <button
                            onClick={() => handleEmailDocument('SAFE Agreement', investor.name)}
                            disabled={executingAction !== null}
                            className="text-xs text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email Copy
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Entity & Filings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">Entity & Filings</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Corporate filings and registrations</p>
                </div>
                <div className="p-4">
                  {/* Entity Status */}
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">Delaware C-Corp</p>
                        <p className="text-xs text-zinc-500">Incorporated Jun 2024</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
                  </div>

                  {/* Filings List */}
                  <div className="space-y-3">
                    {filings.map((filing) => {
                      const daysUntil = filing.dueDate ? getDaysUntil(filing.dueDate) : null
                      const isUrgent = daysUntil !== null && daysUntil <= 30
                      
                      return (
                        <div
                          key={filing.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            filing.status === 'completed'
                              ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                              : isUrgent
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-black dark:text-white">{filing.name}</p>
                            {filing.status === 'completed' ? (
                              <p className="text-xs text-zinc-500">Completed {filing.completedDate}</p>
                            ) : (
                              <p className={`text-xs ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                Due {filing.dueDate} ({daysUntil} days)
                              </p>
                            )}
                          </div>
                          {filing.status !== 'completed' && filing.id === 'f1' && (
                            <button
                              onClick={handleFileFranchiseTax}
                              disabled={executingAction !== null}
                              className="px-3 py-1.5 text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-black rounded hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                            >
                              File Now
                            </button>
                          )}
                          {filing.status === 'completed' && (
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Compliance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">Compliance Documents</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Privacy policy, terms, and policies</p>
                </div>
                <div className="p-4 space-y-3">
                  {documents.filter(d => d.type === 'compliance').map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-black dark:text-white">{doc.name}</p>
                          <p className="text-xs text-zinc-500">Last updated {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-zinc-500 hover:text-black dark:hover:text-white">
                          View
                        </button>
                        <button className="text-xs text-zinc-500 hover:text-black dark:hover:text-white">
                          Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black dark:text-white">Document Vault</h3>
                  <span className="text-xs text-zinc-500">{documents.length} documents</span>
                </div>
                <div className="p-4 space-y-2">
                  {documents.filter(d => d.type !== 'compliance').slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-black dark:text-white">{doc.name}</p>
                          {doc.relatedTo && (
                            <p className="text-xs text-zinc-500">{doc.relatedTo}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs ${
                        doc.status === 'signed' ? 'text-green-600 dark:text-green-400' :
                        doc.status === 'pending-signature' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-zinc-500'
                      }`}>
                        {doc.status === 'signed' ? 'Signed' : doc.status === 'pending-signature' ? 'Pending' : doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

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
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 shadow-2xl"
              >
                <div className="space-y-4">
                  {executionSteps.map((step, idx) => (
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
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <span className={`text-sm ${
                        step.status === 'complete' ? 'text-zinc-500' :
                        step.status === 'running' ? 'text-black dark:text-white font-medium' :
                        'text-zinc-400'
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

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-black dark:text-white">Upload Document</h2>
                  <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Document Type</label>
                    <select className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white">
                      <option>SAFE Agreement</option>
                      <option>IP Assignment</option>
                      <option>Employment Agreement</option>
                      <option>NDA</option>
                      <option>Incorporation Document</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Related To (Optional)</label>
                    <input
                      type="text"
                      placeholder="Person or company name"
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-black dark:text-white"
                    />
                  </div>
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors cursor-pointer">
                    <svg className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Drop file here or click to browse</p>
                    <p className="text-xs text-zinc-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100">
                    Upload
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
