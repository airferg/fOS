'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import PortfolioGenerationModal from '@/components/PortfolioGenerationModal'
import GeneratedPortfolioModal from '@/components/GeneratedPortfolioModal'

interface StartupProfile {
  company_name: string | null
  tagline: string | null
  description: string | null
  industry: string | null
  stage: string | null
  founded_date: string | null
  website_url: string | null
  logo_url: string | null
  team_size: number | null
  location: string | null
}

const GENERATION_STEPS = [
  { label: 'Gathering company information' },
  { label: 'Aggregating team profiles' },
  { label: 'Compiling funding data' },
  { label: 'Calculating equity breakdown' },
  { label: 'Formatting document' },
]

export default function PortfolioPage() {
  const [profile, setProfile] = useState<StartupProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [formData, setFormData] = useState<StartupProfile>({
    company_name: '',
    tagline: '',
    description: '',
    industry: '',
    stage: '',
    founded_date: '',
    website_url: '',
    logo_url: '',
    team_size: null,
    location: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // Only load user profile (keep real)
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      // Hardcoded demo startup profile
      const hardcodedProfile: StartupProfile = {
        company_name: 'Hydra',
        tagline: 'The AI-powered operating system for startup founders',
        description: 'Hydra helps early-stage founders leverage their existing skills, network, funds, and experience to build their startup more efficiently.',
        industry: 'SaaS',
        stage: 'Pre-Seed',
        founded_date: '2025-01-01',
        website_url: 'https://hydra.com',
        logo_url: '/hydraOS-logo.png',
        team_size: 8,
        location: 'San Francisco, CA'
      }

      setProfile(hardcodedProfile)
      setFormData(hardcodedProfile)
    } catch (error) {
      console.error('Error loading startup profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePortfolio = async () => {
    setGenerating(true)
    // The modal will handle the generation steps and call this when complete
  }

  const handleGenerationComplete = async () => {
    // Call API to generate portfolio
    try {
      const res = await fetch('/api/startup-profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        await loadProfile()
      }
    } catch (error) {
      console.error('Error generating portfolio:', error)
    }

    setGenerating(false)
    setShowPortfolioModal(true)
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF...')
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/startup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to save profile')

      const data = await res.json()
      setProfile(data.profile)
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save startup profile')
    }
  }

  const STAGES = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth']
  const INDUSTRIES = [
    'SaaS',
    'Fintech',
    'E-commerce',
    'Healthcare',
    'AI/ML',
    'Education',
    'Consumer',
    'Enterprise',
    'Marketplace',
    'Infrastructure',
    'Other'
  ]

  return (
    <AppLayout user={user}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              Startup Portfolio
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Your investor-ready startup portfolio
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile && !editing && (
              <button
                onClick={generatePortfolio}
                disabled={generating}
                className="px-4 py-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <span>✨</span>
                <span>{generating ? 'Generating...' : 'Regenerate with AI'}</span>
              </button>
            )}
            {!editing && profile && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Edit Portfolio
              </button>
            )}
          </div>
        </div>

        {/* Generation Loading State */}
        {generating && (
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-black dark:text-white">Generating portfolio...</span>
              </div>
              
              <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 mb-6">
                <button
                  disabled
                  className="w-full px-4 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  Put together my startup portfolio
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span>Gathering company information</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading portfolio...</div>
        ) : !profile ? (
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
                Startup Portfolio
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                Generate a comprehensive portfolio document from your startup data
              </p>
              {generating ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-black dark:text-white">
                    <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Generating portfolio...</span>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4">
                    <button
                      disabled
                      className="w-full px-4 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Put together my startup portfolio
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                      <span>Gathering company information</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generatePortfolio}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Put together my startup portfolio</span>
                </button>
              )}
            </div>
          </div>
        ) : editing ? (
              <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Company Name & Tagline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={formData.company_name || ''}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Your Company"
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Tagline *
                      </label>
                      <input
                        type="text"
                        value={formData.tagline || ''}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="One-line description"
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Industry
                      </label>
                      <select
                        value={formData.industry || ''}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Stage
                      </label>
                      <select
                        value={formData.stage || ''}
                        onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      >
                        <option value="">Select stage</option>
                        {STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Founded Date
                      </label>
                      <input
                        type="date"
                        value={formData.founded_date || ''}
                        onChange={(e) => setFormData({ ...formData, founded_date: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Team Size
                      </label>
                      <input
                        type="number"
                        value={formData.team_size || ''}
                        onChange={(e) => setFormData({ ...formData, team_size: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Number of team members"
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., San Francisco, CA"
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website_url || ''}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tell us about your startup - what problem are you solving, who are your customers, what makes you unique?"
                      rows={6}
                      className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white resize-none"
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={formData.logo_url || ''}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        setFormData(profile)
                        setEditing(false)
                      }}
                      className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-semibold text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm hover:shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12 text-white">
                  <div className="max-w-4xl mx-auto">
                    {profile.logo_url && (
                      <img src={profile.logo_url} alt={profile.company_name || ''} className="h-16 mb-6" />
                    )}
                    <h1 className="text-4xl font-bold mb-4">{profile.company_name}</h1>
                    <p className="text-xl text-white/90 mb-6">{profile.tagline}</p>
                    <div className="flex items-center gap-6 text-sm">
                      {profile.industry && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full" />
                          <span>{profile.industry}</span>
                        </div>
                      )}
                      {profile.stage && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full" />
                          <span>{profile.stage}</span>
                        </div>
                      )}
                      {profile.location && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Industry</div>
                    <div className="text-xl font-semibold text-black dark:text-white">
                      {profile.industry || 'Not set'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Stage</div>
                    <div className="text-xl font-semibold text-black dark:text-white">
                      {profile.stage || 'Not set'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Team Size</div>
                    <div className="text-xl font-semibold text-black dark:text-white">
                      {profile.team_size || 'Not set'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Founded</div>
                    <div className="text-xl font-semibold text-black dark:text-white">
                      {profile.founded_date ? new Date(profile.founded_date).getFullYear() : 'Not set'}
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {profile.description && (
                  <div className="bg-white dark:bg-zinc-950 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-black dark:text-white mb-4">About</h2>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {profile.description}
                    </p>
                  </div>
                )}

                {/* Website */}
                {profile.website_url && (
                  <div className="bg-white dark:bg-zinc-950 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Website</h2>
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                    >
                      {profile.website_url}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )}
      </div>

      {/* Portfolio Generation Modal */}
      {generating && (
        <PortfolioGenerationModal
          onComplete={handleGenerationComplete}
          onClose={() => setGenerating(false)}
        />
      )}

      {/* Generated Portfolio Modal */}
      {showPortfolioModal && (
        <GeneratedPortfolioModal
          onClose={() => setShowPortfolioModal(false)}
          onExportPDF={handleExportPDF}
        />
      )}
    </AppLayout>
  )
}
