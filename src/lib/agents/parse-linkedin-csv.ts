import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'

interface LinkedInCSVRow {
  'First Name': string
  'Last Name': string
  'Email Address'?: string
  'Company': string
  'Position': string
  'Connected On'?: string
  [key: string]: string | undefined
}

interface ParsedContact {
  name: string
  email: string | null
  company: string | null
  position: string | null
  tags: string[]
  connection_strength: 'weak' | 'medium' | 'strong'
  stage: string
  can_help_with: string[]
  helpful_for: string
}

interface LinkedInCSVParseInput {
  csvData: LinkedInCSVRow[]
  enrichWithAI?: boolean
}

interface LinkedInCSVParseOutput {
  contacts: ParsedContact[]
  organizations: Array<{
    name: string
    industry: string | null
  }>
  stats: {
    totalParsed: number
    withEmails: number
    withoutEmails: number
    uniqueCompanies: number
  }
}

/**
 * Agent that parses LinkedIn CSV exports and enriches contact data with AI
 */
export class ParseLinkedInCSVAgent extends BaseAgent<LinkedInCSVParseInput, LinkedInCSVParseOutput> {
  id = 'parse-linkedin-csv'
  name = 'Parse LinkedIn Network'
  description = 'Import and enrich LinkedIn connections from CSV export'
  category = 'Network Management'
  icon = '💼'

  async execute(
    input: LinkedInCSVParseInput,
    userId: string
  ): Promise<AgentResponse<LinkedInCSVParseOutput>> {
    try {
      const { csvData, enrichWithAI = true } = input

      if (!csvData || csvData.length === 0) {
        return {
          success: false,
          error: 'No CSV data provided'
        }
      }

      // Get user context for better AI enrichment
      const context = await this.getUserContext(userId)
      const { profile } = context

      // Process contacts in batches for AI enrichment
      const batchSize = 20
      const enrichedContacts: ParsedContact[] = []
      const organizations = new Set<string>()
      let tokensUsed = 0

      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize)

        if (enrichWithAI) {
          // Use AI to enrich this batch
          const { contacts, tokens } = await this.enrichContactBatch(batch, profile)
          enrichedContacts.push(...contacts)
          tokensUsed += tokens
        } else {
          // Basic parsing without AI
          enrichedContacts.push(...batch.map(row => this.basicParse(row)))
        }

        // Collect unique organizations
        batch.forEach(row => {
          // Handle both 'Company' and 'Company' key variations
          const company = row.Company || row['Company'] || ''
          if (company && company.trim()) {
            organizations.add(company.trim())
          }
        })
      }

      // Generate organization suggestions
      const organizationList = await this.categorizeOrganizations(Array.from(organizations))
      tokensUsed += 200 // Estimate for organization categorization

      // Calculate stats
      const stats = {
        totalParsed: enrichedContacts.length,
        withEmails: enrichedContacts.filter(c => c.email).length,
        withoutEmails: enrichedContacts.filter(c => !c.email).length,
        uniqueCompanies: organizations.size
      }

      return {
        success: true,
        data: {
          contacts: enrichedContacts,
          organizations: organizationList,
          stats
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse LinkedIn CSV: ${error.message}`
      }
    }
  }

  /**
   * Basic parsing without AI enrichment
   */
  private basicParse(row: LinkedInCSVRow): ParsedContact {
    const name = `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim()
    
    // Handle both 'Company'/'Position' and 'Company'/'Position' key variations
    const company = row.Company || row['Company'] || ''
    const position = row.Position || row['Position'] || ''

    return {
      name: name || 'Unknown',
      email: row['Email Address'] || null,
      company: company.trim() || null,
      position: position.trim() || null,
      tags: [],
      connection_strength: 'weak',
      stage: 'contacted',
      can_help_with: [],
      helpful_for: ''
    }
  }

  /**
   * Enrich a batch of contacts using AI
   */
  private async enrichContactBatch(
    batch: LinkedInCSVRow[],
    profile: any
  ): Promise<{ contacts: ParsedContact[]; tokens: number }> {
    const systemPrompt = `You are an expert at analyzing professional networks and identifying how contacts can be helpful for early-stage founders.

Your task is to analyze a list of LinkedIn connections and provide enrichment data:
- Suggest relevant tags based on role and company
- Estimate connection strength (weak/medium/strong) based on role relevance
- Identify what they could help with
- Suggest appropriate stage

Context about the user:
- Goal: ${profile?.current_goal || 'Building a startup'}
- Stage: ${profile?.stage || 'Early stage'}
- Focus: ${profile?.focus_area || 'Technology'}

Return JSON with an array of enriched contacts.`

    const contactList = batch.map((row, idx) => ({
      id: idx,
      name: `${row['First Name']} ${row['Last Name']}`,
      company: row.Company || row['Company'] || '',
      position: row.Position || row['Position'] || ''
    }))

    const userPrompt = `Analyze these LinkedIn connections and enrich each with helpful metadata:

${JSON.stringify(contactList, null, 2)}

For each contact, return:
{
  "id": number,
  "tags": string[], // 2-4 relevant tags like "engineer", "investor", "designer", "marketing", "b2b", "b2c", etc
  "connection_strength": "weak"|"medium"|"strong", // Based on how relevant they are to ${profile?.current_goal}
  "stage": "contacted"|"engaged"|"active"|"champion", // Estimate based on role
  "can_help_with": string[], // What they could help with: "funding", "hiring", "product feedback", "intros", "technical advice", etc
  "helpful_for": string // One-sentence summary of why they're valuable (max 100 chars)
}

Return as JSON: { "contacts": [ /* enriched contacts */ ] }`

    try {
      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.5,
          maxTokens: 2000,
          responseFormat: 'json'
        }
      )

      const result = JSON.parse(content)
      const enrichedData = result.contacts || []

      // Merge AI enrichment with original data
      const contacts = batch.map((row, idx) => {
        const enrichment = enrichedData.find((e: any) => e.id === idx)
        const name = `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim()

        // Handle both 'Company'/'Position' and 'Company'/'Position' key variations
        const company = row.Company || row['Company'] || ''
        const position = row.Position || row['Position'] || ''

        return {
          name: name || 'Unknown',
          email: row['Email Address'] || null,
          company: company.trim() || null,
          position: position.trim() || null,
          tags: enrichment?.tags || [],
          connection_strength: enrichment?.connection_strength || 'weak',
          stage: enrichment?.stage || 'contacted',
          can_help_with: enrichment?.can_help_with || [],
          helpful_for: enrichment?.helpful_for || ''
        }
      })

      return { contacts, tokens: tokensUsed }
    } catch (error: any) {
      console.error('AI enrichment failed, falling back to basic parsing:', error)
      return {
        contacts: batch.map(row => this.basicParse(row)),
        tokens: 0
      }
    }
  }

  /**
   * Categorize organizations by industry
   */
  private async categorizeOrganizations(companies: string[]): Promise<Array<{ name: string; industry: string | null }>> {
    if (companies.length === 0) return []

    // For now, return companies without industry (could be enhanced with AI later)
    return companies.map(name => ({
      name,
      industry: null
    }))
  }
}

// Register the agent
agentRegistry.register(new ParseLinkedInCSVAgent())
