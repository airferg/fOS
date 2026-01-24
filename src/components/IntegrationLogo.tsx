'use client'

import { useState, useEffect } from 'react'

interface IntegrationLogoProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function IntegrationLogo({ name, size = 'md', className = '' }: IntegrationLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0)
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  // Map integration names to their domain names for logo fetching
  const domainMap: Record<string, string> = {
    'Gmail': 'gmail.com',
    'Google Calendar': 'google.com',
    'Outlook': 'outlook.com',
    'Slack': 'slack.com',
    'Discord': 'discord.com',
    'Zoom': 'zoom.us',
    'Calendly': 'calendly.com',
    'Intercom': 'intercom.com',
    'Zendesk': 'zendesk.com',
    'Notion': 'notion.so',
    'Jira': 'atlassian.com',
    'Asana': 'asana.com',
    'Tally': 'tally.so',
    'Typeform': 'typeform.com',
    'GitHub': 'github.com',
    'GitLab': 'gitlab.com',
    'Vercel': 'vercel.com',
    'Stripe': 'stripe.com',
    'QuickBooks': 'quickbooks.com',
    'LinkedIn': 'linkedin.com',
    'Twitter/X': 'twitter.com',
    'Twitter': 'twitter.com',
    'Mailchimp': 'mailchimp.com',
    'HubSpot': 'hubspot.com',
    'Excel': 'microsoft.com',
  }

  const domain = domainMap[name]
  
  // Generate multiple logo URL sources to try
  const getLogoUrls = (domain: string): string[] => {
    return [
      `https://logo.clearbit.com/${domain}`, // Clearbit (primary)
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, // Google favicons
      `https://icons.duckduckgo.com/ip3/${domain}.ico`, // DuckDuckGo icons
      `https://api.faviconkit.com/${domain}/64`, // FaviconKit
    ]
  }
  
  const logoUrls = domain ? getLogoUrls(domain) : []
  const currentLogoUrl = logoUrls[currentLogoIndex]

  // Special case for Gmail - use the actual Gmail logo
  if (name === 'Gmail') {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-lg overflow-hidden bg-white dark:bg-zinc-900 flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
        </svg>
      </div>
    )
  }

  // Try to load logo from multiple sources
  if (domain && currentLogoUrl && !imageError && currentLogoIndex < logoUrls.length) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-lg overflow-hidden bg-white dark:bg-zinc-900 flex items-center justify-center relative`}>
        <img
          key={currentLogoIndex} // Force re-render when URL changes
          src={currentLogoUrl}
          alt={name}
          className="w-full h-full object-contain"
          onLoad={() => {
            console.log(`[IntegrationLogo] ✅ Successfully loaded logo for ${name} from source ${currentLogoIndex + 1}: ${currentLogoUrl}`)
            setImageLoaded(true)
          }}
          onError={() => {
            console.log(`[IntegrationLogo] ❌ Failed to load logo for ${name} from source ${currentLogoIndex + 1}: ${currentLogoUrl}`)
            // Try next logo source
            if (currentLogoIndex < logoUrls.length - 1) {
              console.log(`[IntegrationLogo] Trying next source (${currentLogoIndex + 2}/${logoUrls.length})...`)
              setCurrentLogoIndex(currentLogoIndex + 1)
              setImageLoaded(false)
            } else {
              // All sources failed, use fallback
              console.log(`[IntegrationLogo] All ${logoUrls.length} sources failed for ${name}, using fallback`)
              setImageError(true)
            }
          }}
        />
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    )
  }
  
  // Fallback to brand colors and initials
  const config = getFallbackConfig(name)
  
  return (
    <div className={`${sizeClasses[size]} ${config.bg} ${config.text} rounded-lg flex items-center justify-center font-bold ${className}`}>
      <span className={size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-sm'}>
        {config.initials}
      </span>
    </div>
  )
}

function getFallbackConfig(name: string): { bg: string; text: string; initials: string } {
  const fallbackConfig: Record<string, { bg: string; text: string; initials: string }> = {
    'Gmail': { bg: 'bg-[#EA4335]', text: 'text-white', initials: 'GM' },
    'Google Calendar': { bg: 'bg-[#4285F4]', text: 'text-white', initials: 'GC' },
    'Outlook': { bg: 'bg-[#0078D4]', text: 'text-white', initials: 'OL' },
    'Discord': { bg: 'bg-[#5865F2]', text: 'text-white', initials: 'DC' },
    'Zoom': { bg: 'bg-[#2D8CFF]', text: 'text-white', initials: 'ZM' },
    'Calendly': { bg: 'bg-[#006BFF]', text: 'text-white', initials: 'CA' },
    'Intercom': { bg: 'bg-[#1F8DED]', text: 'text-white', initials: 'IC' },
    'Zendesk': { bg: 'bg-[#03363D]', text: 'text-white', initials: 'ZD' },
    'Notion': { bg: 'bg-white', text: 'text-black', initials: 'NO' },
    'Jira': { bg: 'bg-[#0052CC]', text: 'text-white', initials: 'JI' },
    'Asana': { bg: 'bg-[#F06A6A]', text: 'text-white', initials: 'AS' },
    'Tally': { bg: 'bg-[#6366F1]', text: 'text-white', initials: 'TA' },
    'Typeform': { bg: 'bg-[#262627]', text: 'text-white', initials: 'TF' },
    'GitHub': { bg: 'bg-[#181717]', text: 'text-white', initials: 'GH' },
    'GitLab': { bg: 'bg-[#FC6D26]', text: 'text-white', initials: 'GL' },
    'Vercel': { bg: 'bg-black', text: 'text-white', initials: 'VC' },
    'Stripe': { bg: 'bg-[#635BFF]', text: 'text-white', initials: 'ST' },
    'QuickBooks': { bg: 'bg-[#2CA01C]', text: 'text-white', initials: 'QB' },
    'LinkedIn': { bg: 'bg-[#0A66C2]', text: 'text-white', initials: 'LI' },
    'Twitter/X': { bg: 'bg-[#1DA1F2]', text: 'text-white', initials: 'TW' },
    'Twitter': { bg: 'bg-[#1DA1F2]', text: 'text-white', initials: 'TW' },
    'Mailchimp': { bg: 'bg-[#FFE01B]', text: 'text-black', initials: 'MC' },
    'HubSpot': { bg: 'bg-[#FF7A59]', text: 'text-white', initials: 'HS' },
    'Excel': { bg: 'bg-[#217346]', text: 'text-white', initials: 'XL' },
  }

  return fallbackConfig[name] || { 
    bg: 'bg-zinc-200 dark:bg-zinc-800', 
    text: 'text-zinc-700 dark:text-zinc-300', 
    initials: name.substring(0, 2).toUpperCase() 
  }
}
