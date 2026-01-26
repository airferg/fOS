'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Experiment {
  id: string
  hypothesis: string
  channel: string
  test: string
  result: string
  decision: 'Continue' | 'Stop' | 'Iterate'
  owner: string
  date: string
}

const mockExperiments: Experiment[] = [
  {
    id: '1',
    hypothesis: 'LinkedIn posts with founder stories get more engagement',
    channel: 'LinkedIn',
    test: 'Posted 5 founder story posts vs 5 product posts',
    result: 'Founder stories: 2.3x engagement, 8 demo requests vs 3',
    decision: 'Continue',
    owner: 'Sarah',
    date: '2026-01-20'
  },
  {
    id: '2',
    hypothesis: 'Cold email with video intro increases response rate',
    channel: 'Cold Email',
    test: 'Sent 100 emails with video vs 100 without',
    result: 'Video: 12% response vs 4% baseline',
    decision: 'Iterate',
    owner: 'Alex',
    date: '2026-01-18'
  },
  {
    id: '3',
    hypothesis: 'SEO content about "startup ops" drives qualified traffic',
    channel: 'SEO',
    test: 'Published 10 articles, tracked for 4 weeks',
    result: 'Low traffic (50 visits), but 40% signup rate',
    decision: 'Stop',
    owner: 'Maya',
    date: '2026-01-15'
  }
]

export default function ExperimentsLogCard() {
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments)
  const [showModal, setShowModal] = useState(false)
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null)
  const [formData, setFormData] = useState({
    hypothesis: '',
    channel: '',
    test: '',
    result: '',
    decision: 'Continue' as const,
    owner: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleAdd = () => {
    setEditingExperiment(null)
    setFormData({
      hypothesis: '',
      channel: '',
      test: '',
      result: '',
      decision: 'Continue',
      owner: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleEdit = (exp: Experiment) => {
    setEditingExperiment(exp)
    setFormData({
      hypothesis: exp.hypothesis,
      channel: exp.channel,
      test: exp.test,
      result: exp.result,
      decision: exp.decision,
      owner: exp.owner,
      date: exp.date
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (editingExperiment) {
      setExperiments(experiments.map(e => 
        e.id === editingExperiment.id ? { ...e, ...formData } : e
      ))
    } else {
      const newExp: Experiment = {
        id: Date.now().toString(),
        ...formData
      }
      setExperiments([newExp, ...experiments])
    }
    setShowModal(false)
  }

  const handleMarkComplete = (id: string) => {
    // In a real app, this would update the experiment status
    alert(`Marking experiment as complete. This would update the status in the database.`)
  }

  const getDecisionColor = (decision: string) => {
    if (decision === 'Continue') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    if (decision === 'Iterate') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
    return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  }

  return (
    <>
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">GTM Experiments Log</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">What did we try and what did we learn?</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            + New Experiment
          </button>
        </div>

        <div className="p-4">
          {experiments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">No experiments logged yet</p>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Create first experiment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Hypothesis</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Channel</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Test</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Result</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Decision</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Owner</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Date</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((exp) => (
                    <motion.tr
                      key={exp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="max-w-xs">
                          <p className="text-xs text-black dark:text-white font-medium">{exp.hypothesis}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">{exp.channel}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-xs">
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{exp.test}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-xs">
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{exp.result}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDecisionColor(exp.decision)}`}>
                          {exp.decision}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">{exp.owner}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(exp)}
                            className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleMarkComplete(exp.id)}
                            className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            Complete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
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
              className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  {editingExperiment ? 'Edit Experiment' : 'New Experiment'}
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Hypothesis
                  </label>
                  <textarea
                    value={formData.hypothesis}
                    onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                    placeholder="What are we testing?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Channel
                    </label>
                    <input
                      type="text"
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., LinkedIn"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Sarah"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Test Description
                  </label>
                  <textarea
                    value={formData.test}
                    onChange={(e) => setFormData({ ...formData, test: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                    placeholder="What did we test?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Result
                  </label>
                  <textarea
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                    placeholder="What were the results?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Decision
                    </label>
                    <select
                      value={formData.decision}
                      onChange={(e) => setFormData({ ...formData, decision: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Continue">Continue</option>
                      <option value="Stop">Stop</option>
                      <option value="Iterate">Iterate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
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
