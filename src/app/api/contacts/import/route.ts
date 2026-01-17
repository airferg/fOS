import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { executeAgent } from '@/lib/agents'

interface LinkedInCSVRow {
  'First Name': string
  'Last Name': string
  'Email Address'?: string
  Company: string
  Position: string
  'Connected On'?: string
  [key: string]: string | undefined
}

/**
 * Import contacts from LinkedIn CSV export
 * POST /api/contacts/import
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const useAI = formData.get('useAI') !== 'false' // Default to true

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Parse CSV file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 })
    }

    // Parse header to determine CSV format
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

    // Check if this is a LinkedIn export (has specific columns)
    const isLinkedInCSV = header.includes('First Name') && header.includes('Last Name')

    let parsedContacts: any[] = []
    let organizations: any[] = []
    let stats: any = {}

    if (isLinkedInCSV) {
      // Parse LinkedIn CSV format
      const csvData: LinkedInCSVRow[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        const row: any = {}

        header.forEach((key, index) => {
          row[key] = values[index] || ''
        })

        csvData.push(row as LinkedInCSVRow)
      }

      // Use AI agent to parse and enrich
      const result = await executeAgent('parse-linkedin-csv', {
        csvData,
        enrichWithAI: useAI
      }, user.id)

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse LinkedIn CSV')
      }

      parsedContacts = result.data.contacts
      organizations = result.data.organizations
      stats = result.data.stats
    } else {
      // Basic CSV format: name, email, role (backwards compatibility)
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        const [name, email, role] = values

        if (name && email) {
          parsedContacts.push({
            name: name.trim(),
            email: email.trim(),
            role: role?.trim() || null,
            position: role?.trim() || null,
            stage: 'contacted',
            tags: [],
            can_help_with: [],
            connection_strength: 'weak'
          })
        }
      }

      stats = {
        totalParsed: parsedContacts.length,
        withEmails: parsedContacts.filter(c => c.email).length,
        withoutEmails: parsedContacts.filter(c => !c.email).length
      }
    }

    // Insert organizations first
    const organizationMap = new Map<string, string>()
    if (organizations.length > 0) {
      const orgInserts = organizations.map(org => ({
        user_id: user.id,
        name: org.name,
        industry: org.industry
      }))

      const { data: insertedOrgs, error: orgError } = await supabase
        .from('organizations')
        .insert(orgInserts)
        .select('id, name')

      if (!orgError && insertedOrgs) {
        insertedOrgs.forEach(org => {
          organizationMap.set(org.name, org.id)
        })
      }
    }

    // Insert contacts
    const contactInserts = parsedContacts.map(contact => ({
      user_id: user.id,
      name: contact.name,
      email: contact.email || null,
      role: contact.position || contact.role || null,
      company: contact.company || null,
      position: contact.position || null,
      tags: contact.tags || [],
      stage: contact.stage || 'contacted',
      helpful_for: contact.helpful_for || null,
      can_help_with: contact.can_help_with || [],
      connection_strength: contact.connection_strength || 'weak',
      organization_id: contact.company ? organizationMap.get(contact.company) || null : null
    }))

    const { data: insertedContacts, error: contactError } = await supabase
      .from('contacts')
      .insert(contactInserts)
      .select('id, name')

    if (contactError) {
      throw contactError
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedContacts?.length || 0} contacts`,
      stats: {
        ...stats,
        contactsImported: insertedContacts?.length || 0,
        organizationsCreated: organizationMap.size
      }
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import contacts' },
      { status: 500 }
    )
  }
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}
