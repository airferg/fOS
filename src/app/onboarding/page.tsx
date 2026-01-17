'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Import integrations list from integrations page
const integrations = [
  { id: 'gmail', name: 'Gmail', category: 'Email', description: 'Send and manage emails, automate outreach campaigns', icon: '📧' },
  { id: 'outlook', name: 'Outlook', category: 'Email', description: 'Microsoft email integration for enterprise workflows', icon: '📨' },
  { id: 'slack', name: 'Slack', category: 'Communication', description: 'Team messaging and notifications for updates', icon: '💬' },
  { id: 'discord', name: 'Discord', category: 'Communication', description: 'Community management and team coordination', icon: '🎮' },
  { id: 'google-calendar', name: 'Google Calendar', category: 'Calendar', description: 'Schedule meetings and sync your availability', icon: '📅' },
  { id: 'calendly', name: 'Calendly', category: 'Scheduling', description: 'Automated scheduling links for customer meetings', icon: '🗓️' },
  { id: 'zoom', name: 'Zoom', category: 'Video', description: 'Video conferencing and virtual meetings', icon: '🎥' },
  { id: 'fireflies', name: 'Fireflies.ai', category: 'Transcription', description: 'AI meeting transcription and note-taking', icon: '🎙️' },
  { id: 'notion', name: 'Notion', category: 'Productivity', description: 'Sync tasks, documents, and knowledge base', icon: '📝' },
  { id: 'google-docs', name: 'Google Docs', category: 'Documents', description: 'Create and share documents automatically', icon: '📄' },
  { id: 'airtable', name: 'Airtable', category: 'Database', description: 'Flexible database for tracking everything', icon: '🗂️' },
  { id: 'coda', name: 'Coda', category: 'Productivity', description: 'All-in-one doc for teams and workflows', icon: '📋' },
  { id: 'tally', name: 'Tally', category: 'Forms', description: 'Create beautiful forms and collect responses', icon: '📊' },
  { id: 'typeform', name: 'Typeform', category: 'Forms', description: 'Interactive forms and surveys for user research', icon: '📝' },
  { id: 'google-forms', name: 'Google Forms', category: 'Forms', description: 'Simple surveys and data collection', icon: '📋' },
  { id: 'productboard', name: 'ProductBoard', category: 'Product', description: 'Product roadmaps and feature prioritization', icon: '🎯' },
  { id: 'linear', name: 'Linear', category: 'Project Management', description: 'Issue tracking and project management', icon: '⚡' },
  { id: 'jira', name: 'Jira', category: 'Project Management', description: 'Agile project management for dev teams', icon: '🔷' },
  { id: 'asana', name: 'Asana', category: 'Project Management', description: 'Task and project management platform', icon: '✓' },
  { id: 'github', name: 'GitHub', category: 'Development', description: 'Code repository and collaboration platform', icon: '🐙' },
  { id: 'gitlab', name: 'GitLab', category: 'Development', description: 'DevOps platform for complete CI/CD', icon: '🦊' },
  { id: 'vercel', name: 'Vercel', category: 'Deployment', description: 'Deploy and host your web applications', icon: '▲' },
  { id: 'linkedin', name: 'LinkedIn', category: 'Networking', description: 'Professional networking and outreach', icon: '💼' },
  { id: 'twitter', name: 'Twitter/X', category: 'Social', description: 'Social media engagement and content sharing', icon: '🐦' },
  { id: 'google-analytics', name: 'Google Analytics', category: 'Analytics', description: 'Website traffic and user behavior insights', icon: '📈' },
  { id: 'mixpanel', name: 'Mixpanel', category: 'Analytics', description: 'Product analytics and user tracking', icon: '📊' },
  { id: 'amplitude', name: 'Amplitude', category: 'Analytics', description: 'Behavioral analytics for product teams', icon: '📉' },
  { id: 'stripe', name: 'Stripe', category: 'Payments', description: 'Payment processing and billing automation', icon: '💳' },
  { id: 'quickbooks', name: 'QuickBooks', category: 'Accounting', description: 'Financial management and bookkeeping', icon: '💰' },
  { id: 'intercom', name: 'Intercom', category: 'Support', description: 'Customer messaging and support platform', icon: '💬' },
  { id: 'zendesk', name: 'Zendesk', category: 'Support', description: 'Customer service and ticketing system', icon: '🎫' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing', description: 'Email marketing and campaign automation', icon: '🐵' },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', description: 'All-in-one CRM and marketing platform', icon: '🧲' },
]

interface OnboardingData {
  name: string
  building: string // What are you building?
  skills: string[]
  experience: string
  networkSize: string
  ideas: string[]
  funds: string
  hoursPerWeek: string
  goal: string
  integrations: Record<string, boolean> // Dynamic integrations object
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Initialize integrations object with all integrations set to false
  const initialIntegrations: Record<string, boolean> = {}
  integrations.forEach(integration => {
    initialIntegrations[integration.id] = false
  })
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    building: '',
    skills: [],
    experience: '',
    networkSize: '',
    ideas: [],
    funds: '',
    hoursPerWeek: '',
    goal: '',
    integrations: initialIntegrations,
  })

  const totalSteps = 8 // Increased to 8 to include "what are you building"

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
      setError('')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Parse numeric values
      const funds = parseFloat(data.funds) || 0
      const hoursPerWeek = parseInt(data.hoursPerWeek) || 0

      // Convert skills string array to objects
      const skillsArray = data.skills.map((skill) => ({
        name: skill.trim(),
        type: 'other',
        proficiency: 'intermediate',
      }))

      // Convert ideas string array to objects
      const ideasArray = data.ideas.map((idea) => ({
        title: idea.trim(),
        description: '',
      }))

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          building: data.building,
          skills: skillsArray,
          experience: data.experience,
          networkSize: data.networkSize,
          ideas: ideasArray,
          funds,
          hoursPerWeek,
          goal: data.goal,
          integrations: data.integrations,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete onboarding')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const addSkill = () => {
    const input = document.getElementById('skill-input') as HTMLInputElement
    if (input && input.value.trim()) {
      setData({ ...data, skills: [...data.skills, input.value.trim()] })
      input.value = ''
    }
  }

  const removeSkill = (index: number) => {
    setData({ ...data, skills: data.skills.filter((_, i) => i !== index) })
  }

  const addIdea = () => {
    const input = document.getElementById('idea-input') as HTMLInputElement
    if (input && input.value.trim()) {
      setData({ ...data, ideas: [...data.ideas, input.value.trim()] })
      input.value = ''
    }
  }

  const removeIdea = (index: number) => {
    setData({ ...data, ideas: data.ideas.filter((_, i) => i !== index) })
  }

  const toggleIntegration = (integrationId: string) => {
    setData({
      ...data,
      integrations: {
        ...data.integrations,
        [integrationId]: !data.integrations[integrationId],
      },
    })
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Welcome to FounderOS</h2>
              <p className="text-zinc-600">Let's get to know you and set up your workspace.</p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                What's your name?
              </label>
              <input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="John Doe"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">What are you building?</h2>
              <p className="text-zinc-600">Tell us about your startup or project.</p>
            </div>
            <div>
              <textarea
                value={data.building}
                onChange={(e) => setData({ ...data, building: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="e.g., An AI-powered task management tool for remote teams that helps prioritize work based on impact..."
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Your Skills</h2>
              <p className="text-zinc-600">What are you good at? Add your key skills.</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="skill-input"
                  type="text"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., Product Design, Marketing, Engineering"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-zinc-800 transition-colors"
                >
                  Add
                </button>
              </div>
              {data.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(index)}
                        className="text-zinc-500 hover:text-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Your Experience</h2>
              <p className="text-zinc-600">Tell us about what you've built or worked on before.</p>
            </div>
            <div>
              <textarea
                value={data.experience}
                onChange={(e) => setData({ ...data, experience: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="Describe your previous projects, companies, or work experience..."
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Your Network</h2>
              <p className="text-zinc-600">How many relevant people can you reach out to?</p>
            </div>
            <div>
              <select
                value={data.networkSize}
                onChange={(e) => setData({ ...data, networkSize: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select an option</option>
                <option value="0-10">0-10 people</option>
                <option value="11-50">11-50 people</option>
                <option value="51-100">51-100 people</option>
                <option value="101-500">101-500 people</option>
                <option value="500+">500+ people</option>
              </select>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Startup Ideas</h2>
              <p className="text-zinc-600">What problems or ideas have you been thinking about?</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="idea-input"
                  type="text"
                  onKeyPress={(e) => e.key === 'Enter' && addIdea()}
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., AI-powered task management for remote teams"
                />
                <button
                  onClick={addIdea}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-zinc-800 transition-colors"
                >
                  Add
                </button>
              </div>
              {data.ideas.length > 0 && (
                <div className="space-y-2">
                  {data.ideas.map((idea, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded"
                    >
                      <span className="text-sm">{idea}</span>
                      <button
                        onClick={() => removeIdea(index)}
                        className="text-zinc-500 hover:text-black"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Resources & Time</h2>
              <p className="text-zinc-600">What do you have available to work with?</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="funds" className="block text-sm font-medium text-black mb-2">
                  Budget Available ($)
                </label>
                <input
                  id="funds"
                  type="number"
                  value={data.funds}
                  onChange={(e) => setData({ ...data, funds: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="hours" className="block text-sm font-medium text-black mb-2">
                  Hours per Week
                </label>
                <input
                  id="hours"
                  type="number"
                  value={data.hoursPerWeek}
                  onChange={(e) => setData({ ...data, hoursPerWeek: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="0"
                  min="0"
                  max="168"
                />
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-black mb-2">Your Goal</h2>
              <p className="text-zinc-600">What's your current startup goal?</p>
            </div>
            <div>
              <textarea
                value={data.goal}
                onChange={(e) => setData({ ...data, goal: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="e.g., Validate a startup idea, Launch an MVP, Get first 10 users..."
              />
            </div>
            <div className="pt-4 border-t border-zinc-200">
              <h3 className="text-lg font-medium text-black mb-4">Connect Your Tools</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Enable integrations to help FounderOS work better with your existing workflow.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {integrations.map((integration) => (
                  <label
                    key={integration.id}
                    className="flex items-center gap-3 p-3 border border-zinc-200 rounded hover:bg-zinc-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={data.integrations[integration.id] || false}
                      onChange={() => toggleIntegration(integration.id)}
                      className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black"
                    />
                    <span className="text-xl">{integration.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-black">{integration.name}</div>
                      <div className="text-xs text-zinc-500">{integration.category}</div>
                      <div className="text-sm text-zinc-600">{integration.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.name.trim().length > 0
      case 2:
        return data.building.trim().length > 0
      case 3:
        return true // Skills are optional
      case 4:
        return true // Experience is optional
      case 5:
        return data.networkSize.length > 0
      case 6:
        return true // Ideas are optional
      case 7:
        return true // Funds and hours are optional
      case 8:
        return data.goal.trim().length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-zinc-600 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-2 border border-zinc-300 text-black rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-black text-white rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="px-6 py-2 bg-black text-white rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
