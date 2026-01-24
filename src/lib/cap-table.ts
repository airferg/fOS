/**
 * Cap Table Calculation System
 * 
 * This module provides proper cap table calculations that handle:
 * - Dilution when new investors are added
 * - Maintaining ownership percentages that always sum to 100%
 * - Tracking ownership over time
 * - Proper equity allocation
 */

export interface CapTableEntry {
  id: string
  type: 'founder' | 'team' | 'investor'
  name: string
  equityPercent: number
  shares?: number
  fullyDiluted?: boolean
}

export interface CapTableSnapshot {
  entries: CapTableEntry[]
  totalShares: number
  totalEquity: number
  timestamp: Date
}

export class CapTable {
  private entries: CapTableEntry[] = []
  private totalShares: number = 1000000 // Standard: 1M shares = 100%
  private sharesPerPercent: number = 10000 // 1% = 10,000 shares

  constructor(entries: CapTableEntry[] = []) {
    this.entries = entries.map(entry => ({ ...entry }))
    this.recalculate()
  }

  /**
   * Add a new entry to the cap table
   * This will dilute existing shareholders proportionally
   */
  addEntry(entry: Omit<CapTableEntry, 'shares'>): void {
    const newEquityPercent = entry.equityPercent

    if (newEquityPercent <= 0 || newEquityPercent > 100) {
      throw new Error(`Invalid equity percentage: ${newEquityPercent}%. Must be between 0 and 100.`)
    }

    // Calculate current total equity
    const currentTotal = this.entries.reduce((sum, e) => sum + e.equityPercent, 0)

    // Check if adding this entry would exceed 100%
    const projectedTotal = currentTotal * (100 - newEquityPercent) / 100 + newEquityPercent

    if (projectedTotal > 100.01) {
      throw new Error(
        `Cannot add ${newEquityPercent}% equity. ` +
        `Current total: ${currentTotal.toFixed(2)}%, ` +
        `Projected total: ${projectedTotal.toFixed(2)}%. ` +
        `Maximum allowed: 100%.`
      )
    }

    // Dilute existing shareholders
    if (currentTotal > 0) {
      const dilutionFactor = (100 - newEquityPercent) / 100
      this.entries.forEach(entry => {
        entry.equityPercent = Math.round(entry.equityPercent * dilutionFactor * 100) / 100
        entry.shares = Math.round(entry.equityPercent * this.sharesPerPercent)
      })
    }

    // Add new entry
    const newEntry: CapTableEntry = {
      ...entry,
      shares: Math.round(newEquityPercent * this.sharesPerPercent),
    }

    this.entries.push(newEntry)
    this.recalculate()
  }

  /**
   * Update an existing entry's equity percentage
   * This will adjust all other entries proportionally
   */
  updateEntry(id: string, newEquityPercent: number): void {
    const entryIndex = this.entries.findIndex(e => e.id === id)
    if (entryIndex === -1) {
      throw new Error(`Entry with id ${id} not found`)
    }

    const oldEquityPercent = this.entries[entryIndex].equityPercent
    const delta = newEquityPercent - oldEquityPercent

    if (newEquityPercent < 0 || newEquityPercent > 100) {
      throw new Error(`Invalid equity percentage: ${newEquityPercent}%`)
    }

    // Calculate current total (excluding the entry being updated)
    const otherEntriesTotal = this.entries.reduce(
      (sum, e, idx) => idx === entryIndex ? sum : sum + e.equityPercent,
      0
    )

    const projectedTotal = otherEntriesTotal + newEquityPercent

    if (projectedTotal > 100.01) {
      throw new Error(
        `Cannot set equity to ${newEquityPercent}%. ` +
        `Other entries total: ${otherEntriesTotal.toFixed(2)}%, ` +
        `Projected total: ${projectedTotal.toFixed(2)}%. ` +
        `Maximum allowed: ${(100 - otherEntriesTotal).toFixed(2)}%.`
      )
    }

    // If increasing, dilute others; if decreasing, increase others proportionally
    if (delta > 0) {
      // Dilute others
      const dilutionFactor = (100 - newEquityPercent) / (100 - oldEquityPercent)
      this.entries.forEach((e, idx) => {
        if (idx !== entryIndex) {
          e.equityPercent = Math.round(e.equityPercent * dilutionFactor * 100) / 100
          e.shares = Math.round(e.equityPercent * this.sharesPerPercent)
        }
      })
    } else if (delta < 0) {
      // Increase others proportionally
      const increaseFactor = (100 - newEquityPercent) / (100 - oldEquityPercent)
      this.entries.forEach((e, idx) => {
        if (idx !== entryIndex) {
          e.equityPercent = Math.round(e.equityPercent * increaseFactor * 100) / 100
          e.shares = Math.round(e.equityPercent * this.sharesPerPercent)
        }
      })
    }

    // Update the entry
    this.entries[entryIndex].equityPercent = newEquityPercent
    this.entries[entryIndex].shares = Math.round(newEquityPercent * this.sharesPerPercent)

    this.recalculate()
  }

  /**
   * Remove an entry and redistribute its equity proportionally
   */
  removeEntry(id: string): void {
    const entryIndex = this.entries.findIndex(e => e.id === id)
    if (entryIndex === -1) {
      throw new Error(`Entry with id ${id} not found`)
    }

    const removedEquity = this.entries[entryIndex].equityPercent
    this.entries.splice(entryIndex, 1)

    // Redistribute removed equity proportionally among remaining entries
    if (this.entries.length > 0 && removedEquity > 0) {
      const remainingTotal = this.entries.reduce((sum, e) => sum + e.equityPercent, 0)
      if (remainingTotal > 0) {
        const redistributionFactor = (remainingTotal + removedEquity) / remainingTotal
        this.entries.forEach(entry => {
          entry.equityPercent = Math.round(entry.equityPercent * redistributionFactor * 100) / 100
          entry.shares = Math.round(entry.equityPercent * this.sharesPerPercent)
        })
      }
    }

    this.recalculate()
  }

  /**
   * Recalculate and normalize all equity percentages
   * Ensures they sum to exactly 100%
   */
  recalculate(): void {
    const currentTotal = this.entries.reduce((sum, e) => sum + e.equityPercent, 0)

    if (currentTotal > 0 && Math.abs(currentTotal - 100) > 0.01) {
      // Normalize to 100%
      const scaleFactor = 100 / currentTotal
      this.entries.forEach(entry => {
        entry.equityPercent = Math.round(entry.equityPercent * scaleFactor * 100) / 100
        entry.shares = Math.round(entry.equityPercent * this.sharesPerPercent)
      })
    }

    // Update shares for all entries
    this.entries.forEach(entry => {
      if (!entry.shares) {
        entry.shares = Math.round(entry.equityPercent * this.sharesPerPercent)
      }
    })
  }

  /**
   * Get current snapshot of the cap table
   */
  getSnapshot(): CapTableSnapshot {
    const totalEquity = this.entries.reduce((sum, e) => sum + e.equityPercent, 0)
    const totalShares = this.entries.reduce((sum, e) => sum + (e.shares || 0), 0)

    return {
      entries: this.entries.map(e => ({ ...e })),
      totalShares,
      totalEquity: Math.round(totalEquity * 100) / 100,
      timestamp: new Date(),
    }
  }

  /**
   * Get entries by type
   */
  getEntriesByType(type: CapTableEntry['type']): CapTableEntry[] {
    return this.entries.filter(e => e.type === type)
  }

  /**
   * Get total equity by type
   */
  getTotalEquityByType(type: CapTableEntry['type']): number {
    return this.entries
      .filter(e => e.type === type)
      .reduce((sum, e) => sum + e.equityPercent, 0)
  }

  /**
   * Validate that all equity percentages sum to 100%
   */
  validate(): { valid: boolean; total: number; error?: string } {
    const total = this.entries.reduce((sum, e) => sum + e.equityPercent, 0)
    const diff = Math.abs(total - 100)

    if (diff > 0.01) {
      return {
        valid: false,
        total: Math.round(total * 100) / 100,
        error: `Cap table is invalid: Total equity is ${total.toFixed(2)}%, expected 100%`,
      }
    }

    return { valid: true, total: 100 }
  }

  /**
   * Get all entries
   */
  getEntries(): CapTableEntry[] {
    return this.entries.map(e => ({ ...e }))
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = []
    this.recalculate()
  }
}

/**
 * Helper function to create a cap table from database data
 * This loads existing data without triggering dilution
 */
export function createCapTableFromData(
  teamMembers: Array<{ id: string; name: string; role: string; equity_percent: number }>,
  investors: Array<{ id: string; name: string; equity_percent: number }>
): CapTable {
  const entries: CapTableEntry[] = []

  // Add founders and team members directly (no dilution)
  teamMembers.forEach(member => {
    const type = member.role === 'Founder' || member.role === 'Co-Founder' ? 'founder' : 'team'
    const equityPercent = Number(member.equity_percent) || 0
    entries.push({
      id: member.id,
      type,
      name: member.name,
      equityPercent,
      shares: Math.round(equityPercent * 10000), // 1% = 10,000 shares
    })
  })

  // Add investors directly (no dilution)
  investors.forEach(investor => {
    const equityPercent = Number(investor.equity_percent) || 0
    entries.push({
      id: investor.id,
      type: 'investor',
      name: investor.name,
      equityPercent,
      shares: Math.round(equityPercent * 10000),
    })
  })

  // Create cap table with existing entries
  const capTable = new CapTable(entries)

  // Recalculate to ensure everything is normalized
  capTable.recalculate()

  return capTable
}
