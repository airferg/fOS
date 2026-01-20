'use client'

import { useState } from 'react'

interface Approval {
  id: string
  approval_type: string
  action_type: string
  title: string
  description?: string
  preview_data: any
  action_data: any
  agent_task_id?: string
  created_at: string
  expires_at?: string
}

interface ApprovalModalProps {
  approval: Approval | null
  onClose: () => void
  onApprove: (approvalId: string, modifiedData?: any) => Promise<void>
  onReject: (approvalId: string, reason?: string) => Promise<void>
}

export default function ApprovalModal({ approval, onClose, onApprove, onReject }: ApprovalModalProps) {
  const [showModify, setShowModify] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [modifiedData, setModifiedData] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  if (!approval) return null

  const preview = approval.preview_data || {}
  const isEmail = approval.approval_type === 'send_email' || approval.action_type === 'send_email'

  const handleApprove = async () => {
    setProcessing(true)
    try {
      await onApprove(approval.id, modifiedData || approval.action_data)
      onClose()
    } catch (error) {
      console.error('Error approving:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    setProcessing(true)
    try {
      await onReject(approval.id, rejectionReason)
      onClose()
    } catch (error) {
      console.error('Error rejecting:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleModify = () => {
    if (isEmail) {
      setModifiedData({
        ...approval.action_data.params,
        subject: preview.subject || approval.action_data.params?.subject,
        body: preview.body || approval.action_data.params?.body,
        to: preview.to || approval.action_data.params?.to,
        cc: preview.cc || approval.action_data.params?.cc,
        bcc: preview.bcc || approval.action_data.params?.bcc,
      })
    }
    setShowModify(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Action Requires Approval</h2>
            <p className="text-sm text-zinc-600 mt-1">{approval.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {approval.description && (
            <div className="mb-4 p-3 bg-zinc-50 rounded-lg">
              <p className="text-sm text-zinc-700">{approval.description}</p>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-black">Preview</h3>
            
            {isEmail && (
              <div className="border border-zinc-200 rounded-lg p-4 bg-white">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-zinc-500 uppercase">To</span>
                    <p className="text-sm text-black mt-1">{preview.to || approval.action_data.params?.to}</p>
                  </div>
                  {preview.cc && (
                    <div>
                      <span className="text-xs font-medium text-zinc-500 uppercase">CC</span>
                      <p className="text-sm text-black mt-1">{preview.cc}</p>
                    </div>
                  )}
                  {preview.bcc && (
                    <div>
                      <span className="text-xs font-medium text-zinc-500 uppercase">BCC</span>
                      <p className="text-sm text-black mt-1">{preview.bcc}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium text-zinc-500 uppercase">Subject</span>
                    <p className="text-sm text-black mt-1">{showModify && modifiedData ? modifiedData.subject : (preview.subject || approval.action_data.params?.subject)}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-500 uppercase">Body</span>
                    <div className="mt-2 text-sm text-black whitespace-pre-wrap border border-zinc-200 rounded p-3 bg-zinc-50 max-h-60 overflow-y-auto">
                      {showModify && modifiedData ? modifiedData.body : (preview.body || approval.action_data.params?.body)}
                    </div>
                  </div>
                  {preview.recipientsCount > 1 && (
                    <div className="pt-2 border-t border-zinc-200">
                      <p className="text-xs text-amber-600">
                        ⚠️ This email will be sent to {preview.recipientsCount} recipients
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isEmail && (
              <div className="border border-zinc-200 rounded-lg p-4 bg-white">
                <pre className="text-xs text-zinc-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            )}

            {/* Modify Section */}
            {showModify && isEmail && (
              <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="text-sm font-semibold text-black mb-3">Modify Content</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={modifiedData.subject || ''}
                      onChange={(e) => setModifiedData({ ...modifiedData, subject: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Body</label>
                    <textarea
                      value={modifiedData.body || ''}
                      onChange={(e) => setModifiedData({ ...modifiedData, body: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rejection Reason */}
          {!showModify && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Rejection Reason (optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Why are you rejecting this action?"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {approval.expires_at && new Date(approval.expires_at) > new Date() && (
              <span>Expires {new Date(approval.expires_at).toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!showModify ? (
              <>
                <button
                  onClick={handleModify}
                  disabled={processing || !isEmail}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Modify
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowModify(false)
                    setModifiedData(null)
                  }}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Saving...' : 'Approve Modified'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

