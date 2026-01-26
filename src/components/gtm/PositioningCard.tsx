'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageVariant {
  id: string
  headline: string
  oneLiner: string
  status: 'Draft' | 'Testing' | 'Winner'
  resonanceScore: number
  notes: string
  evidence: string
}

const mockMessages: MessageVariant[] = [
  {
    id: '1',
    headline: 'The Operating System for Early-Stage Founders',
    oneLiner: 'All your startup ops in one place. No context switching.',
    status: 'Winner',
    resonanceScore: 8.5,
    notes: 'Tested in 5 LinkedIn posts, highest engagement',
    evidence: 'LinkedIn post got 2.3x avg engagement, 12 demo requests'
  },
  {
    id: '2',
    headline: 'Stop Context Switching Between 20 Tools',
    oneLiner: 'Hydra brings your entire startup stack into one OS.',
    status: 'Testing',
    resonanceScore: 6.2,
    notes: 'Currently A/B testing in cold emails',
    evidence: ''
  },
  {
    id: '3',
    headline: 'Your Startup Command Center',
    oneLiner: 'Everything a founder needs to run their startup, unified.',
    status: 'Draft',
    resonanceScore: 0,
    notes: 'Ready to test next week',
    evidence: ''
  }
]

export default function PositioningCard() {
  const [messages, setMessages] = useState<MessageVariant[]>(mockMessages)
  const [showModal, setShowModal] = useState(false)
  const [showEvidenceModal, setShowEvidenceModal] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<MessageVariant | null>(null)
  const [formData, setFormData] = useState({
    headline: '',
    oneLiner: '',
    notes: '',
    evidence: ''
  })

  const calculateResonanceScore = (message: MessageVariant): number => {
    // Mock calculation based on status and evidence
    if (message.status === 'Winner') return 8.5
    if (message.status === 'Testing' && message.evidence) return 6.2
    if (message.status === 'Testing') return 5.0
    return 0
  }

  const handleAdd = () => {
    setEditingMessage(null)
    setFormData({ headline: '', oneLiner: '', notes: '', evidence: '' })
    setShowModal(true)
  }

  const handleEdit = (message: MessageVariant) => {
    setEditingMessage(message)
    setFormData({
      headline: message.headline,
      oneLiner: message.oneLiner,
      notes: message.notes,
      evidence: message.evidence
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (editingMessage) {
      const updated = { ...editingMessage, ...formData }
      setMessages(messages.map(m => 
        m.id === editingMessage.id 
          ? { ...updated, resonanceScore: calculateResonanceScore(updated) }
          : m
      ))
    } else {
      const newMessage: MessageVariant = {
        id: Date.now().toString(),
        ...formData,
        status: 'Draft',
        resonanceScore: 0,
        evidence: ''
      }
      setMessages([...messages, newMessage])
    }
    setShowModal(false)
  }

  const handleMarkWinner = (id: string) => {
    setMessages(messages.map(m => {
      const updated = {
        ...m,
        status: m.id === id ? 'Winner' : (m.status === 'Winner' ? 'Testing' : m.status)
      }
      return { ...updated, resonanceScore: calculateResonanceScore(updated) }
    }))
  }

  const getStatusColor = (status: string) => {
    if (status === 'Winner') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    if (status === 'Testing') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
  }

  return (
    <>
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">Positioning & Messaging</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">What message is resonating?</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            + Add Message
          </button>
        </div>

        <div className="p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">No message variants yet</p>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Create first message
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                        {message.resonanceScore > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Resonance:</span>
                            <span className="text-xs font-medium text-black dark:text-white">{message.resonanceScore}/10</span>
                            <svg
                              className="w-3 h-3 text-zinc-400 cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              title="Resonance score is placeholder based on qualitative signals"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-black dark:text-white mb-1">{message.headline}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{message.oneLiner}</p>
                      {message.notes && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mb-2">{message.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(message)}
                        className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      {message.status !== 'Winner' && (
                        <button
                          onClick={() => handleMarkWinner(message.id)}
                          className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          Mark Winner
                        </button>
                      )}
                      <button
                        onClick={() => setShowEvidenceModal(message.id)}
                        className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Evidence
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  {editingMessage ? 'Edit Message' : 'Add Message Variant'}
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., The Operating System for Early-Stage Founders"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    One-Liner
                  </label>
                  <input
                    type="text"
                    value={formData.oneLiner}
                    onChange={(e) => setFormData({ ...formData, oneLiner: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Short description"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                    placeholder="Testing notes, context, etc."
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evidence Modal */}
      <AnimatePresence>
        {showEvidenceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEvidenceModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-black dark:text-white">Attach Evidence</h3>
              </div>

              <div className="p-4">
                <textarea
                  value={messages.find(m => m.id === showEvidenceModal)?.evidence || ''}
                  onChange={(e) => {
                    setMessages(messages.map(m => 
                      m.id === showEvidenceModal ? { ...m, evidence: e.target.value } : m
                    ))
                  }}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={6}
                  placeholder="Add evidence, metrics, qualitative feedback, etc."
                />
              </div>

              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowEvidenceModal(null)}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
