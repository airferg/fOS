'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SlackNotification {
  id: string
  senderName: string
  senderAvatar?: string
  channel: string
  message: string
}

// Hardcoded Slack notifications
const hardcodedNotifications: SlackNotification[] = [
  {
    id: '1',
    senderName: 'Kean',
    channel: '#general',
    message: 'Hey team, just got off the call with Sequoia - they want a follow-up!',
  },
  {
    id: '2',
    senderName: 'Sarah',
    channel: '#product',
    message: 'The new feature is ready for review. Can someone take a look?',
  },
  {
    id: '3',
    senderName: 'Alex',
    channel: '#finance',
    message: 'Monthly burn rate report is ready. We\'re on track for Q1 goals.',
  },
  {
    id: '4',
    senderName: 'Maya',
    channel: '#legal',
    message: 'Contract review completed. Ready for signatures.',
  },
]

export default function SlackNotificationPopup() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let showTimeout: NodeJS.Timeout
    let hideTimeout: NodeJS.Timeout

    const cycleNotifications = () => {
      // Show notification for 10 seconds
      setIsVisible(true)
      
      // After 10 seconds, fade out
      hideTimeout = setTimeout(() => {
        setIsVisible(false)
        
        // After fade out completes (500ms), change notification and wait 10 seconds
        showTimeout = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % hardcodedNotifications.length)
          setIsVisible(true)
          
          // Schedule next cycle
          setTimeout(cycleNotifications, 10000)
        }, 10500) // 500ms fade out + 10 seconds hidden
      }, 10000) // Show for 10 seconds
    }

    // Start the cycle
    cycleNotifications()

    return () => {
      if (showTimeout) clearTimeout(showTimeout)
      if (hideTimeout) clearTimeout(hideTimeout)
    }
  }, [])

  const currentNotification = hardcodedNotifications[currentIndex]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="w-full mb-4 min-h-[72px]">
      <AnimatePresence mode="wait">
        {isVisible ? (
          <motion.div
            key={currentNotification.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="bg-white dark:bg-zinc-50 rounded-lg shadow-sm p-3 flex items-center gap-3 border border-zinc-200 dark:border-zinc-200 max-w-full"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {currentNotification.senderAvatar ? (
                <img
                  src={currentNotification.senderAvatar}
                  alt={currentNotification.senderName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center text-white text-xs font-medium">
                  {getInitials(currentNotification.senderName)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-900">
                  {currentNotification.senderName}
                </span>
                <span className="text-xs text-orange-500 dark:text-orange-500">
                  in {currentNotification.channel}
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-700 line-clamp-2 leading-snug">
                {currentNotification.message}
              </p>
            </div>

            {/* View Button */}
            <button className="flex-shrink-0 text-sm font-medium text-orange-500 dark:text-orange-500 hover:text-orange-600 dark:hover:text-orange-600 transition-colors">
              View
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="h-[72px]"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
