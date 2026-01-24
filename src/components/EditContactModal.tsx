'use client'

import { useState, useEffect } from 'react'

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

interface SocialInfo {
  x?: string
  facebook?: string
  instagram?: string
  twitter?: string
}

interface EditContactModalProps {
  contact: Contact
  onClose: () => void
  onSave: (contactId: string, updates: any) => Promise<void>
}

export default function EditContactModal({ contact, onClose, onSave }: EditContactModalProps) {
  const [formData, setFormData] = useState({
    name: contact.name || '',
    email: contact.email || '',
    avatar_url: contact.avatar_url || '',
    company: contact.company || '',
    position: contact.position || '',
    role: contact.role || '',
    connection_strength: contact.connection_strength || 'weak',
    linkedin_url: contact.linkedin_url || '',
    calendly_url: contact.calendly_url || '',
    is_founder: contact.is_founder || false,
    x: '',
    facebook: '',
    instagram: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Parse social media from notes field
  useEffect(() => {
    if (contact.notes) {
      try {
        const socialInfo: SocialInfo = JSON.parse(contact.notes)
        setFormData(prev => ({
          ...prev,
          x: socialInfo.x || socialInfo.twitter || '',
          facebook: socialInfo.facebook || '',
          instagram: socialInfo.instagram || ''
        }))
      } catch (e) {
        // Notes is not JSON, ignore
      }
    }
  }, [contact.notes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onSave(contact.id, formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Edit Contact
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Profile Photo URL */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Profile Photo URL
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Position
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Relationship
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Investor, Advisor, Partner"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Connection Status
            </label>
            <select
              value={formData.connection_strength}
              onChange={(e) => setFormData({ ...formData, connection_strength: e.target.value as 'weak' | 'medium' | 'strong' })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weak">Cold</option>
              <option value="medium">Warm</option>
              <option value="strong">Hot</option>
            </select>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-black dark:text-white">Social Media</h4>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                X (Twitter) URL
              </label>
              <input
                type="url"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                placeholder="https://x.com/username"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calendly Link */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Calendly Link
            </label>
            <input
              type="url"
              value={formData.calendly_url}
              onChange={(e) => setFormData({ ...formData, calendly_url: e.target.value })}
              placeholder="https://calendly.com/username"
              className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Is Founder Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_founder"
              checked={formData.is_founder}
              onChange={(e) => setFormData({ ...formData, is_founder: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_founder" className="text-sm text-black dark:text-white cursor-pointer">
              This person is a founder
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
