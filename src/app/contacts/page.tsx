'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'
import EditContactModal from '@/components/EditContactModal'

interface Contact {
  id: string
  name: string
  email: string | null
  role: string | null
  position: string | null
  company: string | null
  connection_strength: 'weak' | 'medium' | 'strong'
  last_contacted: string | null
  avatar_url?: string | null
  linkedin_url?: string | null
  notes?: string | null
  calendly_url?: string | null
  is_founder?: boolean
}

export default function NetworkPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showImportCSV, setShowImportCSV] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    position: '',
    company: '',
    roleType: '' as '' | 'investor' | 'founder' | 'advisor'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      const res = await fetch('/api/contacts')
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Error loading network data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique values for filter dropdowns
  const uniquePositions = Array.from(new Set(contacts.map(c => c.position).filter(Boolean))) as string[]
  const uniqueCompanies = Array.from(new Set(contacts.map(c => c.company).filter(Boolean))) as string[]

  const filteredContacts = contacts.filter(contact => {
    // Search query filter
    const matchesSearch = !searchQuery || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.position?.toLowerCase().includes(searchQuery.toLowerCase())

    // Position filter
    const matchesPosition = !filters.position || 
      contact.position?.toLowerCase().includes(filters.position.toLowerCase())

    // Company filter
    const matchesCompany = !filters.company || 
      contact.company?.toLowerCase().includes(filters.company.toLowerCase())

    // Role type filter
    const matchesRoleType = !filters.roleType || (() => {
      const role = (contact.role || contact.position || '').toLowerCase()
      switch (filters.roleType) {
        case 'investor':
          return role.includes('investor') || role.includes('vc') || role.includes('venture')
        case 'founder':
          return role.includes('founder') || role.includes('ceo') || role.includes('co-founder')
        case 'advisor':
          return role.includes('advisor') || role.includes('advisory')
        default:
          return true
      }
    })()

    return matchesSearch && matchesPosition && matchesCompany && matchesRoleType
  })

  const stats = {
    totalConnections: contacts.length,
    investors: contacts.filter(c => c.role === 'Investor' || c.position?.toLowerCase().includes('investor')).length,
    founders: contacts.filter(c => c.role === 'Founder' || c.position?.toLowerCase().includes('founder') || c.position?.toLowerCase().includes('ceo')).length,
    advisors: contacts.filter(c => c.role === 'Advisor' || c.position?.toLowerCase().includes('advisor')).length
  }

  const getConnectionBadge = (strength: string) => {
    switch (strength) {
      case 'strong':
        return { text: 'Hot', color: 'text-red-600 dark:text-red-400' }
      case 'medium':
        return { text: 'Warm', color: 'text-yellow-500 dark:text-yellow-400' }
      default:
        return { text: 'Cold', color: 'text-blue-600 dark:text-blue-400' }
    }
  }

  const getRoleBadge = (contact: Contact) => {
    const role = contact.role || contact.position || ''
    if (role.toLowerCase().includes('investor')) {
      return { text: 'Investor', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' }
    }
    if (role.toLowerCase().includes('founder') || role.toLowerCase().includes('ceo')) {
      return { text: 'Founder', color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' }
    }
    if (role.toLowerCase().includes('advisor')) {
      return { text: 'Advisor', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' }
    }
    return null
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleUpdateContact = async (contactId: string, updates: any) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contactId, ...updates })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update contact')
      }

      const data = await res.json()

      // Update local state
      setContacts(prev => prev.map(c => c.id === contactId ? data.contact : c))
    } catch (error: any) {
      throw error
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete contact')
      }

      // Remove from local state
      setContacts(prev => prev.filter(c => c.id !== contactId))
      setDeletingContact(null)
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      alert(error.message || 'Failed to delete contact')
    }
  }

  return (
    <AppLayout user={user}>
      <PageBackground>
        <div className="p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center justify-between"
          >
          <div>
            <h1 className="text-xl font-semibold text-black dark:text-white leading-tight">
              Network
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Manage your professional connections and relationships
            </p>
          </div>
          
          {/* Add Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add</span>
              <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowAddContact(true)
                      setShowDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Add contact</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowImportCSV(true)
                      setShowDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Import CSV</span>
                  </button>
                </div>
              </>
            )}
          </div>
          </motion.div>

          {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Total Connections</span>
            </div>
            <div className="text-2xl font-semibold text-black dark:text-white">
              {stats.totalConnections}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Investors</span>
            </div>
            <div className="text-2xl font-semibold text-black dark:text-white">
              {stats.investors}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Founders</span>
            </div>
            <div className="text-2xl font-semibold text-black dark:text-white">
              {stats.founders}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Advisors</span>
            </div>
            <div className="text-2xl font-semibold text-black dark:text-white">
              {stats.advisors}
            </div>
          </div>
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2 ${
                (filters.position || filters.company || filters.roleType) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
              {(filters.position || filters.company || filters.roleType) && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFilters(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-black dark:text-white">Filters</h3>
                    <button
                      onClick={() => {
                        setFilters({ position: '', company: '', roleType: '' })
                      }}
                      className="text-xs text-zinc-500 hover:text-black dark:hover:text-white"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Role Type Filter */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        Role Type
                      </label>
                      <select
                        value={filters.roleType}
                        onChange={(e) => setFilters({ ...filters, roleType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      >
                        <option value="">All Roles</option>
                        <option value="investor">Investor</option>
                        <option value="founder">Founder</option>
                        <option value="advisor">Advisor</option>
                      </select>
                    </div>

                    {/* Position Filter */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., CEO, CTO, Engineer"
                        value={filters.position}
                        onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>

                    {/* Company Filter */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Google, Microsoft"
                        value={filters.company}
                        onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredContacts.map((contact) => {
                const connectionBadge = getConnectionBadge(contact.connection_strength)
                const roleBadge = getRoleBadge(contact)

                return (
                  <div
                    key={contact.id}
                    className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar with initials */}
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {getInitials(contact.name)}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-black dark:text-white">
                            {contact.name}
                          </h3>
                          {roleBadge && (
                            <span className={`text-xs px-2 py-0.5 rounded ${roleBadge.color}`}>
                              {roleBadge.text}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {contact.position && contact.company ? (
                            <span>{contact.position} at {contact.company}</span>
                          ) : contact.position || contact.company || null}
                        </div>
                      </div>

                      {/* Status, Last Contact, and Actions */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Status indicator */}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            contact.connection_strength === 'strong' ? 'bg-red-500' :
                            contact.connection_strength === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}></div>
                          <span className={`text-xs ${connectionBadge.color}`}>
                            {connectionBadge.text}
                          </span>
                        </div>

                        {/* Last contact */}
                        <div className="text-right">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            Last contact
                          </div>
                          <div className="text-sm font-semibold text-black dark:text-white">
                            {formatDate(contact.last_contacted)}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {/* Message/Email button */}
                          {contact.email && (
                            <button
                              onClick={() => window.location.href = `mailto:${contact.email}`}
                              className="p-2 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Send email"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          
                          {/* LinkedIn button */}
                          {contact.linkedin_url && (
                            <a
                              href={contact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title="View LinkedIn"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                          )}

                          {/* Menu button (three dots) */}
                          <div className="relative">
                            <button
                              onClick={() => setEditingContact(contact)}
                              className="p-2 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title="More options"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        </div>

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSave={handleUpdateContact}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-4">
            <h3 className="text-sm font-semibold text-black dark:text-white mb-1.5">
              Delete Contact
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Are you sure you want to delete <span className="font-medium text-black dark:text-white">{deletingContact.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingContact(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteContact(deletingContact.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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

      {/* Import CSV Modal */}
      {showImportCSV && (
        <ImportCSVModal
          onClose={() => setShowImportCSV(false)}
          onSuccess={() => {
            setShowImportCSV(false)
            loadData()
          }}
        />
      )}
      </PageBackground>
    </AppLayout>
  )
}

// Add Contact Modal Component
function AddContactModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [connectionStrength, setConnectionStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
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
          company: company || null,
          position: position || null,
          linkedin_url: linkedin || null,
          connection_strength: connectionStrength,
          stage: 'contacted',
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
    >
      <div
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">Add Contact</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black dark:text-white mb-2">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black dark:text-white mb-2">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="CEO"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">LinkedIn URL</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">Connection Strength</label>
              <select
                value={connectionStrength}
                onChange={(e) => setConnectionStrength(e.target.value as 'weak' | 'medium' | 'strong')}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white"
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
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

// Import CSV Modal Component
function ImportCSVModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [importing, setImporting] = useState(false)
  const [useAI, setUseAI] = useState(true)

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
        onSuccess()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Import failed: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">Import LinkedIn Network</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Export your LinkedIn connections from{' '}
            <a
              href="https://www.linkedin.com/psettings/member-data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black dark:text-white underline"
            >
              LinkedIn Settings
            </a>{' '}
            and upload the CSV file here.
          </p>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-black dark:text-white">
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
            disabled={importing}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white disabled:opacity-50"
          />

          {importing && (
            <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Importing contacts...
            </div>
          )}

          <div className="flex gap-3 pt-4 mt-4">
            <button
              onClick={onClose}
              disabled={importing}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
