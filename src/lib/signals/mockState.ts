/**
 * Mock operating state for demo. Replace with real API data when available.
 */

import type { OperatingState } from './types'

const now = new Date()
const iso = now.toISOString()

export const mockOperatingState: OperatingState = {
  timestamp: iso,
  product: {
    milestones: [
      {
        id: 'm1',
        name: 'Beta launch',
        dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 1 week ago
        status: 'In Progress',
        ownerId: 'u1',
      },
      {
        id: 'm2',
        name: 'API v2',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Not Started',
        ownerId: 'u2',
      },
    ],
    roadmapItems: [
      { id: 'r1', title: 'User auth', status: 'Done', ownerId: 'u1', updatedAt: iso },
      { id: 'r2', title: 'Dashboard', status: 'In Progress', ownerId: 'u1', updatedAt: iso },
    ],
  },
  gtm: {
    leadsThisWeek: 12,
    leadsLastWeek: 22,
    campaigns: [
      { id: 'c1', name: 'LinkedIn', status: 'active', lastActivityAt: iso },
      { id: 'c2', name: 'Email', status: 'paused', lastActivityAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  team: {
    members: [
      { id: 'u1', name: 'Alex', workloadScore: 92 },
      { id: 'u2', name: 'Jordan', workloadScore: 65 },
      { id: 'u3', name: 'Sam', workloadScore: 45 },
    ],
    unassignedCount: 4,
  },
  funding: {
    runwayMonths: 8,
    runwayLastMonth: 11,
    investorFollowups: [
      {
        id: 'f1',
        investor: 'Acme Ventures',
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Pending',
      },
      {
        id: 'f2',
        investor: 'Seed Co',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Done',
      },
    ],
  },
  execution: {
    overdueTasks: 7,
    velocityThisWeek: 12,
    velocityLastWeek: 18,
  },
}
