'use client'

import { useState, useEffect } from 'react'

interface StartupPortfolioModalProps {
  onClose: () => void
}

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

export default function StartupPortfolioModal({ onClose }: StartupPortfolioModalProps) {
  const [profile, setProfile] = useState<StartupProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
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
      const res = await fetch('/api/startup-profile')
      const data = await res.json()

      if (data.profile) {
        setProfile(data.profile)
        setFormData(data.profile)
      } else {
        setEditing(true) // Start in edit mode if no profile exists
      }
    } catch (error) {
      console.error('Error loading startup profile:', error)
    } finally {
      setLoading(false)
    }
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
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Company Name"
                  className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-2xl font-bold text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                />
              ) : (
                <h2 className="text-2xl font-bold">{profile?.company_name || 'Startup Portfolio'}</h2>
              )}

              {editing ? (
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="One-line tagline"
                  className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 mt-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                />
              ) : (
                <p className="text-white/90 mt-1">{profile?.tagline || 'Your startup at a glance'}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading profile...</div>
          ) : editing ? (
            <div className="space-y-6">
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
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Industry</div>
                  <div className="text-lg font-semibold text-black dark:text-white">
                    {profile?.industry || 'Not set'}
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Stage</div>
                  <div className="text-lg font-semibold text-black dark:text-white">
                    {profile?.stage || 'Not set'}
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Team Size</div>
                  <div className="text-lg font-semibold text-black dark:text-white">
                    {profile?.team_size || 'Not set'}
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Location</div>
                  <div className="text-lg font-semibold text-black dark:text-white">
                    {profile?.location || 'Not set'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {profile?.description && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                    About
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {profile.description}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                {profile?.founded_date && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                      Founded
                    </h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {new Date(profile.founded_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                )}

                {profile?.website_url && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                      Website
                    </h3>
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {profile.website_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-end gap-3">
          {editing ? (
            <>
              <button
                onClick={() => {
                  if (profile) {
                    setFormData(profile)
                    setEditing(false)
                  } else {
                    onClose()
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm hover:shadow-md"
              >
                Save Profile
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-semibold text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm hover:shadow-md"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
