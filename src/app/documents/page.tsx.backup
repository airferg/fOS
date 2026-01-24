'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface Document {
  id: string
  title: string
  type: string
  content: string | null
  link: string | null
  status: string
  created_at: string
}

const getDocumentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'google doc':
    case 'document':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'email':
    case 'draft':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    case 'presentation':
    case 'deck':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    case 'spreadsheet':
    case 'sheet':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase()
  if (statusLower === 'completed' || statusLower === 'done') {
    return 'bg-green-50 text-green-700 border-green-200'
  } else if (statusLower === 'draft' || statusLower === 'pending') {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  } else if (statusLower === 'in_progress') {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:border-zinc-800'
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-zinc-950/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 sticky top-0 z-50 transition-all duration-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <img src="/fOS.png" alt="fOS" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Network
            </Link>
            <Link href="/documents" className="text-black dark:text-white dark:text-black dark:text-white dark:text-black font-bold relative">
              Documents
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black dark:bg-white dark:bg-white dark:bg-zinc-950 rounded-full"></span>
            </Link>
            <Link href="/integrations" className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors duration-200 font-medium">
              Integrations
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-black dark:text-white dark:text-black mb-2">Documents</h2>
              <p className="text-sm text-zinc-600 font-medium">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </p>
            </div>
            {documents.length > 0 && (
              <button
                onClick={loadDocuments}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 hover:shadow-lg flex items-center gap-2 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-24 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
            </div>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-6">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-black dark:text-white dark:text-black mb-2">No documents yet</h3>
            <p className="text-sm text-zinc-600 max-w-md mx-auto mb-6">
              Ask the AI assistant to create documents for you. Documents created through integrations will appear here.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 hover:shadow-lg group"
            >
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          /* Documents Grid */
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                onMouseEnter={() => setHoveredId(doc.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-black dark:text-white dark:text-black transition-all duration-300 group-hover:bg-black dark:bg-white group-hover:text-white dark:text-black`}>
                    {getDocumentIcon(doc.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-black dark:text-white dark:text-black mb-2 group-hover:text-zinc-900 transition-colors duration-200 truncate">
                          {doc.title}
                        </h3>
                        {doc.content && (
                          <p className="text-sm text-zinc-600 line-clamp-2 mb-3 leading-relaxed">
                            {doc.content}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {doc.link && (
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${hoveredId === doc.id ? 'opacity-100' : 'opacity-0'}`}>
                          <a
                            href={doc.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-all duration-200 hover:shadow-md flex items-center gap-2 group/btn"
                          >
                            <span>Open</span>
                            <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getStatusBadge(doc.status)} transition-colors duration-200`}>
                        {doc.status}
                      </span>
                      <span className="text-xs font-medium text-zinc-500 px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200 dark:border-zinc-800">
                        {doc.type}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">
                        {formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-black dark:bg-white rounded-b-xl transition-transform duration-300 ${hoveredId === doc.id ? 'scale-x-100' : 'scale-x-0'}`}></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
