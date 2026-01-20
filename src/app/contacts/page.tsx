'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

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
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
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


  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getConnectionStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-50 text-green-700 border-green-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'weak': return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:border-zinc-800'
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:border-zinc-800'
    }
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'champion': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'active': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'engaged': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'contacted': return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:border-zinc-800'
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:border-zinc-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-zinc-950/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 sticky top-0 z-50 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <img src="/fOS.png" alt="fOS" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-black dark:text-white dark:text-black dark:text-white dark:text-black font-bold relative">
              Network
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black dark:bg-white dark:bg-white dark:bg-zinc-950 rounded-full"></span>
            </Link>
            <Link href="/documents" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Documents
            </Link>
            <Link href="/integrations" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Integrations
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-black dark:text-white dark:text-black mb-2">Network</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGroupModal(true)}
                className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 text-sm font-semibold rounded-lg hover:bg-zinc-50 hover:shadow-sm transition-all duration-200"
              >
                New Group
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 text-sm font-semibold rounded-lg hover:bg-zinc-50 hover:shadow-sm transition-all duration-200"
              >
                Import CSV
              </button>
              <button
                onClick={() => setShowAddContact(true)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 hover:shadow-lg transition-all duration-200 flex items-center gap-2 group"
              >
                <span>Add Contact</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
            />

            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
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
              className="px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
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
              className="px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
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
              className="px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
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
          <div className="mb-6 animate-in fade-in slide-in-from-left-2 duration-500">
            <h3 className="text-sm font-semibold text-black dark:text-white dark:text-black mb-3">Groups</h3>
            <div className="flex gap-2 flex-wrap">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(selectedGroup === group.id ? 'all' : group.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedGroup === group.id
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 border border-zinc-300 hover:bg-zinc-50 hover:shadow-sm'
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
          <div className="fixed inset-0 bg-black dark:bg-white bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-black dark:text-white dark:text-black mb-4">Import LinkedIn Network</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Export your LinkedIn connections from{' '}
                <a
                  href="https://www.linkedin.com/psettings/member-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black dark:text-white dark:text-black underline"
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
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">Importing contacts...</p>
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
          <div className="flex items-center justify-center py-24 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-6">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-black dark:text-white dark:text-black mb-2">No contacts yet</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-6">
              Start building your network by adding contacts or importing from LinkedIn.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 text-black dark:text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-50 transition-all duration-200 hover:shadow-sm group"
              >
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import CSV
              </button>
              <button
                onClick={() => setShowAddContact(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 hover:shadow-lg group"
              >
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contact
              </button>
            </div>
          </div>
        ) : (
          /* Contacts Grid */
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                onMouseEnter={() => setHoveredId(contact.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-black dark:text-white dark:text-black transition-all duration-300 group-hover:bg-black dark:bg-white group-hover:text-white dark:text-black">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-base font-bold text-black dark:text-white dark:text-black group-hover:text-zinc-900 transition-colors duration-200">
                            {contact.name}
                          </h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors duration-200 ${getConnectionStrengthBadge(contact.connection_strength)}`}>
                            {contact.connection_strength}
                          </span>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors duration-200 ${getStageBadge(contact.stage)}`}>
                            {contact.stage}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mb-3">
                          {contact.email && (
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {contact.email}
                            </p>
                          )}
                          {contact.position && contact.company && (
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {contact.position} {contact.company && `at ${contact.company}`}
                            </p>
                          )}
                          {contact.organization && (
                            <p className="text-xs text-zinc-500">
                              {contact.organization.name}
                              {contact.organization.industry && ` • ${contact.organization.industry}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex items-center gap-2 transition-opacity duration-300 ${hoveredId === contact.id ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                          onClick={() => setEditingContact(contact)}
                          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 hover:shadow-md flex items-center gap-2 group/btn"
                        >
                          <span>Edit</span>
                          <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {contact.helpful_for && (
                      <p className="text-sm text-zinc-700 mb-3 leading-relaxed">{contact.helpful_for}</p>
                    )}

                    {/* Tags and Groups */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {contact.groups && contact.groups.length > 0 && (
                        <>
                          {contact.groups.map(group => (
                            <span
                              key={group.id}
                              className="text-xs font-medium px-2.5 py-1 rounded-md border"
                              style={{ backgroundColor: `${group.color}15`, borderColor: `${group.color}40`, color: group.color }}
                            >
                              {group.icon} {group.name}
                            </span>
                          ))}
                        </>
                      )}
                      {contact.tags && contact.tags.length > 0 && (
                        <>
                          {contact.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium px-2.5 py-1 bg-zinc-100 text-zinc-600 dark:text-zinc-400 rounded-md border border-zinc-200 dark:border-zinc-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Last Contacted */}
                    {contact.last_contacted && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Last contacted {formatDate(contact.last_contacted)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-black dark:bg-white rounded-b-xl transition-transform duration-300 ${hoveredId === contact.id ? 'scale-x-100' : 'scale-x-0'}`}></div>
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
      className="fixed inset-0 bg-black dark:bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black dark:text-white dark:text-black">Add Contact</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors group"
            >
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-black dark:text-white dark:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
            />
          </div>

          {/* Social Media - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                X (Twitter) URL
              </label>
              <input
                type="url"
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Facebook URL
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Instagram URL
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Stanford University, MIT, etc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Email and Phone - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Company and Position - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="CEO, Investor, Designer..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Strength and Stage - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Connection Strength
              </label>
              <select
                value={connectionStrength}
                onChange={(e) => setConnectionStrength(e.target.value as 'weak' | 'medium' | 'strong')}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
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
            <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
              Description
            </label>
            <p className="text-xs text-zinc-500 mb-2">Who they are and what they do</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the contact, their role, how you know them, and how they can help..."
              rows={4}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
              className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
      className="fixed inset-0 bg-black dark:bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black dark:text-white dark:text-black">Edit Contact</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors group"
            >
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-black dark:text-white dark:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
            />
          </div>

          {/* Social Media - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                X (Twitter) URL
              </label>
              <input
                type="url"
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Facebook URL
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Instagram URL
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Stanford University, MIT, etc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Email and Phone - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Company and Position - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="CEO, Investor, Designer..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              />
            </div>
          </div>

          {/* Strength and Stage - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Connection Strength
              </label>
              <select
                value={connectionStrength}
                onChange={(e) => setConnectionStrength(e.target.value as 'weak' | 'medium' | 'strong')}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400"
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
            <label className="block text-sm font-semibold text-black dark:text-white dark:text-black">
              Description
            </label>
            <p className="text-xs text-zinc-500 mb-2">Who they are and what they do</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the contact, their role, how you know them, and how they can help..."
              rows={4}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-950 hover:border-zinc-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
              className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
    <div className="fixed inset-0 bg-black dark:bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-black dark:text-white dark:text-black mb-4">Create Group</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-black dark:text-white dark:text-black mb-2">
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
            <label className="block text-sm font-medium text-black dark:text-white dark:text-black mb-2">
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
            <label className="block text-sm font-medium text-black dark:text-white dark:text-black mb-2">
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
            <label className="block text-sm font-medium text-black dark:text-white dark:text-black mb-2">
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
              className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm rounded hover:bg-zinc-800 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
