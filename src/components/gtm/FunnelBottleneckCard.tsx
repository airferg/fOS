'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FunnelStage {
  id: string
  name: string
  count: number
  conversionPercent: number
}

const mockFunnel: FunnelStage[] = [
  { id: '1', name: 'Visitors', count: 10000, conversionPercent: 100 },
  { id: '2', name: 'Leads', count: 500, conversionPercent: 5 },
  { id: '3', name: 'Signups', count: 150, conversionPercent: 1.5 },
  { id: '4', name: 'Activated', count: 75, conversionPercent: 0.75 },
  { id: '5', name: 'Paying', count: 25, conversionPercent: 0.25 }
]

export default function FunnelBottleneckCard() {
  const [funnel, setFunnel] = useState<FunnelStage[]>(mockFunnel)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<Record<string, number>>({})

  const calculateConversions = () => {
    return funnel.map((stage, index) => {
      if (index === 0) return { ...stage, conversionPercent: 100 }
      const prevCount = funnel[index - 1].count
      const conversionPercent = prevCount > 0 ? (stage.count / prevCount) * 100 : 0
      return { ...stage, conversionPercent }
    })
  }

  const updatedFunnel = calculateConversions()

  const findBiggestDropoff = () => {
    let maxDrop = 0
    let dropoffStage = null
    for (let i = 1; i < updatedFunnel.length; i++) {
      const drop = updatedFunnel[i - 1].conversionPercent - updatedFunnel[i].conversionPercent
      if (drop > maxDrop) {
        maxDrop = drop
        dropoffStage = updatedFunnel[i]
      }
    }
    return dropoffStage
  }

  const biggestBottleneck = findBiggestDropoff()

  const handleUpdate = () => {
    const newFunnel = funnel.map(stage => ({
      ...stage,
      count: formData[stage.id] !== undefined ? formData[stage.id] : stage.count
    }))
    setFunnel(newFunnel)
    setShowModal(false)
    setFormData({})
  }

  const handleCreateExperiment = () => {
    // This would navigate to experiments log with prefilled data
    alert(`Creating experiment from bottleneck: ${biggestBottleneck?.name}\n\nThis would open the experiments log with prefilled hypothesis.`)
  }

  return (
    <>
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">Funnel Bottleneck</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Where is the funnel breaking?</p>
          </div>
          <button
            onClick={() => {
              const initialData: Record<string, number> = {}
              funnel.forEach(stage => {
                initialData[stage.id] = stage.count
              })
              setFormData(initialData)
              setShowModal(true)
            }}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Update Numbers
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {updatedFunnel.map((stage, index) => {
              const isBottleneck = biggestBottleneck?.id === stage.id
              const prevCount = index > 0 ? updatedFunnel[index - 1].count : stage.count
              const dropoff = index > 0 ? prevCount - stage.count : 0
              const dropoffPercent = index > 0 ? ((dropoff / prevCount) * 100).toFixed(1) : '0'

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    isBottleneck
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-black dark:text-white">{stage.name}</h4>
                      {isBottleneck && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                          Biggest Drop-off
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-black dark:text-white">{stage.count.toLocaleString()}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {stage.conversionPercent.toFixed(2)}% conversion
                      </div>
                    </div>
                  </div>
                  {index > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Drop-off: {dropoff.toLocaleString()} ({dropoffPercent}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.conversionPercent}%` }}
                          transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                          className={`h-full ${
                            isBottleneck ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {biggestBottleneck && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                    Biggest Bottleneck: {biggestBottleneck.name}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Focus experiments here to improve conversion
                  </p>
                </div>
                <button
                  onClick={handleCreateExperiment}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
                >
                  Create Experiment
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Update Numbers Modal */}
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
                <h3 className="text-sm font-semibold text-black dark:text-white">Update Funnel Numbers</h3>
              </div>

              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {funnel.map((stage) => (
                  <div key={stage.id}>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      {stage.name}
                    </label>
                    <input
                      type="number"
                      value={formData[stage.id] !== undefined ? formData[stage.id] : stage.count}
                      onChange={(e) => setFormData({ ...formData, [stage.id]: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
