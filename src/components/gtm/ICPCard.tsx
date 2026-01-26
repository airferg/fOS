'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ICPSegment {
  id: string
  name: string
  jobToBeDone: string
  painLevel: 'low' | 'medium' | 'high'
  willingnessToPay: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  isActive: boolean
  source: 'Manual' | 'Imported from Notion' | 'From HubSpot'
}

const mockICPs: ICPSegment[] = [
  {
    id: '1',
    name: 'Early-stage SaaS Founders',
    jobToBeDone: 'Need operating system to manage startup ops without hiring team',
    painLevel: 'high',
    willingnessToPay: 'high',
    confidence: 'high',
    isActive: true,
    source: 'Manual'
  },
  {
    id: '2',
    name: 'Solo Founders',
    jobToBeDone: 'Overwhelmed by context switching between tools',
    painLevel: 'medium',
    willingnessToPay: 'medium',
    confidence: 'medium',
    isActive: false,
    source: 'Imported from Notion'
  }
]

export default function ICPCard() {
  const [icps, setIcps] = useState<ICPSegment[]>(mockICPs)
  const [showModal, setShowModal] = useState(false)
  const [editingIcp, setEditingIcp] = useState<ICPSegment | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    jobToBeDone: string
    painLevel: 'low' | 'medium' | 'high'
    willingnessToPay: 'low' | 'medium' | 'high'
    confidence: 'low' | 'medium' | 'high'
    source: 'Manual' | 'Imported from Notion' | 'From HubSpot'
  }>({
    name: '',
    jobToBeDone: '',
    painLevel: 'medium',
    willingnessToPay: 'medium',
    confidence: 'medium',
    source: 'Manual'
  })

  const handleAdd = () => {
    setEditingIcp(null)
    setFormData({
      name: '',
      jobToBeDone: '',
      painLevel: 'medium',
      willingnessToPay: 'medium',
      confidence: 'medium',
      source: 'Manual'
    })
    setShowModal(true)
  }

  const handleEdit = (icp: ICPSegment) => {
    setEditingIcp(icp)
    setFormData({
      name: icp.name,
      jobToBeDone: icp.jobToBeDone,
      painLevel: icp.painLevel,
      willingnessToPay: icp.willingnessToPay,
      confidence: icp.confidence,
      source: icp.source
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (editingIcp) {
      setIcps(icps.map(i => i.id === editingIcp.id ? { ...editingIcp, ...formData } : i))
    } else {
      const newIcp: ICPSegment = {
        id: Date.now().toString(),
        ...formData,
        isActive: false
      }
      setIcps([...icps, newIcp])
    }
    setShowModal(false)
  }

  const handleSetActive = (id: string) => {
    setIcps(icps.map(i => ({ ...i, isActive: i.id === id })))
  }

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'high') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    if (confidence === 'medium') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
    return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  }

  const activeIcp = icps.find(i => i.isActive)

  return (
    <>
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">ICP (Target Customer)</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Who are we targeting?</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            + Add Segment
          </button>
        </div>

        <div className="p-4">
          {icps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">No ICP segments defined</p>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Create first ICP
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {icps.map((icp) => (
                <motion.div
                  key={icp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border ${
                    icp.isActive
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-black dark:text-white">{icp.name}</h4>
                        {icp.isActive && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded">
                            Active
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(icp.confidence)}`}>
                          {icp.confidence} confidence
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{icp.jobToBeDone}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Pain: <span className="font-medium text-black dark:text-white capitalize">{icp.painLevel}</span>
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          WTP: <span className="font-medium text-black dark:text-white capitalize">{icp.willingnessToPay}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(icp)}
                        className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      {!icp.isActive && (
                        <button
                          onClick={() => handleSetActive(icp.id)}
                          className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Source: {icp.source}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
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
                  {editingIcp ? 'Edit ICP' : 'Add ICP Segment'}
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Segment Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Early-stage SaaS Founders"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Job-to-be-Done
                  </label>
                  <textarea
                    value={formData.jobToBeDone}
                    onChange={(e) => setFormData({ ...formData, jobToBeDone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                    placeholder="What job are they hiring your product to do?"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Pain Level
                    </label>
                    <select
                      value={formData.painLevel}
                      onChange={(e) => setFormData({ ...formData, painLevel: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Willingness to Pay
                    </label>
                    <select
                      value={formData.willingnessToPay}
                      onChange={(e) => setFormData({ ...formData, willingnessToPay: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Confidence
                    </label>
                    <select
                      value={formData.confidence}
                      onChange={(e) => setFormData({ ...formData, confidence: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Imported from Notion">Imported from Notion</option>
                    <option value="From HubSpot">From HubSpot</option>
                  </select>
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
    </>
  )
}
