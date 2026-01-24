'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Check } from '@/components/ui/icons'

interface Investor {
  name: string
  firm?: string
  investment_amount: number
  equity_percent: number
  investor_type: string
  equity_type: string
  is_lead: boolean
}

interface AddFundingRoundModalProps {
  onClose: () => void
  onSave: (round: any) => Promise<void>
}

export default function AddFundingRoundModal({ onClose, onSave }: AddFundingRoundModalProps) {
  const [formData, setFormData] = useState({
    round_name: '',
    round_type: 'Pre-Seed',
    amount_raised: 0,
    close_date: new Date().toISOString().split('T')[0],
    status: 'raising' as 'planned' | 'raising' | 'closed',
    lead_investor: '',
  })
  const [investors, setInvestors] = useState<Investor[]>([])
  const [showInvestorForm, setShowInvestorForm] = useState(false)
  const [currentInvestor, setCurrentInvestor] = useState<Partial<Investor>>({
    name: '',
    firm: '',
    investment_amount: 0,
    equity_percent: 0,
    investor_type: 'angel',
    equity_type: 'equity',
    is_lead: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddInvestor = () => {
    if (currentInvestor.name && currentInvestor.investment_amount) {
      setInvestors([...investors, currentInvestor as Investor])
      setCurrentInvestor({
        name: '',
        firm: '',
        investment_amount: 0,
        equity_percent: 0,
        investor_type: 'angel',
        equity_type: 'equity',
        is_lead: false
      })
      setShowInvestorForm(false)
    }
  }

  const handleRemoveInvestor = (index: number) => {
    setInvestors(investors.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const roundData = { ...formData, investors }
      await onSave(roundData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add funding round')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
        >
          <h2 className="text-xl font-bold text-black dark:text-white">Add Funding Round</h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </motion.button>
        </motion.div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Round Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-xs font-semibold text-black dark:text-white mb-2">
                Round Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.round_name}
                onChange={(e) => setFormData({ ...formData, round_name: e.target.value })}
                placeholder="e.g., Seed Round, Series A, Bridge Financing"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-900 text-black dark:text-white transition-all"
              />
            </motion.div>

            {/* Round Type & Amount Row */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-xs font-semibold text-black dark:text-white mb-2">
                  Round Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.round_type}
                  onChange={(e) => setFormData({ ...formData, round_type: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-900 text-black dark:text-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Series C">Series C</option>
                  <option value="Bridge">Bridge</option>
                  <option value="other">Other</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="block text-xs font-semibold text-black dark:text-white mb-2">
                  Amount Raised <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount_raised || ''}
                  onChange={(e) => setFormData({ ...formData, amount_raised: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-900 text-black dark:text-white transition-all"
                />
              </motion.div>
            </div>

            {/* Close Date & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-semibold text-black dark:text-white mb-2">
                  Close Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={formData.close_date}
                    onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-900 text-black dark:text-white transition-all"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block text-xs font-semibold text-black dark:text-white mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-900 text-black dark:text-white transition-all appearance-none cursor-pointer"
                >
                  <option value="planned">Planned</option>
                  <option value="raising">Raising</option>
                  <option value="closed">Closed</option>
                </select>
              </motion.div>
            </div>

            {/* Investors Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-black dark:text-white">
                  Investors
                </label>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInvestorForm(!showInvestorForm)}
                  className="px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  {showInvestorForm ? 'Cancel' : '+ Add Investor'}
                </motion.button>
              </div>

              {/* Investor Form */}
              <AnimatePresence>
                {showInvestorForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3 mb-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Investor Name *"
                          value={currentInvestor.name || ''}
                          onChange={(e) => setCurrentInvestor({ ...currentInvestor, name: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-800 text-black dark:text-white transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Firm (optional)"
                          value={currentInvestor.firm || ''}
                          onChange={(e) => setCurrentInvestor({ ...currentInvestor, firm: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-800 text-black dark:text-white transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Amount *"
                          value={currentInvestor.investment_amount || ''}
                          onChange={(e) => setCurrentInvestor({ ...currentInvestor, investment_amount: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-800 text-black dark:text-white transition-all"
                        />
                        <input
                          type="number"
                          placeholder="Equity %"
                          step="0.01"
                          value={currentInvestor.equity_percent || ''}
                          onChange={(e) => setCurrentInvestor({ ...currentInvestor, equity_percent: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-800 text-black dark:text-white transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={currentInvestor.investor_type || 'angel'}
                          onChange={(e) => setCurrentInvestor({ ...currentInvestor, investor_type: e.target.value })}
                          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-800 text-black dark:text-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="angel">Angel</option>
                          <option value="angel_network">Angel Network</option>
                          <option value="vc">VC</option>
                          <option value="corporate">Corporate</option>
                          <option value="strategic">Strategic</option>
                          <option value="grant">Grant</option>
                        </select>
                        <select
                          value={currentInvestor.equity_type || 'equity'}
                          onChange={(e) => setCurrentInvestor({ ...currentInvestor, equity_type: e.target.value })}
                          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 dark:focus:ring-orange-400/50 dark:focus:border-orange-400 bg-white dark:bg-zinc-800 text-black dark:text-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="equity">Equity</option>
                          <option value="convertible_note">Convertible Note</option>
                          <option value="safe">SAFE</option>
                          <option value="spac">SPAC</option>
                          <option value="debt">Debt</option>
                          <option value="grant">Grant</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_lead"
                          checked={currentInvestor.is_lead || false}
                          onChange={(e) => setCurrentInvestor({ ...currentInvestor, is_lead: e.target.checked })}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-orange-500 focus:ring-orange-500/50 cursor-pointer"
                        />
                        <label htmlFor="is_lead" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                          Lead Investor
                        </label>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddInvestor}
                        className="w-full px-3 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
                      >
                        Add Investor
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Investors List */}
              <AnimatePresence>
                {investors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 mb-3"
                  >
                    {investors.map((inv, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors group"
                      >
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-black dark:text-white mb-1">
                            {inv.name} {inv.firm && <span className="text-zinc-500 dark:text-zinc-400">({inv.firm})</span>}
                            {inv.is_lead && (
                              <span className="ml-2 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-[10px] font-medium">
                                Lead
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            ${inv.investment_amount.toLocaleString()} • {inv.equity_percent}% • {inv.equity_type.replace('_', ' ')}
                          </div>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveInvestor(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Footer Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || !formData.round_name.trim()}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Adding...' : 'Add Round'}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

