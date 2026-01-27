'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'

// Types matching real API data
interface TeamMember {
  id: string
  name: string
  email?: string
  role: string
  title?: string
  equity_percent: number
  start_date?: string
}

interface Investor {
  id: string
  name: string
  email?: string
  firm?: string
  investment_amount: number
  equity_percent: number
  funding_round_id?: string
  investor_type?: string
  investment_date?: string
  is_lead?: boolean
}

interface FundingRound {
  id: string
  round_name: string
  round_type?: string
  amount_raised: number
  close_date: string
  status: 'planned' | 'raising' | 'closed'
}

interface ComplianceControl {
  id: string
  name: string
  description: string
  status: 'passing' | 'failing' | 'unconfigured' | 'manual'
  owner?: string
  linkedSystem?: string
  frameworks: string[]
  lastChecked?: string
}

interface SecurityQuestionnaire {
  id: string
  customerName: string
  status: 'pending' | 'in-progress' | 'completed' | 'sent'
  questionsTotal: number
  questionsAnswered: number
  dueDate?: string
}

interface ExecutionStep {
  id: string
  message: string
  status: 'pending' | 'running' | 'complete'
}

interface Filing {
  id: string
  name: string
  description: string
  status: 'completed' | 'due' | 'overdue' | 'not-required'
  dueDate?: string
  completedDate?: string
  amount?: number
}

interface EntityInfo {
  type: string
  state: string
  incorporationDate: string
  registeredAgent: string
  ein?: string
  provider: string
}

// Default entity info (would come from onboarding/settings in real app)
const defaultEntity: EntityInfo = {
  type: 'Virginia LLC',
  state: 'Virginia',
  incorporationDate: '2025-09-01',
  registeredAgent: 'Virginia Registered Agent',
  ein: '88-1234567',
  provider: 'Virginia SCC'
}

// Default filings
const defaultFilings: Filing[] = [
  { id: 'f1', name: 'Virginia Annual Registration', description: 'Annual registration fee to Virginia SCC', status: 'due', dueDate: '2026-09-01', amount: 50 },
  { id: 'f2', name: 'Annual Report', description: 'Virginia State Corporation Commission', status: 'due', dueDate: '2026-09-01' },
  { id: 'f3', name: 'EIN Registration', description: 'Federal employer identification number', status: 'completed', completedDate: '2025-09-15' },
  { id: 'f4', name: 'Operating Agreement', description: 'LLC operating agreement', status: 'completed', completedDate: '2025-09-01' },
  { id: 'f5', name: 'Articles of Organization', description: 'Filed with Virginia SCC', status: 'completed', completedDate: '2025-09-01' },
  { id: 'f6', name: 'Business License', description: 'Local business license if required', status: 'not-required' },
]

// Static compliance controls (would come from integrations in real app)
const defaultControls: ComplianceControl[] = [
  { id: 'c1', name: 'MFA Enforced', description: 'Multi-factor authentication enabled for all users', status: 'unconfigured', linkedSystem: 'Google Workspace', frameworks: ['SOC 2', 'NIST'] },
  { id: 'c2', name: 'Branch Protection', description: 'Main branch requires PR reviews', status: 'unconfigured', linkedSystem: 'GitHub', frameworks: ['SOC 2'] },
  { id: 'c3', name: 'Encryption at Rest', description: 'All data encrypted at rest using AES-256', status: 'unconfigured', linkedSystem: 'AWS', frameworks: ['SOC 2', 'NIST', 'HIPAA'] },
  { id: 'c4', name: 'Access Reviews', description: 'Quarterly access reviews completed', status: 'unconfigured', frameworks: ['SOC 2', 'NIST'] },
  { id: 'c5', name: 'Incident Response Plan', description: 'Documented incident response procedure', status: 'unconfigured', frameworks: ['SOC 2', 'NIST'] },
  { id: 'c6', name: 'Vendor Security Review', description: 'Third-party vendors assessed annually', status: 'unconfigured', frameworks: ['SOC 2'] },
  { id: 'c7', name: 'Security Training', description: 'Annual security awareness training', status: 'unconfigured', frameworks: ['SOC 2', 'NIST', 'HIPAA'] },
  { id: 'c8', name: 'Backup & Recovery', description: 'Regular backups with tested recovery', status: 'unconfigured', linkedSystem: 'AWS', frameworks: ['SOC 2', 'NIST'] },
]

const defaultQuestionnaires: SecurityQuestionnaire[] = [
  { id: 'q1', customerName: 'Sample Enterprise Customer', status: 'pending', questionsTotal: 85, questionsAnswered: 0, dueDate: '2026-02-15' },
]

export default function LegalPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Real data from APIs
  const [team, setTeam] = useState<TeamMember[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([])
  const [totalRaised, setTotalRaised] = useState(0)
  
  // Agreement tracking (would be stored in DB in real app)
  const [teamAgreements, setTeamAgreements] = useState<Record<string, { ip: 'signed' | 'pending' | 'none', employment: 'signed' | 'pending' | 'none' }>>({})
  const [investorSafeStatus, setInvestorSafeStatus] = useState<Record<string, 'signed' | 'pending' | 'draft'>>({})
  
  // Compliance data
  const [controls, setControls] = useState<ComplianceControl[]>(defaultControls)
  const [questionnaires, setQuestionnaires] = useState<SecurityQuestionnaire[]>(defaultQuestionnaires)
  
  // Entity & Filings data
  const [entity] = useState<EntityInfo>(defaultEntity)
  const [filings, setFilings] = useState<Filing[]>(defaultFilings)
  
  // UI state
  const [activeTab, setActiveTab] = useState<'compliance' | 'questionnaires' | 'agreements' | 'equity'>('agreements')
  const [selectedFramework, setSelectedFramework] = useState<string>('all')
  const [expandedControl, setExpandedControl] = useState<string | null>(null)
  
  // Execution state
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  
  // Trust Page state
  const [trustPageEnabled, setTrustPageEnabled] = useState(false)
  const [trustPageUrl] = useState('https://trust.yourcompany.com/abc123')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Only load user profile (keep real)
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      // Hardcoded demo team data (8 members - user is the only founder)
      const userName = profileData.name || profileData.email?.split('@')[0] || 'You'
      const userEmail = profileData.email || 'user@hydra.com'
      
      const hardcodedTeamMembers: TeamMember[] = [
        { id: 'user-1', name: userName, role: 'Founder', title: 'CEO', equity_percent: 50, email: userEmail, start_date: '2025-01-01' },
        { id: '2', name: 'John', role: 'Employee', title: 'Lead Engineer', equity_percent: 5, email: 'john@hydra.com', start_date: '2025-02-01' },
        { id: '3', name: 'Chris', role: 'Employee', title: 'Product Manager', equity_percent: 3, email: 'chris@hydra.com', start_date: '2025-02-15' },
        { id: '4', name: 'David', role: 'Employee', title: 'Designer', equity_percent: 2.5, email: 'david@hydra.com', start_date: '2025-03-01' },
        { id: '5', name: 'Maria', role: 'Employee', title: 'Marketing Lead', equity_percent: 2.5, email: 'maria@hydra.com', start_date: '2025-03-01' },
        { id: '6', name: 'Raj', role: 'Employee', title: 'Engineer', equity_percent: 2, email: 'raj@hydra.com', start_date: '2025-03-15' },
        { id: '7', name: 'Priya', role: 'Employee', title: 'Operations', equity_percent: 2, email: 'priya@hydra.com', start_date: '2025-03-15' },
        { id: '8', name: 'Alex', role: 'Employee', title: 'CTO', equity_percent: 3, email: 'alex@hydra.com', start_date: '2025-02-01' },
      ]
      setTeam(hardcodedTeamMembers)
      
      // Initialize agreement status for team
      const agreements: Record<string, { ip: 'signed' | 'pending' | 'none', employment: 'signed' | 'pending' | 'none' }> = {}
      hardcodedTeamMembers.forEach((m: TeamMember) => {
        const isFounder = m.role?.toLowerCase().includes('founder') || m.role?.toLowerCase().includes('ceo') || m.role?.toLowerCase().includes('cto')
        agreements[m.id] = {
          ip: isFounder ? 'signed' : 'none',
          employment: isFounder ? 'signed' : 'none'
        }
      })
      setTeamAgreements(agreements)

      // Hardcoded funding rounds
      const hardcodedRounds: FundingRound[] = [
        {
          id: 'round-1',
          round_name: 'Pre-Seed',
          round_type: 'Pre-Seed',
          amount_raised: 6500,
          close_date: '2025-01-24',
          status: 'closed',
          lead_investor: 'Sequoia Capital'
        }
      ]
      setFundingRounds(hardcodedRounds)

      // Hardcoded investors (matching funding page)
      const hardcodedInvestors: Investor[] = [
        {
          id: 'inv-1',
          name: 'Sequoia Capital',
          email: 'contact@sequoia.com',
          firm: 'Sequoia Capital',
          investment_amount: 3000,
          equity_percent: 7.5,
          round_name: 'Pre-Seed',
          funding_round_id: 'round-1',
          investor_type: 'vc',
          investment_date: '2025-01-24',
          notes: 'Lead investor',
          is_lead: true
        },
        {
          id: 'inv-2',
          name: 'David Investor',
          email: 'david@example.com',
          firm: null,
          investment_amount: 2000,
          equity_percent: 5.0,
          round_name: 'Pre-Seed',
          funding_round_id: 'round-1',
          investor_type: 'angel',
          investment_date: '2025-01-24',
          notes: null,
          is_lead: false
        },
        {
          id: 'inv-3',
          name: 'California Angels',
          email: 'info@calangels.com',
          firm: 'California Angels',
          investment_amount: 1500,
          equity_percent: 2.5,
          round_name: 'Pre-Seed',
          funding_round_id: 'round-1',
          investor_type: 'angel',
          investment_date: '2025-01-24',
          notes: null,
          is_lead: false
        }
      ]
      
      setInvestors(hardcodedInvestors)
      
      // Calculate total raised
      const total = hardcodedInvestors.reduce((sum: number, inv: Investor) => sum + (Number(inv.investment_amount) || 0), 0)
      setTotalRaised(total)
      
      // Initialize SAFE status for investors
      const safeStatus: Record<string, 'signed' | 'pending' | 'draft'> = {}
      hardcodedInvestors.forEach((inv: Investor) => {
        safeStatus[inv.id] = 'signed'
      })
      setInvestorSafeStatus(safeStatus)

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
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
      setExecutionSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'complete' } : s))
    }

    await new Promise(r => setTimeout(r, 400))
    onComplete()
    setExecutingAction(null)
    setExecutionSteps([])
  }

  // Action handlers
  const handleRunAllChecks = () => {
    executeAction('run-checks', [
      { message: 'Connecting to integrations...' },
      { message: 'Checking security configurations...' },
      { message: 'Updating control statuses...' },
    ], () => {
      // Simulate some controls passing after check
      setControls(prev => prev.map((c, i) => ({
        ...c,
        status: i < 3 ? 'passing' : c.status,
        lastChecked: new Date().toISOString()
      })))
    })
  }

  const handleRequestSignature = (type: string, member: TeamMember) => {
    executeAction(`sign-${type}-${member.id}`, [
      { message: `Preparing ${type} for ${member.name}...` },
      { message: 'Generating document...' },
      { message: `Sending to ${member.email || member.name}...` },
      { message: 'Signature request sent' },
    ], () => {
      setTeamAgreements(prev => ({
        ...prev,
        [member.id]: {
          ...prev[member.id],
          [type === 'IP Assignment' ? 'ip' : 'employment']: 'pending'
        }
      }))
    })
  }

  const handleSendSafe = (investor: Investor) => {
    executeAction(`safe-${investor.id}`, [
      { message: 'Generating SAFE agreement...' },
      { message: `Amount: $${investor.investment_amount?.toLocaleString()}...` },
      { message: 'Creating signature request...' },
      { message: `Sending to ${investor.name}...` },
      { message: 'SAFE sent for signature' },
    ], () => {
      setInvestorSafeStatus(prev => ({
        ...prev,
        [investor.id]: 'pending'
      }))
    })
  }

  const handleGenerateQuestionnaireResponse = (q: SecurityQuestionnaire) => {
    executeAction(`questionnaire-${q.id}`, [
      { message: 'Analyzing questionnaire questions...' },
      { message: 'Matching to answer bank...' },
      { message: 'Generating responses...' },
      { message: 'Response ready for review' },
    ], () => {
      setQuestionnaires(prev => prev.map(qst => 
        qst.id === q.id ? { ...qst, status: 'in-progress', questionsAnswered: Math.floor(qst.questionsTotal * 0.7) } : qst
      ))
    })
  }

  const handleCopyTrustPageLink = () => {
    navigator.clipboard.writeText(trustPageUrl)
  }

  const handlePayAnnualRegistration = () => {
    executeAction('pay-annual-registration', [
      { message: 'Connecting to Virginia SCC...' },
      { message: 'Preparing annual registration payment ($50)...' },
      { message: 'Processing payment...' },
      { message: 'Submitting to Virginia SCC...' },
      { message: 'Payment confirmed' },
    ], () => {
      setFilings(prev => prev.map(f => 
        f.id === 'f1' ? { ...f, status: 'completed', completedDate: new Date().toISOString().split('T')[0] } : f
      ))
    })
  }

  const handleFileAnnualReport = () => {
    executeAction('file-annual-report', [
      { message: 'Connecting to Virginia SCC...' },
      { message: 'Generating annual report from company data...' },
      { message: 'Submitting filing...' },
      { message: 'Filing confirmed' },
    ], () => {
      setFilings(prev => prev.map(f => 
        f.id === 'f2' ? { ...f, status: 'completed', completedDate: new Date().toISOString().split('T')[0] } : f
      ))
    })
  }

  const handleFile83b = (memberName: string) => {
    executeAction('file-83b', [
      { message: `Generating 83(b) election for ${memberName}...` },
      { message: 'Preparing IRS Form...' },
      { message: 'Attaching stock grant details...' },
      { message: 'Creating certified mail label...' },
      { message: 'Document ready for signature and mailing' },
    ], () => {
      // Would open document preview
    })
  }

  // Stats
  const controlsPassing = controls.filter(c => c.status === 'passing').length
  const controlsFailing = controls.filter(c => c.status === 'failing').length
  const controlsUnconfigured = controls.filter(c => c.status === 'unconfigured' || c.status === 'manual').length
  const complianceScore = controls.length > 0 ? Math.round((controlsPassing / controls.length) * 100) : 0
  
  const filteredControls = selectedFramework === 'all' 
    ? controls 
    : controls.filter(c => c.frameworks.includes(selectedFramework))

  const pendingTeamAgreements = Object.values(teamAgreements).filter(a => a.ip === 'none' || a.ip === 'pending' || a.employment === 'none' || a.employment === 'pending').length
  const pendingInvestorDocs = Object.values(investorSafeStatus).filter(s => s === 'pending' || s === 'draft').length

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
            className="mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-1">Legal & Compliance</h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Prove security, manage agreements, stay audit-ready
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {complianceScore}% Controls Passing
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 group cursor-pointer"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Team Members</div>
              <div className="text-2xl font-semibold text-black dark:text-white">{team.length}</div>
              <div className="text-xs text-zinc-500 mt-1">{pendingTeamAgreements > 0 ? `${pendingTeamAgreements} need agreements` : 'All signed'}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 group cursor-pointer"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Investors</div>
              <div className="text-2xl font-semibold text-black dark:text-white">{investors.length}</div>
              <div className="text-xs text-zinc-500 mt-1">${totalRaised >= 1000 ? (totalRaised / 1000).toFixed(1) + 'K' : totalRaised.toLocaleString()} raised</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 group cursor-pointer"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Controls Passing</div>
              <div className="text-2xl font-semibold text-black dark:text-white">{controlsPassing}/{controls.length}</div>
              <div className="text-xs text-zinc-500 mt-1">{controlsUnconfigured} unconfigured</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 group cursor-pointer"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Filings Due</div>
              <div className="text-2xl font-semibold text-black dark:text-white">{filings.filter(f => f.status === 'due' || f.status === 'overdue').length}</div>
              <div className="text-xs text-zinc-500 mt-1">{filings.filter(f => f.status === 'completed').length} completed</div>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mb-4 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            {[
              { id: 'agreements', label: 'Team & Investors' },
              { id: 'equity', label: 'Cap Table' },
              { id: 'compliance', label: 'Compliance Controls' },
              { id: 'questionnaires', label: 'Questionnaires' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Team & Investors Tab */}
            {activeTab === 'agreements' && (
              <motion.div
                key="agreements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Entity Status - Stripe Atlas Card */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                        <svg className="w-4 h-4 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-black dark:text-white">{entity.type}</h3>
                        <p className="text-xs text-zinc-500">Registered with {entity.provider}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                      Active
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">State</div>
                        <div className="text-sm font-medium text-black dark:text-white">{entity.state}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Incorporated</div>
                        <div className="text-sm font-medium text-black dark:text-white">
                          {new Date(entity.incorporationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">EIN</div>
                        <div className="text-sm font-medium text-black dark:text-white">{entity.ein || 'Pending'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Registered Agent</div>
                        <div className="text-sm font-medium text-black dark:text-white truncate">{entity.registeredAgent}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filings & Deadlines */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Filings & Compliance</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">State and federal requirements</p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filings.map((filing) => {
                      const daysUntil = filing.dueDate ? getDaysUntil(filing.dueDate) : null
                      const isUrgent = daysUntil !== null && daysUntil <= 45
                      
                      return (
                        <div key={filing.id} className="p-4 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                              filing.status === 'completed' 
                                ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white' 
                                : filing.status === 'not-required'
                                ? 'bg-transparent border-zinc-200 dark:border-zinc-700'
                                : 'bg-transparent border-zinc-300 dark:border-zinc-600'
                            }`}>
                              {filing.status === 'completed' && (
                                <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {filing.status === 'not-required' && (
                                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                {filing.name}
                              </p>
                              <p className="text-xs text-zinc-500">{filing.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {filing.status === 'completed' && (
                              <span className="text-xs text-zinc-500">
                                {filing.completedDate && new Date(filing.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            {filing.status === 'due' && (
                              <>
                                <span className={`text-xs ${isUrgent ? 'text-zinc-700 dark:text-zinc-300 font-medium' : 'text-zinc-500'}`}>
                                  Due {filing.dueDate && new Date(filing.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {isUrgent && ` (${daysUntil}d)`}
                                </span>
                                {filing.id === 'f1' && (
                                  <button
                                    onClick={handlePayAnnualRegistration}
                                    disabled={executingAction !== null}
                                    className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                  >
                                    Pay ${filing.amount}
                                  </button>
                                )}
                                {filing.id === 'f2' && (
                                  <button
                                    onClick={handleFileAnnualReport}
                                    disabled={executingAction !== null}
                                    className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                  >
                                    File Now
                                  </button>
                                )}
                              </>
                            )}
                            {filing.status === 'not-required' && (
                              <span className="text-xs text-zinc-400 italic">Not required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Team & Investor Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Team Agreements */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Team Agreements</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">IP assignments and employment contracts</p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {team.length === 0 ? (
                      <div className="p-8 text-center text-sm text-zinc-500">No team members yet</div>
                    ) : (
                      team.map((member) => {
                        const agreements = teamAgreements[member.id] || { ip: 'none', employment: 'none' }
                        return (
                          <div key={member.id} className="p-4 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-medium group-hover:ring-2 group-hover:ring-orange-500/20 transition-all">
                                {getInitials(member.name)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{member.name}</p>
                                <p className="text-xs text-zinc-500">{member.role || member.title}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 ml-13">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">IP Assignment</span>
                                {agreements.ip === 'signed' ? (
                                  <span className="text-xs text-zinc-500">Signed</span>
                                ) : agreements.ip === 'pending' ? (
                                  <span className="text-xs text-zinc-500 italic">Pending signature</span>
                                ) : (
                                  <button
                                    onClick={() => handleRequestSignature('IP Assignment', member)}
                                    disabled={executingAction !== null}
                                    className="text-xs text-black dark:text-white font-medium hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                  >
                                    Request Signature
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Employment Agreement</span>
                                {agreements.employment === 'signed' ? (
                                  <span className="text-xs text-zinc-500">Signed</span>
                                ) : agreements.employment === 'pending' ? (
                                  <span className="text-xs text-zinc-500 italic">Pending signature</span>
                                ) : (
                                  <button
                                    onClick={() => handleRequestSignature('Employment Agreement', member)}
                                    disabled={executingAction !== null}
                                    className="text-xs text-black dark:text-white font-medium hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                  >
                                    Request Signature
                                  </button>
                                )}
                              </div>
                              {member.equity_percent > 0 && member.start_date && getDaysUntil(new Date(new Date(member.start_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()) > 0 && (
                                <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400">83(b) Election</span>
                                  <button
                                    onClick={() => handleFile83b(member.name)}
                                    disabled={executingAction !== null}
                                    className="text-xs text-black dark:text-white font-medium hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                  >
                                    Generate & File
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Investor Documents */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Investor Documents</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">SAFEs and investment agreements</p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {investors.length === 0 ? (
                      <div className="p-8 text-center text-sm text-zinc-500">No investors yet</div>
                    ) : (
                      investors.map((investor) => {
                        const safeStatus = investorSafeStatus[investor.id] || 'signed'
                        return (
                          <div key={investor.id} className="p-4 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-medium group-hover:ring-2 group-hover:ring-orange-500/20 transition-all">
                                  {getInitials(investor.name)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{investor.name}</p>
                                  {investor.firm && <p className="text-xs text-zinc-500">{investor.firm}</p>}
                                  <p className="text-xs text-zinc-400 mt-0.5">
                                    ${investor.investment_amount?.toLocaleString() || 0}
                                    {investor.equity_percent > 0 && ` · ${investor.equity_percent}% equity`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {safeStatus === 'signed' && (
                                  <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                                    SAFE Signed
                                  </span>
                                )}
                                {safeStatus === 'pending' && (
                                  <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded italic">
                                    Awaiting Signature
                                  </span>
                                )}
                                {safeStatus === 'draft' && (
                                  <button
                                    onClick={() => handleSendSafe(investor)}
                                    disabled={executingAction !== null}
                                    className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                  >
                                    Send SAFE
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                </div>
              </motion.div>
            )}

            {/* Cap Table Tab */}
            {activeTab === 'equity' && (
              <motion.div
                key="equity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              >
                {/* Cap Table */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Ownership</h3>
                  </div>
                  <div className="p-4">
                    {/* Founders & Team */}
                    <div className="mb-6">
                      <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Founders & Team</p>
                      <div className="space-y-2">
                        {team.map((member) => (
                          <div key={member.id} className="flex items-center justify-between py-2 group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-medium">
                                {getInitials(member.name)}
                              </div>
                              <div>
                                <p className="text-sm text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{member.name}</p>
                                <p className="text-xs text-zinc-500">{member.role || member.title}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-black dark:text-white">{(member.equity_percent || 0).toFixed(2)}%</p>
                            </div>
                          </div>
                        ))}
                        {team.length === 0 && (
                          <p className="text-sm text-zinc-500 text-center py-4">No team members</p>
                        )}
                      </div>
                    </div>

                    {/* Investors */}
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Investors</p>
                      <div className="space-y-2">
                        {investors.map((investor) => (
                          <div key={investor.id} className="flex items-center justify-between py-2 group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-medium">
                                {getInitials(investor.name)}
                              </div>
                              <div>
                                <p className="text-sm text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{investor.name}</p>
                                {investor.firm && <p className="text-xs text-zinc-500">{investor.firm}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-black dark:text-white">{(investor.equity_percent || 0).toFixed(2)}%</p>
                              <p className="text-xs text-zinc-500">${investor.investment_amount?.toLocaleString() || 0}</p>
                            </div>
                          </div>
                        ))}
                        {investors.length === 0 && (
                          <p className="text-sm text-zinc-500 text-center py-4">No investors</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Summary</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Total Raised</div>
                        <div className="text-xl font-semibold text-black dark:text-white">${totalRaised >= 1000 ? (totalRaised / 1000).toFixed(1) + 'K' : totalRaised.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Funding Rounds</div>
                        <div className="text-xl font-semibold text-black dark:text-white">{fundingRounds.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Total Shareholders</div>
                        <div className="text-xl font-semibold text-black dark:text-white">{team.length + investors.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Ownership Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Team</span>
                        <span className="text-black dark:text-white font-medium">
                          {team.reduce((sum, m) => sum + (m.equity_percent || 0), 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Investors</span>
                        <span className="text-black dark:text-white font-medium">
                          {investors.reduce((sum, i) => sum + (i.equity_percent || 0), 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Compliance Controls Tab */}
            {activeTab === 'compliance' && (
              <motion.div
                key="compliance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              >
                {/* Controls List */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-black dark:text-white">Control Checklist</h3>
                        <select
                          value={selectedFramework}
                          onChange={(e) => setSelectedFramework(e.target.value)}
                          className="text-xs border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-900 text-black dark:text-white"
                        >
                          <option value="all">All Frameworks</option>
                          <option value="SOC 2">SOC 2</option>
                          <option value="NIST">NIST CSF</option>
                          <option value="HIPAA">HIPAA</option>
                        </select>
                      </div>
                      <button
                        onClick={handleRunAllChecks}
                        disabled={executingAction !== null}
                        className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                      >
                        Run All Checks
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {filteredControls.map((control) => (
                        <div key={control.id} className="p-4 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${
                                control.status === 'passing' 
                                  ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white' 
                                  : 'bg-transparent border-zinc-300 dark:border-zinc-600'
                              }`}>
                                {control.status === 'passing' && (
                                  <svg className="w-3 h-3 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{control.name}</p>
                                  {control.linkedSystem && (
                                    <span className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                                      {control.linkedSystem}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500 mb-2">{control.description}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {control.frameworks.map(f => (
                                    <span key={f} className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className={`text-xs ${
                              control.status === 'passing' ? 'text-zinc-600 dark:text-zinc-400' :
                              control.status === 'failing' ? 'text-zinc-500 font-medium' :
                              'text-zinc-400 italic'
                            }`}>
                              {control.status === 'passing' ? 'Passing' : 
                               control.status === 'failing' ? 'Needs attention' : 
                               'Not configured'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Audit Readiness */}
                  <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-semibold text-black dark:text-white">Audit Readiness</h3>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-zinc-500">Overall Progress</span>
                          <span className="font-medium text-black dark:text-white">{complianceScore}%</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-900 dark:bg-white transition-all"
                            style={{ width: `${complianceScore}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Passing</span>
                          <span className="text-black dark:text-white font-medium">{controlsPassing}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Failing</span>
                          <span className="text-black dark:text-white font-medium">{controlsFailing}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Not Configured</span>
                          <span className="text-black dark:text-white font-medium">{controlsUnconfigured}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust Page */}
                  <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-black dark:text-white">Trust Page</h3>
                      <button
                        onClick={() => setTrustPageEnabled(!trustPageEnabled)}
                        className={`w-8 h-5 rounded-full transition-colors ${
                          trustPageEnabled ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white dark:bg-zinc-900 rounded-full transition-transform mx-0.5 ${
                          trustPageEnabled ? 'translate-x-3' : ''
                        }`} />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-zinc-500 mb-3">
                        Share your compliance status with customers.
                      </p>
                      {trustPageEnabled && (
                        <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                          <input
                            type="text"
                            value={trustPageUrl}
                            readOnly
                            className="flex-1 text-xs bg-transparent text-zinc-600 dark:text-zinc-400"
                          />
                          <button
                            onClick={handleCopyTrustPageLink}
                            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Questionnaires Tab */}
            {activeTab === 'questionnaires' && (
              <motion.div
                key="questionnaires"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-black dark:text-white">Security Questionnaires</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Respond to customer security assessments</p>
                    </div>
                    <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                      Import Questionnaire
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {questionnaires.map((q) => {
                      const progress = Math.round((q.questionsAnswered / q.questionsTotal) * 100)
                      const daysUntil = q.dueDate ? getDaysUntil(q.dueDate) : null
                      
                      return (
                        <div key={q.id} className="p-4 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{q.customerName}</p>
                              <p className="text-xs text-zinc-500">
                                {q.questionsTotal} questions
                                {daysUntil !== null && ` · Due in ${daysUntil} days`}
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                              {q.status === 'sent' ? 'Sent' : q.status === 'completed' ? 'Complete' : q.status === 'in-progress' ? 'In Progress' : 'Pending'}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-zinc-500">{q.questionsAnswered} of {q.questionsTotal} answered</span>
                              <span className="text-zinc-500">{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-zinc-900 dark:bg-white transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {q.status === 'pending' && (
                              <button
                                onClick={() => handleGenerateQuestionnaireResponse(q)}
                                disabled={executingAction !== null}
                                className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                              >
                                Generate Responses
                              </button>
                            )}
                            {q.status === 'in-progress' && (
                              <>
                                <button className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                  Continue Editing
                                </button>
                                <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                                  Send to Customer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
