'use client'

interface ProactiveAIMessageProps {
  message: string
  onAccept: () => void
  onDismiss: () => void
}

export default function ProactiveAIMessage({ message, onAccept, onDismiss }: ProactiveAIMessageProps) {
  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm animate-in slide-in-from-top-5 duration-300">
      <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-black dark:text-white">Founder.ai</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Just now</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-black dark:text-white mb-4 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-sm text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Maybe later
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-1.5 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
          >
            Let's chat
          </button>
        </div>
      </div>
    </div>
  )
}

