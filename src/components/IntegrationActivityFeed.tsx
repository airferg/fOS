'use client'

interface ActivityEvent {
  id: string
  type: string
  source: string
  title: string
  description?: string
  severity: 'urgent' | 'important' | 'info' | 'low'
  detectedAt: string
  processedAt?: string
  integrationIcon?: string
  severityColor?: string
  relatedAgentTask?: any
  metadata?: any
}

interface IntegrationActivityFeedProps {
  activity: ActivityEvent[]
  loading: boolean
  isOpen: boolean
  onClose: () => void
}

export default function IntegrationActivityFeed({ activity, loading, isOpen, onClose }: IntegrationActivityFeedProps) {
  if (!isOpen) return null

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent': return ''
      case 'important': return ''
      case 'low': return ''
      default: return ''
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'important': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'low': return 'bg-zinc-100 text-zinc-800 border-zinc-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getIntegrationIcon = (source: string) => {
    return ''
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-zinc-200 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-black">Integration Activity</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Recent events and triggers</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-zinc-300 border-t-black rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-500 mt-2">Loading activity...</p>
          </div>
        ) : activity.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500">No recent activity</p>
            <p className="text-xs text-zinc-400 mt-1">Integration events will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {activity.map((event) => (
              <div key={event.id} className="p-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 text-lg">
                    {event.integrationIcon || getIntegrationIcon(event.source)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                        {getSeverityIcon(event.severity)}
                      </span>
                      <span className="text-xs text-zinc-500">{formatTime(event.detectedAt)}</span>
                    </div>
                    <h4 className="text-sm font-medium text-black mb-1">{event.title}</h4>
                    {event.description && (
                      <p className="text-xs text-zinc-600 mb-2">{event.description}</p>
                    )}
                    {event.relatedAgentTask && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        <p className="font-medium mb-1">Related Action:</p>
                        <p>{event.relatedAgentTask.agent_name || 'Agent task'} - {event.relatedAgentTask.status}</p>
                      </div>
                    )}
                    {event.source && (
                      <div className="mt-2 text-xs text-zinc-400">
                        {event.source.replace(/-/g, ' ').replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50">
        <p className="text-xs text-zinc-500 text-center">
          {activity.length} {activity.length === 1 ? 'event' : 'events'} shown
        </p>
      </div>
    </div>
  )
}

