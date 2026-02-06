/**
 * Rules engine: derive signals from operating state. Rule-based, no LLM.
 */

import type { OperatingState, Signal, SignalSeverity } from './types'

const RULE_ID_PREFIX = 'hydra-rule'

function createFingerprint(ruleId: string, ...parts: (string | number)[]): string {
  return [ruleId, ...parts].join('::')
}

function signal(
  ruleId: string,
  category: Signal['category'],
  title: string,
  evidence: string,
  recommendation: string,
  ctaLabel: string,
  ctaHref: string,
  severity: SignalSeverity,
  fingerprintParts: (string | number)[]
): Signal {
  const id = `${ruleId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const fingerprint = createFingerprint(ruleId, ...fingerprintParts)
  return {
    id,
    shortId: `SIG-${ruleId}`,
    category,
    title,
    evidence,
    recommendation,
    ctaLabel,
    ctaHref,
    severity,
    createdAt: new Date().toISOString(),
    fingerprint,
  }
}

export function runRules(state: OperatingState): Signal[] {
  const signals: Signal[] = []
  const today = new Date().toISOString().slice(0, 10)

  // 1) Runway dropped >= 2 months → action: update deck / notify
  const runwayDrop = state.funding.runwayLastMonth - state.funding.runwayMonths
  if (runwayDrop >= 2) {
    signals.push(
      signal(
        '1',
        'Funding',
        `Runway dropped ${runwayDrop} months. Update investor deck?`,
        `Runway ${state.funding.runwayLastMonth} → ${state.funding.runwayMonths} months.`,
        'Hydra recommends refreshing the deck and notifying investors.',
        'Update deck',
        '/funding',
        'High',
        [state.funding.runwayMonths, state.funding.runwayLastMonth]
      )
    )
  }

  // 2) Overdue tasks >= 5 → action: notify #product / sync
  if (state.execution.overdueTasks >= 5) {
    signals.push(
      signal(
        '2',
        'Execution',
        `${state.execution.overdueTasks} overdue tasks. Notify #product?`,
        `${state.execution.overdueTasks} tasks past due in Workspace.`,
        'Hydra can post a summary to #product or open the list.',
        'Notify #product',
        '/workspace',
        state.execution.overdueTasks >= 10 ? 'High' : 'Medium',
        [state.execution.overdueTasks]
      )
    )
  }

  // 3) Velocity dropped >= 25% WoW → action: notify / review
  const velocityPct =
    state.execution.velocityLastWeek > 0
      ? (state.execution.velocityThisWeek / state.execution.velocityLastWeek) * 100
      : 100
  if (state.execution.velocityLastWeek > 0 && velocityPct <= 75) {
    signals.push(
      signal(
        '3',
        'Execution',
        `Velocity down ${Math.round(100 - velocityPct)}% WoW. Notify #product?`,
        `${state.execution.velocityThisWeek} vs ${state.execution.velocityLastWeek} points last week.`,
        'Hydra can post a brief to #product or open the board.',
        'Notify #product',
        '/workspace',
        'Medium',
        [state.execution.velocityThisWeek, state.execution.velocityLastWeek]
      )
    )
  }

  // 4) Milestone overdue → action: reschedule / notify
  for (const m of state.product.milestones) {
    if (m.dueDate < today && m.status !== 'Done') {
      signals.push(
        signal(
          '4',
          'Product',
          `Milestone overdue: "${m.name}". Reschedule or notify?`,
          `Due ${m.dueDate}; status: ${m.status}.`,
          'Hydra can update JIRA or post to #product.',
          'Notify #product',
          '/research',
          'High',
          [m.id, m.dueDate]
        )
      )
      break
    }
  }

  // 5) Unassigned count >= 3 → action: assign / notify
  if (state.team.unassignedCount >= 3) {
    signals.push(
      signal(
        '5',
        'Team',
        `${state.team.unassignedCount} items unassigned. Assign owners?`,
        `${state.team.unassignedCount} tasks have no owner.`,
        'Hydra can suggest assignees or post to #team.',
        'Assign owners',
        '/team',
        'Medium',
        [state.team.unassignedCount]
      )
    )
  }

  // 6) Any member workload >= 85 → action: rebalance / notify
  const overloaded = state.team.members.find((m) => m.workloadScore >= 85)
  if (overloaded) {
    signals.push(
      signal(
        '6',
        'Team',
        `${overloaded.name} at ${overloaded.workloadScore}% workload. Rebalance or notify?`,
        `${overloaded.name} is over capacity.`,
        'Hydra can suggest reassignments or post to #team.',
        'Notify #team',
        '/team',
        'Medium',
        [overloaded.id, overloaded.workloadScore]
      )
    )
  }

  // 7) Leads down >= 30% WoW → action: review / notify
  const leadsPct =
    state.gtm.leadsLastWeek > 0
      ? (state.gtm.leadsThisWeek / state.gtm.leadsLastWeek) * 100
      : 100
  if (state.gtm.leadsLastWeek > 0 && leadsPct <= 70) {
    signals.push(
      signal(
        '7',
        'GTM',
        `Leads down ${Math.round(100 - leadsPct)}% WoW. Review campaigns?`,
        `${state.gtm.leadsThisWeek} vs ${state.gtm.leadsLastWeek} leads last week.`,
        'Hydra can surface top campaigns or notify #gtm.',
        'Notify #gtm',
        '/marketing',
        'Medium',
        [state.gtm.leadsThisWeek, state.gtm.leadsLastWeek]
      )
    )
  }

  // 8) Investor followup due within 3 days → action: send update
  const inThreeDays = new Date()
  inThreeDays.setDate(inThreeDays.getDate() + 3)
  const inThreeStr = inThreeDays.toISOString().slice(0, 10)
  for (const f of state.funding.investorFollowups) {
    if (f.status !== 'Done' && f.dueDate <= inThreeStr && f.dueDate >= today) {
      signals.push(
        signal(
          '8',
          'Funding',
          `Follow-up with ${f.investor} due ${f.dueDate}. Send update?`,
          `Investor: ${f.investor}; due ${f.dueDate}.`,
          'Hydra can draft a short update or add a calendar reminder.',
          'Send update',
          '/funding',
          'High',
          [f.id, f.dueDate]
        )
      )
      break
    }
  }

  return signals
}
