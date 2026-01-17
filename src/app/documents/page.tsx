'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Document {
  id: string
  title: string
  type: string
  content: string | null
  link: string | null
  status: string
  created_at: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-medium text-black">FounderOS</h1>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:text-black transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 hover:text-black transition-colors">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 hover:text-black transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-black font-medium">
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-medium text-black">Documents</h2>
          <p className="text-sm text-zinc-600 mt-1">{documents.length} documents</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">No documents yet</p>
            <p className="text-sm text-zinc-500">Ask the AI assistant to create documents for you</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 border border-zinc-200 rounded hover:border-zinc-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-black">{doc.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                        {doc.type}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                        {doc.status}
                      </span>
                    </div>
                    {doc.content && (
                      <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{doc.content}</p>
                    )}
                    <p className="text-xs text-zinc-500 mt-2">
                      Created {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {doc.link && (
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-sm text-black hover:underline"
                    >
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
