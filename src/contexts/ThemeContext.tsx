'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    setMounted(true)
    
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null
    let initialTheme: Theme = 'light'
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      initialTheme = savedTheme
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      initialTheme = prefersDark ? 'dark' : 'light'
    }
    
    setTheme(initialTheme)
    
    // Apply theme to document
    const root = document.documentElement
    if (initialTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    if (typeof window === 'undefined') {
      console.warn('[ThemeProvider] Cannot toggle theme on server')
      return
    }
    
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('[ThemeProvider] Toggling theme from', theme, 'to', newTheme)
    
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Apply theme to document immediately
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
      console.log('[ThemeProvider] Added dark class to root')
    } else {
      root.classList.remove('dark')
      console.log('[ThemeProvider] Removed dark class from root')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

