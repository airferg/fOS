'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Contact {
  id: string
  name: string
  email: string | null
  role: string | null
  position: string | null
  company: string | null
  tags: string[]
  helpful_for: string | null
  stage: string
  connection_strength: 'weak' | 'medium' | 'strong'
  last_contacted: string | null
  organization?: {
    id: string
    name: string
    industry: string | null
  } | null
  groups?: Array<{
    id: string
    name: string
    color: string
    icon: string
  }>
}

interface Organization {
  id: string
  name: string
  industry: string | null
  website: string | null
}

interface ContactGroup {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  contact_count: number
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  
  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [selectedStrength, setSelectedStrength] = useState<string>('all')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Import state
  const [importing, setImporting] = useState(false)
  const [useAI, setUseAI] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadContacts()
  }, [selectedGroup, selectedOrg, selectedStrength, selectedStage, searchQuery])

  const loadData = async () => {
    await Promise.all([loadContacts(), loadOrganizations(), loadGroups()])
    setLoading(false)
  }

  const loadContacts = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedGroup !== 'all') params.append('group_id', selectedGroup)
      if (selectedOrg !== 'all') params.append('organization_id', selectedOrg)
      if (selectedStrength !== 'all') params.append('connection_strength', selectedStrength)
      if (selectedStage !== 'all') params.append('stage', selectedStage)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/contacts?${params.toString()}`)
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations')
      const data = await res.json()
      setOrganizations(data.organizations || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/groups')
      const data = await res.json()
      setGroups(data.groups || [])
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('useAI', useAI.toString())

    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        alert(`Successfully imported ${data.stats?.contactsImported || 0} contacts!`)
        loadData()
        setShowImport(false)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Import failed: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const createGroup = async (name: string, description: string, color: string, icon: string) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color, icon }),
      })

      if (res.ok) {
        loadGroups()
        setShowGroupModal(false)
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'weak': return 'bg-zinc-100 text-zinc-800'
      default: return 'bg-zinc-100 text-zinc-800'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-medium text-black">FounderOS</h1>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:text-black transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 hover:text-black transition-colors">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-black font-medium">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 hover:text-black transition-colors">
              Documents
            </Link>
            <Link href="/agents" className="text-zinc-600 hover:text-black transition-colors">
              AI Agents
            </Link>
            <Link href="/integrations" className="text-zinc-600 hover:text-black transition-colors">
              Integrations
            </Link>
            <Link href="/dev" className="text-zinc-600 hover:text-black transition-colors">
              Dev
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-black">Network</h2>
            <p className="text-sm text-zinc-600 mt-1">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGroupModal(true)}
              className="px-4 py-2 border border-zinc-300 text-sm rounded hover:bg-zinc-50 transition-colors"
            >
              New Group
            </button>
            <button
              onClick={() => setShowAddContact(true)}
              className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-zinc-800 transition-colors font-medium"
            >
              Add Contact
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 border border-zinc-300 text-sm rounded hover:bg-zinc-50 transition-colors"
            >
              Import CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-zinc-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />

            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Groups</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.icon} {group.name} ({group.contact_count})
                </option>
              ))}
            </select>

            {/* Organization Filter */}
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            {/* Strength Filter */}
            <select
              value={selectedStrength}
              onChange={(e) => setSelectedStrength(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Strengths</option>
              <option value="strong">Strong</option>
              <option value="medium">Medium</option>
              <option value="weak">Weak</option>
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Stages</option>
              <option value="contacted">Contacted</option>
              <option value="engaged">Engaged</option>
              <option value="active">Active</option>
              <option value="champion">Champion</option>
            </select>
          </div>
        </div>

        {/* Groups Overview */}
        {groups.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-black mb-3">Groups</h3>
            <div className="flex gap-2 flex-wrap">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(selectedGroup === group.id ? 'all' : group.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGroup === group.id
                      ? 'bg-black text-white'
                      : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <span className="mr-2">{group.icon}</span>
                  {group.name} ({group.contact_count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-black mb-4">Import LinkedIn Network</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Export your LinkedIn connections from{' '}
                <a
                  href="https://www.linkedin.com/psettings/member-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black underline"
                >
                  LinkedIn Settings
                </a>{' '}
                and upload the CSV file here.
              </p>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="rounded"
                  />
                  <span>Use AI to enrich contacts (tags, connection strength, etc.)</span>
                </label>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="text-sm mb-4 w-full"
                disabled={importing}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 px-4 py-2 border border-zinc-300 text-sm rounded hover:bg-zinc-50 transition-colors"
                  disabled={importing}
                >
                  Cancel
                </button>
              </div>
              {importing && (
                <p className="text-sm text-zinc-600 mt-4">Importing contacts...</p>
              )}
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showGroupModal && (
          <CreateGroupModal
            onClose={() => setShowGroupModal(false)}
            onCreate={createGroup}
          />
        )}

        {/* Add Contact Modal */}
        {showAddContact && (
          <AddContactModal
            onClose={() => setShowAddContact(false)}
            onSuccess={() => {
              setShowAddContact(false)
              loadData()
            }}
          />
        )}

        {/* Edit Contact Modal */}
        {editingContact && (
          <EditContactModal
            contact={editingContact}
            onClose={() => setEditingContact(null)}
            onSuccess={() => {
              setEditingContact(null)
              loadData()
            }}
          />
        )}

        {/* Contacts List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-zinc-200">
            <p className="text-zinc-600 mb-4">No contacts found</p>
            <button
              onClick={() => setShowImport(true)}
              className="text-sm text-black hover:underline"
            >
              Import your first contacts
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white border border-zinc-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-black">{contact.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStrengthColor(contact.connection_strength)}`}>
                        {contact.connection_strength}
                      </span>
                      <span className="px-2 py-1 text-xs bg-zinc-100 text-zinc-700 rounded">
                        {contact.stage}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-600 space-y-1">
                      {contact.email && <p>{contact.email}</p>}
                      {contact.position && <p>{contact.position}</p>}
                      {contact.company && <p>{contact.company}</p>}
                      {contact.organization && (
                        <p className="text-zinc-500">
                          Organization: {contact.organization.name}
                          {contact.organization.industry && ` • ${contact.organization.industry}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingContact(contact)}
                    className="ml-4 px-3 py-1.5 text-sm text-zinc-600 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors border border-zinc-300"
                  >
                    Edit
                  </button>
                </div>

                {contact.helpful_for && (
                  <p className="text-sm text-zinc-700 mb-3">{contact.helpful_for}</p>
                )}

                {contact.groups && contact.groups.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {contact.groups.map(group => (
                      <span
                        key={group.id}
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: `${group.color}20`, color: group.color }}
                      >
                        {group.icon} {group.name}
                      </span>
                    ))}
                  </div>
                )}

                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {contact.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-zinc-100 text-zinc-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {contact.last_contacted && (
                  <p className="text-xs text-zinc-500 mt-3">
                    Last contacted {new Date(contact.last_contacted).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AddContactModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [description, setDescription] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [x, setX] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [university, setUniversity] = useState('')
  const [connectionStrength, setConnectionStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const [stage, setStage] = useState('contacted')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
          company: company || null,
          position: position || null,
          description: description || null,
          linkedin_url: linkedin || null,
          x: x || null,
          facebook: facebook || null,
          instagram: instagram || null,
          university: university || null,
          connection_strength: connectionStrength,
          stage: stage,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        onSuccess()
      } else {
        alert(`Error: ${data.error || 'Failed to create contact'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Add Contact</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors group"
            >
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name - Required */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
            />
          </div>

          {/* Social Media - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                X (Twitter) URL
              </label>
              <input
                type="url"
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Facebook URL
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Instagram URL
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Stanford University, MIT, etc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Email and Phone - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Company and Position - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="CEO, Investor, Designer..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Strength and Stage - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Connection Strength
              </label>
              <select
                value={connectionStrength}
                onChange={(e) => setConnectionStrength(e.target.value as 'weak' | 'medium' | 'strong')}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              >
                <option value="contacted">Contacted</option>
                <option value="engaged">Engaged</option>
                <option value="active">Active</option>
                <option value="champion">Champion</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              Description
            </label>
            <p className="text-xs text-zinc-500 mb-2">Who they are and what they do</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the contact, their role, how you know them, and how they can help..."
              rows={4}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 px-4 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {submitting ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditContactModal({
  contact,
  onClose,
  onSuccess,
}: {
  contact: Contact
  onClose: () => void
  onSuccess: () => void
}) {
  // Parse notes to extract social media info
  let socialInfo: any = {}
  try {
    const notes = (contact as any).notes
    if (notes && typeof notes === 'string') {
      socialInfo = JSON.parse(notes)
    } else if (notes && typeof notes === 'object') {
      socialInfo = notes
    }
  } catch (e) {
    // If notes is not JSON, ignore
  }

  const [name, setName] = useState(contact.name || '')
  const [email, setEmail] = useState(contact.email || '')
  const [phone, setPhone] = useState((contact as any).phone || '')
  const [company, setCompany] = useState(contact.company || '')
  const [position, setPosition] = useState(contact.position || '')
  const [description, setDescription] = useState(contact.helpful_for || '')
  const [linkedin, setLinkedin] = useState((contact as any).linkedin_url || '')
  const [x, setX] = useState(socialInfo.x || '')
  const [facebook, setFacebook] = useState(socialInfo.facebook || '')
  const [instagram, setInstagram] = useState(socialInfo.instagram || '')
  const [university, setUniversity] = useState(socialInfo.university || '')
  const [connectionStrength, setConnectionStrength] = useState<'weak' | 'medium' | 'strong'>(contact.connection_strength || 'weak')
  const [stage, setStage] = useState(contact.stage || 'contacted')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contact.id,
          name,
          email: email || null,
          phone: phone || null,
          company: company || null,
          position: position || null,
          description: description || null,
          linkedin_url: linkedin || null,
          x: x || null,
          facebook: facebook || null,
          instagram: instagram || null,
          university: university || null,
          connection_strength: connectionStrength,
          stage: stage,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        onSuccess()
      } else {
        alert(`Error: ${data.error || 'Failed to update contact'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Edit Contact</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors group"
            >
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name - Required */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
            />
          </div>

          {/* Social Media - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                X (Twitter) URL
              </label>
              <input
                type="url"
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Facebook URL
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Instagram URL
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Stanford University, MIT, etc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Email and Phone - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Company and Position - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="CEO, Investor, Designer..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Strength and Stage - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Connection Strength
              </label>
              <select
                value={connectionStrength}
                onChange={(e) => setConnectionStrength(e.target.value as 'weak' | 'medium' | 'strong')}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400"
              >
                <option value="contacted">Contacted</option>
                <option value="engaged">Engaged</option>
                <option value="active">Active</option>
                <option value="champion">Champion</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              Description
            </label>
            <p className="text-xs text-zinc-500 mb-2">Who they are and what they do</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the contact, their role, how you know them, and how they can help..."
              rows={4}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white hover:border-zinc-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 px-4 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreateGroupModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, description: string, color: string, icon: string) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [icon, setIcon] = useState('📁')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name, description, color, icon)
      setName('')
      setDescription('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-black mb-4">Create Group</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Icon (emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              maxLength={2}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 border border-zinc-300 rounded cursor-pointer"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-300 text-sm rounded hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white text-sm rounded hover:bg-zinc-800 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
