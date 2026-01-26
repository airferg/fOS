'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import AIChatAssistant from './AIChatAssistant'
import { Icons, IconName } from './Icons'
import HydraLogo from './HydraLogo'

interface User {
  name: string
  email: string
  avatar_url?: string
}

interface AppLayoutProps {
  children: React.ReactNode
  user?: User
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigation: Array<{ name: string; href: string; icon: IconName }> = [
    { name: 'Overview', href: '/dashboard', icon: 'Overview' },
    { name: 'Workspace', href: '/workspace', icon: 'Workspace' },
    { name: 'Product', href: '/research', icon: 'Research' },
    { name: 'Team & Equity', href: '/team', icon: 'Team' },
    { name: 'Network', href: '/contacts', icon: 'Network' },
    { name: 'Investors & Funding', href: '/funding', icon: 'Funding' },
    { name: 'Compliance', href: '/legal', icon: 'Legal' },
    { name: 'Tools', href: '/tools', icon: 'Tools' },
    { name: 'GTM', href: '/marketing', icon: 'Marketing' },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Left Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300`}
      >
        {/* Logo / Brand */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <HydraLogo size="lg" showText={false} animate={false} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {navigation.map((item) => {
              const active = isActive(item.href)
              const IconComponent = Icons[item.icon]
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center ${sidebarOpen ? 'gap-2 px-2.5' : 'justify-center px-0'} py-2 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    {sidebarOpen && <span className="whitespace-nowrap overflow-hidden">{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile at Bottom */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-semibold mx-auto">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}

        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* AI Chat Assistant */}
      <AIChatAssistant />
    </div>
  )
}
