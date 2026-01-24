'use client'

import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  subtitle?: string
  icon?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
}

export default function DashboardCard({
  title,
  subtitle,
  icon,
  children,
  className = '',
  actions,
  trend,
}: DashboardCardProps) {
  return (
    <div
      className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <h3 className="text-base font-semibold text-black dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {trend.label}
                </span>
              )}
            </div>
          )}
          {actions}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">{children}</div>
    </div>
  )
}

// Stat Card Component (for KPI metrics)
interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {label}
          </p>
          <p className="text-3xl font-bold text-black dark:text-white mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={`text-sm font-medium ${
              trend.isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            vs last period
          </span>
        </div>
      )}
    </div>
  )
}
